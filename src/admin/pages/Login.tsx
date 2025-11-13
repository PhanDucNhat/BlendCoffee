export default function AdminLogin() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-80 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Admin Login</h2>

        <input
          type="text"
          placeholder="Username"
          className="border p-2 w-full mb-3 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-4 rounded"
        />

        <button className="w-full bg-blue-600 text-white py-2 rounded">
          Login
        </button>
      </div>
    </div>
  );
}
