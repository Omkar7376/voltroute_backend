const jwt = require("jsonwebtoken");
const { unauthorized } = require("../utils/responses");

function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return unauthorized(res, "Missing token");

  const secret = process.env.JWT_SECRET;
  if (!secret) return unauthorized(res, "Server misconfigured");

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (err) {
    return unauthorized(res, "Invalid/expired token");
  }
}

module.exports = verifyToken;

