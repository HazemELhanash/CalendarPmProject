import { apiRequest } from "../queryClient";

const base = "/api";

export async function fetchEvents() {
  const res = await apiRequest("GET", `${base}/events`);
  return res.json();
}

export async function fetchEvent(id: string) {
  const res = await apiRequest("GET", `${base}/events/${id}`);
  return res.json();
}

export async function createEvent(event: any) {
  const res = await apiRequest("POST", `${base}/events`, event);
  return res.json();
}

export async function updateEvent(id: string, patch: any) {
  const res = await apiRequest("PUT", `${base}/events/${id}`, patch);
  return res.json();
}

export async function deleteEvent(id: string) {
  await apiRequest("DELETE", `${base}/events/${id}`);
}

export async function fetchProjects() {
  const res = await apiRequest("GET", `${base}/projects`);
  return res.json();
}
