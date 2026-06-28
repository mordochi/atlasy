create or replace function create_animal_with_photo(
  p_name text,
  p_species_id text,
  p_lat double precision,
  p_lng double precision,
  p_photo_url text default null,
  p_color text default null,
  p_description text default null,
  p_age integer default null,
  p_gender text default null,
  p_personality_ids text[] default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_animal_id uuid;
begin
  insert into animals (user_id, name, species_id, lat, lng, thumbnail_url, color, description, age, gender, personality_ids)
  values (auth.uid(), p_name, p_species_id, p_lat, p_lng, p_photo_url, p_color, p_description, p_age, p_gender, p_personality_ids)
  returning id into v_animal_id;

  if p_photo_url is not null then
    insert into animal_photos (animal_id, url, thumbnail_url, is_primary)
    values (v_animal_id, p_photo_url, p_photo_url, true);
  end if;

  return v_animal_id;
end;
$$;

grant execute on function create_animal_with_photo to authenticated;
