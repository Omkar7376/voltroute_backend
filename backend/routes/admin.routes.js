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
router.get("/admin/bookings", verifyToken, checkRole("admin"), listBookings);

module.exports = router;

