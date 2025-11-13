import React from "react";
import { useNavigate } from "react-router-dom";

interface CartItem {
  id: number;
  name: string;
  description: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

const cartItems: CartItem[] = [
  {
    id: 1,
    name: "CREAMY LATTE COFFEE",
    description:
      "Far far away, behind the word mountains, far from the countries",
    size: "M",
    price: 4.9,
    quantity: 1,
    image: "/images/menu-2.jpg",
  },
  {
    id: 2,
    name: "GRILLED RIBS BEEF",
    description:
      "Far far away, behind the word mountains, far from the countries",
    size: "L",
    price: 16.7,
    quantity: 1,
    image: "/images/dish-2.jpg",
  },
];

const Cart: React.FC = () => {
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate("/checkout");
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
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
      <div className="bg-black text-white min-h-screen p-6 px-[300px]">
        <div className="bg-yellow-600 bg-opacity-20 rounded-t-lg p-4 mb-4 hidden md:flex text-sm font-bold">
          <div className="w-12"></div>
          <div className="w-20"></div>
          <div className="flex-1 pr-10">Product</div>
          <div className="pr-[72px]">Size</div>
          <div className="w-20 text-center pr-[105px]">Price</div>
          <div className="w-24 text-center pr-24">Quantity</div>
          <div className="w-20 text-center">Total</div>
        </div>

        {cartItems.map((item) => (
          <div
            key={item.id}
            className="bg-gray-900 rounded-lg p-4 mb-4 flex flex-col md:flex-row items-center gap-4"
          >
            <button className="text-gray-400 hover:text-red-500 text-xl">
              ×
            </button>
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-bold uppercase text-sm">{item.name}</h3>
              <p className="text-xs text-gray-400">{item.description}</p>
            </div>
            <div className="w-20 text-center">{item.size}</div>
            <div className="w-20 text-center">${item.price.toFixed(2)}</div>
            <div className="w-24">
              <input
                type="text"
                value={item.quantity}
                readOnly
                className="w-12 bg-gray-800 text-center rounded border border-gray-700 py-1"
              />
            </div>
            <div className="w-20 text-center font-bold">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}

        <div className="flex justify-end mt-8">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 w-full md:w-80">
            <h3 className="text-lg font-bold uppercase mb-4">Cart Totals</h3>

            <div className="space-y-2 text-sm">
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
              <span>Total</span>
              <span className="text-yellow-500">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 rounded mt-4 uppercase"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
