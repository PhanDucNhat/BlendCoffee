import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const LoginForm: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-[430px] bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-gray-600 hover:text-cyan-600 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Quay lại</span>
          </button>
          <h2 className="text-3xl font-semibold text-center flex-1 text-gray-900">
            {isLoginMode ? "Login" : "Sign Up"}
          </h2>
          <div className="w-[80px]" />
        </div>

        <div className="relative flex h-12 mb-6 border border-gray-300 rounded-full overflow-hidden">
          <button
            className={`w-1/2 text-lg font-medium transition-all z-10 ${
              isLoginMode ? "text-white" : "text-black"
            }`}
            onClick={() => setIsLoginMode(true)}
          >
            Login
          </button>
          <button
            className={`w-1/2 text-lg font-medium transition-all z-10 ${
              !isLoginMode ? "text-white" : "text-black"
            }`}
            onClick={() => setIsLoginMode(false)}
          >
            Signup
          </button>
          <div
            className={`absolute top-0 h-full w-1/2 rounded-full bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 transition-all ${
              isLoginMode ? "left-0" : "left-1/2"
            }`}
          ></div>
        </div>

        <form className="space-y-4">
          {!isLoginMode && (
            <input
              type="text"
              placeholder="Name"
              required
              className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            required
            className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
          />

          {!isLoginMode && (
            <input
              type="password"
              placeholder="Confirm Password"
              required
              className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
            />
          )}

          {isLoginMode && (
            <div className="text-right">
              <a href="#" className="text-cyan-600 hover:underline text-sm">
                Forgot password?
              </a>
            </div>
          )}

          <button className="w-full p-3 bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 text-white rounded-full text-lg font-medium hover:opacity-90 transition">
            {isLoginMode ? "Login" : "Signup"}
          </button>

          <p className="text-center text-gray-600 text-sm">
            {isLoginMode
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsLoginMode(!isLoginMode);
              }}
              className="text-cyan-600 hover:underline"
            >
              {isLoginMode ? "Signup now" : "Login"}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
