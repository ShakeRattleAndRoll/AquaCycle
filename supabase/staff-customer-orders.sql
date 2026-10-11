
-- Run after setup.sql, multi-service-orders.sql,
-- and payment-methods.sql.

drop function if exists public.search_customers_for_staff(text);

create or replace function public.search_customers_for_staff(
  p_search text
)
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  address text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'staff'
  ) then
    raise exception 'Only staff can search for customers.';
  end if;

  if length(trim(coalesce(p_search, ''))) < 2 then
    return;
  end if;

  return query
  select
    p.id,
    coalesce(p.full_name, ''),
    coalesce(p.email, ''),
    coalesce(p.phone, ''),
    coalesce(p.address, '')
  from public.profiles p
  where p.role = 'customer'
    and (
      p.full_name ilike '%' || trim(p_search) || '%'
      or p.email ilike '%' || trim(p_search) || '%'
      or p.phone ilike '%' || trim(p_search) || '%'
      or p.username ilike '%' || trim(p_search) || '%'
    )
  order by p.full_name
  limit 20;
end;
$$;

revoke all on function public.search_customers_for_staff(text)
  from public, anon;
grant execute on function public.search_customers_for_staff(text)
  to authenticated;


create or replace function public.create_staff_order_with_payment(
  p_customer_id uuid,
  p_address text,
  p_notes text,
  p_pickup_delivery boolean,
  p_service_names text[],
  p_payment_method text,
  p_payment_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_customer public.profiles%rowtype;
  v_total numeric(10, 2);
  v_payment_method text :=
    lower(trim(coalesce(p_payment_method, '')));
  v_payment_reference text :=
    nullif(trim(coalesce(p_payment_reference, '')), '');
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'staff'
  ) then
    raise exception 'Only staff can create orders for customers.';
  end if;

  select p.*
  into v_customer
  from public.profiles p
  where p.id = p_customer_id
    and p.role = 'customer';

  if not found then
    raise exception 'Select a valid registered customer.';
  end if;

  if coalesce(trim(p_address), '') = '' then
    raise exception 'Customer address is required.';
  end if;

  if coalesce(cardinality(p_service_names), 0) = 0 then
    raise exception 'Choose at least one service.';
  end if;

  if exists (
    select 1
    from unnest(p_service_names) as s(name)
    where s.name not in (
      'Wash & Fold', 'Ironing', 'Dry Cleaning',
      'Wash & Iron', 'Self Service'
    )
  ) then
    raise exception 'One or more selected services are invalid.';
  end if;

  if (
    select count(distinct s.name)
    from unnest(p_service_names) as s(name)
  ) <> cardinality(p_service_names) then
    raise exception 'A service can only be selected once.';
  end if;

  if v_payment_method not in ('cash', 'gcash') then
    raise exception 'Choose Cash or GCash.';
  end if;

  if v_payment_method = 'cash'
     and v_payment_reference is not null then
    raise exception 'Cash orders cannot include a GCash reference.';
  end if;

  if char_length(v_payment_reference) > 100 then
    raise exception 'The payment reference is too long.';
  end if;

  select sum(
    case s.name
      when 'Wash & Fold' then 45
      when 'Ironing' then 35
      when 'Dry Cleaning' then 120
      when 'Wash & Iron' then 65
      when 'Self Service' then 65
    end
  )
  into v_total
  from unnest(p_service_names) as s(name);

  insert into public.orders (
    user_id,
    customer_name,
    service_name,
    quantity,
    quantity_unit,
    address,
    notes,
    pickup_delivery,
    delivery_fee,
    estimated_total,
    payment_method,
    payment_reference,
    payment_status
  )
  values (
    v_customer.id,
    coalesce(
      nullif(trim(v_customer.full_name), ''),
      nullif(trim(v_customer.username), ''),
      v_customer.email
    ),
    array_to_string(p_service_names, ', '),
    1,
    'kg',
    trim(p_address),
    nullif(trim(coalesce(p_notes, '')), ''),
    coalesce(p_pickup_delivery, false),
    case when p_pickup_delivery then 10 else 0 end,
    v_total,
    v_payment_method,
    v_payment_reference,
    case
      when v_payment_method = 'gcash'
        and v_payment_reference is not null
      then 'pending_verification'
      else 'unpaid'
    end
  )
  returning id into v_order_id;

  insert into public.order_services (
    order_id,
    service_name,
    quantity,
    quantity_unit,
    estimated_total
  )
  select
    v_order_id,
    s.name,
    1,
    'kg',
    case s.name
      when 'Wash & Fold' then 45
      when 'Ironing' then 35
      when 'Dry Cleaning' then 120
      when 'Wash & Iron' then 65
      when 'Self Service' then 65
    end
  from unnest(p_service_names) as s(name);

  return v_order_id;
end;
$$;

revoke all on function public.create_staff_order_with_payment(
  uuid, text, text, boolean, text[], text, text
) from public, anon;

grant execute on function public.create_staff_order_with_payment(
  uuid, text, text, boolean, text[], text, text
) to authenticated;
