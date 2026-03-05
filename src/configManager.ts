import fs from "fs/promises";
import path from "path";

export interface AppConfig {
  minBalance: number;
  topupAmount: number;
  checkIntervalMs: number;
}

const CONFIG_PATH = path.resolve("config.json");

export async function readConfig(): Promise<AppConfig> {
  const data = await fs.readFile(CONFIG_PATH, "utf-8");
  return JSON.parse(data) as AppConfig;
}

export async function writeConfig(newConfig: AppConfig): Promise<void> {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2), "utf-8");
}
