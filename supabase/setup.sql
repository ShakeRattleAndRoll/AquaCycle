-- Run once in Supabase Dashboard > SQL Editor for this project.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  email text not null,
  full_name text not null default '',
  phone text not null default '',
  address text not null default '',
  role text not null default 'customer' check (role in ('customer', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists email text;

-- Existing accounts from an earlier setup receive a stable, unique username.
update public.profiles p
set email = u.email,
    username = lower(coalesce(nullif(left(regexp_replace(split_part(coalesce(u.email, ''), '@', 1), '[^a-zA-Z0-9_]', '', 'g'), 16), ''), 'user')
      || '_' || left(replace(u.id::text, '-', ''), 6))
from auth.users u
where p.id = u.id and (p.username is null or p.email is null);

insert into public.profiles (id, username, email, full_name, phone, address)
select
  u.id,
  lower(coalesce(nullif(left(regexp_replace(split_part(coalesce(u.email, ''), '@', 1), '[^a-zA-Z0-9_]', '', 'g'), 16), ''), 'user')
    || '_' || left(replace(u.id::text, '-', ''), 6)),
  lower(u.email),
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.raw_user_meta_data ->> 'phone', ''),
  coalesce(u.raw_user_meta_data ->> 'address', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

create unique index if not exists profiles_username_unique on public.profiles (lower(username));
alter table public.profiles alter column username set not null;
alter table public.profiles alter column email set not null;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_username_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check
      check (username ~ '^[a-z0-9_]{3,24}$');
  end if;
end;
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  customer_name text not null default 'Customer',
  service_name text not null,
  quantity numeric(8, 2) not null check (quantity > 0),
  quantity_unit text not null check (quantity_unit in ('kg', 'item')),
  address text not null,
  notes text,
  pickup_delivery boolean not null default true,
  estimated_total numeric(10, 2) not null check (estimated_total >= 0),
  status text not null default 'received'
    check (status in ('received', 'washing', 'drying', 'ready', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_service_price_check check (
    service_name in ('Wash & Fold', 'Ironing', 'Dry Cleaning', 'Wash & Iron')
    and quantity_unit = case when service_name = 'Dry Cleaning' then 'item' else 'kg' end
    and estimated_total = round(quantity * case service_name
      when 'Wash & Fold' then 45
      when 'Ironing' then 35
      when 'Dry Cleaning' then 120
      when 'Wash & Iron' then 65
    end, 2)
  )
);

alter table public.orders add column if not exists customer_name text not null default 'Customer';

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);
create index if not exists orders_status_created_idx
  on public.orders (status, created_at desc);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, address) on public.profiles to authenticated;
revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
grant insert (user_id, customer_name, service_name, quantity, quantity_unit, address, notes, pickup_delivery, estimated_total)
  on public.orders to authenticated;
grant update (status) on public.orders to authenticated;

drop policy if exists "Profiles are readable by their owner" on public.profiles;
create policy "Profiles are readable by their owner"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Owners can update their profile details" on public.profiles;
create policy "Owners can update their profile details"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Customers can read their orders" on public.orders;
create policy "Customers can read their orders"
  on public.orders for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'staff'
    )
  );

drop policy if exists "Customers can create their own orders" on public.orders;
create policy "Customers can create their own orders"
  on public.orders for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Staff can update orders" on public.orders;
create policy "Staff can update orders"
  on public.orders for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'staff'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'staff'
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, email, full_name, phone, address)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'address', '')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Promote a staff user from the Dashboard SQL Editor after they have signed up:
-- update public.profiles set role = 'staff' where id = (select id from auth.users where email = 'staff@example.com');
