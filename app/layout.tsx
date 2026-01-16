import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { FirebaseInitializer } from "@/components/firebase-initializer"
import { RegisterServiceWorker } from "./register-sw"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ebenezer Tireshop - Professional Tire Shop & Auto Service in Newark, NJ",
  description: "Complete tire shop and automotive service at 507 Hawthone Ave, Newark, NJ 01772. Find tires, book services, and get expert care for your vehicle.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ebenezer Tireshop",
  },
  applicationName: "Ebenezer Tireshop",
  formatDetection: {
    telephone: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ebenezer" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <RegisterServiceWorker />
        <FirebaseInitializer />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
