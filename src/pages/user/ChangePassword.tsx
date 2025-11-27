import React from "react";

const ChangePassword = () => {
  return (
    <>
      <div
        className="relative h-[11vh] bg-cover bg-center"
        style={{ backgroundImage: "url('/images/bg_2.jpg')" }}
      ></div>
      <section className="bg-black py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 text-white space-y-6 text-center">
              <h2 className="text-2xl font-semibold mb-6">CHANGE PASSWORD</h2>
              <div className="text-2xl flex justify-center">
                <span className="text-gray-400 mr-1">HELLO </span>
                <p className="font-medium text-[#b6894b]">NHAT</p>
              </div>
              <div className="w-[200px] h-[200px] mx-auto">
                <img src="images/avatar.png" alt="avatar" />
              </div>
            </div>

            <div className="hidden md:block md:col-span-1"></div>

            <div className="md:col-span-7">
              <form className="space-y-6 text-left">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <div className="block text-sm text-gray-400 mb-1">
                      Old password
                    </div>
                    <input
                      type="text"
                      id="name"
                      className="w-full bg-transparent border-b border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400 outline-none pb-2 transition"
                      placeholder=""
                    />
                  </div>
                  <div>
                    <div className="block text-sm text-gray-400 mb-1">
                      New password
                    </div>
                    <input
                      type="text"
                      id="name"
                      className="w-full bg-transparent border-b border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400 outline-none pb-2 transition"
                      placeholder=""
                    />
                  </div>
                  <div>
                    <div className="block text-sm text-gray-400 mb-1">
                      Confirm password
                    </div>
                    <input
                      type="text"
                      id="name"
                      className="w-full bg-transparent border-b border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400 outline-none pb-2 transition"
                      placeholder=""
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ChangePassword;
