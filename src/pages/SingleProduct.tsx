import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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

  const navigate = useNavigate();

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

  return (
    <>
      <section
        className="relative h-[80vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/bg_3.jpg')",
        }}
      >
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-5xl font-bold mb-4 mt-10">PRODUCT DETAIL</h1>
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
                ${currentPrice.toFixed(3)}
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
                <p className="text-xl mb-2 text-gray-200">Quantity :</p>
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
                onClick={async () => {
                  const token = localStorage.getItem("token");
                  if (!token) {
                    alert("Vui lòng đăng nhập để thêm vào giỏ hàng!");
                    navigate("/login");
                    return;
                  }

                  try {
                    const response = await fetch(
                      "http://localhost:5000/api/cart/add",
                      {
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
                      }
                    );

                    const data = await response.json();
                    if (response.ok) {
                      alert("Đã thêm vào giỏ hàng!");
                    } else {
                      alert(data.message || "Lỗi khi thêm vào giỏ");
                    }
                  } catch {
                    alert("Lỗi kết nối server");
                  }
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-8 rounded-md uppercase transition"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default SingleProduct;
