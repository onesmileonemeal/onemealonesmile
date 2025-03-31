import Count from "../component/countSection";
import HeroSection from "../component/heroSection";

const Home = () => {
  return (
    <div
      style={{
        backgroundImage: "url('/bg1.jpg')",
        backgroundSize: "cover", // Adjust as needed: cover, contain, etc.
        backgroundRepeat: "no-repeat",
        minHeight: "100vh", // Ensures the background covers the entire viewport height
        display: "flex",
        flexDirection: "column", // Stack HeroSection and Count vertically
      }}
    >
      <HeroSection />
      <Count />
    </div>
  );
};

export default Home;
