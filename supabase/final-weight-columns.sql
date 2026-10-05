-- Run once in Supabase Dashboard > SQL Editor to enable staff weight finalization.
alter table public.orders
  add column if not exists final_quantity numeric(8, 2) check (final_quantity > 0),
  add column if not exists final_total numeric(10, 2) check (final_total >= 0),
  add column if not exists delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  add column if not exists completed_at timestamptz;

grant insert (delivery_fee) on public.orders to authenticated;

-- Per-service price and unit checks live in order_services after running
-- multi-service-orders.sql. The parent order total sums those service rows.
alter table public.orders drop constraint if exists orders_service_price_check;

grant update (status, final_quantity, final_total, address, notes, service_name, quantity_unit, estimated_total, pickup_delivery, delivery_fee, completed_at) on public.orders to authenticated;

alter table public.orders enable row level security;
drop policy if exists "Staff can update orders" on public.orders;
create policy "Staff can update orders"
  on public.orders for update to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'staff'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'staff'
  ));
