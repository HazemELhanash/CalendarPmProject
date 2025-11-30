import { randomUUID } from "crypto";

// Lightweight local User types — the shared schema does not currently export User.
export interface User {
  id: string;
  username?: string;
  email?: string;
  [key: string]: any;
}

export type InsertUser = Omit<User, 'id'>;

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Event related
  listEvents(): Promise<any[]>;
  getEvent(id: string): Promise<any | undefined>;
  createEvent(event: any): Promise<any>;
  updateEvent(id: string, patch: Partial<any>): Promise<any | undefined>;
  deleteEvent(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private events: Map<string, any>;

  constructor() {
    this.users = new Map();
    this.events = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Events
  async listEvents(): Promise<any[]> {
    return Array.from(this.events.values());
  }

  async getEvent(id: string): Promise<any | undefined> {
    return this.events.get(id);
  }

  async createEvent(event: any): Promise<any> {
    const id = event.id || randomUUID();
    const stored = { ...event, id };
    this.events.set(id, stored);
    return stored;
  }

  async updateEvent(id: string, patch: Partial<any>): Promise<any | undefined> {
    const existing = this.events.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.events.set(id, updated);
    return updated;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }
}

export const storage = new MemStorage();
