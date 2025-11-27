import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { db } from "./db.js";
import bcrypt from "bcrypt"; //mã hóa mk
import jwt from "jsonwebtoken"; //xác thực users
import { RowDataPacket, ResultSetHeader } from "mysql2";

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
// import { ReceiptEuroIcon } from "lucide-react";
// import { error } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface User extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  address: string;
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

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

// interface BlogItem extends RowDataPacket {
//   blog_id: number;
//   title: string;
//   description: string | null;
//   image_url: string | null;
//   post_date: string;
//   comments_count: number;
// }

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());


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
const JWT_SECRET = "secretkey";

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Không có token" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    req.user = decoded as { id: number; role: string };
    next();
  });
};

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

app.get("/api/voucher", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM voucher");
    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi truy vấn voucher:", error);
    res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
  }
});

app.post("/api/admin/voucher/add", upload.single("image"), async (req: Request, res: Response) => {
  const {title, description, quantity, start_date, end_date, status, discount_type, discount_value} = req.body;
  const image_url = req.file ? `/images/${req.file.filename}` : null;

  try {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO voucher (title, description, image_url, quantity, start_date, end_date, status, discount_type, discount_value)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        image_url,
        quantity,
        start_date,
        end_date,
        status === "on" ? 1 : 0,
        discount_type,
        discount_value,
      ]
    );
    res.json({message: "Thêm voucher thành công!", voucher_id: result.insertId });
  } catch (error) {
    console.error("Lỗi thêm voucher:", error);
    res.status(500).json({error: "Không thể thêm voucher"});
  }
});

app.put("/api/admin/voucher/:id", upload.single("image"), async (req: Request, res: Response) => {
  const voucherId = Number(req.params.id);
  if (isNaN(voucherId)) return res.status(400).json({ error: "ID không hợp lệ" });

  const {
    title,
    description,
    quantity: quantityStr,
    start_date: startDateStr,
    end_date: endDateStr,
    status: statusStr,
    discount_type,
    discount_value: discountValueStr
  } = req.body as {
    title?: string;
    description?: string;
    quantity?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    discount_type?: string;
    discount_value?: string;
  };

  const image_url = req.file ? `/images/${req.file.filename}` : undefined;

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (title !== undefined && title.trim() !== "") {
    updates.push("title = ?");
    values.push(title.trim());
  }

  if (description !== undefined) {
    updates.push("description = ?");
    values.push(description.trim() || null);
  }

  if (image_url) {
    updates.push("image_url = ?");
    values.push(image_url);
  }

  if (quantityStr !== undefined && quantityStr.trim() !== "") {
    const quantity = Number(quantityStr);
    if (!isNaN(quantity) && quantity >= 0) {
      updates.push("quantity = ?");
      values.push(quantity);
    }
  }

  if (startDateStr && startDateStr.trim() !== "") {
    updates.push("start_date = ?");
    values.push(startDateStr);
  }

  if (endDateStr && endDateStr.trim() !== "") {
    updates.push("end_date = ?");
    values.push(endDateStr);
  }

  if (statusStr !== undefined) {
    const status = statusStr === "true" || statusStr === "1" || statusStr === "on" ? 1 : 0;
    updates.push("status = ?");
    values.push(status);
  }

  if (discount_type !== undefined && discount_type.trim() !== "") {
    if (discount_type !== "percent" && discount_type !== "fixed") {
      return res.status(400).json({ error: "discount_type phải là 'percent' hoặc 'fixed'" });
    }
    updates.push("discount_type = ?");
    values.push(discount_type);
  }

  if (discountValueStr !== undefined && discountValueStr.trim() !== "") {
    const discountValue = Number(discountValueStr);
    if (isNaN(discountValue) || discountValue < 0) {
      return res.status(400).json({ error: "discount_value không hợp lệ" });
    }
    updates.push("discount_value = ?");
    values.push(discountValue);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "Không có dữ liệu để cập nhật" });
  }

  values.push(voucherId);

  try {
    await db.query(`UPDATE voucher SET ${updates.join(", ")} WHERE voucher_id = ?`, values);
    res.json({ message: "Cập nhật voucher thành công" });
  } catch (error) {
    console.error("Lỗi cập nhật:", error);
    res.status(500).json({ error: "Không thể cập nhật" });
  }
});

