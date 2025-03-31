import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "/firebaseConfig"; // Adjust the path
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { useUser } from "../../context/UserContext";

const CompleteProfile = () => {
  const { user } = useUser();
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [badge, setBadge] = useState(""); // Only for donors
  const [userType, setUserType] = useState("");
  const [error, setError] = useState("");
  const [donorType, setDonorType] = useState(""); // For donor options (individual, hotel, event organizer)
  const navigate = useNavigate();

  // Fetch userType from Firestore if not available in context
  useEffect(() => {
    const fetchUserType = async () => {
      if (!user || !user.uid) return;

      try {
        let userRef = doc(db, "volunteers", user.uid);
        let docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          setUserType("volunteer");
          return;
        }

        userRef = doc(db, "donors", user.uid);
        docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          setUserType("donor");
          const donorDoc = docSnap.data();
          setDonorType(donorDoc.donorType || "individual"); // Set the donor type from Firestore
        }
      } catch (err) {
        console.error("Error fetching user type:", err);
      }
    };

    if (user?.userType) {
      setUserType(user.userType);
    } else {
      fetchUserType();
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");

    if (!userType) {
      setError("User type is missing. Please log in again.");
      return;
    }

    if (!contact || !address || (userType === "donor" && !badge)) {
      setError("All fields are required!");
      return;
    }

    try {
      const collectionName = userType === "volunteer" ? "volunteers" : "donors";
      const userRef = doc(db, collectionName, user.uid);

      // Check if the user document exists
      const docSnap = await getDoc(userRef);
      const updatedData = {
        contact,
        address,
        type: userType, // Ensuring 'type' field is correctly updated
        ...(userType === "donor" && { badge, donorType }), // Add donorType for donor
      };

      if (docSnap.exists()) {
        await updateDoc(userRef, updatedData);
      } else {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          registeredAt: new Date(),
          ...updatedData,
        });
      }

      navigate(
        userType === "volunteer" ? "/volunteer/dashboard" : "/donor/dashboard"
      );
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 mt-2">
            {userType === "volunteer"
              ? "Thank you for volunteering! Let's finish setting up your profile."
              : "We appreciate your generosity! Please provide a few more details."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div>
            <label
              htmlFor="contact"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contact Number
            </label>
            <input
              id="contact"
              type="text"
              placeholder="Your phone number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Address
            </label>
            <textarea
              id="address"
              placeholder="Your full address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows="3"
              required
            />
          </div>

          {userType === "donor" && (
            <>
              <div>
                <label
                  htmlFor="badge"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Badge/Recognition Name
                </label>
                <input
                  id="badge"
                  type="text"
                  placeholder="How would you like to be recognized?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="donorType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Donor Type
                </label>
                <select
                  id="donorType"
                  value={donorType}
                  onChange={(e) => setDonorType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="individual">Individual</option>
                  <option value="hotel">Hotel</option>
                  <option value="eventOrganizer">Event Organizer</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition duration-300 shadow-md transform hover:-translate-y-1"
          >
            Complete Profile
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {userType === "volunteer"
            ? "Your information helps us match you with the right opportunities."
            : "Your contributions make a real difference in people's lives."}
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
