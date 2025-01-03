"use client";
import React from 'react';
import Link from 'next/link';

export default function Navigation() {
  const [libraryName, setLibraryName] = React.useState("");

  React.useEffect(() => {
    setLibraryName(localStorage.getItem("libraryName") || "");
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-7">
            <Link href="/dashboard" className="flex items-center py-4">
              <img
                src="/librarylogo.png"
                alt="School Library Logo"
                className="h-8 w-8 mr-2"
              />
              <span className="font-semibold text-gray-700 text-lg">
                {libraryName}
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="py-4 px-2 text-gray-700 hover:text-blue-500"
              >
                Dashboard
              </Link>
              <Link
                href="/books"
                className="py-4 px-2 text-gray-700 hover:text-blue-500"
              >
                Books
              </Link>
              <Link
                href="/borrows"
                className="py-4 px-2 text-gray-700 hover:text-blue-500"
              >
                Borrows
              </Link>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
} 