-- Apply once in Supabase Dashboard > SQL Editor after multi-service-orders.sql.
-- Ironing is a flat $35 service, regardless of the entered laundry amount.

begin;

alter table public.order_services
  drop constraint if exists order_services_price_check;

update public.order_services
set estimated_total = 35,
    final_quantity = null,
    final_total = case when final_total is null then null else 35 end
where service_name = 'Ironing';

alter table public.order_services
  add constraint order_services_price_check check (
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
  );

with service_totals as (
  select
    order_id,
    sum(estimated_total) as estimated_total,
    sum(final_total) as final_services_total,
    count(*) as service_count,
    count(final_total) as finalized_service_count
  from public.order_services
  group by order_id
)
update public.orders o
set estimated_total = totals.estimated_total,
    final_quantity = case when totals.service_count = 1 then null else o.final_quantity end,
    final_total = case
      when totals.service_count = totals.finalized_service_count
        then totals.final_services_total + o.delivery_fee
      else null
    end
from service_totals totals
where o.id = totals.order_id
  and exists (
    select 1
    from public.order_services ironing
    where ironing.order_id = o.id and ironing.service_name = 'Ironing'
  );

commit;
