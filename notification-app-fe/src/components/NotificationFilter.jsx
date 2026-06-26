import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const filters = ["All", "Placement", "Result", "Event"];

export function NotificationFilter({ value, onChange }) {
  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      onChange(newFilter);
    }
  };

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleFilterChange}
      size="small"
      sx={{
        flexWrap: "wrap",
        gap: 0.5,
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        p: 0.5,
        borderRadius: 3,
        border: "1px solid rgba(148, 163, 184, 0.08)",
      }}
    >
      {filters.map((type) => (
        <ToggleButton
          key={type}
          value={type}
          sx={{
            textTransform: "none",
            px: 3,
            py: 0.75,
            borderRadius: 2,
            border: "none !important",
            color: "text.secondary",
            fontWeight: 500,
            transition: "all 0.2s",
            "&.Mui-selected": {
              backgroundColor: "primary.main",
              color: "white",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            },
            "&:hover": {
              backgroundColor: "rgba(148, 163, 184, 0.08)",
              color: "text.primary",
            },
          }}
        >
          {type}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}