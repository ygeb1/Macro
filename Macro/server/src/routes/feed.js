import express from "express";
import sql from "mssql";
import { getPool, requireAuth } from "../index.js";

const router = express.Router();

// GET /feed
router.get("/", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    const result = await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .query(`
        SELECT r.*, u.username, u.display_name, u.avatar_url, 'review' as activity_type
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.user_id IN (
          SELECT recipient_id FROM friendships
          WHERE requester_id = @userId AND status = 'accepted'
          UNION
          SELECT requester_id FROM friendships
          WHERE recipient_id = @userId AND status = 'accepted'
        )
        ORDER BY r.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;