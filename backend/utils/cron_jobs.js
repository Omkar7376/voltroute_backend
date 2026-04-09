const { Booking, ChargingStation } = require("../models");

function startCronJobs() {
  // Run every 1 minute
  setInterval(async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Find bookings that are older than 1 hour and still 'booked'
      const expiredBookings = await Booking.find({
        status: "booked",
        booking_time: { $lt: oneHourAgo }
      });

      if (expiredBookings.length === 0) return;

      console.log(`[Cron] Found ${expiredBookings.length} expired bookings. Updating to rejected...`);

      for (const booking of expiredBookings) {
        // Update booking status
        booking.status = "rejected";
        await booking.save();

        // Increment available slots for the station
        await ChargingStation.updateOne(
          { _id: booking.station_id },
          { $inc: { available_slots: 1 } }
        );
      }
      
      console.log(`[Cron] Successfully rejected ${expiredBookings.length} expired bookings.`);
    } catch (err) {
      console.error("[Cron Error] Failed to process expired bookings:", err);
    }
  }, 60 * 1000); // 1 minute interval
}

module.exports = {
  startCronJobs,
};
