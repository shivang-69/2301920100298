const VIEWED_KEY = "campus_viewed_notification_ids";

export function getViewedNotificationIDs() {
  try {
    const data = localStorage.getItem(VIEWED_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading viewed notifications from localStorage:", error);
    return [];
  }
}

export function addViewedNotificationID(id) {
  try {
    const ids = getViewedNotificationIDs();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(VIEWED_KEY, JSON.stringify(ids));
    }
  } catch (error) {
    console.error("Error saving viewed notification to localStorage:", error);
  }
}

export function isNotificationViewed(id) {
  return getViewedNotificationIDs().includes(id);
}
