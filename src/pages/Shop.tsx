import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface MenuItem {
  menu_id: number;
  name: string;
  description: string;
  image_url: string;
  category_id: number;
  category_name?: string;
  price?: number;
}

const Shop: React.FC = () => {
  const [shopData, setShopData] = useState<Record<string, MenuItem[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");

  const navigate = useNavigate();

  const handleSingleProduct = (id: number) => {
    navigate(`/singleproduct/${id}`);
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/menu");
        if (!response.ok) throw new Error("Lỗi khi lấy dữ liệu menu");

        const data: MenuItem[] = await response.json();

        const grouped: Record<string, MenuItem[]> = {};
        data.forEach((item) => {
          const catName = item.category_name || `Category ${item.category_id}`;
          if (!grouped[catName]) grouped[catName] = [];
          grouped[catName].push(item);
        });

        setShopData(grouped);

        const firstCategory = Object.keys(grouped)[0];
        if (firstCategory) setActiveCategory(firstCategory);
      } catch (err: unknown) {
        console.error("Lỗi khi tải menu:", err);
        if (err instanceof Error) setError(err.message);
        else setError("Đã xảy ra lỗi không xác định");
      }
    };

    fetchMenu();
  }, []);

  return (
    <>
      <section
        className="relative h-[80vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/bg_3.jpg')",
        }}
      >
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-5xl font-bold mb-4 mt-10">ORDER ONLINE</h1>
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
            <div className="flex gap-8 border-gray-800 flex-wrap justify-center">
              {Object.keys(shopData).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`relative pb-3 text-2xl font-medium transition-all ${
                    activeCategory === category
                      ? "text-yellow-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {category}
                  {activeCategory === category && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="text-center text-red-400 text-lg py-10">
              Lỗi: {error}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {shopData[activeCategory]?.map((item) => (
                <div
                  key={item.menu_id}
                  className="bg-gray-950 rounded-lg overflow-hidden flex flex-col"
                >
                  <div className="h-48">
                    <img
                      src={item.image_url || "/images/default.jpg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-6 flex flex-col flex-grow text-center">
                    <h3 className="text-lg font-bold uppercase text-white mb-2">
                      {item.name}
                    </h3>
                    {/* <p className="text-sm text-gray-400 mb-4 flex-grow">
                      {item.description ||
                        "A small river named Duden flows by their place and supplies"}
                    </p> */}
                    <p className="text-xl font-bold text-white mb-4">
                      $
                      {item.price
                        ? parseFloat(String(item.price)).toFixed(2)
                        : "0.00"}
                    </p>
                    <button
                      onClick={() => handleSingleProduct(item.menu_id)}
                      className="border border-yellow-600 text-yellow-600 px-6 py-2 rounded-md hover:bg-yellow-600 hover:text-black transition text-sm font-medium"
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Shop;
