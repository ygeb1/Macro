import express from "express";
import sql from "mssql";
import { getPool, requireAuth } from "../index.js";

const router = express.Router();

// GET /follows — get all follows for current user 
router.get("/", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;

    const [tags, userFollows] = await Promise.all([
      pool.request()
        .input("userId", sql.UniqueIdentifier, userId)
        .query("SELECT * FROM tag_follows WHERE user_id = @userId ORDER BY tag_type, tag_name"),
      pool.request()
        .input("userId", sql.UniqueIdentifier, userId)
        .query(`
          SELECT uf.*, u.username, u.display_name, u.avatar_url,
            CASE WHEN EXISTS (
              SELECT 1 FROM user_follows uf2
              WHERE uf2.follower_id = uf.following_id
              AND uf2.following_id = @userId
            ) THEN 1 ELSE 0 END as is_mutual
          FROM user_follows uf
          JOIN users u ON uf.following_id = u.id
          WHERE uf.follower_id = @userId
        `),
    ]);

    res.json({
      tags: tags.recordset,
      users: userFollows.recordset,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /follows/tags — get all tag follows for current user
router.get("/tags", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    const result = await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .query("SELECT * FROM tag_follows WHERE user_id = @userId ORDER BY tag_type, tag_name");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /follows/tags — follow a tag
router.post("/tags", requireAuth, async (req, res) => {
  const { tagType, tagId, tagName } = req.body;
  const validTypes = ['genre', 'platform', 'theme', 'keyword', 'developer', 'franchise', 'collection'];
  if (!validTypes.includes(tagType)) {
    return res.status(400).json({ error: "Invalid tag type" });
  }
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("tagType", sql.NVarChar, tagType)
      .input("tagId", sql.NVarChar, tagId)
      .input("tagName", sql.NVarChar, tagName)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM tag_follows
          WHERE user_id = @userId AND tag_type = @tagType AND tag_id = @tagId
        )
        INSERT INTO tag_follows (user_id, tag_type, tag_id, tag_name)
        VALUES (@userId, @tagType, @tagId, @tagName)
      `);
    res.status(201).json({ message: `Following ${tagType}: ${tagName}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /follows/tags/:tagType/:tagId — unfollow a tag
router.delete("/tags/:tagType/:tagId", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("tagType", sql.NVarChar, req.params.tagType)
      .input("tagId", sql.NVarChar, req.params.tagId)
      .query(`
        DELETE FROM tag_follows
        WHERE user_id = @userId AND tag_type = @tagType AND tag_id = @tagId
      `);
    res.json({ message: "Unfollowed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/*
// POST /follows/genre/:id 
router.post("/genre/:id", requireAuth, async (req, res) => {
  const { name } = req.body;
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("genreId", sql.NVarChar, req.params.id)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM genre_follows WHERE user_id = @userId AND genre_id = @genreId)
        INSERT INTO genre_follows (user_id, genre_id) VALUES (@userId, @genreId)
      `);
    res.status(201).json({ message: "Following genre" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /follows/genre/:id 
router.delete("/genre/:id", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("genreId", sql.NVarChar, req.params.id)
      .query("DELETE FROM genre_follows WHERE user_id = @userId AND genre_id = @genreId");
    res.json({ message: "Unfollowed genre" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /follows/platform/:id 
router.post("/platform/:id", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("platformId", sql.NVarChar, req.params.id)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM platform_follows WHERE user_id = @userId AND platform_id = @platformId)
        INSERT INTO platform_follows (user_id, platform_id) VALUES (@userId, @platformId)
      `);
    res.status(201).json({ message: "Following platform" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /follows/platform/:id 
router.delete("/platform/:id", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("platformId", sql.NVarChar, req.params.id)
      .query("DELETE FROM platform_follows WHERE user_id = @userId AND platform_id = @platformId");
    res.json({ message: "Unfollowed platform" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

*/
// POST /follows/user/:id 
router.post("/user/:id", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("followerId", sql.UniqueIdentifier, userId)
      .input("followingId", sql.UniqueIdentifier, req.params.id)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM user_follows WHERE follower_id = @followerId AND following_id = @followingId)
        INSERT INTO user_follows (follower_id, following_id) VALUES (@followerId, @followingId)
      `);
    res.status(201).json({ message: "Following user" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /follows/user/:id 
router.delete("/user/:id", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("followerId", sql.UniqueIdentifier, userId)
      .input("followingId", sql.UniqueIdentifier, req.params.id)
      .query("DELETE FROM user_follows WHERE follower_id = @followerId AND following_id = @followingId");
    res.json({ message: "Unfollowed user" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /follows/status/:userId 
// check if current user follows another user and if it's mutual
router.get("/status/:userId", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;

    const result = await pool.request()
      .input("followerId", sql.UniqueIdentifier, userId)
      .input("followingId", sql.UniqueIdentifier, req.params.userId)
      .query(`
        SELECT
          CASE WHEN EXISTS (
            SELECT 1 FROM user_follows
            WHERE follower_id = @followerId AND following_id = @followingId
          ) THEN 1 ELSE 0 END as is_following,
          CASE WHEN EXISTS (
            SELECT 1 FROM user_follows
            WHERE follower_id = @followingId AND following_id = @followerId
          ) THEN 1 ELSE 0 END as follows_you
      `);

    const { is_following, follows_you } = result.recordset[0];
    res.json({
      is_following: !!is_following,
      follows_you: !!follows_you,
      is_mutual: !!(is_following && follows_you),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;