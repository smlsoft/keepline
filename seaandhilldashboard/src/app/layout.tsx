import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Sidebar from "@/components/Sidebar";
import { NotificationProvider } from "@/components/NotificationProvider";
import { ScrollHideProvider } from "@/components/ScrollHideProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Keep Line — เก็บประวัติแชท LINE OA & Group ตลอดชีวิต",
  description: "เก็บแชท LINE OA & Group ตลอดชีวิต AI ตามลูกค้า ตามงานพนักงาน CRM สำหรับ SMEs ไทย และสำนักงานบัญชี",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Keep Line",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProviderWrapper>
          <ThemeProvider>
            <NotificationProvider>
              <ScrollHideProvider>
                <div className="flex min-h-screen min-h-dvh">
                  <Sidebar />
                  <main className="flex-1 min-w-0 overflow-y-auto">
                    {children}
                  </main>
                </div>
              </ScrollHideProvider>
            </NotificationProvider>
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
