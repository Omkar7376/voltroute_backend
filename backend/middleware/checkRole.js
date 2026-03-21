const { forbidden, unauthorized } = require("../utils/responses");

function checkRole(role) {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res, "Unauthorized");
    if (req.user.role !== role) return forbidden(res, "Insufficient role");
    return next();
  };
}

module.exports = checkRole;

