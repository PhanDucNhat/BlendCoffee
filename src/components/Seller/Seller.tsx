import React, { useEffect, useState } from "react";

interface CoffeeItem {
  menu_id: number;
  name: string;
  description: string;
  image_url: string;
  category_id: number;
  category_name?: string;
  price?: number;
}

const Seller: React.FC = () => {
  const [coffeeItems, setCoffeeItems] = useState<CoffeeItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/menu");

        if (!response.ok) throw new Error("Lỗi khi lấy dữ liệu menu");

        const data: CoffeeItem[] = await response.json();

        const filtered = data
          .filter((item) => item.category_name === "Coffee")
          .sort((a, b) => b.menu_id - a.menu_id)
          .slice(0, 4);

        setCoffeeItems(filtered);
      } catch (err: unknown) {
        console.error("Lỗi khi tải menu:", err);
        if (err instanceof Error) setError(err.message);
        else setError("Đã xảy ra lỗi không xác định");
      }
    };

    fetchMenu();
  }, []);

  return (
    <div className="w-full bg-[#0d0d0d] text-white py-12">
      <div className="max-w-7xl mx-auto px-6">
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

        {error && (
          <p className="text-center text-red-500 text-lg mb-6">{error}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          {coffeeItems.map((item) => (
            <div
              key={item.menu_id}
              className="bg-[#141414] hover:scale-105 transition-transform duration-300"
            >
              <div
                className="h-64 bg-cover bg-center"
                style={{ backgroundImage: `url(${item.image_url})` }}
              ></div>
              <div className="text-center py-6 px-4">
                <h3 className="uppercase font-semibold text-lg mb-2">
                  {item.name}
                </h3>
                <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                <p className="text-white font-semibold mb-3">
                  {item.price ? `$${item.price}` : "Updating..."}
                </p>
                <button className="border border-[#b6894b] text-[#b6894b] px-5 py-2 text-sm hover:bg-[#b6894b] hover:text-white transition">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {coffeeItems.length === 0 && !error && (
          <p className="text-center text-gray-400 mt-10 text-lg">
            Không có sản phẩm Coffee nào.
          </p>
        )}
      </div>
    </div>
  );
};

export default Seller;
