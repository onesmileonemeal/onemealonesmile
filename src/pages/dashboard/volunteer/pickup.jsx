import React from "react";
import { CheckCircle, XCircle, Navigation, Clock, Package } from "lucide-react";

const PickupRequestList = ({
  filteredRequests,
  selectedRequest,
  volunteerLocation,
  handleLocationClick,
  handleAccept,
  handleReject,
  setSelectedRequest,
  setSelectedLocation,
  setShowRoute,
}) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
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
                selectedRequest?.id === request.id ? "bg-indigo-100" : ""
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

              <div className="flex gap-2 text-gray-600 mb-3">
                <Package size={16} className="flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium">{request.foodItems}</p>
                  <p className="text-sm">Weight: {request.foodWeight} kg</p>
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
          <p className="text-lg font-medium">No pickup requests available</p>
          <p className="text-sm">Check back later for new donation requests</p>
        </div>
      )}
    </div>
  );
};

export default PickupRequestList;
