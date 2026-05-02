-- 1. Add trade_type to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS trade_type text NOT NULL DEFAULT 'imported'
  CHECK (trade_type IN ('imported', 'exported'));

CREATE INDEX IF NOT EXISTS idx_products_trade_type ON public.products(trade_type);

-- 2. Add is_blocked to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

-- 3. Allow admins to update any profile (for blocking/unblocking)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Enable realtime for products table
ALTER TABLE public.products REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.products';
  END IF;
END $$;