import type { ReadingSession } from "./types";

const STORAGE_KEY = "arcana-mirror-readings";

export function loadReadings(): ReadingSession[] {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReadings(readings: ReadingSession[]): boolean {
  if (typeof localStorage === "undefined") {
    return false;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
    return true;
  } catch {
    return false;
  }
}

export function upsertReading(session: ReadingSession): boolean {
  const current = loadReadings();
  const next = [session, ...current.filter((item) => item.id !== session.id)].slice(0, 80);
  return saveReadings(next);
}

export function deleteReading(id: string): boolean {
  return saveReadings(loadReadings().filter((item) => item.id !== id));
}
