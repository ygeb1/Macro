import "dotenv/config";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import sql from "mssql";
import { CosmosClient } from "@azure/cosmos";

//  Firebase Admin 
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

//  Cosmos DB 
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});
export const gamesContainer = cosmosClient
  .database("gamedb")
  .container("games");

//  SQL DB 
let sqlPool;
export async function getPool() {
  if (!sqlPool) {
    sqlPool = await sql.connect(process.env.SQL_CONNECTION_STRING);
    /*
    broken just use string ^
    sqlPool = await sql.connect({ 
    server: process.env.SQL_SERVER,
    port: 1433,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
    encrypt: true,
    trustServerCertificate: false,
    
      },
    });*/
  }
  return sqlPool;
}

// Auth middleware 
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// App 
const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));

// Routes 
import gamesRouter from "./routes/games.js";
import usersRouter from "./routes/users.js";
import reviewsRouter from "./routes/reviews.js";
import repliesRouter from "./routes/replies.js";
import playlistsRouter from "./routes/playlists.js";
import friendsRouter from "./routes/friends.js";
import feedRouter from "./routes/feed.js";




app.use("/games", gamesRouter);
app.use("/users", usersRouter);
app.use("/reviews", reviewsRouter);
app.use("/replies", repliesRouter);
app.use("/playlists", playlistsRouter);
app.use("/friends", friendsRouter);
app.use("/feed", feedRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));