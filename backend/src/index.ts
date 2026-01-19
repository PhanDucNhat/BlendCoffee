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
import crypto from "crypto";
import qs from "qs";
import { vnpayConfig } from "./config/vnpay.config.js";

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
  is_banned: number;
  banned_until: Date | null;
  ban_reason: string | null;
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
  addressBook?: boolean;
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

interface Blog extends RowDataPacket {
  blog_id: number;
  title: string;
  description: string;
  image_url: string;
  post_date: Date;
  comments_count: number;
  created_at: Date;
  updated_at: Date;
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
  status: "pending" | "processing" | "completed" | "canceled";
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

interface CategoryStat extends RowDataPacket {
  label: string;
  order_count: number;
}

interface TopUserStat extends RowDataPacket {
  username: string | null;
  email: string | null;
  order_count: number;
  total_spent: number;
}

interface TopProductStat extends RowDataPacket {
  name: string;
  image_url: string | null;
  sold_count: number;
  revenue: number;
}

interface SummaryStats extends RowDataPacket {
  count: number
  revenue: number | null;
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
    return (subtotal * Number(voucher.discount_value)) / 10;
  }

  return Number(voucher.discount_value);
};

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}


const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

function sortVnpParams(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }
  return sorted;
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
const JWT_SECRET = "secretkey";

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Không có token" });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    const user = decoded as { id: number; role: string };
    
    if (user.role === 'user') {
      try {
        const [userRows] = await db.query<RowDataPacket[]>(
          "SELECT is_banned, banned_until, ban_reason FROM users WHERE id = ?",
          [user.id]
        );

        if (userRows.length > 0) {
          const userData = userRows[0] as { is_banned: number; banned_until: Date | null; ban_reason: string | null };
          
          if (userData.is_banned === 1) {
            if (!userData.banned_until) {
              return res.status(403).json({ 
                message: "Tài khoản của bạn đã bị chặn vĩnh viễn",
                reason: userData.ban_reason,
                banned: true
              });
            }

            const now = new Date();
            const bannedUntil = new Date(userData.banned_until);

            if (now < bannedUntil) {
              return res.status(403).json({ 
                message: "Tài khoản của bạn đã bị chặn",
                reason: userData.ban_reason,
                bannedUntil: bannedUntil.toISOString(),
                banned: true
              });
            } else {
              await db.query(
                "UPDATE users SET is_banned = 0, banned_until = NULL, ban_reason = NULL WHERE id = ?",
                [user.id]
              );
            }
          }
        }
      } catch (error) {
        console.error("Lỗi kiểm tra ban status:", error);
        return res.status(500).json({ message: "Lỗi server" });
      }
    }

    req.user = user;
    next();
  });
};

const createOrderFromCart = async (
  conn: PoolConnection,
  userId: number,
  payload: CheckoutPayload,
  voucherId: number | null,
  discountAmount: number,
  deliveryFee: number,
  paymentMethod: "cash" | "bank_transfer"
): Promise<number> => {
  const { cartId, items, subtotal } = await fetchCartDetails(conn, userId);

  if (!cartId || items.length === 0) {
    throw new Error("Giỏ hàng trống");
  }

  const total = subtotal + deliveryFee - discountAmount;

  const [orderRes] = await conn.query<ResultSetHeader>(
    `
    INSERT INTO orders
      (id, voucher_id, subtotal, delivery_fee, discount, total, payment_method, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      voucherId,
      subtotal,
      deliveryFee,
      discountAmount,
      total,
      paymentMethod,
      "pending",
    ]
  );

  const orderId = orderRes.insertId;

  const orderItems = items.map((item) => [
    orderId,
    item.menu_id,
    item.size,
    item.quantity,
    item.price,
  ]);

  await conn.query(
    `INSERT INTO order_items (order_id, menu_id, size, quantity, price) VALUES ?`,
    [orderItems]
  );

  const billing = payload.billing;

  await conn.query(
    `
    INSERT INTO billing_details
      (order_id, fullname, address, ward, district, city, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      orderId,
      billing.fullName,
      billing.address,
      billing.wardName ?? null,
      billing.districtName ?? null,
      billing.provinceName ?? null,
      billing.phone,
    ]
  );

  return orderId;
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
    const [rows] = await db.query("SELECT * FROM blog ORDER BY post_date DESC");
    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi truy vấn blog:", error);
    res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
  }
});

