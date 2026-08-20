import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobberTrain | Manufacturer-to-Retailer Training",
  description: "White-label product training that helps manufacturers educate retailer teams and measure product knowledge.",
  icons: {
    icon: [{ url: "/jobbertrain-icon.svg", type: "image/svg+xml" }],
    shortcut: "/jobbertrain-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
