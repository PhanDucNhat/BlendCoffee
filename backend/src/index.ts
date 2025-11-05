import express, { Request, Response } from "express";
import cors from "cors";
import { db } from "./db.js";

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

// Lấy toàn bộ menu navbar
app.get("/api/navbar", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM navbar ORDER BY order_index");
    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi truy vấn navbar:", error);
    res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
  }
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Backend chạy tại http://localhost:${PORT}`));
