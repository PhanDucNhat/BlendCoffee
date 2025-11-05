import React, { useState } from "react";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

interface Tab {
  id: number;
  label: string;
  items: MenuItem[];
}

const tabs: Tab[] = [
  {
    id: 0,
    label: "Coffee",
    items: [
      {
        id: 1,
        name: "COFFEE CAPUCCINO",
        description:
          "A small river named Duden flows by their place and supplies",
        price: 5.9,
        image: "/images/menu-1.jpg",
      },
      {
        id: 2,
        name: "COFFEE CAPUCCINO",
        description:
          "A small river named Duden flows by their place and supplies",
        price: 5.9,
        image: "/images/menu-2.jpg",
      },
      {
        id: 3,
        name: "COFFEE CAPUCCINO",
        description:
          "A small river named Duden flows by their place and supplies",
        price: 5.9,
        image: "/images/menu-3.jpg",
      },
      {
        id: 4,
        name: "COFFEE CAPUCCINO",
        description:
          "A small river named Duden flows by their place and supplies",
        price: 5.9,
        image: "/images/menu-4.jpg",
      },
    ],
  },
  {
    id: 1,
    label: "Main Dish",
    items: [
      {
        id: 5,
        name: "GRILLED BEEF",
        description:
          "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
        price: 2.9,
        image: "/images/dish-1.jpg",
      },
      {
        id: 6,
        name: "GRILLED BEEF",
        description:
          "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
        price: 2.9,
        image: "/images/dish-2.jpg",
      },
      {
        id: 7,
        name: "GRILLED BEEF",
        description:
          "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
        price: 2.9,
        image: "/images/dish-3.jpg",
      },
      {
        id: 8,
        name: "GRILLED BEEF",
        description:
          "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
        price: 2.9,
        image: "/images/dish-4.jpg",
      },
    ],
  },
  {
    id: 2,
    label: "Drinks",
    items: [
      {
        id: 9,
        name: "LEMONADE JUICE",
        description:
          "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
        price: 2.9,
        image: "/images/drink-1.jpg",
      },
      {
        id: 10,
        name: "PINEAPPLE JUICE",
        description:
          "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
        price: 2.9,
        image: "/images/drink-2.jpg",
      },
      {
        id: 11,
        name: "SODA DRINKS",
        description:
          "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
        price: 2.9,
        image: "/images/drink-3.jpg",
      },
      {
        id: 12,
        name: "LEMONADE JUICE",
        description:
          "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
        price: 2.9,
        image: "/images/drink-4.jpg",
      },
    ],
  },
  {
    id: 3,
    label: "Desserts",
    items: [
      {
        id: 13,
        name: "HOT CAKE HONEY",
        description:
          "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
        price: 2.9,
        image: "/images/dessert-1.jpg",
      },
      {
        id: 14,
        name: "HOT CAKE HONEY",
        description:
          "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
        price: 2.9,
        image: "/images/dessert-2.jpg",
      },
      {
        id: 15,
        name: "HOT CAKE HONEY",
        description:
          "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
        price: 2.9,
        image: "/images/dessert-3.jpg",
      },
      {
        id: 16,
        name: "HOT CAKE HONEY",
        description:
          "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.",
        price: 2.9,
        image: "/images/dessert-4.jpg",
      },
    ],
  },
];

const Shop = () => {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <>
      <section
        className="relative h-[80vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/bg_3.jpg')",
        }}
      >
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-5xl font-bold mb-4 mt-10">Our Menu</h1>
          <p className="text-lg">
            <span className="mr-2 text-gray-300">
              <a href="/" className="hover:text-white transition">
                Home
              </a>
            </span>
            <span className="text-[#b6894b]">/ Shop</span>
          </p>
        </div>
      </section>
      <section className="bg-black py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center mb-12">
            <div className="flex gap-8 border-gray-800">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative pb-3 text-2xl font-medium transition-all ${
                    activeTab === tab.id
                      ? "text-yellow-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {tabs[activeTab].items.map((item) => (
              <div
                key={item.id}
                className="bg-gray-950 rounded-lg overflow-hidden flex flex-col"
              >
                <div className="h-48">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 flex flex-col flex-grow text-center">
                  <h3 className="text-lg font-bold uppercase text-white mb-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4 flex-grow">
                    {item.description}
                  </p>
                  <p className="text-xl font-bold text-white mb-4">
                    ${item.price.toFixed(2)}
                  </p>
                  <button className="border border-yellow-600 text-yellow-600 px-6 py-2 rounded-md hover:bg-yellow-600 hover:text-black transition text-sm font-medium">
                    Add to cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Shop;
