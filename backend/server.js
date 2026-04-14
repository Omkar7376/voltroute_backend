const app = require("./app");
const { connectDB } = require("./config/db");
require("./models");

const { startCronJobs } = require("./utils/cron_jobs");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function start() {
  await connectDB();
  
    startCronJobs();

  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

