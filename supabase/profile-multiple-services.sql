-- Apply in Supabase SQL Editor to allow customers to save multiple service preferences.
alter table public.profiles
  drop constraint if exists profiles_laundry_service_preference_check;

update public.profiles
set laundry_service_preference = case laundry_service_preference
  when 'Wash Only' then 'Wash & Fold'
  when 'Dry Only' then 'Dry Cleaning'
  else laundry_service_preference
end;

alter table public.profiles
  add constraint profiles_laundry_service_preference_check
  check (
    laundry_service_preference = '' or
    string_to_array(laundry_service_preference, ', ') <@
      array['Wash & Fold', 'Ironing', 'Dry Cleaning', 'Self Service']::text[]
  );
