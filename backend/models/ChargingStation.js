const { mongoose } = require("../config/db");
const { Schema } = mongoose;

const chargingStationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 180 },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    charger_type: { type: String, required: true, trim: true, maxlength: 80 },
    power_kw: { type: Number, required: true },
    price_per_kwh: { type: Number, required: true },
    available_slots: { type: Number, required: true, min: 0, default: 0 },
    total_slots: { type: Number, required: true, min: 0, default: 0 },
    vendor_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    collection: "charging_stations",
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false,
  }
);

chargingStationSchema.index({ vendor_id: 1 });
chargingStationSchema.index({ latitude: 1, longitude: 1 });

const ChargingStation = mongoose.model("ChargingStation", chargingStationSchema);

module.exports = ChargingStation;

