import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface OrderItem {
  name: string;
  image_url: string | null;
  size: "Small" | "Medium" | "Large";
  quantity: number;
  price: number;
  item_price: number | null;
}

interface OrderDetail {
  order_id: number;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: "cash" | "bank_transfer";
  status: "pending" | "processing" | "completed" | "canceled";
  created_at: string;
  voucher_code: string | null;
  txn_ref: string | null;
  fullname: string;
  phone: string;
  note: string | null;
  address: string;
  ward: string | null;
  district: string | null;
  city: string | null;
  items: OrderItem[];
}

interface ApiErrorResponse {
  message?: string;
}

const statusInfo = {
  completed: { label: "Đã giao", className: "bg-green-600 text-white" },
  processing: { label: "Đang giao", className: "bg-blue-600 text-white" },
  pending: { label: "Chờ xác nhận", className: "bg-yellow-600 text-black" },
  canceled: { label: "Đã hủy", className: "bg-red-600 text-white" },
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const token = localStorage.getItem("token");
      if (!token || !id) {
        setError("Không tìm thấy thông tin đơn hàng");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errData = (await response.json()) as ApiErrorResponse;
          throw new Error(errData.message || "Không thể tải đơn hàng");
        }

        const data = (await response.json()) as OrderDetail;
        setOrder(data);
      } catch (err: unknown) {
        let errorMessage = "Có lỗi xảy ra khi tải thông tin";

        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === "string") {
          errorMessage = err;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const delivery_fee: number = 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-2xl animate-pulse">
          Đang tải thông tin đơn hàng...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold mb-4 text-red-500">Lỗi</h1>
        <p className="text-xl mb-8 text-center">
          {error || "Không tìm thấy đơn hàng"}
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-10 rounded uppercase transition"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  const getPaymentStatus = () => {
    if (order.payment_method === "cash") {
      return {
        text: "Thanh toán khi nhận hàng (COD)",
        color: "text-yellow-400",
      };
    }
    return {
      text: "Thanh toán qua VNPay",
      color: "text-green-400",
    };
  };

  const paymentStatus = getPaymentStatus();

  const getStatusInfo = () => {
    return (
      statusInfo[order.status] || {
        label: "Không xác định",
        className: "bg-gray-600 text-white",
      }
    );
  };

  const fullAddress = [order.address, order.ward, order.district, order.city]
    .filter((s) => s && s.trim())
    .join(", ");

  return (
    <>
      <div
        className="relative h-[11vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/bg_2.jpg')",
        }}
      ></div>
      <div className=" bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-wide">
              Đơn hàng #DH{order.order_id.toString().padStart(6, "0")}
            </h1>
            <p className="text-lg text-gray-400 mt-3">
              Ngày đặt: {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-gray-900 p-6 md:p-8 rounded-xl border border-gray-800 shadow-xl">
                <h2 className="text-xl font-bold mb-6 border-b border-gray-700 pb-4">
                  Sản phẩm đã đặt
                </h2>

                <div className="space-y-6">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row gap-4 pb-6 border-b border-gray-700 last:border-0 last:pb-0"
                    >
                      <img
                        src={item.image_url || "/images/default.jpg"}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0 mx-auto sm:mx-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg md:text-xl">
                          {item.name}
                        </h3>
                        <p className="text-gray-400 text-sm md:text-base mt-1">
                          Size: <span className="font-medium">{item.size}</span>{" "}
                          × <span className="font-medium">{item.quantity}</span>
                        </p>
                      </div>
                      <div className="text-right font-bold text-lg md:text-xl whitespace-nowrap">
                        {(item.price * item.quantity).toFixed(3)}đ
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 p-6 md:p-8 rounded-xl border border-gray-800 shadow-xl">
                <h3 className="text-xl font-bold mb-6 border-b border-gray-700 pb-4">
                  Thông tin giao hàng
                </h3>

                <div className="space-y-4 text-sm md:text-base">
                  <p>
                    <strong>Người nhận:</strong> {order.fullname}
                  </p>
                  <p>
                    <strong>SĐT:</strong> {order.phone}
                  </p>
                  <p>
                    <strong>Địa chỉ: </strong>
                    {fullAddress}
                  </p>
                  {order.note && (
                    <p>
                      <strong>Ghi chú:</strong>{" "}
                      <span className="text-gray-300">{order.note}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
                <h3 className="text-xl font-bold mb-3">Trạng thái đơn hàng</h3>
                <div className="space-y-4 text-sm md:text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">
                      Phương thức thanh toán
                    </span>
                    <span className={`font-medium ${paymentStatus.color}`}>
                      {paymentStatus.text}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Trạng thái</span>
                    <span
                      className={`px-4 py-1 rounded-full text-xs md:text-sm font-bold ${
                        getStatusInfo().className
                      }`}
                    >
                      {getStatusInfo().label}
                    </span>
                  </div>
                  {order.voucher_code && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Voucher</span>
                      <span className="text-green-400 font-medium">
                        {order.voucher_code}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
                <h3 className="text-xl font-bold mb-3">Tổng tiền</h3>
                <div className="space-y-4 text-sm md:text-base">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Thành tiền</span>
                    <span>{order.subtotal}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phí vận chuyển</span>
                    <span>
                      {delivery_fee === 0
                        ? "Miễn phí"
                        : `${delivery_fee.toFixed(3)}đ`}
                    </span>
                  </div>
                  {(order.discount ? Number(order.discount) : 0) > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Giảm giá (voucher)</span>
                      <span>-{order.discount}đ</span>
                    </div>
                  )}
                  <hr className="my-4 border-gray-700" />
                  <div className="flex justify-between text-xl md:text-2xl font-bold">
                    <span>TỔNG CỘNG</span>
                    <span className="text-yellow-500">{order.total}đ</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => navigate("/shop")}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-4 rounded-lg uppercase transition shadow-md"
                >
                  Tiếp tục mua sắm
                </button>
                <button
                  onClick={() => navigate("/order")}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg uppercase transition"
                >
                  Xem tất cả đơn hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetail;
