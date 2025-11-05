import React, { useState } from "react";

interface Product {
  name: string;
  price: number;
  description: string[];
  image: string;
  sizes: string[];
}

const productData: Product = {
  name: "CREAMY LATTE COFFEE",
  price: 4.9,
  description: [
    "A small river named Duden flows by their place and supplies it with the necessary regelialia. It is a paradisematic country, in which roasted parts of sentences fly into your mouth.",
    'On her way she met a copy. The copy warned the Little Blind Text that where it came from it would have been rewritten a thousand times and everything that was left from its origin would be the word "and" and the Little Blind Text should turn around and return to its own, safe country. But nothing the copy said could convince her and so it didn’t take long until a few insidious Copy Writers ambushed her, made her drunk with Longe and Parole and dragged her into their agency, where they abused her for their.',
  ],
  image: "/images/menu-2.jpg",
  sizes: ["Small", "Medium", "Large", "Extra Large"],
};

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

const SingleProduct: React.FC = () => {
  const [quantity, setQuantity] = useState<number>(1);
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
            <span className="text-[#b6894b]">/ Product Detail</span>
          </p>
        </div>
      </section>
      <section className="bg-black text-white py-12 px-6 text-left">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <img
                src={productData.image}
                alt={productData.name}
                className="w-full rounded-lg"
              />
            </div>
            <div className="space-y-6">
              <h1 className="text-3xl font-bold uppercase">
                {productData.name}
              </h1>
              <p className="text-3xl font-bold text-yellow-500">
                ${productData.price.toFixed(2)}
              </p>
              <div className="text-gray-400 text-sm space-y-4">
                {productData.description.map((para, index) => (
                  <p key={index}>{para}</p>
                ))}
              </div>
              <div className="w-[200px] max-w-xs">
                <select className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-4 py-3">
                  {productData.sizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 max-w-xs">
                <button
                  onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}
                  className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 transition"
                >
                  −
                </button>
                <input
                  type="text"
                  value={quantity}
                  readOnly
                  className="w-16 text-center bg-gray-800 border border-gray-700 rounded-md py-2"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 transition"
                >
                  +
                </button>
              </div>
              <button className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-8 rounded-md uppercase transition">
                Add to Cart
              </button>
            </div>
          </div>
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

export default SingleProduct;
