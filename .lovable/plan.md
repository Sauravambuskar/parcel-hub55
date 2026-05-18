## Goal
Send an email to `uday@viasetu.com` every time an order is successfully placed (Razorpay verified + partner booking succeeded), containing all key order details.

## What the email will include
- Order ID (Prayog order ID / AWB)
- Courier partner + service (Air/Surface)
- Pickup address (sender name, phone, city, pincode, full address)
- Delivery address (receiver name, phone, city, pincode, full address)
- Package: goods type, weight, dimensions, declared value
- Pricing: Base Fare, GST, Total (₹)
- Customer phone + booking timestamp
- Direct link to the order in the admin dashboard

## Trigger point
In `supabase/functions/confirm-booking-or-refund/index.ts`, immediately after a booking row is written with `payment_status = 'paid'` and a successful partner booking (AWB present). One email per order, keyed by `idempotencyKey = new-order-${booking.id}` so retries never duplicate.

## Implementation

1. **Email domain** — Set up Lovable Emails sender domain (`notify.viasetu.com`) via the email-setup dialog. Required before any send.
2. **Email infrastructure** — Run `setup_email_infra` (creates pgmq queues, cron dispatcher, send-log tables).
3. **Scaffold transactional email** — Run `scaffold_transactional_email` to create the `send-transactional-email` Edge Function + unsubscribe page.
4. **New React Email template** — `supabase/functions/_shared/transactional-email-templates/new-order-admin.tsx`
   - Branded with ViaSetu cyan/black palette.
   - Sections: Header, Order summary, Pickup → Delivery (two-column), Package, Pricing breakdown, "View in admin" button.
   - Register in `registry.ts`.
5. **Trigger wiring** — In `confirm-booking-or-refund/index.ts`, after the booking is finalized successfully, invoke `send-transactional-email` with:
   - `templateName: 'new-order-admin'`
   - `recipientEmail: 'uday@viasetu.com'` (kept as a constant `ADMIN_NOTIFICATION_EMAIL` at top of file for easy edit; later can move to `system_settings`)
   - `idempotencyKey: 'new-order-' + booking.id`
   - `templateData`: all the order fields listed above.
   - Wrapped in try/catch — email failure must NEVER fail the booking confirmation.

## Files
- **New**: `supabase/functions/_shared/transactional-email-templates/new-order-admin.tsx`
- **Edit**: `supabase/functions/_shared/transactional-email-templates/registry.ts` (add the new template)
- **Edit**: `supabase/functions/confirm-booking-or-refund/index.ts` (invoke send-transactional-email on success)
- Tool-generated: `send-transactional-email`, `handle-email-unsubscribe`, `handle-email-suppression` Edge Functions + unsubscribe page.

## Out of scope (can be added later)
- Multiple recipients / per-admin preferences UI in Settings.
- SMS or WhatsApp notifications.
- Per-status notifications (delivered, RTO, etc.).
- In-app realtime toast for admins.

## Prerequisite the user must do
Approve the email-domain setup dialog and add the DNS records at the viasetu.com registrar so `notify.viasetu.com` can verify. Sending starts as soon as DNS propagates — code is fully deployed before then.
