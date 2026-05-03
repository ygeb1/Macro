require("dotenv").config();
const { CosmosClient } = require("@azure/cosmos");
const axios = require("axios");

const DB_NAME = "gamedb";
const CONTAINER_NAME = "games";
const BATCH_SIZE = 500;
const TOTAL_GAMES = 350000; 
const RATE_LIMIT_DELAY_MS = 250;

const WEBSITE_CATEGORIES = {
  1: "official",
  13: "steam",
  16: "epic",
  17: "gog",
};

const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchGames(token, offset) {
  const response = await axios.post(
    "https://api.igdb.com/v4/games",
    `fields
      id,
      name,
      summary,
      storyline,
      status,
      category,
      first_release_date,
      rating,
      rating_count,
      total_rating,
      total_rating_count,
      cover.url,
      screenshots.url,
      genres.id, genres.name,
      themes.id, themes.name,
      game_modes.id, game_modes.name,
      platforms.id, platforms.name,
      involved_companies.developer,
      involved_companies.publisher,
      involved_companies.company.id,
      involved_companies.company.name,
      collection.name,
      franchise.name,
      similar_games.id,
      similar_games.name,
      similar_games.cover.url,
      websites.url,
      websites.category
      keywords.id, keywords.name,
      game_modes.id, game_modes.name,
      franchise.id, franchise.name,
      collection.id, collection.name;
      limit ${BATCH_SIZE};
      offset ${offset};
      sort id asc;`,
    {
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID,
        "Authorization": `Bearer ${process.env.IGDB_ACCESS_TOKEN}`,
        "Content-Type": "text/plain",
      },
    }
  );
  return response.data;
}

function formatImageUrl(url, size) {
  if (!url) return null;
  return `https:${url.replace("t_thumb", size)}`;
}

function mapGameDocument(game) {
  return {
    id: String(game.id),
    igdb_id: String(game.id),
    title: game.name,
    summary: game.summary || null,
    storyline: game.storyline || null,
    status: game.status ?? null,
    category: game.category ?? null,
    release_date: game.first_release_date || null,
    rating: game.rating || null,
    rating_count: game.rating_count || null,
    total_rating: game.total_rating || null,
    total_rating_count: game.total_rating_count || null,
    cover_url: formatImageUrl(game.cover?.url, "t_cover_big"),
    screenshots: game.screenshots?.map(s =>
      formatImageUrl(s.url, "t_screenshot_big")
    ).filter(Boolean) || [],
    genres: game.genres?.map(g => ({
      id: String(g.id),
      name: g.name,
    })) || [],
    themes: game.themes?.map(t => ({
      id: String(t.id),
      name: t.name,
    })) || [],
    game_modes: game.game_modes?.map(m => ({
      id: String(m.id),
      name: m.name,
    })) || [],
    platforms: game.platforms?.map(p => ({
      id: String(p.id),
      name: p.name,
    })) || [],
    developers: game.involved_companies
      ?.filter(c => c.developer)
      .map(c => ({
        id: String(c.company.id),
        name: c.company.name,
      })) || [],
    publishers: game.involved_companies
      ?.filter(c => c.publisher)
      .map(c => ({
        id: String(c.company.id),
        name: c.company.name,
      })) || [],
    keywords: game.keywords?.map(k => ({ id: String(k.id), name: k.name })) || [],
    franchise: game.franchise ? { id: String(game.franchise.id), name: game.franchise.name } : null,
    collection: game.collection ? { id: String(game.collection.id), name: game.collection.name } : null,
    similar_games: game.similar_games?.map(g => ({
      id: String(g.id),
      title: g.name,
      cover_url: formatImageUrl(g.cover?.url, "t_cover_big"),
    })) || [],
    websites: game.websites
      ?.filter(w => WEBSITE_CATEGORIES[w.category])
      .map(w => ({
        type: WEBSITE_CATEGORIES[w.category],
        url: w.url,
      })) || [],
    igdb_updated_at: new Date().toISOString(),
  };
}

async function importGames() {
  console.log("Starting import...");
  const token = process.env.IGDB_ACCESS_TOKEN;

  const container = cosmosClient
    .database(DB_NAME)
    .container(CONTAINER_NAME);

  let offset = 0;
  let totalImported = 0;

  while (offset < TOTAL_GAMES) {
    try {
      const games = await fetchGames(token, offset);

      if (games.length === 0) {
        console.log("No more games returned. Import complete.");
        break;
      }

      const upsertPromises = games.map(game =>
        container.items.upsert(mapGameDocument(game))
      );
      await Promise.all(upsertPromises);

      totalImported += games.length;
      offset += BATCH_SIZE;

      console.log(`Imported ${totalImported} games so far...`);
      await sleep(RATE_LIMIT_DELAY_MS);

    } catch (err) {
      console.error(`Error at offset ${offset}:`, err.message);
      console.log("Waiting 2 seconds before retrying...");
      await sleep(2000);
    }
  }

  console.log(`\nDone! Total games imported: ${totalImported}`);
}

importGames().catch(console.error);