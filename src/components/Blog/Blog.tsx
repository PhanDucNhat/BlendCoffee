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

const Blog: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch("http://localhost:5173/api/blog");
        if (!response.ok) {
          throw new Error("Lỗi khi tải dữ liệu blog");
        }
        const data: BlogPost[] = await response.json();
        const sortedBlogs = data
          .sort(
            (a, b) =>
              new Date(b.post_date).getTime() - new Date(a.post_date).getTime()
          )
          .slice(0, 3);

        setBlogs(sortedBlogs);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu blog:", error);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <section className="w-full bg-[#111] text-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-bold uppercase mb-4">
            Recent from blog
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Far far away, behind the word mountains, far from the countries
            Vokalia and Consonantia, there live the blind texts.
          </p>
        </div>

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

              <div className="p-6">
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
  );
};

export default Blog;
