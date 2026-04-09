const bcrypt = require("bcryptjs");
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
      vendor_id: req.user.id,
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
    const users = await User.find(
      {},
      { name: 1, email: 1, role: 1, is_approved: 1, is_banned: 1, created_at: 1 }
    ).sort({ _id: -1 });
    return ok(res, users);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function listBookings(req, res) {
  try {
    const bookings = await Booking.find().populate("user_id station_id").sort({ _id: -1 });
    return ok(res, bookings);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function listVendors(req, res) {
  try {
    const vendors = await User.find(
      { role: "vendor" },
      { name: 1, email: 1, role: 1, is_approved: 1, is_banned: 1, created_at: 1 }
    ).sort({ _id: -1 });
    return ok(res, vendors);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function listPendingVendors(req, res) {
  try {
    const vendors = await User.find(
      { role: "vendor", is_approved: false },
      { name: 1, email: 1, role: 1, is_approved: 1, is_banned: 1, created_at: 1 }
    ).sort({ _id: -1 });
    return ok(res, vendors);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function approveVendor(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const vendor = await User.findOneAndUpdate(
      { _id: req.params.id, role: "vendor" },
      { $set: { is_approved: true } },
      { new: true }
    );
    if (!vendor) return notFound(res, "Vendor not found");
    return ok(res, vendor, "Vendor approved");
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function approveVendorByEmail(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const email = String(req.body.email).toLowerCase().trim();
    const vendor = await User.findOneAndUpdate(
      { email, role: "vendor" },
      { $set: { is_approved: true } },
      { new: true }
    );
    if (!vendor) return notFound(res, "Vendor not found");
    return ok(res, vendor, "Vendor approved");
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function rejectVendor(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const vendor = await User.findOneAndUpdate(
      { _id: req.params.id, role: "vendor" },
      { $set: { is_approved: false } },
      { new: true }
    );
    if (!vendor) return notFound(res, "Vendor not found");
    return ok(res, vendor, "Vendor rejected/suspended");
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function banUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { is_banned: true } }, { new: true });
    if (!user) return notFound(res, "User not found");
    return ok(res, user, "User banned");
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function unbanUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { is_banned: false } }, { new: true });
    if (!user) return notFound(res, "User not found");
    return ok(res, user, "User unbanned");
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function createAdminUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, "Validation error", errors.array());

  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      existing.role = "admin";
      existing.is_approved = true;
      if (name) existing.name = String(name).trim();
      if (password) existing.password = await bcrypt.hash(String(password), 10);
      await existing.save();
      const safe = await User.findById(existing._id).select("-password");
      return ok(res, safe, "User updated to admin");
    }

    if (!password) return badRequest(res, "Password is required for new admin accounts");

    const hashed = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashed,
      role: "admin",
      is_approved: true,
    });
    const safe = await User.findById(user._id).select("-password");
    return created(res, safe, "Admin created");
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
}

async function dashboardStats(req, res) {
  try {
    const [users, vendors, approvedVendors, stations, bookings, activeStationsData] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "vendor" }),
      User.countDocuments({ role: "vendor", is_approved: true }),
      ChargingStation.countDocuments({}),
      Booking.countDocuments({}),
      ChargingStation.find({ available_slots: { $gt: 0 } }).sort({ _id: -1 }),
    ]);
    return ok(res, { 
      users, 
      vendors, 
      approved_vendors: approvedVendors, 
      stations, 
      bookings,
      active_stations_data: activeStationsData 
    });
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
  listVendors,
  approveVendor,
  approveVendorByEmail,
  rejectVendor,
  banUser,
  unbanUser,
  createAdminUser,
  dashboardStats,
  listPendingVendors,
};

