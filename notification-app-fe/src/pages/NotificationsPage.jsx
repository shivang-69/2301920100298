import { useState } from "react";
import {
  Alert,
  Badge,
  Box,
  CircularProgress,
  Divider,
  Pagination,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AddIcon from "@mui/icons-material/Add";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";
import { Log } from "../utils/logger";

export function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Dialog fields state
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Placement");
  const [newMessage, setNewMessage] = useState("");

  const {
    notifications,
    totalPages,
    unreadCount,
    loading,
    error,
    markAsRead,
    addNewNotification,
  } = useNotifications(page, filter);

  const handleFilterChange = (newFilter) => {
    Log("info", "page", `User changed notification filter to: ${newFilter}`);
    setFilter(newFilter);
    setPage(1); // Reset page when changing filter
  };

  const handlePageChange = (_, newPage) => {
    Log("info", "page", `User navigated to page: ${newPage}`);
    setPage(newPage);
  };

  const handleCreateMock = async () => {
    if (!newTitle.trim() || !newMessage.trim()) return;
    
    Log("info", "page", `User submitted mock notification creation - Title: "${newTitle}"`);
    await addNewNotification({
      title: newTitle,
      type: newType,
      message: newMessage,
    });

    // Reset and close
    setNewTitle("");
    setNewType("Placement");
    setNewMessage("");
    setOpenDialog(false);
  };

  const handleOpenDialog = () => {
    Log("debug", "component", "Open Create Mock Dialog clicked");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    Log("debug", "component", "Create Mock Dialog closed/cancelled");
    setOpenDialog(false);
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
      {/* Header section with Badge and Add Button */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Badge badgeContent={unreadCount} color="secondary" max={99}>
            <NotificationsIcon sx={{ fontSize: 28, color: "primary.main" }} />
          </Badge>
          <Typography variant="h5" fontWeight={700}>
            Notifications Portal
          </Typography>
        </Stack>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          sx={{
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
            px: 2.5,
          }}
        >
          Add Mock
        </Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Filter Options */}
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
          Failed to load notifications: {error}
        </Alert>
      )}

      {/* Empty State */}
      {!loading && !error && notifications.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 3, py: 2 }}>
          No {filter !== "All" ? filter.toLowerCase() : ""} notifications found.
        </Alert>
      )}

      {/* Notifications list */}
      {!loading && !error && notifications.length > 0 && (
        <Stack spacing={2}>
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkAsRead={markAsRead}
            />
          ))}
        </Stack>
      )}

      {/* Pagination control */}
      {!loading && !error && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="large"
            sx={{
              "& .MuiPaginationItem-root": {
                fontWeight: 600,
                borderRadius: 2,
              },
            }}
          />
        </Box>
      )}

      {/* Add Notification Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: "background.paper",
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Create Mock Notification</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              select
              label="Notification Type"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="Placement">Placement</MenuItem>
              <MenuItem value="Result">Result</MenuItem>
              <MenuItem value="Event">Event</MenuItem>
            </TextField>

            <TextField
              label="Title"
              placeholder="e.g. Google Interview Updates"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              fullWidth
              size="small"
              required
            />

            <TextField
              label="Message"
              placeholder="Enter details of the announcement..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              fullWidth
              multiline
              rows={4}
              size="small"
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCloseDialog} sx={{ color: "text.secondary" }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateMock}
            variant="contained"
            disabled={!newTitle.trim() || !newMessage.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
