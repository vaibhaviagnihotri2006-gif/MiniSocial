# MiniSocial — Mini Social Media Platform

A full-stack social media platform: user auth, profiles, posts with image
uploads, likes, comments, and a follow system.

**Stack:** Node.js / Express / MongoDB (Mongoose) on the backend, vanilla
HTML/CSS/ES6 JavaScript on the frontend, JWT + bcrypt for auth, Multer for
image uploads.

```
mini-social/
├── server/     Express REST API (MVC + service layer)
└── client/     Static vanilla JS frontend (multi-page)
```

## 1. Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or any MongoDB 6+ instance) and its connection
  string
- npm

## 2. Backend setup

```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, CORS_ORIGIN
npm install
npm run dev      # nodemon, auto-restarts on changes
# or
npm start        # plain node
```

The API listens on `http://localhost:5000` by default. Health check:
`GET http://localhost:5000/api/health`.

### Environment variables (`server/.env`)

| Variable            | Description                                           |
|---------------------|--------------------------------------------------------|
| `NODE_ENV`           | `development` or `production`                         |
| `PORT`                | Port the API listens on (default `5000`)              |
| `MONGO_URI`           | MongoDB Atlas connection string                       |
| `JWT_SECRET`          | Long random secret used to sign JWTs                  |
| `JWT_EXPIRES_IN`      | Token lifetime, e.g. `1h`                              |
| `CORS_ORIGIN`         | Comma-separated list of allowed frontend origins       |
| `MAX_UPLOAD_SIZE_MB`  | Max image upload size in MB (default `5`)              |

## 3. Frontend setup

The client is static — no build step. Serve it with any static file server,
for example:

```bash
cd client
npx serve .          # or: python3 -m http.server 5500
```

Open `http://localhost:5500` (or whatever port your server prints).

Before running against a deployed backend, update
`client/js/config.js` → `API_BASE_URL` with your Render backend URL.

## 4. API overview

All endpoints are prefixed with `/api`. Authenticated routes require an
`Authorization: Bearer <token>` header.

| Method | Route                          | Description                     | Auth |
|--------|---------------------------------|----------------------------------|------|
| POST   | /auth/register                  | Create account                   | No   |
| POST   | /auth/login                     | Log in                           | No   |
| GET    | /auth/me                        | Current user profile             | Yes  |
| GET    | /users?search=&page=&limit=     | Search users                     | Yes  |
| GET    | /users/:id                      | Get user by id                   | Yes  |
| GET    | /users/username/:username       | Get user by username             | Yes  |
| PUT    | /users/profile                  | Update own profile (multipart)   | Yes  |
| POST   | /users/follow/:id                | Follow a user                    | Yes  |
| DELETE | /users/unfollow/:id              | Unfollow a user                  | Yes  |
| GET    | /posts?page=&limit=&user=        | Feed / user posts                | Yes  |
| POST   | /posts                          | Create post (multipart, optional image) | Yes |
| GET    | /posts/:id                      | Get single post                  | Yes  |
| PUT    | /posts/:id                      | Edit own post caption            | Yes  |
| DELETE | /posts/:id                      | Delete own post                  | Yes  |
| POST   | /posts/:id/like                  | Like a post                      | Yes  |
| DELETE | /posts/:id/unlike                | Unlike a post                    | Yes  |
| GET    | /posts/:id/comments               | List comments on a post          | Yes  |
| POST   | /posts/:id/comments               | Add a comment                    | Yes  |
| DELETE | /comments/:id                    | Delete own comment / post owner  | Yes  |
| GET    | /health                         | Service health check             | No   |

Every response follows: `{ "success": bool, "message": string, "data": ... }`.
Errors follow: `{ "success": false, "message": string, "error": { "code", "fields" } }`.

## 5. Security

- Passwords hashed with bcrypt (cost factor 11)
- JWT-based stateless auth
- helmet for security headers, CORS allowlist
- express-rate-limit (stricter on `/auth/*`)
- Custom NoSQL-injection sanitizer on body/params/query
- Multer file-type and size validation for uploads
- Ownership checks on every post/comment mutation

## 6. Deployment

### Backend → Render

1. Push `server/` to a Git repository (or the whole monorepo).
2. In Render, create a new **Web Service** pointing at the repo, root
   directory `server`, build command `npm install`, start command
   `npm start`. `render.yaml` in `server/` can also be used as a Blueprint.
3. Set the environment variables from the table above (`MONGO_URI`,
   `JWT_SECRET`, `CORS_ORIGIN` — set this to your Netlify URL — etc.) in the
   Render dashboard.
4. Uploaded images are stored on local disk under `server/uploads` and
   served at `/uploads/<file>`. Render's filesystem is ephemeral on redeploy;
   for a persistent production setup, mount a Render Disk at `server/uploads`
   or swap the storage layer for an object store (S3, Cloudinary, etc).

### Frontend → Netlify

1. Push `client/` to a Git repository.
2. In Netlify, create a new site from Git, base directory `client`,
   publish directory `client` (or `.` if `client` is the repo root), no
   build command needed.
3. Before deploying, update `client/js/config.js` with your Render API URL.
4. `netlify.toml` in `client/` configures the 404 fallback and basic
   security headers.

## 7. Project structure (MVC + services)

```
server/
├── server.js              entry point
├── app.js                 Express app assembly (middleware + routes)
├── config/                env loader, DB connection
├── models/                Mongoose schemas (User, Post, Comment)
├── middleware/             auth, validation, rate limiting, upload, errors
├── controllers/            thin HTTP layer, calls services
├── services/                business logic, DB queries
├── routes/                  route definitions + validation chains
└── uploads/                 uploaded images (gitignored)

client/
├── index.html               landing page
├── pages/                   login, register, feed, profile, edit-profile,
│                             post, search, 404
├── css/                      base tokens, shared components, per-page styles
└── js/
    ├── config.js             API base URL
    ├── api/client.js         fetch wrapper (auth header, error normalization)
    ├── state/                 auth session + pub-sub event bus
    ├── components/            navbar, postCard, commentThread
    ├── pages/                  one controller module per HTML page
    └── utils/                  validators, router helpers, toast, time
```
