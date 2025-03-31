import React from "react";
import foodWasteImage from "/foodwaste.jpg";
import hungryChildrenImage from "/hungryChildrenImage.jpg";

const About = () => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 mt-20 bg-white shadow-lg rounded-2xl">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-6">
        About OneMealOneSmile
      </h1>
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          <img
            src={foodWasteImage}
            alt="Food Waste"
            className="rounded-lg shadow-md"
          />
        </div>
        <div>
          <p className="text-gray-700 leading-relaxed">
            OneMealOneSmile is a platform dedicated to reducing food waste and
            hunger by connecting food donors with those in need. Our mission is
            to ensure that no one goes to bed hungry. We believe in the power of
            community and collaboration to make a significant impact.
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6 items-center mt-6">
        <div>
          <p className="text-gray-700 leading-relaxed">
            We facilitate the safe and efficient distribution of surplus food
            from restaurants, events, and individuals to shelters, soup
            kitchens, and other organizations that serve vulnerable populations.
          </p>
        </div>
        <div>
          <img
            src={hungryChildrenImage}
            alt="Hungry Children"
            className="rounded-lg shadow-md"
          />
        </div>
      </div>
      <div className="mt-6">
        <p className="text-gray-700 leading-relaxed text-center">
          Our platform provides tools for donors to easily list available food,
          and for volunteers to coordinate pickups and deliveries. We are
          committed to transparency and accountability, ensuring that all food
          donations reach those who need them most.
        </p>
        <p className="text-gray-700 leading-relaxed text-center mt-4">
          Join us in our effort to create a world where everyone has access to
          nutritious food. Together, we can make a difference.
        </p>
      </div>
    </div>
  );
};

export default About;
