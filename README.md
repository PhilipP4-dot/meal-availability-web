# The Sunday Table

**Live application:** [sweetspicy.up.railway.app](https://sweetspicy.up.railway.app/)

A warm, mobile-friendly meal availability site with:

- A public “available now” page with category filters
- Ingredient and recipe details for every meal
- An owner dashboard for availability toggles, editing, and adding meals
- Responsive layouts for phones, tablets, and desktops

## Run locally

This project requires Node.js 22.13 or newer.

If `node --version` reports Node 20, install Node 22 LTS and open a new terminal before continuing. With nvm-windows, run `nvm install 22.14.0` followed by `nvm use 22.14.0`.

```bash
npm install
npm run dev
```

## Railway

Create a new Railway service from this repository. Railway will detect the standard Next.js app; use `npm run build` as the build command and `npm run start` as the start command.

Add a Railway Postgres service and set these variables on the web service:

- `DATABASE_URL`: use the value supplied by Railway Postgres
- `OWNER_PASSWORD`: a long password known only to the owner
- `SESSION_SECRET`: at least 32 random characters used to sign login sessions
- Railway Storage Bucket credentials: `BUCKET`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `REGION`, and `ENDPOINT`

The public meal board is read-only. The owner dashboard requires the password, and every edit is authorized on the server. Without `DATABASE_URL`, local development uses temporary in-memory data that resets when the development server restarts.

Meal photos are stored in a private Railway Storage Bucket and served through the application. Create a Bucket in the Railway project, then use Railway variable references to inject its credentials into the web service. Accepted uploads are JPEG, PNG, and WebP files up to 5 MB.

## Customize

Replace the sample business name, meal data, email address, and kitchen story in `app/page.tsx`. The look and responsive behavior live in `app/globals.css`.
