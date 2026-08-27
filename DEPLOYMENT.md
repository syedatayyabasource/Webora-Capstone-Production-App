# Webora deployment

## Option A — one Node service (recommended for the capstone demo)

1. Build the frontend:
   `npm run build`
2. Start the API:
   `npm start`
3. The Express server serves `client/dist` when it exists, so one public service can host both the API and the React application.
4. Set environment variables on the host:
   - `PORT` — supplied by the host when required
   - `JWT_SECRET` — long random secret
   - `CLIENT_ORIGIN` — your public origin
5. The SQLite database is created in `server/data/webora.db` on first start.

For a persistent production database, attach a persistent disk/volume to the Node service. Without persistent storage, SQLite data may reset when a host replaces the instance.

## Option B — split frontend and backend

Frontend: build `client` and deploy `client/dist` to a static host.
Backend: deploy `server` as a Node service.

Set the frontend environment variable:
`VITE_API_URL=https://YOUR-API-DOMAIN/api`

Set the backend environment variable:
`CLIENT_ORIGIN=https://YOUR-FRONTEND-DOMAIN`

## Production security checklist

- Replace all demo passwords.
- Use a strong random `JWT_SECRET`.
- Use HTTPS.
- Keep the SQLite volume persistent if using SQLite in production.
- Do not commit `.env` or the generated database.
- Create a real admin account before public launch.
