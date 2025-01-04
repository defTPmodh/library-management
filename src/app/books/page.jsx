"use client";
import React, { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";

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
      await fetch(`/api/db/${dbName}`, {
        method: "POST",
        body: JSON.stringify({
          query:
            "INSERT INTO `books` (title, author, genre, status) VALUES (?, ?, ?, 'available')",
          values: [title, author, genre],
        }),
      });

      fetchBooks(dbName);
      setTitle("");
      setAuthor("");
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
      <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-center">
        <div className="text-xl font-roboto">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 font-roboto text-gray-800">
            {libraryName} - Book Manager
          </h1>

          {/* Statistics Section */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Total Books</h2>
              <p className="text-3xl font-bold text-blue-600">{statistics.total}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Available Books</h2>
              <p className="text-3xl font-bold text-green-600">{statistics.available}</p>
            </div>
          </div>

          {/* Genre Statistics */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Books by Genre</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(statistics.genreCounts).map(([genre, count]) => (
                <div key={genre} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700">{genre}</h3>
                  <p className="text-2xl font-bold text-indigo-600">{count}</p>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-md mb-8"
          >
            <div className="mb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Book Title"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author Name"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Add Book
            </button>
          </form>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold font-roboto text-gray-800">
                Book List
              </h2>
              <select
                value={selectedGenreFilter}
                onChange={(e) => setSelectedGenreFilter(e.target.value)}
                className="p-2 border rounded-md"
              >
                <option value="All">All Genres</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            {filteredBooks.length === 0 ? (
              <p className="text-gray-500">No books found</p>
            ) : (
              <ul className="space-y-4">
                {filteredBooks.map((book) => (
                  <li
                    key={book.id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <h3 className="font-semibold">{book.title}</h3>
                      <p className="text-gray-600">by {book.author}</p>
                      <div className="flex space-x-2">
                        <span
                          className={`text-sm ${
                            book.status === "available"
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {book.status}
                        </span>
                        <span className="text-sm text-indigo-600">
                          {book.genre}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BooksPage;