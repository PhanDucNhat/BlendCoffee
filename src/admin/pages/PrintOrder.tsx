import React from "react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
}

interface Order {
  order_id: number;
  user_id: number;
  username: string;
  email?: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: "cash" | "bank_transfer";
  status: string;
  created_at: string;
  fullname: string;
  phone: string;
  full_address: string;
  voucher_code?: string | null;
  items: OrderItem[];
}

interface PrintOrderProps {
  order?: Order | null;
}

const printOrder: React.FC<PrintOrderProps> = ({ order }) => {
  console.log("PrintOrder - order data:", order);
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getAdminInfo = () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as {
          id?: number;
          username?: string;
        };
        return parsed?.username || "Admin";
      }
    } catch (err) {
      console.error("Không thể đọc thông tin admin:", err);
    }
    return "Admin";
  };

  const orderId = order?.order_id
    ? `#DH${order.order_id.toString().padStart(6, "0")}`
    : "#DH000000";
  const customerName = order?.fullname || "";
  const customerAddress = order?.full_address || "";
  const customerPhone = order?.phone || "";
  const customerEmail = order?.email || "";
  const orderDate = order?.created_at
    ? formatDateTime(order.created_at)
    : formatDateTime(new Date().toISOString());
  const subtotal = order?.subtotal || 0;
  const deliveryFee = order?.delivery_fee || 0;
  const discount = order?.discount || 0;
  const total = order?.total || 0;
  const items = order?.items || [];
  const adminName = getAdminInfo();

  return (
    <>
      <div className="p-4 text-black">
        <div className="text-center w-full mx-auto my-2">
          <div className="text-4xl font-bold uppercase flex flex-col">
            COFFEE
            <span className="text-lg font-light tracking-[0.25em]">BLEND</span>
          </div>
        </div>
        <hr className="border-gray-600 max-w-full border-2 border-dashed" />
        <div>
          <div className="text-sm py-2">
            <p>Cửa hàng: Địa điểm mặc định</p>
            <p>
              Địa chỉ: Số 6 Lê Văn Thiêm, Phường Thanh Xuân Trung, Quận Thanh
              Xuân, Hà Nội
            </p>
            <p>Số điện thoại: 0856192874</p>
            <p>Website: http://localhost:5173/</p>
            <p>Nhân viên: {adminName}</p>
            <p>Ngày in hóa đơn: {orderDate}</p>
          </div>
        </div>
        <div className="pt-3">
          <div className="text-lg font-bold  text-center">
            <p>Hóa đơn: {orderId}</p>
            <img
              src="/././images/code.png"
              alt="code"
              className="w-auto h-12 mx-auto"
            />
          </div>
          <div>
            <div className="text-sm py-3">
              <p className="font-bold pb-1">
                Khách hàng:{" "}
                <span className="pl-1 font-normal">{customerName}</span>
              </p>
              <p className="font-bold pb-1">
                Địa chỉ:{" "}
                <span className="pl-1 font-normal">{customerAddress}</span>
              </p>
              <p className="font-bold pb-1">
                SĐT: <span className="pl-1 font-normal">{customerPhone}</span>
              </p>
              {customerEmail && (
                <p className="font-bold pb-1">
                  Email:{" "}
                  <span className="pl-1 font-normal">{customerEmail}</span>
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Sản phẩm
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Số lượng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-400">
                  {items.map((item, index) => {
                    const totalPrice = item.price * item.quantity;
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium text-gray-900">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.price.toFixed(3)}đ
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.size}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {totalPrice.toFixed(3)}đ
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-3">
              <div className="lg:col-span-8"></div>
              <div className="lg:col-span-4">
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-1 max-w-xs ml-auto">
                    <span className="text-black text-right">Thành tiền:</span>
                    <span className="text-right">{subtotal.toFixed(3)}đ</span>
                    <span className="text-black text-right">Vận chuyển:</span>
                    <span className="text-right">
                      {deliveryFee === 0
                        ? "Miễn phí"
                        : `${deliveryFee.toFixed(3)}đ`}
                    </span>
                    <span className="text-black text-right">Giảm giá:</span>
                    <span className="text-right">
                      {discount === 0 ? "0đ" : `-${discount.toFixed(3)}đ`}
                    </span>
                  </div>
                  <hr className="border-gray-600 max-w-80 ml-auto" />
                  <div className="grid grid-cols-2 max-w-xs ml-auto text-lg font-bold">
                    <span className="text-right">Tổng tiền:</span>
                    <span className="text-right drop-shadow glow">
                      {total.toFixed(3)}đ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <hr className="border-gray-600 max-w-full border-2 border-dashed" />
        <div className="text-center pt-4">
          <p className="text-xl font-bold italic">Thank You!</p>
        </div>
      </div>
    </>
  );
};

export default printOrder;
