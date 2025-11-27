import React, { useState, useEffect } from "react";
import {
  getProvinces,
  Province,
  District,
  Ward,
} from "../../backend/src/data/vietnam";
import { useNavigate } from "react-router-dom";

interface CartItemFromAPI {
  cart_item_id: number;
  menu_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  size: "Small" | "Medium" | "Large";
  price: number;
  quantity: number;
}

const Checkout: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItemFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [province, setProvince] = useState<Province | null>(null);
  const [district, setDistrict] = useState<District | null>(null);

  const navigate = useNavigate();

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const delivery = 0.0;
  const discount = 0.0;
  const total = subtotal + delivery - discount;

  const fetchCart = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Không thể tải giỏ hàng");
      }

      const data: CartItemFromAPI[] = await response.json();
      setCartItems(data);
    } catch (err) {
      console.error("Lỗi tải giỏ hàng:", err);
      alert("Không thể tải thông tin giỏ hàng. Vui lòng thử lại!");
      navigate("/cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();

    getProvinces()
      .then((data) => setProvinces(data))
      .catch((err) => {
        console.error("Lỗi tải tỉnh/thành:", err);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center text-2xl">
        Đang tải thông tin thanh toán...
      </div>
    );
  }

  return (
    <>
      <div
        className="relative h-[11vh] bg-cover bg-center flex items-center justify-center"
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
                    <label className="block text-sm mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:border-white outline-none"
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Phone</label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:border-white outline-none"
                      placeholder=""
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Province</label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white appearance-none"
                      value={province?.Id ?? ""}
                      onChange={(e) => {
                        const selected =
                          provinces.find((p) => p.Id === e.target.value) ||
                          null;
                        setProvince(selected);
                        setDistrict(null);
                      }}
                      disabled={loading}
                    >
                      <option value="">
                        {loading
                          ? "Đang tải..."
                          : "--- Chọn tỉnh/thành phố ---"}
                      </option>
                      {provinces.map((p) => (
                        <option key={p.Id} value={p.Id}>
                          {p.Name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">
                      District (optional)
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white appearance-none"
                      value={district?.Id ?? ""}
                      onChange={(e) => {
                        const selected =
                          province?.Districts.find(
                            (d) => d.Id === e.target.value
                          ) || null;
                        setDistrict(selected);
                      }}
                      disabled={!province}
                    >
                      <option value="">--- Chọn quận/huyện ---</option>
                      {province?.Districts.map((d) => (
                        <option key={d.Id} value={d.Id}>
                          {d.Name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">
                      Ward/commune (optional)
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white appearance-none"
                      disabled={!district}
                    >
                      <option value="">--- Chọn xã/phường ---</option>
                      {district?.Wards.map((w: Ward) => (
                        <option key={w.Id} value={w.Id}>
                          {w.Name}
                          {w.Level &&
                            ` (${w.Level.replace("Ward", "Phường")
                              .replace("Commune", "Xã")
                              .replace("Town", "Thị trấn")})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">
                      Address (optional)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500"
                      placeholder="Số nhà, đường..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Note</label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500"
                      placeholder=""
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-4">
                  <input type="checkbox" className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs text-gray-300">
                    Add to register address
                  </span>
                </div>
              </form>
            </div>
            <div className="space-y-8">
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-xl font-bold uppercase mb-4">Cart Total</h3>
                <hr className="my-4 border-gray-700" />
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.cart_item_id}
                      className="flex gap-4 pb-4 border-b border-gray-800 last:border-0"
                    >
                      <img
                        src={
                          item.image_url
                            ? `/${item.image_url}`
                            : "/images/default.jpg"
                        }
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {item.name}
                        </h4>
                        <div className="text-xs text-gray-400 space-y-1 mt-1">
                          <span>Size: {item.size}</span>
                          <span> x{item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right font-medium whitespace-nowrap">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <hr className="mb-3 border-gray-700" />
                <div className="flex gap-3">
                  <input
                    type="text"
                    className="w-full h-10 bg-gray-800 border border-gray-700 rounded-md px-4 text-white placeholder-gray-500"
                    placeholder="Nhập mã voucher"
                  />
                  <button className="w-full h-10 bg-yellow-600 hover:bg-yellow-700 text-black font-bold rounded uppercase">
                    Áp dụng
                  </button>
                </div>
                <hr className="my-4 border-gray-700" />
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
                    <span className="text-sm">Cash on Delivery (COD)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      className="w-4 h-4 text-cyan-500"
                    />
                    <span className="text-sm">VNPay</span>
                  </label>
                </div>

                <label className="flex items-center gap-3 mt-6 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-cyan-500" />
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
