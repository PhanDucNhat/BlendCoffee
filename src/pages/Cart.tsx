import React, { useEffect, useState } from "react";
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

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItemFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập để xem giỏ hàng!");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      } else if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");
        navigate("/login");
      } else {
        alert("Không thể tải giỏ hàng");
      }
    } catch (err) {
      console.error("Lỗi kết nối:", err);
      alert("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (cart_item_id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/cart/item/${cart_item_id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setCartItems((prev) =>
          prev.filter((item) => item.cart_item_id !== cart_item_id)
        );
      }
    } catch (err) {
      console.error("Lỗi xóa món:", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const delivery: number = 0;
  const discount: number = 0;
  const total = subtotal + delivery - discount;

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center text-2xl">
        Đang tải giỏ hàng...
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <div
          className="relative h-[13vh] bg-cover bg-center"
          style={{ backgroundImage: "url('/images/bg_2.jpg')" }}
        ></div>
        <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center text-3xl">
          <p>Giỏ hàng trống</p>
          <button
            onClick={() => navigate("/shop")}
            className="mt-6 bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-8 rounded uppercase"
          >
            Tiếp tục xem sản phẩm
          </button>
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

      <div className="bg-black text-white min-h-screen p-6 px-64">
        <div className="bg-yellow-600 bg-opacity-20 rounded-t-lg p-4 mb-4 hidden md:flex text-sm font-bold gap-4">
          <div className="w-8"></div>
          <div className="w-20"></div>
          <div className="flex-1 text-center">Sản phẩm</div>
          <div className="w-20 text-center">Size</div>
          <div className="w-20 text-center">Đơn giá</div>
          <div className="w-24 text-center">Số lượng</div>
          <div className="w-20 text-center">Thành tiền</div>
        </div>

        {cartItems.map((item) => (
          <div
            key={item.cart_item_id}
            className="bg-gray-900 rounded-lg p-4 mb-4 flex flex-col md:flex-row items-center gap-4"
          >
            <button
              onClick={() => removeItem(item.cart_item_id)}
              className="text-gray-400 hover:text-red-500 text-xl"
            >
              ×
            </button>

            <img
              src={item.image_url ? `${item.image_url}` : "/images/default.jpg"}
              alt={item.name}
              className="w-20 h-20 rounded-lg object-cover"
            />

            <div className="flex-1 md:text-left">
              <h3 className="font-bold uppercase text-sm pb-2">{item.name}</h3>
              <p className="text-xs text-gray-400">
                {item.description || "Không có mô tả"}
              </p>
            </div>

            <div className="w-20 text-center">{item.size}</div>

            <div className="w-20 text-center">
              {item.price ? Number(item.price).toFixed(3) : "0.000"}đ
            </div>

            <div className="w-24 text-center">
              <input
                type="text"
                value={item.quantity}
                readOnly
                className="w-12 bg-gray-800 text-center rounded border border-gray-700 py-1"
              />
            </div>

            <div className="w-20 text-center font-bold">
              {(item.price * item.quantity).toFixed(3)}đ
            </div>
          </div>
        ))}

        <div className="flex justify-end mt-8">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 w-full md:w-80">
            <h3 className="text-lg font-bold uppercase mb-4">
              Thanh toán tạm tính
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Thành tiền</span>
                <span>{subtotal.toFixed(3)}đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Vận chuyển</span>
                <span>
                  {delivery === 0 ? "Miễn phí" : `${delivery.toFixed(3)}đ`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Giảm giá</span>
                <span>{discount.toFixed(3)}đ</span>
              </div>
            </div>
            <hr className="my-4 border-gray-700" />
            <div className="flex justify-between text-lg font-bold">
              <span>Tổng tiền</span>
              <span className="text-yellow-500">{total.toFixed(3)}đ</span>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 rounded mt-4 uppercase transition"
            >
              Tiến hành thanh toán
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
