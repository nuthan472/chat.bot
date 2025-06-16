export const metadata = {
  title: 'ChatBot | VJC Overseas',
  description: 'Smart ChatBot built with Next.js to assist users in real-time.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Font Example (Optional) */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </head>

      <body className="bg-white text-black font-sans">
        {children}
      </body>
    </html>
  );
}
