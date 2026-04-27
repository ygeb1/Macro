import express from "express";
import sql from "mssql";
import { getPool, requireAuth } from "../index.js";

const router = express.Router();

// PATCH /replies/:id
router.patch("/:id", requireAuth, async (req, res) => {
  const { body } = req.body;
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("id", sql.UniqueIdentifier, req.params.id)
      .input("userId", sql.UniqueIdentifier, userId)
      .input("body", sql.NVarChar, body)
      .query(`
        UPDATE replies
        SET body = @body, updated_at = GETUTCDATE()
        WHERE id = @id AND user_id = @userId
      `);
    res.json({ message: "Reply updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /replies/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("id", sql.UniqueIdentifier, req.params.id)
      .input("userId", sql.UniqueIdentifier, userId)
      .query("DELETE FROM replies WHERE id = @id AND user_id = @userId");
    res.json({ message: "Reply deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /replies/:id/like
router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("replyId", sql.UniqueIdentifier, req.params.id)
      .query(`
        INSERT INTO likes (user_id, reply_id)
        VALUES (@userId, @replyId)
      `);
    res.status(201).json({ message: "Reply liked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;