"use client";
import React, { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";

function BooksPage() {
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(true);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [libraryName, setLibraryName] = useState("");

  useEffect(() => {
    const storedLibraryName = localStorage.getItem("libraryName");
    const storedDbName = localStorage.getItem("databaseName");
    setLibraryName(storedLibraryName || "");
    fetchBooks(storedDbName);
    fetchBorrows();
    setLoading(false);
  }, []);

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
    setLoading(false);
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
            "INSERT INTO `books` (title, author, status) VALUES (?, ?, 'available')",
          values: [title, author],
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-center">
        <div className="text-xl font-roboto">Loading...</div>
      </div>
    );
  }

  const getBookStatus = (book) => {
    return book.status === "borrowed" ? "borrowed" : "available";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 font-roboto text-gray-800">
            {libraryName} - Book Manager
          </h1>
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
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Add Book
            </button>
          </form>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 font-roboto text-gray-800">
              Book List
            </h2>
            {books.length === 0 ? (
              <p className="text-gray-500">No books added yet</p>
            ) : (
              <ul className="space-y-4">
                {books.map((book) => (
                  <li
                    key={book.id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <h3 className="font-semibold">{book.title}</h3>
                      <p className="text-gray-600">by {book.author}</p>
                      <span
                        className={`text-sm ${
                          getBookStatus(book) === "available"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {getBookStatus(book)}
                      </span>
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