import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../../firebaseConfig";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useUser } from "../../../context/UserContext";
import {
  ArrowLeft,
  DollarSign,
  Package,
  MapPin,
  Calendar,
  AlertCircle,
  Check,
  Info,
} from "lucide-react";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const LocationSelector = ({ setLocation }) => {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setLocation({ lat, lng });
    },
  });
  return null;
};

const AddDonationPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const [donationType, setDonationType] = useState("");
  const [moneyAmount, setMoneyAmount] = useState("");
  const [foodItems, setFoodItems] = useState("");
  const [foodWeight, setFoodWeight] = useState("");
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  if (!user || !user.uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to make a donation.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate("/login")}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-all"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  const saveDonation = async () => {
    if (donationType === "") {
      setError("Please select a donation type.");
      return;
    }

    if (donationType === "food" && (!foodItems || !foodWeight)) {
      setError("Please provide food items and their weight.");
      return;
    }

    if (donationType === "money" && !moneyAmount) {
      setError("Please provide an amount for your money donation.");
      return;
    }

    // Only check location for food donations
    if (donationType === "food" && !location) {
      setError("Please select a location for your donation.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Add a new document with a generated id.
      const donationRef = await addDoc(collection(db, "donations"), {
        userId: user.uid,
        donationType,
        moneyAmount: donationType === "money" ? moneyAmount : null,
        foodItems: donationType === "food" ? foodItems : null,
        foodWeight: donationType === "food" ? parseFloat(foodWeight) : null,
        location: donationType === "food" ? location : null, // Only save location for food donations
        timestamp: new Date(),
        status: "pending",
      });

      // Add donation ID to the donor's donations subcollection
      const donorRef = doc(db, "donors", user.uid);
      const donationSubcollectionRef = doc(
        collection(donorRef, "donations"),
        donationRef.id
      );

      await setDoc(donationSubcollectionRef, {
        donationId: donationRef.id,
        userId: user.uid,
        donationType,
        moneyAmount: donationType === "money" ? moneyAmount : null,
        foodItems: donationType === "food" ? foodItems : null,
        foodWeight: donationType === "food" ? parseFloat(foodWeight) : null,
        location: donationType === "food" ? location : null, // Only save location for food donations
        timestamp: new Date(),
        status: "pending",
      });

      navigate("/donation-summary");
    } catch (err) {
      console.error("Error saving donation: ", err);
      setError("Failed to save donation. Please try again.");
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (donationType === "") {
        setError("Please select a donation type.");
        return;
      }

      if (donationType === "food" && (!foodItems || !foodWeight)) {
        setError("Please provide food items and their weight.");
        return;
      }

      if (donationType === "money" && !moneyAmount) {
        setError("Please provide an amount for your money donation.");
        return;
      }

      // If money donation, skip to confirmation step
      if (donationType === "money") {
        setStep(3); // Skip to step 3 (confirmation)
        return;
      }
    }

    setError("");
    setStep(step + 1);
  };

  const prevStep = () => {
    // If on confirmation step and it's a money donation, go back to step 1
    if (step === 3 && donationType === "money") {
      setStep(1);
      return;
    }

    setStep(step - 1);
  };

  // Get appropriate step display based on donation type
  const getStepDisplay = () => {
    if (donationType === "money") {
      return (
        <div className="flex items-center space-x-2 mt-6">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? "bg-white text-blue-600" : "bg-blue-400 text-white"
            }`}
          >
            <span>1</span>
          </div>
          <div
            className={`flex-1 h-1 ${step >= 3 ? "bg-white" : "bg-blue-400"}`}
          ></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? "bg-white text-blue-600" : "bg-blue-400 text-white"
            }`}
          >
            <span>2</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2 mt-6">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? "bg-white text-blue-600" : "bg-blue-400 text-white"
            }`}
          >
            <span>1</span>
          </div>
          <div
            className={`flex-1 h-1 ${step >= 2 ? "bg-white" : "bg-blue-400"}`}
          ></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? "bg-white text-blue-600" : "bg-blue-400 text-white"
            }`}
          >
            <span>2</span>
          </div>
          <div
            className={`flex-1 h-1 ${step >= 3 ? "bg-white" : "bg-blue-400"}`}
          ></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? "bg-white text-blue-600" : "bg-blue-400 text-white"
            }`}
          >
            <span>3</span>
          </div>
        </div>
      );
    }
  };

  // Get step labels based on donation type
  const getStepLabels = () => {
    if (donationType === "money") {
      return (
        <div className="flex justify-between mt-2 text-sm text-blue-100">
          <span>Donation Details</span>
          <span className="ml-auto">Confirmation</span>
        </div>
      );
    } else {
      return (
        <div className="flex justify-between mt-2 text-sm text-blue-100">
          <span>Donation Details</span>
          <span>Location</span>
          <span>Confirmation</span>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} className="mr-1" /> Back to Dashboard
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Progress Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <h1 className="text-2xl font-bold mb-4">Make a Donation</h1>

          {getStepDisplay()}
          {getStepLabels()}
        </div>

        {/* Form Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
              <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-1" />
              <p>{error}</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Donation Details
              </h2>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Donation Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setDonationType("money")}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center ${
                      donationType === "money"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-full ${
                        donationType === "money" ? "bg-blue-100" : "bg-gray-100"
                      } mb-2`}
                    >
                      <DollarSign
                        size={24}
                        className={
                          donationType === "money"
                            ? "text-blue-500"
                            : "text-gray-500"
                        }
                      />
                    </div>
                    <span className="font-medium">Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDonationType("food")}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center ${
                      donationType === "food"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-full ${
                        donationType === "food" ? "bg-blue-100" : "bg-gray-100"
                      } mb-2`}
                    >
                      <Package
                        size={24}
                        className={
                          donationType === "food"
                            ? "text-blue-500"
                            : "text-gray-500"
                        }
                      />
                    </div>
                    <span className="font-medium">Food</span>
                  </button>
                </div>
              </div>

              {donationType === "money" && (
                <div>
                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                      Amount (in USD)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <DollarSign size={18} className="text-gray-500" />
                      </div>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={moneyAmount}
                        onChange={(e) => setMoneyAmount(e.target.value)}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500 flex items-center">
                      <Info size={14} className="mr-1" /> Your generous donation
                      will be used to support our initiatives.
                    </p>
                  </div>

                  <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      QR Code for Payment
                    </h3>
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <img
                        src="/qr.png"
                        alt="Payment QR Code"
                        className="mb-4 w-1/4"
                      />
                      <p className="text-center text-sm text-gray-600">
                        Scan this QR code with your banking app to make the
                        payment of ${moneyAmount || "0"}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {donationType === "food" && (
                <>
                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                      Food Items
                    </label>
                    <input
                      type="text"
                      placeholder="Enter food items (e.g., rice, vegetables, canned goods)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      value={foodItems}
                      onChange={(e) => setFoodItems(e.target.value)}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Please list all food items you're donating.
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                      Food Weight (in kg)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter approximate weight"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      value={foodWeight}
                      onChange={(e) => setFoodWeight(e.target.value)}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Your estimate helps us plan for collection and
                      distribution.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && donationType === "food" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Select Location
              </h2>

              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Click on the map to select the location for your donation
                  pickup.
                </p>

                <div className="rounded-lg overflow-hidden border border-gray-300">
                  <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    style={{ height: "400px", width: "100%" }}
                    className="z-0"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationSelector setLocation={setLocation} />
                    {location && (
                      <Marker position={[location.lat, location.lng]}>
                        <Popup>
                          Selected Location: {location.lat.toFixed(4)},{" "}
                          {location.lng.toFixed(4)}
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>

                {location && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
                    <MapPin size={20} className="text-blue-500 mr-2" />
                    <p className="text-blue-700">
                      Location selected: {location.lat.toFixed(4)},{" "}
                      {location.lng.toFixed(4)}
                    </p>
                  </div>
                )}

                {!location && (
                  <p className="mt-4 text-amber-600 flex items-center">
                    <AlertCircle size={16} className="mr-1" /> Please select a
                    location on the map
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Confirm Your Donation
              </h2>

              <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-500 text-sm">Donation Type</span>
                    <p className="font-medium text-gray-800 flex items-center">
                      {donationType === "money" ? (
                        <>
                          <DollarSign
                            size={18}
                            className="mr-1 text-blue-500"
                          />{" "}
                          Money Donation
                        </>
                      ) : (
                        <>
                          <Package size={18} className="mr-1 text-green-500" />{" "}
                          Food Donation
                        </>
                      )}
                    </p>
                  </div>

                  {donationType === "money" && (
                    <div>
                      <span className="text-gray-500 text-sm">Amount</span>
                      <p className="font-medium text-gray-800">
                        ${moneyAmount} USD
                      </p>
                    </div>
                  )}

                  {donationType === "food" && (
                    <>
                      <div>
                        <span className="text-gray-500 text-sm">
                          Food Items
                        </span>
                        <p className="font-medium text-gray-800">{foodItems}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">
                          Approximate Weight
                        </span>
                        <p className="font-medium text-gray-800">
                          {foodWeight} kg
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500 text-sm">Location</span>
                        <p className="font-medium text-gray-800 flex items-start">
                          <MapPin
                            size={18}
                            className="mr-1 mt-1 flex-shrink-0 text-red-500"
                          />
                          {location
                            ? `${location.lat.toFixed(
                                4
                              )}, ${location.lng.toFixed(4)}`
                            : "Not selected"}
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <span className="text-gray-500 text-sm">Date</span>
                    <p className="font-medium text-gray-800 flex items-center">
                      <Calendar size={18} className="mr-1 text-gray-500" />
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {donationType === "money" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 flex items-start">
                    <Info size={18} className="mr-2 flex-shrink-0 mt-1" />
                    Thank you for your generous donation! We've received your
                    payment information. A confirmation email will be sent to
                    your registered email address.
                  </p>
                </div>
              )}

              {donationType === "food" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 flex items-start">
                    <Info size={18} className="mr-2 flex-shrink-0 mt-1" />
                    After submitting your donation, our team will review the
                    details and contact you regarding the pickup process. Thank
                    you for your generosity!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div
            className={`flex ${
              step > 1 ? "justify-between" : "justify-end"
            } mt-6`}
          >
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                disabled={isSubmitting}
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={saveDonation}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Check size={18} className="mr-1" /> Submit Donation
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDonationPage;
