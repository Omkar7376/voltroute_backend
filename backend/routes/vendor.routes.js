const express = require("express");
const { body, param } = require("express-validator");

const verifyToken = require("../middleware/verifyToken");
const checkRole = require("../middleware/checkRole");
const {
  createStation,
  listMyStations,
  updateMyStation,
  deleteMyStation,
  myStationBookings,
  updateBookingStatus,
} = require("../controllers/vendor.controller");

const router = express.Router();

const vendorOnly = [verifyToken, checkRole("vendor")];

router.post(
  "/vendor/station",
  ...vendorOnly,
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

router.get("/vendor/stations", ...vendorOnly, listMyStations);

router.put(
  "/vendor/station/:id",
  ...vendorOnly,
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
  updateMyStation
);

router.delete("/vendor/station/:id", ...vendorOnly, [param("id").isMongoId()], deleteMyStation);
router.get("/vendor/bookings", ...vendorOnly, myStationBookings);
router.patch("/vendor/bookings/:id/status", ...vendorOnly, [param("id").isMongoId()], updateBookingStatus);

module.exports = router;

