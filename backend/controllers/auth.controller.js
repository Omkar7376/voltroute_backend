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
    const existing = await User.findOne({ email });
    if (existing) return badRequest(res, "Email already registered");

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: "user" });
    return created(
      res,
      { id: String(user._id), name: user.name, email: user.email, role: user.role },
      "Registered"
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

    const token = signToken({ id: String(user._id), email: user.email, role: user.role, name: user.name });
    return ok(
      res,
      { token, user: { id: String(user._id), name: user.name, email: user.email, role: user.role } },
      "Logged in"
    );
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

module.exports = { register, login };

