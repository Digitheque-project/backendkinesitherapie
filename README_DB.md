Quick DB setup for projet_backend

1) Install dependencies:

```bash
npm install @nestjs/config @nestjs/typeorm typeorm pg
```

2) Replace `src/app.module.ts` with the contents of `src/app.module.typeorm.ts` (or copy the file content).

3) Ensure `.env` at project root contains the `DATABASE_URL` (already created).

4) Run the app:

```bash
npm run start:dev
```

Notes:
- `synchronize: false` is safer for production; adjust as needed.
- Render/Postgres requires SSL; the TypeORM config includes `extra.ssl.rejectUnauthorized=false` to allow the connection.
