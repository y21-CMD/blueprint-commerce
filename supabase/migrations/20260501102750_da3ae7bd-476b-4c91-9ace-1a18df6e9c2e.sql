ALTER TABLE public.signup_otps
ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'signup';

CREATE INDEX IF NOT EXISTS idx_signup_otps_email_purpose
ON public.signup_otps (email, purpose, created_at DESC);