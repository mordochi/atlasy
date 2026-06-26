-- 啟用 PostGIS
create extension if not exists postgis;

-- Species 固定標籤
create table species (
  id text primary key,
  name_en text not null,
  emoji text
);

insert into species (id, name_en, emoji) values
  ('cat', 'Cat', '🐱'),
  ('dog', 'Dog', '🐶'),
  ('bird', 'Bird', '🐦'),
  ('rabbit', 'Rabbit', '🐰'),
  ('squirrel', 'Squirrel', '🐿️'),
  ('turtle', 'Turtle', '🐢'),
  ('other', 'Other', '🐾');

-- Personality 固定標籤（reference only，實際資料存在 animals.personality_ids）
create table personalities (
  id text primary key,
  name_en text not null,
  emoji text
);

insert into personalities (id, name_en, emoji) values
  ('friendly', 'Friendly', '😊'),
  ('shy', 'Shy', '🫣'),
  ('playful', 'Playful', '🎾'),
  ('lazy', 'Lazy', '😴'),
  ('aggressive', 'Aggressive', '😾'),
  ('foodie', 'Foodie', '🍗'),
  ('vocal', 'Vocal', '📢'),
  ('photogenic', 'Photogenic', '📸'),
  ('sleepy', 'Sleepy', '💤'),
  ('curious', 'Curious', '🔍'),
  ('boss', 'Boss', '😎'),
  ('fluffy', 'Fluffy', '☁️'),
  ('chonky', 'Chonky', '🍑');

-- 動物表
create table animals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  species_id text references species(id) default 'cat',
  lat double precision not null,
  lng double precision not null,
  location geography(point, 4326),
  thumbnail_url text,
  color text,
  personality_ids text[],
  description text,
  age integer,
  gender text check (gender in ('male', 'female', 'unknown')),
  status text default 'active' check (status in ('active', 'flagged', 'merged')),
  created_at timestamptz default now()
);

-- 動物照片表（支援多張）
create table animal_photos (
  id uuid default gen_random_uuid() primary key,
  animal_id uuid references animals(id) on delete cascade,
  url text not null,
  thumbnail_url text not null,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- 目擊回報表
create table sightings (
  id uuid default gen_random_uuid() primary key,
  animal_id uuid references animals(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  seen_at timestamptz default now(),
  seen_date date not null default current_date,
  unique (animal_id, user_id, seen_date)
);

-- 重複回報表
create table duplicate_reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references auth.users(id) on delete cascade,
  animal_id uuid references animals(id) on delete cascade,
  duplicate_of uuid references animals(id) on delete cascade,
  created_at timestamptz default now(),
  unique (reporter_id, animal_id)
);

-- 自動更新 location 欄位
create or replace function update_location()
returns trigger as $$
begin
  new.location = st_point(new.lng, new.lat)::geography;
  return new;
end;
$$ language plpgsql;

create trigger set_location
before insert or update on animals
for each row execute function update_location();

-- 重複回報達 3 次自動變 flagged
create or replace function check_duplicate_reports()
returns trigger as $$
begin
  if (
    select count(*) from duplicate_reports
    where animal_id = new.animal_id
  ) >= 3 then
    update animals set status = 'flagged' where id = new.animal_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger auto_flag_animal
after insert on duplicate_reports
for each row execute function check_duplicate_reports();

-- RLS
alter table species enable row level security;
alter table personalities enable row level security;
alter table animals enable row level security;
alter table animal_photos enable row level security;
alter table sightings enable row level security;
alter table duplicate_reports enable row level security;

-- Species：所有人可讀
create policy "Anyone can read species"
on species for select using (true);

-- Personalities：所有人可讀
create policy "Anyone can read personalities"
on personalities for select using (true);

-- Animals：所有人可讀（merged 不顯示）
create policy "Anyone can read animals"
on animals for select using (status in ('active', 'flagged'));

create policy "Authenticated users can insert animals"
on animals for insert with check (auth.uid() = user_id);

create policy "Users can update own animals"
on animals for update using (auth.uid() = user_id);

create policy "Users can delete own animals"
on animals for delete using (auth.uid() = user_id);

-- Animal photos
create policy "Anyone can read animal_photos"
on animal_photos for select using (true);

create policy "Users can insert photos for own animals"
on animal_photos for insert with check (
  exists (
    select 1 from animals
    where animals.id = animal_id
    and animals.user_id = auth.uid()
  )
);

create policy "Users can delete own animal photos"
on animal_photos for delete using (
  exists (
    select 1 from animals
    where animals.id = animal_id
    and animals.user_id = auth.uid()
  )
);

-- Sightings：所有人可讀，登入才能新增
create policy "Anyone can read sightings"
on sightings for select using (true);

create policy "Authenticated users can insert sightings"
on sightings for insert with check (auth.uid() = user_id);

-- Duplicate reports
create policy "Anyone can read duplicate_reports"
on duplicate_reports for select using (true);

create policy "Authenticated users can insert duplicate_reports"
on duplicate_reports for insert with check (auth.uid() = reporter_id);
