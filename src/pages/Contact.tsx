import React from "react";

const Contact = () => {
  return (
    <>
      <section
        className="relative h-[80vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/bg_3.jpg')",
        }}
      >
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-5xl font-bold mb-4 mt-10">Our Menu</h1>
          <p className="text-lg">
            <span className="mr-2 text-gray-300">
              <a href="/" className="hover:text-white transition">
                Home
              </a>
            </span>
            <span className="text-[#b6894b]">/ Contact</span>
          </p>
        </div>
      </section>
      <section className="bg-black py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 text-white space-y-6">
              <h2 className="text-2xl font-semibold mb-6">
                Contact Information
              </h2>
              <div className="space-y-4 text-sm text-left">
                <p>
                  <span className="text-gray-400">Address:</span> 198 West 21th
                  Street, Suite 721 New York NY 10016
                </p>
                <p>
                  <span className="text-gray-400">Phone:</span>{" "}
                  <a
                    href="tel:+1235235598"
                    className="text-white hover:underline"
                  >
                    + 1235 2355 98
                  </a>
                </p>
                <p>
                  <span className="text-gray-400">Email:</span>{" "}
                  <a
                    href="mailto:info@yoursite.com"
                    className="text-yellow-500 hover:underline"
                  >
                    info@yoursite.com
                  </a>
                </p>
                <p>
                  <span className="text-gray-400">Website:</span>{" "}
                  <a href="#" className="text-yellow-500 hover:underline">
                    yoursite.com
                  </a>
                </p>
              </div>
            </div>

            <div className="hidden md:block md:col-span-1"></div>

            <div className="md:col-span-7">
              <form className="space-y-6 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm text-gray-400 mb-1"
                    >
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full bg-transparent border-b border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400 outline-none pb-2 transition"
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm text-gray-400 mb-1"
                    >
                      Your Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full bg-transparent border-b border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400 outline-none pb-2 transition"
                      placeholder=""
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm text-gray-400 mb-1"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full bg-transparent border-b border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400 outline-none pb-2 transition"
                    placeholder=""
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm text-gray-400 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full bg-transparent border-b border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400 outline-none pb-2 resize-none transition"
                    placeholder=""
                  ></textarea>
                </div>

                {/* Submit Button */}
                <div className="flex justify-start">
                  <button
                    type="submit"
                    className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium py-3 px-8 rounded transition duration-200"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
