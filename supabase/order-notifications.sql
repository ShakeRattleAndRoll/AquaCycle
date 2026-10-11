-- Run in Supabase SQL Editor to align the app with the existing order notification trigger.
-- The trigger orders_create_notifications already sends events to staff and customers.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  order_id uuid references public.orders (id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- CREATE TABLE IF NOT EXISTS does not repair an existing notifications table.
alter table public.notifications
  add column if not exists recipient_id uuid references public.profiles (id) on delete cascade,
  add column if not exists order_id uuid references public.orders (id) on delete cascade,
  add column if not exists notification_type text,
  add column if not exists title text,
  add column if not exists message text,
  add column if not exists read_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

-- Keep read state when upgrading a database created with the older boolean field.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'is_read'
  ) then
    execute 'update public.notifications set read_at = coalesce(read_at, created_at) where is_read and read_at is null';
  end if;
end;
$$;

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

drop policy if exists "Customers can read their notifications" on public.notifications;
drop policy if exists "Customers can mark their notifications read" on public.notifications;
drop policy if exists "Staff can create notifications for order owners" on public.notifications;
drop policy if exists "Recipients can read their notifications" on public.notifications;
create policy "Recipients can read their notifications"
  on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));

drop policy if exists "Recipients can mark their notifications read" on public.notifications;
create policy "Recipients can mark their notifications read"
  on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

-- Remove the duplicate trigger from the earlier version of this script.
drop trigger if exists orders_notify_customer_status on public.orders;
drop function if exists public.notify_customer_order_status_change();
