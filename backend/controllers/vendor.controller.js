const { validationResult } = require("express-validator");
const { ChargingStation, Booking } = require("../models");
const { ok, created, badRequest, notFound, forbidden, serverError } = require("../utils/responses");

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
      vendor_id: req.user.id,
    });
    return created(res, station, "Station created");
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function listMyStations(req, res) {
  try {
    const stations = await ChargingStation.find({ vendor_id: req.user.id }).sort({ _id: -1 });
    return ok(res, stations);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function updateMyStation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const station = await ChargingStation.findById(req.params.id);
    if (!station) return notFound(res, "Station not found");
    if (String(station.vendor_id) !== String(req.user.id)) return forbidden(res, "Cannot modify this station");

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

async function deleteMyStation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const station = await ChargingStation.findById(req.params.id);
    if (!station) return notFound(res, "Station not found");
    if (String(station.vendor_id) !== String(req.user.id)) return forbidden(res, "Cannot delete this station");

    await station.deleteOne();
    return ok(res, { id: String(station._id) }, "Station deleted");
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function myStationBookings(req, res) {
  try {
    const myStations = await ChargingStation.find({ vendor_id: req.user.id }, { _id: 1 });
    const stationIds = myStations.map((s) => s._id);
    const bookings = await Booking.find({ station_id: { $in: stationIds } })
      .populate("station_id user_id")
      .sort({ _id: -1 });
    return ok(res, bookings);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function updateBookingStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["booked", "cancelled", "completed", "rejected"];
    if (!allowedStatuses.includes(status?.toLowerCase())) {
      return badRequest(res, "Invalid status. Allowed: " + allowedStatuses.join(", "));
    }

    // Find booking and ensure it belongs to one of the vendor's stations
    const booking = await Booking.findById(id).populate("station_id");
    if (!booking) return notFound(res, "Booking not found");

    if (String(booking.station_id.vendor_id) !== String(req.user.id)) {
      return forbidden(res, "You do not have permission to update this booking");
    }

    booking.status = status.toLowerCase();
    await booking.save();

    const updated = await Booking.findById(id).populate("user_id station_id");
    return ok(res, updated, "Booking status updated to " + status);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

module.exports = {
  createStation,
  listMyStations,
  updateMyStation,
  deleteMyStation,
  myStationBookings,
  updateBookingStatus,
};

