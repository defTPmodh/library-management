"use client";
import React, { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";

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

  useEffect(() => {
    const storedLibraryName = localStorage.getItem("libraryName");
    const storedDbName = localStorage.getItem("databaseName");
    setLibraryName(storedLibraryName || "");
    setDbName(storedDbName || "");
    fetchBorrows();
    fetchBooks();
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

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-roboto">
      <Navigation />
      <div className="p-8 md:p-12">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-[#2c3e50]">
              Library Book Management
            </h1>
            <div className="text-[#7f8c8d]">
              <i className="fas fa-book-reader text-3xl"></i>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-6">
              <i className="fas fa-book-open text-[#3498db] text-2xl mr-3"></i>
              <h2 className="text-2xl font-semibold text-[#2c3e50]">
                Check Out Book
              </h2>
            </div>
            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#7f8c8d] mb-2">
                    Borrower's Name
                  </label>
                  <input
                    type="text"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full p-3 border border-[#dfe6e9] rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-[#3498db] transition-colors outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#7f8c8d] mb-2">
                    GR Number
                  </label>
                  <input
                    type="text"
                    value={grNumber}
                    onChange={(e) => setGrNumber(e.target.value)}
                    className="w-full p-3 border border-[#dfe6e9] rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-[#3498db] transition-colors outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#7f8c8d] mb-2">
                  Class
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full p-3 border border-[#dfe6e9] rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-[#3498db] transition-colors outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#7f8c8d] mb-2">
                  Select Book
                </label>
                <select
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  className="w-full p-3 border border-[#dfe6e9] rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-[#3498db] transition-colors outline-none"
                  required
                >
                  <option value="">Select a book</option>
                  {books
                    .filter((book) => book.status === "available")
                    .map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.title} by {book.author}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-[#3498db] text-white py-3 px-6 rounded-lg hover:bg-[#2980b9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3498db] focus:ring-offset-2"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Check Out Book
              </button>
            </form>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-6">
                <i className="fas fa-undo text-[#2ecc71] text-2xl mr-3"></i>
                <h2 className="text-2xl font-semibold text-[#2c3e50]">
                  Return Book
                </h2>
              </div>
              <form onSubmit={handleReturn} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#7f8c8d] mb-2">
                    Select Book to Return
                  </label>
                  <select
                    value={returnBook}
                    onChange={(e) => setReturnBook(e.target.value)}
                    className="w-full p-3 border border-[#dfe6e9] rounded-lg focus:ring-2 focus:ring-[#2ecc71] focus:border-[#2ecc71] transition-colors outline-none"
                    required
                  >
                    <option value="">Select a book to return</option>
                    {books
                      .filter((book) => book.status === "borrowed")
                      .map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.title} (Borrowed by {book.borrower})
                        </option>
                      ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#2ecc71] text-white py-3 px-6 rounded-lg hover:bg-[#27ae60] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2ecc71] focus:ring-offset-2"
                >
                  <i className="fas fa-check mr-2"></i>
                  Return Book
                </button>
              </form>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <i className="fas fa-list text-[#9b59b6] text-2xl mr-3"></i>
                  <h2 className="text-2xl font-semibold text-[#2c3e50]">
                    Book Status
                  </h2>
                </div>
                <div className="flex space-x-4 text-sm">
                  <span className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#2ecc71] mr-2"></div>
                    Available
                  </span>
                  <span className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#f1c40f] mr-2"></div>
                    Borrowed
                  </span>
                  <span className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#e74c3c] mr-2"></div>
                    Overdue
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {books?.map((book) => {
                  const borrow = borrowRecords?.find(
                    (b) => b.bookId === book.id && b.status === "borrowed"
                  );
                  const isOverdue =
                    borrow && new Date(borrow.dueDate) < new Date();

                  return (
                    <div
                      key={book.id}
                      className="flex justify-between items-start p-4 rounded-lg border border-[#dfe6e9] hover:border-[#3498db] transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-book text-[#7f8c8d]"></i>
                          <span className="font-medium text-[#2c3e50]">
                            {book.title}
                          </span>
                        </div>
                        <div className="text-[#7f8c8d]">by {book.author}</div>
                        {borrow && (
                          <div className="text-sm space-y-1 text-[#7f8c8d]">
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
                              Due: {new Date(borrow.dueDate).toLocaleDateString('en-GB', {
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
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          book.status === "available"
                            ? "bg-[#2ecc71]/10 text-[#2ecc71]"
                            : isOverdue
                            ? "bg-[#e74c3c]/10 text-[#e74c3c]"
                            : "bg-[#f1c40f]/10 text-[#f1c40f]"
                        }`}
                      >
                        {isOverdue ? "overdue" : book.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BorrowsPage;