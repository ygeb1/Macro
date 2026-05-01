import express from "express";
import sql from "mssql";
import { getPool, requireAuth } from "../index.js";

const router = express.Router();

// POST /reviews  (body contains igdbId)
router.post("/", requireAuth, async (req, res) => {
  const { igdbId, rating, body, title, coverUrl } = req.body;
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("igdbId", sql.NVarChar, igdbId)
      .input("rating", sql.Int, rating)
      .input("body", sql.NVarChar, body)
      .input("title", sql.NVarChar, title || null)
      .input("coverUrl", sql.NVarChar, coverUrl || null)
      .query(`
        INSERT INTO reviews (user_id, igdb_id, rating, body, title, cover_url)
        VALUES (@userId, @igdbId, @rating, @body, @title, @coverUrl)
      `);
    res.status(201).json({ message: "Review created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /reviews/:id
router.patch("/:id", requireAuth, async (req, res) => {
  const { rating, body } = req.body;
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("id", sql.UniqueIdentifier, req.params.id)
      .input("userId", sql.UniqueIdentifier, userId)
      .input("rating", sql.Int, rating)
      .input("body", sql.NVarChar, body)
      .query(`
        UPDATE reviews
        SET rating = @rating, body = @body, updated_at = GETUTCDATE()
        WHERE id = @id AND user_id = @userId
      `);
    res.json({ message: "Review updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /reviews/:id
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
      .query("DELETE FROM reviews WHERE id = @id AND user_id = @userId");
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /reviews/:id/like
router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("reviewId", sql.UniqueIdentifier, req.params.id)
      .query(`
        INSERT INTO likes (user_id, review_id)
        VALUES (@userId, @reviewId)
      `);
    res.status(201).json({ message: "Liked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reviews/:id/replies
router.get("/:id/replies", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("reviewId", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT r.*, u.username, u.display_name, u.avatar_url
        FROM replies r
        JOIN users u ON r.user_id = u.id
        WHERE r.review_id = @reviewId
        ORDER BY r.created_at ASC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /reviews/:id/replies
router.post("/:id/replies", requireAuth, async (req, res) => {
  const { body, parentReplyId } = req.body;
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("reviewId", sql.UniqueIdentifier, req.params.id)
      .input("parentReplyId", sql.UniqueIdentifier, parentReplyId || null)
      .input("body", sql.NVarChar, body)
      .query(`
        INSERT INTO replies (user_id, review_id, parent_reply_id, body)
        VALUES (@userId, @reviewId, @parentReplyId, @body)
      `);
    res.status(201).json({ message: "Reply created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;