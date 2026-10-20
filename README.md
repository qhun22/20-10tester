# 20-10_Flower

Happy Vietnamese Women's Day! On this special day, I would like to express my sincere gratitude to all the women in Vietnam for their hard work, dedication, and strength. You are the backbone of our society, and we are so lucky to have you. I would also like to take this opportunity to celebrate the beauty and strength of Vietnamese women.

A Cloudflare Worker app: an admin panel lets you create multiple "gift" links, each with its own passcode and message, and generates a QR code for each one. Visiting a gift link shows a passcode screen; entering the correct code reveals an animated flower with the custom message typed out.

## Project structure

- `src/worker.js` — Worker entry point / router
- `src/gift-page.js` — renders the public `/g/:id` passcode + flower page
- `src/admin-page.js` — renders the `/admin` login + dashboard pages
- `src/kv.js` — KV-backed CRUD for gift links + basic rate limiting
- `src/auth.js` — signed session cookie for admin login
- `src/qr.js` — server-rendered QR code (SVG), no external service
- `css/`, `scss/`, `img/` — source assets, synced into `public/` on build
- `public/` — build output served as static assets (gitignored)

## Development

```bash
npm install
npm run build   # compile scss -> css and sync css/img into public/
```

Create a `.dev.vars` file (gitignored) for local secrets:

```
ADMIN_PASSWORD=123
SESSION_SECRET=any-random-string-for-local-dev
```

Then run the Worker locally:

```bash
npm run dev      # builds, then runs `wrangler dev`
```

Visit `http://localhost:8787/admin` and log in with `admin` / the password from `.dev.vars`.

## Deployment (Cloudflare Workers)

1. Create a KV namespace and put its id in `wrangler.toml` under `[[kv_namespaces]]`:
   ```bash
   npx wrangler kv namespace create GIFTS
   ```
2. Set the admin password and session secret as Worker secrets (do not put these in `wrangler.toml` or commit them):
   ```bash
   npx wrangler secret put ADMIN_PASSWORD
   npx wrangler secret put SESSION_SECRET
   ```
3. Deploy:
   ```bash
   npm run deploy
   ```

If deploying via the Cloudflare dashboard's Git integration instead, set:
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
