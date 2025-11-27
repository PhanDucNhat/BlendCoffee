import React, { useState } from "react";
import {
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Truck,
  Package,
  Clock,
  User,
  Phone,
  MapPin,
  CalendarCheck,
} from "lucide-react";

type OrderStatus = "delivered" | "shipped" | "processing" | "pending";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  deliveredAt: string | null;
}

interface PriceInfo {
  subtotal: number;
  shipping: number;
  discount: number;
  final: number;
}

interface Order {
  id: string;
  date: string;
  time: string;
  payment: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  shipping: ShippingInfo;
  price: PriceInfo;
}

const orders: Order[] = [
  {
    id: "DH2025041",
    date: "15/04/2025",
    time: "14:30",
    payment: "COD",
    total: 2250000,
    status: "delivered",
    items: [
      { name: "Tai nghe Gaming RGB Pro X", quantity: 1, price: 850000 },
      { name: "Chuột Logitech G502 Hero", quantity: 2, price: 700000 },
    ],
    shipping: {
      name: "Nguyễn Văn An",
      phone: "0901234567",
      address: "123 Đường Láng, Đống Đa, Hà Nội",
      deliveredAt: "17/04/2025 10:25",
    },
    price: { subtotal: 2250000, shipping: 35000, discount: 0, final: 2285000 },
  },
  {
    id: "DH2025038",
    date: "12/04/2025",
    time: "21:10",
    payment: "Chuyển khoản",
    total: 1890000,
    status: "shipped",
    items: [
      { name: "Bàn phím cơ Keychron K8 Pro", quantity: 1, price: 1890000 },
    ],
    shipping: {
      name: "Trần Thị Mai",
      phone: "0987654321",
      address: "56 Nguyễn Trãi, Thanh Xuân, Hà Nội",
      deliveredAt: null,
    },
    price: { subtotal: 1890000, shipping: 0, discount: 100000, final: 1790000 },
  },
  {
    id: "DH2025037",
    date: "12/04/2025",
    time: "09:45",
    payment: "Momo",
    total: 5880000,
    status: "processing",
    items: [
      { name: 'Màn hình LG UltraGear 27" 144Hz', quantity: 1, price: 5490000 },
      { name: "Giá đỡ màn hình North Bayou", quantity: 1, price: 390000 },
    ],
    shipping: {
      name: "Lê Văn Hùng",
      phone: "0912345678",
      address: "89 Lê Lợi, Quận 1, TP.HCM",
      deliveredAt: null,
    },
    price: {
      subtotal: 5880000,
      shipping: 45000,
      discount: 200000,
      final: 5925000,
    },
  },
];

const statusInfo = {
  delivered: { label: "Đã giao", icon: CheckCircle2, color: "text-green-400" },
  shipped: { label: "Đang giao", icon: Truck, color: "text-orange-400" },
  processing: { label: "Đang xử lý", icon: Package, color: "text-blue-400" },
  pending: { label: "Chờ xác nhận", icon: Clock, color: "text-gray-400" },
};

const f = (money: number) => money.toLocaleString("vi-VN") + "₫";

export default function OrderPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

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
              (group[order.date] = group[order.date] || []).push(order);
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
                  const status = statusInfo[order.status];
                  const Icon = status.icon;
                  const isOpen = openItem === order.id;

                  return (
                    <div
                      key={order.id}
                      className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden hover:border-yellow-600/60 transition-all"
                    >
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 text-sm">
                            <span className="font-bold text-yellow-400">
                              {order.id}
                            </span>
                            <span className="text-gray-50">{order.time}</span>
                            <span className="text-gray-100">
                              {order.items.length} sản phẩm
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {order.payment}
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
                              {f(order.total)}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setOpenItem(isOpen ? null : order.id)
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
                                <div className="w-10 h-10 bg-gray-800 rounded-lg" />
                                <div>
                                  <p className="text-xs">{item.name}</p>
                                  <p className="text-xs mt-1">
                                    SL: {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <p className="font-medium">{f(item.price)}</p>
                            </div>
                          ))}
                          <div className="pt-3 border-t border-gray-700 flex justify-end">
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
                Chi tiết đơn {detailOrder.id}
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
                    <User className="w-4 h-4" /> {detailOrder.shipping.name}
                  </div>
                  <div className="flex gap-3 text-white">
                    <Phone className="w-4 h-4" /> {detailOrder.shipping.phone}
                  </div>
                  <div className="flex gap-3 text-white">
                    <MapPin className="w-4 h-4" />{" "}
                    {detailOrder.shipping.address}
                  </div>
                  {detailOrder.shipping.deliveredAt && (
                    <div className="flex gap-3 text-green-400">
                      <CalendarCheck className="w-4 h-4" /> Đã giao:{" "}
                      {detailOrder.shipping.deliveredAt}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-yellow-500 mb-3">Sản phẩm</h3>
                {detailOrder.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-4 bg-gray-600 rounded-lg p-2 mb-3 text-white"
                  >
                    <div className="w-20 h-20 bg-white rounded-lg" />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-400">
                        Số lượng: {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-lg">{f(item.price)}</p>
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
                    <span>{f(detailOrder.price.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <span>
                      {detailOrder.price.shipping === 0
                        ? "Miễn phí"
                        : f(detailOrder.price.shipping)}
                    </span>
                  </div>
                  {detailOrder.price.discount > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Giảm giá</span>
                      <span>-{f(detailOrder.price.discount)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-700 flex justify-between text-lg font-bold text-yellow-400">
                    <span>Thành tiền</span>
                    <span>{f(detailOrder.price.final)}</span>
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
