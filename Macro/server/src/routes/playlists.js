import express from "express";
import sql from "mssql";
import { getPool, requireAuth } from "../index.js";

const router = express.Router();

// GET /playlists/:id
router.get("/:id", async (req, res) => {
  try {
    const pool = await getPool();
    const playlist = await pool.request()
      .input("id", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT p.*, u.username, u.display_name, u.avatar_url
        FROM playlists p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = @id
      `);
    if (!playlist.recordset[0]) return res.status(404).json({ error: "Playlist not found" });

    const games = await pool.request()
      .input("playlistId", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT * FROM playlist_games
        WHERE playlist_id = @playlistId
        ORDER BY position ASC
      `);

    res.json({ ...playlist.recordset[0], games: games.recordset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /playlists/user/:id — get all playlists for a user
router.get("/user/:id", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("userId", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT * FROM playlists
        WHERE user_id = @userId AND visibility = 'public'
        ORDER BY created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /playlists
router.post("/", requireAuth, async (req, res) => {
  const { title, description, visibility } = req.body;
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description || null)
      .input("visibility", sql.NVarChar, visibility || "public")
      .query(`
        INSERT INTO playlists (user_id, title, description, visibility)
        VALUES (@userId, @title, @description, @visibility)
      `);
    res.status(201).json({ message: "Playlist created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /playlists/:id
router.patch("/:id", requireAuth, async (req, res) => {
  const { title, description, visibility } = req.body;
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("id", sql.UniqueIdentifier, req.params.id)
      .input("userId", sql.UniqueIdentifier, userId)
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description || null)
      .input("visibility", sql.NVarChar, visibility || "public")
      .query(`
        UPDATE playlists
        SET title = @title, description = @description, visibility = @visibility
        WHERE id = @id AND user_id = @userId
      `);
    res.json({ message: "Playlist updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /playlists/:id
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
      .query("DELETE FROM playlists WHERE id = @id AND user_id = @userId");
    res.json({ message: "Playlist deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /playlists/:id/games
router.post("/:id/games", requireAuth, async (req, res) => {
  const { igdbId, position } = req.body;
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    const playlist = await pool.request()
      .input("id", sql.UniqueIdentifier, req.params.id)
      .input("userId", sql.UniqueIdentifier, userId)
      .query("SELECT id FROM playlists WHERE id = @id AND user_id = @userId");
    if (!playlist.recordset[0]) return res.status(403).json({ error: "Not your playlist" });
    await pool.request()
      .input("playlistId", sql.UniqueIdentifier, req.params.id)
      .input("igdbId", sql.NVarChar, igdbId)
      .input("position", sql.Int, position)
      .query(`
        INSERT INTO playlist_games (playlist_id, igdb_id, position)
        VALUES (@playlistId, @igdbId, @position)
      `);
    res.status(201).json({ message: "Game added to playlist" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /playlists/:id/games/:gameId
router.delete("/:id/games/:gameId", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    const playlist = await pool.request()
      .input("id", sql.UniqueIdentifier, req.params.id)
      .input("userId", sql.UniqueIdentifier, userId)
      .query("SELECT id FROM playlists WHERE id = @id AND user_id = @userId");
    if (!playlist.recordset[0]) return res.status(403).json({ error: "Not your playlist" });
    await pool.request()
      .input("playlistId", sql.UniqueIdentifier, req.params.id)
      .input("gameId", sql.UniqueIdentifier, req.params.gameId)
      .query(`
        DELETE FROM playlist_games
        WHERE playlist_id = @playlistId AND id = @gameId
      `);
    res.json({ message: "Game removed from playlist" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /playlists/:id/like
router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await pool.request()
      .input("firebaseUid", sql.NVarChar, req.user.uid)
      .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
    const userId = user.recordset[0].id;
    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("playlistId", sql.UniqueIdentifier, req.params.id)
      .query(`
        INSERT INTO likes (user_id, playlist_id)
        VALUES (@userId, @playlistId)
      `);
    res.status(201).json({ message: "Playlist liked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;