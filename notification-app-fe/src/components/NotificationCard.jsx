import { Card, Box, Typography, Button, Stack, Avatar } from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import AssessmentIcon from "@mui/icons-material/Assessment";
import EventIcon from "@mui/icons-material/Event";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const typeConfig = {
  placement: {
    icon: <WorkIcon sx={{ color: "#38bdf8" }} />, // Cyan icon
    bg: "rgba(56, 189, 248, 0.1)",
    border: "rgba(56, 189, 248, 0.3)",
  },
  result: {
    icon: <AssessmentIcon sx={{ color: "#fb7185" }} />, // Rose icon
    bg: "rgba(251, 113, 133, 0.1)",
    border: "rgba(251, 113, 133, 0.3)",
  },
  event: {
    icon: <EventIcon sx={{ color: "#c084fc" }} />, // Purple icon
    bg: "rgba(192, 132, 252, 0.1)",
    border: "rgba(192, 132, 252, 0.3)",
  },
  default: {
    icon: <NotificationsIcon sx={{ color: "#94a3b8" }} />,
    bg: "rgba(148, 163, 184, 0.1)",
    border: "rgba(148, 163, 184, 0.3)",
  },
};

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  
  if (isNaN(diffMs)) return "Some time ago";
  
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function NotificationCard({ notification, onMarkAsRead }) {
  const { id, type, title, message, date, read } = notification;
  const config = typeConfig[type.toLowerCase()] || typeConfig.default;

  return (
    <Card
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "flex-start",
        gap: 2,
        p: 2.5,
        borderRadius: 3,
        backgroundColor: read ? "background.paper" : "rgba(99, 102, 241, 0.05)",
        borderLeft: `5px solid ${read ? "transparent" : "#6366f1"}`,
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
          borderColor: read ? "rgba(148, 163, 184, 0.2)" : "#6366f1",
        },
      }}
    >
      {/* Type-based Icon Avatar */}
      <Avatar
        sx={{
          bgcolor: config.bg,
          width: 48,
          height: 48,
          border: `1px solid ${config.border}`,
          borderRadius: 2.5,
        }}
      >
        {config.icon}
      </Avatar>

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
          <Typography
            variant="subtitle1"
            sx={{
              color: read ? "text.primary" : "#f8fafc",
              fontWeight: read ? 500 : 700,
            }}
          >
            {title}
          </Typography>
          {!read && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#6366f1",
                boxShadow: "0 0 8px #6366f1",
              }}
            />
          )}
        </Stack>
        
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1.5,
            lineHeight: 1.5,
            fontSize: "0.875rem",
          }}
        >
          {message}
        </Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
            {formatRelativeTime(date)}
          </Typography>

          {!read && (
            <Button
              size="small"
              variant="text"
              startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
              onClick={() => onMarkAsRead(id)}
              sx={{
                py: 0.25,
                px: 1,
                fontSize: "0.75rem",
                color: "#818cf8",
                "&:hover": {
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                },
              }}
            >
              Mark as Read
            </Button>
          )}
        </Stack>
      </Box>
    </Card>
  );
}
