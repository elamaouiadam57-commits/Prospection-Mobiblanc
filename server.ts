import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data files paths
const DATA_DIR = path.join(process.cwd(), "data");
const PMS_FILE = path.join(DATA_DIR, "pms.json");

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    // Initialize files if they don't exist
    const seeds = {
      [PMS_FILE]: [
        { id: 'pm1', leadId: '1', leadName: 'Sarah Jenkins', date: '2026-04-25T14:30:00Z', location: 'Visio', notes: 'Présentation de la roadmap produit.', status: 'Prévu' },
        { id: 'pm2', leadId: '3', leadName: 'Elena Rodriguez', date: '2026-04-20T10:00:00Z', location: 'Physique', notes: 'Discussion sur le budget Q3.', status: 'Terminé' }
      ]
    };

    for (const [file, seedData] of Object.entries(seeds)) {
      try {
        const stats = await fs.stat(file);
        if (stats.size <= 2) { // Just []
           await fs.writeFile(file, JSON.stringify(seedData, null, 2));
        }
      } catch {
        await fs.writeFile(file, JSON.stringify(seedData, null, 2));
      }
    }
  } catch (err) {
    console.error("Error creating data directory:", err);
  }
}

async function startServer() {
  await ensureDataDir();
  
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Airtable Proxy Endpoints
  app.all("/api/airtable/*", async (req, res) => {
    const pat = process.env.VITE_AIRTABLE_PAT || process.env.AIRTABLE_PAT;
    const baseId = process.env.VITE_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;
    
    if (!pat || !baseId) {
      return res.status(500).json({ error: "Airtable configuration missing on server" });
    }

    const subPath = req.params[0];
    const url = `https://api.airtable.com/v0/${baseId}/${subPath}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;

    try {
      const response = await fetch(url, {
        method: req.method,
        headers: {
          "Authorization": `Bearer ${pat}`,
          "Content-Type": "application/json",
        },
        body: ["POST", "PATCH", "PUT"].includes(req.method) ? JSON.stringify(req.body) : undefined,
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("Airtable Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // PMs Endpoints
  app.get("/api/pms", async (req, res) => {
    try {
      const data = await fs.readFile(PMS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (err) {
      res.status(500).json({ error: "Failed to read PMs" });
    }
  });

  app.post("/api/pms", async (req, res) => {
    try {
      const pms = JSON.parse(await fs.readFile(PMS_FILE, "utf-8"));
      const newPM = { ...req.body, id: Date.now().toString() };
      pms.push(newPM);
      await fs.writeFile(PMS_FILE, JSON.stringify(pms, null, 2));
      res.json(newPM);
    } catch (err) {
      res.status(500).json({ error: "Failed to save PM" });
    }
  });

  app.patch("/api/pms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      let pms = JSON.parse(await fs.readFile(PMS_FILE, "utf-8"));
      const index = pms.findIndex((p: any) => p.id === id);
      if (index === -1) return res.status(404).json({ error: "Not found" });
      pms[index] = { ...pms[index], ...req.body };
      await fs.writeFile(PMS_FILE, JSON.stringify(pms, null, 2));
      res.json(pms[index]);
    } catch (err) {
      res.status(500).json({ error: "Failed to update PM" });
    }
  });

  app.delete("/api/pms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      let pms = JSON.parse(await fs.readFile(PMS_FILE, "utf-8"));
      pms = pms.filter((p: any) => p.id !== id);
      await fs.writeFile(PMS_FILE, JSON.stringify(pms, null, 2));
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Failed to delete PM" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
