# Supabase setup (save letter + email copy)

1. Create a project at supabase.com.
2. SQL Editor: paste and run setup.sql.
3. Authentication > URL Configuration: set Site URL to your live site address (and add it under Redirect URLs).
4. Make a free API key at resend.com.
5. Deploy the function:
   npm i -g supabase
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   supabase secrets set RESEND_API_KEY=re_xxxxx
   supabase functions deploy send-letter
   (run from a folder that contains supabase/functions/send-letter/index.ts; move the functions/ folder into a folder named supabase)
6. Open index.html, find SUPABASE_URL and SUPABASE_ANON_KEY near the end, paste your values (Project Settings > API). The anon key is safe in public code. Never paste the service_role key or the Resend key.

Resend's test sender only delivers to your own Resend email. To email other people, verify a domain in Resend and run: supabase secrets set FROM_EMAIL="Archive <hello@yourdomain.com>"
