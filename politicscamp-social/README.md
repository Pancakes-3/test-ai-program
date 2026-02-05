# Politics Camp Social MVP

A private, camp-only social app built with Expo (iOS/Android/Web) and Supabase.

## Features
- Private app: authentication required for all screens.
- Camp-only login ID: `first.last@politicscamp.local` generated from names.
- Admin controls for breaking news and signup toggles.
- Home feed, Following feed, Breaking News feed.
- Like/unlike, comment, follow/unfollow, @FirstLast mentions.
- Multi-account switching with secure local session storage.

## Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Set the Supabase project URL and anon key.

Option A: Update `app.json` values:
```json
{
  "supabaseUrl": "YOUR_SUPABASE_URL",
  "supabaseAnonKey": "YOUR_SUPABASE_ANON_KEY"
}
```

Option B: Use Expo public env vars:
```bash
export EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
export EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 3) Apply Supabase schema
Run the SQL in `SUPABASE_SCHEMA.sql` in your Supabase SQL editor.

### 4) Start the app
```bash
npm run start
```

## Server-side signup enforcement

The client checks `app_config.allow_signups` before enabling signup. Server-side enforcement should prevent account creation when signups are disabled. Recommended options:

- **SQL/RLS check on `profiles` inserts**: Included in `SUPABASE_SCHEMA.sql` to block profile inserts when `allow_signups = false`.
- **Supabase Edge Function**: Create a `create-user` Edge Function that checks `app_config` using the service role key and only creates new users when allowed.
- **Auth hook**: Use Supabase Auth hooks to reject signup requests when `allow_signups` is false.

> Note: RLS on `profiles` blocks profile creation but does not stop Auth user creation; use an Edge Function or Auth hook for strict enforcement.

## App_config table
Seeded with:
- `allow_signups = false`

Admins can toggle this value in the Profile screen.

## Mention parsing
Mentions are parsed using `@FirstLast` camel-case style (e.g., `@JaneDoe`). The app attempts to match first and last names from the mention.
