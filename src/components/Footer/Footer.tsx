import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-gray-300 py-16 relative text-left">
      <div className="absolute inset-0 bg-black opacity-90"></div>
      <div className="relative container mx-auto px-6 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <h2 className="text-white text-xl font-semibold mb-4">ABOUT US</h2>
            <p className="text-gray-400 leading-relaxed">
              Far far away, behind the word mountains, far from the countries
              Vokalia and Consonantia, there live the blind texts.
            </p>
            <div className="flex space-x-4 mt-6">
              <a
                href="#"
                className="bg-gray-800 p-3 rounded-full hover:bg-gray-700 transition"
              >
                <i className="fab fa-twitter text-white"></i>
              </a>
              <a
                href="#"
                className="bg-gray-800 p-3 rounded-full hover:bg-gray-700 transition"
              >
                <i className="fab fa-facebook-f text-white"></i>
              </a>
              <a
                href="#"
                className="bg-gray-800 p-3 rounded-full hover:bg-gray-700 transition"
              >
                <i className="fab fa-instagram text-white"></i>
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-white text-xl font-semibold mb-4">
              RECENT BLOG
            </h2>
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start mb-5">
                <div
                  className="w-20 h-16 bg-cover bg-center rounded mr-4"
                  style={{
                    backgroundImage: `url(/images/image_${i}.jpg)`,
                  }}
                ></div>
                <div>
                  <h3 className="text-gray-200 text-sm font-medium leading-snug hover:text-white cursor-pointer">
                    Even the all-powerful Pointing has no control about
                  </h3>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-3 mt-1">
                    <span>
                      <i className="fas fa-calendar-alt mr-1"></i> Sept 15, 2018
                    </span>
                    <span>
                      <i className="fas fa-user mr-1"></i> Admin
                    </span>
                    <span>
                      <i className="fas fa-comments mr-1"></i> 19
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-white text-xl font-semibold mb-4">SERVICES</h2>
            <ul className="space-y-2">
              {["Cooked", "Deliver", "Quality Foods", "Mixed"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white transition">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-white text-xl font-semibold mb-4">
              HAVE A QUESTIONS?
            </h2>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start space-x-3">
                <i className="fas fa-map-marker-alt mt-1 text-gray-400"></i>
                <span>
                  203 Fake St. Mountain View, San Francisco, California, USA
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <i className="fas fa-phone text-gray-400"></i>
                <a href="#" className="hover:text-white">
                  +2 392 3929 210
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <i className="fas fa-envelope text-gray-400"></i>
                <a href="#" className="hover:text-white">
                  info@yourdomain.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          Copyright ©{new Date().getFullYear()} All rights reserved | This
          template is made with{" "}
          <i className="fas fa-heart text-red-500 mx-1"></i> by{" "}
          <a
            href="https://colorlib.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:underline"
          >
            Colorlib
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
