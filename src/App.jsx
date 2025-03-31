import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./component/Navbar";
import Home from "./pages/Home";
import AuthPage from "./pages/auth/auth";
import Login from "./pages/auth/login";
import Signup from "./pages/auth/signup";
import DonorDashboard from "./pages/dashboard/donorDashboard";
import VolunteerDashboard from "./pages/dashboard/volunteer/volunteer";
import { useUser } from "../context/UserContext";
import CompleteProfile from "./component/completeProfile";
import AddDonationPage from "./pages/donations/foodDonation";
import {
  ProtectedDonorRoute,
  ProtectedVolunteerRoute,
  ProtectedRoute,
} from "./pages/auth/ProtectedDonorRoute";
import Dashboard from "./pages/dashboard/admin/adminDashboard";
import About from "./component/about";
import Contact from "./component/contact";
import Reviews from "./component/review";

const App = () => {
  const { user, loading } = useUser(); // use loading state from context

  if (loading) {
    // Render a loading state while user data is being fetched
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Navbar />
      <div className="pt-16">
        {" "}
        {/* Adjust padding to match the Navbar height */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />}>
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
          </Route>
          <Route path="/complete-profile" element={<CompleteProfile />} />

          <Route path="/donor/dashboard" element={<DonorDashboard />} />

          {/* Volunteer routes - protected */}
          <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/add-donation" element={<AddDonationPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/reviews" element={<Reviews />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
