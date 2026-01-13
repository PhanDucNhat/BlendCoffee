import React, { useEffect, useState } from "react";
import Contact from "../components/Contact/Contact";

interface MenuItem {
  menu_id: number;
  name: string;
  description: string;
  image_url: string;
  category_id: number;
  category_name?: string;
  price?: number;
}

const MenuHeader: React.FC = () => {
  const [menuData, setMenuData] = useState<Record<string, MenuItem[]>>({});
  const [error, setError] = useState<string | null>(null);

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

        setMenuData(grouped);
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
        className="relative h-[60vh] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/images/bg_3.jpg')" }}
      >
        <div className="absolute inset-0 bg-opacity-60"></div>
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-5xl font-bold mb-4 mt-10">MENU</h1>
          <p className="text-lg">
            <span className="mr-2 text-gray-300">
              <a href="/" className="hover:text-white transition">
                Trang chủ
              </a>
            </span>
            <span className="text-[#b6894b]">/ Menu</span>
          </p>
        </div>
      </section>

      <Contact />

      <section className="bg-neutral-900 py-16 text-gray-200 text-left">
        <div className="container mx-auto px-20">
          {error ? (
            <p className="text-center text-red-400 text-lg py-10">
              Lỗi: {error}
            </p>
          ) : (
            <div className="flex flex-wrap -mx-4">
              {Object.entries(menuData).map(([title, items]) => (
                <div key={title} className="w-full md:w-1/2 mb-12 px-4">
                  <h3 className="text-2xl font-semibold text-white mb-8 uppercase tracking-wide border-b border-gray-700 pb-2">
                    {title}
                  </h3>

                  {items.map((item) => (
                    <div
                      key={item.menu_id}
                      className="flex items-start mb-6 bg-transparent border-b border-gray-800 pb-4 hover:bg-gray-900/20 rounded-xl p-2 transition-all duration-300"
                    >
                      <div
                        className="w-20 h-20 rounded-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${
                            item.image_url || "/images/default.jpg"
                          })`,
                        }}
                      ></div>

                      <div className="pl-4 flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-medium text-white">
                            {item.name}
                          </h4>

                          {item.price !== undefined && (
                            <span className="text-amber-400 font-semibold">
                              {item.price
                                ? parseFloat(String(item.price)).toFixed(3)
                                : "0.000"}
                              đ
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                          {item.description ||
                            "Món ăn ngon đặc trưng của chúng tôi."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default MenuHeader;
