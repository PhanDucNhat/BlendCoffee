import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { db } from "./db.js";
import bcrypt from "bcrypt"; //mã hóa mk
import jwt from "jsonwebtoken"; //xác thực users
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { PoolConnection } from "mysql2/promise";

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { error } from "console";

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

interface CheckoutBilling {
  fullName: string;
  phone: string;
  address: string;
  provinceId?: string | null;
  provinceName?: string | null;
  districtId?: string | null;
  districtName?: string | null;
  wardId?: string | null;
  wardName?: string | null;
}

interface CheckoutPayload {
  billing: CheckoutBilling;
  note?: string;
  voucherCode?: string | null;
  paymentMethod?: "cash" | "bank_transfer";
}

interface CartItemRow extends RowDataPacket {
  cart_item_id: number;
  menu_id: number;
  size: string;
  quantity: number;
  price: number;
}

interface VoucherRow extends RowDataPacket {
  voucher_id: number;
  title: string;
  status: number;
  quantity: number;
  start_date: string | Date;
  end_date: string | Date;
  discount_type: "percent" | "fixed";
  discount_value: number;
}

interface OrderDetailRow extends RowDataPacket {
  order_id: number;
  total: number;
  payment_method: "cash" | "bank_transfer";
  status: "pending" | "processing" | "completed" | "canceled";
  created_at: Date;
  delivery_fee: number;
  discount: number;
  voucher_id: number | null;
  fullname: string;
  phone: string;
  note: string | null;
  full_address: string;
  menu_name: string;
  image_url: string;
  size: "Small" | "Medium" | "Large";
  quantity: number;
  item_price: number;
}

interface AdminOrderRow extends RowDataPacket {
  order_id: number;
  user_id: number;
  username: string | null;
  email: string | null;
  subtotal: number;
  delivery_fee: number | null;
  discount: number | null;
  total: number;
  payment_method: "cash" | "bank_transfer";
  status: "pending" | "processing" | "completed" | "canceled" | "cancel";
  created_at: Date;
  voucher_code: string | null;
  fullname: string | null;
  phone: string | null;
  full_address: string | null;
}

interface AdminOrderItemRow extends RowDataPacket {
  order_id: number;
  menu_id: number;
  name: string;
  image_url: string | null;
  size: "Small" | "Medium" | "Large";
  quantity: number;
  price: number;
}

