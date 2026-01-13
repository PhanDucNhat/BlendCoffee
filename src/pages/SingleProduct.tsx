import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CircleCheck } from "lucide-react";

interface MenuDetail {
  menu_id: number;
  name: string;
  description: string;
  image_url: string;
  category_id: number;
  category_name?: string;
  size: string;
  price: number;
}

const SingleProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<MenuDetail | null>(null);
  const [sizes, setSizes] = useState<MenuDetail[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>("Medium");
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shopData, setShopData] = useState<Record<string, MenuDetail[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>("");
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"login" | "success" | null>(null);

  const handleSingleProduct = (id: number) => {
    navigate(`/singleproduct/${id}`);
  };

  const openModal = (type: "login" | "success") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || isNaN(Number(id))) {
        setError("ID sản phẩm không hợp lệ");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/menu/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Không tìm thấy sản phẩm");
          } else {
            throw new Error("Lỗi khi tải sản phẩm");
          }
          setLoading(false);
          return;
        }
        const data: MenuDetail[] = await response.json();
        if (data.length === 0) {
          setError("Không tìm thấy sản phẩm");
          setLoading(false);
          return;
        }
        const normalizedData = data.map((item) => ({
          ...item,
          price: Number(item.price),
        }));
        const baseProduct = normalizedData[0];
        setProduct(baseProduct);
        setSizes(normalizedData);
        const mediumSize = normalizedData.find(
          (item) => item.size === "Medium"
        );
        setSelectedSize(mediumSize ? "Medium" : normalizedData[0].size);
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
        setError("Đã xảy ra lỗi khi tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/menu");
        if (!response.ok) throw new Error("Lỗi khi lấy dữ liệu menu");
        const data: MenuDetail[] = await response.json();
        const grouped: Record<string, MenuDetail[]> = {};
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-white text-xl">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-red-400 text-xl">
          {error || "Không có dữ liệu sản phẩm"}
        </p>
      </div>
    );
  }

  const currentPrice =
    Number(sizes.find((s) => s.size === selectedSize)?.price) || 0;

  const handleAddToCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      openModal("login");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          menu_id: product.menu_id,
          size: selectedSize,
          quantity: quantity,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        openModal("success");
      } else {
        alert(data.message || "Lỗi khi thêm vào giỏ hàng");
      }
    } catch {
      alert("Lỗi kết nối server");
    }
  };

  return (
    <>
      <section
        className="relative h-[40vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/bg_3.jpg')",
        }}
      >
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-5xl font-bold mb-4 mt-10">CHI TIẾT SẢN PHẨM</h1>
          <p className="text-lg">
            <span className="mr-2 text-gray-300">
              <a href="/" className="hover:text-white transition">
                Trang chủ
              </a>
            </span>
            <span className="text-[#b6894b]">/ Chi tiết sản phẩm</span>
          </p>
        </div>
      </section>
      <section className="bg-black text-white py-12 px-6 text-left">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <img
                src={
                  product.image_url
                    ? `${product.image_url}`
                    : "/images/default.jpg"
                }
                alt={product.name}
                className="w-full rounded-lg object-cover h-96"
              />
            </div>
            <div className="space-y-6">
              <h1 className="text-3xl font-bold uppercase">{product.name}</h1>
              <p className="text-3xl font-bold text-yellow-500">
                {currentPrice.toFixed(3)}đ
              </p>
              <div className="text-gray-400 text-sm space-y-4">
                <p>
                  {product.description || "Không có mô tả cho sản phẩm này."}
                </p>
              </div>

              <div className="max-w-xs">
                <p className="text-xl mb-2 text-gray-200">Size :</p>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-[150px] bg-gray-800 border border-gray-700 text-white rounded-md px-4 py-3"
                >
                  {sizes.map((item) => (
                    <option key={item.size} value={item.size}>
                      {item.size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 max-w-xs">
                <p className="text-xl mb-2 text-gray-200">Số lượng :</p>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
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

              <button
                onClick={handleAddToCart}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-8 rounded-md uppercase transition"
              >
                Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-black py-3 px-4">
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
                    <p className="text-xl font-bold text-white mb-4">
                      {item.price
                        ? parseFloat(String(item.price)).toFixed(3)
                        : "0.000"}
                      đ
                    </p>
                    <button
                      onClick={() => handleSingleProduct(item.menu_id)}
                      className="border border-yellow-600 text-yellow-600 px-6 py-2 rounded-md hover:bg-yellow-600 hover:text-black transition text-sm font-medium"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg max-w-md w-full p-8 text-center border border-gray-700">
            {modalType === "login" ? (
              <>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Yêu cầu đăng nhập
                </h3>
                <p className="text-gray-300 mb-8">
                  Bạn cần đăng nhập để có thể thêm sản phẩm vào giỏ hàng.
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      closeModal();
                      navigate("/login");
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-8 rounded-md uppercase"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={closeModal}
                    className="border border-gray-600 text-gray-300 hover:bg-gray-800 py-3 px-8 rounded-md uppercase"
                  >
                    Hủy
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center">
                    <CircleCheck className="text-white w-12 h-12" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Thêm vào giỏ hàng thành công!
                </h3>
                <p className="text-gray-300 mb-8">
                  {product.name} ({selectedSize}) x {quantity}
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      closeModal();
                      navigate("/cart");
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-3 rounded-md uppercase"
                  >
                    Xem giỏ hàng
                  </button>
                  <button
                    onClick={closeModal}
                    className="border border-gray-600 text-gray-300 bg-gray-500 hover:bg-gray-800 py-3 px-3 rounded-md uppercase"
                  >
                    Tiếp tục mua hàng
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SingleProduct;
