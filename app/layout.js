import "./globals.css";
import Sidebar from "./components/Sidebar";
import { AuthProvider } from "./components/AuthProvider";

export const metadata = {
  title: "محلل التغريدات — Yaman.io",
  description: "أداة تحليل وبث التغريدات لحظيًا من واجهة X البرمجية",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-off-white min-h-screen font-ui">
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 mr-[260px] p-8 max-w-6xl">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
