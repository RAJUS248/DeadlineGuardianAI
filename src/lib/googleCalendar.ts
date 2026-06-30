import { getAccessToken } from "./firebaseAuth";
import { CalendarEvent } from "../types";

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: { method: "popup" | "email"; minutes: number }[];
  };
  recurrence?: string[];
}

// Maps Guardian Category to Google Calendar Color IDs
// 1: Blue (Lavender), 2: Green (Sage), 3: Purple (Grape), 4: Red (Flamingo), 5: Yellow (Banana), 6: Orange (Tangerine), 7: Indigo (Peacock), 8: Gray, 9: Cobalt (Blueberry), 10: Basil, 11: Tomato
export const getGoogleColorId = (category: string): string => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("study") || cat.includes("education")) return "9"; // Cobalt Blue
  if (cat.includes("interview")) return "3"; // Grape (Purple)
  if (cat.includes("assignment") || cat.includes("projects") || cat.includes("finance")) return "6"; // Tangerine (Orange)
  if (cat.includes("meeting") || cat.includes("work")) return "10"; // Basil (Green)
  if (cat.includes("personal")) return "5"; // Banana (Yellow)
  if (cat.includes("coding")) return "7"; // Peacock (Indigo)
  if (cat.includes("health")) return "11"; // Tomato (Red)
  return "1"; // Default Lavender Blue
};

// Maps minutes before to display label
export const getReminderMinutes = (option: string): number => {
  switch (option) {
    case "10_min": return 10;
    case "30_min": return 30;
    case "1_hour": return 60;
    case "1_day": return 1440;
    default: return 30;
  }
};

// Offline queue for actions when disconnected
const OFFLINE_QUEUE_KEY = "dg_offline_sync_queue";

export interface OfflineSyncAction {
  id: string; // unique transaction id
  eventId: string; // the calendarEventId or internal task/event ID
  action: "create" | "update" | "delete";
  eventData?: any;
}

export const getOfflineQueue = (): OfflineSyncAction[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read offline queue", e);
    return [];
  }
};

export const saveOfflineQueue = (queue: OfflineSyncAction[]) => {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to save offline queue", e);
  }
};

export const addToOfflineQueue = (eventId: string, action: "create" | "update" | "delete", eventData?: any) => {
  const queue = getOfflineQueue();
  // Filter out redundant actions for the same event if deleting or creating
  const filtered = queue.filter(item => !(item.eventId === eventId && action === "delete"));
  filtered.push({
    id: "sync-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
    eventId,
    action,
    eventData
  });
  saveOfflineQueue(filtered);
};

// Main function to check if online
export const isOnline = (): boolean => {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
};

export const toGoogleRFC3339 = (str: any): string => {
  if (!str) return new Date().toISOString();
  if (typeof str === "string") {
    // Check if it already matches standard RFC3339 format (including offset or Z)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/.test(str)) {
      return str;
    }
    // Check if it matches YYYY-MM-DDTHH:mm:ss but is missing timezone offset
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
      return str + "Z";
    }
  }
  
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch (e) {}

  if (typeof str === "string") {
    const cleaned = str.trim().replace(" ", "T");
    try {
      const d = new Date(cleaned);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    } catch (e) {}
  }

  return new Date().toISOString();
};

export const isValidGoogleEventId = (id: string): boolean => {
  if (!id || typeof id !== "string") return false;
  if (
    id.startsWith("pending-sync-") ||
    id.startsWith("task-") ||
    id.startsWith("event-")
  ) {
    return false;
  }
  return /^[a-v0-9]{5,1024}$/.test(id);
};

// Process offline queue once online
export const processOfflineQueue = async (
  onSuccess: (msg: string) => void,
  onProgress: (eventId: string, googleId: string) => void
) => {
  if (!isOnline()) return;
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  const token = getAccessToken();
  if (!token) {
    console.warn("Cannot process offline queue without an active Google access token.");
    return;
  }

  console.log(`[Offline Sync] Syncing ${queue.length} pending operations...`);
  const remaining: OfflineSyncAction[] = [];

  for (const item of queue) {
    try {
      if (item.action === "create") {
        const res = await createGoogleEventAPI(item.eventData, token);
        if (res?.id) {
          onProgress(item.eventId, res.id);
        }
      } else if (item.action === "update") {
        if (!isValidGoogleEventId(item.eventId)) {
          console.warn(`[Offline Sync] Skipping update for invalid Google Event ID: ${item.eventId}`);
          continue;
        }
        await updateGoogleEventAPI(item.eventId, item.eventData, token);
      } else if (item.action === "delete") {
        if (!isValidGoogleEventId(item.eventId)) {
          console.warn(`[Offline Sync] Skipping delete for invalid Google Event ID: ${item.eventId}`);
          continue;
        }
        await deleteGoogleEventAPI(item.eventId, token);
      }
    } catch (e) {
      console.error(`Failed to execute queued action: ${item.action} for ${item.eventId}`, e);
      const msg = String(e?.message || e).toLowerCase();
      const isRetryable = !(
        msg.includes("404") ||
        msg.includes("notfound") ||
        msg.includes("400") ||
        msg.includes("timerangeempty") ||
        msg.includes("403") ||
        msg.includes("forbidden")
      );
      if (isRetryable) {
        // Keep in queue for next retry if it was a network error
        remaining.push(item);
      } else {
        console.warn(`Action discarded from offline queue due to non-retryable error: ${msg}`);
      }
    }
  }

  saveOfflineQueue(remaining);
  if (remaining.length === 0) {
    onSuccess("All offline modifications synced to Google Calendar!");
  }
};

