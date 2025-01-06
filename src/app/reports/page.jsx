"use client";
import React, { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";
import { motion, AnimatePresence } from "framer-motion";

function ReportsPage() {
  const [activeTab, setActiveTab] = useState("accession");
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [importStatus, setImportStatus] = useState("");
  const [libraryName, setLibraryName] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format

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
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === "accession") {
        const response = await fetch("/api/activities");
        const data = await response.json();
        setActivities(data);
      } else if (activeTab === "transactions") {
        const response = await fetch("/api/transactions");
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('library', libraryName);

    setImportStatus("Uploading file...");

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setImportStatus(`Successfully imported ${data.importedCount} books`);
      } else {
        setImportStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setImportStatus(`Error: ${error.message}`);
    }
  };

  // Filter data by selected month
  const filterDataByMonth = (data, dateField) => {
    const [year, month] = selectedMonth.split('-');
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate.getFullYear() === parseInt(year) && 
             itemDate.getMonth() === parseInt(month) - 1;
    });
  };

  const filteredActivities = filterDataByMonth(activities, 'timestamp');
  const filteredTransactions = filterDataByMonth(transactions, 'date');

  // Generate month options (last 12 months)
  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-GB', { 
        year: 'numeric',
        month: 'long'
      });
      options.push({ value, label });
    }
    
    return options;
  };

  const handleDownload = async (reportType) => {
    try {
      const response = await fetch('/api/reports/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          month: selectedMonth
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Get the filename from the response header
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `${reportType}_report.xlsx`;

      // Convert response to blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      // You might want to show an error message to the user here
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
        <div className="max-w-7xl mx-auto space-y-8">
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Reports & Tools
            </h1>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={itemVariants} className="flex space-x-4 border-b border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setActiveTab("accession")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "accession"
                  ? "text-primary dark:text-primary-light border-b-2 border-primary dark:border-primary-light"
                  : "text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light"
              }`}
            >
              Accession Register
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "transactions"
                  ? "text-primary dark:text-primary-light border-b-2 border-primary dark:border-primary-light"
                  : "text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light"
              }`}
            >
              Transaction Report
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "import"
                  ? "text-primary dark:text-primary-light border-b-2 border-primary dark:border-primary-light"
                  : "text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light"
              }`}
            >
              Import Books
            </button>
          </motion.div>

          {/* Month Selection */}
          {(activeTab === "accession" || activeTab === "transactions") && (
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-between mb-4"
            >
              <div className="flex items-center space-x-4">
                <label className="text-gray-700 dark:text-gray-300">Select Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none backdrop-blur-sm"
                >
                  {getMonthOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <motion.button
                onClick={() => handleDownload(activeTab)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-download"></i>
                <span>Download Report</span>
              </motion.button>
            </motion.div>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === "accession" && (
              <motion.div
                key="accession"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-xl shadow-lg"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                    Accession Register
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Total Entries: {filteredActivities.length}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300 dark:border-gray-600">
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Date</th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Book</th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Activity</th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActivities.map((activity) => (
                        <tr
                          key={activity.id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                            {new Date(activity.timestamp).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                            {activity.bookTitle}
                          </td>
                          <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                            {activity.action}
                          </td>
                          <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                            {activity.userId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "transactions" && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-xl shadow-lg"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                    Transaction Report
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Total Transactions: {filteredTransactions.length}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300 dark:border-gray-600">
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Date</th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Book</th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Borrower</th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Type</th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                            {new Date(transaction.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                            {transaction.bookTitle}
                          </td>
                          <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                            {transaction.borrowerName}
                          </td>
                          <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                            {transaction.type}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-sm ${
                              transaction.status === "completed"
                                ? "bg-accent/10 text-accent dark:text-accent-light"
                                : transaction.status === "overdue"
                                ? "bg-red-500/10 text-red-500 dark:text-red-400"
                                : "bg-secondary/10 text-secondary dark:text-secondary-light"
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "import" && (
              <motion.div
                key="import"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-xl shadow-lg"
              >
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
                  Import Books from Excel
                </h2>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="excel-upload"
                    />
                    <label
                      htmlFor="excel-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <i className="fas fa-file-excel text-4xl text-primary dark:text-primary-light"></i>
                      <span className="text-gray-600 dark:text-gray-400">
                        Click to upload Excel file
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-500">
                        Supports .xlsx and .xls files
                      </span>
                    </label>
                  </div>
                  {importStatus && (
                    <div className={`p-4 rounded-lg ${
                      importStatus.includes("Error")
                        ? "bg-red-500/10 text-red-500 dark:text-red-400"
                        : "bg-accent/10 text-accent dark:text-accent-light"
                    }`}>
                      {importStatus}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default ReportsPage; 