import express from "express";
import sql from "mssql";
import { getPool, requireAuth } from "../index.js";
import { logActivity } from "./feed.js";

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

    const insertResult = await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("igdbId", sql.NVarChar, igdbId)
      .input("rating", sql.Int, rating)
      .input("body", sql.NVarChar, body)
      .input("title", sql.NVarChar, title || null)
      .input("coverUrl", sql.NVarChar, coverUrl || null)
      .query(`
        INSERT INTO reviews (user_id, igdb_id, rating, body, title, cover_url)
        OUTPUT INSERTED.id
        VALUES (@userId, @igdbId, @rating, @body, @title, @coverUrl)
      `);

    const reviewId = insertResult.recordset[0].id; // ← get the inserted id

    await logActivity(pool, {   // ← log after insert
      userId,
      type: 'review',
      igdbId,
      reviewId,
    });

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

    // get the review so we have its igdb_id for the activity log
    const review = await pool.request()
      .input("reviewId", sql.UniqueIdentifier, req.params.id)
      .query("SELECT igdb_id FROM reviews WHERE id = @reviewId");

    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("reviewId", sql.UniqueIdentifier, req.params.id)
      .query(`
        INSERT INTO likes (user_id, review_id)
        VALUES (@userId, @reviewId)
      `);

    await logActivity(pool, {   // ← log after insert
      userId,
      type: 'like',
      igdbId: review.recordset[0]?.igdb_id,
      reviewId: req.params.id,
    });

    res.status(201).json({ message: "Liked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reviews/:id/replies
router.post("/:id/replies", requireAuth, async (req, res) => {
  const { body, parentReplyId } = req.body;
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;

    // get the review so we have its igdb_id
    const review = await pool.request()
      .input("reviewId", sql.UniqueIdentifier, req.params.id)
      .query("SELECT igdb_id FROM reviews WHERE id = @reviewId");

    const insertResult = await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("reviewId", sql.UniqueIdentifier, req.params.id)
      .input("parentReplyId", sql.UniqueIdentifier, parentReplyId || null)
      .input("body", sql.NVarChar, body)
      .query(`
        INSERT INTO replies (user_id, review_id, parent_reply_id, body)
        OUTPUT INSERTED.id
        VALUES (@userId, @reviewId, @parentReplyId, @body)
      `);

    const replyId = insertResult.recordset[0].id; // ← get inserted id

    await logActivity(pool, {   // ← log after insert
      userId,
      type: 'reply',
      igdbId: review.recordset[0]?.igdb_id,
      reviewId: req.params.id,
      replyId,
    });

    res.status(201).json({ message: "Reply created" });
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