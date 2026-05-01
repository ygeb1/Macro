import express from "express";
import axios from "axios";
import sql from "mssql";
import { gamesContainer } from "../index.js";

const router = express.Router();

// GET /games?search=zelda
router.get("/", async (req, res) => {
  const search = req.query.search || ""
  const limit = parseInt(req.query.limit) || 20
  try {
    const { resources } = await gamesContainer.items
      .query({
        query: `SELECT c.id, c.igdb_id, c.title, c.cover_url, c.rating, 
                c.total_rating, c.release_date, c.genres, c.platforms
                FROM c 
                WHERE CONTAINS(LOWER(c.title), LOWER(@search))
                OFFSET 0 LIMIT @limit`,
        parameters: [
          { name: "@search", value: search },
          { name: "@limit", value: limit },
        ],
      })
      .fetchAll()
    res.json(resources)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /games/anticipated
router.get("/anticipated", async (req, res) => {
  const now = Math.floor(Date.now() / 1000);
  try {
    const response = await axios.post(
      "https://api.igdb.com/v4/games",
      `fields name, cover.url, hypes, first_release_date, platforms.name, genres.name, summary;
       where hypes != null & first_release_date > ${now};
       sort hypes desc;
       limit 10;`,
      {
        headers: {
          "Client-ID": process.env.IGDB_CLIENT_ID,
          "Authorization": `Bearer ${process.env.IGDB_ACCESS_TOKEN}`,
          "Content-Type": "text/plain",
        },
      }
    );
    const mapped = response.data.map(game => ({
      id: String(game.id),
      title: game.name,
      cover_url: game.cover?.url
        ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
        : null,
      hypes: game.hypes,
      release_date: game.first_release_date,
      genres: game.genres?.map(g => ({ id: String(g.id), name: g.name })) || [],
      platforms: game.platforms?.map(p => ({ id: String(p.id), name: p.name })) || [],
      summary: game.summary || null,
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /games/:id
router.get("/:id", async (req, res) => {
  try {
    const { resource } = await gamesContainer
      .item(req.params.id, req.params.id)
      .read();
    if (!resource) return res.status(404).json({ error: "Game not found" });
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /games/:id/reviews
router.get("/:id/reviews", async (req, res) => {
  try {
    const { getPool } = await import("../index.js");
    const pool = await getPool();
    const result = await pool.request()
      .input("igdbId", sql.NVarChar, req.params.id)
      .query(`
        SELECT r.*, u.username, u.display_name, u.avatar_url
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.igdb_id = @igdbId
        ORDER BY r.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;