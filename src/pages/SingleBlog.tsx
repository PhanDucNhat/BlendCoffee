import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

interface BlogPost {
  blog_id: number;
  title: string;
  description: string;
  image_url: string;
  post_date: string;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

interface Comment {
  comment_id: number;
  user_name: string;
  content: string;
  created_at: string;
}

interface RelatedBlog {
  blog_id: number;
  title: string;
  image_url: string;
  post_date: string;
}

const SingleBlog: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<RelatedBlog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        setLoading(true);
        const blogResponse = await fetch(`http://localhost:5000/api/blog/${id}`);

        if (!blogResponse.ok) {
          if (blogResponse.status === 404) {
            throw new Error("Bài viết không tồn tại");
          }
          throw new Error("Không thể tải bài viết");
        }

        const blogData = await blogResponse.json();
        setBlog(blogData);

        try {
          const relatedResponse = await fetch(`http://localhost:5000/api/blog`);
          if (relatedResponse.ok) {
            const allBlogs = await relatedResponse.json();
            const related = allBlogs
              .filter((b: BlogPost) => b.blog_id !== parseInt(id!))
              .slice(0, 3);
            setRelatedBlogs(related);
          }
        } catch (err) {
          console.log("Could not fetch related blogs:", err);
        }
        setComments([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBlogData();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !userName.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await fetch(`http://localhost:5000/api/blog/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_name: userName.trim(),
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setComments((prev) => [result.comment, ...prev]);
        setNewComment("");
        setUserName("");

        if (blog) {
          setBlog((prev) =>
            prev ? { ...prev, comments_count: prev.comments_count + 1 } : null
          );
        }

        alert("Bình luận đã được gửi thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể gửi bình luận");
      }
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Có lỗi xảy ra khi gửi bình luận"
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = (platform: string) => {
    if (!blog) return;

    const url = window.location.href;
    const title = blog.title;

    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          url
        )}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#b6894b] mx-auto mb-4"></div>
          <p className="text-white">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="mb-6">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-500 mb-4">Lỗi</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/blog")}
            className="bg-[#b6894b] text-white px-6 py-3 rounded-lg hover:bg-[#a67c43] transition-colors"
          >
            Quay lại danh sách bài viết
          </button>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy bài viết</h2>
          <button
            onClick={() => navigate("/blog")}
            className="bg-[#b6894b] text-white px-6 py-3 rounded-lg hover:bg-[#a67c43] transition-colors"
          >
            Quay lại danh sách bài viết
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111]">
      <section
        className="relative h-[40vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/bg_3.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{blog.title}</h1>
          <div className="flex items-center justify-center space-x-2 text-lg">
            <Link to="/" className="hover:text-[#b6894b] transition-colors">
              Trang chủ
            </Link>
            <span className="text-gray-300">/</span>
            <Link to="/blog" className="hover:text-[#b6894b] transition-colors">
              Bài viết
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-[#b6894b]">Chi tiết</span>
          </div>
        </div>
      </section>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <article className="bg-[#141414] rounded-lg overflow-hidden shadow-lg">
              {blog.image_url && (
                <div className="w-full h-96 overflow-hidden">
                  <img
                    src={blog.image_url}
                    alt={blog.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/bg_1.jpg";
                    }}
                  />
                </div>
              )}

              <div className="p-8">
                <div className="flex flex-wrap items-center text-gray-400 text-sm mb-6 pb-4 border-b border-gray-700">
                  <div className="flex items-center mr-6 mb-2">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{formatDate(blog.post_date)}</span>
                  </div>

                  <div className="flex items-center mr-6 mb-2">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span>{blog.comments_count} bình luận</span>
                  </div>

                  {blog.updated_at !== blog.created_at && (
                    <div className="flex items-center mb-2">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span>Cập nhật: {formatDate(blog.updated_at)}</span>
                    </div>
                  )}
                </div>
                <div className="prose prose-lg max-w-none text-white">
                  <div
                    className="text-gray-300 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: blog.description }}
                  />
                </div>
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h4 className="text-white font-semibold mb-4">
                    Chia sẻ bài viết:
                  </h4>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleShare("facebook")}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                    </button>
                    <button
                      onClick={() => handleShare("twitter")}
                      className="bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                      Twitter
                    </button>
                    <button
                      onClick={() => handleShare("linkedin")}
                      className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn
                    </button>
                  </div>
                </div>
              </div>
            </article>
            <div className="mt-12 bg-[#141414] rounded-lg p-8">
              <h3 className="text-2xl font-bold text-white mb-6">
                Bình luận ({blog.comments_count})
              </h3>
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Tên của bạn *"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full p-4 bg-[#222] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#b6894b] focus:border-transparent"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email (tùy chọn)"
                    className="w-full p-4 bg-[#222] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#b6894b] focus:border-transparent"
                  />
                </div>
                <textarea
                  placeholder="Viết bình luận của bạn... *"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-4 bg-[#222] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#b6894b] focus:border-transparent resize-none"
                  rows={4}
                  required
                />
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="bg-[#b6894b] text-white px-6 py-3 rounded-lg hover:bg-[#a67c43] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? "Đang gửi..." : "Gửi bình luận"}
                  </button>
                </div>
              </form>
              <div className="space-y-6">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.comment_id}
                      className="border-b border-gray-700 pb-6"
                    >
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-[#b6894b] rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {comment.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">
                            {comment.user_name}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            {formatDate(comment.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-300 leading-relaxed ml-13">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-[#141414] rounded-lg p-6 mb-8">
              <button
                onClick={() => navigate("/blog")}
                className="w-full flex items-center justify-center text-[#b6894b] hover:text-white transition-colors border border-[#b6894b] hover:bg-[#b6894b] px-4 py-3 rounded-lg"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Quay lại danh sách bài viết
              </button>
            </div>
            {relatedBlogs.length > 0 && (
              <div className="bg-[#141414] rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-6">
                  Bài viết liên quan
                </h3>
                <div className="space-y-4">
                  {relatedBlogs.map((relatedBlog) => (
                    <Link
                      key={relatedBlog.blog_id}
                      to={`/blog/${relatedBlog.blog_id}`}
                      className="flex items-start space-x-3 hover:bg-[#222] p-3 rounded-lg transition-colors group"
                    >
                      <img
                        src={relatedBlog.image_url}
                        alt={relatedBlog.title}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/bg_1.jpg";
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="text-white text-sm font-medium group-hover:text-[#b6894b] transition-colors line-clamp-2">
                          {relatedBlog.title}
                        </h4>
                        <p className="text-gray-400 text-xs mt-1">
                          {formatDate(relatedBlog.post_date)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleBlog;