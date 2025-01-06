"use client";
import React from 'react';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

export default function Navigation() {
  const [libraryName, setLibraryName] = React.useState("");
  const { darkMode, toggleDarkMode } = useTheme();

  React.useEffect(() => {
    setLibraryName(localStorage.getItem("libraryName") || "");
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "fas fa-chart-line" },
    { href: "/books", label: "Books", icon: "fas fa-book" },
    { href: "/borrows", label: "Borrows", icon: "fas fa-hand-holding-heart" },
    { href: "/reports", label: "Reports", icon: "fas fa-file-alt" },
  ];

  return (
    <nav className="bg-surface dark:bg-surface-dark shadow-lg backdrop-blur-md bg-opacity-80 dark:bg-opacity-80 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center py-4 group">
              <motion.img
                src="/librarylogo.png"
                alt="School Library Logo"
                className="h-8 w-8 mr-2 group-hover:scale-110 transition-transform"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              />
              <span className="font-semibold text-gray-700 dark:text-gray-200 text-lg">
                {libraryName}
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center space-x-2 py-4 px-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors"
                >
                  <i className={`${link.icon} group-hover:scale-110 transition-transform`}></i>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              <motion.i
                className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'} text-gray-600 dark:text-gray-300`}
                initial={false}
                animate={{ scale: [0.8, 1], rotate: [0, 360] }}
                transition={{ duration: 0.5 }}
              />
            </button>
            <motion.button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </div>
      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-1 p-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center p-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors"
            >
              <i className={link.icon}></i>
              <span className="text-xs mt-1">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
} 