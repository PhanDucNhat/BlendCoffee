import React, { useState, useEffect } from "react";
import { goToSlide } from "./BannerUtils";

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
      subtitle: "TRẢI NGHIỆM THỬ CÀ PHÊ TUYỆT VỜI NHẤT",
      description:
        "Một con sông Duden chảy qua nơi họ ở và cung cấp cho họ những nhu yếu phẩm cần thiết.",
    },
    {
      id: 2,
      url: "/images/bg_2.jpg",
      title: "Welcome",
      subtitle: "CÀ PHÊ RANG TƯƠI MỖI NGÀY",
      description:
        "Cà phê của chúng tôi được rang tươi hoàn hảo để mang đến cho bạn hương vị đậm đà nhất.",
    },
    {
      id: 3,
      url: "/images/bg_3.jpg",
      title: "Welcome",
      subtitle: "HÃY TẬN HƯỞNG KHOẢNH KHẮC CÀ PHÊ CỦA BẠN",
      description:
        "Hãy thưởng thức tách cà phê yêu thích của bạn với hương thơm và vị ngon hoàn hảo.",
    },
  ];

  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

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
                Đặt hàng ngay
              </button>
              <button className="border border-white px-6 py-3 rounded-sm text-sm uppercase tracking-wider hover:bg-white hover:text-black transition">
                Xem thực đơn
              </button>
            </div>
          </div>
        </div>
      ))}

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