interface AddressItem extends RowDataPacket {
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

interface OrderStatusCount extends RowDataPacket {
  status: string;
  count: number;
}

const fetchCartDetails = async (conn: PoolConnection, userId: number) => {
  const [cartRows] = await conn.query<RowDataPacket[]>(
    "SELECT cart_id FROM cart WHERE id = ?",
    [userId]
  );

  if (cartRows.length === 0) {
    return { cartId: null, items: [], subtotal: 0 };
  }

  const cartId = (cartRows[0] as { cart_id: number }).cart_id;

  const [items] = await conn.query<CartItemRow[]>(
    `SELECT cart_item_id, menu_id, size, quantity, price
     FROM cart_items
     WHERE cart_id = ?`,
    [cartId]
  );

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  return { cartId, items, subtotal };
};

const fetchVoucher = async (
  conn: PoolConnection,
  voucherCode: string,
  lock: boolean
): Promise<VoucherRow | null> => {
  if (!voucherCode.trim()) return null;

  const query = lock
    ? "SELECT * FROM voucher WHERE title = ? FOR UPDATE"
    : "SELECT * FROM voucher WHERE title = ?";

  const [voucherRows] = await conn.query<VoucherRow[]>(query, [
    voucherCode.trim(),
  ]);

  if (voucherRows.length === 0) return null;

  return voucherRows[0];
};

const validateVoucherActive = (voucher: VoucherRow) => {
  const now = new Date();
  const start = new Date(voucher.start_date);
  const end = new Date(voucher.end_date);

  return voucher.status === 1 && voucher.quantity > 0 && now >= start && now <= end;
};

const calculateDiscountAmount = (voucher: VoucherRow, subtotal: number) => {
  if (voucher.discount_type === "percent") {
    return (subtotal * Number(voucher.discount_value)) / 100;
  }

  return Number(voucher.discount_value);
};

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
  const { title, description, quantity, start_date, end_date, status, discount_type, discount_value } = req.body;
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
    res.json({ message: "Thêm voucher thành công!", voucher_id: result.insertId });
  } catch (error) {
    console.error("Lỗi thêm voucher:", error);
    res.status(500).json({ error: "Không thể thêm voucher" });
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

app.delete("/api/admin/voucher/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ error: "ID không hợp lệ" });

  try {
    const [result] = await db.query<ResultSetHeader>(`DELETE FROM voucher WHERE voucher_id = ?`, [id])
    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Không tìm thấy voucher" });
    }
    res.json({ message: "Xóa voucher thành công!" });
  } catch (error) {
    console.error("Lỗi xóa voucher:", error);
    res.status(500).json({ error: "Lỗi server khi xóa" });
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

app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM menu_category");
    res.json(rows);
  } catch (err) {
    console.error("Lỗi lấy danh mục:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

app.post("/api/admin/category/add", async (req: Request, res: Response) => {
  const { category_name, status, display } = req.body;

  try {
    await db.query(
      `UPDATE menu_category SET display = display + 1 WHERE display >= ?`,
      [display || 0]
    );

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO menu_category (category_name, status, display)
      VALUES (?, ?, ?)`,
      [category_name, status === "1" ? 1 : 0, display || 0]
    );
    res.json({ message: "Thêm danh mục thành công!", category_id: result.insertId });
  } catch (error) {
    console.error("Lỗi thêm danh mục:", error);
    res.status(500).json({ error: "Không thể thêm danh mục" });
  }
});

app.put("/api/admin/category/:id", async (req: Request, res: Response) => {
  const categoryId = Number(req.params.id);
  if (isNaN(categoryId)) return res.status(400).json({ error: "ID không hợp lệ" });

  const { category_name, status, display } = req.body as { category_name?: string; status?: string; display?: number };

  try {
    const [currentRows] = await db.query<RowDataPacket[]>(
      "SELECT display FROM menu_category WHERE category_id = ?",
      [categoryId]
    );
    if (currentRows.length === 0) return res.status(404).json({ error: "Không tìm thấy danh mục" });
    const oldDisplay = currentRows[0].display;

    if (display !== undefined && display !== oldDisplay) {
      if (display < oldDisplay) {
        await db.query(
          `UPDATE menu_category SET display = display + 1 WHERE display >= ? AND display < ? AND category_id != ?`,
          [display, oldDisplay, categoryId]
        );
      } else {
        await db.query(
          `UPDATE menu_category SET display = display - 1 WHERE display > ? AND display <= ? AND category_id != ?`,
          [oldDisplay, display, categoryId]
        );
      }
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (category_name !== undefined) { updates.push("category_name = ?"); values.push(category_name); }
    if (status !== undefined) { updates.push("status = ?"); values.push(status === "1" ? 1 : 0); }
    if (display !== undefined) { updates.push("display = ?"); values.push(display); }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Không có dữ liệu để cập nhật" });
    }

    values.push(categoryId);

    await db.query(`UPDATE menu_category SET ${updates.join(", ")} WHERE category_id = ?`, values);
    res.json({ message: "Cập nhật danh mục thành công!" });
  } catch (error) {
    console.error("Lỗi cập nhật danh mục:", error);
    res.status(500).json({ error: "Không thể cập nhật" });
  }
});

app.delete("/api/admin/category/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ error: "ID không hợp lệ" });

  try {
    const [result] = await db.query<ResultSetHeader>("DELETE FROM menu_category WHERE category_id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy danh mục" });
    }
    res.json({ message: "Xóa danh mục thành công!" });
  } catch (error) {
    console.error("Lỗi xóa danh mục:", error);
    res.status(500).json({ error: "Lỗi server khi xóa" });
  }
});

app.delete("/api/admin/category/bulk-delete", async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: number[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Danh sách ID không hợp lệ" });
  }

  const validIds = ids.filter(id => typeof id === "number" && id > 0);
  if (validIds.length === 0) return res.status(400).json({ error: "Không có ID hợp lệ" });

  try {
    const [result] = await db.query<ResultSetHeader>(
      "DELETE FROM menu_category WHERE category_id IN (?)",
      [validIds]
    );
    res.json({ message: `Đã xóa ${result.affectedRows} danh mục!` });
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

app.put("/api/admin/menu/:id", upload.single("image"), async (req: Request, res: Response) => {
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

    if (name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push("description = ?");
      updateValues.push(description || null);
    }
    if (category_id !== undefined) {
      updateFields.push("category_id = ?");
      updateValues.push(Number(category_id));
    }
    if (image_url !== null) {
      updateFields.push("image_url = ?");
      updateValues.push(image_url);
    }
    if (status !== undefined) {
      const statusVal = status === "on" || status === "1" || status === "true" ? 1 : 0;
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
    const hasPriceData =
      price_small !== undefined ||
      price_medium !== undefined ||
      price_large !== undefined;

    if (hasPriceData) {
      await conn.query(`DELETE FROM menu_sizes WHERE menu_id = ?`, [menuId]);

      const sizes = [
        { size: "Small", price: parseFloat(price_small || "0") },
        { size: "Medium", price: parseFloat(price_medium || "0") },
        { size: "Large", price: parseFloat(price_large || "0") },
      ].filter((s) => !isNaN(s.price) && s.price > 0);

      if (sizes.length > 0) {
        const values = sizes.map((s) => [menuId, s.size, s.price]);
        await conn.query(
          `INSERT INTO menu_sizes (menu_id, size, price) VALUES ?`,
          [values]
        );
      }
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
});

app.patch("/api/admin/menu/:id/status", async (req: Request, res: Response) => {
  const menuId = Number(req.params.id);
  const { status } = req.body;

  if (isNaN(menuId) || (status !== 0 && status !== 1)) {
    return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
  }
  try {
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE menu SET status = ? WHERE menu_id = ?`,
      [status, menuId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy món" });
    }
    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    console.error("Lỗi đổi status:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

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
      ORDER BY m.menu_id, 
               FIELD(s.size, 'Small', 'Medium', 'Large')
    `);

    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi truy vấn menu admin:", error);
    res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
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
  if (isNaN(userId)) return res.status(400).json({ error: "ID không hợp lệ" });
  const { role } = req.body as { role?: string };

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (role !== undefined) {
    updates.push("role = ?");
    values.push(role);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "Không có dữ liệu để cập nhật" });
  }

  values.push(userId);

  try {
    await db.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
    res.json({ message: "Cập nhật nhân sự thành công!" });
  } catch (error) {
    console.error("Lỗi cập nhật: ", error);
    res.status(500).json({ error: "Không thể cập nhật" });
  }
});

app.delete("/api/admin/user/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ error: "ID không hợp lệ" });

  try {
    const [result] = await db.query<ResultSetHeader>("DELETE FROM users WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Không tìm thấy nhân sự" });
    }
    res.json({ message: "Xóa nhân sự thành công!" });
  } catch (error) {
    console.error("Lỗi xóa nhân sự: ", error);
    res.status(500).json({ error: "Lỗi server khi xóa" });
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

app.post("/api/orders/checkout", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { billing, paymentMethod = "cash", voucherCode } = req.body as CheckoutPayload;

  if (
    !billing ||
    !billing.fullName?.trim() ||
    !billing.phone?.trim() ||
    !billing.address?.trim() ||
    !billing.provinceName?.trim()
  ) {
    return res.status(400).json({ message: "Thiếu thông tin giao hàng bắt buộc" });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const { cartId, items, subtotal } = await fetchCartDetails(conn, userId);

    if (!cartId || items.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    const deliveryFee = 0;
    let discountAmount = 0;
    let voucherId: number | null = null;

    if (voucherCode && voucherCode.trim() !== "") {
      const voucher = await fetchVoucher(conn, voucherCode, true);

      if (!voucher || !validateVoucherActive(voucher)) {
        await conn.rollback();
        return res.status(400).json({ message: "Voucher không hợp lệ hoặc đã hết hạn" });
      }

      discountAmount = calculateDiscountAmount(voucher, subtotal);
      discountAmount = Math.min(discountAmount, subtotal);
      voucherId = voucher.voucher_id;

      await conn.query(
        "UPDATE voucher SET quantity = quantity - 1 WHERE voucher_id = ?",
        [voucherId]
      );
    }

    const total = subtotal + deliveryFee - discountAmount;

    const [orderResult] = await conn.query<ResultSetHeader>(
      `INSERT INTO orders
        (id, voucher_id, subtotal, delivery_fee, discount, total, payment_method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        voucherId,
        Number(subtotal.toFixed(2)),
        deliveryFee,
        Number(discountAmount.toFixed(2)),
        Number(total.toFixed(2)),
        paymentMethod,
        "pending",
      ]
    );

    const orderId = orderResult.insertId;

    const orderItemsValues = items.map((item) => [
      orderId,
      item.menu_id,
      item.size,
      item.quantity,
      item.price,
    ]);

    await conn.query(
      "INSERT INTO order_items (order_id, menu_id, size, quantity, price) VALUES ?",
      [orderItemsValues]
    );

    await conn.query(
      `INSERT INTO billing_details
        (order_id, fullname, address, ward, district, city, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        billing.fullName.trim(),
        billing.address.trim(),
        billing.wardName ?? null,
        billing.districtName ?? null,
        billing.provinceName ?? null,
        billing.phone.trim(),
      ]
    );

    await conn.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);

    await conn.commit();

    res.json({
      message: "Đặt hàng thành công!",
      order_id: orderId,
    });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi khi tạo đơn hàng:", error);
    res.status(500).json({ message: "Không thể tạo đơn hàng" });
  } finally {
    conn.release();
  }
});

app.post("/api/voucher/apply", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { voucherCode } = req.body as { voucherCode?: string };

  if (!voucherCode || voucherCode.trim() === "") {
    return res.status(400).json({ message: "Vui lòng nhập mã voucher" });
  }

  const conn = await db.getConnection();

  try {
    const { cartId, items, subtotal } = await fetchCartDetails(conn, userId);

    if (!cartId || items.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    const voucher = await fetchVoucher(conn, voucherCode, false);

    if (!voucher || !validateVoucherActive(voucher)) {
      return res.status(400).json({ message: "Voucher không hợp lệ hoặc đã hết hạn" });
    }

    const discountAmount = Math.min(
      calculateDiscountAmount(voucher, subtotal),
      subtotal
    );
    const deliveryFee = 0;
    const total = subtotal + deliveryFee - discountAmount;

    res.json({
      message: "Áp dụng voucher thành công",
      voucher_id: voucher.voucher_id,
      discount: Number(discountAmount.toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)),
      delivery_fee: deliveryFee,
      total: Number(total.toFixed(2)),
    });
  } catch (error) {
    console.error("Lỗi áp dụng voucher:", error);
    res.status(500).json({ message: "Không thể áp dụng voucher" });
  } finally {
    conn.release();
  }
});

app.get("/api/orders", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const [orders] = await db.query<OrderDetailRow[]>(
      `SELECT o.order_id,
              o.total,
              o.payment_method,
              o.status,
              o.created_at,
              o.delivery_fee,
              o.discount,
              o.voucher_id,
              v.title as voucher_code,
              bd.fullname,
              bd.phone,
      CONCAT(
        IFNULL(bd.address, ''),
        IF(bd.ward IS NOT NULL AND bd.ward != '', CONCAT(', ', bd.ward), ''),
        IF(bd.district IS NOT NULL AND bd.district != '', CONCAT(', ', bd.district), ''),
        IF(bd.city IS NOT NULL AND bd.city != '', CONCAT(', ', bd.city), '')
      ) as full_address
      FROM orders o
      LEFT JOIN billing_details bd ON o.order_id = bd.order_id
      LEFT JOIN voucher v ON o.voucher_id = v.voucher_id
      WHERE o.id = ?
      ORDER BY o.created_at DESC`,
      [userId]
    );

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await db.query<RowDataPacket[]>(
          `SELECT oi.quantity,
                  oi.size,
                  oi.price,
                  m.name,
                  m.image_url
          FROM order_items oi
          JOIN menu m ON oi.menu_id = m.menu_id
          WHERE oi.order_id = ?
          `,
          [order.order_id]
        );

        return {
          ...order,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price * item.quantity,
            size: item.size,
            image_url: item.image_url || "/images/placeholder.jpg"
          }))
        };
      })
    );
    res.json(ordersWithItems);
  } catch {
    console.error("Lỗi lấy đơn hàng người dùng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.get("/api/orders/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const orderId = Number(req.params.id);

  if (isNaN(orderId))
    return res.status(400).json({ message: "ID không hợp lệ" });

  try {
    const [orders] = await db.query<OrderDetailRow[]>(
      `SELECT * FROM orders o
      LEFT JOIN billing_details bd ON o.order_id = bd.order_id
      WHERE o.order_id = ? AND O.id = ?`,
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const order = orders[0];
    const [items] = await db.query<RowDataPacket[]>(
      `SELECT oi.*,
                m.name,
                m.image_url
          FROM order_items oi
          JOIN menu m ON oi.menu_id = m.menu_id
          WHERE oi.order_id = ?`,
      [orderId]
    );
    res.json({ ...order, items });
  } catch (error) {
    console.error("Lỗi lấy chi tiêt đơn:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.get("/api/admin/orders", async (req: Request, res: Response) => {
  try {
    const [orders] = await db.query<AdminOrderRow[]>(
      `SELECT 
        o.order_id,
        o.id AS user_id,
        u.username,
        u.email,
        o.subtotal,
        o.delivery_fee,
        o.discount,
        o.total,
        o.payment_method,
        o.status,
        o.created_at,
        v.title AS voucher_code,
        bd.fullname,
        bd.phone,
        CONCAT(
          IFNULL(bd.address, ''),
          IF(bd.ward IS NOT NULL AND bd.ward != '', CONCAT(', ', bd.ward), ''),
          IF(bd.district IS NOT NULL AND bd.district != '', CONCAT(', ', bd.district), ''),
          IF(bd.city IS NOT NULL AND bd.city != '', CONCAT(', ', bd.city), '')
        ) AS full_address
      FROM orders o
      LEFT JOIN users u ON o.id = u.id
      LEFT JOIN billing_details bd ON o.order_id = bd.order_id
      LEFT JOIN voucher v ON o.voucher_id = v.voucher_id
      ORDER BY o.created_at DESC`
    );

    if (orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map((order) => order.order_id);
    const placeholders = orderIds.map(() => "?").join(", ");

    const [items] = await db.query<AdminOrderItemRow[]>(
      `SELECT 
        oi.order_id,
        oi.menu_id,
        oi.size,
        oi.quantity,
        oi.price,
        m.name,
        m.image_url
      FROM order_items oi
      JOIN menu m ON oi.menu_id = m.menu_id
      WHERE oi.order_id IN (${placeholders})
      ORDER BY oi.order_id`,
      orderIds
    );

    const itemsByOrder = new Map<number, AdminOrderItemRow[]>();

    items.forEach((item) => {
      if (!itemsByOrder.has(item.order_id)) {
        itemsByOrder.set(item.order_id, []);
      }
      itemsByOrder.get(item.order_id)!.push(item);
    });

    const payload = orders.map((order) => {

      const orderItems = (itemsByOrder.get(order.order_id) || []).map(
        (item) => ({
          menu_id: item.menu_id,
          name: item.name,
          image_url: item.image_url || "/images/placeholder.jpg",
          size: item.size,
          quantity: item.quantity,
          price: Number(item.price),
        })
      );

      return {
        ...order,
        status: order.status,
        subtotal: Number(order.subtotal),
        total: Number(order.total),
        delivery_fee:
          order.delivery_fee === null ? 0 : Number(order.delivery_fee),
        discount: order.discount === null ? 0 : Number(order.discount),
        items: orderItems,
      };
    });

    res.json(payload);
  } catch (error) {
    console.error("Lỗi lấy danh sách đơn hàng admin:", error);
    res.status(500).json({ message: "Không thể lấy danh sách đơn hàng" });
  }
});

app.post("/api/orders/:id/cancel", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const orderId = Number(req.params.id);

  if (isNaN(orderId) || orderId <= 0) {
    return res.status(400).json({ message: "ID đơn hàng không hợp lệ" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const [orders] = await conn.query<RowDataPacket[]>(
      `SELECT status, voucher_id FROM orders WHERE order_id = ? AND id = ?`,
      [orderId, userId]
    );

    if (orders.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const currentStatus = orders[0].status;
    const voucherId = orders[0].voucher_id;

    if (currentStatus !== "pending") {
      await conn.rollback();
      return res.status(400).json({
        message: "Chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ xác nhận"
      });
    }

    await conn.query(
      `UPDATE orders SET status = 'canceled' WHERE order_id = ?`,
      [orderId]
    );

    if (voucherId) {
      await conn.query(
        `UPDATE voucher SET quantity = quantity + 1 WHERE voucher_id = ? AND quantity < 9999`,
        [voucherId]
      );
    }

    await conn.commit();
    res.json({ message: "Đã hủy đơn hàng thành công!" });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi hủy đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server khi hủy đơn hàng" });
  } finally {
    conn.release();
  }
});

app.post("/api/admin/orders/add", async (req: Request, res: Response) => {
  const {
    adminId,
    items,
    fullname,
    phone,
    detail_address,
    provinceName,
    districtName,
    wardName,
    paymentMethod = "cash",
    voucherCode,
  } = req.body as {
    adminId?: number;
    items?: Array<{ menu_id: number; size: string; quantity: number }>;
    fullname?: string;
    phone?: string;
    detail_address?: string;
    provinceName?: string;
    districtName?: string;
    wardName?: string;
    paymentMethod?: "cash" | "bank_transfer";
    voucherCode?: string | null;
  };

  if (
    !adminId ||
    !Array.isArray(items) ||
    items.length === 0 ||
    !fullname?.trim() ||
    !phone?.trim() ||
    !detail_address?.trim() ||
    !provinceName?.trim()
  ) {
    return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    let subtotal = 0;
    const normalizedItems: Array<{
      menu_id: number;
      size: string;
      quantity: number;
      price: number;
    }> = [];

    for (const item of items) {
      const menuId = Number(item.menu_id);
      const size = String(item.size || "Medium");
      const quantity = Number(item.quantity) || 0;

      if (!menuId || quantity <= 0) {
        await conn.rollback();
        return res.status(400).json({ message: "Thông tin món không hợp lệ" });
      }

      const [priceRows] = await conn.query<RowDataPacket[]>(
        "SELECT price FROM menu_sizes WHERE menu_id = ? AND size = ?",
        [menuId, size]
      );

      if (priceRows.length === 0) {
        await conn.rollback();
        return res.status(400).json({ message: "Không tìm thấy giá cho món đã chọn" });
      }

      const price = Number((priceRows[0] as { price: number }).price);

      subtotal += price * quantity;
      normalizedItems.push({ menu_id: menuId, size, quantity, price });
    }

    let discountAmount = 0;
    let voucherId: number | null = null;

    if (voucherCode && voucherCode.trim() !== "") {
      const voucher = await fetchVoucher(conn, voucherCode, true);

      if (!voucher || !validateVoucherActive(voucher)) {
        await conn.rollback();
        return res.status(400).json({ message: "Voucher không hợp lệ hoặc đã hết hạn" });
      }

      discountAmount = Math.min(
        calculateDiscountAmount(voucher, subtotal),
        subtotal
      );
      voucherId = voucher.voucher_id;

      await conn.query(
        "UPDATE voucher SET quantity = quantity - 1 WHERE voucher_id = ?",
        [voucherId]
      );
    }

    const deliveryFee = 0;
    const total = subtotal + deliveryFee - discountAmount;

    const [orderResult] = await conn.query<ResultSetHeader>(
      `INSERT INTO orders
        (id, voucher_id, subtotal, delivery_fee, discount, total, payment_method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        voucherId,
        Number(subtotal.toFixed(2)),
        deliveryFee,
        Number(discountAmount.toFixed(2)),
        Number(total.toFixed(2)),
        paymentMethod,
        "pending",
      ]
    );

    const orderId = orderResult.insertId;

    const orderItemsValues = normalizedItems.map((item) => [
      orderId,
      item.menu_id,
      item.size,
      item.quantity,
      item.price,
    ]);

    await conn.query(
      "INSERT INTO order_items (order_id, menu_id, size, quantity, price) VALUES ?",
      [orderItemsValues]
    );

    await conn.query(
      `INSERT INTO billing_details
        (order_id, fullname, address, ward, district, city, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        fullname.trim(),
        detail_address.trim(),
        wardName?.trim() || null,
        districtName?.trim() || null,
        provinceName?.trim() || null,
        phone.trim(),
      ]
    );

    await conn.commit();

    res.json({
      message: "Thêm đơn hàng thành công",
      order_id: orderId,
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discountAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi thêm đơn hàng admin:", error);
    res.status(500).json({ message: "Không thể tạo đơn hàng" });
  } finally {
    conn.release();
  }
});

app.patch("/api/admin/orders/status", async (req: Request, res: Response) => {
  const { ids, status } = req.body as {
    ids?: number[];
    status?: "pending" | "processing" | "completed" | "canceled";
  };

  const validStatuses = ["pending", "processing", "completed", "canceled"];

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Danh sách đơn cần cập nhật rỗng" });
  }
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ" });
  }

  const validIds = ids.filter((id) => typeof id === "number" && id > 0);
  if (validIds.length === 0) {
    return res.status(400).json({ message: "Không có ID hợp lệ" });
  }

  try {
    const placeholders = validIds.map(() => "?").join(", ");
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE orders SET status = ? WHERE order_id IN (${placeholders})`,
      [status, ...validIds]
    );

    res.json({
      message: `Đã cập nhật trạng thái ${result.affectedRows} đơn`,
      count: result.affectedRows,
    });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái đơn:", error);
    res.status(500).json({ message: "Không thể cập nhật trạng thái đơn" });
  }
});

app.post("/api/change-password", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { oldPassword, newPassWord } = req.body;

  if (!oldPassword || !newPassWord) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu cũ và mới" });
  }

  if (newPassWord.length < 6) {
    return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
  }

  try {
    const [users] = await db.query<User[]>(
      `SELECT * FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassWord, 10);

    await db.query(
      `UPDATE users SET password = ? WHERE id = ?`,
      [hashedNewPassword, userId]
    );
    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.get("/api/addresses", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const [rows] = await db.query<AddressItem[]>(
      `SELECT 
        address_id, fullname, phone, detail_address, 
        ward, district, city, is_default
       FROM addresses 
       WHERE id = ?
       ORDER BY is_default DESC, address_id DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Lỗi lấy danh sách địa chỉ:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.post("/api/addresses/add", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    fullname,
    phone,
    detail_address,
    ward,
    district,
    city,
    is_default = 0,
  } = req.body;

  if (!fullname || !phone || !detail_address || !ward || !district || !city) {
    return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin địa chỉ" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    if (is_default === 1 || is_default === true) {
      await conn.query(`UPDATE addresses SET is_default = 0 WHERE id = ?`, [userId]);
    }

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO addresses 
       (id, fullname, phone, detail_address, ward, district, city, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        fullname.trim(),
        phone.trim(),
        detail_address.trim(),
        ward.trim(),
        district.trim(),
        city.trim(),
        is_default ? 1 : 0,
      ]
    );

    await conn.commit();
    res.status(201).json({
      message: "Thêm địa chỉ thành công",
      address_id: result.insertId,
    });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi thêm địa chỉ:", error);
    res.status(500).json({ message: "Không thể thêm địa chỉ" });
  } finally {
    conn.release();
  }
});

app.put("/api/addresses/update/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const addressId = Number(req.params.id);

  if (isNaN(addressId) || addressId <= 0) {
    return res.status(400).json({ message: "ID địa chỉ không hợp lệ" });
  }

  const {
    fullname,
    phone,
    detail_address,
    ward,
    district,
    city,
    is_default,
  } = req.body;

  if (!fullname || !phone || !detail_address || !ward || !district || !city) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const [existing] = await conn.query<RowDataPacket[]>(
      "SELECT 1 FROM addresses WHERE address_id = ? AND id = ?",
      [addressId, userId]
    );

    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Không tìm thấy địa chỉ hoặc bạn không có quyền" });
    }

    if (is_default === 1 || is_default === true) {
      await conn.query(`UPDATE addresses SET is_default = 0 WHERE id = ?`, [userId]);
    }

    await conn.query(
      `UPDATE addresses SET
        fullname = ?,
        phone = ?,
        detail_address = ?,
        ward = ?,
        district = ?,
        city = ?,
        is_default = ?
       WHERE address_id = ? AND id = ?`,
      [
        fullname.trim(),
        phone.trim(),
        detail_address.trim(),
        ward.trim(),
        district.trim(),
        city.trim(),
        is_default ? 1 : 0,
        addressId,
        userId,
      ]
    );

    await conn.commit();
    res.json({ message: "Cập nhật địa chỉ thành công" });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi cập nhật địa chỉ:", error);
    res.status(500).json({ message: "Không thể cập nhật địa chỉ" });
  } finally {
    conn.release();
  }
});

