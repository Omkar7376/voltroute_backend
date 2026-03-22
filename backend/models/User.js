const { mongoose } = require("../config/db");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 190 },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "vendor", "user"], default: "user" },
    is_approved: { type: Boolean, default: true },
    is_banned: { type: Boolean, default: false },
  },
  {
    collection: "users",
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;

