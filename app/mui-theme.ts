"use client";

import { createTheme, alpha } from "@mui/material/styles";

const primary = "#011e56";
const actionBlue = "#073b78";
const actionBlueHover = "#0a4f96";
const linkBlue = "#4c9ddb";
const success = "#43b883";
const danger = "#d85b6a";
const warning = "#b7791f";

export const traderMaterialTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data",
  },
  colorSchemes: {
    light: {
      palette: {
        mode: "light",
        primary: {
          main: primary,
          light: actionBlueHover,
          dark: "#00143d",
          contrastText: "#ffffff",
        },
        secondary: {
          main: actionBlue,
          light: linkBlue,
          dark: primary,
          contrastText: "#ffffff",
        },
        info: {
          main: linkBlue,
          contrastText: "#06172d",
        },
        success: {
          main: success,
          contrastText: "#062015",
        },
        warning: {
          main: warning,
          contrastText: "#241400",
        },
        error: {
          main: danger,
          contrastText: "#ffffff",
        },
        background: {
          default: "#f6f8fc",
          paper: "#ffffff",
        },
        text: {
          primary: "#111827",
          secondary: "#4b5870",
          disabled: "#7b8798",
        },
        divider: alpha(primary, 0.13),
      },
    },
    dark: {
      palette: {
        mode: "dark",
        primary: {
          main: linkBlue,
          light: "#7fbeeb",
          dark: actionBlue,
          contrastText: "#04101f",
        },
        secondary: {
          main: "#7aa9df",
          light: "#a8caef",
          dark: actionBlue,
          contrastText: "#06172d",
        },
        info: {
          main: linkBlue,
          contrastText: "#04101f",
        },
        success: {
          main: success,
          contrastText: "#04160e",
        },
        warning: {
          main: "#e6b15d",
          contrastText: "#1d1300",
        },
        error: {
          main: danger,
          contrastText: "#24070c",
        },
        background: {
          default: "#050a14",
          paper: "#0b1626",
        },
        text: {
          primary: "#f5f7fb",
          secondary: "#a7b3c7",
          disabled: "#6f7e95",
        },
        divider: alpha("#f5f7fb", 0.12),
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      "var(--font-geist-sans), Arial, Helvetica, sans-serif",
    button: {
      fontWeight: 700,
      letterSpacing: 0,
      textTransform: "none",
    },
    h1: {
      fontWeight: 750,
      letterSpacing: 0,
    },
    h2: {
      fontWeight: 720,
      letterSpacing: 0,
    },
    h3: {
      fontWeight: 700,
      letterSpacing: 0,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily:
            "var(--font-geist-sans), Arial, Helvetica, sans-serif",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 40,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundImage: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 700,
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
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 999,
        },
      },
    },
  },
});
