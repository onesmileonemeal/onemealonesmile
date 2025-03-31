import React, { useState, useEffect } from "react";
import { useUser } from "../../../context/UserContext";
import { db } from "../../../firebaseConfig";
import { collection, doc, getDoc, getDocs, query } from "firebase/firestore";
import { FaMedal } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import {
  PlusCircle,
  Eye,
  Users,
  Package,
  MapPin,
  Database,
  Calendar,
  Mail,
  Phone,
  Building,
  ChevronRight,
  Clock,
} from "lucide-react";

function cn(...inputs) {
  return twMerge(inputs.filter(Boolean).join(" "));
}

const batches = [
  {
    name: "Seedling",
    color: "bg-gray-400",
    progress: 0.005,
    target: "5kg",
    threshold: 5,
  },
  {
    name: "Sprout",
    color: "bg-green-300",
    progress: 0.01,
    target: "10kg",
    threshold: 10,
  },
  {
    name: "Sapling",
    color: "bg-green-500",
    progress: 0.015,
    target: "15kg",
    threshold: 15,
  },
  {
    name: "Bronze",
    color: "bg-yellow-700",
    progress: 0.02,
    target: "20kg",
    threshold: 20,
  },
  {
    name: "Silver",
    color: "bg-blue-400",
    progress: 0.025,
    target: "25kg",
    threshold: 25,
  },
  {
    name: "Azure",
    color: "bg-blue-600",
    progress: 0.03,
    target: "30kg",
    threshold: 30,
  },
  {
    name: "Sapphire",
    color: "bg-blue-800",
    progress: 0.035,
    target: "35kg",
    threshold: 35,
  },
  {
    name: "Gold",
    color: "bg-yellow-500",
    progress: 0.04,
    target: "40kg",
    threshold: 40,
  },
  {
    name: "Topaz",
    color: "bg-orange-500",
    progress: 0.045,
    target: "45kg",
    threshold: 45,
  },
  {
    name: "Ruby",
    color: "bg-red-600",
    progress: 0.05,
    target: "50kg",
    threshold: 50,
  },
  {
    name: "Emerald",
    color: "bg-green-600",
    progress: 0.06,
    target: "60kg",
    threshold: 60,
  },
  {
    name: "Diamond",
    color: "bg-cyan-500",
    progress: 0.07,
    target: "70kg",
    threshold: 70,
  },
  {
    name: "Titanium",
    color: "bg-gray-600",
    progress: 0.08,
    target: "80kg",
    threshold: 80,
  },
  {
    name: "Platinum",
    color: "bg-purple-600",
    progress: 0.09,
    target: "90kg",
    threshold: 90,
  },
  {
    name: "Legend",
    color: "bg-pink-600",
    progress: 0.1,
    target: "100kg",
    threshold: 100,
  },
  {
    name: "Epic",
    color: "bg-indigo-600",
    progress: 0.25,
    target: "250kg",
    threshold: 250,
  },
  {
    name: "Mythic",
    color: "bg-violet-600",
    progress: 0.5,
    target: "500kg",
    threshold: 500,
  },
  {
    name: "Celestial",
    color: "bg-sky-600",
    progress: 1,
    target: "1000kg",
    threshold: 1000,
  },
  {
    name: "Galactic",
    color: "bg-gradient-to-r from-blue-700 to-purple-700",
    progress: 5,
    target: "5000kg",
    threshold: 5000,
  },
  {
    name: "Universal",
    color: "bg-gradient-to-r from-pink-700 to-yellow-700",
    progress: 10,
    target: "10000kg",
    threshold: 10000,
  },
  {
    name: "Cosmic",
    color: "bg-gradient-to-r from-red-700 to-orange-700",
    progress: 25,
    target: "25000kg",
    threshold: 25000,
  },
  {
    name: "Transcendent",
    color: "bg-gradient-to-r from-green-700 to-blue-700",
    progress: 50,
    target: "50000kg",
    threshold: 50000,
  },
  {
    name: "Omnipotent",
    color: "bg-gradient-to-r from-yellow-700 to-green-700",
    progress: 100,
    target: "100000kg",
    threshold: 100000,
  },
];

const DonorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [donorDetails, setDonorDetails] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState({});
  const [activeTab, setActiveTab] = useState("overview");

  const handleOnEditProfile = () => {
    navigate("/complete-profile");
  };
  useEffect(() => {
    const fetchDonorData = async () => {
      if (!user || !user.uid) {
        setError("User not found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const donorRef = doc(db, "donors", user.uid);
        const donorSnap = await getDoc(donorRef);

        if (donorSnap.exists()) {
          const donorData = donorSnap.data();
          setDonorDetails({ id: donorSnap.id, ...donorData });

          const donationsQuery = query(collection(donorRef, "donations"));
          const donationsSnap = await getDocs(donationsQuery);
          const donationsData = donationsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setDonations(donationsData);

          const addressPromises = donationsData.map(async (donation) => {
            if (
              donation.location &&
              donation.location.lat &&
              donation.location.lng
            ) {
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${donation.location.lat}&lon=${donation.location.lng}`
                );
                const data = await response.json();
                if (data && data.display_name) {
                  return { [donation.id]: data.display_name };
                }
              } catch (err) {
                console.error("Error fetching address:", err);
              }
            }
            return { [donation.id]: "Address not found" };
          });

          const addressResults = await Promise.all(addressPromises);
          const addressesMap = addressResults.reduce(
            (acc, curr) => ({ ...acc, ...curr }),
            {}
          );
          setAddresses(addressesMap);
        } else {
          setError("Donor data not found.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDonorData();
  }, [user]);

  const totalKg = donations.reduce(
    (sum, donation) => sum + (Number(donation.foodWeight) || 0),
    0
  );

  // Calculate current batch based on total kg
  const getCurrentBatch = () => {
    return batches.find((batch) => totalKg >= batch.threshold) || batches[0];
  };

  const currentBatch = getCurrentBatch();

  // Calculate progress percentage for the next batch
  const getNextBatchProgress = () => {
    const currentIndex = batches.findIndex((batch) => batch === currentBatch);
    if (currentIndex === batches.length - 1) return 100; // Already at the last batch
    const currentThreshold = currentBatch.threshold;
    const nextThreshold = batches[currentIndex + 1].threshold;
    return Math.min(
      ((totalKg - currentThreshold) / (nextThreshold - currentThreshold)) * 100,
      99
    );
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-xl shadow-lg">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-blue-200 rounded mb-3"></div>
            <div className="h-3 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-xl shadow-lg text-center">
          <div className="text-red-500 text-xl mb-2">Error</div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );

  if (!donorDetails)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-xl shadow-lg text-center">
          <div className="text-xl font-semibold mb-2">Access Required</div>
          <p className="text-gray-700">Please log in to view your dashboard.</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      {/* Hero Section with Current Level */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 mb-6 text-white">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {donorDetails.name}
            </h1>
            <p className="text-blue-100 mb-6">
              Thank you for your contributions to reducing food waste!
            </p>

            <div className="flex space-x-4">
              <button
                onClick={() => navigate("/add-donation")}
                className="bg-white text-indigo-700 px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-50 transition-all duration-300 shadow-md"
              >
                <PlusCircle size={20} /> Add Donation
              </button>
              <button className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-600 transition-all duration-300 shadow-md border border-indigo-400">
                <Eye size={20} /> View Donations
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-center">
              <div
                className={`w-24 h-24 ${currentBatch.color} rounded-full flex items-center justify-center mx-auto shadow-lg mb-3`}
              >
                <FaMedal size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold">{currentBatch.name} Donor</h2>
              <p className="text-blue-100">Total contributions: {totalKg}kg</p>

              {totalKg < batches[batches.length - 1].threshold && (
                <div className="mt-3">
                  <p className="text-sm text-blue-100 mb-1">
                    {`${Math.ceil(
                      batches[
                        batches.findIndex((batch) => batch === currentBatch) + 1
                      ].threshold - totalKg
                    )}kg until ${
                      batches[
                        batches.findIndex((batch) => batch === currentBatch) + 1
                      ].name
                    }`}
                  </p>
                  <div className="w-full bg-blue-800 rounded-full h-2.5">
                    <div
                      className="bg-blue-300 h-2.5 rounded-full"
                      style={{ width: `${getNextBatchProgress()}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="flex overflow-x-auto mb-6 bg-white rounded-lg shadow p-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-6 py-3 font-medium rounded-lg flex items-center gap-2 transition-all ${
            activeTab === "overview"
              ? "bg-blue-100 text-blue-800"
              : "hover:bg-gray-100"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("donations")}
          className={`px-6 py-3 font-medium rounded-lg flex items-center gap-2 transition-all ${
            activeTab === "donations"
              ? "bg-blue-100 text-blue-800"
              : "hover:bg-gray-100"
          }`}
        >
          Donations
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 font-medium rounded-lg flex items-center gap-2 transition-all ${
            activeTab === "profile"
              ? "bg-blue-100 text-blue-800"
              : "hover:bg-gray-100"
          }`}
        >
          Profile
        </button>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column - Stats Cards */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Donation Statistics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Donations</p>
                    <p className="text-xl font-bold text-gray-800">
                      {donations.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Database size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Food</p>
                    <p className="text-xl font-bold text-gray-800">
                      {totalKg} kg
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Achievement Path
            </h3>

            <div className="space-y-6 pt-2">
              {(() => {
                // Find the current medal index
                const currentIndex = batches.findIndex(
                  (batch) => totalKg < batch.threshold
                );
                const currentBatchIndex =
                  currentIndex === -1 ? batches.length - 1 : currentIndex - 1;
                // Calculate visible range (past 1, current, future 2)
                const startIndex = Math.max(0, currentBatchIndex - 1);
                const endIndex = Math.min(batches.length, startIndex + 4);
                const visibleBatches = batches.slice(startIndex, endIndex);

                return visibleBatches.map((batch, index) => {
                  const actualIndex = startIndex + index;
                  return (
                    <div key={batch.name} className="relative">
                      {/* Vertical line connecting badges */}
                      {index < visibleBatches.length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-10 bg-gray-200 z-0"></div>
                      )}

                      <div className="flex items-start relative z-10">
                        <div
                          className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-full text-white shadow-md",
                            totalKg >= batch.threshold
                              ? batch.color
                              : "bg-gray-300"
                          )}
                        >
                          <FaMedal size={16} />
                        </div>

                        <div className="ml-4">
                          <p className="font-medium text-gray-800">
                            {batch.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Target: {batch.target}
                          </p>

                          {/* Show progress bar only for current tier */}
                          {actualIndex === currentBatchIndex && (
                            <div className="w-full mt-2 h-2 bg-gray-200 rounded-full">
                              <div
                                className={`h-full ${batch.color} rounded-full`}
                                style={{
                                  width: `${
                                    actualIndex === 0
                                      ? Math.min(
                                          (totalKg / batches[0].threshold) *
                                            100,
                                          100
                                        )
                                      : Math.min(
                                          ((totalKg -
                                            batches[actualIndex].threshold) /
                                            (batches[actualIndex + 1]
                                              .threshold -
                                              batches[actualIndex].threshold)) *
                                            100,
                                          100
                                        )
                                  }%`,
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Right Column - Main Content */}
        <div className="md:col-span-8">
          {activeTab === "overview" && (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Recent Donations
                </h3>
                <button className="text-blue-600 flex items-center text-sm hover:underline">
                  View All <ChevronRight size={16} />
                </button>
              </div>

              {donations.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <Package size={48} className="mx-auto text-gray-300 mb-3" />
                  <h4 className="text-lg font-medium text-gray-600 mb-1">
                    No donations yet
                  </h4>
                  <p className="text-gray-500 mb-4">
                    Start your donation journey today
                  </p>
                  <button
                    onClick={() => navigate("/add-donation")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Make Your First Donation
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {donations.slice(0, 3).map((donation) => (
                    <div
                      key={donation.id}
                      className="p-4 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {donation.donationType === "food"
                              ? `Food Donation: ${donation.foodItems}`
                              : `Money Donation: ${donation.moneyAmount}`}
                          </h4>

                          <div className="text-sm text-gray-500 mt-1 flex items-center">
                            <Clock size={14} className="mr-1" />
                            {donation.timestamp
                              ? new Date(
                                  donation.timestamp.seconds * 1000
                                ).toLocaleDateString()
                              : "Date unavailable"}
                          </div>

                          <div className="mt-2 flex items-start text-sm text-gray-600">
                            <MapPin
                              size={14}
                              className="mt-1 mr-1 flex-shrink-0"
                            />
                            <span>
                              {addresses[donation.id] || "Loading address..."}
                            </span>
                          </div>
                        </div>

                        {donation.donationType === "food" && (
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            {donation.foodWeight} kg
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "donations" && (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                All Donations
              </h3>

              {donations.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <Package size={48} className="mx-auto text-gray-300 mb-3" />
                  <h4 className="text-lg font-medium text-gray-600">
                    No donations yet
                  </h4>
                  <p className="text-gray-500">
                    Start your donation journey today
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {donations.map((donation) => (
                    <div
                      key={donation.id}
                      className="p-4 border border-gray-100 rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {donation.donationType === "food"
                              ? `Food Donation: ${donation.foodItems}`
                              : `Money Donation: ${donation.moneyAmount}`}
                          </h4>

                          <div className="text-sm text-gray-500 mt-1 flex items-center">
                            <Clock size={14} className="mr-1" />
                            {donation.timestamp
                              ? new Date(
                                  donation.timestamp.seconds * 1000
                                ).toLocaleDateString()
                              : "Date unavailable"}
                          </div>

                          {donation.donationType === "food" && (
                            <p className="text-sm text-gray-700 mt-2">
                              <span className="font-medium">Food Weight:</span>{" "}
                              {donation.foodWeight} kg
                            </p>
                          )}

                          <div className="mt-2 flex items-start text-sm text-gray-600">
                            <MapPin
                              size={14}
                              className="mt-1 mr-1 flex-shrink-0"
                            />
                            <span>
                              {addresses[donation.id] || "Loading address..."}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            donation.donationType === "food"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {donation.donationType === "food"
                            ? `${donation.foodWeight} kg`
                            : donation.moneyAmount}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Donor Profile
                </h3>
                <button
                  onClick={handleOnEditProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Edit Profile
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Users size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-800">
                        {donorDetails.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Mail size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium text-gray-800">
                        {donorDetails.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Phone size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact Number</p>
                      <p className="font-medium text-gray-800">
                        {donorDetails.contact || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Building size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Donor Type</p>
                      <p className="font-medium text-gray-800">
                        {donorDetails.donorType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <MapPin size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-800">
                        {donorDetails.address || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Calendar size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registered On</p>
                      <p className="font-medium text-gray-800">
                        {donorDetails.registeredAt
                          ?.toDate()
                          .toLocaleDateString() || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
