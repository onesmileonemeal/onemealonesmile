import React, { useState, useEffect } from "react";
import { useUser } from "../../../../context/UserContext";
import { db } from "../../../../firebaseConfig";
import { setDoc, increment } from "firebase/firestore";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  collectionGroup,
} from "firebase/firestore";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import PickupRequestList from "./pickup";
import MapAndDetailsView from "./map";
// Fix for Leaflet icon issues
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
});

L.Marker.prototype.options.icon = DefaultIcon;

const VolunteerDashboard = () => {
  const { user } = useUser();
  const [pickupRequests, setPickupRequests] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [volunteerLocation, setVolunteerLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [donorDetails, setDonorDetails] = useState(null);
  const [loadingDonorDetails, setLoadingDonorDetails] = useState(false);
  const [mapRef, setMapRef] = useState(null);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "accepted"

  useEffect(() => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      };

      const successCallback = (position) => {
        setVolunteerLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        console.log("Location obtained:", position.coords);
      };

      const errorCallback = (error) => {
        console.error("Error getting location:", error);
        // Set a default location or handle the error appropriately
        alert(
          "Unable to get your location. Please enable location services and try again."
        );
      };

      navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        options
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      alert("Geolocation is not supported by this browser.");
    }
  }, []);

  // Fetch pickup requests
  useEffect(() => {
    if (user && user.uid) {
      const pickupRequestsQuery = query(
        collection(db, "donations"),
        where("status", "==", "pending"),
        where("donationType", "==", "food")
      );

      const unsubscribe = onSnapshot(pickupRequestsQuery, (snapshot) => {
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
        setPickupRequests(requests);
      });

      return () => unsubscribe();
    }
  }, [user]);

  // Fetch accepted orders from subcollection
  useEffect(() => {
    if (user && user.uid) {
      const acceptedOrdersQuery = collection(
        db,
        "volunteers",
        user.uid,
        "acceptedOrders"
      );

      const unsubscribe = onSnapshot(acceptedOrdersQuery, (snapshot) => {
        const orders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          acceptedAt: doc.data().acceptedAt?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
        setAcceptedOrders(orders);
        console.log("Fetched accepted orders:", orders);
      });

      return () => unsubscribe();
    }
  }, [user]);

  // Fetch donor details when a request is selected
  useEffect(() => {
    if (selectedRequest && selectedRequest.userId) {
      fetchDonorDetails(selectedRequest.userId);
    } else {
      setDonorDetails(null);
    }
  }, [selectedRequest]);

  const fetchDonorDetails = async (userId) => {
    try {
      setLoadingDonorDetails(true);
      const donorRef = doc(db, "donors", userId);
      const donorSnapshot = await getDoc(donorRef);

      if (donorSnapshot.exists()) {
        setDonorDetails(donorSnapshot.data());
        console.log(donorDetails);
      } else {
        console.log("No donor found with this ID");
        setDonorDetails(null);
      }
    } catch (error) {
      console.error("Error fetching donor details:", error);
      setDonorDetails(null);
    } finally {
      setLoadingDonorDetails(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      // Check if user is logged in
      if (!user || !user.uid) {
        console.error("User is not authenticated");
        return;
      }

      // Reference to the donation request
      const requestRef = doc(db, "donations", requestId);
      const requestSnapshot = await getDoc(requestRef);

      if (!requestSnapshot.exists()) {
        console.error("Request not found!");
        return;
      }

      const requestData = requestSnapshot.data();

      // 1️⃣ Update the donation request status in 'donations' collection
      await updateDoc(requestRef, {
        status: "accepted",
        volunteerId: user.uid,
        acceptedAt: new Date(),
      });

      // 2️⃣ Store the accepted order in the volunteer's collection
      console.log(user.uid);
      const volunteerAcceptedRef = doc(
        db,
        "volunteers",
        user.uid,
        "acceptedOrders", // Creates the subcollection
        requestId // Creates a document with requestId
      );

      await setDoc(volunteerAcceptedRef, {
        id: requestId,
        donorName: donorDetails?.name || "Unknown Donor",
        location: requestData.location || "Unknown Location",
        foodItems: requestData.foodItems || [],
        description: requestData.description || "No description provided",
        status: "accepted",
        foodWeight: requestData.foodWeight,
        acceptedAt: new Date(),
        donorContact: donorDetails?.contact || null,
        donorEmail: donorDetails?.email || null,
        donorAddress: donorDetails?.address || null,
        quantity: requestData.quantity || 0,
        createdAt: requestData.createdAt || new Date(),
      });

      // 3️⃣ Update the volunteer's accepted order count
      const volunteerRef = doc(db, "volunteers", user.uid);
      await updateDoc(volunteerRef, {
        acceptedCount: increment(1), // Increments count of accepted orders
      });

      console.log(
        `Request ${requestId} accepted and stored under the volunteer's accepted list.`
      );

      // Switch to accepted tab
      setActiveTab("accepted");

      // Update UI or navigate to route
      setShowRoute(true);

      // Optional: Show success notification to user
      // toast.success("Donation request accepted successfully!");
    } catch (error) {
      console.error("Error accepting request:", error);
      // Optional: Show error notification
      // toast.error("Failed to accept donation request. Please try again.");
    }
  };

  const handleReject = async (requestId) => {
    try {
      const requestRef = doc(db, "donations", requestId);
      await updateDoc(requestRef, {
        status: "rejected",
        rejectedAt: new Date(),
      });
      console.log(`Request ${requestId} rejected.`);

      // No need to modify local state as onSnapshot will update it
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const handleLocationClick = (request) => {
    setSelectedLocation(request.location);
    setSelectedRequest(request);
  };

  const toggleRoute = () => {
    setShowRoute(!showRoute);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // Distance in km
    return (R * c).toFixed(1);
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const filteredRequests = pickupRequests
    .filter((request) => {
      const searchMatch =
        request.foodItems?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.donorName?.toLowerCase().includes(searchTerm.toLowerCase());

      // Fixed: Don't filter on status by default - only show pending
      return searchMatch;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return b.createdAt - a.createdAt;
      } else if (sortBy === "oldest") {
        return a.createdAt - b.createdAt;
      } else if (sortBy === "distance" && volunteerLocation) {
        // Handle missing location data gracefully
        if (!a.location || !b.location) return 0;

        const distA = calculateDistance(
          volunteerLocation.lat,
          volunteerLocation.lng,
          a.location.lat,
          a.location.lng
        );
        const distB = calculateDistance(
          volunteerLocation.lat,
          volunteerLocation.lng,
          b.location.lat,
          b.location.lng
        );
        return distA - distB;
      }
      return 0;
    });

  const filteredAcceptedOrders = acceptedOrders
    .filter((order) => {
      const searchMatch =
        order.foodItems?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.donorName?.toLowerCase().includes(searchTerm.toLowerCase());

      return searchMatch;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return b.acceptedAt - a.acceptedAt;
      } else if (sortBy === "oldest") {
        return a.acceptedAt - b.acceptedAt;
      }
      return 0;
    });

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h1 className="text-3xl font-bold text-indigo-800">
            Food Rescue Dashboard
          </h1>
          <p className="text-gray-600">
            Help reduce food waste and feed those in need by accepting pickup
            requests.
          </p>

          {/* Tab navigation */}
          <div className="flex mt-4 border-b">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "pending"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-indigo-500"
              }`}
              onClick={() => setActiveTab("pending")}
            >
              Pending Requests
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "accepted"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-indigo-500"
              }`}
              onClick={() => setActiveTab("accepted")}
            >
              Accepted Orders{" "}
              {acceptedOrders.length > 0 && `(${acceptedOrders.length})`}
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column: Request/Orders List */}
          <div className="w-full lg:w-2/5">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search food items or description"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute left-3 top-2 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>
                </div>

                <select
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  {activeTab === "pending" && (
                    <option value="distance">Closest First</option>
                  )}
                </select>
              </div>
            </div>

            {activeTab === "pending" ? (
              <PickupRequestList
                filteredRequests={filteredRequests}
                selectedRequest={selectedRequest}
                volunteerLocation={volunteerLocation}
                handleLocationClick={handleLocationClick}
                handleAccept={handleAccept}
                handleReject={handleReject}
                setSelectedRequest={setSelectedRequest}
                setSelectedLocation={setSelectedLocation}
                setShowRoute={setShowRoute}
              />
            ) : (
              <AcceptedOrdersList
                orders={filteredAcceptedOrders}
                selectedOrder={selectedRequest}
                handleLocationClick={(order) => {
                  setSelectedLocation(order.location);
                  setSelectedRequest(order);
                }}
                volunteerLocation={volunteerLocation}
                calculateDistance={calculateDistance}
              />
            )}
          </div>

          {/* Right column: MapAndDetailsView component */}
          <div className="w-full lg:w-3/5">
            <MapAndDetailsView
              volunteerLocation={volunteerLocation}
              selectedLocation={selectedLocation}
              selectedRequest={selectedRequest}
              donorDetails={donorDetails}
              loadingDonorDetails={loadingDonorDetails}
              showRoute={showRoute}
              toggleRoute={toggleRoute}
              handleAccept={handleAccept}
              calculateDistance={calculateDistance}
              setMapRef={setMapRef}
              isAcceptedOrder={activeTab === "accepted"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// New component for displaying accepted orders
const AcceptedOrdersList = ({
  orders,
  selectedOrder,
  handleLocationClick,
  volunteerLocation,
  calculateDistance,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md">
      {orders.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-lg text-gray-600">No accepted orders yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Accept a pickup request to see it here.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`p-4 hover:bg-blue-50 transition-colors cursor-pointer ${
                selectedOrder && selectedOrder.id === order.id
                  ? "bg-blue-50 border-l-4 border-blue-500"
                  : ""
              }`}
              onClick={() => {
                // Check if location exists before passing to handler
                if (order.location) {
                  handleLocationClick(order);
                } else {
                  // Create a fallback location if missing
                  const orderWithLocation = {
                    ...order,
                    location: volunteerLocation, // Fallback to volunteer location or null
                  };
                  handleLocationClick(orderWithLocation);
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{order.donorName}</h3>
                  <p className="text-sm text-gray-600">{order.donorAddress}</p>
                </div>
                {volunteerLocation && order.location && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {calculateDistance(
                      volunteerLocation.lat,
                      volunteerLocation.lng,
                      order.location.lat,
                      order.location.lng
                    )}{" "}
                    km
                  </span>
                )}
              </div>

              <div className="mt-2">
                <p className="font-medium text-gray-700">
                  {order.foodItems} -
                  {order.foodWeight && ` ${order.foodWeight} kg`}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {order.description}
                </p>
              </div>

              <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                <span>
                  Accepted: {new Date(order.acceptedAt).toLocaleString()}
                </span>
                <span className="bg-green-100 text-green-800 font-medium px-2.5 py-0.5 rounded-full">
                  {order.status}
                </span>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {order.donorContact}
                </div>
                <div className="flex items-center mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  {order.donorEmail}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
