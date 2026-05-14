
-- Backfill owner roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::public.app_role FROM auth.users
WHERE email IN ('samri@gmail.com','y23938476@gmail.com')
ON CONFLICT DO NOTHING;

-- Also make sure samri has admin role too (so all existing admin policies apply)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE email = 'samri@gmail.com'
ON CONFLICT DO NOTHING;

-- Update trigger to grant owner+admin to whitelisted owner emails on signup
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IN ('samri@gmail.com', 'y23938476@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Restrict role-management policies: admins can manage non-owner roles only.
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Owners can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can view non-owner roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND role <> 'owner'
  );

CREATE POLICY "Admins can manage non-admin non-owner roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND role NOT IN ('admin','owner')
  );

CREATE POLICY "Admins can delete non-admin non-owner roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND role NOT IN ('admin','owner')
  );

-- Hide owner profiles from admins (admins shouldn't see owners exist).
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view non-owner profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner')
    OR (
      public.has_role(auth.uid(), 'admin')
      AND NOT public.has_role(id, 'owner')
    )
  );

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update non-owner profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner')
    OR (
      public.has_role(auth.uid(), 'admin')
      AND NOT public.has_role(id, 'owner')
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'owner')
    OR (
      public.has_role(auth.uid(), 'admin')
      AND NOT public.has_role(id, 'owner')
    )
  );