// --- Google Calendar REST API Wrappers ---

export const listGoogleEvents = async (token: string): Promise<any[]> => {
  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=250",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      let errMsg = "";
      try {
        const errJson = await response.json();
        errMsg = errJson?.error?.message || errJson?.message || JSON.stringify(errJson);
      } catch (e) {
        try {
          errMsg = await response.text();
        } catch (_) {
          errMsg = response.statusText || String(response.status);
        }
      }
      throw new Error(`Google API error: ${response.status} - ${errMsg || response.statusText || "Unknown error"}`);
    }
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error listing Google Events:", error);
    throw error;
  }
};

export const createGoogleEventAPI = async (event: GoogleCalendarEvent, token: string): Promise<any> => {
  try {
    const sanitized: any = {
      summary: event.summary || "Untitled Event",
    };

    if (event.description) sanitized.description = event.description;
    if (event.colorId) sanitized.colorId = event.colorId;

    let startIso = toGoogleRFC3339(event.start?.dateTime || event.start?.date);
    let endIso = toGoogleRFC3339(event.end?.dateTime || event.end?.date);

    if (Date.parse(endIso) <= Date.parse(startIso)) {
      endIso = new Date(Date.parse(startIso) + 3600000).toISOString();
    }

    sanitized.start = { dateTime: startIso };
    sanitized.end = { dateTime: endIso };

    if (event.reminders) {
      sanitized.reminders = {
        useDefault: !!event.reminders.useDefault,
      };
      if (Array.isArray(event.reminders.overrides)) {
        sanitized.reminders.overrides = event.reminders.overrides.map((o: any) => ({
          method: o.method || "popup",
          minutes: typeof o.minutes === "number" ? o.minutes : 30,
        }));
      }
    }

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitized),
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to create Google Event: ${response.status} - ${errText}`);
    }
    return await response.json();
  } catch (error) {
    const msg = String(error?.message || error);
    if (!msg.includes("400")) {
      console.error("Error creating Google Event:", error);
    } else {
      console.warn("Known API issue in createGoogleEventAPI:", msg);
    }
    throw error;
  }
};

export const updateGoogleEventAPI = async (googleEventId: string, event: GoogleCalendarEvent, token: string): Promise<any> => {
  try {
    const sanitized: any = {
      summary: event.summary || "Untitled Event",
    };

    if (event.description) sanitized.description = event.description;
    if (event.colorId) sanitized.colorId = event.colorId;

    let startIso = toGoogleRFC3339(event.start?.dateTime || event.start?.date);
    let endIso = toGoogleRFC3339(event.end?.dateTime || event.end?.date);

    if (Date.parse(endIso) <= Date.parse(startIso)) {
      endIso = new Date(Date.parse(startIso) + 3600000).toISOString();
    }

    sanitized.start = { dateTime: startIso };
    sanitized.end = { dateTime: endIso };

    if (event.reminders) {
      sanitized.reminders = {
        useDefault: !!event.reminders.useDefault,
      };
      if (Array.isArray(event.reminders.overrides)) {
        sanitized.reminders.overrides = event.reminders.overrides.map((o: any) => ({
          method: o.method || "popup",
          minutes: typeof o.minutes === "number" ? o.minutes : 30,
        }));
      }
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitized),
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to update Google Event: ${response.status} - ${errText}`);
    }
    return await response.json();
  } catch (error) {
    const msg = String(error?.message || error);
    if (!msg.includes("404") && !msg.includes("400")) {
      console.error("Error updating Google Event:", error);
    } else {
      console.warn("Known API issue in updateGoogleEventAPI:", msg);
    }
    throw error;
  }
};

export const deleteGoogleEventAPI = async (googleEventId: string, token: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      if (response.status === 404) {
        return true; // Already deleted, treat as success
      }
      const errText = await response.text();
      throw new Error(`Failed to delete Google Event: ${response.status} - ${errText}`);
    }
    return true;
  } catch (error) {
    const msg = String(error?.message || error);
    if (!msg.includes("404")) {
      console.error("Error deleting Google Event:", error);
    } else {
      console.warn("Known API issue in deleteGoogleEventAPI:", msg);
    }
    throw error;
  }
};

// Conflict Detection
// Checks if the proposed start/end times overlap with existing calendar events
export const detectTimeConflicts = (
  startStr: string,
  endStr: string,
  existingEvents: CalendarEvent[],
  excludeId?: string
): CalendarEvent[] => {
  try {
    const proposedStart = new Date(startStr).getTime();
    const proposedEnd = new Date(endStr).getTime();

    if (isNaN(proposedStart) || isNaN(proposedEnd)) return [];

    return existingEvents.filter(ev => {
      if (ev.id === excludeId) return false;
      const evStart = new Date(ev.start).getTime();
      const evEnd = new Date(ev.end).getTime();

      if (isNaN(evStart) || isNaN(evEnd)) return false;

      // Overlap condition: Proposed start is before event end AND proposed end is after event start
      return proposedStart < evEnd && proposedEnd > evStart;
    });
  } catch (e) {
    console.error("Conflict detection failed", e);
    return [];
  }
};
