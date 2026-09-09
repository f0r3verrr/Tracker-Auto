-- =========================================================
-- Storage: бакеты car-photos (публичное чтение) и car-reports (приватный)
-- =========================================================

insert into storage.buckets (id, name, public)
values ('car-photos', 'car-photos', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('car-reports', 'car-reports', false)
on conflict (id) do update set public = false;

-- ---- car-photos: читают все, пишет владелец ----
drop policy if exists "photos read" on storage.objects;
create policy "photos read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'car-photos');

drop policy if exists "photos write" on storage.objects;
create policy "photos write" on storage.objects for insert to authenticated
  with check (bucket_id = 'car-photos');

drop policy if exists "photos update" on storage.objects;
create policy "photos update" on storage.objects for update to authenticated
  using (bucket_id = 'car-photos') with check (bucket_id = 'car-photos');

drop policy if exists "photos delete" on storage.objects;
create policy "photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'car-photos');

-- ---- car-reports: только владелец, доступ через signed URL ----
drop policy if exists "reports read" on storage.objects;
create policy "reports read" on storage.objects for select to authenticated
  using (bucket_id = 'car-reports');

drop policy if exists "reports write" on storage.objects;
create policy "reports write" on storage.objects for insert to authenticated
  with check (bucket_id = 'car-reports');

drop policy if exists "reports delete" on storage.objects;
create policy "reports delete" on storage.objects for delete to authenticated
  using (bucket_id = 'car-reports');