app.delete("/api/admin/voucher/:id", async (req: Request, res:Response) => {
  const id = Number(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ error: "ID không hợp lệ"});

  try {
    const [result] = await db.query<ResultSetHeader>(`DELETE FROM voucher WHERE voucher_id = ?`, [id])
    if (result.affectedRows === 0){
      return res.status(400).json({ error: "Không tìm thấy voucher"});
    }
    res.json({ message: "Xóa voucher thành công!"});
  } catch (error) {
    console.error("Lỗi xóa voucher:", error);
    res.status(500).json({error: "Lỗi server khi xóa"});
  }
});

app.patch("/api/admin/voucher/bulk-status", async (req: Request, res: Response) => {
  const { ids, status } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Danh sách ID không hợp lệ" });
  }
  if (status !== 0 && status !== 1) {
    return res.status(400).json({ error: "Trạng thái phải là 0 hoặc 1" });
  }

  const conn = await db.getConnection();

  try {
    const placeholders = ids.map(() => "?").join(", ");
    const query = `UPDATE voucher SET status = ? WHERE voucher_id IN (${placeholders})`;

    await conn.query(query, [status, ...ids]);

    res.json({ message: "Cập nhật trạng thái thành công", count: ids.length });
  } catch (error) {
    console.error("Lỗi bulk update status:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật trạng thái" });
  } finally {
    conn.release();
  }
});

app.delete("/api/admin/voucher/bulk-delete", async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: number[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Danh sách ID không hợp lệ" });
  }

  const validIds = ids.filter(id => typeof id === "number" && id > 0);
  if (validIds.length === 0) return res.status(400).json({ error: "Không có ID hợp lệ" });

  try {
    const [result] = await db.query<ResultSetHeader>(
      "DELETE FROM voucher WHERE voucher_id IN (?)",
      [validIds]
    );
    res.json({ message: `Đã xóa ${result.affectedRows} voucher!` });
  } catch (error) {
    console.error("Lỗi xóa hàng loạt:", error);
    res.status(500).json({ error: "Lỗi server" });
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
    const image_url = req.file ? `/images/${req.file.filename}` : null;

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

app.put(
  "/api/admin/menu/:id",
  upload.single("image"),
  async (req: Request, res: Response) => {
    const menuId = Number(req.params.id);
    if (isNaN(menuId)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const {
      name,
      description,
      category_id,
      price_small,
      price_medium,
      price_large,
      status,
    } = req.body;
    const image_url = req.file ? `/images/${req.file.filename}` : null;

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const updateFields: string[] = [];
      const updateValues: (string | number | null)[] = [];

      if (name) {
        updateFields.push("name = ?");
        updateValues.push(name);
      }
      if (description !== undefined) {
        updateFields.push("description = ?");
        updateValues.push(description || null);
      }
      if (category_id) {
        updateFields.push("category_id = ?");
        updateValues.push(Number(category_id));
      }
      if (image_url) {
        updateFields.push("image_url = ?");
        updateValues.push(image_url);
      }
      if (status !== undefined) {
        const statusVal = status === "1" ? 1 : 0;
        updateFields.push("status = ?");
        updateValues.push(statusVal);
      }

      if (updateFields.length > 0) {
        updateValues.push(menuId);
        await conn.query(
          `UPDATE menu SET ${updateFields.join(", ")} WHERE menu_id = ?`,
          updateValues
        );
      }

      const sizes = [
        { size: "Small", price: parseFloat(price_small || "0") },
        { size: "Medium", price: parseFloat(price_medium || "0") },
        { size: "Large", price: parseFloat(price_large || "0") },
      ].filter((s) => !isNaN(s.price) && s.price > 0);

      await conn.query(`DELETE FROM menu_sizes WHERE menu_id = ?`, [menuId]);

      if (sizes.length > 0) {
        const values = sizes.map((s) => [menuId, s.size, s.price]);
        await conn.query(
          `INSERT INTO menu_sizes (menu_id, size, price) VALUES ?`,
          [values]
        );
      }

      await conn.commit();
      res.json({ message: "Cập nhật thành công!" });
    } catch (error) {
      await conn.rollback();
      console.error("Lỗi cập nhật món:", error);
      res.status(500).json({ error: "Không thể cập nhật món" });
    } finally {
      conn.release();
    }
  }
);

app.patch("/api/admin/menu/bulk-status", async (req: Request, res: Response) => {
  const { ids, status } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Danh sách ID không hợp lệ" });
  }
  if (status !== 0 && status !== 1) {
    return res.status(400).json({ error: "Trạng thái phải là 0 hoặc 1" });
  }

  const conn = await db.getConnection();

  try {
    const placeholders = ids.map(() => "?").join(", ");
    const query = `UPDATE menu SET status = ? WHERE menu_id IN (${placeholders})`;

    await conn.query(query, [status, ...ids]);

    res.json({ message: "Cập nhật trạng thái thành công", count: ids.length });
  } catch (error) {
    console.error("Lỗi bulk update status:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật trạng thái" });
  } finally {
    conn.release();
  }
});

