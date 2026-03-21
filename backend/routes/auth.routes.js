const express = require("express");
const { body } = require("express-validator");
const { register, login } = require("../controllers/auth.controller");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2, max: 120 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6, max: 100 }),
    body("role").optional().isIn(["user", "vendor"]),
  ],
  register
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").isString().isLength({ min: 1 })],
  login
);

module.exports = router;

