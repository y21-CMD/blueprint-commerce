create table public.signup_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  verified boolean not null default false,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now()
);

create index idx_signup_otps_email on public.signup_otps(email);

alter table public.signup_otps enable row level security;

-- Public signup flow: anyone can insert and read/update by email (no auth yet at this point).
create policy "Anyone can create signup OTP"
on public.signup_otps for insert
to anon, authenticated
with check (true);

create policy "Anyone can read signup OTP"
on public.signup_otps for select
to anon, authenticated
using (true);

create policy "Anyone can update signup OTP"
on public.signup_otps for update
to anon, authenticated
using (true)
with check (true);