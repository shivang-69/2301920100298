import { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppBar, Toolbar, Tabs, Tab, Container, Box, Typography } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StarIcon from "@mui/icons-material/Star";

import { NotificationsPage } from "./pages/NotificationsPage";
import { PriorityInboxPage } from "./pages/PriorityInboxPage";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#6366f1", // Sleek indigo/violet primary
      light: "#818cf8",
      dark: "#4f46e5",
    },
    secondary: {
      main: "#f59e0b", // Gold/Amber secondary for priorities
    },
    background: {
      default: "#0f172a", // Slate 900
      paper: "#1e293b", // Slate 800 for cards
    },
    text: {
      primary: "#f8fafc", // Slate 50
      secondary: "#94a3b8", // Slate 400
    },
    divider: "rgba(148, 163, 184, 0.12)",
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    subtitle1: {
      fontWeight: 600,
    },
    body1: {
      lineHeight: 1.6,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-1px)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(148, 163, 184, 0.08)",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        },
      },
    },
  },
});

export default function App() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      
      {/* Sleek transparent AppBar with glassmorphism */}
      <AppBar 
        position="sticky" 
        sx={{ 
          background: "rgba(15, 23, 42, 0.8)", 
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
          boxShadow: "none",
          zIndex: 1100
        }}
      >
        <Container maxWidth="md">
          <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
            <Typography 
              variant="h6" 
              fontWeight={800} 
              sx={{ 
                background: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.03em"
              }}
            >
              Campus Noticeboard
            </Typography>

            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              textColor="primary"
              indicatorColor="primary"
              sx={{
                "& .MuiTab-root": {
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "none",
                  px: 2,
                  minWidth: "auto"
                }
              }}
            >
              <Tab 
                label="All Notifications" 
                icon={<NotificationsIcon sx={{ fontSize: 18 }} />} 
                iconPosition="start"
              />
              <Tab 
                label="Priority Inbox" 
                icon={<StarIcon sx={{ fontSize: 18 }} />} 
                iconPosition="start"
                sx={{
                  "&.Mui-selected": {
                    color: "secondary.main"
                  }
                }}
              />
            </Tabs>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main page layout */}
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ mt: 2 }}>
          {activeTab === 0 && <NotificationsPage />}
          {activeTab === 1 && <PriorityInboxPage />}
        </Box>
      </Container>
    </ThemeProvider>
  );
}