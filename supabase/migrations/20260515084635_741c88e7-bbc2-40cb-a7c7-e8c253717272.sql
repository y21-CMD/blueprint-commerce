
-- =========================
-- MESSAGES (two-way chat)
-- =========================
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  sender_is_admin boolean NOT NULL DEFAULT false,
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 5000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_customer ON public.messages(customer_id, created_at DESC);
CREATE INDEX idx_messages_unread_customer ON public.messages(customer_id) WHERE read_at IS NULL AND sender_is_admin = true;
CREATE INDEX idx_messages_unread_admin ON public.messages(customer_id) WHERE read_at IS NULL AND sender_is_admin = false;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Customer reads own thread
CREATE POLICY "Customers view their own messages"
  ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

-- Customer sends as themselves (must not impersonate admin)
CREATE POLICY "Customers send messages on their own thread"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = customer_id
    AND auth.uid() = sender_id
    AND sender_is_admin = false
    AND NOT COALESCE((SELECT is_blocked FROM public.profiles WHERE id = auth.uid()), false)
  );

-- Customer can mark admin messages as read (update read_at on their own thread)
CREATE POLICY "Customers update their own thread"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Admins view all
CREATE POLICY "Admins view all messages"
  ON public.messages FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins reply (as admin)
CREATE POLICY "Admins reply to any thread"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND auth.uid() = sender_id
    AND sender_is_admin = true
  );

-- Admins can mark any message read
CREATE POLICY "Admins update messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- =========================
-- ORDERS: payment proof fields
-- =========================
ALTER TABLE public.orders
  ADD COLUMN payment_method text,
  ADD COLUMN payment_ref text,
  ADD COLUMN payment_receipt_path text,
  ADD COLUMN payment_notes text,
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN approved_by uuid;

-- Enforce method enum-style at insert/update via trigger so existing rows untouched
CREATE OR REPLACE FUNCTION public.validate_order_payment()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.payment_method IS NOT NULL
     AND NEW.payment_method NOT IN ('cbe','telebirr','boa','abay') THEN
    RAISE EXCEPTION 'Invalid payment_method';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_order_payment
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_payment();

-- Default new orders to pending
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';

-- =========================
-- STORAGE: payment-receipts (private)
-- =========================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Customers upload into their own user-id folder
CREATE POLICY "Users upload own receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins read all receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND has_role(auth.uid(), 'admin'::app_role)
  );
