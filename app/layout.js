import "./globals.css";
import Sidebar from "./components/Sidebar";
import { AuthProvider } from "./components/AuthProvider";

export const metadata = {
  title: "X Filtered Stream",
  description: "Stream near real-time Posts matching your filter rules from the X API",
};

/**
 * Root layout — wraps every page with:
 * - AuthProvider: manages Bearer Token in localStorage, auto-injects into API calls
 * - Sidebar: navigation between all pages
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black min-h-screen">
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 max-w-6xl">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
