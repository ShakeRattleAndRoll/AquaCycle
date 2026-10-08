alter table public.profiles
  add column if not exists preferred_payment_method text not null default 'cash',
  add column if not exists laundry_service_preference text not null default 'Wash & Fold',
  add column if not exists folding_preference text not null default 'Fold clothes',
  add column if not exists laundry_special_instructions text not null default '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_preferred_payment_method_check'
  ) then
    alter table public.profiles
      add constraint profiles_preferred_payment_method_check
      check (preferred_payment_method in ('cash', 'gcash'));
  end if;

  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_laundry_service_preference_check'
  ) then
    alter table public.profiles drop constraint profiles_laundry_service_preference_check;
  end if;

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

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_folding_preference_check'
  ) then
    alter table public.profiles
      add constraint profiles_folding_preference_check
      check (
        folding_preference in (
          'Fold clothes',
          'Do not fold'
        )
      );
  end if;
end;
$$;

grant update (
  full_name,
  phone,
  address,
  preferred_payment_method,
  laundry_service_preference,
  folding_preference,
  laundry_special_instructions
)
on public.profiles to authenticated;
