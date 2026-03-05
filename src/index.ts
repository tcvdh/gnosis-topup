import { app } from "./api.js";
import { checkAndTopUp } from "./topupService.js";
import { readConfig } from "./configManager.js";

let daemonInterval: NodeJS.Timeout;

async function start() {
  app.listen(3000, "0.0.0.0", () => {
    console.log("API Server running on http://0.0.0.0:3000");
  });

  const config = await readConfig();
  console.log("Starting Gnosis Auto-Top-Up Daemon...");

  checkAndTopUp();
  daemonInterval = setInterval(checkAndTopUp, config.checkIntervalMs);
}

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  clearInterval(daemonInterval);
  process.exit(0);
});

start();