app.get("/api/blog/:id", async (req: Request, res: Response) => {
  const blogId = Number(req.params.id);
  
  if (isNaN(blogId) || blogId <= 0) {
    return res.status(400).json({ error: "ID blog không hợp lệ" });
  }

  try {
    const [rows] = await db.query<Blog[]>(
      "SELECT * FROM blog WHERE blog_id = ?",
      [blogId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết blog:", error);
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

app.get("/api/blog/:id", async (req: Request, res: Response) => {
  const blogId = Number(req.params.id);
  if (isNaN(blogId)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM blog WHERE blog_id = ?",
      [blogId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Lỗi khi truy vấn blog chi tiết:", error);
    res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
  }
});

app.get("/api/blog/related/:id", async (req: Request, res: Response) => {
  const blogId = Number(req.params.id);
  if (isNaN(blogId)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT blog_id, title, image_url, post_date 
       FROM blog 
       WHERE blog_id != ? 
       ORDER BY post_date DESC 
       LIMIT 5`,
      [blogId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi truy vấn bài viết liên quan:", error);
    res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
  }
});

app.get("/api/blog/:id/comments", async (req: Request, res: Response) => {
  const blogId = Number(req.params.id);
  if (isNaN(blogId)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT comment_id, user_name, content, created_at 
       FROM blog_comments 
       WHERE blog_id = ? 
       ORDER BY created_at DESC`,
      [blogId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi truy vấn bình luận:", error);
    res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
  }
});

app.post("/api/blog/:id/comments", async (req: Request, res: Response) => {
  const blogId = Number(req.params.id);
  if (isNaN(blogId)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  const { user_name, content } = req.body;

  if (!user_name || !content) {
    return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
  }

  if (user_name.trim().length === 0 || content.trim().length === 0) {
    return res.status(400).json({ error: "Tên và nội dung không được để trống" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const [blogRows] = await conn.query<RowDataPacket[]>(
      "SELECT blog_id FROM blog WHERE blog_id = ?",
      [blogId]
    );

    if (blogRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Bài viết không tồn tại" });
    }

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO blog_comments (blog_id, user_name, content) VALUES (?, ?, ?)`,
      [blogId, user_name.trim(), content.trim()]
    );

    await conn.query(
      `UPDATE blog SET comments_count = (
        SELECT COUNT(*) FROM blog_comments WHERE blog_id = ?
      ) WHERE blog_id = ?`,
      [blogId, blogId]
    );

    await conn.commit();

    const [newComment] = await conn.query<RowDataPacket[]>(
      `SELECT comment_id, user_name, content, created_at 
       FROM blog_comments 
       WHERE comment_id = ?`,
      [result.insertId]
    );

    res.json({
      message: "Thêm bình luận thành công!",
      comment: newComment[0]
    });

  } catch (error) {
    await conn.rollback();
    console.error("Lỗi thêm bình luận:", error);
    res.status(500).json({ error: "Không thể thêm bình luận" });
  } finally {
    conn.release();
  }
});

app.get("/api/user", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.created_at,
        u.is_banned,
        u.banned_until,
        u.ban_reason,
        COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN o.status = 'canceled' THEN 1 END) as canceled_orders
      FROM users u
      LEFT JOIN orders o ON u.id = o.id
      WHERE u.role = 'user'
      GROUP BY u.id, u.username, u.email, u.created_at, u.is_banned, u.banned_until, u.ban_reason
      ORDER BY u.created_at DESC
    `);
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
        ORDER BY o.created_at DESC
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

app.delete("/api/admin/user/bulk-delete", async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: number[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Danh sách ID không hợp lệ" });
  }

  const validIds = ids.filter(id => typeof id === "number" && id > 0);
  if (validIds.length === 0) return res.status(400).json({ error: "Không có ID hợp lệ" });

  try {
    const [result] = await db.query<ResultSetHeader>(
      "DELETE FROM users WHERE id IN (?) AND role = 'user'",
      [validIds]
    );
    res.json({ message: `Đã xóa ${result.affectedRows} người dùng!` });
  } catch (error) {
    console.error("Lỗi xóa hàng loạt:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

app.get("/api/admin/user/:id/orders", async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  try {
    const [orders] = await db.query<RowDataPacket[]>(`
      SELECT 
        o.order_id,
        o.total,
        o.payment_method,
        o.status,
        o.created_at,
        bd.fullname,
        bd.phone,
        bd.address,
        bd.ward,
        bd.district,
        bd.city
      FROM orders o
      LEFT JOIN billing_details bd ON o.order_id = bd.order_id
      WHERE o.id = ?
      ORDER BY o.created_at DESC
    `, [userId]);

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await db.query<RowDataPacket[]>(`
          SELECT 
            oi.menu_id,
            oi.size,
            oi.quantity,
            oi.price,
            m.name,
            m.image_url
          FROM order_items oi
          LEFT JOIN menu m ON oi.menu_id = m.menu_id
          WHERE oi.order_id = ?
        `, [order.order_id]);

        return {
          ...order,
          items
        };
      })
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error("Lỗi lấy lịch sử đơn hàng:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

app.post("/api/admin/user/:id/ban", async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const { duration, reason, customDuration } = req.body as {
    duration: string;
    reason: string;
    customDuration?: number;
  };

  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  if (!reason || reason.trim() === "") {
    return res.status(400).json({ error: "Vui lòng nhập lý do chặn" });
  }

  try {
    let bannedUntil: Date | null = null;

    if (duration !== "permanent") {
      const now = new Date();
      let durationInHours = 0;

      switch (duration) {
        case "1h":
          durationInHours = 1;
          break;
        case "24h":
          durationInHours = 24;
          break;
        case "7d":
          durationInHours = 24 * 7;
          break;
        case "30d":
          durationInHours = 24 * 30;
          break;
        case "custom":
          if (!customDuration || customDuration <= 0) {
            return res.status(400).json({ error: "Thời gian tùy chỉnh không hợp lệ" });
          }
          durationInHours = customDuration;
          break;
        default:
          return res.status(400).json({ error: "Thời gian chặn không hợp lệ" });
      }

      bannedUntil = new Date(now.getTime() + durationInHours * 60 * 60 * 1000);
    }

    await db.query(
      `UPDATE users SET is_banned = 1, banned_until = ?, ban_reason = ? WHERE id = ? AND role = 'user'`,
      [bannedUntil, reason.trim(), userId]
    );

    res.json({ 
      message: "Chặn người dùng thành công!",
      bannedUntil: bannedUntil ? bannedUntil.toISOString() : null
    });
  } catch (error) {
    console.error("Lỗi chặn người dùng:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

app.post("/api/admin/user/:id/unban", async (req: Request, res: Response) => {
  const userId = Number(req.params.id);

  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  try {
    await db.query(
      `UPDATE users SET is_banned = 0, banned_until = NULL, ban_reason = NULL WHERE id = ? AND role = 'user'`,
      [userId]
    );

    res.json({ message: "Bỏ chặn người dùng thành công!" });
  } catch (error) {
    console.error("Lỗi bỏ chặn người dùng:", error);
    res.status(500).json({ error: "Lỗi server" });
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
  const payload = req.body as CheckoutPayload;
  const { billing, paymentMethod = "cash", voucherCode, addressBook } = payload;

  if (
    !billing?.fullName?.trim() ||
    !billing.phone?.trim() ||
    !billing.address?.trim() ||
    !billing.provinceName?.trim()
  ) {
    return res.status(400).json({ message: "Thiếu thông tin giao hàng" });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const { cartId, items, subtotal } = await fetchCartDetails(conn, userId);
    if (!cartId || items.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    let discountAmount = 0;
    let voucherId: number | null = null;

    if (voucherCode) {
      const voucher = await fetchVoucher(conn, voucherCode, true);
      if (!voucher || !validateVoucherActive(voucher)) {
        await conn.rollback();
        return res.status(400).json({ message: "Voucher không hợp lệ" });
      }

      discountAmount = Math.min(calculateDiscountAmount(voucher, subtotal), subtotal);
      voucherId = voucher.voucher_id;
    }

    const deliveryFee = 0;
    const total = subtotal + deliveryFee - discountAmount;

    if (total <= 0) {
      await conn.rollback();
      return res.status(400).json({ message: "Tổng tiền không hợp lệ" });
    }

    if (paymentMethod === "cash") {
      if (voucherId) {
        await conn.query(
          "UPDATE voucher SET quantity = quantity - 1 WHERE voucher_id = ?",
          [voucherId]
        );
      }

      const orderId = await createOrderFromCart(
        conn,
        userId,
        payload,
        voucherId,
        discountAmount,
        deliveryFee,
        "cash"
      );

      const { cartId } = await fetchCartDetails(conn, userId);
      if (cartId) {
        await conn.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
        await conn.query("DELETE FROM cart WHERE cart_id = ?", [cartId]);
      }
      if (addressBook) {
  const addressPayload = {
    fullname: billing.fullName.trim(),
    phone: billing.phone.trim(),
    detail_address: billing.address.trim(),
    ward: billing.wardName?.trim() || '',
    district: billing.districtName?.trim() || '',
    city: billing.provinceName?.trim() || '',
    is_default: 0,
  };

  const [existing] = await conn.query<RowDataPacket[]>(
    `SELECT 1 FROM addresses WHERE id = ? AND fullname = ? AND phone = ? AND detail_address = ? AND ward = ? AND district = ? AND city = ?`,
    [userId, addressPayload.fullname, addressPayload.phone, addressPayload.detail_address, addressPayload.ward, addressPayload.district, addressPayload.city]
  );

  if (existing.length === 0) {
    await conn.query(
      `INSERT INTO addresses (id, fullname, phone, detail_address, ward, district, city, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, addressPayload.fullname, addressPayload.phone, addressPayload.detail_address, addressPayload.ward, addressPayload.district, addressPayload.city, 0]
    );
  }
}
      await conn.commit();
      return res.json({ message: "Đặt hàng thành công", order_id: orderId });
    }

    const orderId = await createOrderFromCart(
      conn,
      userId,
      payload,
      voucherId,
      discountAmount,
      deliveryFee,
      "bank_transfer"
    );

    await conn.query("UPDATE orders SET status = 'pending' WHERE order_id = ?", [orderId]);

    await conn.commit();

    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const createDate = vnTime.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);

    const ipAddr =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const txnRef = `UID${userId}_${Date.now()}`;

    const vnp_Params: Record<string, string> = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Amount: Math.round(total * 100000).toString(),
      vnp_CreateDate: createDate,
      vnp_CurrCode: "VND",
      vnp_IpAddr: ipAddr,
      vnp_Locale: "vn",
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: "other",
      vnp_ReturnUrl: "http://localhost:5173/api/vnpay/return",
      vnp_TxnRef: txnRef,
    };

    const sortedParams = sortVnpParams(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const secureHash = crypto
      .createHmac("sha512", vnpayConfig.vnp_HashSecret)
      .update(signData)
      .digest("hex");

    const paymentUrl =
      vnpayConfig.vnp_Url +
      "?" +
      qs.stringify({ ...sortedParams, vnp_SecureHash: secureHash }, { encode: false });

    return res.json({ payment_url: paymentUrl });
  } catch (err) {
    await conn.rollback();
    console.error("Checkout error:", err);
    return res.status(500).json({ message: "Checkout thất bại" });
  } finally {
    conn.release();
  }
});

app.get("/api/vnpay/ipn", async (req: Request, res: Response) => {
  const vnp_Params = req.query as Record<string, string>;
  const secureHash = vnp_Params.vnp_SecureHash;

  if (!secureHash) {
    return res.json({ RspCode: "97", Message: "Missing secure hash" });
  }

  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  const sortedParams = sortVnpParams(vnp_Params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const signed = crypto
    .createHmac("sha512", vnpayConfig.vnp_HashSecret)
    .update(signData)
    .digest("hex");

  if (secureHash !== signed) {
    return res.json({ RspCode: "97", Message: "Invalid signature" });
  }

  if (vnp_Params.vnp_ResponseCode !== "00") {
    return res.json({ RspCode: "00", Message: "Payment failed" });
  }

  const txnRef = vnp_Params.vnp_TxnRef;
  const userIdMatch = txnRef?.match(/^UID(\d+)_/);
  if (!userIdMatch) {
    return res.json({ RspCode: "01", Message: "Invalid txnRef" });
  }
  const userId = Number(userIdMatch[1]);

  const orderInfo = vnp_Params.vnp_OrderInfo;
  const orderIdMatch = orderInfo.match(/Thanh toan don hang (\d+)/);
  if (!orderIdMatch) {
    return res.json({ RspCode: "02", Message: "Invalid order info" });
  }
  const orderId = parseInt(orderIdMatch[1]);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orderRows] = await conn.query<RowDataPacket[]>(
      "SELECT voucher_id FROM orders WHERE order_id = ?",
      [orderId]
    );
    const voucherId = orderRows[0]?.voucher_id;

    if (voucherId) {
      const [result] = await conn.query<ResultSetHeader>(
        "UPDATE voucher SET quantity = quantity - 1 WHERE voucher_id = ? AND quantity > 0",
        [voucherId]
      );
      if (result.affectedRows === 0) {
        await conn.rollback();
        return res.json({ RspCode: "05", Message: "Voucher expired or out of stock" });
      }
    }

    await conn.query("UPDATE orders SET status = 'completed' WHERE order_id = ?", [orderId]);

    const { cartId } = await fetchCartDetails(conn, userId);
    if (cartId) {
      await conn.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
      await conn.query("DELETE FROM cart WHERE cart_id = ?", [cartId]);
    }

    await conn.commit();
    return res.json({ RspCode: "00", Message: "Success" });
  } catch (error) {
    await conn.rollback();
    console.error("VNPay IPN Error:", error);
    return res.json({ RspCode: "99", Message: "Internal error" });
  } finally {
    conn.release();
  }
});

app.get("/api/vnpay/return", async (req: Request, res: Response) => {
  const vnp_Params = req.query as Record<string, string>;
  const secureHash = vnp_Params.vnp_SecureHash;

  if (!secureHash) {
    return res.redirect(`http://localhost:5173/cart?error=no_hash`);
  }

  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  const sortedParams = sortVnpParams(vnp_Params);
  const signData = qs.stringify(sortedParams, { encode: false });

  const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  const signed = hmac.update(signData).digest("hex");

  const orderInfo = vnp_Params.vnp_OrderInfo;
  const orderIdMatch = orderInfo.match(/Thanh toan don hang (\d+)/);
  if (!orderIdMatch) {
    return res.redirect(`http://localhost:5173/cart?error=invalid_order_info`);
  }
  const orderId = parseInt(orderIdMatch[1]);

  const txnRef = vnp_Params.vnp_TxnRef;
  const userIdMatch = txnRef?.match(/^UID(\d+)_/);
  if (!userIdMatch) {
    return res.redirect(`http://localhost:5173/cart?error=invalid_txn_ref`);
  }
  const userId = Number(userIdMatch[1]);

  if (secureHash === signed) {
    if (vnp_Params.vnp_ResponseCode === "00") {
      const conn = await db.getConnection();
      try {
        const { cartId } = await fetchCartDetails(conn, userId);
        if (cartId) {
          await conn.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
          await conn.query("DELETE FROM cart WHERE cart_id = ?", [cartId]);
        }
      } catch (error) {
        console.error("Error clearing cart on return:", error);
      } finally {
        conn.release();
      }
      res.redirect(`http://localhost:5173/orderdetail/${orderId}`);
    } else {
      const conn = await db.getConnection();
      try {
        await conn.query("DELETE FROM orders WHERE order_id = ?", [orderId]);
        await conn.query("DELETE FROM order_items WHERE order_id = ?", [orderId]);
        await conn.query("DELETE FROM billingdetails WHERE order_id = ?", [orderId]);
      } catch (error) {
        console.error("Error deleting pending order:", error);
      } finally {
        conn.release();
      }
      res.redirect(`http://localhost:5173/cart`);
    }
  } else {
    res.redirect(`http://localhost:5174/cart?error=invalid_signature`);
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
      discount_type: voucher.discount_type,
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

app.post("/api/orders/:id/complete", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const orderId = Number(req.params.id);

  if (isNaN(orderId) || orderId <= 0) {
    return res.status(400).json({ message: "ID đơn hàng không hợp lệ" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const [orders] = await conn.query<RowDataPacket[]>(
      `SELECT status FROM orders WHERE order_id = ? AND id = ?`,
      [orderId, userId]
    );

    if (orders.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const currentStatus = orders[0].status;

    if (currentStatus !== "processing") {
      await conn.rollback();
      return res.status(400).json({
        message: "Chỉ có thể xác nhận nhận hàng khi đơn hàng đang ở trạng thái Đang giao"
      });
    }

    await conn.query(
      `UPDATE orders SET status = 'completed' WHERE order_id = ?`,
      [orderId]
    );

    await conn.commit();
    res.json({ message: "Đã xác nhận nhận hàng thành công!" });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi xác nhận nhận hàng:", error);
    res.status(500).json({ message: "Lỗi server khi xác nhận nhận hàng" });
  } finally {
    conn.release();
  }
});

app.delete("/api/orders/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
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
        message: "Chỉ có thể xóa đơn hàng khi đang ở trạng thái Chờ xác nhận"
      });
    }

    await conn.query(`DELETE FROM order_items WHERE order_id = ?`, [orderId]);
    await conn.query(`DELETE FROM billing_details WHERE order_id = ?`, [orderId]);
    await conn.query(`DELETE FROM orders WHERE order_id = ?`, [orderId]);
    if (voucherId) {
      await conn.query(
        `UPDATE voucher SET quantity = quantity + 1 WHERE voucher_id = ? AND quantity < 9999`,
        [voucherId]
      );
    }

    await conn.commit();
    res.json({ message: "Đã xóa đơn hàng thành công!" });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi xóa đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server khi xóa đơn hàng" });
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
      discountAmount = Math.min(calculateDiscountAmount(voucher, subtotal), subtotal);
      voucherId = voucher.voucher_id;
      await conn.query(
        "UPDATE voucher SET quantity = quantity - 1 WHERE voucher_id = ?",
        [voucherId]
      );
    }

    const deliveryFee = 0;
    const rawTotal = subtotal + deliveryFee - discountAmount;
    const total = Number(rawTotal.toFixed(3));
    const vnpayAmount = total * 100000;

    if (total <= 0) {
      await conn.rollback();
      return res.status(400).json({ message: "Tổng đơn hàng không hợp lệ" });
    }

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
        total,
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
    if (paymentMethod === "bank_transfer") {
      const now = new Date();
      const vnOffset = 7 * 60 * 60 * 1000;
      const vnTime = new Date(now.getTime() + vnOffset);

      const createDate = vnTime.getUTCFullYear().toString().padStart(4, '0') +
        (vnTime.getUTCMonth() + 1).toString().padStart(2, '0') +
        vnTime.getUTCDate().toString().padStart(2, '0') +
        vnTime.getUTCHours().toString().padStart(2, '0') +
        vnTime.getUTCMinutes().toString().padStart(2, '0') +
        vnTime.getUTCSeconds().toString().padStart(2, '0');

      const ipAddr =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "127.0.0.1";

      const {
        vnp_TmnCode: tmnCode,
        vnp_HashSecret: secretKey,
        vnp_Url: vnpUrl,
      } = vnpayConfig;

      const txnRef = `ORD${orderId}_${Date.now()}`;
      const rawReturnUrl = `http://localhost:5173/admin/order?order_id=${orderId}`;

      const vnp_Params: Record<string, string> = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Amount: vnpayAmount.toString(),
        vnp_CreateDate: createDate,
        vnp_CurrCode: "VND",
        vnp_IpAddr: ipAddr,
        vnp_Locale: "vn",
        vnp_OrderInfo: `Thanh toan don hang #${orderId} (Admin tao)`,
        vnp_OrderType: "other",
        vnp_ReturnUrl: rawReturnUrl,
        vnp_TxnRef: txnRef,
      };

      const sortedParams = sortVnpParams(vnp_Params);

      const signData = qs.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac("sha512", secretKey);
      const secureHash = hmac.update(signData).digest("hex");

      const paymentUrl = vnpUrl + "?" + qs.stringify({ ...sortedParams, vnp_SecureHash: secureHash }, { encode: false });

      return res.json({
        order_id: orderId,
        payment_url: paymentUrl,
        payment_method: "bank_transfer",
      });
    }
    return res.json({
      message: "Thêm đơn hàng thành công",
      order_id: orderId,
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discountAmount.toFixed(2)),
      total: total,
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

app.delete("/api/admin/orders", async (req: Request, res: Response) => {
  const { ids } = req.body as { ids?: number[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Danh sách đơn cần xóa rỗng" });
  }

  const validIds = ids.filter((id) => typeof id === "number" && id > 0);
  if (validIds.length === 0) {
    return res.status(400).json({ message: "Không có ID hợp lệ" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const placeholders = validIds.map(() => "?").join(", ");
    await conn.query(`DELETE FROM order_items WHERE order_id IN (${placeholders})`, validIds);
    await conn.query(`DELETE FROM billing_details WHERE order_id IN (${placeholders})`, validIds);
    const [result] = await conn.query<ResultSetHeader>(
      `DELETE FROM orders WHERE order_id IN (${placeholders})`,
      validIds
    );

    await conn.commit();

    res.json({
      message: `Đã xóa ${result.affectedRows} đơn`,
      count: result.affectedRows,
    });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi xóa đơn:", error);
    res.status(500).json({ message: "Không thể xóa đơn" });
  } finally {
    conn.release();
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
const [existing] = await conn.query<RowDataPacket[]>(
    `SELECT 1 FROM addresses WHERE id = ? AND fullname = ? AND phone = ? AND detail_address = ? AND ward = ? AND district = ? AND city = ?`,
    [userId, fullname.trim(), phone.trim(), detail_address.trim(), ward.trim(), district.trim(), city.trim()]
  );

  if (existing.length > 0) {
    await conn.rollback();
    return res.status(400).json({ message: "Địa chỉ này đã tồn tại trong sổ địa chỉ" });
  }

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
      "SELECT COUNT(*) as count FROM orders WHERE status = 'completed' AND created_at >= ? AND created_at < ?",
      [startOfDay, endOfDay]
    );
    const orderCount = (orderCountResult[0] as { count: number }).count;

    const [revenueResult] = await db.query<RowDataPacket[]>(
      "SELECT SUM(total) as revenue FROM orders WHERE status = 'completed' AND created_at >= ? AND created_at < ?",
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
        cancel: statusMap.canceled || 0,
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Lỗi truy vấn thống kê" });
  }
});

app.get("/api/admin/statistics", async (req: Request, res: Response) => {
  const { start_date, end_date } = req.query as {
    start_date?: string;
    end_date?: string;
  };

  if (!start_date || !end_date) {
    return res.status(400).json({ message: "Thiếu tham số start_date và end_date" });
  }

  let startDate: Date;
  let endDate: Date;

  try {
    const inputDate = new Date(start_date);
    startDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
    
    const inputEndDate = new Date(end_date);
    endDate = new Date(inputEndDate.getFullYear(), inputEndDate.getMonth(), inputEndDate.getDate() + 1);
  } catch {
    return res.status(400).json({ message: "Định dạng ngày không hợp lệ (YYYY-MM-DD)" });
  }

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ message: "Ngày không hợp lệ" });
  }

  const conn = await db.getConnection();
  try {
    const [orderCountRows] = await db.query<SummaryStats[]>(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'completed' AND created_at >= ? AND created_at < ?",
      [startDate, endDate]
    );
    const orderCount = orderCountRows[0].count;

    const [canceledCountRows] = await db.query<SummaryStats[]>(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'canceled' AND created_at >= ? AND created_at < ?",
      [startDate, endDate]
    );
    const canceledCount = canceledCountRows[0].count;

    const [revenueRows] = await db.query<SummaryStats[]>(
      "SELECT SUM(total) as revenue FROM orders WHERE status = 'completed' AND created_at >= ? AND created_at < ?",
      [startDate, endDate]
    );
    const revenue = Number(revenueRows[0].revenue ?? 0);

    const [productCountRows] = await db.query<SummaryStats[]>(
      `SELECT COALESCE(SUM(oi.quantity), 0) as count 
       FROM order_items oi 
       JOIN orders o ON oi.order_id = o.order_id 
       WHERE o.status = 'completed' AND o.created_at >= ? AND o.created_at < ?`,
      [startDate, endDate]
    );
    const productCount = Number(productCountRows[0].count ?? 0);

    const [categoryStats] = await db.query<CategoryStat[]>(
      `SELECT 
         COALESCE(c.category_name, 'Khác') AS label,
         COALESCE(SUM(oi.quantity), 0) AS order_count
       FROM order_items oi
       JOIN menu m ON oi.menu_id = m.menu_id
       JOIN menu_category c ON m.category_id = c.category_id
       JOIN orders o ON oi.order_id = o.order_id
       WHERE o.status = 'completed' AND o.created_at >= ? AND o.created_at < ?
       GROUP BY c.category_id, c.category_name
       ORDER BY order_count DESC`,
      [startDate, endDate]
    );

    const [topUsers] = await db.query<TopUserStat[]>(
      `SELECT 
         COALESCE(u.username, 'Khách lẻ') AS username,
         u.email,
         COUNT(o.order_id) AS order_count,
         COALESCE(SUM(o.total), 0) AS total_spent
       FROM orders o
       LEFT JOIN users u ON o.id = u.id
       WHERE o.status = 'completed' AND o.created_at >= ? AND o.created_at < ?
       GROUP BY o.id, u.username, u.email
       ORDER BY order_count DESC
       LIMIT 5`,
      [startDate, endDate]
    );

    const [topProducts] = await db.query<TopProductStat[]>(
      `SELECT 
         m.name,
         m.image_url,
         SUM(oi.quantity) AS sold_count,
         SUM(oi.quantity * oi.price) AS revenue
       FROM order_items oi
       JOIN menu m ON oi.menu_id = m.menu_id
       JOIN orders o ON oi.order_id = o.order_id
       WHERE o.status = 'completed' AND o.created_at >= ? AND o.created_at < ?
       GROUP BY m.menu_id, m.name, m.image_url
       ORDER BY sold_count DESC
       LIMIT 5`,
      [startDate, endDate]
    );

    res.json({
      summary: {
        orderCount,
        canceledCount,
        productCount,
        revenue,
      },
      categoryChart: categoryStats.map(row => ({
        label: row.label,
        order_count: Number(row.order_count),
      })),
      topUsers: topUsers.map(row => ({
        username: row.username,
        email: row.email,
        order_count: Number(row.order_count),
        total_spent: Number(row.total_spent),
      })),
      topProducts: topProducts.map(row => ({
        name: row.name,
        image_url: row.image_url || "/images/placeholder.jpg",
        sold_count: Number(row.sold_count),
        revenue: Number(row.revenue),
      })),
    });
  } catch (error) {
    console.error("Lỗi lấy thống kê:", error);
    res.status(500).json({ message: "Lỗi server khi lấy thống kê" });
  } finally {
    conn.release();
  }
});

app.get("/api/admin/employees", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id, username, email FROM users WHERE role = 'employee' ORDER BY username"
    );
    res.json(rows);
  } catch (error) {
    console.error("Lỗi lấy danh sách nhân viên:", error);
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