import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { headers } from "next/headers"
import ContextProvider from "@/context"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Cobbee - Support Creators You Love",
  description: "Accept donations, build community, and get support from people who love your work. Support your favorite creators with crypto coffee.",
  generator: "cobbee.fun",
  metadataBase: new URL('https://cobbee.fun'),
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cobbee',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cobbee.fun',
    siteName: 'Cobbee',
    title: 'Cobbee - Support Creators You Love',
    description: 'Accept donations, build community, and get support from people who love your work. Support your favorite creators with crypto coffee.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Cobbee - Support Creators You Love',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cobbee - Support Creators You Love',
    description: 'Accept donations, build community, and get support from people who love your work. Support your favorite creators with crypto coffee.',
    images: ['/og-image.jpg'],
  },
}

export const viewport = {
  themeColor: '#CCFF00',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const cookies = headersList.get('cookie')

  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ContextProvider cookies={cookies}>
          {children}
          <Analytics />
        </ContextProvider>
      </body>
    </html>
  )
}
