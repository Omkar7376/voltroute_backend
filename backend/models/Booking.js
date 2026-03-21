const { mongoose } = require("../config/db");
const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    station_id: { type: Schema.Types.ObjectId, ref: "ChargingStation", required: true },
    booking_time: { type: Date, required: true },
    status: { type: String, enum: ["booked", "cancelled", "completed"], default: "booked" },
  },
  {
    collection: "bookings",
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false,
  }
);

bookingSchema.index({ user_id: 1 });
bookingSchema.index({ station_id: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;

