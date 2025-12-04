import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

interface SuccessResponse {
  message: string;
}

interface ErrorResponse {
  message?: string;
  mesage?: string;
}

interface User {
  id: number;
  username: string;
  role?: string;
}

const ChangePassword: React.FC = () => {
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showOldPassword, setShowOldPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData) as User;
        setUser(user);
      } catch (err) {
        console.error("Lỗi parse user từ localStorage", err);
      }
    }
    if (!userData) {
      alert("Vui lòng đăng nhập để đổi mật khẩu!");
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      setLoading(false);
      return;
    }

    try {
      await axios.post<SuccessResponse>(
        "/api/change-password",
        {
          oldPassword,
          newPassWord: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      localStorage.removeItem("token");
      navigate("/login");
    } catch (error: unknown) {
      let errorMessage = "Đổi mật khẩu thất bại. Vui lòng thử lại!";

      if (error && typeof error === "object") {
        if (
          "response" in error &&
          error.response &&
          typeof error.response === "object"
        ) {
          const data = (error.response as { data?: ErrorResponse }).data;
          if (data && typeof data === "object") {
            errorMessage = (data.message ?? data.mesage) || errorMessage;
          }
        }
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
              <h2 className="text-2xl font-semibold mb-6">CHANGE PASSWORD</h2>
              <div className="text-2xl flex justify-center">
                <span className="text-gray-400 mr-1">HELLO </span>
                <p className="font-medium text-[#b6894b] uppercase">
                  {user?.username}
                </p>
              </div>
              <div className="w-[200px] h-[200px] mx-auto">
                <img
                  src="images/avatar.png"
                  alt="avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            <div className="hidden md:block md:col-span-1"></div>

            <div className="md:col-span-7">
              <form onSubmit={handleSubmit} className="space-y-6 text-left">
                <div className="grid grid-cols-1 gap-6">
                  <div className="relative">
                    <div className="block text-sm text-white mb-1">
                      Old password
                    </div>
                    <input
                      type={showOldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-[60%] bg-transparent border-b border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400 outline-none pb-2 pr-10 transition"
                      placeholder="Nhập mật khẩu cũ"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-[40%] top-8 text-gray-500 hover:text-yellow-400 transition"
                      tabIndex={-1}
                    >
                      {showOldPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="block text-sm text-white mb-1">
                      New password
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-[60%] bg-transparent border-b border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400 outline-none pb-2 pr-10 transition"
                      placeholder="Nhập mật khẩu mới"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-[40%] top-8 text-gray-500 hover:text-yellow-400 transition"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="block text-sm text-white mb-1">
                      Confirm password
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-[60%] bg-transparent border-b border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400 outline-none pb-2 pr-10 transition"
                      placeholder="Nhập lại mật khẩu mới"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-[40%] top-8 text-gray-500 hover:text-yellow-400 transition"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-orange-400 text-white rounded p-3 hover:bg-orange-300 font-bold transition disabled:opacity-70"
                  >
                    {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ChangePassword;
