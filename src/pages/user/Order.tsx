import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Truck,
  Clock,
  User,
  Phone,
  MapPin,
  CircleX,
} from "lucide-react";

type OrderStatus = "pending" | "processing" | "completed" | "canceled";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
  image_url: string;
}

interface Order {
  order_id: number;
  total: number;
  payment_method: "cash" | "bank_transfer";
  status: OrderStatus;
  created_at: string;
  delivery_fee: number | null;
  discount: number | null;
  fullname: string;
  phone: string;
  full_address: string;
  voucher_code?: string;
  items: OrderItem[];
}

const statusInfo = {
  completed: { label: "Đã giao", icon: CheckCircle2, color: "text-green-400" },
  processing: { label: "Đang giao", icon: Truck, color: "text-orange-400" },
  pending: { label: "Chờ xác nhận", icon: Clock, color: "text-yellow-400" },
  canceled: { label: "Đã hủy", icon: CircleX, color: "text-red-400" },
};

export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItem, setOpenItem] = useState<number | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data as Order[]);
      } catch (err) {
        console.error("Lỗi tải đơn hàng:", err);
        alert("Không thể tải đơn hàng. Vui lòng đăng nhập lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const vnpResponseCode = searchParams.get("vnp_ResponseCode");
    const success = searchParams.get("success");
    const orderId = searchParams.get("order_id");

    if (vnpResponseCode === "00" && orderId) {
      alert(
        `Thanh toán thành công!\nĐơn hàng #${orderId
          .toString()
          .padStart(6, "0")} đã được xác nhận và đang được xử lý.`
      );
      navigate(`/order?order_id=${orderId}`, { replace: true });
    } else if (success === "true" && orderId) {
      alert(
        `Thanh toán thành công!\nĐơn hàng DH${orderId} đã được xác nhận và đang được xử lý.`
      );
      navigate(`/order?order_id=${orderId}`, { replace: true });
    } else if (success === "false") {
      alert("Thanh toán không thành công. Vui lòng kiểm tra lại.");
    }
  }, [searchParams, navigate]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN");
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      return false;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return false;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/orders/${orderId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === orderId ? { ...o, status: "canceled" as const } : o
        )
      );

      if (detailOrder?.order_id === orderId) {
        setDetailOrder((prev) =>
          prev ? { ...prev, status: "canceled" as const } : null
        );
      }

      alert("Đã hủy đơn hàng thành công!");
      return true;
    } catch (err) {
      console.error("Lỗi tải giỏ hàng:", err);
      alert("Không thể tải thông tin giỏ hàng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Đang tải đơn hàng...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <>
        <div
          className="relative h-[11vh] bg-cover bg-center"
          style={{ backgroundImage: "url('/images/bg_2.jpg')" }}
        ></div>
        <div className="bg-black min-h-screen text-white px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-yellow-500 mb-4">
              Chưa có đơn hàng nào
            </h2>
            <p className="text-gray-400">
              Khi bạn đặt hàng, chúng sẽ xuất hiện ở đây.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="relative h-[11vh] bg-cover bg-center"
        style={{ backgroundImage: "url('/images/bg_2.jpg')" }}
      ></div>
      <div className="bg-black text-white py-8 px-6 lg:px-[300px]">
        <div className="max-w-4xl mx-auto space-y-6">
          {Object.entries(
            orders.reduce((group, order) => {
              const dateKey = formatDate(order.created_at);
              (group[dateKey] = group[dateKey] || []).push(order);
              return group;
            }, {} as Record<string, Order[]>)
          )
            .sort(
              ([a], [b]) =>
                new Date(b.split("/").reverse().join("-")).getTime() -
                new Date(a.split("/").reverse().join("-")).getTime()
            )
            .map(([date, list]) => (
              <div key={date} className="space-y-4">
                <div className="text-sm font-bold text-yellow-500 pl-1">
                  {date} - {list.length} đơn
                </div>

                {list.map((order) => {
                  const status = statusInfo[order.status] || statusInfo.pending;
                  const Icon = status.icon;
                  const isOpen = openItem === order.order_id;

                  return (
                    <div
                      key={order.order_id}
                      className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden hover:border-yellow-600/60 transition-all"
                    >
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 text-sm">
                            <span className="font-bold text-yellow-400">
                              DH{order.order_id.toString().padStart(6, "0")}
                            </span>
                            <span className="text-gray-50">
                              {formatTime(order.created_at)}
                            </span>
                            <span className="text-gray-100">
                              {order.items.length} sản phẩm
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {order.payment_method === "cash"
                              ? "Thanh toán khi nhận hàng (COD)"
                              : "Thanh toán qua VNPay"}
                          </div>
                        </div>

                        <div className="flex items-center gap-5">
                          <div
                            className={`flex items-center gap-2 ${status.color}`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              {status.label}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-yellow-400">
                              {order.total}đ
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setOpenItem(isOpen ? null : order.order_id)
                            }
                            className="p-2 hover:bg-gray-800 rounded-lg"
                          >
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      {isOpen && (
                        <div className="border-t border-gray-800 bg-gray-950/50 px-5 py-4 space-y-3">
                          {order.items.map((item, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-3 text-white">
                                <img
                                  src={
                                    item.image_url || "/images/placeholder.jpg"
                                  }
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-cover bg-gray-800"
                                />
                                <div className="flex">
                                  <div>
                                    <p className="text-sm">{item.name}</p>
                                    {item.size && (
                                      <div className="text-xs text-white flex">
                                        Size:
                                        <p className="text-gray-400 px-2">
                                          {item.size}
                                        </p>
                                        x{item.quantity}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className="font-medium">
                                {item.price.toFixed(3)}đ
                              </p>
                            </div>
                          ))}
                          <div className="pt-3 border-t border-gray-700 flex justify-end">
                            {order.status === "pending" ? (
                              <button
                                onClick={() =>
                                  handleCancelOrder(order.order_id)
                                }
                                className="text-red-500 pr-4 underline hover:text-red-400 transition"
                              >
                                Hủy đơn
                              </button>
                            ) : (
                              <span className="text-gray-500 pr-4">
                                Hủy đơn
                              </span>
                            )}

                            <button
                              onClick={() => setDetailOrder(order)}
                              className="text-xs text-yellow-400 hover:text-yellow-300 font-medium flex items-center gap-1 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      </div>
      {detailOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-2 flex justify-between items-center">
              <h2 className="text-xl font-bold text-yellow-400">
                Chi tiết đơn DH
                {detailOrder.order_id.toString().padStart(6, "0")}
              </h2>
              <button
                onClick={() => setDetailOrder(null)}
                className="p-2 hover:bg-gray-500 rounded-lg"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-850 rounded-xl p-1">
                <h3 className="font-bold text-yellow-500 mb-3">
                  Thông tin nhận hàng
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3 text-white">
                    <User className="w-4 h-4" /> {detailOrder.fullname}
                  </div>
                  <div className="flex gap-3 text-white">
                    <Phone className="w-4 h-4" /> {detailOrder.phone}
                  </div>
                  <div className="flex gap-3 text-white">
                    <MapPin className="w-4 h-4" /> {detailOrder.full_address}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-yellow-500 mb-3">Sản phẩm</h3>
                {detailOrder.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-4 bg-gray-600 rounded-lg p-2 mb-3 text-white"
                  >
                    <img
                      src={item.image_url || "/images/placeholder.jpg"}
                      alt=""
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.size && (
                        <p className="text-sm text-gray-400">
                          Size: {item.size}
                        </p>
                      )}
                      <p className="text-sm text-gray-400">
                        Số lượng: {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-lg">
                      {item.price.toFixed(3)}đ
                    </p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-850 rounded-xl p-1">
                <h3 className="font-bold text-yellow-500 mb-3">
                  Chi tiết thanh toán
                </h3>
                <div className="space-y-2 text-sm text-white">
                  <div className="flex justify-between">
                    <span>Tổng tiền hàng</span>
                    <span>
                      {detailOrder.items
                        .reduce((sum, item) => sum + item.price, 0)
                        .toFixed(3)}
                      đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <span>
                      {(detailOrder.delivery_fee || 0) === 0
                        ? "Miễn phí"
                        : detailOrder.delivery_fee!}
                      đ
                    </span>
                  </div>
                  {detailOrder.discount && detailOrder.discount > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>
                        Giảm giá{" "}
                        {detailOrder.voucher_code &&
                          `(${detailOrder.voucher_code})`}
                      </span>
                      <span>-{detailOrder.discount}đ</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-700 flex justify-between text-lg font-bold text-yellow-400">
                    <span>Thành tiền</span>
                    <span>{detailOrder.total}đ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
