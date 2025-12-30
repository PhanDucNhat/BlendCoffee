import React, { useState, useEffect } from "react";
import {
  getProvinces,
  Province,
  District,
  Ward,
} from "../../backend/src/data/vietnam";
import { useNavigate } from "react-router-dom";

interface CartItem {
  cart_item_id: number;
  menu_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  size: "Small" | "Medium" | "Large";
  price: number;
  quantity: number;
}

interface AddressItem {
  address_id: number;
  id: number;
  fullname: string;
  phone: string;
  detail_address: string;
  ward: string;
  district: string;
  city: string;
  is_default: 1 | 0;
}

const Checkout: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [province, setProvince] = useState<Province | null>(null);
  const [district, setDistrict] = useState<District | null>(null);
  const [ward, setWard] = useState<Ward | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer">(
    "cash"
  );
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [addToAddressBook, setAddToAddressBook] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const navigate = useNavigate();

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const delivery: number = 0;
  const total = subtotal + delivery - discount;

  const fetchCart = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Không thể tải giỏ hàng");
      }

      const data: CartItem[] = await response.json();
      setCartItems(data);
    } catch (err) {
      console.error("Lỗi tải giỏ hàng:", err);
      alert("Không thể tải thông tin giỏ hàng. Vui lòng thử lại!");
      navigate("/cart");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) return alert("Vui lòng nhập họ và tên.");
    if (!phone.trim()) return alert("Vui lòng nhập số điện thoại.");
    if (!province) return alert("Vui lòng chọn tỉnh/thành phố.");
    if (!district) return alert("Vui lòng chọn quận/huyện.");
    if (!ward) return alert("Vui lòng chọn phường/xã.");
    if (!address.trim()) return alert("Vui lòng nhập địa chỉ chi tiết.");
    if (!acceptTerms)
      return alert(
        "Vui lòng đồng ý với điều khoản và điều kiện trước khi đặt hàng."
      );
    if (cartItems.length === 0) return alert("Giỏ hàng của bạn đang trống.");
    return null;
  };

  const handlePlaceOrder = async () => {
    setFormError(null);
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const errorMessage = validateForm();
    if (errorMessage) {
      setFormError(errorMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/orders/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            billing: {
              fullName,
              phone,
              address,
              provinceId: province?.Id ?? null,
              provinceName: province?.Name ?? null,
              districtId: district?.Id ?? null,
              districtName: district?.Name ?? null,
              wardId: ward?.Id ?? null,
              wardName: ward?.Name ?? null,
            },
            note,
            voucherCode: appliedVoucher ?? null,
            paymentMethod,
            addressBook: addToAddressBook,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể đặt hàng");
      }

      setCartItems([]);
      setDiscount(0);
      setVoucherCode("");
      setAppliedVoucher(null);
      setVoucherMessage(null);
      alert("Đặt hàng thành công! Bạn có thể theo dõi trong lịch sử đơn.");
      navigate("/order");
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      setFormError(
        error instanceof Error ? error.message : "Không thể đặt hàng"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyVoucher = async () => {
    setVoucherMessage(null);
    const code = voucherCode.trim();
    if (!code) {
      setVoucherMessage("Vui lòng nhập mã voucher.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setVoucherLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/voucher/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voucherCode: code }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể áp dụng voucher");
      }

      setDiscount(data.discount || 0);
      setAppliedVoucher(code);
      setVoucherMessage("Áp dụng voucher thành công!");
    } catch (error) {
      console.error("Lỗi áp dụng voucher:", error);
      setDiscount(0);
      setAppliedVoucher(null);
      setVoucherMessage(
        error instanceof Error ? error.message : "Không thể áp dụng voucher"
      );
    } finally {
      setVoucherLoading(false);
    }
  };

  const fetchAddresses = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/addresses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Không thể tải địa chỉ");
      const data: AddressItem[] = await res.json();
      setAddresses(data);
      const defaultAddr = data.find((address) => address.is_default === 1);
      if (defaultAddr) {
        setSelectedAddressId(String(defaultAddr.address_id));
        fillAddressForm(defaultAddr);
      }
    } catch (err) {
      console.error("Lỗi tải sổ địa chỉ:", err);
    }
  };

  const fillAddressForm = async (address: AddressItem) => {
    setFullName(address.fullname);
    setPhone(address.phone);
    setAddress(address.detail_address);

    const province = provinces.find((p) => p.Name === address.city);
    if (province) {
      setProvince(province);

      const district = province.Districts.find(
        (d) => d.Name === address.district
      );
      if (district) {
        setDistrict(district);

        const ward = district.Wards.find((w) => w.Name === address.ward);
        setWard(ward || null);
      } else {
        setDistrict(null);
        setWard(null);
      }
    } else {
      setProvince(null);
      setDistrict(null);
      setWard(null);
    }
  };

  const handleAddressSelect = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setSelectedAddressId(value);

    if (value === "") {
      setFullName("");
      setPhone("");
      setAddress("");
      setProvince(null);
      setDistrict(null);
      setWard(null);
      return;
    }

    const selectedAddress = addresses.find(
      (address) => address.address_id === Number(value)
    );
    if (selectedAddress) {
      fillAddressForm(selectedAddress);
    }
  };

  useEffect(() => {
    fetchCart();

    getProvinces()
      .then((data) => setProvinces(data))
      .catch((err) => {
        console.error("Lỗi tải tỉnh/thành:", err);
      });
    fetchAddresses();
  }, []);

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center text-2xl">
        Đang tải thông tin thanh toán...
      </div>
    );
  }

  return (
    <>
      <div
        className="relative h-[11vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/bg_2.jpg')",
        }}
      ></div>

      <div className="bg-black text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-gray-900 p-6 rounded-lg border border-gray-800">
              <div className="flex justify-between">
                <h2 className="text-2xl font-bold uppercase mb-6">
                  Chi tiết thanh toán
                </h2>
                <div className="flex">
                  <label className="text-sm font-medium text-white block mt-2 mr-2">
                    Sổ địa chỉ
                  </label>
                  <select
                    value={selectedAddressId}
                    onChange={handleAddressSelect}
                    className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-60 p-2 h-10"
                  >
                    <option value="">-- Địa chỉ khác --</option>
                    {addresses.map((address) => (
                      <option
                        key={address.address_id}
                        value={address.address_id}
                      >
                        {address.fullname} - {address.phone} |
                        {address.detail_address}, {address.ward},
                        {address.district}, {address.city}
                        {address.is_default === 1 && " (Mặc định)"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <form className="space-y-6 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                  <div>
                    <label className="block text-sm mb-1">
                      Họ tên người nhận
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:border-white outline-none"
                      placeholder=""
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:border-white outline-none"
                      placeholder=""
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Tỉnh/Thành phố</label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white appearance-none"
                      value={province?.Id ?? ""}
                      onChange={(e) => {
                        const selected =
                          provinces.find((p) => p.Id === e.target.value) ||
                          null;
                        setProvince(selected);
                        setDistrict(null);
                        setWard(null);
                      }}
                      disabled={loading}
                    >
                      <option value="">
                        {loading
                          ? "Đang tải..."
                          : "--- Chọn tỉnh/thành phố ---"}
                      </option>
                      {provinces.map((p) => (
                        <option key={p.Id} value={p.Id}>
                          {p.Name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Quận/Huyện</label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white appearance-none"
                      value={district?.Id ?? ""}
                      onChange={(e) => {
                        const selected =
                          province?.Districts.find(
                            (d) => d.Id === e.target.value
                          ) || null;
                        setDistrict(selected);
                        setWard(null);
                      }}
                      disabled={!province}
                    >
                      <option value="">--- Chọn quận/huyện ---</option>
                      {province?.Districts.map((d) => (
                        <option key={d.Id} value={d.Id}>
                          {d.Name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Phường/Xã</label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white appearance-none"
                      value={ward?.Id ?? ""}
                      onChange={(e) => {
                        const selected =
                          district?.Wards.find(
                            (w) => w.Id === e.target.value
                          ) || null;
                        setWard(selected);
                      }}
                      disabled={!district}
                    >
                      <option value="">--- Chọn xã/phường ---</option>
                      {district?.Wards.map((w: Ward) => (
                        <option key={w.Id} value={w.Id}>
                          {w.Name}
                          {w.Level &&
                            ` (${w.Level.replace("Ward", "Phường")
                              .replace("Commune", "Xã")
                              .replace("Town", "Thị trấn")})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">
                      Địa chỉ chi tiết
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500"
                      placeholder="Số nhà, đường..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Ghi chú</label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500"
                      placeholder=""
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-cyan-500"
                    checked={addToAddressBook}
                    onChange={(e) => setAddToAddressBook(e.target.checked)}
                  />
                  <span className="text-xs text-gray-300">
                    Lưu địa chỉ này vào sổ địa chỉ của tôi
                  </span>
                </div>

                <div className="text-xs text-gray-400 leading-relaxed space-y-2">
                  <p>
                    Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân và địa
                    chỉ của bạn. Dữ liệu chỉ được sử dụng cho mục đích giao hàng
                    và cải thiện trải nghiệm mua sắm, không chia sẻ cho bất kỳ
                    bên thứ ba nào mà không có sự đồng ý của bạn.
                  </p>
                  <p className="text-cyan-300 text-xs italic">
                    Mẹo: Hãy đặt một địa chỉ thường dùng làm mặc định để hệ
                    thống tự động điền thông tin khi bạn thanh toán lần sau!
                  </p>
                </div>
              </form>
            </div>
            <div className="space-y-8">
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-xl font-bold uppercase mb-4">
                  Đơn hàng của bạn
                </h3>
                <hr className="my-4 border-gray-700" />
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.cart_item_id}
                      className="flex gap-4 pb-4 border-b border-gray-800 last:border-0"
                    >
                      <img
                        src={
                          item.image_url
                            ? `${item.image_url}`
                            : "/images/default.jpg"
                        }
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {item.name}
                        </h4>
                        <div className="text-xs text-gray-400 space-y-1 mt-1">
                          <span>Size: {item.size}</span>
                          <span> x{item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right font-medium whitespace-nowrap">
                        {(item.price * item.quantity).toFixed(3)}đ
                      </div>
                    </div>
                  ))}
                </div>
                <hr className="mb-3 border-gray-700" />
                <div className="flex gap-3">
                  <input
                    type="text"
                    className="w-full h-10 bg-gray-800 border border-gray-700 rounded-md px-4 text-white placeholder-gray-500"
                    placeholder="Nhập mã voucher"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    className="w-full h-10 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-black font-bold rounded uppercase"
                    disabled={voucherLoading}
                  >
                    {voucherLoading ? "Đang áp dụng..." : "Áp dụng"}
                  </button>
                </div>
                {voucherMessage && (
                  <p
                    className={`text-sm mt-2 ${
                      appliedVoucher ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {voucherMessage}
                  </p>
                )}
                <hr className="my-4 border-gray-700" />
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Thành tiền</span>
                    <span>{subtotal.toFixed(3)}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vận chuyển</span>
                    <span>
                      {delivery === 0 ? "Miễn phí" : `${delivery.toFixed(3)}đ`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Giảm giá</span>
                    <span>{discount.toFixed(3)}đ</span>
                  </div>
                </div>
                <hr className="my-4 border-gray-700" />
                <div className="flex justify-between text-lg font-bold">
                  <span>TỔNG TIỀN</span>
                  <span className="text-yellow-500">{total.toFixed(3)}đ</span>
                </div>
              </div>
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-xl font-bold uppercase mb-4">
                  Phương thức thanh toán
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      className="w-4 h-4 text-cyan-500"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                    />
                    <span className="text-sm">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      className="w-4 h-4 text-cyan-500"
                      value="bank_transfer"
                      checked={paymentMethod === "bank_transfer"}
                      onChange={() => setPaymentMethod("bank_transfer")}
                    />
                    <span className="text-sm">Thanh toán qua VNPay</span>
                  </label>
                </div>

                <label className="flex items-center gap-3 mt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-cyan-500"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                  />
                  <span className="text-xs text-gray-300">
                    Tôi đã đọc và đồng ý với các điều khoản và điều kiện
                  </span>
                </label>

                {formError && (
                  <p className="text-red-500 text-sm mt-4">{formError}</p>
                )}

                <button
                  className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-black font-bold py-3 rounded mt-6 uppercase"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
