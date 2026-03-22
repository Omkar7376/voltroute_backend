const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const { connectDB, mongoose } = require("../config/db");
require("../models");
const { User } = require("../models");

async function approveVendor(email) {
  if (!email) {
    console.error("Usage: node backend/scripts/approve_vendor.js <email>");
    process.exit(1);
  }

  try {
    await connectDB();
    console.log("Connected to database...");

    const user = await User.findOne({ email: email.toLowerCase().trim(), role: "vendor" });
    if (!user) {
      console.error(`Vendor with email ${email} not found.`);
      process.exit(1);
    }

    if (user.is_approved) {
      console.log(`Vendor ${email} is already approved.`);
    } else {
      user.is_approved = true;
      await user.save();
      console.log(`Successfully approved vendor: ${email}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

const email = process.argv[2];
approveVendor(email);
