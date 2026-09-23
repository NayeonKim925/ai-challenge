import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "REPLAN",
  description: "Excel-in project replanning cockpit",
  icons: {
    icon: [
      { url: "/brand/replan-mark-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/replan-mark-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [{ url: "/brand/replan-mark-256.png", sizes: "256x256", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
