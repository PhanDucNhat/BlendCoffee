import React from "react";

interface CoffeeItem {
  image: string;
  title: string;
  description: string;
  price: string;
}

const coffeeData: CoffeeItem[] = [
  {
    image: "/images/menu-1.jpg",
    title: "Coffee Capuccino",
    description: "A small river named Duden flows by their place and supplies",
    price: "$5.90",
  },
  {
    image: "/images/menu-2.jpg",
    title: "Coffee Capuccino",
    description: "A small river named Duden flows by their place and supplies",
    price: "$5.90",
  },
  {
    image: "/images/menu-3.jpg",
    title: "Coffee Capuccino",
    description: "A small river named Duden flows by their place and supplies",
    price: "$5.90",
  },
  {
    image: "/images/menu-4.jpg",
    title: "Coffee Capuccino",
    description: "A small river named Duden flows by their place and supplies",
    price: "$5.90",
  },
];

const Seller: React.FC = () => {
  return (
    <div className="w-full bg-[#0d0d0d] text-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Tiêu đề */}
        <div className="text-center mb-14">
          <span className="text-[#b6894b] italic text-2xl">Discover</span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-2 mb-4">
            BEST COFFEE SELLERS
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Far far away, behind the word mountains, far from the countries
            Vokalia and Consonantia, there live the blind texts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          {coffeeData.map((item, index) => (
            <div
              key={index}
              className="bg-[#141414] hover:scale-105 transition-transform duration-300"
            >
              <div
                className="h-64 bg-cover bg-center"
                style={{ backgroundImage: `url(${item.image})` }}
              ></div>
              <div className="text-center py-6 px-4">
                <h3 className="uppercase font-semibold text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                <p className="text-white font-semibold mb-3">{item.price}</p>
                <button className="border border-[#b6894b] text-[#b6894b] px-5 py-2 text-sm hover:bg-[#b6894b] hover:text-white transition">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Seller;
