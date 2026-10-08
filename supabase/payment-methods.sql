-- Apply after setup.sql and multi-service-orders.sql in Supabase SQL Editor.
-- This MVP records manual Cash/GCash payments; it does not charge customers online.

alter table public.orders
  add column if not exists payment_method text not null default 'cash',
  add column if not exists payment_reference text,
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists payment_verified_at timestamptz,
  add column if not exists payment_verified_by uuid references public.profiles(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass and conname = 'orders_payment_method_check'
  ) then
    alter table public.orders add constraint orders_payment_method_check
      check (payment_method in ('cash', 'gcash'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass and conname = 'orders_payment_status_check'
  ) then
    alter table public.orders add constraint orders_payment_status_check
      check (payment_status in ('unpaid', 'pending_verification', 'paid'));
  end if;

  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass and conname = 'orders_payment_details_check'
  ) then
    alter table public.orders drop constraint orders_payment_details_check;
  end if;
end;
$$;

alter table public.orders add constraint orders_payment_details_check
  check (
    (payment_method = 'cash' and payment_reference is null)
    or (payment_method = 'gcash' and (payment_reference is null or char_length(payment_reference) <= 100))
  );

-- Only staff may update payment verification fields through the existing staff-only
-- orders update policy. Customers submit a reference through the RPC below.
grant update (payment_status, payment_verified_at, payment_verified_by)
  on public.orders to authenticated;

create or replace function public.create_order_with_payment(
  p_customer_name text,
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
  v_payment_method text := lower(btrim(coalesce(p_payment_method, '')));
  v_payment_reference text := nullif(btrim(coalesce(p_payment_reference, '')), '');
begin
  if auth.uid() is null then
    raise exception 'Sign in before creating an order.';
  end if;
  if v_payment_method not in ('cash', 'gcash') then
    raise exception 'Choose Cash or GCash as the payment method.';
  end if;
  if v_payment_method = 'cash' and v_payment_reference is not null then
    raise exception 'Cash orders cannot include a GCash reference.';
  end if;
  if v_payment_method = 'gcash' and char_length(v_payment_reference) > 100 then
    raise exception 'Keep the GCash payment reference under 100 characters.';
  end if;

  v_order_id := public.create_order_with_services(
    p_customer_name,
    p_address,
    p_notes,
    p_pickup_delivery,
    p_service_names
  );

  update public.orders
  set payment_method = v_payment_method,
      payment_reference = v_payment_reference,
      payment_status = case when v_payment_method = 'gcash' and v_payment_reference is not null then 'pending_verification' else 'unpaid' end
  where id = v_order_id and user_id = auth.uid();

  if not found then
    raise exception 'Could not attach payment details to the order.';
  end if;

  return v_order_id;
end;
$$;

revoke all on function public.create_order_with_payment(text, text, text, boolean, text[], text, text) from public, anon;
grant execute on function public.create_order_with_payment(text, text, text, boolean, text[], text, text) to authenticated;

create or replace function public.prevent_unpaid_order_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'completed'
    and old.status is distinct from 'completed'
    and new.payment_status is distinct from 'paid' then
    raise exception 'Payment must be marked as paid before completing pickup.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_unpaid_order_completion() from public, anon, authenticated;
drop trigger if exists prevent_unpaid_order_completion on public.orders;
create trigger prevent_unpaid_order_completion
  before update of status on public.orders
  for each row
  execute function public.prevent_unpaid_order_completion();
