
-- 1. Add user-scoped SELECT policy for shipment_history
CREATE POLICY "Users can view their own shipment history"
ON public.shipment_history
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);
