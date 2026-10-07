-- Run after setup.sql, multi-service-orders.sql, and payment-methods.sql.
-- Stores notification events instead of rebuilding alerts from old order statuses.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  notification_type text not null check (notification_type in (
    'order_received', 'order_status', 'payment_review', 'payment_paid'
  )),
  title text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_recipient_created_idx
  on public.notifications(recipient_id, created_at desc);

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select, update (read_at) on public.notifications to authenticated;

drop policy if exists "Users can read their notifications" on public.notifications;
create policy "Users can read their notifications"
  on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));

drop policy if exists "Users can mark their notifications read" on public.notifications;
create policy "Users can mark their notifications read"
  on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

create or replace function public.create_order_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_number text := '#' || upper(left(new.id::text, 8));
  v_status_title text;
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (recipient_id, order_id, notification_type, title, message)
    values (new.user_id, new.id, 'order_received', 'Order received', 'Your order ' || v_order_number || ' was received.');

    insert into public.notifications (recipient_id, order_id, notification_type, title, message)
    select p.id, new.id, 'order_received', 'New laundry order',
      coalesce(nullif(new.customer_name, ''), 'Customer') || ' · ' || v_order_number
    from public.profiles p
    where p.role = 'staff';

    if new.payment_status = 'pending_verification' then
      insert into public.notifications (recipient_id, order_id, notification_type, title, message)
      select p.id, new.id, 'payment_review', 'GCash payment needs review',
        coalesce(nullif(new.customer_name, ''), 'Customer') || ' · Order ' || v_order_number
      from public.profiles p
      where p.role = 'staff';
    end if;

    return new;
  end if;

  if old.status is distinct from new.status then
    v_status_title := case new.status
      when 'received' then 'Order received'
      when 'washing' then 'Your laundry is being washed'
      when 'drying' then 'Your laundry is being dried'
      when 'ready' then 'Your order is ready for pickup'
      when 'completed' then 'Order completed'
      when 'cancelled' then 'Order cancelled'
      else 'Order updated'
    end;

    insert into public.notifications (recipient_id, order_id, notification_type, title, message)
    values (new.user_id, new.id, 'order_status', v_status_title, 'Order ' || v_order_number);
  end if;

  if old.payment_status is distinct from new.payment_status then
    if new.payment_status = 'pending_verification' then
      insert into public.notifications (recipient_id, order_id, notification_type, title, message)
      select p.id, new.id, 'payment_review', 'GCash payment needs review',
        coalesce(nullif(new.customer_name, ''), 'Customer') || ' · Order ' || v_order_number
      from public.profiles p
      where p.role = 'staff';
    elsif new.payment_status = 'paid' then
      insert into public.notifications (recipient_id, order_id, notification_type, title, message)
      values (new.user_id, new.id, 'payment_paid', 'Payment confirmed', 'Order ' || v_order_number);
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.create_order_notifications() from public, anon, authenticated;

drop trigger if exists orders_create_notifications on public.orders;
create trigger orders_create_notifications
  after insert or update on public.orders
  for each row execute function public.create_order_notifications();
