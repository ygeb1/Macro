import express from "express";
import sql from "mssql";
import { getPool, requireAuth } from "../index.js";

const router = express.Router();

// POST /friends/:id — send friend request
router.post("/:id", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const requesterId = user.recordset[0].id;
    await pool.request()
      .input("requesterId", sql.UniqueIdentifier, requesterId)
      .input("recipientId", sql.UniqueIdentifier, req.params.id)
      .query(`
        INSERT INTO friendships (requester_id, recipient_id)
        VALUES (@requesterId, @recipientId)
      `);
    res.status(201).json({ message: "Friend request sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /friends/:id — accept or decline
router.patch("/:id", requireAuth, async (req, res) => {
  const { status } = req.body; // "accepted" or "declined"
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("id", sql.UniqueIdentifier, req.params.id)
      .input("recipientId", sql.UniqueIdentifier, userId)
      .input("status", sql.NVarChar, status)
      .query(`
        UPDATE friendships
        SET status = @status, updated_at = GETUTCDATE()
        WHERE id = @id AND recipient_id = @recipientId
      `);
    res.json({ message: `Friend request ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /friends — get all accepted friends
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
        SELECT u.id, u.username, u.display_name, u.avatar_url, u.status
        FROM users u
        WHERE u.id IN (
          SELECT recipient_id FROM friendships
          WHERE requester_id = @userId AND status = 'accepted'
          UNION
          SELECT requester_id FROM friendships
          WHERE recipient_id = @userId AND status = 'accepted'
        )
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;