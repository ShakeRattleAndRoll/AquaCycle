-- Apply once in Supabase Dashboard > SQL Editor.
-- Keep one orders row per checkout and store each selected service underneath it.

alter table public.orders
  add column if not exists final_quantity numeric(8, 2) check (final_quantity > 0),
  add column if not exists final_total numeric(10, 2) check (final_total >= 0),
  add column if not exists delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  add column if not exists completed_at timestamptz;

alter table public.orders drop constraint if exists orders_service_price_check;

create table if not exists public.order_services (
  order_id uuid not null references public.orders (id) on delete cascade,
  service_name text not null check (service_name in ('Wash & Fold', 'Ironing', 'Dry Cleaning', 'Wash & Iron', 'Self Service')),
  quantity numeric(8, 2) not null default 1 check (quantity > 0),
  quantity_unit text not null check (quantity_unit in ('kg', 'item')),
  estimated_total numeric(10, 2) not null check (estimated_total >= 0),
  final_quantity numeric(8, 2) check (final_quantity > 0),
  final_total numeric(10, 2) check (final_total >= 0),
  created_at timestamptz not null default now(),
  primary key (order_id, service_name),
  constraint order_services_unit_check check (
    quantity_unit = case when service_name = 'Dry Cleaning' then 'item' else 'kg' end
  ),
  constraint order_services_price_check check (
    estimated_total = case
      when service_name = 'Ironing' then 35
      else round(quantity * case service_name
        when 'Wash & Fold' then 45
        when 'Ironing' then 35
        when 'Dry Cleaning' then 120
        when 'Wash & Iron' then 65
        when 'Self Service' then 65
      end, 2)
    end
  )
);

insert into public.order_services (
  order_id, service_name, quantity, quantity_unit, estimated_total, final_quantity, final_total
)
select
  id,
  service_name,
  quantity,
  quantity_unit,
  case when service_name = 'Ironing' then 35 else estimated_total end,
  case when service_name = 'Ironing' then null else final_quantity end,
  case
    when final_total is null then null
    when service_name = 'Ironing' then 35
    else greatest(final_total - delivery_fee, 0)
  end
from public.orders
where service_name in ('Wash & Fold', 'Ironing', 'Dry Cleaning', 'Wash & Iron', 'Self Service')
on conflict (order_id, service_name) do nothing;

alter table public.order_services enable row level security;
revoke all on public.order_services from anon, authenticated;
grant select on public.order_services to authenticated;
grant insert (order_id, service_name, quantity, quantity_unit, estimated_total)
  on public.order_services to authenticated;
grant update (quantity, quantity_unit, estimated_total, final_quantity, final_total)
  on public.order_services to authenticated;
grant delete on public.order_services to authenticated;

drop policy if exists "Customers and staff can read order services" on public.order_services;
create policy "Customers and staff can read order services"
  on public.order_services for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = (select auth.uid()) or exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid()) and p.role = 'staff'
      ))
  ));

drop policy if exists "Order owners can add services" on public.order_services;
create policy "Order owners can add services"
  on public.order_services for insert to authenticated
  with check (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = (select auth.uid())
  ));

drop policy if exists "Staff can manage order services" on public.order_services;
create policy "Staff can manage order services"
  on public.order_services for all to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'staff'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'staff'
  ));

create or replace function public.create_order_with_services(
  p_customer_name text,
  p_address text,
  p_notes text,
  p_pickup_delivery boolean,
  p_service_names text[]
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order_id uuid;
  v_total numeric(10, 2);
  v_unit text;
begin
  if auth.uid() is null then
    raise exception 'Sign in before creating an order.';
  end if;
  if coalesce(cardinality(p_service_names), 0) = 0 then
    raise exception 'Choose at least one service.';
  end if;
  if exists (
    select 1 from unnest(p_service_names) as selected(name)
    where selected.name not in ('Wash & Fold', 'Ironing', 'Dry Cleaning', 'Wash & Iron', 'Self Service')
  ) then
    raise exception 'One or more selected services are invalid.';
  end if;
  if (select count(distinct selected.name) from unnest(p_service_names) as selected(name)) <> cardinality(p_service_names) then
    raise exception 'A service can only be selected once.';
  end if;

  v_total := (
    select sum(case selected.name
      when 'Wash & Fold' then 45
      when 'Ironing' then 35
      when 'Dry Cleaning' then 120
      when 'Wash & Iron' then 65
      when 'Self Service' then 65
    end)
    from unnest(p_service_names) as selected(name)
  );
  v_unit := case when p_service_names[1] = 'Dry Cleaning' then 'item' else 'kg' end;

  insert into public.orders (
    user_id, customer_name, service_name, quantity, quantity_unit, address,
    notes, pickup_delivery, delivery_fee, estimated_total
  ) values (
    auth.uid(), coalesce(nullif(trim(p_customer_name), ''), 'Customer'),
    array_to_string(p_service_names, ', '), 1, v_unit, trim(p_address),
    nullif(trim(p_notes), ''), p_pickup_delivery, case when p_pickup_delivery then 10 else 0 end, v_total
  ) returning id into v_order_id;

  insert into public.order_services (order_id, service_name, quantity, quantity_unit, estimated_total)
  select
    v_order_id,
    selected.name,
    1,
    case when selected.name = 'Dry Cleaning' then 'item' else 'kg' end,
    case selected.name
      when 'Wash & Fold' then 45
      when 'Ironing' then 35
      when 'Dry Cleaning' then 120
      when 'Wash & Iron' then 65
      when 'Self Service' then 65
    end
  from unnest(p_service_names) as selected(name);

  return v_order_id;
end;
$$;

revoke all on function public.create_order_with_services(text, text, text, boolean, text[]) from public, anon;
grant execute on function public.create_order_with_services(text, text, text, boolean, text[]) to authenticated;
