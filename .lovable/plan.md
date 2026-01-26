
# Settings Page Implementation Plan

## Overview
Add a comprehensive Settings page accessible from the home screen with language switching (Hindi/English), notification preferences, profile management, and other user-friendly options.

## Features to Include

### 1. Language Settings (Primary Feature)
- **Hindi and English support** using `react-i18next` library
- Language preference stored in localStorage and synced to user profile
- All UI text throughout the app will be translatable

### 2. Profile Management
- View and edit name
- View phone number (read-only since it's tied to authentication)
- View KYC status

### 3. Notification Preferences
- SMS notifications toggle (for order updates)
- Promotional notifications toggle

### 4. App Preferences
- Theme toggle (Light/Dark mode) - leveraging existing dark mode support in tailwind.config.ts

### 5. Quick Links
- Privacy Policy
- Terms of Service
- Rate the App
- Share App with Friends
- App Version display

### 6. Account Actions
- Logout button
- Delete Account option (with confirmation)

---

## Technical Implementation

### Step 1: Install i18n Library
Add `react-i18next` and `i18next` packages for internationalization support.

### Step 2: Create i18n Configuration
Create `src/i18n/` folder with:
- `i18n.ts` - Main configuration file
- `locales/en.json` - English translations
- `locales/hi.json` - Hindi translations

Translation keys will cover:
- Navigation labels
- Button text
- Form labels
- Status messages
- All static UI text

### Step 3: Database Schema Update
Add new columns to the `profiles` table:
```text
preferred_language    TEXT    DEFAULT 'en'
theme_preference      TEXT    DEFAULT 'light'
sms_notifications     BOOLEAN DEFAULT true
promo_notifications   BOOLEAN DEFAULT true
```

### Step 4: Update Edge Functions
Modify `update-profile` to handle the new preference fields.

### Step 5: Create Settings Page
New file: `src/pages/Settings.tsx`
- Sheet-style slide-in panel or full page (based on mobile-first design)
- Grouped sections with clear visual hierarchy
- Real-time preference updates

### Step 6: Add Settings Button to Home Page
Add a Settings icon button (gear icon) in the header card next to the Logout button on `src/pages/Index.tsx`.

### Step 7: Update App Router
Add the `/settings` route in `src/App.tsx`.

### Step 8: Create Language Context/Hook
Create `src/hooks/useLanguage.ts` to manage language state globally and provide easy access throughout the app.

### Step 9: Wrap App with i18n Provider
Update `src/main.tsx` to initialize i18n before rendering.

### Step 10: Translate Key Pages
Priority translation for:
- Home page (Index.tsx)
- Booking flow
- Bottom navigation
- Settings page itself

---

## File Changes Summary

| Action | File |
|--------|------|
| Create | `src/i18n/i18n.ts` |
| Create | `src/i18n/locales/en.json` |
| Create | `src/i18n/locales/hi.json` |
| Create | `src/pages/Settings.tsx` |
| Create | `src/hooks/useLanguage.ts` |
| Modify | `src/main.tsx` (add i18n provider) |
| Modify | `src/pages/Index.tsx` (add Settings button) |
| Modify | `src/components/BottomNav.tsx` (add translations) |
| Modify | `src/App.tsx` (add /settings route) |
| Modify | `supabase/functions/update-profile/index.ts` (handle new fields) |
| DB Migration | Add preference columns to profiles table |

---

## UI Design

The Settings page will follow the existing glassmorphism design pattern with:
- Grouped sections using Cards
- Toggle switches for boolean preferences
- Radio buttons for language selection
- Smooth transitions matching the app's animation style
- Mobile-optimized layout with proper safe area padding

---

## Hindi Translations Sample

| English | Hindi |
|---------|-------|
| Welcome to ViaSetu | ViaSetu में आपका स्वागत है |
| Book New Delivery | नई डिलीवरी बुक करें |
| Track Package | पैकेज ट्रैक करें |
| Order History | ऑर्डर इतिहास |
| Support | सहायता |
| Settings | सेटिंग्स |
| Language | भाषा |
| Notifications | सूचनाएं |
| Theme | थीम |
| Logout | लॉग आउट |

