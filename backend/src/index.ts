import express, { Request, Response } from "express";
import cors from "cors";
import { db } from "./db.js";
import bcrypt from "bcrypt"; //mã hóa mk
import jwt from "jsonwebtoken"; //xác thực users
import { RowDataPacket, ResultSetHeader } from "mysql2";

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface User extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
}

interface MenuDetail extends RowDataPacket {
  menu_id: number;
  name: string;
  description: string;
  image_url: string;
  category_id: number;
  category_name: string;
  size: string;
  price: number;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../public/images");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
  cb(null, file.originalname);
}
});

const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.json());

// API test kết nối
app.get("/api/test", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi test kết nối DB:", error);
    res.status(500).json({ error: "Không thể kết nối cơ sở dữ liệu" });
  }
});

app.get("/api/navbar", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM navbar ORDER BY order_index");
    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi truy vấn navbar:", error);
    res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
  }
});

app.get("/api/menu", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        m.menu_id,
        m.name,
        m.description,
        m.image_url,
        m.category_id,
        m.status,
        c.category_name,
        s.size,
        s.price
      FROM menu m
      LEFT JOIN menu_category c ON m.category_id = c.category_id
      LEFT JOIN menu_sizes s ON m.menu_id = s.menu_id AND s.size = 'Medium'
      WHERE m.status = 1
      ORDER BY c.category_name, m.menu_id
    `);
    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi truy vấn menu:", error);
    res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
  }
});

app.post(
  "/api/admin/menu/add",
  upload.single("image"),
  async (req: Request, res: Response) => {
    const { name, description, category_id, price_small, price_medium, price_large, status } = req.body;
    const image_url = req.file ? `images/${req.file.filename}` : null;

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const [menuResult] = await conn.query<ResultSetHeader>(
  `INSERT INTO menu (name, description, image_url, category_id, status) 
   VALUES (?, ?, ?, ?, ?)`,
  [
    name,
    description || null,
    image_url,
    category_id,
    status === "on" ? 1 : 0,
  ]
);

const menuId = menuResult.insertId;

      const sizes = [
        { size: "Small", price: parseFloat(price_small) },
        { size: "Medium", price: parseFloat(price_medium) },
        { size: "Large", price: parseFloat(price_large) },
      ].filter((s) => !isNaN(s.price) && s.price > 0);

      if (sizes.length > 0) {
        const values = sizes.map((s) => [menuId, s.size, s.price]);
        await conn.query(
          `INSERT INTO menu_sizes (menu_id, size, price) VALUES ?`,
          [values]
        );
      }

      await conn.commit();
      res.json({ message: "Thêm món thành công!", menu_id: menuId });
    } catch (error) {
      await conn.rollback();
      console.error("Lỗi thêm món:", error);
      res.status(500).json({ error: "Không thể thêm món" });
    } finally {
      conn.release();
    }
  }
);

app.get("/api/menu/:id", async (req: Request, res: Response) => {
  try {
    const menuId = Number(req.params.id);
    if (isNaN(menuId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const [rows] = await db.query<MenuDetail[]>(
      `
        SELECT 
          m.menu_id,
          m.name,
          m.description,
          m.image_url,
          m.category_id,
          c.category_name,
          s.size,
          s.price
        FROM menu m
        LEFT JOIN menu_category c ON m.category_id = c.category_id
        LEFT JOIN menu_sizes s ON m.menu_id = s.menu_id
        WHERE m.menu_id = ?
        ORDER BY s.size
      `,
      [menuId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi truy vấn singleproduct:", error);
    res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
  }
});

app.get("/api/admin/menu-sizes", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        m.menu_id,
        m.name,
        m.description,
        m.image_url,
        m.category_id,
        m.status,
        c.category_name,
        s.size,
        s.price
      FROM menu m
      LEFT JOIN menu_category c ON m.category_id = c.category_id
      LEFT JOIN menu_sizes s ON m.menu_id = s.menu_id
      WHERE s.size IS NOT NULL
      ORDER BY m.menu_id, 
               FIELD(s.size, 'Small', 'Medium', 'Large')
    `);

    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi truy vấn menu admin:", error);
    res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT category_id, category_name FROM menu_category");
    res.json(rows);
  } catch (err) {
    console.error("Lỗi lấy danh mục:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});


app.get("/api/blog", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM blog");
    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi truy vấn blog:", error);
    res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
  }
});

app.get("/api/user", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi truy vấn user:", error);
    res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
  }
});

app.post("/api/signup", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  try {
    const [users] = await db.query<User[]>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length > 0) {
      return res.status(400).json({ message: "Email đã tồn tại!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    res.json({ message: "Đăng ký thành công!" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.post("/api/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query<User[]>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Email không tồn tại!" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu!" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      "secretkey",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Đăng nhập thành công!",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend chạy tại http://localhost:${PORT}`));
