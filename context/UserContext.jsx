import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "/firebaseConfig"; // Adjust the path
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Create Context
const UserContext = createContext();

// Provider Component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore
  const fetchUserData = async (uid) => {
    try {
      const donorRef = doc(db, "donors", uid);
      const volunteerRef = doc(db, "volunteers", uid);

      const donorSnap = await getDoc(donorRef);
      if (donorSnap.exists()) {
        setUser({ uid, ...donorSnap.data() });
        return;
      }

      const volunteerSnap = await getDoc(volunteerRef);
      if (volunteerSnap.exists()) {
        setUser({ uid, ...volunteerSnap.data() });
        return;
      }

      setUser(null); // If user is not found in Firestore
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await fetchUserData(currentUser.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom Hook for using UserContext
export const useUser = () => {
  return useContext(UserContext);
};
