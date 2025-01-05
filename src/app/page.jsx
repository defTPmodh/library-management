"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from '../context/ThemeContext';

function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { darkMode, toggleDarkMode } = useTheme();

  // Animation variants
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();

      localStorage.setItem("employeeId", employeeId);
      localStorage.setItem("password", password);
      localStorage.setItem(
        "libraryName",
        employeeId.includes("GIRLS") ? "Girls Library" : "Boys Library"
      );
      localStorage.setItem(
        "databaseName",
        employeeId.includes("GIRLS") ? "books-girls" : "books-boys"
      );

      window.location.href = "/dashboard";
    } catch (err) {
      setError("Invalid employee ID or password");
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const storedId = localStorage.getItem("employeeId");
      const storedPassword = localStorage.getItem("password");

      if (!storedId || !storedPassword) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeId: storedId,
            password: storedPassword,
          }),
        });

        if (response.ok) {
          window.location.href = "/dashboard";
        } else {
          localStorage.removeItem("employeeId");
          localStorage.removeItem("password");
          localStorage.removeItem("libraryName");
          localStorage.removeItem("databaseName");
        }
      } catch (err) {
        localStorage.removeItem("employeeId");
        localStorage.removeItem("password");
        localStorage.removeItem("libraryName");
        localStorage.removeItem("databaseName");
      }
      setIsCheckingAuth(false);
    };

    if (window.location.pathname === "/") {
      checkAuth();
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  if (isCheckingAuth) {
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
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 dark:from-background-dark dark:via-background-dark dark:to-primary-dark/10 transition-colors duration-300"
    >
      <nav className="bg-surface/80 dark:bg-surface-dark/80 shadow-lg backdrop-blur-md p-4 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <motion.div 
            variants={itemVariants}
            className="text-xl font-bold font-roboto bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            Library Management System
          </motion.div>
          <motion.button
            variants={itemVariants}
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'} text-gray-600 dark:text-gray-300`}></i>
          </motion.button>
        </div>
      </nav>

      <div className="flex items-center justify-center py-12 px-4">
        <motion.div 
          variants={itemVariants}
          className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md p-10 rounded-xl shadow-lg hover:shadow-xl transition-shadow w-full max-w-md"
        >
          <motion.div 
            variants={itemVariants}
            className="text-center mb-8"
          >
            <motion.i 
              className="fas fa-book-reader text-primary dark:text-primary-light text-6xl mb-4"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -10, 10, 0] 
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            ></motion.i>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 font-roboto">
              Library Staff Portal
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 font-roboto">
              Sign in to manage your library
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold font-roboto text-gray-800 dark:text-gray-200 mb-2">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-primary dark:focus:border-primary-light focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none"
                placeholder="Enter your ID"
                required
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold font-roboto text-gray-800 dark:text-gray-200 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-primary dark:focus:border-primary-light focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/20 transition-colors outline-none"
                placeholder="Enter your password"
                required
              />
            </motion.div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 dark:text-red-400 text-sm font-roboto"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white font-roboto py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block"
                >
                  <i className="fas fa-circle-notch"></i>
                </motion.div>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default LoginPage;