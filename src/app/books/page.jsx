"use client";
import React, { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";
import { motion } from "framer-motion";

// Predefined list of genres
const GENRES = [
  "Fiction",
  "Non-Fiction",
  "Science",
  "Mathematics",
  "History",
  "Biography",
  "Literature",
  "Reference",
  "Children's",
  "Religious",
  "Other"
];

function BooksPage() {
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("Fiction");
  const [selectedGenreFilter, setSelectedGenreFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [libraryName, setLibraryName] = useState("");
  const [statistics, setStatistics] = useState({
    total: 0,
    available: 0,
    genreCounts: {}
  });

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

  // Combined fetch effect
  useEffect(() => {
    const initializePage = async () => {
      const storedLibraryName = localStorage.getItem("libraryName");
      const storedDbName = localStorage.getItem("databaseName");
      setLibraryName(storedLibraryName || "");
      
      try {
        await fetchBooks(storedDbName);
        await fetchBorrows();
      } catch (error) {
        console.error("Error initializing page:", error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  // Update statistics when books change
  useEffect(() => {
    if (books.length > 0 || !loading) {
      const availableBooks = books.filter(book => book.status === "available").length;
      const genreCounts = books.reduce((acc, book) => {
        acc[book.genre] = (acc[book.genre] || 0) + 1;
        return acc;
      }, {});

      setStatistics({
        total: books.length,
        available: availableBooks,
        genreCounts
      });
    }
  }, [books, loading]);

  const fetchBorrows = async () => {
    try {
      const response = await fetch("/api/borrows");
      const data = await response.json();
      setBorrowRecords(data);
    } catch (error) {
      console.error("Error fetching borrows:", error);
    }
  };

  const fetchBooks = async (dbName) => {
    try {
      const response = await fetch(`/api/db/${dbName}`, {
        method: "POST",
        body: JSON.stringify({
          query: "SELECT * FROM `books`",
        }),
      });
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !author) return;

    try {
      const dbName = localStorage.getItem("databaseName");
      console.log("Adding book with genre:", genre); // Debug log
      const response = await fetch(`/api/db/${dbName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query:
            "INSERT INTO `books` (title, author, genre, status) VALUES (?, ?, ?, 'available')",
          values: [title, author, genre],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add book');
      }

      const result = await response.json();
      console.log("Added book:", result); // Debug log

      fetchBooks(dbName);
      setTitle("");
      setAuthor("");
      setGenre("Fiction"); // Reset to default genre
    } catch (error) {
      console.error("Error adding book:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const dbName = localStorage.getItem("databaseName");
      await fetch(`/api/db/${dbName}`, {
        method: "POST",
        body: JSON.stringify({
          query: "DELETE FROM `books` WHERE id = ?",
          values: [id],
        }),
      });
      fetchBooks(dbName);
    } catch (error) {
      console.error("Error deleting book:", error);
    }
  };

  const filteredBooks = selectedGenreFilter === "All" 
    ? books 
    : books.filter(book => book.genre === selectedGenreFilter);

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
        className="p-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h1 
            variants={itemVariants}
            className="text-3xl font-bold mb-8 font-roboto bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            {libraryName} - Book Manager
          </motion.h1>

          {/* Statistics Section */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Total Books</h2>
              <motion.p 
                className="text-3xl font-bold text-primary dark:text-primary-light"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                {statistics.total}
              </motion.p>
            </motion.div>
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Available Books</h2>
              <motion.p 
                className="text-3xl font-bold text-accent dark:text-accent-light"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                {statistics.available}
              </motion.p>
            </motion.div>
          </div>

          {/* Genre Statistics */}
          <motion.div 
            variants={itemVariants}
            className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 mb-8"
          >
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Books by Genre</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(statistics.genreCounts).map(([genre, count], index) => (
                <motion.div 
                  key={genre}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg backdrop-blur-sm"
                >
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">{genre}</h3>
                  <motion.p 
                    className="text-2xl font-bold text-secondary dark:text-secondary-light"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {count}
                  </motion.p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 mb-8"
          >
            <motion.div className="mb-4" variants={itemVariants}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Book Title"
                className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
              />
            </motion.div>
            <motion.div className="mb-4" variants={itemVariants}>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author Name"
                className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
              />
            </motion.div>
            <motion.div className="mb-4" variants={itemVariants}>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g} className="bg-white dark:bg-gray-800">
                    {g}
                  </option>
                ))}
              </select>
            </motion.div>
            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white px-4 py-2 rounded-md transition-all duration-300 transform hover:-translate-y-0.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Add Book
            </motion.button>
          </motion.form>

          <motion.div 
            variants={itemVariants}
            className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold font-roboto text-gray-800 dark:text-gray-200">
                Book List
              </h2>
              <motion.select
                value={selectedGenreFilter}
                onChange={(e) => setSelectedGenreFilter(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <option value="All" className="bg-white dark:bg-gray-800">All Genres</option>
                {GENRES.map((g) => (
                  <option key={g} value={g} className="bg-white dark:bg-gray-800">
                    {g}
                  </option>
                ))}
              </motion.select>
            </div>
            {filteredBooks.length === 0 ? (
              <motion.p 
                variants={itemVariants}
                className="text-gray-500 dark:text-gray-400"
              >
                No books found
              </motion.p>
            ) : (
              <motion.ul className="space-y-4">
                {filteredBooks.map((book, index) => (
                  <motion.li
                    key={book.id}
                    variants={itemVariants}
                    custom={index}
                    className="flex justify-between items-center border-b border-gray-300 dark:border-gray-600 pb-2"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">{book.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">by {book.author}</p>
                      <div className="flex space-x-2">
                        <span
                          className={`text-sm ${
                            book.status === "available"
                              ? "text-accent dark:text-accent-light"
                              : "text-secondary dark:text-secondary-light"
                          }`}
                        >
                          {book.status}
                        </span>
                        <span className="text-sm text-primary dark:text-primary-light">
                          {book.genre}
                        </span>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => handleDelete(book.id)}
                      className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <i className="fas fa-trash"></i>
                    </motion.button>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default BooksPage;