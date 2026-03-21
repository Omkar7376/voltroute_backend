const { validationResult } = require("express-validator");
const { ChargingStation, User, Booking } = require("../models");
const { ok, created, badRequest, notFound, serverError } = require("../utils/responses");

async function createStation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const payload = req.body;
    const station = await ChargingStation.create({
      name: payload.name,
      address: payload.address,
      latitude: payload.latitude,
      longitude: payload.longitude,
      charger_type: payload.charger_type,
      power_kw: payload.power_kw,
      price_per_kwh: payload.price_per_kwh,
      total_slots: payload.total_slots,
      available_slots: payload.available_slots ?? payload.total_slots,
      created_by: req.user.id,
    });
    return created(res, station, "Station created");
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function updateStation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const station = await ChargingStation.findById(req.params.id);
    if (!station) return notFound(res, "Station not found");

    const allowed = [
      "name",
      "address",
      "latitude",
      "longitude",
      "charger_type",
      "power_kw",
      "price_per_kwh",
      "available_slots",
      "total_slots",
    ];
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) station[key] = req.body[key];
    }

    await station.save();
    return ok(res, station, "Station updated");
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function deleteStation(req, res) {
  try {
    const station = await ChargingStation.findById(req.params.id);
    if (!station) return notFound(res, "Station not found");
    await station.deleteOne();
    return ok(res, { id: String(station._id) }, "Station deleted");
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function listUsers(req, res) {
  try {
    const users = await User.find({}, { name: 1, email: 1, role: 1, created_at: 1 }).sort({ _id: -1 });
    return ok(res, users);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function listBookings(req, res) {
  try {
    const bookings = await Booking.find().sort({ _id: -1 });
    return ok(res, bookings);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

module.exports = {
  createStation,
  updateStation,
  deleteStation,
  listUsers,
  listBookings,
};

