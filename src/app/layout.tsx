import type { Metadata } from "next";
import "./globals.css";
import UpdateChecker from "@/components/UpdateChecker";

export const metadata: Metadata = {
  title: "1+1 독서모임",
  description: "1+1 독서모임 일정 관리 및 투표 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#f7f7fb" />
      </head>
      <body>
        <UpdateChecker />
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
