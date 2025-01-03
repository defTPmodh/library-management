import { Inter } from 'next/font/google'
import './globals.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Library Management System',
  description: 'A complete library management solution',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
} 