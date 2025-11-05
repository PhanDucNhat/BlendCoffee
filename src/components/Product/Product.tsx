import React, { useState } from "react";

interface Product {
  image: string;
  title: string;
  description: string;
  price: string;
}

const tabs = ["Main Dish", "Drinks", "Desserts"];

const data: Record<string, Product[]> = {
  "Main Dish": [
    {
      image: "/images/dish-1.jpg",
      title: "Grilled Beef",
      description:
        "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
      price: "$2.90",
    },
    {
      image: "/images/dish-2.jpg",
      title: "Grilled Beef",
      description:
        "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
      price: "$2.90",
    },
    {
      image: "/images/dish-3.jpg",
      title: "Grilled Beef",
      description:
        "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
      price: "$2.90",
    },
  ],
  Drinks: [
    {
      image: "/images/drink-1.jpg",
      title: "Lemonade Juice",
      description:
        "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
      price: "$2.90",
    },
    {
      image: "/images/drink-2.jpg",
      title: "Pineapple Juice",
      description:
        "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
      price: "$2.90",
    },
    {
      image: "/images/drink-3.jpg",
      title: "Soda Drinks",
      description:
        "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
      price: "$2.90",
    },
  ],
  Desserts: [
    {
      image: "/images/dessert-1.jpg",
      title: "Hot Cake Honey",
      description:
        "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
      price: "$2.90",
    },
    {
      image: "/images/dessert-2.jpg",
      title: "Hot Cake Honey",
      description:
        "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
      price: "$2.90",
    },
    {
      image: "/images/dessert-3.jpg",
      title: "Hot Cake Honey",
      description:
        "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
      price: "$2.90",
    },
  ],
};

const Product: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("Main Dish");

  return (
    <div className="w-full bg-[#0d0d0d] text-white pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-[#b6894b] italic text-2xl">Discover</span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-2 mb-4">
            OUR PRODUCTS
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Far far away, behind the word mountains, far from the countries
            Vokalia and Consonantia, there live the blind texts.
          </p>
        </div>

        <div className="flex justify-center space-x-6 mb-12 border-b border-[#b6894b]/30 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 pb-2 text-lg font-medium transition-colors ${
                activeTab === tab
                  ? "text-white border-b-2 border-[#b6894b]"
                  : "text-gray-400 hover:text-[#b6894b]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {data[activeTab].map((item, index) => (
            <div
              key={index}
              className="text-center bg-[#141414] hover:scale-105 transition-transform duration-300 pb-4"
            >
              <div
                className="h-64 bg-cover bg-center mb-6"
                style={{ backgroundImage: `url(${item.image})` }}
              ></div>
              <h3 className="uppercase font-semibold text-lg mb-2">
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm mb-3">{item.description}</p>
              <p className="text-white font-semibold mb-3">{item.price}</p>
              <button className="border border-[#b6894b] text-[#b6894b] px-5 py-2 text-sm hover:bg-[#b6894b] hover:text-white transition">
                Add to cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Product;