app.delete("/api/admin/menu/bulk-delete", async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Danh sách ID không hợp lệ" });
  }

  const menuIds = ids.filter(id => typeof id === "number" && id > 0);

  try {
    await db.query("DELETE FROM menu_sizes WHERE menu_id IN (?)", [menuIds]);

    const [result] = await db.query<ResultSetHeader>(
      "DELETE FROM menu WHERE menu_id IN (?)",
      [menuIds]
    );

    res.json({ message: `Đã xóa ${result.affectedRows} món ăn!` });
  } catch (error) {
    console.error("Lỗi bulk delete:", error);
    res.status(500).json({ error: "Lỗi server khi xóa" });
  }
});

app.delete("/api/admin/menu/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!id || id <= 0) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  try {
    await db.query("DELETE FROM menu_sizes WHERE menu_id = ?", [id]);

    const [result] = await db.query<ResultSetHeader>(
      "DELETE FROM menu WHERE menu_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy món để xóa" });
    }

    res.json({ message: "Đã xóa món thành công!" });
  } catch (error) {
    console.error("Lỗi xóa đơn:", error);
    res.status(500).json({ error: "Lỗi server khi xóa" });
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

// app.get("/api/admin/blog", async (req: Request, res: Response) => {
//   try {
//     const [rows] = await db.query<BlogItem[]>(
//       `SELECT blog_id, title, description, image_url, post_date, comments_count 
//        FROM blog 
//        ORDER BY post_date DESC`
//     );
//     res.json(rows);
//   } catch (error) {
//     console.error("Lỗi khi truy vấn blog:", error);
//     res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
//   }
// });

app.post("/api/admin/blog/add", upload.single("image"), async (req: Request, res: Response) => {
  const { title, description } = req.body;
  const image_url = req.file ? `/images/${req.file.filename}` : null;

  try {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO blog (title, description, image_url) VALUES (?, ?, ?)`,
      [title, description || null, image_url]
    );
    res.json({ message: "Thêm bài viết thành công!", blog_id: result.insertId });
  } catch (error) {
    console.error("Lỗi thêm blog:", error);
    res.status(500).json({ error: "Không thể thêm bài viết" });
  }
});

app.put("/api/admin/blog/:id", upload.single("image"), async (req: Request, res: Response) => {
  const blogId = Number(req.params.id);
  if (isNaN(blogId)) return res.status(400).json({ error: "ID không hợp lệ" });

  const { title, description } = req.body as { title?: string; description?: string };
  const image_url = req.file ? `/images/${req.file.filename}` : undefined;

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (title !== undefined) { updates.push("title = ?"); values.push(title); }
  if (description !== undefined) { updates.push("description = ?"); values.push(description || null); }
  if (image_url) { updates.push("image_url = ?"); values.push(image_url); }

  if (updates.length === 0) {
    return res.status(400).json({ error: "Không có dữ liệu để cập nhật" });
  }

  values.push(blogId);

  try {
    await db.query(`UPDATE blog SET ${updates.join(", ")} WHERE blog_id = ?`, values);
    res.json({ message: "Cập nhật bài viết thành công!" });
  } catch (error) {
    console.error("Lỗi cập nhật blog:", error);
    res.status(500).json({ error: "Không thể cập nhật" });
  }
});

app.delete("/api/admin/blog/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ error: "ID không hợp lệ" });

  try {
    const [result] = await db.query<ResultSetHeader>("DELETE FROM blog WHERE blog_id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
    }
    res.json({ message: "Xóa bài viết thành công!" });
  } catch (error) {
    console.error("Lỗi xóa blog:", error);
    res.status(500).json({ error: "Lỗi server khi xóa" });
  }
});

app.delete("/api/admin/blog/bulk-delete", async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: number[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Danh sách ID không hợp lệ" });
  }

  const validIds = ids.filter(id => typeof id === "number" && id > 0);
  if (validIds.length === 0) return res.status(400).json({ error: "Không có ID hợp lệ" });

  try {
    const [result] = await db.query<ResultSetHeader>(
      "DELETE FROM blog WHERE blog_id IN (?)",
      [validIds]
    );
    res.json({ message: `Đã xóa ${result.affectedRows} bài viết!` });
  } catch (error) {
    console.error("Lỗi xóa hàng loạt:", error);
    res.status(500).json({ error: "Lỗi server" });
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

app.get("/api/user/:id", async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  try {
    const [userRows] = await db.query<RowDataPacket[]>(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const user = userRows[0] as { id: number; username: string; email: string; role: string };

    const [billing] = await db.query<RowDataPacket[]>(
        `SELECT bd.phone, bd.address, bd.ward, bd.district, bd.city
        FROM orders o
        INNER JOIN billing_details bd ON o.order_id = bd.order_id
        WHERE o.id = ?
        ORDER BY o.created_at DESC   -- Sửa từ order_date → created_at
        LIMIT 1`,
        [userId]
    );

    let phone: string | null = null;
    let address: string | null = null;

    if (billing.length > 0) {
      const b = billing[0];
      phone = b.phone || null;

      const parts = [b.address, b.ward, b.district, b.city].filter(Boolean);
      address = parts.length > 0 ? parts.join(", ") : null;
    }
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
      phone,
      address
    });

  } catch (error) {
    console.error("Lỗi khi truy vấn người dùng:", error);
    res.status(500).json({ message: "Lỗi truy vấn cơ sở dữ liệu" });
  }
});

app.post("/api/admin/user/add", upload.none(), async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin!" });
  }

  if (!["admin", "employee", "user"].includes(role)) {
    return res.status(400).json({ error: "Vai trò không hợp lệ!" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const [existing] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ error: "Email đã tồn tại!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await conn.query<ResultSetHeader>(
      `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
      [username, email, hashedPassword, role]
    );

    await conn.commit();
    res.json({ message: "Thêm nhân sự thành công!", id: userResult.insertId });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi thêm nhân sự:", error);
    res.status(500).json({ 
      error: "Không thể thêm nhân sự",
    });
  } finally {
    conn.release();
  }
});

