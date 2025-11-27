import React from "react";

const Addresses = () => {
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
              <h2 className="text-2xl font-semibold mb-6">YOUR ADDRESS</h2>
              <div className="text-2xl flex justify-center">
                <span className="text-gray-400 mr-1">HELLO </span>
                <p className="font-medium text-[#b6894b]">NHAT</p>
              </div>
              <div className="w-[200px] h-[200px] mx-auto">
                <img src="images/avatar.png" alt="avatar" />
              </div>
            </div>

            <div className="md:col-span-7">
              <button className="w-40 h-10 bg-yellow-600 hover:bg-yellow-700 text-black font-bold rounded uppercase">
                Add address
              </button>
              <form className="space-y-6 text-left pt-4">
                <div className="flex font-medium text-[16px] gap-4 bg-gray-600 rounded-lg p-4 text-white justify-between">
                  <div>
                    <p className="pb-2">Fullname: abc</p>
                    <p className="pb-2">Phone: 0856192874</p>
                    <p>
                      6 P. Lê Văn Thiêm, Thanh Xuân Trung, Thanh Xuân, Hà Nội
                    </p>
                  </div>
                  <button className="text-orange-500 hover:text-orange-400">
                    Update
                  </button>
                </div>
              </form>
              <form className="space-y-6 text-left pt-4">
                <div className="flex font-medium text-[16px] gap-4 bg-gray-600 rounded-lg p-4 text-white justify-between">
                  <div>
                    <p className="pb-2">Fullname: abc</p>
                    <p className="pb-2">Phone: 0856192874</p>
                    <p>
                      6 P. Lê Văn Thiêm, Thanh Xuân Trung, Thanh Xuân, Hà Nội
                    </p>
                  </div>
                  <button className="text-orange-500 hover:text-orange-400">
                    Update
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

export default Addresses;
