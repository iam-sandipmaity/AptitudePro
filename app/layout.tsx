import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "AptitudePro",
  description: "Minimal, smooth aptitude practice and test simulation platform."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
          <footer className="site-footer">
            <div className="page-shell site-footer-inner">
              <span>Copyright (c) </span>
              <a href="https://sandipmaity.me" target="_blank" rel="noreferrer">
                sandipmaity.me
              </a>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
