import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Stack,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { fetchNotifications } from "../api/notifications";
import { Log } from "../utils/logger";
import { getViewedNotificationIDs, addViewedNotificationID } from "../utils/localStorage";

// Priority weights: Placement (3) > Result (2) > Event (1)
const priorityWeights = {
  "Placement": 3,
  "Result": 2,
  "Event": 1
};

export function PriorityInboxPage() {
  const [limitN, setLimitN] = useState(10); // user chosen 'n'
  const [filter, setFilter] = useState("All");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [, setViewedList] = useState([]);

  // Fetch viewed IDs from localStorage on mount
  useEffect(() => {
    setViewedList(getViewedNotificationIDs());
  }, []);

  const loadPriorityData = useCallback(async () => {
    Log("debug", "page", `Fetching priority inbox data - n Limit: ${limitN}, Filter: ${filter}`);
    setLoading(true);
    setError(null);
    try {
      // Fetch a larger set (50 items) to ensure we can compute the top 'n' accurately
      const data = await fetchNotifications(1, "All", 50);
      const remoteNotifs = data.notifications ?? [];
      const currentViewed = getViewedNotificationIDs();

      // 1. Filter out already viewed (read) notifications
      let unreadNotifs = remoteNotifs.filter(n => !currentViewed.includes(n.id));

      // 2. Filter by selected category type if not "All"
      if (filter !== "All") {
        unreadNotifs = unreadNotifs.filter(n => n.type.toLowerCase() === filter.toLowerCase());
      }

      // 3. Sort by priority weights and then by recency (Timestamp DESC)
      const sorted = [...unreadNotifs].sort((a, b) => {
        const weightA = priorityWeights[a.type] || 0;
        const weightB = priorityWeights[b.type] || 0;

        if (weightA !== weightB) {
          return weightB - weightA; // Higher weight first
        }

        return new Date(b.date) - new Date(a.date); // Newer timestamp first
      });

      // 4. Slice to top 'n'
      const sliced = sorted.slice(0, limitN);
      setNotifications(sliced);
      
      Log("info", "page", `Successfully loaded and sorted top ${sliced.length} priority notifications`);
    } catch (err) {
      Log("error", "page", `Failed to load priority notifications: ${err.message}`);
      setError(err.message || "Failed to load priority inbox");
    } finally {
      setLoading(false);
    }
  }, [limitN, filter]);

  useEffect(() => {
    loadPriorityData();
  }, [loadPriorityData]);

  const handleMarkAsRead = (id) => {
    Log("info", "page", `Mark as read clicked in Priority Inbox for ID: ${id}`);
    addViewedNotificationID(id);
    // Remove from active state list immediately to animate/clear it out
    setNotifications(prev => prev.filter(n => n.id !== id));
    setViewedList(prev => [...prev, id]);
  };

  const handleLimitChange = (event) => {
    const newLimit = event.target.value;
    Log("info", "page", `User changed priority inbox limit to: ${newLimit}`);
    setLimitN(newLimit);
  };

  const handleFilterChange = (newFilter) => {
    Log("info", "page", `User changed priority inbox filter to: ${newFilter}`);
    setFilter(newFilter);
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
      {/* Header Section */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <StarIcon sx={{ fontSize: 30, color: "secondary.main" }} />
          <Typography variant="h5" fontWeight={700}>
            Priority Inbox
          </Typography>
        </Stack>

        {/* Limit 'n' Selection Dropdown */}
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel id="limit-select-label">Show Top</InputLabel>
          <Select
            labelId="limit-select-label"
            id="limit-select"
            value={limitN}
            label="Show Top"
            onChange={handleLimitChange}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={15}>15</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={30}>30</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Filter and Settings bar */}
      <Box sx={{ marginBottom: 3 }}>
        <NotificationFilter value={filter} onChange={handleFilterChange} />
      </Box>

      {/* Loading state */}
      {loading && (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={50} thickness={4} />
        </Box>
      )}

      {/* Error state */}
      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>
          Failed to load priority inbox: {error}
        </Alert>
      )}

      {/* Empty State */}
      {!loading && !error && notifications.length === 0 && (
        <Alert severity="success" sx={{ borderRadius: 3, py: 2 }}>
          Your Priority Inbox is clear! No unread notifications found.
        </Alert>
      )}

      {/* Notifications list */}
      {!loading && !error && notifications.length > 0 && (
        <Stack spacing={2}>
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
