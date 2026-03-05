import express, { type Request, type Response, type NextFunction } from "express";
import { readConfig, writeConfig } from "./configManager.js";

const API_KEY = process.env.API_AUTH_KEY!;

if (!API_KEY) {
  throw new Error("Missing required environment variable: API_AUTH_KEY");
}

export const app = express();
app.use(express.json());

const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (token !== API_KEY) {
    res.status(403).json({ error: "Forbidden: Invalid API key" });
    return;
  }

  next();
};

app.get("/api/config", async (req: Request, res: Response) => {
  try {
    const config = await readConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: "Failed to read config" });
  }
});

app.post("/api/config", requireAuth, async (req: Request, res: Response) => {
  try {
    const currentConfig = await readConfig();
    const updatedConfig = { ...currentConfig, ...req.body };
    await writeConfig(updatedConfig);
    console.log("Configuration updated via API:", updatedConfig);
    res.json({ message: "Config updated successfully", config: updatedConfig });
  } catch (error) {
    res.status(500).json({ error: "Failed to update config" });
  }
});
