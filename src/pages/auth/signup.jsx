import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "/firebaseConfig"; // Adjust the path
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
} from "react-icons/hi";
import { useUser } from "../../../context/UserContext";

const Signup = () => {
  const [userType, setUserType] = useState(null); // "volunteer" or "donor"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUser();

  const saveUserToFirestore = async (user) => {
    if (!userType) {
      setError("Please select an account type (Donor or Volunteer)");
      return;
    }

    const collectionName = userType === "volunteer" ? "volunteers" : "donors";
    const userRef = doc(db, collectionName, user.uid);

    const userData = {
      uid: user.uid,
      name,
      type: null, // Initially null, updated in complete profile
      email: user.email,
      contact: null,
      address: null,
      badge: null,
      registeredAt: serverTimestamp(),
      ...(userType !== "volunteer" && { totalDonations: 0 }), // Only for donors
    };

    await setDoc(userRef, userData);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (!userType) {
        setError("Please select Donor or Volunteer");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await saveUserToFirestore(userCredential.user);

      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        userType,
      });

      navigate("/complete-profile"); // Redirect to complete profile
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      if (!userType) {
        setError("Please select Donor or Volunteer");
        return;
      }

      const userCredential = await signInWithPopup(auth, googleProvider);
      await saveUserToFirestore(userCredential.user);

      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        userType,
      });

      navigate("/complete-profile"); // Redirect to complete profile
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-white px-4 py-8">
      {/* Welcome Section */}
      <div className="w-full md:w-1/2 p-4 md:p-10 mb-6 md:mb-0">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          {userType === "volunteer"
            ? "Be the Change! 🤝"
            : userType === "donor"
            ? "Join Us in Making a Difference! 🌍"
            : "Choose How You Want to Help! 🌟"}
        </h2>
        <p className="text-md md:text-lg text-gray-600">
          {userType === "volunteer"
            ? "Sign up as a volunteer and help distribute food to those who need it the most."
            : userType === "donor"
            ? "Sign up to donate food and help those in need. Your generosity can change lives!"
            : "Select your role to get started on your journey of making a positive impact."}
        </p>

        <div className="flex gap-4 mt-6">
          <button
            className={`px-4 md:px-6 py-2 rounded-lg transition ${
              userType === "volunteer"
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
            onClick={() => setUserType("volunteer")}
          >
            Volunteer
          </button>
          <button
            className={`px-4 md:px-6 py-2 rounded-lg transition ${
              userType === "donor" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setUserType("donor")}
          >
            Donor
          </button>
        </div>
      </div>

      {/* Sign Up Form Section */}
      <div className="w-full md:w-1/2 bg-gray-100 p-6 md:p-10 rounded-xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Sign Up
        </h1>

        {error && (
          <p className="text-red-500 mb-4 text-sm md:text-base">{error}</p>
        )}

        <form className="space-y-4" onSubmit={handleSignup}>
          <div className="relative">
            <HiOutlineUser className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-10 py-2 border rounded-lg text-sm md:text-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <HiOutlineMail className="absolute left-3 top-3 text-gray-500" />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-10 py-2 border rounded-lg text-sm md:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <HiOutlineLockClosed className="absolute left-3 top-3 text-gray-500" />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-10 py-2 border rounded-lg text-sm md:text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm md:text-base"
          >
            Sign Up
          </button>
        </form>

        {/* <div className="flex items-center my-4">
          <div className="flex-1 border-b border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm md:text-base">OR</span>
          <div className="flex-1 border-b border-gray-300"></div>
        </div> */}

        {/* <button
          onClick={handleGoogleSignup}
          className="w-full flex items-center justify-center gap-2 bg-white border py-2 rounded-lg shadow hover:bg-gray-100 transition text-sm md:text-base"
        >
          <FcGoogle className="text-xl md:text-2xl" />
          Sign Up with Google
        </button> */}

        <p className="mt-4 text-gray-600 text-sm md:text-base">
          Already have an account?{" "}
          <button
            className="text-blue-500 hover:underline"
            onClick={() => navigate("/auth/login")}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
