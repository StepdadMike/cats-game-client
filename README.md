# Party Game Client

React-based frontend for the Party Game application.

## Deployment

### Vercel
1. Create `.env.production.local` with your server URL:
   ```
   VITE_WS_URL=https://your-server-domain.com/ws
   ```
2. Deploy: `vercel deploy`

### Coolify
1. Set environment variable `VITE_WS_URL` to your server URL
2. Build command: `npm install && npm run build`
3. Output directory: `dist`
4. Start command: Not needed (static site)

## Local Development

Create `.env.local` with your server URL:
```bash
VITE_WS_URL=ws://localhost:3001/ws
npm install
npm run dev
```

Client will run on `http://localhost:5173`

## Environment Variables

- `VITE_WS_URL` - WebSocket server URL (e.g., `ws://localhost:3001/ws` or `wss://example.com/ws`)
  - Local: `ws://localhost:3001/ws`
  - Production: `wss://your-server.com/ws` (note the `wss://` for secure)

## Build

```bash
npm run build
```

Output will be in `dist/` directory - deploy this to your static hosting provider.
