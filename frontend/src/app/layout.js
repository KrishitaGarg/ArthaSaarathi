import "./globals.css";

export const metadata = {
  title: "ArthaSaarathi - Loan Assistant",
  description: "AI navigator for seamless loan approval in minutes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
