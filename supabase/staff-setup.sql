-- First create/confirm the staff user's account in Supabase Dashboard > Authentication > Users.
-- Replace the email below, then run this in Dashboard > SQL Editor.
update public.profiles
set role = 'staff', updated_at = now()
where id = (
  select id from auth.users where lower(email) = lower('staff@example.com')
);

-- Check the promotion:
select u.email, p.role
from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = lower('staff@example.com');
