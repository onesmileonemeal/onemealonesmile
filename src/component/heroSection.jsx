import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import foodPlate from "/assets/foodPlate.svg";

gsap.registerPlugin(ScrollTrigger);

const HeroSection = () => {
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      textRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          end: "top 40%",
          scrub: 1,
        },
      }
    );

    gsap.fromTo(
      imageRef.current,
      { scale: 0.7, opacity: 0, rotate: -5 },
      {
        scale: 1,
        opacity: 1,
        rotate: 0,
        duration: 1.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 90%",
          end: "top 45%",
          scrub: 1,
        },
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex flex-col md:flex-row items-center justify-between px-8 py-20 bg-transparent"
    >
      {/* Left Side Text */}
      <div ref={textRef} className="md:w-1/2 text-gray-900">
        <h1 className="text-4xl font-bold mb-4">
          Donate Food, Share Smiles! 🍽️
        </h1>
        <p className="text-lg text-gray-600">
          Help reduce food waste and feed those in need. Every meal you donate
          brings hope to someone. Join us in making a difference!
        </p>
      </div>

      {/* Right Side Image */}
      <div
        ref={imageRef}
        className="md:w-1/2 flex justify-center items-center mt-8 md:mt-0"
      >
        <div className=" aspect-square rounded-2xl flex items-center justify-center shadow-md">
          <img src={foodPlate} alt="Food Donation" className="w-3/4 h-3/4" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
