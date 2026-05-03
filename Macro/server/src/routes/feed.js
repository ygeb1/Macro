import express from "express";
import sql from "mssql";
import axios from "axios";
import { getPool, requireAuth, gamesContainer } from "../index.js";

const router = express.Router();
const PAGE_SIZE = 10;

// Helper: get user id from firebase uid 
async function getUserId(pool, firebaseUid) {
  const result = await pool.request()
    .input("firebaseUid", sql.NVarChar, firebaseUid)
    .query("SELECT id FROM users WHERE firebase_uid = @firebaseUid");
  return result.recordset[0]?.id;
}

// Helper: log activity 
export async function logActivity(pool, { userId, type, igdbId, reviewId, replyId, playlistId }) {
  await pool.request()
    .input("userId", sql.UniqueIdentifier, userId)
    .input("type", sql.NVarChar, type)
    .input("igdbId", sql.NVarChar, igdbId || null)
    .input("reviewId", sql.UniqueIdentifier, reviewId || null)
    .input("replyId", sql.UniqueIdentifier, replyId || null)
    .input("playlistId", sql.UniqueIdentifier, playlistId || null)
    .query(`
      INSERT INTO activity_log (user_id, type, igdb_id, review_id, reply_id, playlist_id)
      VALUES (@userId, @type, @igdbId, @reviewId, @replyId, @playlistId)
    `);
}

