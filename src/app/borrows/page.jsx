"use client";
import React, { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";
import { motion, AnimatePresence } from "framer-motion";

function BorrowsPage() {
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [books, setBooks] = useState([]);
  const [borrowerName, setBorrowerName] = useState("");
  const [grNumber, setGrNumber] = useState("");
  const [className, setClassName] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [returnBook, setReturnBook] = useState("");
  const [libraryName, setLibraryName] = useState("");
  const [dbName, setDbName] = useState("");
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
    const initializePage = async () => {
      const storedLibraryName = localStorage.getItem("libraryName");
      const storedDbName = localStorage.getItem("databaseName");
      setLibraryName(storedLibraryName || "");
      setDbName(storedDbName || "");
      
      try {
        await Promise.all([fetchBorrows(), fetchBooks()]);
      } catch (error) {
        console.error("Error initializing page:", error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  const fetchBorrows = async () => {
    try {
      const response = await fetch("/api/borrows");
      const data = await response.json();
      console.log("Fetched borrow records:", data);
      if (data.length > 0) {
        console.log("Sample borrow record structure:", data[0]);
        console.log("Sample bookId type:", typeof data[0].bookId);
        console.log("Sample bookId value:", data[0].bookId);
      }
      setBorrowRecords(data);
    } catch (error) {
      console.error("Error fetching borrows:", error);
      setBorrowRecords([]);
    }
  };

  const fetchBooks = async () => {
    try {
      const dbName = localStorage.getItem("databaseName");
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

  const handleCheckout = async (e) => {
    e.preventDefault();
    const bookId = selectedBook;
    const dbName = localStorage.getItem("databaseName");
    const borrowDate = new Date().toISOString().split("T")[0];

    try {
      console.log("Checking out book:", {
        bookId,
        borrowerName,
        grNumber,
        className
      });

      // First update the book status
      const bookResponse = await fetch(`/api/db/${dbName}`, {
        method: "POST",
        body: JSON.stringify({
          query:
            "UPDATE `books` SET status = 'borrowed', borrower = ?, gr_number = ?, class_name = ? WHERE id = ?",
          values: [borrowerName, grNumber, className, bookId],
        }),
      });

      if (!bookResponse.ok) {
        throw new Error('Failed to update book status');
      }

      // Then create the borrow record
      const borrowResponse = await fetch("/api/borrows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          borrowerName,
          grNumber,
          className,
          status: "borrowed",
          borrowDate,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        }),
      });

      if (!borrowResponse.ok) {
        throw new Error('Failed to create borrow record');
      }

      // Refresh the data
      await Promise.all([fetchBorrows(), fetchBooks()]);
      setBorrowerName("");
      setGrNumber("");
      setClassName("");
      setSelectedBook("");
    } catch (error) {
      console.error("Error checking out book:", error);
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    if (!returnBook) {
      console.log("No book selected for return");
      return;
    }

    try {
      const dbName = localStorage.getItem("databaseName");
      const bookId = parseInt(returnBook);
      console.log("Attempting to return book:", {
        bookId,
        dbName
      });

      // Find the active borrow record first
      const activeBorrow = borrowRecords.find(
        record => record.bookId === bookId && record.status === "borrowed"
      );

      if (!activeBorrow) {
        console.error("No active borrow record found for book:", bookId);
        return;
      }

      console.log("Found active borrow:", activeBorrow);

      // First update the book status to available
      console.log("Updating book status...");
      const bookResponse = await fetch(`/api/db/${dbName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: "UPDATE books SET status = 'available', borrower = NULL, gr_number = NULL, class_name = NULL WHERE id = ?",
          values: [bookId],
        }),
      });

      const bookResult = await bookResponse.json();
      console.log("Book update response:", bookResult);

      if (!bookResponse.ok) {
        throw new Error(`Failed to update book status: ${bookResult.error || 'Unknown error'}`);
      }

      // Then update the borrow record using the borrow ID
      console.log("Updating borrow record...");
      const borrowResponse = await fetch(`/api/borrows/${activeBorrow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "returned"
        }),
      });

      const borrowResult = await borrowResponse.json();
      console.log("Borrow update response:", borrowResult);

      if (!borrowResponse.ok) {
        throw new Error(`Failed to update borrow record: ${borrowResult.error || 'Unknown error'}`);
      }

      console.log("Return successful, refreshing data...");
      // Refresh both books and borrows data
      await fetchBooks();
      await fetchBorrows();
      setReturnBook("");
      console.log("Data refresh complete");

    } catch (error) {
      console.error("Error returning book:", error);
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
          <i className="fas fa-circle-notch fa-spin mr-2"></i>
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
        <div className="max-w-7xl mx-auto space-y-10">
          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-between"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-roboto">
              Library Book Management
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
            className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center mb-6">
              <motion.i 
                className="fas fa-book-open text-primary dark:text-primary-light text-2xl mr-3"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              ></motion.i>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                Check Out Book
              </h2>
            </div>
            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Borrower's Name
                  </label>
                  <input
                    type="text"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
                    required
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    GR Number
                  </label>
                  <input
                    type="text"
                    value={grNumber}
                    onChange={(e) => setGrNumber(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
                    required
                  />
                </motion.div>
              </div>
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Class
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
                  required
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Select Book
                </label>
                <select
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
                  required
                >
                  <option value="">Select a book</option>
                  {books
                    .filter((book) => book.status === "available")
                    .map((book) => (
                      <option key={book.id} value={book.id} className="bg-white dark:bg-gray-800">
                        {book.title} by {book.author}
                      </option>
                    ))}
                </select>
              </motion.div>
              <motion.button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white py-3 px-6 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Check Out Book
              </motion.button>
            </form>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              variants={itemVariants}
              className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <motion.i 
                  className="fas fa-undo text-accent dark:text-accent-light text-2xl mr-3"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity }}
                ></motion.i>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                  Return Book
                </h2>
              </div>
              <form onSubmit={handleReturn} className="space-y-6">
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Select Book to Return
                  </label>
                  <select
                    value={returnBook}
                    onChange={(e) => setReturnBook(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
                    required
                  >
                    <option value="">Select a book to return</option>
                    {books
                      .filter((book) => book.status === "borrowed")
                      .map((book) => (
                        <option key={book.id} value={book.id} className="bg-white dark:bg-gray-800">
                          {book.title} (Borrowed by {book.borrower})
                        </option>
                      ))}
                  </select>
                </motion.div>
                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-accent to-accent-light hover:from-accent-dark hover:to-accent text-white py-3 px-6 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <i className="fas fa-check mr-2"></i>
                  Return Book
                </motion.button>
              </form>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <motion.i 
                    className="fas fa-list text-secondary dark:text-secondary-light text-2xl mr-3"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  ></motion.i>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                    Book Status
                  </h2>
                </div>
                <div className="flex space-x-4 text-sm">
                  <span className="flex items-center">
                    <motion.div 
                      className="w-3 h-3 rounded-full bg-accent dark:bg-accent-light mr-2"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    ></motion.div>
                    <span className="text-gray-600 dark:text-gray-400">Available</span>
                  </span>
                  <span className="flex items-center">
                    <motion.div 
                      className="w-3 h-3 rounded-full bg-secondary dark:bg-secondary-light mr-2"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    ></motion.div>
                    <span className="text-gray-600 dark:text-gray-400">Borrowed</span>
                  </span>
                  <span className="flex items-center">
                    <motion.div 
                      className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-400 mr-2"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    ></motion.div>
                    <span className="text-gray-600 dark:text-gray-400">Overdue</span>
                  </span>
                </div>
              </div>
              <AnimatePresence>
                <motion.div className="space-y-4">
                  {books?.map((book) => {
                    const borrow = borrowRecords?.find(
                      (b) => b.bookId === book.id && b.status === "borrowed"
                    );
                    const isOverdue = borrow && new Date(borrow.dueDate) < new Date();

                    return (
                      <motion.div
                        key={book.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex justify-between items-start p-4 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-light bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all duration-300"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <motion.i 
                              className="fas fa-book text-primary dark:text-primary-light"
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            ></motion.i>
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {book.title}
                            </span>
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">by {book.author}</div>
                          {borrow && (
                            <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                              <div className="flex items-center">
                                <i className="fas fa-clock w-5"></i>
                                Borrowed:{" "}
                                {new Date(borrow.borrowDate).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: '2-digit'
                                })}
                              </div>
                              <div className="flex items-center">
                                <i className="fas fa-calendar-alt w-5"></i>
                                Due:{" "}
                                {new Date(borrow.dueDate).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: '2-digit'
                                })}
                              </div>
                              <div className="flex items-center">
                                <i className="fas fa-user w-5"></i>
                                {book.borrower}
                              </div>
                              <div className="flex items-center">
                                <i className="fas fa-id-card w-5"></i>
                                {book.gr_number}
                              </div>
                              <div className="flex items-center">
                                <i className="fas fa-graduation-cap w-5"></i>
                                {book.class_name}
                              </div>
                            </div>
                          )}
                        </div>
                        <motion.div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            book.status === "available"
                              ? "bg-accent/10 dark:bg-accent-light/10 text-accent dark:text-accent-light"
                              : isOverdue
                              ? "bg-red-500/10 dark:bg-red-400/10 text-red-500 dark:text-red-400"
                              : "bg-secondary/10 dark:bg-secondary-light/10 text-secondary dark:text-secondary-light"
                          }`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {isOverdue ? "overdue" : book.status}
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default BorrowsPage;