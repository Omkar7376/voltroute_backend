const { validationResult } = require("express-validator");
const { ChargingStation, Booking, Favorite } = require("../models");
const {
  ok,
  badRequest,
  notFound,
  serverError,
  created,
} = require("../utils/responses");

async function listStations(req, res) {
  try {
    const stations = await ChargingStation.find().sort({ _id: -1 });
    return ok(res, stations);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function getStation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const station = await ChargingStation.findById(req.params.id);
    if (!station) return notFound(res, "Station not found");
    return ok(res, station);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function bookStation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  const userId = req.user.id;
  const { station_id, booking_time } = req.body;

  try {
    const stationExists = await ChargingStation.exists({ _id: station_id });
    if (!stationExists) return notFound(res, "Station not found");

    const station = await ChargingStation.findOneAndUpdate(
      { _id: station_id, available_slots: { $gt: 0 } },
      { $inc: { available_slots: -1 } },
      { new: true }
    );
    if (!station) return badRequest(res, "No available slots");

    let booking;
    try {
      booking = await Booking.create({
        user_id: userId,
        station_id,
        booking_time: new Date(booking_time),
        status: "booked",
      });
    } catch (createErr) {
      await ChargingStation.updateOne({ _id: station_id }, { $inc: { available_slots: 1 } });
      throw createErr;
    }

    return created(
      res,
      { booking, station: { id: String(station._id), available_slots: station.available_slots } },
      "Booking confirmed"
    );
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function myBookings(req, res) {
  try {
    const bookingDocs = await Booking.find({ user_id: req.user.id })
      .populate("station_id")
      .sort({ _id: -1 });
    const bookings = bookingDocs.map((b) => ({
      ...b.toObject(),
      station: b.station_id,
    }));
    return ok(res, bookings);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function favoriteStation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const user_id = req.user.id;
    const { station_id } = req.body;

    const station = await ChargingStation.findById(station_id);
    if (!station) return notFound(res, "Station not found");

    let createdFlag = false;
    let fav = await Favorite.findOne({ user_id, station_id });
    if (!fav) {
      fav = await Favorite.create({ user_id, station_id });
      createdFlag = true;
    }

    return ok(res, { favorite: fav, created: createdFlag }, createdFlag ? "Favorited" : "Already favorited");
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

module.exports = {
  listStations,
  getStation,
  bookStation,
  myBookings,
  favoriteStation,
};

