import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../context/UserContext"; // Adjust the path as needed

// Protected route for donors only
export const ProtectedDonorRoute = ({ children }) => {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    if (!user || !user.uid) {
      navigate("/auth/login");
      return;
    }

    // Check if user is a donor
    if (user.type !== "donor") {
      console.log(user);
      navigate("/unauthorized");
    }
  }, [user, navigate]);

  // Don't render anything until authentication check is complete
  if (!user || !user.uid || user.userType !== "donor") {
    return null;
  }

  return children;
};

// Protected route for volunteers only
export const ProtectedVolunteerRoute = ({ children }) => {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    if (!user || !user.uid) {
      navigate("/auth/login");
      return;
    }

    // Check if user is a volunteer
    if (user.userType !== "volunteer") {
      console.log(user);
      navigate("/unauthorized");
    }
  }, [user, navigate]);

  // Don't render anything until authentication check is complete
  if (!user || !user.uid || user.userType !== "volunteer") {
    return null;
  }

  return children;
};

// Protected route for any authenticated user
export const ProtectedRoute = ({ children }) => {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.uid) {
      navigate("/auth/login");
    }
  }, [user, navigate]);

  // Don't render anything until authentication check is complete
  if (!user || !user.uid) {
    return null;
  }

  return children;
};
