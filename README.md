# EV Backend (Express + Mongoose + MongoDB)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your env file:

- Copy `.env.example` to `.env`
- Fill in `MONGODB_URI`, optional `MONGODB_DB`, and `JWT_SECRET`

3. Create a MongoDB database/cluster and connection URI.

Example URI:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/ev_db
```

4. Start the server:

```bash
npm run dev
```

Health check: `GET /health`

## API Routes

Base: `/api`

### Auth
- `POST /register`
- `POST /login`

### User
- `GET /stations`
- `GET /stations/:id`
- `POST /book` (Bearer token)
- `GET /my-bookings` (Bearer token)
- `POST /favorite` (Bearer token)

### Admin (Bearer token + role=admin)
- `POST /admin/station`
- `PUT /admin/station/:id`
- `DELETE /admin/station/:id`
- `GET /admin/users`
- `GET /admin/bookings`

## Notes
- Booking keeps atomic slot control with `findOneAndUpdate(...available_slots: {$gt: 0})`.
- Route IDs are Mongo ObjectIds now (`station_id` and `:id` params).

