const express = require("express");
const { body, param } = require("express-validator");

const verifyToken = require("../middleware/verifyToken");
const checkRole = require("../middleware/checkRole");
const {
  listStations,
  getStation,
  bookStation,
  myBookings,
  cancelBooking,
  favoriteStation,
} = require("../controllers/user.controller");

const router = express.Router();

router.get("/stations", listStations);
router.get("/stations/:id", [param("id").isMongoId()], getStation);

router.post(
  "/book",
  verifyToken,
  checkRole("user"),
  [
    body("station_id").isMongoId(),
    body("booking_time").isISO8601(),
  ],
  bookStation
);

router.get("/my-bookings", verifyToken, checkRole("user"), myBookings);
router.patch("/my-bookings/:id/cancel", verifyToken, checkRole("user"), [param("id").isMongoId()], cancelBooking);

router.post("/favorite", verifyToken, checkRole("user"), [body("station_id").isMongoId()], favoriteStation);

module.exports = router;

