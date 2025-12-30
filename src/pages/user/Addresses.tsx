import React, { useState, useEffect } from "react";
import { MapPinHouse, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getProvinces,
  Province,
  District,
  Ward,
} from "../../../backend/src/data/vietnam";

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

interface User {
  id: number;
  username: string;
  role?: string;
}

const Addresses: React.FC = () => {
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(
    null
  );
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);
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

  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch((err) => console.error("Lỗi tải tỉnh/thành:", err));
  }, []);

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
    } catch (err) {
      console.error(err);
      alert("Không thể tải danh sách địa chỉ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingAddress(null);
    resetForm();
  };

  const resetForm = () => {
    setFullname("");
    setPhone("");
    setDetailAddress("");
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setIsDefault(false);
  };

  const openEditModal = (address: AddressItem) => {
    setEditingAddress(address);
    setFullname(address.fullname);
    setPhone(address.phone);
    setDetailAddress(address.detail_address);
    setIsDefault(address.is_default === 1);

    const province = provinces.find((p) => p.Name === address.city);
    setSelectedProvince(province || null);

    if (province) {
      const district = province.Districts.find(
        (d) => d.Name === address.district
      );
      setSelectedDistrict(district || null);
      if (district) {
        const ward = district.Wards.find((w) => w.Name === address.ward);
        setSelectedWard(ward || null);
      }
    }

    setShowEditModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullname.trim() || !phone.trim() || !detailAddress.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      alert("Vui lòng chọn đầy đủ Tỉnh/Thành → Quận/Huyện → Phường/Xã!");
      return;
    }

    const payload = {
      fullname: fullname.trim(),
      phone: phone.trim(),
      detail_address: detailAddress.trim(),
      city: selectedProvince.Name,
      district: selectedDistrict.Name,
      ward: selectedWard.Name,
      is_default: isDefault ? 1 : 0,
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/addresses/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Thêm thất bại");

      alert("Thêm địa chỉ thành công!");
      closeModals();
      fetchAddresses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi khi thêm địa chỉ");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddress) return;

    if (!fullname.trim() || !phone.trim() || !detailAddress.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      alert("Vui lòng chọn đầy đủ Tỉnh/Thành → Quận/Huyện → Phường/Xã!");
      return;
    }

    const payload = {
      fullname: fullname.trim(),
      phone: phone.trim(),
      detail_address: detailAddress.trim(),
      city: selectedProvince.Name,
      district: selectedDistrict.Name,
      ward: selectedWard.Name,
      is_default: isDefault ? 1 : 0,
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/addresses/update/${editingAddress.address_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cập nhật thất bại");

      alert("Cập nhật địa chỉ thành công!");
      closeModals();
      fetchAddresses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi khi cập nhật");
    }
  };

  const handleDelete = async () => {
    if (!editingAddress) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/addresses/delete/${editingAddress.address_id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Xóa thất bại");
      }

      alert("Xóa địa chỉ thành công!");
      closeModals();
      fetchAddresses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi khi xóa");
    }
  };

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center text-xl">
        Đang tải địa chỉ...
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
              <h2 className="text-2xl font-semibold mb-6">ĐỊA CHỈ CỦA TÔI</h2>
              <div className="text-2xl flex justify-center">
                <span className="text-gray-400 mr-1">Xin chào </span>
                <p className="font-medium text-[#b6894b] uppercase">
                  {user?.username}
                </p>
              </div>
              <div className="w-[200px] h-[200px] mx-auto">
                <img src="images/avatar.png" alt="avatar" />
              </div>
            </div>
            <div className="md:col-span-7">
              <button
                onClick={() => setShowAddModal(true)}
                className="w-40 h-10 bg-yellow-600 hover:bg-yellow-700 text-black font-bold rounded uppercase"
              >
                Thêm địa chỉ
              </button>

              <div className="text-left pt-4 space-y-6">
                {addresses.length === 0 ? (
                  <p className="text-gray-400 text-center py-10">
                    Chưa có địa chỉ nào
                  </p>
                ) : (
                  addresses.map((addr) => (
                    <div
                      key={addr.address_id}
                      className={`flex font-medium text-[16px] gap-6 bg-gray-600 rounded-lg p-4 text-white ${
                        addr.is_default === 1 ? "ring-2 ring-green-500" : ""
                      }`}
                    >
                      <div className="flex-1">
                        <p className="pb-2">Họ tên: {addr.fullname}</p>
                        <p className="pb-2">Số điện thoại: {addr.phone}</p>
                        <p>
                          {addr.detail_address}, {addr.ward}, {addr.district},{" "}
                          {addr.city}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-3 text-sm">
                        {addr.is_default === 1 && (
                          <div className="flex items-center gap-1 text-green-400">
                            <MapPinHouse className="w-4 h-4" />
                            Địa chỉ mặc định
                          </div>
                        )}
                        <button
                          onClick={() => openEditModal(addr)}
                          className="text-orange-500 hover:text-orange-400 font-medium"
                        >
                          Cập nhật
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-2xl p-3">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="flex items-start justify-between p-4 border-b">
                <h3 className="text-xl font-semibold">Thêm địa chỉ mới</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdd}>
                <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="sm:col-span-3">
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Họ tên
                      </label>
                      <input
                        type="text"
                        required
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Số điện thoại
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Tỉnh/Thành phố
                      </label>
                      <select
                        required
                        value={selectedProvince?.Id ?? ""}
                        onChange={(e) => {
                          const p =
                            provinces.find((p) => p.Id === e.target.value) ||
                            null;
                          setSelectedProvince(p);
                          setSelectedDistrict(null);
                          setSelectedWard(null);
                        }}
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      >
                        <option value="">-- Chọn tỉnh/thành --</option>
                        {provinces.map((p) => (
                          <option key={p.Id} value={p.Id}>
                            {p.Name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Quận/Huyện
                      </label>
                      <select
                        required
                        value={selectedDistrict?.Id ?? ""}
                        onChange={(e) => {
                          const d =
                            selectedProvince?.Districts.find(
                              (d) => d.Id === e.target.value
                            ) || null;
                          setSelectedDistrict(d);
                          setSelectedWard(null);
                        }}
                        disabled={!selectedProvince}
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      >
                        <option value="">-- Chọn quận/huyện --</option>
                        {selectedProvince?.Districts.map((d) => (
                          <option key={d.Id} value={d.Id}>
                            {d.Name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Phường/Xã
                      </label>
                      <select
                        required
                        value={selectedWard?.Id ?? ""}
                        onChange={(e) => {
                          const w =
                            selectedDistrict?.Wards.find(
                              (w) => w.Id === e.target.value
                            ) || null;
                          setSelectedWard(w);
                        }}
                        disabled={!selectedDistrict}
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      >
                        <option value="">-- Chọn phường/xã --</option>
                        {selectedDistrict?.Wards.map((w) => (
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
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Địa chỉ chi tiết
                    </label>
                    <input
                      type="text"
                      required
                      value={detailAddress}
                      onChange={(e) => setDetailAddress(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div className="mt-4 flex items-center">
                    <input
                      id="defaultAdd"
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500 focus:ring-2"
                    />
                    <label
                      htmlFor="defaultAdd"
                      className="ml-2 text-sm font-medium text-gray-900"
                    >
                      Đặt làm địa chỉ mặc định
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 p-4 border-t">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-6 py-2.5 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700"
                  >
                    Thêm địa chỉ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showEditModal && editingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-2xl p-3">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="flex items-start justify-between p-4 border-b">
                <h3 className="text-xl font-semibold">Chỉnh sửa địa chỉ</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate}>
                <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                  <div className="grid grid-cols-6 gap-6 text-left">
                    <div className="sm:col-span-3">
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Họ tên
                      </label>
                      <input
                        name="fullname"
                        type="text"
                        required
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Số điện thoại
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Tỉnh/Thành phố
                      </label>
                      <select
                        required
                        value={selectedProvince?.Id ?? ""}
                        onChange={(e) => {
                          const prov =
                            provinces.find((p) => p.Id === e.target.value) ||
                            null;
                          setSelectedProvince(prov);
                          setSelectedDistrict(null);
                          setSelectedWard(null);
                        }}
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      >
                        <option value="">-- Chọn tỉnh/thành --</option>
                        {provinces.map((p) => (
                          <option key={p.Id} value={p.Id}>
                            {p.Name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Quận/Huyện
                      </label>
                      <select
                        required
                        value={selectedDistrict?.Id ?? ""}
                        onChange={(e) => {
                          const dist =
                            selectedProvince?.Districts.find(
                              (d) => d.Id === e.target.value
                            ) || null;
                          setSelectedDistrict(dist);
                          setSelectedWard(null);
                        }}
                        disabled={!selectedProvince}
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      >
                        <option value="">-- Chọn quận/huyện --</option>
                        {selectedProvince?.Districts.map((d) => (
                          <option key={d.Id} value={d.Id}>
                            {d.Name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Phường/Xã
                      </label>
                      <select
                        required
                        value={selectedWard?.Id ?? ""}
                        onChange={(e) => {
                          const w =
                            selectedDistrict?.Wards.find(
                              (w) => w.Id === e.target.value
                            ) || null;
                          setSelectedWard(w);
                        }}
                        disabled={!selectedDistrict}
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      >
                        <option value="">-- Chọn phường/xã --</option>
                        {selectedDistrict?.Wards.map((w: Ward) => (
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
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Địa chỉ chi tiết
                    </label>
                    <input
                      type="text"
                      required
                      value={detailAddress}
                      onChange={(e) => setDetailAddress(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div className="mt-4 flex items-center">
                    <input
                      id="isDefaultEdit"
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500 focus:ring-2"
                    />
                    <label
                      htmlFor="isDefaultEdit"
                      className="ml-2 text-sm font-medium text-gray-900"
                    >
                      Đặt làm địa chỉ mặc định
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-4 border-t">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
                  >
                    Xóa
                  </button>
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-6 py-2.5 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700"
                  >
                    Cập nhật
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Addresses;
