# Favicon & Logo Generator

A self-hosted web tool for designing and batch-generating **favicons and logos**, then
exporting them as ready-to-ship icon sets — PNG, SVG, WEBP and ICO, bundled into a ZIP
with the matching HTML snippets, `manifest.json` and `browserconfig.xml`.

Built with Next.js. Runs locally with one command, or on your own domain behind nginx.

---

## Features

- **Two modes** — single favicons (square) or full logos (icon + wordmark, horizontal or stacked).
- **Live editor** — fonts, colors, gradients, shapes, background, effects and extra layers, rendered as crisp SVG in real time.
- **Batch generation** — produce dozens of variations at once. A built-in uniqueness engine keeps the results visually distinct instead of near-duplicates.
- **Presets** — start from a curated style and tweak from there.
- **Google Fonts** — fonts are fetched, embedded as base64 and rendered into the export so the output never depends on an external font being available.
- **Multi-format export** — PNG, SVG, WEBP and ICO at all standard sizes (16–512 px for favicons, up to 1920 px wide for logos). Server-side resizing with [sharp](https://sharp.pixelplumbing.com/), packed into a ZIP.
- **Saved projects** — store editor state and batch queues in a local SQLite database.

---

## Tech stack

| | |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| State | Zustand |
| Styling | Tailwind CSS |
| Image processing | sharp, png-to-ico (server) · canvas (client) |
| Packaging | JSZip |
| Database | SQLite via Prisma |

---

## Quick start (local)

Requirements: **Node.js 18.17+** (or 20+) and npm.

```bash
git clone https://github.com/akumanoseo/generator-favicon-and-logo.git
cd generator-favicon-and-logo

# install dependencies (also runs `prisma generate`)
npm install

# create the .env file and the SQLite database
cp .env.example .env
npx prisma db push

# start the dev server
npm run dev
```

Open **http://localhost:3000** — it redirects straight to the generator at `/generator`.

---

## Production deployment (your own domain)

The app is a standard Next.js server. Below is a VPS setup using PM2 + nginx; any
Node host works.

### 1. Install Node and PM2 (once)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm i -g pm2
```

### 2. Deploy the app

```bash
# copy the project to the server, e.g. /var/www/favicon-generator
cd /var/www/favicon-generator

npm ci
cp .env.example .env
npx prisma db push
npm run build
```

### 3. Run it with PM2

`ecosystem.config.js` is included (adjust `cwd` to your path). It runs the server on
port 3000 and restarts on reboot.

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # run the line it prints
```

### 4. Put nginx in front

A ready-to-edit config is in [`deploy/nginx.conf`](deploy/nginx.conf) — change
`server_name` to your domain, then:

```bash
cp deploy/nginx.conf /etc/nginx/sites-available/favicon-generator
ln -s /etc/nginx/sites-available/favicon-generator /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

For HTTPS:

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

> **Want to keep it private?** `deploy/nginx.conf` includes commented instructions for
> protecting the app with HTTP Basic Auth.

### Updating later

```bash
git pull
npm ci
npm run build
pm2 reload favicon-generator
```

---

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `file:./factory.db` | SQLite database location (resolved relative to `prisma/`). |

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── export/      server-side resize + ZIP packaging (sharp)
│   │   ├── favicons/    persistence of generated records
│   │   └── projects/    saved projects
│   └── generator/       the single app page
├── components/generator/   editor UI, panels, preview grid, export panel
└── lib/
    ├── store.ts            Zustand store (all app state)
    ├── engine/             SVG render core, logo/wordmark, fonts, presets, uniqueness…
    └── export/             client export pipeline + HTML/manifest snippets
```

---

## License

[MIT](LICENSE) © Akuma no SEO
