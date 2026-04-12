require("dotenv").config();
const { CosmosClient } = require("@azure/cosmos");
const axios = require("axios");

const DB_NAME = "gamedb";
const CONTAINER_NAME = "games";
const BATCH_SIZE = 500;
const TOTAL_GAMES = 500;
const RATE_LIMIT_DELAY_MS = 250;

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
    `fields id, name, summary, cover.url, genres.name, platforms.name, 
     first_release_date, rating, rating_count, total_rating, 
     total_rating_count, storyline, status, category;
     limit ${BATCH_SIZE};
     offset ${offset};
     sort id asc;`,
    {
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
    }
  );
  return response.data;
}

function mapGameDocument(game) {
  return {
    id: String(game.id),
    igdb_id: String(game.id),
    title: game.name,
    summary: game.summary || null,
    storyline: game.storyline || null,
    cover_url: game.cover?.url?.replace("t_thumb", "t_cover_big") || null,
    genres: game.genres?.map((g) => ({ id: String(g.id), name: g.name })) || [],
    platforms: game.platforms?.map((p) => ({ id: String(p.id), name: p.name })) || [],
    release_date: game.first_release_date || null,
    rating: game.rating || null,
    rating_count: game.rating_count || null,
    total_rating: game.total_rating || null,
    total_rating_count: game.total_rating_count || null,
    status: game.status || null,
    category: game.category || null,
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

      const upsertPromises = games.map((game) =>
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