import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getUser,
  getUserCatalog,
  getUserReviews,
  getPlaylists, /////////////////////////////////////////////
  sendFriendRequest,
  getFriends,
} from '../../api'

const STATUS_LABELS = {
  playing: 'Playing',
  completed: 'Completed',
  dropped: 'Dropped',
  want_to_play: 'Want to Play',
}

function UserProfile({ user: currentUser }) {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [reviews, setReviews] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [friends, setFriends] = useState([])
  const [activeTab, setActiveTab] = useState('catalog')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [friendRequested, setFriendRequested] = useState(false)

  const isOwnProfile = currentUser?.uid === profile?.firebase_uid

  useEffect(() => {
    async function load() {
      try {
        const [profileData, catalogData, reviewsData, playlistsData] =
          await Promise.all([
            getUser(id),
            getUserCatalog(id),
            getUserReviews(id),
            getPlaylists(id),
          ])
        setProfile(profileData)
        setCatalog(catalogData)
        setReviews(reviewsData)
        setPlaylists(playlistsData)

        if (currentUser) {
          const friendsData = await getFriends()
          setFriends(friendsData)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleFriendRequest() {
    try {
      await sendFriendRequest(id)
      setFriendRequested(true)
    } catch (err) {
      alert(err.message)
    }
  }

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

  if (!profile) return null

  const isFriend = friends.some(f => f.id === id)

  const catalogByStatus = catalog.reduce((acc, entry) => {
    const status = entry.status || 'other'
    if (!acc[status]) acc[status] = []
    acc[status].push(entry)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#0e0a15] text-white">

      {/* Profile header */}
      <div className="bg-[#160f20] border-b border-purple-900/30">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-start gap-6">

          {/* Avatar */}
          <div className="shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                className="w-24 h-24 rounded-full object-cover ring-2 ring-purple-500"
                alt={profile.username}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-purple-900 flex items-center justify-center text-3xl font-bold text-white ring-2 ring-purple-500">
                {profile.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-2xl font-bold text-white">
                {profile.display_name || profile.username}
              </h1>
              <span className="text-zinc-500 text-sm">@{profile.username}</span>
              {profile.status && (
                <span className="text-sm text-[#B68EDA] bg-purple-900/30 px-3 py-1 rounded-full">
                  {profile.status}
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="text-zinc-400 mt-2 text-sm max-w-lg">
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <span className="text-white font-bold">{catalog.length}</span>
                <span className="text-zinc-500 ml-1">games</span>
              </div>
              <div>
                <span className="text-white font-bold">{reviews.length}</span>
                <span className="text-zinc-500 ml-1">reviews</span>
              </div>
              <div>
                <span className="text-white font-bold">{playlists.length}</span>
                <span className="text-zinc-500 ml-1">playlists</span>
              </div>
            </div>
            
            {/* Actions */}
            {currentUser && !isOwnProfile && (
              <div className="mt-4 flex gap-3">
                {isFriend ? (
                  <span className="px-4 py-2 text-sm text-green-400 bg-green-900/20 rounded-lg border border-green-900/40">
                    Friends
                  </span>
                ) : friendRequested ? (
                  <span className="px-4 py-2 text-sm text-zinc-400 bg-zinc-800 rounded-lg">
                    Request sent
                  </span>
                ) : (
                  <button
                    onClick={handleFriendRequest}
                    className="px-4 py-2 text-sm text-white bg-purple-700 rounded-lg hover:bg-purple-800 transition-colors"
                  >
                    Add Friend
                  </button>
                )}
              </div>
            )}

            {currentUser && isOwnProfile && (
              <div className="mt-4">
                <Link
                  to="/profile"
                  className="px-4 py-2 text-sm text-white bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  Edit Profile
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-6 flex gap-1">
          {['catalog', 'reviews', 'playlists'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Catalog tab */}
        {activeTab === 'catalog' && (
          <div className="space-y-8">
            {Object.entries(STATUS_LABELS).map(([status, label]) => {
              const entries = catalogByStatus[status]
              if (!entries?.length) return null
              return (
                <div key={status}>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                    {label} ({entries.length})
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {entries.map(entry => (
                    <div key={entry.id} className="relative group">
                        <Link to={`/games/${entry.igdb_id}`}>
                        {entry.cover_url ? (
                            <img
                            src={entry.cover_url}
                            alt={entry.title}
                            className="w-full aspect-[3/4] object-cover rounded-lg hover:opacity-80 transition-opacity"
                            />
                        ) : (
                            <div className="aspect-[3/4] bg-purple-900/20 rounded-lg flex items-center justify-center text-zinc-600 text-xs text-center p-1">
                            {entry.title || entry.igdb_id}
                            </div>
                        )}
                        </Link>
                    </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {catalog.length === 0 && (
              <p className="text-zinc-500 text-sm">No games in catalog yet.</p>
            )}
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-zinc-500 text-sm">No reviews yet.</p>
            ) : (
              reviews.map(review => (
                <div
                  key={review.id}
                  className="bg-[#1a1025] rounded-xl p-5 border border-purple-900/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      to={`/games/${review.igdb_id}`}
                      className="text-[#B68EDA] font-medium hover:underline"
                    >
                      Game #{review.igdb_id}
                    </Link>
                    {review.rating && (
                      <span className="text-white font-bold">
                        {review.rating}
                        <span className="text-zinc-500 text-sm">/10</span>
                      </span>
                    )}
                  </div>
                  {review.body && (
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {review.body}
                    </p>
                  )}
                  <p className="text-zinc-600 text-xs mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Playlists tab */}
        {activeTab === 'playlists' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {playlists.length === 0 ? (
              <p className="text-zinc-500 text-sm col-span-3">No playlists yet.</p>
            ) : (
              playlists.map(playlist => (
                <Link
                  key={playlist.id}
                  to={`/playlists/${playlist.id}`}
                  className="bg-[#1a1025] rounded-xl p-5 border border-purple-900/30 hover:border-purple-500/50 transition-colors"
                >
                  <h4 className="text-white font-medium">{playlist.title}</h4>
                  {playlist.description && (
                    <p className="text-zinc-500 text-sm mt-1 line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile