import { Log } from "../utils/logger";

const BASE_URL = "http://localhost:5000/api";

export async function fetchNotifications(page = 1, type = "All", limit = 5) {
  Log("info", "api", `fetchNotifications requested - Page: ${page}, Filter: ${type}`);
  try {
    const response = await fetch(`${BASE_URL}/notifications?page=${page}&type=${type}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    Log("info", "api", `fetchNotifications successful - Retrieved ${data.notifications?.length} items`);
    return data;
  } catch (error) {
    Log("error", "api", `fetchNotifications failed: ${error.message}`);
    console.error("Failed to fetch notifications:", error);
    throw error;
  }
}

export async function fetchUnreadCount() {
  Log("debug", "api", "fetchUnreadCount requested");
  try {
    const response = await fetch(`${BASE_URL}/notifications/unread-count`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    Log("debug", "api", `fetchUnreadCount successful - Count: ${data.count}`);
    return data.count;
  } catch (error) {
    Log("error", "api", `fetchUnreadCount failed: ${error.message}`);
    console.error("Failed to fetch unread count:", error);
    throw error;
  }
}

export async function markNotificationAsRead(id) {
  Log("info", "api", `markNotificationAsRead requested for ID: ${id}`);
  try {
    const response = await fetch(`${BASE_URL}/notifications/${id}/read`, {
      method: "PATCH",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    Log("info", "api", `markNotificationAsRead successful for ID: ${id}`);
    return data;
  } catch (error) {
    Log("error", "api", `markNotificationAsRead failed for ID ${id}: ${error.message}`);
    console.error(`Failed to mark notification ${id} as read:`, error);
    throw error;
  }
}

export async function createNotification(notification) {
  Log("info", "api", `createNotification requested - Title: "${notification.title}"`);
  try {
    const response = await fetch(`${BASE_URL}/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notification),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    Log("info", "api", `createNotification successful - Generated ID: ${data.notification?.id}`);
    return data;
  } catch (error) {
    Log("error", "api", `createNotification failed: ${error.message}`);
    console.error("Failed to create notification:", error);
    throw error;
  }
}
