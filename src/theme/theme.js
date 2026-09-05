import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#E5384D",
      light: "#FF6B6B",
      dark: "#B71C1C",
      contrastText: "#fff",
    },
    secondary: {
      main: "#1976D2",
      light: "#63A4FF",
      dark: "#004BA0",
    },
    background: {
      default: "#F6F7FB",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1C1B1F",
      secondary: "#6B7280",
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shadows: Array(25).fill("none").map((_, i) =>
    i === 0
      ? "none"
      : `0 ${i * 1.2}px ${i * 3}px rgba(17, 12, 46, ${0.06 + i * 0.002})`
  ),
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          boxSizing: "border-box",
        },
        body: {
          transition: "background-color 0.3s ease",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 22px",
          fontWeight: 600,
          letterSpacing: 0.2,
          transition:
            "transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease, background-color 0.25s ease",
          "&:hover": {
            transform: "translateY(-2px)",
          },
          "&:active": {
            transform: "translateY(0) scale(0.97)",
          },
        },
        contained: {
          boxShadow: "0 8px 20px rgba(229, 56, 77, 0.25)",
          "&:hover": {
            boxShadow: "0 12px 28px rgba(229, 56, 77, 0.35)",
          },
        },
        containedPrimary: {
          backgroundImage:
            "linear-gradient(135deg, #E5384D 0%, #FF6B6B 100%)",
          "&:hover": {
            backgroundImage:
              "linear-gradient(135deg, #D32F2F 0%, #E5384D 100%)",
          },
        },
        outlined: {
          borderWidth: 1.5,
          "&:hover": {
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "transform 0.25s cubic-bezier(.34,1.56,.64,1), background-color 0.2s ease",
          "&:hover": {
            transform: "translateY(-1px) scale(1.08)",
            backgroundColor: "rgba(229, 56, 77, 0.08)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          transition:
            "transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s ease",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(14px)",
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          transition: "box-shadow 0.3s ease",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: "none",
          backgroundColor: "#ffffff",
          boxShadow: "4px 0 24px rgba(17, 12, 46, 0.05)",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: "4px 8px",
          transition:
            "background-color 0.25s ease, transform 0.25s ease, color 0.25s ease",
          "&:hover": {
            backgroundColor: "rgba(229, 56, 77, 0.08)",
            transform: "translateX(4px)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(229, 56, 77, 0.12)",
            "&:hover": {
              backgroundColor: "rgba(229, 56, 77, 0.16)",
            },
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: "box-shadow 0.25s ease, border-color 0.25s ease",
          "&.Mui-focused": {
            boxShadow: "0 0 0 4px rgba(229, 56, 77, 0.12)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
