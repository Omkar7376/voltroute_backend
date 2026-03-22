const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const { connectDB, mongoose } = require("../config/db");
require("../models");
const { User } = require("../models");

async function createAdmin(name, email, password) {
  if (!name || !email || !password) {
    console.error("Usage: node backend/scripts/create_admin.js <name> <email> <password>");
    process.exit(1);
  }

  try {
    await connectDB();
    console.log("Connected to database...");

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      console.log(`User ${email} already exists. Updating role to admin...`);
      existing.role = "admin";
      existing.is_approved = true;
      await existing.save();
      console.log("Updated existing user to admin.");
    } else {
      const hashed = await bcrypt.hash(password, 10);
      await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashed,
        role: "admin",
        is_approved: true,
      });
      console.log(`Admin account created: ${email}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
createAdmin(args[0], args[1], args[2]);
