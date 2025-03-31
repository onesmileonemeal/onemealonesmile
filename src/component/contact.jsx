import React from "react";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";

const Contact = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 mt-20 bg-white shadow-lg rounded-2xl">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-6">
        Contact Us
      </h1>
      <p className="text-gray-700 text-center mb-8">
        We'd love to hear from you! If you have any questions, feedback, or
        suggestions, please don't hesitate to reach out.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Email</h2>
          <p className="text-blue-600">onemealonesmile123@gmail.com</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Phone</h2>
          <p className="text-gray-700">+91 (956) 16-34326</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Address</h2>
          <p className="text-gray-700">Pune</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Social Media
          </h2>
          <div className="flex space-x-4">
            <a href="#" className="text-blue-600 text-2xl">
              <FaFacebook />
            </a>
            <a href="#" className="text-blue-400 text-2xl">
              <FaTwitter />
            </a>
            <a href="#" className="text-pink-500 text-2xl">
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
