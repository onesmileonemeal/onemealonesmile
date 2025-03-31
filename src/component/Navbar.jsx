import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext"; // Adjust the path
import { auth } from "../../firebaseConfig"; // Import auth
import { signOut } from "firebase/auth"; // Import signOut

const Navbar = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null); // Clear user context
      navigate("/auth/login"); // Redirect to login
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Determine which dashboard path to use based on user role
  const getDashboardPath = () => {
    if (!user) return "/dashboard";
    return user.type === "donor" ? "/donor/dashboard" : "/volunteer/dashboard";
  };

  const dashboardPath = getDashboardPath();

  const isActive = (path) => {
    if (path === dashboardPath) {
      // Match any dashboard path when showing active state
      return (
        location.pathname === dashboardPath ||
        location.pathname === "/dashboard" ||
        location.pathname === "/donor/dashboard" ||
        location.pathname === "/volunteer/dashboard"
      );
    }
    return location.pathname === path;
  };

  return (
    <nav className="bg-white p-4 fixed top-0 left-0 w-full z-50 shadow-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="text-2xl font-bold">
          <Link to="/" className="flex items-center">
            <span className="text-3xl mr-2">🍽️</span>
            <span className="text-gray-800">OneMealOneSmile</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            to="/about"
            className={`text-gray-700 hover:text-blue-600 transition duration-200 ${
              location.pathname === "/about" ? "text-blue-600 font-medium" : ""
            }`}
          >
            About
          </Link>
          <Link
            to="/contact"
            className={`text-gray-700 hover:text-blue-600 transition duration-200 ${
              location.pathname === "/contact"
                ? "text-blue-600 font-medium"
                : ""
            }`}
          >
            Contact Us
          </Link>
          <Link
            to="/reviews"
            className={`text-gray-700 hover:text-blue-600 transition duration-200 ${
              location.pathname === "/reviews"
                ? "text-blue-600 font-medium"
                : ""
            }`}
          >
            User Reviews
          </Link>

          {user ? (
            <>
              <Link
                to={dashboardPath}
                className={`${
                  isActive(dashboardPath)
                    ? "text-blue-600 font-medium"
                    : "text-gray-700 hover:text-blue-600"
                } transition duration-200`}
              >
                Dashboard
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center text-gray-700 hover:text-blue-600 font-medium px-2 py-1 rounded-md"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="mr-1">{user.displayName || user.email}</span>
                  {user.role && (
                    <span className="text-xs text-gray-500 mr-1">
                      ({user.role})
                    </span>
                  )}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-md py-1 border border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="px-5 py-2 text-gray-700 hover:text-blue-600 transition duration-200"
              >
                Log In
              </Link>
              <Link
                to="/auth/signup"
                className="px-5 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            {isMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pt-2 border-t border-gray-100">
          <Link
            to="/about"
            className={`block py-2 text-gray-700 ${
              location.pathname === "/about" ? "text-blue-600 font-medium" : ""
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          <Link
            to="/contact"
            className={`block py-2 text-gray-700 ${
              location.pathname === "/contact"
                ? "text-blue-600 font-medium"
                : ""
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            Contact Us
          </Link>
          <Link
            to="/reviews"
            className={`block py-2 text-gray-700 ${
              location.pathname === "/reviews"
                ? "text-blue-600 font-medium"
                : ""
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            User Reviews
          </Link>
          {user ? (
            <div className="space-y-2">
              <Link
                to={dashboardPath}
                className={`block py-2 ${
                  isActive(dashboardPath)
                    ? "text-blue-600 font-medium"
                    : "text-gray-700"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>

              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-red-600"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/auth/login"
                className="block py-2 text-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                to="/auth/signup"
                className="block py-2 mt-2 bg-blue-600 text-white rounded-md text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
