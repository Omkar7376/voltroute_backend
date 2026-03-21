const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { User } = require("../models");
const { signToken } = require("../utils/jwt");
const { badRequest, created, ok, unauthorized, serverError } = require("../utils/responses");

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

module.exports = { register, login };

