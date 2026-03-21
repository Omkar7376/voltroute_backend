require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { notFound, serverError } = require("./utils/responses");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
const vendorRoutes = require("./routes/vendor.routes");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", vendorRoutes);
app.use("/api", adminRoutes);

app.use((req, res) => notFound(res, "Route not found"));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  return serverError(res, err.message || "Unexpected error");
});

module.exports = app;

