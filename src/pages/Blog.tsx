import React, { useEffect, useState } from "react";
interface BlogPost {
  blog_id: number;
  title: string;
  description: string;
  image_url: string;
  post_date: string;
  comments_count?: number;
  created_at: string;
  update_at: string;
}

const Blog = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch("http://localhost:5173/api/blog");
        if (!response.ok) {
          throw new Error("Lỗi khi tải dữ liệu blog");
        }
        const data: BlogPost[] = await response.json();
        setBlogs(data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu blog:", error);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <>
      <section
        className="relative h-[80vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/bg_3.jpg')",
        }}
      >
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-5xl font-bold mb-4 mt-10">BLOG</h1>
          <p className="text-lg">
            <span className="mr-2 text-gray-300">
              <a href="/" className="hover:text-white transition">
                Home
              </a>
            </span>
            <span className="text-[#b6894b]">/ Blog</span>
          </p>
        </div>
      </section>
      <section className="w-full bg-[#111] text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {blogs.map((blog, index) => (
              <div
                key={index}
                className="bg-[#141414] hover:scale-105 transition-transform duration-500"
              >
                <a
                  href="#"
                  className="block h-64 bg-cover bg-center"
                  style={{ backgroundImage: `url(${blog.image_url})` }}
                ></a>

                <div className="p-6 text-left">
                  <div className="flex items-center gap-3 text-gray-400 text-sm mb-3">
                    <span>{new Date(blog.post_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-comment text-gray-300"></i>
                      {blog.comments_count}
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg mb-2 hover:text-[#b6894b] transition-colors">
                    <a href="#">{blog.title}</a>
                  </h3>

                  <p className="text-gray-400 text-sm leading-relaxed text-left">
                    {blog.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Blog;
