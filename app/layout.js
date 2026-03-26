import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "X Filtered Stream",
  description: "Stream near real-time Posts matching your filter rules from the X API",
};

/**
 * Root layout — wraps every page with the sidebar navigation.
 *
 * The sidebar provides navigation between all pages and shows
 * a quick status indicator for the stream connection.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 max-w-6xl">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
