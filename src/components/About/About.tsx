import React from "react";

const About: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row w-full h-[600px] bg-black text-white">
      <div
        className="md:w-1/2 w-full bg-cover bg-center"
        style={{ backgroundImage: "url('/images/about.jpg')" }}
      ></div>
      <div className="md:w-1/2 w-full flex items-center bg-black/40 px-10 py-16 md:py-0">
        <div className="max-w-2xl space-y-4 bg-[#363636] p-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-2 leading-tight">
              CÂU CHUYỆN CHÚNG TÔI
            </h2>
          </div>
          <p className="text-gray-500 leading-relaxed text-left">
            Tại Blend Coffee, chúng tôi tin rằng mỗi tách cà phê đều kể một câu
            chuyện. Được thành lập vào năm 2010, quán cà phê của chúng tôi đã
            trở thành điểm đến yêu thích của cộng đồng địa phương, nơi mọi người
            có thể thưởng thức những ly cà phê tuyệt hảo trong không gian ấm
            cúng và thân thiện. Chúng tôi tự hào về việc lựa chọn những hạt cà
            phê chất lượng cao nhất từ các nông trại bền vững trên khắp thế
            giới, và cam kết mang đến cho khách hàng trải nghiệm cà phê độc đáo
            và khó quên.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
