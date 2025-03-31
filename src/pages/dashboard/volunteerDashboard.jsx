import React, { useState, useEffect } from "react";
import { useUser } from "../../../context/UserContext";
import { db } from "../../../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  MapPin,
  CheckCircle,
  XCircle,
  Navigation,
  Clock,
  Package,
  Info,
  User,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";

// Removed duplicate import
// import VolunteerDashboardInner from "./volunteerDashboard/volunteerDashboard";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
});

L.Marker.prototype.options.icon = DefaultIcon;

const FlyToLocation = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 14, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [location, map]);
  return null;
};

const RoutingControl = ({ start, end }) => {
  const map = useMap();

  useEffect(() => {
    if (!start || !end) return;

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
      routeWhileDragging: false,
      showAlternatives: true,
      lineOptions: {
        styles: [{ color: "#6366F1", weight: 4 }],
      },
      createMarker: function () {
        return null;
      },
      addWaypoints: false,
      fitSelectedRoutes: true,
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, start, end]);

  return null;
};

const VolunteerDashboard = () => {
  const { user } = useUser();
  const [pickupRequests, setPickupRequests] = useState([]);
  const [volunteerLocation, setVolunteerLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [donorDetails, setDonorDetails] = useState(null);
  const [loadingDonorDetails, setLoadingDonorDetails] = useState(false);

  const [mapRef, setMapRef] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setVolunteerLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

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
      if (!user || !user.uid) return;
      await updateDoc(doc(db, "donations", requestId), {
        status: "accepted",
        volunteerId: user.uid,
        acceptedAt: new Date(),
      });
      console.log(`Request ${requestId} accepted.`);

      setShowRoute(true);
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await updateDoc(doc(db, "donations", requestId), {
        status: "rejected",
        rejectedAt: new Date(),
      });
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
    // Fixed comment: Distance in km
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

      const statusMatch =
        filterStatus === "all" || request.status === filterStatus;

      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return b.createdAt - a.createdAt;
      } else if (sortBy === "oldest") {
        return a.createdAt - b.createdAt;
      } else if (sortBy === "distance" && volunteerLocation) {
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

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleMapRef = (map) => {
    setMapRef(map);
  };

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
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column: filters and request list */}
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
                  <option value="distance">Closest First</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <h2 className="bg-indigo-700 text-white text-xl font-semibold p-4">
                Available Pickup Requests ({filteredRequests.length})
              </h2>
              {filteredRequests.length > 0 ? (
                <div className="max-h-[calc(100vh-360px)] overflow-y-auto">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`border-b border-gray-200 p-4 hover:bg-indigo-50 transition-colors cursor-pointer ${
                        selectedRequest?.id === request.id
                          ? "bg-indigo-100"
                          : ""
                      }`}
                      onClick={() => handleLocationClick(request)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg text-indigo-800">
                          {request.donorName || "Anonymous Donor"}
                        </h3>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {request.urgency || "Standard"}
                        </span>
                      </div>

                      <div className="flex gap-2 text-gray-600 text-sm mb-2">
                        <Clock size={16} className="flex-shrink-0 mt-0.5" />
                        <span>
                          {request.createdAt
                            ? formatDate(request.createdAt)
                            : "Unknown date"}
                        </span>
                      </div>

                      {/* Removed the incorrect requests.map loop */}

                      <div className="flex gap-2 text-gray-600 mb-3">
                        <Package size={16} className="flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-medium">{request.foodItems}</p>
                          <p className="text-sm">
                            Weight: {request.foodWeight} kg
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(request.id);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded flex items-center gap-1 text-sm transition-colors"
                        >
                          <CheckCircle size={16} /> Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(request.id);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded flex items-center gap-1 text-sm transition-colors"
                        >
                          <XCircle size={16} /> Decline
                        </button>
                        {volunteerLocation && request.location && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(request);
                              setSelectedLocation(request.location);
                              setShowRoute(true);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-1 text-sm transition-colors"
                          >
                            <Navigation size={16} /> Route
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Package size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">
                    No pickup requests available
                  </p>
                  <p className="text-sm">
                    Check back later for new donation requests
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right column: map and request details */}
          <div className="w-full lg:w-3/5">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="relative h-[400px]">
                {volunteerLocation || selectedLocation ? (
                  <MapContainer
                    center={
                      volunteerLocation
                        ? [volunteerLocation.lat, volunteerLocation.lng]
                        : [selectedLocation.lat, selectedLocation.lng]
                    }
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    whenCreated={handleMapRef}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {/* Always show volunteer location if available */}
                    {volunteerLocation && (
                      <Marker
                        position={[
                          volunteerLocation.lat,
                          volunteerLocation.lng,
                        ]}
                      >
                        <Popup>Your Location</Popup>
                      </Marker>
                    )}

                    {/* Show selected pickup location if available */}
                    {selectedLocation && (
                      <Marker
                        position={[selectedLocation.lat, selectedLocation.lng]}
                      >
                        <Popup>Pickup Location</Popup>
                      </Marker>
                    )}

                    {/* Show routing between volunteer and pickup location */}
                    {showRoute && volunteerLocation && selectedLocation && (
                      <RoutingControl
                        start={volunteerLocation}
                        end={selectedLocation}
                      />
                    )}

                    {/* Automatically fly to selected location */}
                    {selectedLocation ? (
                      <FlyToLocation location={selectedLocation} />
                    ) : (
                      volunteerLocation && (
                        <FlyToLocation location={volunteerLocation} />
                      )
                    )}
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <div className="text-center text-gray-500">
                      <MapPin size={48} className="mx-auto mb-2" />
                      <p>Waiting for location access...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Control Panel */}
              {selectedLocation && volunteerLocation && (
                <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Distance:{" "}
                    {calculateDistance(
                      volunteerLocation.lat,
                      volunteerLocation.lng,
                      selectedLocation.lat,
                      selectedLocation.lng
                    )}{" "}
                    km
                  </div>
                  <button
                    onClick={toggleRoute}
                    className={`px-4 py-2 rounded text-sm flex items-center gap-1 ${
                      showRoute
                        ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    <Navigation size={16} />
                    {showRoute ? "Hide Route" : "Show Route"}
                  </button>
                </div>
              )}
            </div>

            {selectedRequest && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-indigo-800 mb-4 flex items-center">
                  <Info className="mr-2" /> Donation Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Donor Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {loadingDonorDetails ? (
                        <div className="flex justify-center py-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : donorDetails ? (
                        <div>
                          <div className="flex items-center mb-3">
                            <User className="text-indigo-600 mr-2" size={20} />
                            <span className="font-medium">
                              {donorDetails.name ||
                                donorDetails.displayName ||
                                "Anonymous"}
                            </span>
                          </div>
                          <div className="flex items-center mb-3">
                            <Phone className="text-indigo-600 mr-2" size={20} />
                            <span>
                              {donorDetails.contact || "No phone provided"}
                            </span>
                          </div>
                          <div className="flex items-center mb-3">
                            <Mail className="text-indigo-600 mr-2" size={20} />
                            <span>
                              {donorDetails.email || "No email provided"}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <MapPin
                              className="text-indigo-600 mr-2 mt-1"
                              size={20}
                            />
                            <span>
                              {donorDetails.address ||
                                selectedRequest.address ||
                                "No address provided"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center mb-3">
                            <User className="text-indigo-600 mr-2" size={20} />
                            <span className="font-medium">
                              {selectedRequest.donorName || "Anonymous Donor"}
                            </span>
                          </div>
                          <div className="flex items-center mb-3">
                            <Phone className="text-indigo-600 mr-2" size={20} />
                            <span>
                              {selectedRequest.donorPhone ||
                                "No phone provided"}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <MapPin
                              className="text-indigo-600 mr-2 mt-1"
                              size={20}
                            />
                            <span>
                              {selectedRequest.address || "No address provided"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Food Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-3">
                        <Package className="text-indigo-600 mr-2" size={20} />
                        <span>{selectedRequest.foodItems}</span>
                      </div>
                      <div className="flex items-center mb-3">
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
                          className="text-indigo-600 mr-2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        <span>
                          Expiry:{" "}
                          {selectedRequest.expiryDate || "Not specified"}
                        </span>
                      </div>
                      <div className="flex items-center">
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
                          className="text-indigo-600 mr-2"
                        >
                          <path d="M20.91 8.84 8.56 2.23a1.93 1.93 0 0 0-1.81 0L3.1 4.13a2.12 2.12 0 0 0-.05 3.69l12.22 6.93a2 2 0 0 0 1.94 0L21 12.51a2.12 2.12 0 0 0-.09-3.67Z" />
                          <path d="m3.09 8.84 12.35-6.61a1.93 1.93 0 0 1 1.81 0l3.65 1.9a2.12 2.12 0 0 1 .1 3.69L8.73 14.75a2 2 0 0 1-1.94 0L3 12.51a2.12 2.12 0 0 1 .09-3.67Z" />
                          <line x1="12" y1="22" x2="12" y2="13" />
                          <path d="M20 13.5v3.37a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13.5" />
                        </svg>
                        <span>Weight: {selectedRequest.foodWeight} kg</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Additional Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start mb-3">
                        <Calendar
                          className="text-indigo-600 mr-2 mt-1"
                          size={20}
                        />
                        <div>
                          <p className="font-medium">Requested on</p>
                          <p>
                            {selectedRequest.createdAt
                              ? formatDate(selectedRequest.createdAt)
                              : "Unknown date"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
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
                          className="text-indigo-600 mr-2 mt-1"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <div>
                          <p className="font-medium">Description</p>
                          <p>
                            {selectedRequest.description ||
                              "No additional information provided."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      handleAccept(selectedRequest.id);
                      setShowRoute(true);
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle size={20} /> Accept Pickup
                  </button>
                  <button
                    onClick={toggleRoute}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Navigation size={20} />{" "}
                    {showRoute ? "Hide Route" : "Show Route"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
