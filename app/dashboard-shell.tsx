"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import NextLink from "./material-link";

export type DashboardShellNavItem = {
  href: string;
  label: string;
  summary?: string;
};

export type DashboardShellNavGroup = {
  label: string;
  items: DashboardShellNavItem[];
};

export function DashboardShell({
  actions,
  children,
  eyebrow = "Trader Intelligence",
  fullBleed = false,
  navGroups,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
  fullBleed?: boolean;
  navGroups: DashboardShellNavGroup[];
  title: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Box>
        <Typography color="primary" sx={{ fontWeight: 800 }} variant="overline">
          {eyebrow}
        </Typography>
        <Typography color="text.primary" sx={{ fontWeight: 750 }} variant="h6">
          Dashboard
        </Typography>
      </Box>
      <Divider />
      {navGroups.map((group) => (
        <Box key={group.label}>
          <Typography
            color="text.secondary"
            sx={{ fontWeight: 800, px: 1.25 }}
            variant="caption"
          >
            {group.label}
          </Typography>
          <List dense disablePadding>
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href.split("/").filter(Boolean).length > 1 &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <ListItemButton
                  component={NextLink}
                  href={item.href}
                  key={item.href}
                  onClick={() => setMobileOpen(false)}
                  selected={active}
                  sx={{
                    alignItems: "flex-start",
                    borderRadius: 1,
                    my: 0.5,
                    px: 1.25,
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    secondary={item.summary}
                    slotProps={{
                      primary: { sx: { fontWeight: 750 } },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      ))}
    </Stack>
  );

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Box
        component="header"
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          position: "sticky",
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        <Toolbar sx={{ gap: 2, minHeight: { xs: 64, md: 72 } }}>
          <IconButton
            aria-label="Open dashboard navigation"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" } }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <Box sx={{ minWidth: 0 }}>
            <Typography color="text.secondary" variant="caption">
              {eyebrow}
            </Typography>
            <Typography noWrap sx={{ fontWeight: 800 }} variant="h6">
              {title}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {actions ? (
            <Stack direction="row" spacing={1}>
              {actions}
            </Stack>
          ) : (
            <Button component={NextLink} href="/workspace" variant="contained">
              Workspace
            </Button>
          )}
        </Toolbar>
      </Box>
      <Box sx={{ display: "flex" }}>
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: 300 },
          }}
          variant="temporary"
        >
          {nav}
        </Drawer>
        <Drawer
          open
          sx={{
            display: { xs: "none", md: "block" },
            flexShrink: 0,
            width: 300,
            "& .MuiDrawer-paper": {
              borderRight: 1,
              borderColor: "divider",
              boxSizing: "border-box",
              position: "sticky",
              top: 72,
              width: 300,
            },
          }}
          variant="permanent"
        >
          {nav}
        </Drawer>
        <Container
          component="main"
          disableGutters={fullBleed}
          maxWidth={fullBleed ? false : "xl"}
          sx={{
            flexGrow: 1,
            minWidth: 0,
            ...(fullBleed
              ? {
                  display: "flex",
                  minHeight: {
                    xs: "calc(100dvh - 64px)",
                    md: "calc(100dvh - 72px)",
                  },
                }
              : {
                  px: { xs: 2, sm: 3 },
                  py: { xs: 3, md: 4 },
                }),
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}
