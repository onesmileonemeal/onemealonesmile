import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "../../../firebaseConfig"; // Adjust the path
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";
import { useUser } from "../../../context/UserContext.jsx";

const Login = () => {
  const [userType, setUserType] = useState("donor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUser();

  const messages = {
    donor: {
      title: "Thank You for Your Generosity! 🙌",
      text: "Your donations help provide meals to those in need. We appreciate your kindness and commitment to making the world a better place!",
    },
    volunteer: {
      title: "You're a Changemaker! ❤️",
      text: "Your dedication to helping others makes a real difference. Thank you for your time and effort in supporting those in need!",
    },
  };

  const checkUserInCollections = async (uid) => {
    const donorRef = doc(db, "donors", uid);
    const volunteerRef = doc(db, "volunteers", uid);

    const donorSnap = await getDoc(donorRef);
    const volunteerSnap = await getDoc(volunteerRef);

    return {
      isDonor: donorSnap.exists(),
      isVolunteer: volunteerSnap.exists(),
      donorData: donorSnap.exists() ? donorSnap.data() : null,
      volunteerData: volunteerSnap.exists() ? volunteerSnap.data() : null,
    };
  };

  const saveUserToFirestore = async (user, userType) => {
    const userRef = doc(
      db,
      userType === "donor" ? "donors" : "volunteers",
      user.uid
    );
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        userType,
      },
      { merge: true }
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const { isDonor, isVolunteer, donorData, volunteerData } =
        await checkUserInCollections(userCredential.user.uid);

      if (!isDonor && !isVolunteer) {
        setError("No account found. Please sign up first.");
        return;
      }

      let fetchedUserType;
      if (isDonor && donorData.userType) {
        fetchedUserType = "donor";
      } else if (isVolunteer && volunteerData.userType) {
        fetchedUserType = "volunteer";
      }

      if (fetchedUserType !== userType) {
        setError(
          `This account is registered as a ${fetchedUserType}. Please select '${
            fetchedUserType.charAt(0).toUpperCase() + fetchedUserType.slice(1)
          }' to login.`
        );
        return;
      }

      console.log("Login successful:", userCredential.user);

      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        userType: userType,
      });

      if (userType === "donor") {
        navigate("/donor/dashboard");
      } else {
        navigate("/volunteer/dashboard");
      }
    } catch (err) {
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      console.log("Google login successful:", userCredential.user);

      const { isDonor, isVolunteer, donorData, volunteerData } =
        await checkUserInCollections(userCredential.user.uid);

      if (isDonor || isVolunteer) {
        let fetchedUserType;
        if (isDonor && donorData.userType) {
          fetchedUserType = "donor";
        } else if (isVolunteer && volunteerData.userType) {
          fetchedUserType = "volunteer";
        }

        if (fetchedUserType !== userType) {
          setError(
            `This account is registered as a ${fetchedUserType}. Please select '${
              fetchedUserType.charAt(0).toUpperCase() + fetchedUserType.slice(1)
            }' to login.`
          );
          return;
        }
      } else {
        await saveUserToFirestore(userCredential.user, userType);
      }

      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        userType: userType,
      });

      if (userType === "donor") {
        navigate("/donor/dashboard");
      } else {
        navigate("/volunteer/dashboard");
      }
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Login canceled. Please try again.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-white px-4 py-8">
      {/* Welcome Section - stacks vertically on mobile, side by side on larger screens */}
      <div className="w-full md:w-1/2 p-4 md:p-10 mb-6 md:mb-0">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          {messages[userType].title}
        </h2>
        <p className="text-md md:text-lg text-gray-600">
          {messages[userType].text}
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

      {/* Login Form Section */}
      <div className="w-full md:w-1/2 bg-gray-100 p-6 md:p-10 rounded-xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Login
        </h1>

        {error && (
          <p className="text-red-500 mb-4 text-sm md:text-base">{error}</p>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
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
            Login
          </button>
        </form>

        {/* <div className="flex items-center my-4">
          <div className="flex-1 border-b border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm md:text-base">OR</span>
          <div className="flex-1 border-b border-gray-300"></div>
        </div> */}

        {/* <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 bg-white border py-2 rounded-lg shadow hover:bg-gray-100 transition text-sm md:text-base"
        >
          <FcGoogle className="text-xl md:text-2xl" />
          Login with Google
        </button> */}

        <p className="mt-4 text-gray-600 text-sm md:text-base">
          Don't have an account?{" "}
          <button
            className="text-blue-500 hover:underline"
            onClick={() => navigate("/auth/signup")}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