// GET /feed/friends 
router.get("/friends", requireAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const offset = page * PAGE_SIZE;

  try {
    const pool = await getPool();
    const userId = await getUserId(pool, req.user.uid);

    const result = await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("pageSize", sql.Int, PAGE_SIZE)
      .input("offset", sql.Int, offset)
      .query(`
        SELECT 
          al.id,
          al.type,
          al.igdb_id,
          al.review_id,
          al.reply_id,
          al.playlist_id,
          al.created_at,
          u.id as actor_id,
          u.username as actor_username,
          u.display_name as actor_display_name,
          u.avatar_url as actor_avatar_url,
          r.body as review_body,
          r.rating as review_rating,
          r.title as review_game_title,
          r.cover_url as review_game_cover,
          p.title as playlist_title,
          -- liked/replied subject
          lr.body as subject_review_body,
          lr.rating as subject_review_rating,
          lr.title as subject_game_title,
          lr.cover_url as subject_game_cover,
          lu.username as subject_user_username,
          lu.display_name as subject_user_display_name
        FROM activity_log al
        JOIN users u ON al.user_id = u.id
        LEFT JOIN reviews r ON al.review_id = r.id AND al.type = 'review'
        LEFT JOIN playlists p ON al.playlist_id = p.id
        LEFT JOIN likes lk ON al.type = 'like' AND lk.id = al.reply_id
        LEFT JOIN reviews lr ON lk.review_id = lr.id
        LEFT JOIN users lu ON lr.user_id = lu.id
        WHERE al.user_id IN (
          -- mutual follows = friends
          SELECT uf1.following_id
          FROM user_follows uf1
          WHERE uf1.follower_id = @userId
          AND EXISTS (
            SELECT 1 FROM user_follows uf2
            WHERE uf2.follower_id = uf1.following_id
            AND uf2.following_id = @userId
          )
        )
        ORDER BY al.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /feed/following 
router.get("/following", requireAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const offset = page * PAGE_SIZE;
  const VIRAL_THRESHOLD = 20; // likes/replies for non-friend content to appear

  try {
    const pool = await getPool();
    const userId = await getUserId(pool, req.user.uid);

    // get followed genre, platform, theme ids
    const follows = await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .query(`
        SELECT 'genre' as type, genre_id as entity_id FROM genre_follows WHERE user_id = @userId
        UNION ALL
        SELECT 'platform' as type, platform_id as entity_id FROM platform_follows WHERE user_id = @userId
      `);

    const followedGenreIds = follows.recordset
      .filter(f => f.type === 'genre').map(f => f.entity_id);
    const followedPlatformIds = follows.recordset
      .filter(f => f.type === 'platform').map(f => f.entity_id);

    if (followedGenreIds.length === 0 && followedPlatformIds.length === 0) {
      return res.json([]);
    }

    // get igdb_ids of games in followed genres/platforms from cosmos
    const genreFilter = followedGenreIds.length > 0
      ? `ARRAY_CONTAINS(c.genres, {"id": "${followedGenreIds[0]}"}, true)` // simplified
      : 'false';

    const { resources: followedGames } = await gamesContainer.items
      .query({
        query: `
          SELECT c.igdb_id FROM c
          WHERE EXISTS(SELECT VALUE g FROM g IN c.genres WHERE g.id IN (${followedGenreIds.map((_, i) => `@g${i}`).join(',')}))
          OR EXISTS(SELECT VALUE p FROM p IN c.platforms WHERE p.id IN (${followedPlatformIds.map((_, i) => `@p${i}`).join(',')}))
        `,
        parameters: [
          ...followedGenreIds.map((id, i) => ({ name: `@g${i}`, value: id })),
          ...followedPlatformIds.map((id, i) => ({ name: `@p${i}`, value: id })),
        ],
      })
      .fetchAll();

    if (followedGames.length === 0) return res.json([]);

    const igdbIds = followedGames.map(g => g.igdb_id);

    // build parameterized IN clause
    const igdbParams = igdbIds.map((_, i) => `@igdb${i}`).join(',');

    const request = pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("pageSize", sql.Int, PAGE_SIZE)
      .input("offset", sql.Int, offset)
      .input("viralThreshold", sql.Int, VIRAL_THRESHOLD);

    igdbIds.forEach((id, i) => request.input(`igdb${i}`, sql.NVarChar, id));

    const result = await request.query(`
      SELECT 
        al.id,
        al.type,
        al.igdb_id,
        al.review_id,
        al.reply_id,
        al.created_at,
        u.id as actor_id,
        u.username as actor_username,
        u.display_name as actor_display_name,
        u.avatar_url as actor_avatar_url,
        r.body as review_body,
        r.rating as review_rating,
        r.title as review_game_title,
        r.cover_url as review_game_cover,
        -- engagement count for viral threshold
        (SELECT COUNT(*) FROM likes WHERE review_id = al.review_id) +
        (SELECT COUNT(*) FROM replies WHERE review_id = al.review_id) as engagement_count,
        -- is this user a friend
        CASE WHEN EXISTS (
          SELECT 1 FROM user_follows uf1
          WHERE uf1.follower_id = @userId AND uf1.following_id = al.user_id
          AND EXISTS (
            SELECT 1 FROM user_follows uf2
            WHERE uf2.follower_id = al.user_id AND uf2.following_id = @userId
          )
        ) THEN 1 ELSE 0 END as is_friend
      FROM activity_log al
      JOIN users u ON al.user_id = u.id
      LEFT JOIN reviews r ON al.review_id = r.id
      WHERE al.igdb_id IN (${igdbParams})
      AND al.user_id != @userId
      AND (
        -- always show friends
        EXISTS (
          SELECT 1 FROM user_follows uf1
          WHERE uf1.follower_id = @userId AND uf1.following_id = al.user_id
          AND EXISTS (
            SELECT 1 FROM user_follows uf2
            WHERE uf2.follower_id = al.user_id AND uf2.following_id = @userId
          )
        )
        OR
        -- show non-friends if viral
        (
          (SELECT COUNT(*) FROM likes WHERE review_id = al.review_id) +
          (SELECT COUNT(*) FROM replies WHERE review_id = al.review_id)
        ) >= @viralThreshold
      )
      ORDER BY al.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /feed/trending 
router.get("/trending", requireAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const offset = page * PAGE_SIZE;

  try {
    const pool = await getPool();
    const userId = await getUserId(pool, req.user.uid);

    // get user's followed genre/platform ids for weighting
    const follows = await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .query(`
        SELECT genre_id as entity_id FROM genre_follows WHERE user_id = @userId
        UNION ALL
        SELECT platform_id FROM platform_follows WHERE user_id = @userId
      `);
    const followedIds = follows.recordset.map(f => f.entity_id);

    // calculate macro activity scores per game in last 7 days
    const activityResult = await pool.request()
      .query(`
        SELECT
          igdb_id,
          SUM(CASE WHEN type = 'review' THEN 10 ELSE 0 END) +
          SUM(CASE WHEN type = 'catalog_add' THEN 5 ELSE 0 END) +
          SUM(CASE WHEN type = 'like' THEN 2 ELSE 0 END) +
          SUM(CASE WHEN type = 'reply' THEN 1 ELSE 0 END) as macro_score
        FROM activity_log
        WHERE created_at > DATEADD(day, -7, GETUTCDATE())
        AND igdb_id IS NOT NULL
        GROUP BY igdb_id
        ORDER BY macro_score DESC
        OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY
      `);

    if (activityResult.recordset.length === 0) {
      // fall back to IGDB anticipated games if no local activity
      const now = Math.floor(Date.now() / 1000);
      const response = await axios.post(
        "https://api.igdb.com/v4/games",
        `fields name, cover.url, hypes, total_rating, first_release_date, platforms.name, genres.name;
         sort total_rating desc;
         where total_rating != null;
         limit ${PAGE_SIZE};
         offset ${offset};`,
        {
          headers: {
            "Client-ID": process.env.IGDB_CLIENT_ID,
            "Authorization": `Bearer ${process.env.IGDB_ACCESS_TOKEN}`,
            "Content-Type": "text/plain",
          },
        }
      );
      return res.json({
        type: "igdb_fallback",
        items: response.data.map(g => ({
          id: String(g.id),
          igdb_id: String(g.id),
          title: g.name,
          cover_url: g.cover?.url
            ? `https:${g.cover.url.replace("t_thumb", "t_cover_big")}`
            : null,
          total_rating: g.total_rating,
          release_date: g.first_release_date,
          genres: g.genres?.map(x => ({ id: String(x.id), name: x.name })) || [],
          platforms: g.platforms?.map(x => ({ id: String(x.id), name: x.name })) || [],
          macro_score: 0,
        })),
      });
    }

    // fetch game details from cosmos for top activity games
    const igdbIds = activityResult.recordset.map(r => r.igdb_id);
    const { resources: games } = await gamesContainer.items
      .query({
        query: `SELECT c.igdb_id, c.title, c.cover_url, c.total_rating, 
                c.genres, c.platforms, c.release_date
                FROM c WHERE c.igdb_id IN (${igdbIds.map((_, i) => `@id${i}`).join(',')})`,
        parameters: igdbIds.map((id, i) => ({ name: `@id${i}`, value: id })),
      })
      .fetchAll();

    // merge macro scores with cosmos game data
    const scoreMap = {};
    activityResult.recordset.forEach(r => {
      scoreMap[r.igdb_id] = r.macro_score;
    });

    const trending = games.map(game => {
      const macroScore = scoreMap[game.igdb_id] || 0;
      const igdbScore = game.total_rating || 50;

      // boost score if game is in followed genres/platforms
      const isFollowed = followedIds.some(id =>
        game.genres?.some(g => g.id === id) ||
        game.platforms?.some(p => p.id === id)
      );
      const followBoost = isFollowed ? 1.3 : 1.0;

      const trendingScore = ((igdbScore * 0.4) + (macroScore * 0.6)) * followBoost;

      return { ...game, macro_score: macroScore, trending_score: trendingScore };
    })
    .sort((a, b) => b.trending_score - a.trending_score)
    .slice(offset, offset + PAGE_SIZE);

    // also get recent activity items for these games
    const trendingIds = trending.map(g => g.igdb_id);
    if (trendingIds.length > 0) {
      const actParams = trendingIds.map((_, i) => `@tid${i}`).join(',');
      const actReq = pool.request()
        .input("pageSize", sql.Int, PAGE_SIZE)
        .input("offset", sql.Int, offset);
      trendingIds.forEach((id, i) => actReq.input(`tid${i}`, sql.NVarChar, id));

      const recentActivity = await actReq.query(`
        SELECT TOP ${PAGE_SIZE}
          al.id, al.type, al.igdb_id, al.created_at,
          u.id as actor_id, u.username as actor_username,
          u.display_name as actor_display_name, u.avatar_url as actor_avatar_url,
          r.body as review_body, r.rating as review_rating,
          r.title as review_game_title, r.cover_url as review_game_cover
        FROM activity_log al
        JOIN users u ON al.user_id = u.id
        LEFT JOIN reviews r ON al.review_id = r.id
        WHERE al.igdb_id IN (${actParams})
        AND al.type IN ('review', 'catalog_add')
        AND al.created_at > DATEADD(day, -7, GETUTCDATE())
        ORDER BY al.created_at DESC
      `);

      return res.json({
        type: "trending",
        games: trending,
        activity: recentActivity.recordset,
      });
    }

    res.json({ type: "trending", games: trending, activity: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;