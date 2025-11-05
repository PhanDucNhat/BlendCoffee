import React from "react";

const Menu: React.FC = () => {
  return (
    <div className="w-full bg-[#0d0d0d] text-white py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10">
        <div className="md:w-1/2 w-full text-center md:text-right space-y-5">
          <div>
            <span className="text-[#b6894b] italic text-2xl">Discover</span>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
              OUR MENU
            </h2>
          </div>
          <p className="text-gray-300 leading-relaxed text-right">
            Far far away, behind the word mountains, far from the countries
            Vokalia and Consonantia, there live the blind texts. Separated they
            live in Bookmarksgrove right at the coast of the Semantics, a large
            language ocean.
          </p>
          <div>
            <a
              href="#"
              className="inline-block border border-[#b6894b] text-[#b6894b] px-6 py-3 font-medium hover:bg-[#b6894b] hover:text-white transition"
            >
              View Full Menu
            </a>
          </div>
        </div>
        <div className="md:w-1/2 w-full grid grid-cols-2 gap-4">
          <div
            className="bg-cover bg-center aspect-square"
            style={{ backgroundImage: "url('/images/menu-1.jpg')" }}
          ></div>
          <div
            className="bg-cover bg-center aspect-square mt-6 md:mt-10"
            style={{ backgroundImage: "url('/images/menu-2.jpg')" }}
          ></div>
          <div
            className="bg-cover bg-center aspect-square"
            style={{ backgroundImage: "url('/images/menu-3.jpg')" }}
          ></div>
          <div
            className="bg-cover bg-center aspect-square mt-6 md:mt-10"
            style={{ backgroundImage: "url('/images/menu-4.jpg')" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
