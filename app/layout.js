import "./globals.css";
import Sidebar from "./components/Sidebar";
import { AuthProvider } from "./components/AuthProvider";

export const metadata = {
  title: "محلل التغريدات — Rimthan",
  description: "أداة تحليل وبث التغريدات لحظيًا من واجهة X البرمجية",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-off-white min-h-screen font-ui">
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:mr-[260px] pt-16 md:pt-0 p-4 md:p-8 max-w-6xl">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
