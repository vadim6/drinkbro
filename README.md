# DrinkBro

A minimal drink ordering app for small gatherings. Guests browse a menu and place orders; whoever's making drinks watches a live queue on the barista screen.

Built with Next.js, SQLite (via better-sqlite3), and Server-Sent Events for real-time updates.

## How it works

- **Guest view** (`/drink/<slug>`) — pick a drink, add your name, tap to order
- **Barista view** (`/barista/<slug>`) — live order queue, tap to mark done, revert, or reset
- **Root** (`/`) — returns 404, keeping the app undiscoverable by default

Access is gated by a secret URL slug. Generate one and share it as a QR code — guests scan it and they're in. No accounts, no passwords.

## Getting started

```bash
npm install
npm run dev
```

Create a `.env.local` file (gitignored):

```
HASH_SLUG=your_secret_slug
```

Then open `http://localhost:3000/drink/your_secret_slug`.

If `HASH_SLUG` is not set, any slug is accepted (useful for local development).

To generate a slug:

```bash
openssl rand -hex 8
```

To test from another device on your local network, add your machine's IP to `next.config.ts`:

```ts
allowedDevOrigins: ["192.168.x.x"],
```

## Customizing the menu

Edit `menu.json`. Each drink references customization IDs defined in the `customizations` map.

```json
{
  "customizations": {
    "milk": { "label": "Milk", "type": "select", "options": ["Whole", "Oat"], "default": "Whole" },
    "sugar": { "label": "Sugar", "type": "toggle", "default": false }
  },
  "drinks": [
    { "id": "latte", "name": "Latte", "emoji": "☕", "customizations": ["milk", "sugar"] }
  ]
}
```

Customization types:
- `toggle` — checkbox, adds the label when true
- `select` — dropdown from `options`, shown when not the default

## Deploying

The app uses SQLite on disk. For persistent storage across restarts, mount a volume and set `DB_PATH`.

### Fly.io

```bash
fly launch
fly volumes create drinkbro_data --size 1
fly secrets set HASH_SLUG=your_secret_slug
fly deploy
```

The included `fly.toml` and `Dockerfile` are ready to go. The DB is stored at `/data/orders.db` on the mounted volume.

### Docker

```bash
docker build -t drinkbro .
docker run -p 3000:3000 -e HASH_SLUG=your_secret_slug -v ./data:/data drinkbro
```

## Tech stack

- [Next.js](https://nextjs.org) (App Router, standalone output)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Tailwind CSS v4](https://tailwindcss.com)
- Server-Sent Events for live queue updates
