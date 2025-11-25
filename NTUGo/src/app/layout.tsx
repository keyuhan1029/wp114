import type { Metadata } from "next";
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";

export const metadata: Metadata = {
  title: "NTUGo - 台大學生專屬服務",
  description: "專為台大學生打造的整合式地圖服務平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
