import React, { useEffect, useState } from "react";

interface Product {
  menu_id: number;
  name: string;
  description: string;
  image_url: string;
  category_id: number;
  category_name?: string;
  price?: number;
}

const Product: React.FC = () => {
  const [shopData, setShopData] = useState<Record<string, Product[]>>({});
  const [, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");
  // const [activeTab, setActiveTab] = useState<string>("Main Dish");

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/menu");
        if (!response.ok) throw new Error("Lỗi khi lấy dữ liệu menu");

        const data: Product[] = await response.json();

        const allowedCategories = ["Bánh ngọt", "Nước ép", "Món khác"];

        const grouped: Record<string, Product[]> = {};

        allowedCategories.forEach((cat) => {
          const items = data
            .filter((item) => item.category_name === cat)
            .sort((a, b) => b.menu_id - a.menu_id)
            .slice(0, 3);

          if (items.length > 0) {
            grouped[cat] = items;
          }
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
    <div className="w-full bg-[#0d0d0d] text-white pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Sản phẩm nổi bật
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Xa thật xa, phía sau những ngọn núi chữ, cách xa các quốc gia
            Vokalia và Consonantia, có những đoạn văn mù mịt sinh sống.
          </p>
        </div>

        <div className="flex justify-center space-x-6 mb-12 border-b border-[#b6894b]/30 pb-3">
          {Object.keys(shopData).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 pb-2 text-lg font-medium transition-colors ${
                activeCategory === category
                  ? "text-white border-b-2 border-[#b6894b]"
                  : "text-gray-400 hover:text-[#b6894b]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {shopData[activeCategory]?.map((item) => (
            <div
              key={item.menu_id}
              className="text-center bg-[#141414] hover:scale-105 transition-transform duration-300 pb-4"
            >
              <div
                className="h-64 bg-cover bg-center mb-6"
                style={{ backgroundImage: `url(${item.image_url})` }}
              ></div>
              <h3 className="uppercase font-semibold text-lg mb-2">
                {item.name}
              </h3>
              <p className="text-gray-400 text-sm mb-3">{item.description}</p>
              <p className="text-white font-semibold mb-3">
                {item.price
                  ? parseFloat(String(item.price)).toFixed(3)
                  : "0.000"}
                đ
              </p>
              <button className="border border-[#b6894b] text-[#b6894b] px-5 py-2 text-sm hover:bg-[#b6894b] hover:text-white transition">
                Thêm vào giỏ hàng
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Product;
