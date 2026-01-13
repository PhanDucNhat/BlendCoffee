import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface User {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  address: string | null;
  role?: string;
}

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để xem hồ sơ!");
      navigate("/login");
      return;
    }

    const requestedId = Number(id);

    if (!id || isNaN(requestedId) || requestedId <= 0) {
      navigate(`/profile/${currentUser.id}`, { replace: true });
      return;
    }

    if (requestedId !== currentUser.id && currentUser.role !== "admin") {
      alert("Bạn chỉ có thể xem hồ sơ của chính mình!");
      navigate(`/profile/${currentUser.id}`, { replace: true });
      return;
    }

    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:5000/api/user/${requestedId}`
        );

        if (!response.ok) {
          const err = await response.json();
          setError(err.message || "Lỗi tải thông tin");
          setLoading(false);
          return;
        }

        const data: User = await response.json();

        if (!data || !data.id) {
          setError("Không tìm thấy người dùng");
        } else {
          setUser(data);
        }
      } catch (err) {
        console.error("Lỗi:", err);
        setError("Không thể kết nối đến server");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, currentUser?.id, currentUser?.role]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-white text-xl">Đang tải thông tin...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-red-400 text-xl">
          {error || "Không tìm thấy người dùng"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="relative h-[11vh] bg-cover bg-center"
        style={{ backgroundImage: "url('/images/bg_2.jpg')" }}
      ></div>
      <section className="bg-black py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 text-white space-y-6 text-center">
              <h2 className="text-2xl font-semibold mb-6">THÔNG TIN CÁ NHÂN</h2>
              <div className="text-2xl flex justify-center">
                <span className="text-gray-400 mr-1">XIN CHÀO </span>
                <p className="font-medium text-[#b6894b] uppercase">
                  {user.username}
                </p>
              </div>
              <div className="w-[200px] h-[200px] mx-auto">
                <img src="/images/avatar.png" alt="avatar" />
              </div>
            </div>

            <div className="hidden md:block md:col-span-1"></div>

            <div className="md:col-span-7 text-white">
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Họ và tên
                    </label>
                    <p className="text-xl text-orange-300 border-b border-gray-700 pb-2">
                      {user.username}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 flex">
                      Số điện thoại
                      <p className="pl-2 italic">
                        (lấy theo đơn hàng đặt gần đây)
                      </p>
                    </label>
                    <p className="text-xl text-orange-300 border-b border-gray-700 pb-2">
                      {user.phone || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Email
                  </label>
                  <p className="text-xl text-orange-300 border-b border-gray-700 pb-2">
                    {user.email}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 flex">
                    Địa chỉ
                    <p className="pl-2 italic">
                      (lấy theo đơn hàng đặt gần đây)
                    </p>
                  </label>
                  <p className="text-xl text-orange-300 border-b border-gray-700 pb-2">
                    {user.address || "Chưa cập nhật địa chỉ"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Profile;
