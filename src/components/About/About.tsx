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
            <span className="text-[#b6894b] italic text-2xl">Discover</span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-2 leading-tight">
              OUR STORY
            </h2>
          </div>
          <p className="text-gray-500 leading-relaxed text-left">
            On her way she met a copy. The copy warned the Little Blind Text,
            that where it came from it would have been rewritten a thousand
            times and everything that was left from its origin would be the word
            "and" and the Little Blind Text should turn around and return to its
            own, safe country. But nothing the copy said could convince her and
            so it didn’t take long until a few insidious Copy Writers ambushed
            her, made her drunk with Longe and Parole and dragged her into their
            agency, where they abused her for their.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
