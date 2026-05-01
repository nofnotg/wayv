import type { Metadata } from "next";
import { Newsreader, Noto_Sans_KR } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import { systemCopy } from "@/lib/copy/system-copy";
import { isApprovedViewer } from "@/lib/services/beta-access-guard-service";
import { getNotificationInboxSummary } from "@/lib/services/notification-inbox-service";
import { getViewerContext } from "@/lib/services/viewer-service";

import "./globals.css";

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader"
});

const sans = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto-sans-kr"
});

export const metadata: Metadata = {
  title: "wayv",
  description: systemCopy.brand.description,
  icons: {
    icon: "/favicon.ico"
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getViewerContext();
  const notificationSummary = viewer && isApprovedViewer(viewer)
    ? await getNotificationInboxSummary(viewer.userId)
    : null;

  return (
    <html lang="ko">
      <body className={`${serif.variable} ${sans.variable} font-sans antialiased`}>
        <AppShell viewer={viewer} notificationSummary={notificationSummary}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
