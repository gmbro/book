import type { Metadata } from "next";
import "./globals.css";

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
      <body>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
