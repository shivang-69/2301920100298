import { useState, useEffect, useCallback } from "react";
import { fetchNotifications } from "../api/notifications";
import { Log } from "../utils/logger";
import { getViewedNotificationIDs, addViewedNotificationID } from "../utils/localStorage";

export function useNotifications(page, filter) {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notifications and calculate unread count
  const loadData = useCallback(async () => {
    Log("debug", "hook", `loadData triggered in useNotifications hook - Page: ${page}, Filter: ${filter}`);
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch paginated/filtered notifications from backend proxy
      const data = await fetchNotifications(page, filter);
      const viewedIds = getViewedNotificationIDs();

      // Map read status locally based on localStorage
      const mapped = (data.notifications ?? []).map(n => ({
        ...n,
        read: viewedIds.includes(n.id)
      }));

      // 2. Fetch a larger batch (e.g. 50) to calculate a accurate active unread count
      const unreadBatch = await fetchNotifications(1, "All", 50);
      const activeUnread = (unreadBatch.notifications ?? []).filter(
        n => !viewedIds.includes(n.id)
      ).length;

      setNotifications(mapped);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
      setUnreadCount(activeUnread);

      Log("debug", "hook", `loadData successfully completed and mapped read states`);
    } catch (err) {
      Log("error", "hook", `loadData failed in useNotifications hook: ${err.message}`);
      setError(err.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  // Load notifications when page or filter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mark notification as read
  const markAsRead = async (id) => {
    Log("info", "hook", `markAsRead triggered in useNotifications hook for ID: ${id}`);
    try {
      // Save read state locally in localStorage
      addViewedNotificationID(id);

      // Update local state immediately for fast response
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );

      // Decrement unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      Log("info", "hook", `markAsRead successfully stored locally for ID: ${id}`);
    } catch (err) {
      Log("error", "hook", `markAsRead failed in useNotifications hook for ID ${id}: ${err.message}`);
      console.error("Failed to mark as read in hook:", err);
    }
  };

  // Add new notification (local mock helpers)
  const addNewNotification = async (notificationData) => {
    Log("info", "hook", `addNewNotification triggered locally - Title: "${notificationData.title}"`);
    // Local mock creation just forces a reload
    await loadData();
  };

  return {
    notifications,
    total,
    totalPages,
    unreadCount,
    loading,
    error,
    markAsRead,
    addNewNotification,
    refresh: loadData
  };
}
