"use client";
import React, { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";
import { motion } from "framer-motion";

function DashboardPage() {
  const [selectedSection, setSelectedSection] = useState("available");
  const [books, setBooks] = useState([]);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [libraryName, setLibraryName] = useState("");
  const [users, setUsers] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [loading, setLoading] = useState(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  useEffect(() => {
    const storedLibraryName = localStorage.getItem("libraryName");
    setLibraryName(storedLibraryName || "");
    fetchData();
    fetchUsers();
  }, []);

  const fetchData = async () => {
    try {
      const dbName = localStorage.getItem("databaseName");
      const response = await fetch(`/api/db/${dbName}`, {
        method: "POST",
        body: JSON.stringify({
          query: "SELECT * FROM `books`",
        }),
      });
      const data = await response.json();
      setBooks(data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const dbName = localStorage.getItem("databaseName");
      const response = await fetch(`/api/db/${dbName}`, {
        method: "POST",
        body: JSON.stringify({
          query: "SELECT * FROM `users`",
        }),
      });
      const data = await response.json();
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
  };

  const filteredBooks = (books || []).filter(
    (book) =>
      book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableBooks = filteredBooks.filter(
    (book) => book.status === "available"
  );
  const borrowedBooks = filteredBooks.filter(
    (book) => book.status === "borrowed"
  );
  const overdueBooks = filteredBooks.filter(
    (book) => book.status === "overdue"
  );

  const handleEdit = (book) => {
    window.location.href = `/books?edit=${book.id}`;
  };

  const handleDelete = async (id) => {
    try {
      await fetch("/api/db/books-3782972", {
        method: "POST",
        body: JSON.stringify({
          query: "DELETE FROM `books` WHERE id = ?",
          values: [id],
        }),
      });
      fetchData();
    } catch (err) {
      console.error("Error deleting book:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background-dark flex justify-center items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xl font-roboto text-gray-800 dark:text-gray-200"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-background-dark dark:via-background-dark dark:to-primary-dark/5 transition-colors duration-300">
      <Navigation />
      <motion.div 
        className="p-8 md:p-12"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-between mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-roboto">
              {libraryName} Dashboard
            </h1>
            <motion.div 
              className="text-primary dark:text-primary-light"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -10, 10, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <i className="fas fa-book-reader text-3xl"></i>
            </motion.div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mb-8"
          >
            <div className="flex items-center">
              <i className="fas fa-search text-primary dark:text-primary-light text-xl mr-3"></i>
              <input
                type="text"
                placeholder="Search books by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Available Books Section */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className={`bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-8 rounded-xl shadow-lg transition-all duration-300 cursor-pointer ${
                selectedSection === "available" ? "ring-2 ring-primary dark:ring-primary-light" : ""
              }`}
              onClick={() => setSelectedSection("available")}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <motion.i 
                    className="fas fa-book text-accent dark:text-accent-light text-2xl mr-3"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  ></motion.i>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 font-roboto">
                    Available Books
                  </h2>
                </div>
                <span className="bg-accent/10 dark:bg-accent-light/10 text-accent dark:text-accent-light py-1 px-4 rounded-full text-sm font-medium">
                  {availableBooks.length}
                </span>
              </div>
              <div className="space-y-4">
                {availableBooks.map((book) => (
                  <BookItem
                    key={book.id}
                    book={book}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </motion.div>

            {/* Borrowed Books Section */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className={`bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-8 rounded-xl shadow-lg transition-all duration-300 cursor-pointer ${
                selectedSection === "borrowed" ? "ring-2 ring-primary dark:ring-primary-light" : ""
              }`}
              onClick={() => setSelectedSection("borrowed")}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <motion.i 
                    className="fas fa-hand-holding-heart text-secondary dark:text-secondary-light text-2xl mr-3"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  ></motion.i>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 font-roboto">
                    Borrowed Books
                  </h2>
                </div>
                <span className="bg-secondary/10 dark:bg-secondary-light/10 text-secondary dark:text-secondary-light py-1 px-4 rounded-full text-sm font-medium">
                  {borrowedBooks.length}
                </span>
              </div>
              <div className="space-y-4">
                {borrowedBooks.map((book) => (
                  <BookItem
                    key={book.id}
                    book={book}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </motion.div>

            {/* Overdue Books Section */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className={`bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-8 rounded-xl shadow-lg transition-all duration-300 cursor-pointer ${
                selectedSection === "overdue" ? "ring-2 ring-primary dark:ring-primary-light" : ""
              }`}
              onClick={() => setSelectedSection("overdue")}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <motion.i 
                    className="fas fa-exclamation-circle text-red-500 dark:text-red-400 text-2xl mr-3"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  ></motion.i>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 font-roboto">
                    Overdue Books
                  </h2>
                </div>
                <span className="bg-red-500/10 dark:bg-red-400/10 text-red-500 dark:text-red-400 py-1 px-4 rounded-full text-sm font-medium">
                  {overdueBooks.length}
                </span>
              </div>
              <div className="space-y-4">
                {overdueBooks.map((book) => (
                  <BookItem
                    key={book.id}
                    book={book}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// BookItem component
function BookItem({ book, menuOpen, setMenuOpen, onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-light bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all duration-300 relative"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <i className="fas fa-book text-primary dark:text-primary-light"></i>
            <h3 className="font-medium text-gray-800 dark:text-gray-200">{book.title}</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">by {book.author}</p>
        </div>
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(menuOpen === book.id ? null : book.id)}
            className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors"
          >
            <i className="fas fa-ellipsis-v"></i>
          </motion.button>
          {menuOpen === book.id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10"
            >
              <div className="py-1">
                <motion.button
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                  onClick={() => onEdit(book)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <i className="fas fa-edit mr-2"></i>Edit
                </motion.button>
                <motion.button
                  whileHover={{ backgroundColor: "rgba(239,68,68,0.1)" }}
                  onClick={() => onDelete(book.id)}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400"
                >
                  <i className="fas fa-trash-alt mr-2"></i>Delete
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default DashboardPage;