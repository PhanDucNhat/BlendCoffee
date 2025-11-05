import React from "react";
interface BlogPost {
  image: string;
  date: string;
  author: string;
  comments: number;
  title: string;
  description: string;
}

const blogs: BlogPost[] = [
  {
    image: "/images/image_1.jpg",
    date: "Sept 10, 2018",
    author: "Admin",
    comments: 3,
    title: "The Delicious Pizza",
    description:
      "A small river named Duden flows by their place and supplies it with the necessary regelialia.",
  },
  {
    image: "/images/image_2.jpg",
    date: "Sept 10, 2018",
    author: "Admin",
    comments: 3,
    title: "The Delicious Pizza",
    description:
      "A small river named Duden flows by their place and supplies it with the necessary regelialia.",
  },
  {
    image: "/images/image_3.jpg",
    date: "Sept 10, 2018",
    author: "Admin",
    comments: 3,
    title: "The Delicious Pizza",
    description:
      "A small river named Duden flows by their place and supplies it with the necessary regelialia.",
  },
  {
    image: "/images/image_4.jpg",
    date: "Sept 10, 2018",
    author: "Admin",
    comments: 3,
    title: "The Delicious Pizza",
    description:
      "A small river named Duden flows by their place and supplies it with the necessary regelialia.",
  },
  {
    image: "/images/image_5.jpg",
    date: "Sept 10, 2018",
    author: "Admin",
    comments: 3,
    title: "The Delicious Pizza",
    description:
      "A small river named Duden flows by their place and supplies it with the necessary regelialia.",
  },
  {
    image: "/images/image_6.jpg",
    date: "Sept 10, 2018",
    author: "Admin",
    comments: 3,
    title: "The Delicious Pizza",
    description:
      "A small river named Duden flows by their place and supplies it with the necessary regelialia.",
  },
];

const Blog = () => {
  return (
    <>
      <section
        className="relative h-[80vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/bg_3.jpg')",
        }}
      >
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-5xl font-bold mb-4 mt-10">Our Menu</h1>
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
                  style={{ backgroundImage: `url(${blog.image})` }}
                ></a>

                <div className="p-6 text-left">
                  <div className="flex items-center gap-3 text-gray-400 text-sm mb-3">
                    <span>{blog.date}</span>
                    <span>{blog.author}</span>
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-comment text-gray-300"></i>
                      {blog.comments}
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
