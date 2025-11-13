import React from "react";
import About from "../components/About/About";

interface Testimonial {
  id: number;
  quote: string;
  name: string;
  position: string;
  image: string;
  highlighted?: boolean;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic life One day however a small.",
    name: "Louise Kelly",
    position: "Illustrator Designer",
    image: "images/person_1.jpg",
  },
  {
    id: 2,
    quote:
      "Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic life One day however a small line of blind text by the name of Lorem Ipsum decided to leave for the far World of Grammar.",
    name: "Louise Kelly",
    position: "Illustrator Designer",
    image: "images/person_2.jpg",
    highlighted: true,
  },
  {
    id: 3,
    quote:
      "Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic life One day however a small line of blind text by the name.",
    name: "Louise Kelly",
    position: "Illustrator Designer",
    image: "images/person_3.jpg",
  },
  {
    id: 4,
    quote:
      "Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic life One day however.",
    name: "Louise Kelly",
    position: "Illustrator Designer",
    image: "images/person_2.jpg",
    highlighted: true,
  },
  {
    id: 5,
    quote:
      "Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic life One day however a small line of blind text by the name.",
    name: "Louise Kelly",
    position: "Illustrator Designer",
    image: "images/person_3.jpg",
  },
];

const AboutPage: React.FC = () => {
  return (
    <>
      <section
        className="relative h-[80vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/bg_3.jpg')",
        }}
      >
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-5xl font-bold mb-4 mt-10">OBOUT US</h1>
          <p className="text-lg">
            <span className="mr-2 text-gray-300">
              <a href="/" className="hover:text-white transition">
                Home
              </a>
            </span>
            <span className="text-[#b6894b]">/ About</span>
          </p>
        </div>
      </section>
      <About />
      <section
        id="testimony"
        className="relative bg-cover bg-center py-24 text-white h-[640px]"
        style={{ backgroundImage: "url('/images/bg_1.jpg')" }}
      >
        <div className="relative container mx-auto px-6 text-center mb-16">
          <span className="text-amber-400 italic text-lg tracking-widest">
            Testimony
          </span>
          <h2 className="text-4xl font-bold uppercase mt-2">Customers Says</h2>
          <p className="text-gray-300 mt-4 max-w-2xl mx-auto leading-relaxed">
            Far far away, behind the word mountains, far from the countries
            Vokalia and Consonantia, there live the blind texts.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap justify-center">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className={`w-full sm:w-1/2 lg:w-1/5 flex flex-col ${
                item.highlighted ? "mt-8" : "mt-0"
              }`}
            >
              <div
                className={`h-full bg-[#c49b63] text-white p-6 rounded-sm shadow-lg transition-transform duration-300 ${
                  item.highlighted ? "opacity-95" : "opacity-90"
                }`}
              >
                <blockquote className="italic mb-6 leading-relaxed">
                  “{item.quote}”
                </blockquote>
                <div className="flex items-center mt-auto">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded-full mr-3 border-2 border-white object-cover"
                  />
                  <div>
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-gray-200">{item.position}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default AboutPage;
