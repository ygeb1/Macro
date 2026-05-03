import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getGame,
  getGameReviews,
  postReview,
  addToCatalog,
  likeReview,
  getReviewReplies,
  postReply,
  getMe,
  getPlaylists,
  addGameToPlaylist,
  createPlaylist,
  getTagFollows,
  followTag,
  unfollowTag,
} from '../../api'

// Constants 
const CATALOG_STATUSES = [
  { value: 'playing', label: 'Playing' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'want_to_play', label: 'Want to Play' },
]

const STATUS_CODES = {
  0: 'Released',
  2: 'Alpha',
  3: 'Beta',
  4: 'Early Access',
  5: 'Offline',
  6: 'Cancelled',
  8: 'Rumoured',
}

const CATEGORY_CODES = {
  0: null,
  1: 'DLC',
  2: 'Expansion',
  3: 'Bundle',
  4: 'Standalone Expansion',
  5: 'Mod',
  6: 'Episode',
  7: 'Season',
  8: 'Remake',
  9: 'Remaster',
  10: 'Expanded Game',
  11: 'Port',
}

function formatDate(timestamp) {
  if (!timestamp) return 'TBA'
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Tag button 
function TagButton({ label, following, onClick, variant = 'purple' }) {
  const colors = {
    purple: following
      ? 'bg-purple-700 border-purple-500 text-white'
      : 'bg-[#1a1025] border-purple-900/40 text-[#B68EDA] hover:border-purple-500',
    gray: following
      ? 'bg-zinc-600 border-zinc-500 text-white'
      : 'bg-[#1a1025] border-zinc-700/40 text-zinc-400 hover:border-zinc-500',
  }
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2 py-1 rounded-full border transition-colors ${colors[variant]}`}
    >
      {following ? '✓ ' : '+ '}{label}
    </button>
  )
}

// Review card 
function ReviewCard({ review, currentUserId, onLike }) {
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState([])
  const [replyBody, setReplyBody] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  async function loadReplies() {
    if (!showReplies) {
      const data = await getReviewReplies(review.id)
      setReplies(data)
    }
    setShowReplies(!showReplies)
  }

  async function handleReplySubmit(e) {
    e.preventDefault()
    if (!replyBody.trim()) return
    setSubmittingReply(true)
    try {
      await postReply(review.id, replyBody)
      const data = await getReviewReplies(review.id)
      setReplies(data)
      setReplyBody('')
    } finally {
      setSubmittingReply(false)
    }
  }

  return (
    <div className="bg-[#1a1025] rounded-xl p-5 border border-purple-900/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {review.avatar_url ? (
            <img
              src={review.avatar_url}
              className="w-8 h-8 rounded-full object-cover"
              alt={review.username}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-800 flex items-center justify-center text-white text-xs font-bold">
              {review.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <Link
              to={`/users/${review.user_id}`}
              className="text-[#B68EDA] text-sm font-medium hover:underline"
            >
              {review.display_name || review.username}
            </Link>
            <p className="text-zinc-500 text-xs">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        {review.rating && (
          <span className="text-white font-bold text-lg">
            {review.rating}
            <span className="text-zinc-500 text-sm">/10</span>
          </span>
        )}
      </div>

      {review.body && (
        <p className="text-zinc-300 text-sm leading-relaxed mb-4">
          {review.body}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={() => onLike(review.id)}
          className="text-zinc-500 hover:text-purple-400 text-xs transition-colors"
        >
          ♥ Like
        </button>
        <button
          onClick={loadReplies}
          className="text-zinc-500 hover:text-purple-400 text-xs transition-colors"
        >
          💬 {showReplies ? 'Hide replies' : 'Replies'}
        </button>
      </div>

      {showReplies && (
        <div className="mt-4 pl-4 border-l border-purple-900/40 space-y-3">
          {replies.map(reply => (
            <div key={reply.id} className="text-sm">
              <span className="text-[#B68EDA] font-medium">
                {reply.display_name || reply.username}
              </span>
              <span className="text-zinc-400 ml-2">{reply.body}</span>
            </div>
          ))}
          {currentUserId && (
            <form onSubmit={handleReplySubmit} className="flex gap-2 mt-3">
              <input
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={submittingReply}
                className="px-3 py-2 text-sm bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50"
              >
                Reply
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

// Main game page 
function Game() {
  const { id } = useParams()

  // Core data
  const [game, setGame] = useState(null)
  const [reviews, setReviews] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeScreenshot, setActiveScreenshot] = useState(0)

  // Tag follows
  const [tagFollows, setTagFollows] = useState([])

  // Review form
  const [reviewRating, setReviewRating] = useState('')
  const [reviewBody, setReviewBody] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')

  // Catalog
  const [catalogStatus, setCatalogStatus] = useState('')
  const [addingToCatalog, setAddingToCatalog] = useState(false)

  // Playlist modal
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('')

  // Load data 
  useEffect(() => {
    async function load() {
      try {
        const [gameData, reviewsData] = await Promise.all([
          getGame(id),
          getGameReviews(id),
        ])
        setGame(gameData)
        setReviews(reviewsData)

        try {
          const me = await getMe()
          setCurrentUser(me)
          const [myPlaylists, myTagFollows] = await Promise.all([
            getPlaylists(me.id),
            getTagFollows(),
          ])
          setPlaylists(myPlaylists)
          setTagFollows(myTagFollows)
        } catch {
          // not logged in
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Tag follow helpers 
  function isFollowing(tagType, tagId) {
    return tagFollows.some(f => f.tag_type === tagType && f.tag_id === tagId)
  }

  async function handleTagFollow(tagType, tagId, tagName) {
    if (!currentUser) return
    try {
      if (isFollowing(tagType, tagId)) {
        await unfollowTag(tagType, tagId)
        setTagFollows(prev =>
          prev.filter(f => !(f.tag_type === tagType && f.tag_id === tagId))
        )
      } else {
        await followTag(tagType, tagId, tagName)
        setTagFollows(prev => [
          ...prev,
          { tag_type: tagType, tag_id: tagId, tag_name: tagName },
        ])
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Review handlers 
  async function handleReviewSubmit(e) {
    e.preventDefault()
    setReviewError('')
    if (!reviewRating || reviewRating < 1 || reviewRating > 10) {
      setReviewError('Rating must be between 1 and 10')
      return
    }
    setSubmittingReview(true)
    try {
      await postReview(id, parseInt(reviewRating), reviewBody, game.title, game.cover_url)
      const updated = await getGameReviews(id)
      setReviews(updated)
      setReviewRating('')
      setReviewBody('')
    } catch (err) {
      setReviewError(err.message)
    } finally {
      setSubmittingReview(false)
    }
  }

  async function handleLikeReview(reviewId) {
    if (!currentUser) return
    try {
      await likeReview(reviewId)
    } catch (err) {
      console.error(err)
    }
  }

  // Catalog handlers 
  async function handleAddToCatalog() {
    if (!catalogStatus) return
    setAddingToCatalog(true)
    try {
      await addToCatalog(id, catalogStatus, 0, game.title, game.cover_url)
      alert('Added to catalog!')
    } catch (err) {
      alert(err.message)
    } finally {
      setAddingToCatalog(false)
    }
  }

  // Playlist handlers 
  async function handleAddToPlaylist(playlistId) {
    try {
      await addGameToPlaylist(playlistId, id, playlists.length + 1)
      setShowPlaylistModal(false)
      alert('Added to playlist!')
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleCreatePlaylist() {
    if (!newPlaylistTitle.trim()) return
    try {
      await createPlaylist(newPlaylistTitle, '', 'public')
      const updated = await getPlaylists(currentUser.id)
      setPlaylists(updated)
      setNewPlaylistTitle('')
    } catch (err) {
      alert(err.message)
    }
  }

  // Render guards 
  if (loading) return (
    <div className="flex justify-center items-center min-h-screen text-[#B68EDA]">
      Loading...
    </div>
  )

  if (error) return (
    <div className="flex justify-center items-center min-h-screen text-red-400">
      Error: {error}
    </div>
  )

  if (!game) return null

  const categoryLabel = CATEGORY_CODES[game.category]
  const statusLabel = STATUS_CODES[game.status]
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
        reviews.filter(r => r.rating).length).toFixed(1)
    : null

  // JSX 
  return (
    <div className="min-h-screen bg-[#0e0a15] text-white">

      {/* Hero */}
      <div className="relative">
        {game.screenshots?.[0] && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 blur-sm"
            style={{ backgroundImage: `url(${game.screenshots[0]})` }}
          />
        )}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 flex gap-8">

          {/* Cover */}
          <div className="shrink-0">
            {game.cover_url ? (
              <img
                src={game.cover_url}
                alt={game.title}
                className="w-44 rounded-xl shadow-2xl shadow-purple-900/50"
              />
            ) : (
              <div className="w-44 h-60 bg-purple-900/30 rounded-xl flex items-center justify-center text-zinc-500 text-sm">
                No cover
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-end gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {categoryLabel && (
                <span className="text-xs px-2 py-0.5 bg-purple-800/50 text-purple-300 rounded-full">
                  {categoryLabel}
                </span>
              )}
              {statusLabel && (
                <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">
                  {statusLabel}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold text-white">{game.title}</h1>

            <div className="flex items-center gap-4 text-sm text-zinc-400 flex-wrap">
              {game.release_date && <span>{formatDate(game.release_date)}</span>}
              {game.developers?.length > 0 && (
                <span>{game.developers.map(d => d.name).join(', ')}</span>
              )}
              {avgRating && (
                <span className="text-[#B68EDA] font-bold text-base">
                  ★ {avgRating}
                  <span className="text-zinc-500 font-normal text-sm">
                    {' '}({reviews.length} reviews)
                  </span>
                </span>
              )}
              {game.total_rating && (
                <span className="text-zinc-500">
                  IGDB: {Math.round(game.total_rating)}/100
                </span>
              )}
            </div>

            {/* Tags — genres */}
            <div className="flex flex-wrap gap-2">
              {game.genres?.map(g => (
                <TagButton
                  key={g.id}
                  label={g.name}
                  following={isFollowing('genre', g.id)}
                  onClick={() => handleTagFollow('genre', g.id, g.name)}
                  variant="purple"
                />
              ))}
              {game.themes?.map(t => (
                <TagButton
                  key={t.id}
                  label={t.name}
                  following={isFollowing('theme', t.id)}
                  onClick={() => handleTagFollow('theme', t.id, t.name)}
                  variant="purple"
                />
              ))}
              {game.platforms?.map(p => (
                <TagButton
                  key={p.id}
                  label={p.name}
                  following={isFollowing('platform', p.id)}
                  onClick={() => handleTagFollow('platform', p.id, p.name)}
                  variant="gray"
                />
              ))}
            </div>

            {/* Keywords */}
            {game.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {game.keywords.slice(0, 8).map(k => (
                  <TagButton
                    key={k.id}
                    label={k.name}
                    following={isFollowing('keyword', k.id)}
                    onClick={() => handleTagFollow('keyword', k.id, k.name)}
                    variant="gray"
                  />
                ))}
              </div>
            )}

            {/* Action buttons */}
            {currentUser && (
              <div className="flex gap-3 mt-2 flex-wrap">
                <select
                  value={catalogStatus}
                  onChange={e => setCatalogStatus(e.target.value)}
                  className="px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Add to catalog...</option>
                  {CATALOG_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddToCatalog}
                  disabled={!catalogStatus || addingToCatalog}
                  className="px-4 py-2 text-sm bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50 transition-colors"
                >
                  {addingToCatalog ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => setShowPlaylistModal(true)}
                  className="px-4 py-2 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  + Playlist
                </button>
                <Link
                  to={`/guides/new?igdbId=${id}&gameTitle=${encodeURIComponent(game.title)}&gameCoverUrl=${encodeURIComponent(game.cover_url || '')}`}
                  className="px-4 py-2 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  ✍ Write Guide
                </Link>
                {game.websites?.map(w => (
                  <a
                    key={w.type}
                    href={w.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-700 transition-colors capitalize"
                  >
                    {w.type}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-3 gap-8">

        {/* Left column */}
        <div className="col-span-1 space-y-6">

          {game.summary && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                About
              </h3>
              <p className="text-zinc-300 text-sm leading-relaxed">{game.summary}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Details
            </h3>
            <div className="space-y-2 text-sm">
              {game.developers?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <span className="text-zinc-500 shrink-0">Developer</span>
                  <div className="flex flex-wrap gap-1">
                    {game.developers.map(d => (
                      <TagButton
                        key={d.id}
                        label={d.name}
                        following={isFollowing('developer', d.id)}
                        onClick={() => handleTagFollow('developer', d.id, d.name)}
                        variant="gray"
                      />
                    ))}
                  </div>
                </div>
              )}
              {game.publishers?.length > 0 && (
                <div>
                  <span className="text-zinc-500">Publisher </span>
                  <span className="text-zinc-200">
                    {game.publishers.map(p => p.name).join(', ')}
                  </span>
                </div>
              )}
              {game.collection && (
                <div className="flex gap-2 items-center">
                  <span className="text-zinc-500 shrink-0">Series</span>
                  <TagButton
                    label={game.collection.name || game.collection}
                    following={isFollowing('collection', game.collection.id || game.collection)}
                    onClick={() => handleTagFollow(
                      'collection',
                      game.collection.id || game.collection,
                      game.collection.name || game.collection
                    )}
                    variant="gray"
                  />
                </div>
              )}
              {game.franchise && (
                <div className="flex gap-2 items-center">
                  <span className="text-zinc-500 shrink-0">Franchise</span>
                  <TagButton
                    label={game.franchise.name || game.franchise}
                    following={isFollowing('franchise', game.franchise.id || game.franchise)}
                    onClick={() => handleTagFollow(
                      'franchise',
                      game.franchise.id || game.franchise,
                      game.franchise.name || game.franchise
                    )}
                    variant="gray"
                  />
                </div>
              )}
              {game.game_modes?.length > 0 && (
                <div>
                  <span className="text-zinc-500">Modes </span>
                  <span className="text-zinc-200">
                    {game.game_modes.map(m => m.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {game.similar_games?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Similar Games
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {game.similar_games.slice(0, 6).map(g => (
                  <Link key={g.id} to={`/games/${g.id}`}>
                    {g.cover_url ? (
                      <img
                        src={g.cover_url}
                        alt={g.title}
                        className="w-full rounded-lg hover:opacity-80 transition-opacity"
                        title={g.title}
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 text-xs text-center p-1">
                        {g.title}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="col-span-2 space-y-8">

          {/* Screenshots */}
          {game.screenshots?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Screenshots
              </h3>
              <img
                src={game.screenshots[activeScreenshot]}
                alt="Screenshot"
                className="w-full rounded-xl mb-2"
              />
              <div className="flex gap-2 overflow-x-auto pb-1">
                {game.screenshots.map((s, i) => (
                  <img
                    key={i}
                    src={s}
                    alt={`Screenshot ${i + 1}`}
                    onClick={() => setActiveScreenshot(i)}
                    className={`w-24 h-14 object-cover rounded-lg cursor-pointer shrink-0 transition-opacity ${
                      i === activeScreenshot
                        ? 'ring-2 ring-purple-500 opacity-100'
                        : 'opacity-50 hover:opacity-80'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Write a review */}
          {currentUser && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Write a Review
              </h3>
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-zinc-400 shrink-0">Rating (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={reviewRating}
                    onChange={e => setReviewRating(e.target.value)}
                    className="w-20 px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <textarea
                  value={reviewBody}
                  onChange={e => setReviewBody(e.target.value)}
                  placeholder="Write your review..."
                  rows={4}
                  className="w-full px-4 py-3 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500 resize-none"
                />
                {reviewError && (
                  <p className="text-red-400 text-sm">{reviewError}</p>
                )}
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2 bg-purple-700 text-white text-sm rounded-lg hover:bg-purple-800 disabled:opacity-50 transition-colors"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

          {/* Reviews list */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Reviews {reviews.length > 0 && `(${reviews.length})`}
            </h3>
            {reviews.length === 0 ? (
              <p className="text-zinc-500 text-sm">No reviews yet. Be the first!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    currentUserId={currentUser?.id}
                    onLike={handleLikeReview}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Playlist modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1025] rounded-xl p-6 w-80 border border-purple-900/40">
            <h3 className="text-white font-semibold mb-4">Add to Playlist</h3>
            {playlists.length > 0 ? (
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {playlists.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddToPlaylist(p.id)}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-200 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm mb-4">No playlists yet.</p>
            )}
            <div className="flex gap-2">
              <input
                value={newPlaylistTitle}
                onChange={e => setNewPlaylistTitle(e.target.value)}
                placeholder="New playlist name..."
                className="flex-1 px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleCreatePlaylist}
                className="px-3 py-2 text-sm bg-purple-700 text-white rounded-lg hover:bg-purple-800"
              >
                Create
              </button>
            </div>
            <button
              onClick={() => setShowPlaylistModal(false)}
              className="w-full mt-3 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game