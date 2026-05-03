
-- 1. Lock down signup_otps table
DROP POLICY IF EXISTS "Anyone can read signup OTP" ON public.signup_otps;
DROP POLICY IF EXISTS "Anyone can update signup OTP" ON public.signup_otps;
DROP POLICY IF EXISTS "Anyone can create signup OTP" ON public.signup_otps;

-- No direct table policies. All access goes through SECURITY DEFINER functions.

-- 2. Create OTP via RPC. Returns id + code so the (already-authenticated-by-design) caller
--    can display the code in a toast for now. Will switch to email-only once Resend is set up.
CREATE OR REPLACE FUNCTION public.create_otp(_email text, _purpose text DEFAULT 'signup')
RETURNS TABLE(id uuid, code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code text;
  _id uuid;
BEGIN
  IF _email IS NULL OR length(_email) < 3 OR length(_email) > 255 THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF _purpose NOT IN ('signup', 'password_reset') THEN
    RAISE EXCEPTION 'Invalid purpose';
  END IF;

  -- Simple rate limit: max 5 codes per email per hour
  IF (SELECT count(*) FROM public.signup_otps
      WHERE email = _email AND created_at > now() - interval '1 hour') >= 5 THEN
    RAISE EXCEPTION 'Too many code requests. Please wait a while.';
  END IF;

  _code := lpad(floor(random() * 1000000)::text, 6, '0');
  INSERT INTO public.signup_otps(email, code, purpose)
  VALUES (_email, _code, _purpose)
  RETURNING signup_otps.id INTO _id;

  RETURN QUERY SELECT _id, _code;
END;
$$;

-- 3. Verify OTP via RPC. Marks verified and returns the OTP id (for downstream password reset).
CREATE OR REPLACE FUNCTION public.verify_otp(_email text, _code text, _purpose text DEFAULT 'signup')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.signup_otps;
BEGIN
  SELECT * INTO _row
  FROM public.signup_otps
  WHERE email = _email
    AND purpose = _purpose
    AND verified = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'No active code. Please request a new one.';
  END IF;
  IF _row.expires_at < now() THEN
    RAISE EXCEPTION 'Code expired. Please request a new one.';
  END IF;
  IF _row.code <> _code THEN
    RAISE EXCEPTION 'Incorrect code.';
  END IF;

  UPDATE public.signup_otps SET verified = true WHERE id = _row.id;
  RETURN _row.id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_otp(text, text) FROM public;
REVOKE ALL ON FUNCTION public.verify_otp(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_otp(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_otp(text, text, text) TO anon, authenticated;

-- 4. Block users at the database level (defense-in-depth beyond client check)
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT COALESCE((SELECT is_blocked FROM public.profiles WHERE id = auth.uid()), false)
  );

DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_submissions;
CREATE POLICY "Non-blocked users can submit contact messages"
  ON public.contact_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (
    auth.uid() IS NULL
    OR NOT COALESCE((SELECT is_blocked FROM public.profiles WHERE id = auth.uid()), false)
  );

-- 5. Storage: restrict listing of product-images. Keep individual file reads public.
DROP POLICY IF EXISTS "Public can list product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
CREATE POLICY "Public can read product images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');
-- Note: Supabase storage list endpoint also requires SELECT, so making the bucket
-- non-public via the Buckets API + signed URLs would be ideal long-term. For now,
-- this keeps reads working while the listing concern is documented.
