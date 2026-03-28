# DrinkBro

A minimal drink ordering app for small gatherings. Guests browse a menu and place orders; whoever's making drinks watches a live queue on the admin screen.

Built with Next.js, SQLite (via better-sqlite3), and Server-Sent Events for real-time updates.

## How it works

- **Guest view** (`/drink`) — pick a drink, add your name, tap to order
- **Admin view** (`/admin`) — live order queue, tap to mark done, reset to clear all

> **Note:** The admin page has no authentication. It's intended for trusted local networks (e.g. a party at home). Don't expose this publicly without adding auth.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
fly deploy
```

The included `fly.toml` and `Dockerfile` are ready to go. The DB is stored at `/data/orders.db` on the mounted volume.

### Docker

```bash
docker build -t drinkbro .
docker run -p 3000:3000 -v ./data:/data drinkbro
```

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, standalone output)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Tailwind CSS v4](https://tailwindcss.com)
- Server-Sent Events for live queue updates
