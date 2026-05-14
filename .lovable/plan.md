# Role-Based Sub-Users for ViaSetu Admin

## Goal

Extend the existing admin system so the Super Admin can create sub-users with limited access, each with their own login URL and visible sections.

## Roles

| Role | Login URL | Visible Sections |
|---|---|---|
| `super_admin` (existing) | `/admin/login` | Everything |
| `cms_editor` (new) | `/cms/login` | Content (CMS) only |
| `operations` (new) | `/ops/login` | Order Monitoring, Real-Time Tracking, Reconciliation, Support Management, User Management |

- Email domain restriction is **removed** for sub-user creation. Super admin emails still keep `@viasetu.com` (existing rule untouched).
- Permissions are fixed per role (no per-section toggles).

## What changes

### 1. Database (migration)

Extend the existing `admin_role` enum:

```sql
ALTER TYPE admin_role ADD VALUE 'cms_editor';
ALTER TYPE admin_role ADD VALUE 'operations';
```

Add helper functions mirroring `is_super_admin`:
- `is_cms_editor(uuid)` → role in (`super_admin`, `cms_editor`)
- `is_operations(uuid)` → role in (`super_admin`, `operations`)

Update existing RLS policies that reference `is_super_admin` for CMS tables (`cms_content`, `cms_categories`, `cms_authors`, `cms_media`) to use `is_cms_editor` instead, so CMS Editors can manage content. Operations gets read access on `bookings`, `support_tickets`, `ticket_messages`, `profiles` via new policies using `is_operations`.

### 2. Edge function: `create-admin-user`

- Drop the `@viasetu.com` check.
- Accept `role` value of `super_admin` | `cms_editor` | `operations` (still super-admin-only to invoke).
- Reset-password redirect chosen based on role: `/admin/reset-password` (super), `/cms/reset-password`, `/ops/reset-password`.

### 3. Frontend routes (`src/App.tsx`)

Add:
- `/cms/login` → reuses existing AdminLogin component, redirects on success to `/admin/cms`
- `/ops/login` → redirects on success to `/admin/orders`
- `/cms/reset-password`, `/ops/reset-password` → reuse ResetPassword component

`/admin` route group stays. Access is gated per-route by an enhanced `ProtectedAdminRoute`.

### 4. `ProtectedAdminRoute` enhancement

Replace `requireSuperAdmin?: boolean` with `allowedRoles?: AdminRole[]`. Default still allows any active admin. Each route in `App.tsx` declares the roles permitted:

- CMS routes → `['super_admin', 'cms_editor']`
- Orders / Tracking / Support / Reconciliation / Users → `['super_admin', 'operations']`
- Admin Users / System Settings / Revenue / Analytics → `['super_admin']`

If a logged-in sub-user hits a forbidden URL, redirect to their default landing page.

### 5. `AdminLayout` sidebar

Filter menu items by role using a new `allowedRoles` field on each menu entry. CMS Editor sees only "Content (CMS)". Operations sees Orders, Tracking, Users, Support, Reconciliation. Header title adapts ("CMS Panel" / "Operations Panel" / "Admin Panel").

### 6. Admin Users management page

In `AdminUserManagement.tsx`:
- Role dropdown gains `cms_editor` and `operations` options.
- Email field no longer enforces `@viasetu.com` (super admin can pick any domain).
- Helper text clarifies which sections each role unlocks.

### 7. Login pages

`AdminLogin` already exists. Create thin wrappers `CmsLogin` and `OpsLogin` that reuse it but:
- Show role-specific branding ("CMS Login" / "Operations Login")
- After successful auth, verify the user's `admin_users.role` matches the expected group; otherwise sign out with an error.
- Redirect to the role's default landing page.

## Files

**New**
- `src/pages/cms/CmsLogin.tsx`
- `src/pages/ops/OpsLogin.tsx`
- supabase migration (enum values + helper functions + RLS updates)

**Edited**
- `src/App.tsx` (routes + per-route role guards)
- `src/components/admin/ProtectedAdminRoute.tsx` (allowedRoles support, role-aware redirect)
- `src/components/admin/AdminLayout.tsx` (sidebar filtering by role, dynamic header)
- `src/pages/admin/AdminUserManagement.tsx` (role options, drop domain restriction)
- `src/pages/admin/AdminLogin.tsx` (small refactor to accept expected role group + redirect target)
- `supabase/functions/create-admin-user/index.ts` (remove domain check, accept new roles, role-based redirect)

## Out of scope

- No per-section permission toggles (fixed role mapping).
- No 2FA changes.
- No bulk-import of users.
- Existing super admins and their access remain unchanged.
