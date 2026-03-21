const express = require("express");
const { body, param } = require("express-validator");

const verifyToken = require("../middleware/verifyToken");
const {
  listStations,
  getStation,
  bookStation,
  myBookings,
  favoriteStation,
} = require("../controllers/user.controller");

const router = express.Router();

router.get("/stations", listStations);
router.get("/stations/:id", [param("id").isMongoId()], getStation);

router.post(
  "/book",
  verifyToken,
  [
    body("station_id").isMongoId(),
    body("booking_time").isISO8601(),
  ],
  bookStation
);

router.get("/my-bookings", verifyToken, myBookings);

router.post("/favorite", verifyToken, [body("station_id").isMongoId()], favoriteStation);

module.exports = router;

