import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface voucherItem {
  voucher_id: number;
  title: string;
  description?: string | null;
  image_url: string;
  quantity: number;
  start_date: string | Date;
  end_date: string | Date;
  status: number;
  discount_type: string;
  discount_value?: number;
}

const Voucher: React.FC = () => {
  const [voucherItems, setVoucherItems] = useState<voucherItem[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<voucherItem | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/voucher");
        if (!response.ok) throw new Error("Lỗi khi lấy dữ liệu voucher");

        const data: voucherItem[] = await response.json();

        const filterVoucher = data
          .filter((voucher) => voucher.status === 1)
          .sort(
            (a, b) =>
              new Date(b.start_date).getTime() -
              new Date(a.start_date).getTime()
          )
          .slice(0, 4);

        setVoucherItems(filterVoucher);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu voucher", error);
      }
    };

    fetchVoucher();
  }, []);

  const openDetail = (voucher: voucherItem) => {
    setSelectedVoucher(voucher);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVoucher(null);
  };

  return (
    <>
      <div className="w-full bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-3 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {voucherItems.map((voucher, index) => (
              <div
                key={index}
                className="flex gap-2 bg-[#504f4f] rounded-lg p-2 py-3 mb-3 text-white shadow-lg"
              >
                <div
                  className="w-24 h-24 bg-cover bg-center rounded-lg"
                  style={{ backgroundImage: `url(${voucher.image_url})` }}
                ></div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-sm">
                      NHẬP MÃ: {voucher.title}
                    </p>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                      {voucher.description || "Không có mô tả"}
                    </p>
                  </div>
                  <div className="flex mt-2 justify-between items-end">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(voucher.title);
                        alert("Đã sao chép mã: " + voucher.title);
                      }}
                      className="bg-[#B6894B] px-3 py-1 rounded-full text-xs font-medium hover:bg-orange-400 transition"
                    >
                      Sao chép mã
                    </button>
                    <button
                      onClick={() => openDetail(voucher)}
                      className="text-xs underline text-orange-300 hover:text-orange-100 transition"
                    >
                      Điều kiện
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="relative w-full max-w-2xl">
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-2xl font-bold text-gray-900">
                  Chi tiết Voucher
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-2 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-gray-50">
                <div className="flex justify-center">
                  <div
                    className="w-48 max-w-sm h-48 bg-cover bg-center rounded-xl shadow-md border border-gray-200"
                    style={{
                      backgroundImage: `url(${selectedVoucher.image_url})`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="flex">
                    <label className="block text-sm font-semibold text-gray-700 pt-1">
                      Mã Voucher:
                    </label>
                    <span className="text-lg font-mono font-bold text-cyan-600 pl-2">
                      {selectedVoucher.title}
                    </span>
                  </div>

                  <div className="flex">
                    <label className="block text-sm font-semibold text-gray-700 pt-1">
                      Số lượng còn lại:
                    </label>
                    <p
                      className={`text-lg font-bold pl-2 ${
                        selectedVoucher.quantity > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedVoucher.quantity} mã
                    </p>
                  </div>
                </div>

                {selectedVoucher.description && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mô tả / Ưu đãi:
                    </label>
                    <p className="text-gray-800 bg-white p-3 rounded-lg border border-gray-200">
                      - {selectedVoucher.description}
                      <br></br>- Áp dụng cho phương thức thanh toán{" "}
                      {selectedVoucher.discount_type}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Ngày bắt đầu
                    </label>
                    <p className="text-gray-900 font-medium">
                      {new Date(selectedVoucher.start_date).toLocaleDateString(
                        "vi-VN",
                        {
                          weekday: "long",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Ngày kết thúc
                    </label>
                    <p className="text-gray-900 font-medium">
                      {new Date(selectedVoucher.end_date).toLocaleDateString(
                        "vi-VN",
                        {
                          weekday: "long",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
                {new Date(selectedVoucher.end_date) < new Date() && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-center font-medium">
                    Voucher đã hết hạn
                  </div>
                )}
                {selectedVoucher.quantity === 0 && (
                  <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-lg text-center font-medium">
                    Voucher đã hết số lượng
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 p-2 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedVoucher.title);
                    alert("Đã sao chép mã: " + selectedVoucher.title);
                  }}
                  className="px-6 py-2.5 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition shadow-md"
                >
                  Sao chép mã
                </button>
                <button
                  onClick={closeModal}
                  className="px-6 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Voucher;
