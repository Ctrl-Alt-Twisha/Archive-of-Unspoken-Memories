# Archive of Unspoken Memories

A quiet, interactive place for the things you never got to say. Explore drifting
love-lock photos, open a sealed envelope, and write a letter on a vintage
typewriter—to yourself or to a friend. Letters can be saved to a private archive.

**Live site:** [ctrl-alt-twisha.github.io/Archive-of-Unspoken-Memories](https://ctrl-alt-twisha.github.io/Archive-of-Unspoken-Memories/)

## Features

- Interactive letter-writing experience with a vintage typewriter
- Letters addressed to yourself or a friend
- Private, account-based archive for saved letters
- Optional email copies of letters
- Persistent audio mute preference
- Responsive photo collage

## Run locally

This is a static site. Open `index.html` in a browser, or serve the project
directory with any static file server. No build step is required.

Supabase-backed sign-in, saving, archive access, and email delivery require the
project configuration described below; opening the page locally does not
configure those services.

## Supabase setup

The site uses Supabase for email-link authentication, private letter storage,
and the `send-letter` Edge Function. Follow the detailed setup guide in
[`supabase/README.md`](./supabase/README.md). It covers project configuration,
database setup, Edge Function deployment, and email provider setup.

In short:

1. Create a Supabase project and run [`supabase/setup.sql`](./supabase/setup.sql)
   in its SQL Editor.
2. Set the site URL and redirect URL in Supabase Authentication to your
   deployed site.
3. Configure the Supabase project URL and public anon/publishable key in
   `index.html`.
4. Link the Supabase CLI to your project, then deploy the Edge Function:

   ```powershell
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   supabase functions deploy send-letter
   ```

Email sign-in links and letter email copies use separate delivery
configurations. Configure both as needed, and keep provider credentials in
Supabase—not in `index.html` or Git.

## Deploy with GitHub Pages

The site is hosted as a static GitHub Pages site. Push changes to the branch
configured in the repository's **Settings → Pages**. The Supabase Edge Function
is deployed separately; pushing website changes does not deploy function
changes.

## Security notes

- The Supabase browser key is a public client key; never put a service-role key
  or email-provider secret in the website code.
- Store email credentials as Supabase secrets and deploy the Edge Function
  after changing its code.
- Keep row-level security enabled so users can access only their own archived
  letters.
