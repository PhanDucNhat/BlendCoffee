import React from "react";

const Contact: React.FC = () => {
  return (
    <div className="relative w-full bg-[#1a1a1a] text-white pb-8">
      <div className="max-w-full mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end gap-10">
          <div className="flex-1 text-left ml-20 pt-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex items-start space-x-4">
                <div className="text-[#b6894b] text-xl">
                  <i className="fa fa-phone" />
                </div>
                <div className="w-60">
                  <h3 className="text-lg font-semibold">000 (123) 456 7890</h3>
                  <p className="text-gray-300 text-sm">
                    A small river named Duden flows by their place and supplies.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4 -ml-44">
                <div className="text-[#b6894b] text-xl">
                  <i className="fa-solid fa-location-dot" />
                </div>
                <div className="w-60">
                  <h3 className="text-lg font-semibold">
                    198 West 21th Street
                  </h3>
                  <p className="text-gray-300 text-sm">
                    203 Fake St. Mountain View, San Francisco, California, USA
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4 -ml-[390px]">
                <div className="text-[#b6894b] text-xl">
                  <i className="fa-solid fa-clock" />
                </div>
                <div className="w-60">
                  <h3 className="text-lg font-semibold">Open Monday-Friday</h3>
                  <p className="text-gray-300 text-sm">8:00am - 9:00pm</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute right-1 -top-[227px] w-[90%] md:w-[600px] h-[400px] shadow-2xl z-30 rounded-md overflow-hidden">
            <img
              src="images/bg_5.jpg"
              alt="Book a Table"
              className="w-full h-[350px] object-cover"
            />
            <div className="absolute inset-0 bg-opacity-40 flex flex-col items-center text-center p-6">
              <h3 className="text-3xl font-bold text-white mb-2">
                Book a Table
              </h3>
              <p className="text-gray-200 text-sm max-w-md">
                Enjoy your dining experience with us. Call or visit for a
                reservation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
