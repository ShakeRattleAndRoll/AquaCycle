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

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_laundry_service_preference_check'
  ) then
    alter table public.profiles
      add constraint profiles_laundry_service_preference_check
      check (
        laundry_service_preference in (
          'Wash & Fold',
          'Wash Only',
          'Dry Only',
          'Ironing'
        )
      );
  end if;

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