app.put("/api/admin/user/:id", upload.none(), async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) return res.status(400).json({error: "ID không hợp lệ"});
  const {role} = req.body as { role?: string };

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (role !== undefined) {
    updates.push("role = ?");
    values.push(role);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "Không có dữ liệu để cập nhật"});
  }

  values.push(userId);

  try {
    await db.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
    res.json({ message: "Cập nhật nhân sự thành công!"});
  } catch (error) {
    console.error("Lỗi cập nhật: ", error);
    res.status(500).json({error: "Không thể cập nhật"});
  }
});

app.delete("/api/admin/user/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id || id <=0) return res.status(400).json({error: "ID không hợp lệ"});

  try {
    const [result] = await db.query<ResultSetHeader>("DELETE FROM users WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(400).json({error: "Không tìm thấy nhân sự"});
    }
    res.json({message: "Xóa nhân sự thành công!"});
  } catch (error) {
    console.error("Lỗi xóa nhân sự: ", error);
    res.status(500).json({error: "Lỗi server khi xóa"});
  }
});

app.get("/api/cart", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const [cartRows] = await db.query<RowDataPacket[]>(
      "SELECT cart_id FROM cart WHERE id = ?",
      [userId]
    );

    let cartId: number;

    if (cartRows.length === 0) {
      const [newCart] = await db.query<ResultSetHeader>(
        "INSERT INTO cart (id) VALUES (?)",
        [userId]
      );
      cartId = newCart.insertId;
    } else {
      cartId = (cartRows[0] as { cart_id: number }).cart_id;
    }

    const [items] = await db.query<RowDataPacket[]>(
      `
      SELECT 
        ci.cart_item_id,
        ci.menu_id,
        ci.size,
        ci.quantity,
        ci.price,
        m.name,
        m.description,
        m.image_url
      FROM cart_items ci
      JOIN menu m ON ci.menu_id = m.menu_id
      WHERE ci.cart_id = ?
    `,
      [cartId]
    );

    res.json(items);
  } catch (error) {
    console.error("Lỗi lấy giỏ hàng:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

app.post("/api/cart/add", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { menu_id, size, quantity = 1 } = req.body;

  if (!menu_id || !size) {
    return res.status(400).json({ message: "Thiếu thông tin sản phẩm" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const [cartRows] = await conn.query<RowDataPacket[]>(
      "SELECT cart_id FROM cart WHERE id = ?",
      [userId]
    );

    let cartId: number;
    if (cartRows.length === 0) {
      const [newCart] = await conn.query<ResultSetHeader>(
        "INSERT INTO cart (id) VALUES (?)",
        [userId]
      );
      cartId = newCart.insertId;
    } else {
      cartId = (cartRows[0] as { cart_id: number }).cart_id;
    }

    const [priceRows] = await conn.query<RowDataPacket[]>(
      "SELECT price FROM menu_sizes WHERE menu_id = ? AND size = ?",
      [menu_id, size]
    );

    if (priceRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: "Kích thước không hợp lệ cho sản phẩm này" });
    }
    const price = (priceRows[0] as { price: number }).price;

    const [existingRows] = await conn.query<RowDataPacket[]>(
      "SELECT cart_item_id FROM cart_items WHERE cart_id = ? AND menu_id = ? AND size = ?",
      [cartId, menu_id, size]
    );

    if (existingRows.length > 0) {
      const cartItemId = (existingRows[0] as { cart_item_id: number }).cart_item_id;
      await conn.query(
        "UPDATE cart_items SET quantity = quantity + ? WHERE cart_item_id = ?",
        [quantity, cartItemId]
      );
    } else {
      await conn.query(
        "INSERT INTO cart_items (cart_id, menu_id, size, quantity, price) VALUES (?, ?, ?, ?, ?)",
        [cartId, menu_id, size, quantity, price]
      );
    }

    await conn.commit();
    res.json({ message: "Đã thêm vào giỏ hàng!" });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi thêm vào giỏ hàng:", error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    conn.release();
  }
});

app.delete("/api/cart/item/:cart_item_id", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const cart_item_id = Number(req.params.cart_item_id);

  if (!cart_item_id || isNaN(cart_item_id)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 1 FROM cart_items ci 
       JOIN cart c ON ci.cart_id = c.cart_id 
       WHERE ci.cart_item_id = ? AND c.id = ?`,
      [cart_item_id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy món" });
    }

    await db.query("DELETE FROM cart_items WHERE cart_item_id = ?", [cart_item_id]);
    res.json({ message: "Đã xóa" });
  } catch (error) {
    console.error("Lỗi xóa món:", error);
    res.status(500).json({ error: "Lỗi server" });
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
