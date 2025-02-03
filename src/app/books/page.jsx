"use client";
import React, { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";
import { motion } from "framer-motion";
import BookDetailsModal from "../../components/BookDetailsModal";
import ExcelJS from "exceljs";

// Predefined list of genres
const GENRES = [
  "Uncategorized",
  "Fiction",
  "General Knowledge",
  "Reference",
  "Technology",
  "Language",
  "FRENCH",
  "Life Science",
  "History of Asia",
  "REFERENCE",
  "Old English Literatures",
  "Home Economics",
  "Medical Science",
  "Biography",
  "Drawing",
  "Textile Arts",
  "Arts",
  "Customs etiquette",
  "Decorative Art",
  "Literature Language",
  "Physics",
  "Maths",
  "Literature",
  "Astronomy",
  "Political Science",
  "English Drama",
  "English Poetry",
  "Knowledge",
  "Social Service",
  "CLASSICAL Greek",
  "English",
  "Social Science",
  "General",
  "Science",
  "Philosophy",
  "Recreational & Performing Arts",
  "General History Asia",
  "English Letter",
  "Cosmology",
  "Zoological Sciences",
  "Geography & Travel",
  "History of ancient world",
  "History",
  "Economics",
  "Transport",
  "Engineering",
  "Orchards",
  "Space",
  "Earth Science",
  "World History",
  "Literatures",
  "Culture & Institutions",
  "Letter",
  "Journalism",
  "English Speeches",
  "Islamic",
  "English Essays",
  "Hindi Literatures",
  "Psychology",
  "Science & Technology",
  "Easy Learning",
  "Folklore",
  "Standard English",
  "English Writing",
  "Zoology",
  "Physiological",
  "English Literatures",
  "Education",
  "Customs",
  "History of South America",
  "History Of Europe",
  "Linguistics",
  "English Grammar",
  "Other Language",
  "Applied Physics",
  "English Encyclopedia",
  "Geography",
  "Building",
  "Religion",
  "Natural History",
  "Human Physiology",
  "Industrial Oil",
  "Photography",
  "Land Economics",
  "Generalities",
  "Plants",
  "Christian Moral",
  "Management",
  "General Management",
  "Economic",
  "Christian Experience",
  "Agriculture",
  "Library & Information Science",
  "Public Performances",
  "Religions",
  "Applied Science",
  "French",
  "Applied Psychology",
  "Financial Economics",
  "General Collections",
  "Child rearing & Home Care",
  "Food & Drink",
  "Chemistry",
  "Ecology",
  "Education Research",
  "General history of Europe",
  "Physical Education",
  "Logic"
].sort();

function BooksPage() {
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [bookId, setBookId] = useState("");
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
  const [accNo, setAccNo] = useState("");
  const [classNo, setClassNo] = useState("");
  const [publisher, setPublisher] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [editingBook, setEditingBook] = useState(null);

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

  const fetchBooks = async () => {
    try {
      const dbName = localStorage.getItem("databaseName");
      const library = localStorage.getItem("libraryName");
      console.log("Fetching books for library:", library);
      
      const response = await fetch(`/api/db/${dbName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: "SELECT * FROM `books`"
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch books');
      }
      
      const data = await response.json();
      console.log("Received books:", data);
      setBooks(data);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !author || !bookId) return;

    try {
      const dbName = localStorage.getItem("databaseName");
      console.log("Adding book with:", {
        bookId,
        accNo,
        classNo,
        title,
        author,
        publisher,
        genre
      });
      
      const response = await fetch(`/api/db/${dbName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: "INSERT INTO `books` (id, acc_no, class_no, title, author, publisher, genre, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'available')",
          values: [parseInt(bookId), accNo, classNo, title, author, publisher, genre]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to add book');
      }

      console.log("Book added successfully:", data);
      await fetchBooks();
      
      // Reset form
      setBookId("");
      setAccNo("");
      setClassNo("");
      setTitle("");
      setAuthor("");
      setPublisher("");
      setGenre("Fiction");
    } catch (error) {
      console.error("Error adding book:", error);
      alert(error.message); // Show error to user
    }
  };

  const handleDelete = async (id) => {
    try {
      const dbName = localStorage.getItem("databaseName");
      const response = await fetch(`/api/db/${dbName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'DELETE FROM `books` WHERE id = ?',
          values: [id]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to delete book');
      }

      fetchBooks();
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("Failed to delete book. Make sure there are no active borrows for this book.");
    }
  };

  const handleExportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Accession Register');

    // Updated headers for all fields
    worksheet.columns = [
      { header: 'Acc. No.', key: 'acc_no', width: 15 },
      { header: 'Class No.', key: 'class_no', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Author', key: 'author', width: 20 },
      { header: 'Publisher', key: 'publisher', width: 20 },
      { header: 'Genre', key: 'genre', width: 15 }
    ];

    // Add all books to the worksheet
    const filteredBooks = selectedGenreFilter === "All" 
      ? books 
      : books.filter(book => book.genre === selectedGenreFilter);

    filteredBooks.forEach(book => {
      worksheet.addRow({
        acc_no: book.acc_no || '',
        class_no: book.class_no || '',
        title: book.title,
        author: book.author,
        publisher: book.publisher || '',
        genre: book.genre
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Generate the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${libraryName}_accession_register.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEditClick = (book) => {
    setEditingBook({
      ...book,
      tempTitle: book.title,
      tempAuthor: book.author,
      tempGenre: book.genre,
      tempAccNo: book.acc_no || '',
      tempClassNo: book.class_no || '',
      tempPublisher: book.publisher || ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      const dbName = localStorage.getItem("databaseName");
      const response = await fetch(`/api/books/${editingBook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingBook.tempTitle,
          author: editingBook.tempAuthor,
          genre: editingBook.tempGenre,
          acc_no: editingBook.tempAccNo,
          class_no: editingBook.tempClassNo,
          publisher: editingBook.tempPublisher,
          library: libraryName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update book');
      }

      await fetchBooks();
      setEditingBook(null);
    } catch (error) {
      console.error('Error updating book:', error);
      alert('Failed to update book');
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
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                placeholder="Book ID"
                className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
              />
            </motion.div>
            <motion.div className="mb-4" variants={itemVariants}>
              <input
                type="text"
                value={accNo}
                onChange={(e) => setAccNo(e.target.value)}
                placeholder="Accession Number"
                className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
              />
            </motion.div>
            <motion.div className="mb-4" variants={itemVariants}>
              <input
                type="text"
                value={classNo}
                onChange={(e) => setClassNo(e.target.value)}
                placeholder="Class Number"
                className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
              />
            </motion.div>
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
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="Publisher"
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
                {filteredBooks.map((book) => (
                  <motion.li
                    key={book.id}
                    className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg shadow backdrop-blur-sm"
                  >
                    {editingBook?.id === book.id ? (
                      <div className="w-full space-y-3">
                        <input
                          type="text"
                          value={editingBook.tempTitle}
                          onChange={(e) => setEditingBook({...editingBook, tempTitle: e.target.value})}
                          className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50"
                          placeholder="Book Title"
                        />
                        <input
                          type="text"
                          value={editingBook.tempAuthor}
                          onChange={(e) => setEditingBook({...editingBook, tempAuthor: e.target.value})}
                          className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50"
                          placeholder="Author"
                        />
                        <input
                          type="text"
                          value={editingBook.tempAccNo}
                          onChange={(e) => setEditingBook({...editingBook, tempAccNo: e.target.value})}
                          className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50"
                          placeholder="Accession Number"
                        />
                        <input
                          type="text"
                          value={editingBook.tempClassNo}
                          onChange={(e) => setEditingBook({...editingBook, tempClassNo: e.target.value})}
                          className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50"
                          placeholder="Class Number"
                        />
                        <input
                          type="text"
                          value={editingBook.tempPublisher}
                          onChange={(e) => setEditingBook({...editingBook, tempPublisher: e.target.value})}
                          className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50"
                          placeholder="Publisher"
                        />
                        <select
                          value={editingBook.tempGenre}
                          onChange={(e) => setEditingBook({...editingBook, tempGenre: e.target.value})}
                          className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50"
                        >
                          {GENRES.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                        <div className="flex space-x-2">
                          <motion.button
                            onClick={handleSaveEdit}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-primary text-white rounded-md"
                          >
                            Save
                          </motion.button>
                          <motion.button
                            onClick={() => setEditingBook(null)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md"
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                            <span className="text-primary dark:text-primary-light mr-2">#{book.id}</span>
                            {book.title}
                          </h3>
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
                        <div className="flex space-x-2">
                          <motion.button
                            onClick={() => handleEditClick(book)}
                            className="text-primary dark:text-primary-light hover:text-primary-dark dark:hover:text-primary-light/80"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <i className="fas fa-edit"></i>
                          </motion.button>
                          <motion.button
                            onClick={() => handleDelete(book.id)}
                            className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <i className="fas fa-trash"></i>
                          </motion.button>
                        </div>
                      </>
                    )}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </motion.div>
        </div>
      </motion.div>

      <BookDetailsModal 
        book={selectedBook} 
        onClose={() => setSelectedBook(null)} 
      />
    </div>
  );
}

export default BooksPage;
