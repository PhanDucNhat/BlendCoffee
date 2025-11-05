import React from "react";
import Contact from "../components/Contact/Contact";

const MenuHeader: React.FC = () => {
  const menuData = {
    Starter: [
      {
        name: "Cornish - Mackerel",
        price: "$20.00",
        image: "images/dish-1.jpg",
      },
      { name: "Roasted Steak", price: "$29.00", image: "images/dish-2.jpg" },
      { name: "Seasonal Soup", price: "$20.00", image: "images/dish-3.jpg" },
      { name: "Chicken Curry", price: "$20.00", image: "images/dish-4.jpg" },
    ],
    "Main Dish": [
      { name: "Sea Trout", price: "$49.91", image: "images/dish-5.jpg" },
      { name: "Roasted Beef", price: "$20.00", image: "images/dish-6.jpg" },
      {
        name: "Butter Fried Chicken",
        price: "$20.00",
        image: "images/dish-7.jpg",
      },
      { name: "Chiken Filet", price: "$20.00", image: "images/dish-8.jpg" },
    ],
    Desserts: [
      {
        name: "Cornish - Mackerel",
        price: "$20.00",
        image: "images/dessert-1.jpg",
      },
      { name: "Roasted Steak", price: "$29.00", image: "images/dessert-2.jpg" },
      { name: "Seasonal Soup", price: "$20.00", image: "images/dessert-3.jpg" },
      { name: "Chicken Curry", price: "$20.00", image: "images/dessert-4.jpg" },
    ],
    Drinks: [
      { name: "Sea Trout", price: "$49.91", image: "images/drink-5.jpg" },
      { name: "Roasted Beef", price: "$20.00", image: "images/drink-6.jpg" },
      {
        name: "Butter Fried Chicken",
        price: "$20.00",
        image: "images/drink-7.jpg",
      },
      { name: "Chiken Filet", price: "$20.00", image: "images/drink-8.jpg" },
    ],
  };

  return (
    <>
      <section
        className="relative h-[80vh] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/images/bg_3.jpg')" }}
      >
        <div className="absolute inset-0 bg-opacity-60"></div>
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-5xl font-bold mb-4 mt-10">Our Menu</h1>
          <p className="text-lg">
            <span className="mr-2 text-gray-300">
              <a href="/" className="hover:text-white transition">
                Home
              </a>
            </span>
            <span className="text-[#b6894b]">/ Menu</span>
          </p>
        </div>
      </section>
      <Contact />
      <section className="bg-neutral-900 py-16 text-gray-200 text-left">
        <div className="container mx-auto px-20">
          <div className="flex flex-wrap -mx-4">
            {Object.entries(menuData).map(([title, items]) => (
              <div key={title} className="w-full md:w-1/2 mb-12 px-4">
                <h3 className="text-2xl font-semibold text-white mb-8 uppercase tracking-wide border-b border-gray-700 pb-2">
                  {title}
                </h3>
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start mb-6 bg-transparent border-b border-gray-800 pb-4 hover:bg-gray-900/20 rounded-xl p-2 transition-all duration-300"
                  >
                    <div
                      className="w-20 h-20 rounded-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${item.image})` }}
                    ></div>
                    <div className="pl-4 flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-medium text-white">
                          {item.name}
                        </h4>
                        <span className="text-amber-400 font-semibold">
                          {item.price}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        A small river named Duden flows by their place and
                        supplies
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default MenuHeader;
