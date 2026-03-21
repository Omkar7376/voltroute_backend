require("dotenv").config();
const mongoose = require("mongoose");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || undefined,
  });

  const db = mongoose.connection.db;

  const r1 = await db.collection("users").updateMany(
    { is_approved: { $exists: false } },
    [{ $set: { is_approved: { $cond: [{ $eq: ["$role", "vendor"] }, false, true] } } }]
  );

  const r2 = await db.collection("users").updateMany(
    { is_banned: { $exists: false } },
    { $set: { is_banned: false } }
  );

  const r3 = await db.collection("users").updateMany(
    { role: { $nin: ["admin", "vendor", "user"] } },
    { $set: { role: "user" } }
  );

  const r4 = await db.collection("charging_stations").updateMany(
    { vendor_id: { $exists: false }, created_by: { $exists: true } },
    [{ $set: { vendor_id: "$created_by" } }]
  );

  const r5 = await db.collection("charging_stations").updateMany(
    { created_by: { $exists: true } },
    { $unset: { created_by: "" } }
  );

  console.log(
    JSON.stringify(
      {
        users_isApproved: r1.modifiedCount,
        users_isBanned: r2.modifiedCount,
        users_roleNormalized: r3.modifiedCount,
        stations_vendorBackfill: r4.modifiedCount,
        stations_createdByRemoved: r5.modifiedCount,
      },
      null,
      2
    )
  );
}

run()
  .then(async () => {
    await mongoose.disconnect();
  })
  .catch(async (err) => {
    console.error("Migration failed:", err);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // ignore disconnect errors after failure
    }
    process.exit(1);
  });

