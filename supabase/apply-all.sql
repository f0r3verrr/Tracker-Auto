-- =========================================================
-- Car tracker: initial schema
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- cars
-- ---------------------------------------------------------
create table if not exists cars (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- источник
  title text not null,
  url text,
  platform text,
  seller_contact text,

  -- цена
  price numeric,
  price_history jsonb default '[]'::jsonb,

  -- владение
  year int,
  mileage int,
  owners_count int,
  tax numeric,
  condition text,
  pts text,
  customs text,
  exchange text,
  plate_number text,

  -- характеристики
  trim text,
  engine text,
  transmission text,
  drive_type text,
  wheel text,
  body_type text,
  color text,

  -- история / проверка
  vin text,
  owners_from_report int,
  had_accidents boolean,
  taxi_carsharing boolean,
  pledge_restrictions boolean,
  report_links jsonb default '[]'::jsonb,
  report_files jsonb default '[]'::jsonb,
  report_cost numeric,

  -- оценка и статус
  status text default 'new',
  rating_overall int,
  rating_price int,
  rating_condition int,
  rating_honesty int,
  rating_seller_trust int,

  -- калькулятор реальной стоимости
  repair_cost_estimate numeric,

  -- прочее
  tags text[] default '{}',
  comments jsonb default '[]'::jsonb,
  next_contact_date date,
  archived boolean default false,
  photos jsonb default '[]'::jsonb
);

create index if not exists cars_status_idx on cars (status);
create index if not exists cars_platform_idx on cars (platform);
create index if not exists cars_archived_idx on cars (archived);
create index if not exists cars_vin_idx on cars (vin);
create index if not exists cars_plate_idx on cars (plate_number);

-- ---------------------------------------------------------
-- activity_log
-- ---------------------------------------------------------
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  car_id uuid references cars(id) on delete cascade,
  created_at timestamptz default now(),
  event_type text,
  details jsonb
);

create index if not exists activity_log_car_idx on activity_log (car_id, created_at desc);

-- ---------------------------------------------------------
-- reviews
-- ---------------------------------------------------------
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  car_id uuid references cars(id) on delete cascade,
  reviewer_id uuid not null,
  reviewer_name text not null,
  rating int,
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  owner_seen boolean default false
);

create index if not exists reviews_car_idx on reviews (car_id);

-- =========================================================
-- Триггеры
-- =========================================================

create or replace function touch_updated_at() returns trigger as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$ language plpgsql;

drop trigger if exists cars_touch_updated_at on cars;
create trigger cars_touch_updated_at before update on cars
  for each row execute function touch_updated_at();

drop trigger if exists reviews_touch_updated_at on reviews;
create trigger reviews_touch_updated_at before update on reviews
  for each row execute function touch_updated_at();

-- лог создания карточки
create or replace function log_car_created() returns trigger as $fn$
begin
  insert into activity_log (car_id, event_type, details)
  values (new.id, 'created', jsonb_build_object('title', new.title, 'price', new.price));
  return new;
end;
$fn$ language plpgsql security definer;

drop trigger if exists cars_log_created on cars;
create trigger cars_log_created after insert on cars
  for each row execute function log_car_created();

-- история цены + лог смены цены/статуса
create or replace function log_car_changes() returns trigger as $fn$
begin
  if new.price is distinct from old.price then
    new.price_history = coalesce(old.price_history, '[]'::jsonb) || jsonb_build_object(
      'date', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SSOF'),
      'price', new.price
    );
    insert into activity_log (car_id, event_type, details)
    values (new.id, 'price_change', jsonb_build_object('from', old.price, 'to', new.price));
  end if;

  if new.status is distinct from old.status then
    insert into activity_log (car_id, event_type, details)
    values (new.id, 'status_change', jsonb_build_object('from', old.status, 'to', new.status));
  end if;

  return new;
end;
$fn$ language plpgsql security definer;

drop trigger if exists cars_log_changes on cars;
create trigger cars_log_changes before update on cars
  for each row execute function log_car_changes();

-- =========================================================
-- RLS
-- =========================================================
alter table cars enable row level security;
alter table activity_log enable row level security;
alter table reviews enable row level security;

-- cars: читают все, пишет только владелец
drop policy if exists cars_select_all on cars;
create policy cars_select_all on cars for select to anon, authenticated using (true);

drop policy if exists cars_insert_owner on cars;
create policy cars_insert_owner on cars for insert to authenticated with check (true);

drop policy if exists cars_update_owner on cars;
create policy cars_update_owner on cars for update to authenticated using (true) with check (true);

drop policy if exists cars_delete_owner on cars;
create policy cars_delete_owner on cars for delete to authenticated using (true);

-- activity_log: читают все, пишет владелец (плюс триггеры security definer)
drop policy if exists activity_select_all on activity_log;
create policy activity_select_all on activity_log for select to anon, authenticated using (true);

drop policy if exists activity_insert_owner on activity_log;
create policy activity_insert_owner on activity_log for insert to authenticated with check (true);

-- reviews: читают все; гость пишет свой отзыв и правит только его.
-- Опознание гостя — по заголовку x-reviewer-id.
-- Не криптостойко: для семейного некоммерческого использования этого достаточно.
create or replace function current_reviewer_id() returns text as $fn$
  select nullif(current_setting('request.headers', true)::json ->> 'x-reviewer-id', '');
$fn$ language sql stable;

drop policy if exists reviews_select_all on reviews;
create policy reviews_select_all on reviews for select to anon, authenticated using (true);

drop policy if exists reviews_insert_guest on reviews;
create policy reviews_insert_guest on reviews for insert to anon, authenticated
  with check (reviewer_id::text = current_reviewer_id());

drop policy if exists reviews_update_own on reviews;
create policy reviews_update_own on reviews for update to anon
  using (reviewer_id::text = current_reviewer_id())
  with check (reviewer_id::text = current_reviewer_id());

drop policy if exists reviews_delete_own on reviews;
create policy reviews_delete_own on reviews for delete to anon
  using (reviewer_id::text = current_reviewer_id());

-- владелец может править отзывы (в т.ч. owner_seen)
drop policy if exists reviews_update_owner on reviews;
create policy reviews_update_owner on reviews for update to authenticated
  using (true) with check (true);

drop policy if exists reviews_delete_owner on reviews;
create policy reviews_delete_owner on reviews for delete to authenticated using (true);
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
