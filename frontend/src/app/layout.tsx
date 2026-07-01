import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/layout/query-provider";
import { ThemeApplier } from "@/components/layout/theme-provider";
import { AuthInitializer } from "@/components/layout/auth-initializer";
import { CartInitializer } from "@/components/layout/cart-initializer";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { StoreSyncer } from "@/components/layout/page-transition";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "DeshiCart — Premium Bangladeshi Goods", template: "%s | DeshiCart" },
  description: "Shop premium Bangladeshi products with a fast, beautiful checkout experience.",
  keywords: ["Bangladesh", "e-commerce", "DeshiCart", "online shopping"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <QueryProvider>
          <ThemeApplier />
          <AuthInitializer />
          <CartInitializer />
          <StoreSyncer />
          <Navbar />
          <CartDrawer />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "rounded-2xl border border-ink-200/60 bg-white/90 backdrop-blur-xl shadow-elev dark:border-ink-800/60 dark:bg-ink-950/90",
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
