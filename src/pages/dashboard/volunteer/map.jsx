import React, { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
import {
  Navigation,
  Info,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Clock,
  Calendar,
  CheckCircle,
} from "react-feather";

// Fix for default marker icons in Leaflet with webpack
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet's default icon issue
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapAndDetailsView = ({
  volunteerLocation,
  selectedLocation,
  selectedRequest,
  donorDetails,
  loadingDonorDetails,
  showRoute,
  toggleRoute,
  handleAccept,
  calculateDistance,
  setMapRef,
  isAcceptedOrder,
  destinationLocation,
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  // Extract location from selectedRequest if selectedLocation is not provided
  const extractedLocation =
    selectedRequest && !selectedLocation
      ? {
          lat:
            selectedRequest.latitude ||
            selectedRequest.lat ||
            (selectedRequest.location && selectedRequest.location.lat),
          lng:
            selectedRequest.longitude ||
            selectedRequest.lng ||
            (selectedRequest.location && selectedRequest.location.lng),
        }
      : null;

  // Use extracted location as fallback
  const actualSelectedLocation = selectedLocation || extractedLocation;

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const handleMapRef = (map) => {
    setMapRef(map);
    setMapLoaded(true);
    console.log("Map initialized with ref");
  };

  const hasValidVolunteerLocation =
    volunteerLocation &&
    typeof volunteerLocation.lat === "number" &&
    typeof volunteerLocation.lng === "number";

  const hasValidSelectedLocation =
    actualSelectedLocation &&
    typeof actualSelectedLocation.lat === "number" &&
    typeof actualSelectedLocation.lng === "number";

  const hasValidDestinationLocation =
    destinationLocation &&
    typeof destinationLocation.lat === "number" &&
    typeof destinationLocation.lng === "number";

  // Debug logs
  useEffect(() => {
    console.log("Volunteer location:", volunteerLocation);
    console.log("Selected location:", selectedLocation);
    console.log("Extracted location:", extractedLocation);
    console.log("Valid volunteer location:", hasValidVolunteerLocation);
    console.log("Valid selected location:", hasValidSelectedLocation);
    console.log("Destination location:", destinationLocation);
    console.log("Show route state:", showRoute);
  }, [
    volunteerLocation,
    selectedLocation,
    extractedLocation,
    destinationLocation,
    showRoute,
  ]);

  const mapCenter = hasValidSelectedLocation
    ? [actualSelectedLocation.lat, actualSelectedLocation.lng]
    : hasValidVolunteerLocation
    ? [volunteerLocation.lat, volunteerLocation.lng]
    : [51.505, -0.09]; // Default to London if no valid location

  const shouldDisplayMap =
    hasValidVolunteerLocation ||
    hasValidSelectedLocation ||
    hasValidDestinationLocation;

  // Modified Routing Control Component for Shortest Path with Yellow Line
  const ShortestPathRoutingControl = ({
    start,
    end,
    destination,
    setRouteInfo,
    mapLoaded,
  }) => {
    const map = useMap();
    const routingControlRef = useRef(null);

    useEffect(() => {
      if (!mapLoaded || !map) {
        console.log("Map not loaded yet");
        return;
      }

      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }

      try {
        // Determine which points to use for routing based on what's available
        let waypoints = [];

        if (start && hasValidVolunteerLocation) {
          waypoints.push(L.latLng(start.lat, start.lng));
        }

        if (end && hasValidSelectedLocation) {
          waypoints.push(L.latLng(end.lat, end.lng));
        }

        if (
          destination &&
          hasValidDestinationLocation &&
          waypoints.length > 0
        ) {
          // Only add destination if we have at least one other point
          waypoints.push(L.latLng(destination.lat, destination.lng));
        }

        // Only create routing if we have at least 2 points
        if (waypoints.length >= 2) {
          console.log("Creating route with waypoints:", waypoints);

          // Create routing control with yellow line styling
          routingControlRef.current = L.Routing.control({
            waypoints: waypoints,
            router: L.Routing.osrmv1({
              serviceUrl: "https://router.project-osrm.org/route/v1",
              profile: "driving", // Can be 'driving', 'walking', 'cycling'
              alternatives: false,
              geometryOnly: false,
            }),
            lineOptions: {
              styles: [
                { color: "#FFCC00", opacity: 0.8, weight: 6 }, // Yellow primary route
                { color: "#FFA500", opacity: 0.6, weight: 4 }, // Orange alternative routes
              ],
              extendToWaypoints: true,
              missingRouteTolerance: 0,
            },
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            showAlternatives: false,
            createMarker: function () {
              return null;
            }, // Don't create new markers
            fitSelectedRoutes: true,
            waypointMode: "connect", // Connect all waypoints in sequence
            show: false, // Hide the control interface
            collapsible: true, // Make it collapsible
          }).addTo(map);

          // Listen for route calculation event
          routingControlRef.current.on("routesfound", function (e) {
            const routes = e.routes;
            if (routes.length > 0) {
              const summary = routes[0].summary;
              setRouteInfo({
                distance: summary.totalDistance / 1000, // Convert to km
                time: summary.totalTime / 60, // Convert to minutes
              });

              // Fit the map to show the entire route with padding
              map.fitBounds(routes[0].bounds, { padding: [50, 50] });

              console.log("Route found:", summary);
            }
          });

          // Force route calculation
          routingControlRef.current.route();

          console.log(
            "Shortest path routing created between waypoints:",
            waypoints
          );
        } else {
          console.log("Not enough valid points for routing");
        }
      } catch (error) {
        console.error("Error creating route:", error);
      }

      return () => {
        if (routingControlRef.current) {
          map.removeControl(routingControlRef.current);
        }
      };
    }, [start, end, destination, map, setRouteInfo, mapLoaded]); // Added mapLoaded to dependencies

    return null;
  };

  // Custom Fly to location component
  const FlyToLocation = ({ location }) => {
    const map = useMap();

    useEffect(() => {
      if (!location) return;
      console.log("Flying to location:", location);
      map.flyTo([location.lat, location.lng], 13);
    }, [location, map]);

    return null;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="relative h-[400px]">
          {shouldDisplayMap ? (
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              whenCreated={handleMapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {hasValidVolunteerLocation && (
                <Marker
                  position={[volunteerLocation.lat, volunteerLocation.lng]}
                  icon={
                    new L.Icon({
                      iconUrl: icon,
                      shadowUrl: iconShadow,
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41],
                      className: "volunteer-marker", // Add custom class
                    })
                  }
                >
                  <Popup>Your Location</Popup>
                </Marker>
              )}

              {hasValidSelectedLocation && (
                <Marker
                  position={[
                    actualSelectedLocation.lat,
                    actualSelectedLocation.lng,
                  ]}
                  icon={
                    new L.Icon({
                      iconUrl:
                        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
                      shadowUrl: iconShadow,
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41],
                    })
                  }
                >
                  <Popup>Pickup Location</Popup>
                </Marker>
              )}

              {hasValidDestinationLocation && (
                <Marker
                  position={[destinationLocation.lat, destinationLocation.lng]}
                  icon={
                    new L.Icon({
                      iconUrl:
                        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
                      shadowUrl: iconShadow,
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41],
                    })
                  }
                >
                  <Popup>Destination Location</Popup>
                </Marker>
              )}

              {/* Only show routing if showRoute is true */}
              {showRoute && mapLoaded && (
                <ShortestPathRoutingControl
                  start={volunteerLocation}
                  end={actualSelectedLocation}
                  destination={destinationLocation}
                  setRouteInfo={setRouteInfo}
                  mapLoaded={mapLoaded}
                />
              )}

              {hasValidSelectedLocation ? (
                <FlyToLocation location={actualSelectedLocation} />
              ) : (
                hasValidVolunteerLocation && (
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

        {hasValidSelectedLocation && hasValidVolunteerLocation && (
          <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Distance:</span>{" "}
                {routeInfo
                  ? `${routeInfo.distance.toFixed(2)} km`
                  : calculateDistance(
                      volunteerLocation.lat,
                      volunteerLocation.lng,
                      actualSelectedLocation.lat,
                      actualSelectedLocation.lng
                    ) + " km"}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Estimated time:</span>{" "}
                {routeInfo
                  ? `${routeInfo.time.toFixed(0)} min`
                  : "Calculating..."}
              </div>
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
                      <span>{donorDetails.contact || "No phone provided"}</span>
                    </div>
                    <div className="flex items-center mb-3">
                      <Mail className="text-indigo-600 mr-2" size={20} />
                      <span>{donorDetails.email || "No email provided"}</span>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="text-indigo-600 mr-2 mt-1" size={20} />
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
                        {selectedRequest.donorContact ||
                          selectedRequest.donorPhone ||
                          "No phone provided"}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="text-indigo-600 mr-2 mt-1" size={20} />
                      <span>
                        {selectedRequest.donorAddress ||
                          selectedRequest.address ||
                          "No address provided"}
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
                  <span>{selectedRequest.foodItems || "Not specified"}</span>
                </div>
                <div className="flex items-center mb-3">
                  <Clock className="text-indigo-600 mr-2" size={20} />
                  <span>
                    Expiry: {selectedRequest.expiryDate || "Not specified"}
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
                  <span>
                    Weight: {selectedRequest.foodWeight || "Not specified"} kg
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Additional Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start mb-3">
                  <Calendar className="text-indigo-600 mr-2 mt-1" size={20} />
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

          {!isAcceptedOrder ? (
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleAccept(selectedRequest.id)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle size={20} /> Accept Pickup
              </button>
              <button
                onClick={toggleRoute}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                disabled={
                  !hasValidSelectedLocation || !hasValidVolunteerLocation
                }
              >
                <Navigation size={20} />{" "}
                {showRoute ? "Hide Route" : "Show Route"}
              </button>
            </div>
          ) : (
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  const phoneNumber =
                    selectedRequest.donorContact ||
                    selectedRequest.donorPhone ||
                    (donorDetails && donorDetails.contact);
                  if (phoneNumber) {
                    window.open(`tel:${phoneNumber}`);
                  } else {
                    alert("No phone number available");
                  }
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Phone size={20} /> Call Donor
              </button>
              <button
                onClick={toggleRoute}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                disabled={
                  !hasValidSelectedLocation || !hasValidVolunteerLocation
                }
              >
                <Navigation size={20} />{" "}
                {showRoute ? "Hide Route" : "Show Route"}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default MapAndDetailsView;
