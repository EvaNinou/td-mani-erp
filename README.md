# TD MANI ERP

Organized Next.js + Supabase project.

## Environment variables
Copy `.env.example` to `.env.local` and add the Supabase URL and anon key.

## Commands
- `npm install`
- `npm run dev`
- `npm run build`

The existing ERP behavior is preserved. The large embedded style block was moved from `app/page.jsx` to `app/styles/erpStyles.js`, and existing reusable components/utilities/services are grouped by responsibility.
