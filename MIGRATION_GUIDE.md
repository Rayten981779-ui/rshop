PostgreSQL Migration & Render Deployment Guide

1) Create a Render PostgreSQL database and copy the `DATABASE_URL`.

2) Set environment variables on Render (or locally in `.env`):

  - `DATABASE_URL` (provided by Render)
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL`
  - `JWT_SECRET`
  - `SESSION_SECRET`
  - `PORT` (optional)

3) Run database migrations locally or on the server:

  ```bash
  psql "$DATABASE_URL" -f migrations/create_tables.sql
  ```

4) Seed default products (optional) using psql INSERT statements.

5) Update `package.json` dependencies (already updated). Install:

  ```bash
  npm install
  ```

6) Start the server locally:

  ```bash
  node server.js
  ```

7) Deploy to Render: create a Web Service, link repo, set build command `npm install`, start command `node server.js`, add environment variables, and deploy.

Security notes:
 - Ensure `DATABASE_URL` contains SSL config if using Render (the code enables ssl rejectUnauthorized false when NODE_ENV=production).
 - Rotate `JWT_SECRET` and `SESSION_SECRET` to secure values.
