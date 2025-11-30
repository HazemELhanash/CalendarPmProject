import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Events CRUD
  app.get("/api/events", async (_req: Request, res: Response) => {
    const events = await storage.listEvents();
    res.json(events);
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    const ev = await storage.getEvent(req.params.id);
    if (!ev) return res.status(404).json({ message: "Not found" });
    res.json(ev);
  });

  app.post("/api/events", async (req: Request, res: Response) => {
    const payload = req.body;
    const created = await storage.createEvent(payload);
    res.status(201).json(created);
  });

  app.put("/api/events/:id", async (req: Request, res: Response) => {
    const updated = await storage.updateEvent(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/events/:id", async (req: Request, res: Response) => {
    const ok = await storage.deleteEvent(req.params.id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.status(204).end();
  });

  // Simple projects aggregation endpoint
  app.get("/api/projects", async (_req: Request, res: Response) => {
    const events = await storage.listEvents();
    const projectMap = new Map<string, any>();
    for (const e of events) {
      if (e.category === "Task" && e.project) {
        const p = projectMap.get(e.project) || { name: e.project, tasks: [] };
        p.tasks.push(e);
        projectMap.set(e.project, p);
      }
    }
    res.json(Array.from(projectMap.values()));
  });

  const httpServer = createServer(app);
  return httpServer;
}
