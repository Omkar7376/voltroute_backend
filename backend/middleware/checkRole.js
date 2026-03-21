const { forbidden, unauthorized } = require("../utils/responses");

function checkRole(roleOrRoles) {
  const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  return (req, res, next) => {
    if (!req.user) return unauthorized(res, "Unauthorized");
    if (!roles.includes(req.user.role)) return forbidden(res, "Insufficient role");
    return next();
  };
}

module.exports = checkRole;

