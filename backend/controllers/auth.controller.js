const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { User } = require("../models");
const { signToken } = require("../utils/jwt");
const { badRequest, created, ok, unauthorized, forbidden, serverError } = require("../utils/responses");

function verifySetupSecret(provided, expected) {
  if (!expected) return false;
  const a = crypto.createHash("sha256").update(String(provided), "utf8").digest();
  const b = crypto.createHash("sha256").update(String(expected), "utf8").digest();
  return crypto.timingSafeEqual(a, b);
}

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const { name, email, password } = req.body;
    const role = req.body.role || "user";
    if (!["user", "vendor"].includes(role)) {
      return badRequest(res, "Only user/vendor self-registration is allowed");
    }

    const existing = await User.findOne({ email });
    if (existing) return badRequest(res, "Email already registered");

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      is_approved: role === "vendor" ? false : true,
    });
    return created(
      res,
      {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        is_approved: user.is_approved,
      },
      role === "vendor" ? "Registered. Awaiting admin approval." : "Registered"
    );
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return unauthorized(res, "Invalid credentials");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return unauthorized(res, "Invalid credentials");
    if (user.is_banned) return unauthorized(res, "Account is banned");
    if (user.role === "vendor" && !user.is_approved) {
      return unauthorized(res, "Vendor account is not approved yet");
    }

    const token = signToken({
      id: String(user._id),
      email: user.email,
      role: user.role,
      name: user.name,
      is_approved: user.is_approved,
    });
    return ok(
      res,
      {
        token,
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          is_approved: user.is_approved,
        },
      },
      "Logged in"
    );
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

/** First admin only: no JWT. Requires ADMIN_SETUP_SECRET in .env and matching body.setup_secret. */
async function bootstrapFirstAdmin(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  const expected = process.env.ADMIN_SETUP_SECRET;
  if (!expected || String(expected).length < 16) {
    return forbidden(res, "Bootstrap is disabled. Set ADMIN_SETUP_SECRET (16+ chars) in .env or use the create_admin script.");
  }
  if (!verifySetupSecret(String(req.body.setup_secret || ""), expected)) {
    return forbidden(res, "Invalid setup secret");
  }

  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount > 0) {
      return forbidden(
        res,
        "An admin already exists. Log in as admin and send Authorization: Bearer <token> to POST /api/admin/admins."
      );
    }

    const { name, email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      existing.role = "admin";
      existing.is_approved = true;
      if (name) existing.name = String(name).trim();
      if (password) existing.password = await bcrypt.hash(String(password), 10);
      await existing.save();
      const safe = await User.findById(existing._id).select("-password");
      return ok(res, safe, "Existing user promoted to admin");
    }

    const hashed = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashed,
      role: "admin",
      is_approved: true,
    });
    const safe = await User.findById(user._id).select("-password");
    return created(res, safe, "First admin created. Log in at POST /api/login, then use Bearer token for other admin routes.");
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

module.exports = { register, login, bootstrapFirstAdmin };

