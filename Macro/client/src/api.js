import { getToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL;

async function authHeaders() {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Games
export const getGames = (search = "") => request(`/games?search=${search}`);
export const getGame = (id) => request(`/games/${id}`);
export const getAnticipatedGames = () => request("/games/anticipated");
export const getGameReviews = (igdbId) => request(`/games/${igdbId}/reviews`);

// Auth
export async function registerUser(username, displayName, token) {
  const res = await fetch(`${BASE_URL}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username, displayName }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Users
export const getMe = () => request("/users/me");
export const getUser = (id) => request(`/users/${id}`);
export const updateMe = (data) =>
  request("/users/me", { method: "PATCH", body: JSON.stringify(data) });
export const getUserCatalog = (id) => request(`/users/${id}/catalog`);
export const getUserReviews = (id) => request(`/users/${id}/reviews`);
export const addToCatalog = (igdbId, status, playHours, title, coverUrl) =>
  request("/users/me/catalog", {
    method: "POST",
    body: JSON.stringify({ igdbId, status, playHours, title, coverUrl }),
  });


  export const updateCatalogEntry = (gameId, status, playHours) =>
  request(`/users/me/catalog/${gameId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, playHours }),
  });

  export const removeCatalogEntry = (gameId) =>
    request(`/users/me/catalog/${gameId}`, { method: "DELETE" });


// Playlists
export const getPlaylists = (userId) => request(`/playlists/user/${userId}`);
export const createPlaylist = (title, description, visibility) =>
  request("/playlists", {
    method: "POST",
    body: JSON.stringify({ title, description, visibility }),
  });
export const getPlaylist = (id) => request(`/playlists/${id}`);
export const addGameToPlaylist = (playlistId, igdbId, position) =>
  request(`/playlists/${playlistId}/games`, {
    method: "POST",
    body: JSON.stringify({ igdbId, position }),
  });

// Replies
export const postReply = (reviewId, body, parentReplyId = null) =>
  request(`/reviews/${reviewId}/replies`, {
    method: "POST",
    body: JSON.stringify({ body, parentReplyId }),
  });
export const getReviewReplies = (reviewId) =>
  request(`/reviews/${reviewId}/replies`);
export const likeReply = (id) =>
  request(`/replies/${id}/like`, { method: "POST" });
export const deleteReply = (id) =>
  request(`/replies/${id}`, { method: "DELETE" });


// Reviews
export const postReview = (igdbId, rating, body, title, coverUrl) =>
  request("/reviews", {
    method: "POST",
    body: JSON.stringify({ igdbId, rating, body, title, coverUrl }),
  });
export const updateReview = (id, rating, body) =>
  request(`/reviews/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ rating, body }),
  });
export const deleteReview = (id) =>
  request(`/reviews/${id}`, { method: "DELETE" });
export const likeReview = (id) =>
  request(`/reviews/${id}/like`, { method: "POST" });


//export const getReviewReplies = (id) => request(`/reviews/${id}/replies`);
/*
export const postReply = (reviewId, body, parentReplyId = null) =>
  request(`/reviews/${reviewId}/replies`, {
    method: "POST",
    body: JSON.stringify({ body, parentReplyId }),
  });
*/


// Friends
export const getFriends = () => request("/friends");
export const sendFriendRequest = (userId) =>
  request(`/friends/${userId}`, { method: "POST" });
export const respondToFriendRequest = (friendshipId, status) =>
  request(`/friends/${friendshipId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// Feed
export const getFriendsFeed = (page = 0) => request(`/feed/friends?page=${page}`);
export const getFollowingFeed = (page = 0) => request(`/feed/following?page=${page}`);
export const getTrendingFeed = (page = 0) => request(`/feed/trending?page=${page}`);


// Follows
export const getTagFollows = () => request("/follows/tags");
export const followTag = (tagType, tagId, tagName) =>
  request("/follows/tags", {
    method: "POST",
    body: JSON.stringify({ tagType, tagId, tagName }),
  });
export const unfollowTag = (tagType, tagId) =>
  request(`/follows/tags/${tagType}/${tagId}`, { method: "DELETE" });
export const followUser = (id) =>
  request(`/follows/user/${id}`, { method: "POST" });
export const unfollowUser = (id) =>
  request(`/follows/user/${id}`, { method: "DELETE" });
export const getFollowStatus = (userId) => request(`/follows/status/${userId}`);

