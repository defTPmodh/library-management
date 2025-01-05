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
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

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

  const handleReturn = async (bookId) => {
    try {
      const dbName = localStorage.getItem("databaseName");
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

      if (!bookResponse.ok) {
        throw new Error('Failed to update book status');
      }

      // Then update the borrow record
      console.log("Updating borrow record...");
      const borrowResponse = await fetch(`/api/borrows/${activeBorrow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "returned",
          returnDate: new Date()
        }),
      });

      if (!borrowResponse.ok) {
        throw new Error('Failed to update borrow record');
      }

      console.log("Return successful, refreshing data...");
      // Refresh both books and borrows data
      await Promise.all([fetchBooks(), fetchBorrows()]);
      console.log("Data refresh complete");

    } catch (error) {
      console.error("Error returning book:", error);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "all" || book.genre === selectedGenre;
    const matchesStatus = selectedStatus === "all" || book.status === selectedStatus;
    return matchesSearch && matchesGenre && matchesStatus;
  });

  const uniqueGenres = ["all", ...new Set(books.map(book => book.genre))];

  const handleBorrowClick = (book) => {
    setSelectedBook(book.id);
    setShowBorrowForm(true);
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
            className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-xl shadow-lg"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search books by title or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
                >
                  <option value="all">All Genres</option>
                  {uniqueGenres.filter(genre => genre !== "all").map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="borrowed">Borrowed</option>
                </select>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            <motion.div 
              variants={itemVariants}
              className="grid gap-6"
            >
              {filteredBooks.map((book) => {
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
                    className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <motion.i 
                            className="fas fa-book text-primary dark:text-primary-light"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                          ></motion.i>
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                            {book.title}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">by {book.author}</p>
                        <div className="flex space-x-4">
                          <span className="text-sm text-primary dark:text-primary-light">
                            {book.genre}
                          </span>
                          <span className={`text-sm ${
                            book.status === "available"
                              ? "text-accent dark:text-accent-light"
                              : isOverdue
                              ? "text-red-500 dark:text-red-400"
                              : "text-secondary dark:text-secondary-light"
                          }`}>
                            {isOverdue ? "Overdue" : book.status}
                          </span>
                        </div>
                        {borrow && (
                          <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <i className="fas fa-user w-5"></i>
                              {book.borrower}
                            </div>
                            <div className="flex items-center">
                              <i className="fas fa-id-card w-5"></i>
                              GR: {book.gr_number}
                            </div>
                            <div className="flex items-center">
                              <i className="fas fa-graduation-cap w-5"></i>
                              Class: {book.class_name}
                            </div>
                            <div className="flex items-center">
                              <i className="fas fa-calendar-alt w-5"></i>
                              Due: {new Date(borrow.dueDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit'
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        {book.status === "available" ? (
                          <motion.button
                            onClick={() => handleBorrowClick(book)}
                            className="bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white px-6 py-2 rounded-lg transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <i className="fas fa-hand-holding-heart mr-2"></i>
                            Borrow
                          </motion.button>
                        ) : (
                          <motion.button
                            onClick={() => handleReturn(book.id)}
                            className="bg-gradient-to-r from-accent to-accent-light hover:from-accent-dark hover:to-accent text-white px-6 py-2 rounded-lg transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <i className="fas fa-undo mr-2"></i>
                            Return
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {showBorrowForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                onClick={() => setShowBorrowForm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-surface dark:bg-surface-dark p-8 rounded-xl shadow-xl max-w-md w-full mx-4"
                  onClick={e => e.stopPropagation()}
                >
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
                    Borrow Book
                  </h2>
                  <form onSubmit={handleCheckout} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Borrower's Name
                      </label>
                      <input
                        type="text"
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        GR Number
                      </label>
                      <input
                        type="text"
                        value={grNumber}
                        onChange={(e) => setGrNumber(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Class
                      </label>
                      <input
                        type="text"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none"
                        required
                      />
                    </div>
                    <div className="flex space-x-4">
                      <motion.button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white py-3 rounded-lg transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Confirm
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => setShowBorrowForm(false)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default BorrowsPage;