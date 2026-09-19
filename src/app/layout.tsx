import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobberTrain | Manufacturer-to-Retailer Training",
  description: "White-label product training that helps manufacturers educate retailer teams and measure product knowledge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <a href="#main-content" className="jt-skip-link">Skip to main content</a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
