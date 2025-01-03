"use client";
import React, { useState, useEffect, useCallback } from "react";

function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        window.location.href = "/";
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

        if (!response.ok) {
          throw new Error();
        }
      } catch (err) {
        localStorage.removeItem("employeeId");
        localStorage.removeItem("password");
        localStorage.removeItem("libraryName");
        window.location.href = "/";
      }
    };
    const currentPath = window.location.pathname;
    if (currentPath !== "/" && currentPath !== "") {
      checkAuth();
    }
  }, []);

  const navigate = useCallback((path) => {
    window.location.href = path;
  }, []);

  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === "/") {
      const storedId = localStorage.getItem("employeeId");
      const storedPassword = localStorage.getItem("password");
      if (storedId && storedPassword) {
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-xl font-bold font-roboto text-[#2c3e50]">
            Library Management System
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center py-12">
        <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md">
          <div className="text-center mb-8">
            <i className="fas fa-book-reader text-[#3498db] text-6xl mb-4"></i>
            <h1 className="text-2xl font-bold text-[#2c3e50] font-roboto">
              Library Staff Portal
            </h1>
            <p className="text-[#7f8c8d] mt-2 font-roboto">
              Sign in to manage your library
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold font-roboto text-[#2c3e50] mb-2">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#dfe6e9] focus:border-[#3498db] focus:ring-2 focus:ring-[#3498db]/20 transition-colors outline-none"
                placeholder="Enter your ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold font-roboto text-[#2c3e50] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#dfe6e9] focus:border-[#3498db] focus:ring-2 focus:ring-[#3498db]/20 transition-colors outline-none"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="text-[#e74c3c] text-sm font-roboto">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3498db] text-white font-roboto py-3 px-4 rounded-lg hover:bg-[#2980b9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3498db] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;