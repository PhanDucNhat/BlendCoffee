import React from "react";

const Checkout = () => {
  const subtotal = 20.6;
  const delivery = 0.0;
  const discount = 3.0;
  const total = subtotal + delivery - discount;
  return (
    <>
      <div
        className="relative h-[13vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/bg_2.jpg')",
        }}
      ></div>

      <div className="bg-black text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-gray-900 p-6 rounded-lg border border-gray-800">
              <h2 className="text-2xl font-bold uppercase mb-6">
                Billing Details
              </h2>

              <form className="space-y-6 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                  <div>
                    <label className="block text-sm mb-1">First Name</label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:border-white outline-none"
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Last Name</label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:border-white outline-none"
                      placeholder=""
                    />
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm mb-1">State / Country</label>
                  <select className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white appearance-none">
                    <option>France</option>
                    <option>USA</option>
                    <option>Vietnam</option>
                  </select>
                </div>

                {/* Street Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Street Address</label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500"
                      placeholder="House number and street name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">&nbsp;</label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500"
                      placeholder="Appartment, suite, unit etc. (optional)"
                    />
                  </div>
                </div>

                {/* Town / City & Postcode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Town / City</label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500"
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">
                      Postcode / ZIP *
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500"
                      placeholder=""
                    />
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Phone</label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500"
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Email Address</label>
                    <input
                      type="email"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500"
                      placeholder=""
                    />
                  </div>
                </div>

                {/* Checkbox Options */}
                <div className="flex flex-wrap items-center gap-20 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="option"
                      className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-sm whitespace-nowrap">
                      Create an Account?
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="option"
                      className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                      defaultChecked
                    />
                    <span className="text-sm whitespace-nowrap">
                      Ship to different address
                    </span>
                  </label>
                </div>
              </form>
            </div>

            <div className="space-y-8">
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-xl font-bold uppercase mb-4">Cart Total</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Delivery</span>
                    <span>${delivery.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Discount</span>
                    <span>${discount.toFixed(2)}</span>
                  </div>
                </div>
                <hr className="my-4 border-gray-700" />
                <div className="flex justify-between text-lg font-bold">
                  <span>TOTAL</span>
                  <span className="text-yellow-500">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-xl font-bold uppercase mb-4">
                  Payment Method
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      className="w-4 h-4 text-cyan-500"
                      defaultChecked
                    />
                    <span className="text-sm">Direct Bank Transfer</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      className="w-4 h-4 text-cyan-500"
                    />
                    <span className="text-sm">Check Payment</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      className="w-4 h-4 text-cyan-500"
                    />
                    <span className="text-sm">Paypal</span>
                  </label>
                </div>

                <label className="flex items-center gap-3 mt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-cyan-500"
                    defaultChecked
                  />
                  <span className="text-xs text-gray-300">
                    I have read and accept the terms and conditions
                  </span>
                </label>

                <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 rounded mt-6 uppercase">
                  Place an order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
