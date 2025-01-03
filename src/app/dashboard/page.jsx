"use client";
import React, { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";

function DashboardPage() {
  const [selectedSection, setSelectedSection] = useState("available");
  const [books, setBooks] = useState([]);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [libraryName, setLibraryName] = useState("");
  const [users, setUsers] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);

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

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navigation />
      <div className="p-8 md:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-[#2c3e50] font-roboto">
              {libraryName} Dashboard
            </h1>
            <div className="text-[#7f8c8d]">
              <i className="fas fa-book-reader text-3xl"></i>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow mb-8">
            <div className="flex items-center">
              <i className="fas fa-search text-[#3498db] text-xl mr-3"></i>
              <input
                type="text"
                placeholder="Search books by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#dfe6e9] focus:ring-2 focus:ring-[#3498db] focus:border-[#3498db] transition-colors outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Available Books Section */}
            <div
              className={`bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow ${
                selectedSection === "available" ? "ring-2 ring-[#3498db]" : ""
              }`}
              onClick={() => setSelectedSection("available")}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <i className="fas fa-book text-[#2ecc71] text-2xl mr-3"></i>
                  <h2 className="text-2xl font-semibold text-[#2c3e50] font-roboto">
                    Available Books
                  </h2>
                </div>
                <span className="bg-[#2ecc71]/10 text-[#2ecc71] py-1 px-4 rounded-full text-sm font-medium">
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
            </div>

            {/* Borrowed Books Section */}
            <div
              className={`bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow ${
                selectedSection === "borrowed" ? "ring-2 ring-[#3498db]" : ""
              }`}
              onClick={() => setSelectedSection("borrowed")}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <i className="fas fa-hand-holding-heart text-[#f1c40f] text-2xl mr-3"></i>
                  <h2 className="text-2xl font-semibold text-[#2c3e50] font-roboto">
                    Borrowed Books
                  </h2>
                </div>
                <span className="bg-[#f1c40f]/10 text-[#f1c40f] py-1 px-4 rounded-full text-sm font-medium">
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
            </div>

            {/* Overdue Books Section */}
            <div
              className={`bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow ${
                selectedSection === "overdue" ? "ring-2 ring-[#3498db]" : ""
              }`}
              onClick={() => setSelectedSection("overdue")}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-circle text-[#e74c3c] text-2xl mr-3"></i>
                  <h2 className="text-2xl font-semibold text-[#2c3e50] font-roboto">
                    Overdue Books
                  </h2>
                </div>
                <span className="bg-[#e74c3c]/10 text-[#e74c3c] py-1 px-4 rounded-full text-sm font-medium">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// BookItem component
function BookItem({ book, menuOpen, setMenuOpen, onEdit, onDelete }) {
  return (
    <div
      className="p-4 rounded-lg border border-[#dfe6e9] hover:border-[#3498db] transition-colors relative"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <i className="fas fa-book text-[#7f8c8d]"></i>
            <h3 className="font-medium text-[#2c3e50]">{book.title}</h3>
          </div>
          <p className="text-sm text-[#7f8c8d] mt-1">by {book.author}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(menuOpen === book.id ? null : book.id)}
            className="text-[#7f8c8d] hover:text-[#2c3e50] transition-colors"
          >
            <i className="fas fa-ellipsis-v"></i>
          </button>
          {menuOpen === book.id && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <button
                  onClick={() => onEdit(book)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <i className="fas fa-edit mr-2"></i>Edit
                </button>
                <button
                  onClick={() => onDelete(book.id)}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <i className="fas fa-trash-alt mr-2"></i>Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;