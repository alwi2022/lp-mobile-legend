import "./globals.css";

export const metadata = {
  title: "Satria Gear",
  description:
    "Website turnamen Mobile Legends Satria Tournament dengan beranda ringkas, jadwal, bracket, tim, siaran, dan pendaftaran tim.",
  icons: {
    icon: "/sg.png",
    shortcut: "/sg.png",
    apple: "/sg.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=Rajdhani:wght@400;500;600;700&family=Teko:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
