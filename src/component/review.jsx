import React from "react";
import { FaStar } from "react-icons/fa";

const Reviews = () => {
  const reviews = [
    {
      id: 1,
      user: "Amit Sharma",
      rating: 5,
      comment:
        "This platform has made donating food so easy! Highly recommend.",
    },
    {
      id: 2,
      user: "Priya Patel",
      rating: 4,
      comment: "Great service, and the volunteers are very helpful.",
    },
    {
      id: 3,
      user: "Rohan Verma",
      rating: 5,
      comment:
        "Amazing initiative! It's wonderful to see food going to those who need it.",
    },
    {
      id: 4,
      user: "Sneha Iyer",
      rating: 3,
      comment:
        "Good platform, but sometimes the pickup coordination can be a bit slow.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 mt-20 bg-white shadow-lg rounded-2xl">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-6">
        User Reviews
      </h1>
      <div className="grid md:grid-cols-2 gap-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-6 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {review.user}
              </h2>
              <div className="flex">
                {Array.from({ length: review.rating }).map((_, index) => (
                  <FaStar key={index} className="text-yellow-500" />
                ))}
              </div>
            </div>
            <p className="text-gray-700">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reviews;
