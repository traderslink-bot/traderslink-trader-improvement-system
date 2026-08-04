import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { MuiProviders } from "@/app/mui-provider";

export default function AnalyticsLabLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <InitColorSchemeScript attribute="data" defaultMode="light" />
      <AppRouterCacheProvider options={{ enableCssLayer: true }}>
        <MuiProviders>{children}</MuiProviders>
      </AppRouterCacheProvider>
    </>
  );
}
