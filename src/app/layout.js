import { Inter } from 'next/font/google'
import './globals.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { ThemeProvider } from '../context/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Library Management System',
  description: 'A complete library management solution',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-background dark:bg-background-dark transition-colors duration-300`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
} 