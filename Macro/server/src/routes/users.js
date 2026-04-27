import express from "express";
import sql from "mssql";
import { getPool, requireAuth } from "../index.js";

const router = express.Router();

// POST /users/register
router.post("/register", requireAuth, async (req, res) => {
  const { username, displayName } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .input("username", sql.NVarChar, username)
      .input("displayName", sql.NVarChar, displayName)
      .query(`
        INSERT INTO users (firebase_uid, username, display_name)
        VALUES (@firebaseUid, @username, @displayName)
      `);
    res.status(201).json({ message: "User created" });
  } catch (err) {
    if (err.message.includes("UNIQUE KEY constraint")) {
    return res.status(409).json({ error: "Username already taken" });
    }
    console.error("Full SQL error:", err);
    res.status(500).json({ error: err.message });
    }
}); //

// GET /users/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query(`
        SELECT id, username, display_name, avatar_url, bio, status, created_at
        FROM users WHERE firebase_uid = @firebaseUid
      `);
    if (!result.recordset[0]) return res.status(404).json({ error: "User not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /users/me
router.patch("/me", requireAuth, async (req, res) => {
  const { displayName, bio, avatarUrl, status } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .input("displayName", sql.NVarChar, displayName)
      .input("bio", sql.NVarChar, bio)
      .input("avatarUrl", sql.NVarChar, avatarUrl)
      .input("status", sql.NVarChar, status)
      .query(`
        UPDATE users
        SET display_name = @displayName,
            bio = @bio,
            avatar_url = @avatarUrl,
            status = @status
        WHERE firebase_uid = @firebaseUid
      `);
    res.json({ message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id
router.get("/:id", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("id", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT id, username, display_name, avatar_url, bio, status, created_at
        FROM users WHERE id = @id
      `);
    if (!result.recordset[0]) return res.status(404).json({ error: "User not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id/reviews
router.get("/:id/reviews", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("userId", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT r.*, u.username, u.display_name, u.avatar_url
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.user_id = @userId
        ORDER BY r.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id/catalog
router.get("/:id/catalog", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("userId", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT * FROM catalog_entries
        WHERE user_id = @userId
        ORDER BY added_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users/me/catalog
router.post("/me/catalog", requireAuth, async (req, res) => {
  const { igdbId, status, playHours } = req.body;
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("igdbId", sql.NVarChar, igdbId)
      .input("status", sql.NVarChar, status)
      .input("playHours", sql.Int, playHours || 0)
      .query(`
        INSERT INTO catalog_entries (user_id, igdb_id, status, play_hours)
        VALUES (@userId, @igdbId, @status, @playHours)
      `);
    res.status(201).json({ message: "Game added to catalog" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;