import type { Metadata } from 'next'
import './globals.css'

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Coco Dental Clinic',
  description: 'Coco Dental Clinic',
  generator: 'Abdikhafar Mohamed',
  icons: {
    icon: 'https://res.cloudinary.com/ddkkfumkl/image/upload/v1750490845/20230208_dental-removebg-preview_uapb8o.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://res.cloudinary.com/ddkkfumkl/image/upload/v1750490845/20230208_dental-removebg-preview_uapb8o.png" type="image/png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
