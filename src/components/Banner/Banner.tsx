import React, { useState, useEffect } from "react";
import { goToSlide } from "./Banner";

interface Slide {
  id: number;
  url: string;
  title: string;
  subtitle: string;
  description: string;
}

const Banner: React.FC = () => {
  const slides: Slide[] = [
    {
      id: 1,
      url: "/images/bg_1.jpg",
      title: "Welcome",
      subtitle: "THE BEST COFFEE TESTING EXPERIENCE",
      description:
        "A small river named Duden flows by their place and supplies it with the necessary regelialia.",
    },
    {
      id: 2,
      url: "/images/bg_2.jpg",
      title: "Welcome",
      subtitle: "FRESHLY ROASTED BEANS EVERYDAY",
      description:
        "Our coffee is freshly roasted to perfection to give you the richest flavor.",
    },
    {
      id: 3,
      url: "/images/bg_3.jpg",
      title: "Welcome",
      subtitle: "ENJOY YOUR COFFEE MOMENT",
      description:
        "Take a break and savor your favorite cup with the perfect aroma and taste.",
    },
  ];

  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  //   const handleNext = () => setCurrent(nextSlide(current, slides.length));
  //   const handlePrev = () => setCurrent(prevSlide(current, slides.length));
  const handleGoTo = (index: number) => setCurrent(goToSlide(index));

  return (
    <div className="relative h-[800px] w-full overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            current === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.url}
            alt={`Slide ${slide.id}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white px-4">
            <p className="text-[#b6894b] text-lg italic mb-2 animate-fadeIn text-[30px]">
              {slide.title}
            </p>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fadeIn">
              {slide.subtitle}
            </h1>
            <p className="max-w-2xl text-gray-300 mb-8 animate-fadeIn">
              {slide.description}
            </p>
            <div className="flex gap-4">
              <button className="bg-[#b6894b] text-white px-6 py-3 rounded-sm text-sm uppercase tracking-wider hover:bg-[#a6783d] transition">
                Order Now
              </button>
              <button className="border border-white px-6 py-3 rounded-sm text-sm uppercase tracking-wider hover:bg-white hover:text-black transition">
                View Menu
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* <button
        onClick={handlePrev}
        className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white px-3 py-2 rounded-full text-2xl z-10"
      >
        &#10094;
      </button>
      <button
        onClick={handleNext}
        className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white px-3 py-2 rounded-full text-2xl z-10"
      >
        &#10095;
      </button> */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-10">
        {slides.map((_, index) => (
          <span
            key={index}
            onClick={() => handleGoTo(index)}
            className={`cursor-pointer h-3 w-3 rounded-full border border-white ${
              current === index ? "bg-[#b6894b]" : "bg-transparent"
            } transition`}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default Banner;