app.delete("/api/addresses/delete/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const addressId = Number(req.params.id);

  if (isNaN(addressId) || addressId <= 0) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  try {
    const [result] = await db.query<ResultSetHeader>(
      "DELETE FROM addresses WHERE address_id = ? AND id = ?",
      [addressId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy địa chỉ hoặc bạn không có quyền xóa" });
    }

    res.json({ message: "Xóa địa chỉ thành công" });
  } catch (error) {
    console.error("Lỗi xóa địa chỉ:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.get("/api/admin/dashboard-stats", async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [orderCountResult] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM orders WHERE created_at >= ? AND created_at < ?",
      [startOfDay, endOfDay]
    );
    const orderCount = (orderCountResult[0] as { count: number }).count;

    const [revenueResult] = await db.query<RowDataPacket[]>(
      "SELECT SUM(total) as revenue FROM orders WHERE created_at >= ? AND created_at < ?",
      [startOfDay, endOfDay]
    );
    const revenue = (revenueResult[0] as { revenue: number | null }).revenue || 0;

    const [statusCounts] = await db.query<OrderStatusCount[]>(
      "SELECT status, COUNT(*) as count FROM orders GROUP BY status"
    );

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((row) => {
      statusMap[row.status] = row.count;
    });

    res.json({
      orderCount,
      revenue,
      statusCounts: {
        pending: statusMap.pending || 0,
        processing: statusMap.processing || 0,
        completed: statusMap.completed || 0,
        cancel: statusMap.cancel || 0,
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Lỗi truy vấn thống kê" });
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
