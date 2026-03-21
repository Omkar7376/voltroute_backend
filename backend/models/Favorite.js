const { mongoose } = require("../config/db");
const { Schema } = mongoose;

const favoriteSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    station_id: { type: Schema.Types.ObjectId, ref: "ChargingStation", required: true },
  },
  {
    collection: "favorites",
    timestamps: false,
    versionKey: false,
  }
);

favoriteSchema.index({ user_id: 1, station_id: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", favoriteSchema);

module.exports = Favorite;

