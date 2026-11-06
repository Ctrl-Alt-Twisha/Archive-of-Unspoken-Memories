# Supabase setup

The site uses Supabase email-link authentication and stores letters in a private
table. The Resend email copy is optional; saving a letter still works if Resend
is not configured.

## Create and configure the Supabase project

1. Create a project at [supabase.com](https://supabase.com/).
2. In **SQL Editor**, run [`setup.sql`](./setup.sql) once.
3. In **Authentication > URL Configuration**, set the Site URL to:
   `https://ctrl-alt-twisha.github.io/Archive-of-Unspoken-Memories/`
   Add that same URL under **Redirect URLs**.
4. In **Project Settings > API**, copy the Project URL and the public
   publishable/anon key into `SUPABASE_URL` and `SUPABASE_ANON_KEY` near the
   bottom of `index.html`. The public key is intended for browser use. Never
   put a service-role key or Resend API key in `index.html`.

## Deploy the save function

From the repository root, install the Supabase CLI if needed, then run:

```powershell
npm install --global supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy send-letter
```

The project reference is in the Supabase project URL:
`https://YOUR-PROJECT-REF.supabase.co`.

The function validates the signed-in user and saves their letter using row-level
security. Users can read only their own letters. The function verifies the user
session; do not disable JWT verification.

## Email sign-in for visitors

Supabase's built-in email sender is for testing: it only sends to project team
members and is rate-limited. To let other visitors receive sign-in links, set up
a custom SMTP provider in **Authentication > SMTP Settings**. For Resend, verify
a sending domain first, then use its SMTP host, username, password/API key, and a
sender address on that domain. Do not put SMTP credentials in this repository.

## Optional: email copies of letters

To email the writer (and, for a friend letter, its recipient), create a Resend
API key and set it as a Supabase Edge Function secret:

```powershell
supabase secrets set RESEND_API_KEY=re_your_key
```

Resend's test sender only delivers to the address permitted by your Resend
account. To send to other people, verify a domain in Resend, then set a sender:

```powershell
supabase secrets set FROM_EMAIL="Archive of Unspoken Memories <hello@yourdomain.com>"
```

Redeploy the function after changing its code:

```powershell
supabase functions deploy send-letter
```
