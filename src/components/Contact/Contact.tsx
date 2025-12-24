import React from "react";

const Contact: React.FC = () => {
  return (
    <div className="relative w-full bg-[#1a1a1a] text-white pb-8">
      <div className="max-w-full mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end gap-10">
          <div className="flex-1 text-left ml-4 md:ml-20 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-2">
              <div className="flex items-start space-x-4">
                <div className="text-[#b6894b] text-xl">
                  <i className="fa fa-phone" />
                </div>
                <div className="w-full md:w-60">
                  <h3 className="text-lg font-semibold">000 (123) 456 7890</h3>
                  <p className="text-gray-300 text-sm">Giao hàng tận nơi</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="text-[#b6894b] text-xl">
                  <i className="fa-solid fa-location-dot" />
                </div>
                <div className="w-full md:w-60">
                  <h3 className="text-lg font-semibold">
                    Số 6 đường Lê Văn Thiêm
                  </h3>
                  <p className="text-gray-300 text-sm">
                    phường Thanh Xuân Trung, quận Thanh Xuân, TP. Hà Nội
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="text-[#b6894b] text-xl">
                  <i className="fa-solid fa-clock" />
                </div>
                <div className="w-full md:w-60">
                  <h3 className="text-lg font-semibold">Mở cửa: Cả tuần</h3>
                  <p className="text-gray-300 text-sm">8:00am - 9:00pm</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute right-1 -top-[227px]">
            <img
              src="images/bg_5.jpg"
              alt="Book a Table"
              className="w-full h-[350px] object-cover"
            />
            <div className="absolute inset-0 bg-opacity-40 flex flex-col items-center text-center p-6">
              <h3 className="text-3xl font-bold text-white mb-2">
                Đặt bàn ngay hôm nay
              </h3>
              <p className="text-gray-200 text-sm max-w-md">
                Chúc bạn có trải nghiệm tuyệt vời tại quán chúng tôi.
                <br />
                (Gọi điện hoặc đến trực tiếp để đặt bàn.)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
