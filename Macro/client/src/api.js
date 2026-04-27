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
export const addToCatalog = (igdbId, status, playHours) =>
  request("/users/me/catalog", {
    method: "POST",
    body: JSON.stringify({ igdbId, status, playHours }),
  });

// Reviews
export const postReview = (igdbId, rating, body) =>
  request("/reviews", {
    method: "POST",
    body: JSON.stringify({ igdbId, rating, body }),
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
export const getReviewReplies = (id) => request(`/reviews/${id}/replies`);
export const postReply = (reviewId, body, parentReplyId = null) =>
  request(`/reviews/${reviewId}/replies`, {
    method: "POST",
    body: JSON.stringify({ body, parentReplyId }),
  });

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
export const getFeed = () => request("/feed");