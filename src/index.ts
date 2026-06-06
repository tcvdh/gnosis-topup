import { app } from "./api.js";
import { checkAndTopUp } from "./topupService.js";
import { readConfig, configEvents } from "./configManager.js";

let daemonInterval: NodeJS.Timeout;

function setDaemonInterval(ms: number) {
  if (daemonInterval) {
    clearInterval(daemonInterval);
  }
  daemonInterval = setInterval(checkAndTopUp, ms);
  console.log(`Daemon interval set to ${ms} ms`);
}

async function start() {
  app.listen(3000, "0.0.0.0", () => {
    console.log("API Server running on http://0.0.0.0:3000");
  });

  const config = await readConfig();
  console.log("Starting Gnosis Auto-Top-Up Daemon...");

  checkAndTopUp();
  daemonInterval = setInterval(checkAndTopUp, config.checkIntervalMs);

  configEvents.on("configUpdated", (newConfig) => {
    console.log("Config updated, adjusting daemon interval...");
    setDaemonInterval(newConfig.checkIntervalMs);
    checkAndTopUp();
  });
}

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  clearInterval(daemonInterval);
  process.exit(0);
});

start();
