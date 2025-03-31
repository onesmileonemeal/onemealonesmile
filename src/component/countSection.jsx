import React, { useEffect, useRef, useState, useContext } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import { auth, db } from "/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useUser } from "../../context/UserContext"; // Import useUser hook

gsap.registerPlugin(ScrollTrigger);

const Count = () => {
  const countRefs = useRef([]);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    donations: 0,
    peopleFed: 0,
    foodSaved: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, loading: userLoading } = useUser(); // Use useUser hook

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const statsRef = collection(db, "donationStates");
        const statsSnapshot = await getDocs(statsRef);

        if (!statsSnapshot.empty) {
          const statsData = statsSnapshot.docs[0].data();
          setStats({
            peopleFed: statsData.peopleFed || 0,
            foodSaved: statsData.foodSaved || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (!loading && countRefs.current.length > 0) {
      countRefs.current.forEach((el) => {
        if (el) {
          gsap.fromTo(
            el,
            { innerText: 0 },
            {
              innerText: el.dataset.value,
              duration: 2,
              ease: "power2.out",
              snap: { innerText: 1 },
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                end: "top 50%",
                scrub: 1,
              },
            }
          );
        }
      });
    }
  }, [loading, stats]);

  const handleDonateClick = () => {
    if (!user) {
      navigate("/auth/login");
    } else {
      if (user.type === "donor") {
        navigate("/donor/dashboard");
      } else if (user.userType === "volunteer") {
        navigate("/volunteer/dashboard");
      } else {
        console.log(user);
        navigate("/dashboard");
      }
    }
  };

  return (
    <div className="py-16 px-4 bg-transparent">
      <div className="text-3xl font-bold text-center mb-4">
        Making a Difference, One Meal at a Time 🍽️
      </div>
      <div className="text-lg text-center mb-10">
        Join us in reducing food waste and feeding the needy. Your donation
        matters!
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="text-xl font-semibold text-gray-700">
            People Fed
            <div
              ref={(el) => (countRefs.current[1] = el)}
              data-value={stats.peopleFed}
              className="text-4xl font-bold text-green-600 mt-2"
            >
              {loading ? "Loading..." : "0"}
            </div>
          </div>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="text-xl font-semibold text-gray-700">
            Food Saved (kg)
            <div
              ref={(el) => (countRefs.current[2] = el)}
              data-value={stats.foodSaved}
              className="text-4xl font-bold text-orange-600 mt-2"
            >
              {loading ? "Loading..." : "0"}
            </div>
          </div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold mb-3">
          Be a Part of the Change! ❤️
        </div>
        <div className="text-lg mb-6">
          Every meal donated makes a difference. You can help!
        </div>
        <button
          onClick={handleDonateClick}
          className="px-8 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
        >
          Donate Now
        </button>
      </div>
    </div>
  );
};

export default Count;
