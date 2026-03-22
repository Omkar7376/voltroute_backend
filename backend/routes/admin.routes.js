const express = require("express");
const { body, param } = require("express-validator");

const verifyToken = require("../middleware/verifyToken");
const checkRole = require("../middleware/checkRole");
const {
  createStation,
  updateStation,
  deleteStation,
  listUsers,
  listBookings,
  listVendors,
  approveVendor,
  approveVendorByEmail,
  rejectVendor,
  banUser,
  unbanUser,
  createAdminUser,
  dashboardStats,
} = require("../controllers/admin.controller");

const router = express.Router();

router.post(
  "/admin/station",
  verifyToken,
  checkRole("admin"),
  [
    body("name").trim().isLength({ min: 2, max: 180 }),
    body("address").trim().isLength({ min: 5, max: 500 }),
    body("latitude").isDecimal(),
    body("longitude").isDecimal(),
    body("charger_type").trim().isLength({ min: 1, max: 80 }),
    body("power_kw").isDecimal(),
    body("price_per_kwh").isDecimal(),
    body("total_slots").isInt({ min: 0 }),
    body("available_slots").optional().isInt({ min: 0 }),
  ],
  createStation
);

router.put(
  "/admin/station/:id",
  verifyToken,
  checkRole("admin"),
  [
    param("id").isMongoId(),
    body("name").optional().trim().isLength({ min: 2, max: 180 }),
    body("address").optional().trim().isLength({ min: 5, max: 500 }),
    body("latitude").optional().isDecimal(),
    body("longitude").optional().isDecimal(),
    body("charger_type").optional().trim().isLength({ min: 1, max: 80 }),
    body("power_kw").optional().isDecimal(),
    body("price_per_kwh").optional().isDecimal(),
    body("total_slots").optional().isInt({ min: 0 }),
    body("available_slots").optional().isInt({ min: 0 }),
  ],
  updateStation
);

router.delete(
  "/admin/station/:id",
  verifyToken,
  checkRole("admin"),
  [param("id").isMongoId()],
  deleteStation
);

router.get("/admin/users", verifyToken, checkRole("admin"), listUsers);
router.get("/admin/vendors", verifyToken, checkRole("admin"), listVendors);
router.get("/admin/bookings", verifyToken, checkRole("admin"), listBookings);
router.get("/admin/dashboard/stats", verifyToken, checkRole("admin"), dashboardStats);
router.patch("/admin/vendors/:id/approve", verifyToken, checkRole("admin"), [param("id").isMongoId()], approveVendor);
router.patch(
  "/admin/vendors/approve-by-email",
  verifyToken,
  checkRole("admin"),
  [body("email").isEmail().normalizeEmail()],
  approveVendorByEmail
);
router.post(
  "/admin/admins",
  verifyToken,
  checkRole("admin"),
  [
    body("name").trim().isLength({ min: 1, max: 120 }),
    body("email").isEmail().normalizeEmail(),
    body("password").optional({ values: "falsy" }).isLength({ min: 6, max: 128 }),
  ],
  createAdminUser
);
router.patch("/admin/vendors/:id/reject", verifyToken, checkRole("admin"), [param("id").isMongoId()], rejectVendor);
router.patch("/admin/users/:id/ban", verifyToken, checkRole("admin"), [param("id").isMongoId()], banUser);
router.patch("/admin/users/:id/unban", verifyToken, checkRole("admin"), [param("id").isMongoId()], unbanUser);

module.exports = router;

