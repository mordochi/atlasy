-- anon：只讀
grant select on species to anon;
grant select on personalities to anon;
grant select on animals to anon;
grant select on animal_photos to anon;
grant select on sightings to anon;
grant select on duplicate_reports to anon;

-- authenticated：讀 + 寫
grant select, insert, update, delete on animals to authenticated;
grant select, insert, delete on animal_photos to authenticated;
grant select on species to authenticated;
grant select on personalities to authenticated;
grant select, insert on sightings to authenticated;
grant select, insert on duplicate_reports to authenticated;
