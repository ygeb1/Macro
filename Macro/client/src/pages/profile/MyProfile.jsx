import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getMe,
  updateMe,
  getUserCatalog,
  getUserReviews,
  getPlaylists,
  getFriends,
  removeCatalogEntry,
} from '../../api'

const STATUS_LABELS = {
  playing: 'Playing',
  completed: 'Completed',
  dropped: 'Dropped',
  want_to_play: 'Want to Play',
}

function MyProfile() {
  const [profile, setProfile] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [reviews, setReviews] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [friends, setFriends] = useState([])
  const [activeTab, setActiveTab] = useState('catalog')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Edit form state
  const [editing, setEditing] = useState(false)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const me = await getMe()
        setProfile(me)
        setEditDisplayName(me.display_name || '')
        setEditBio(me.bio || '')
        setEditStatus(me.status || '')
        setEditAvatarUrl(me.avatar_url || '')

        const [catalogData, reviewsData, playlistsData, friendsData] =
          await Promise.all([
            getUserCatalog(me.id),
            getUserReviews(me.id),
            getPlaylists(me.id),
            getFriends(),
          ])
        setCatalog(catalogData)
        setReviews(reviewsData)
        setPlaylists(playlistsData)
        setFriends(friendsData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaveError('')
    setSaving(true)
    try {
      await updateMe({
        displayName: editDisplayName,
        bio: editBio,
        status: editStatus,
        avatarUrl: editAvatarUrl,
      })
      const updated = await getMe()
      setProfile(updated)
      setEditing(false)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveFromCatalog(igdbId) {
    if (!confirm('Remove this game from your catalog?')) return
    try {
      await removeCatalogEntry(igdbId)
      setCatalog(prev => prev.filter(e => e.igdb_id !== igdbId))
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

          {/* Info or edit form */}
          <div className="flex-1">
            {editing ? (
              <form onSubmit={handleSave} className="space-y-3 max-w-md">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Display Name</label>
                  <input
                    value={editDisplayName}
                    onChange={e => setEditDisplayName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Status</label>
                  <input
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    placeholder="What are you playing?"
                    className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Avatar URL</label>
                  <input
                    value={editAvatarUrl}
                    onChange={e => setEditAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                {saveError && (
                  <p className="text-red-400 text-sm">{saveError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm text-white bg-purple-700 rounded-lg hover:bg-purple-800 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-sm text-zinc-400 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
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
                  <div>
                    <span className="text-white font-bold">{friends.length}</span>
                    <span className="text-zinc-500 ml-1">friends</span>
                  </div>
                </div>

                <button
                  onClick={() => setEditing(true)}
                  className="mt-4 px-4 py-2 text-sm text-white bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-6 flex gap-1">
          {['catalog', 'reviews', 'playlists', 'friends'].map(tab => (
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
                          <div className="aspect-[3/4] bg-purple-900/20 rounded-lg overflow-hidden hover:opacity-80 transition-opacity flex items-center justify-center text-zinc-600 text-xs text-center p-1">
                            {entry.igdb_id}
                          </div>
                        </Link>
                        <button
                          onClick={() => handleRemoveFromCatalog(entry.igdb_id)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-900/80 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {catalog.length === 0 && (
              <p className="text-zinc-500 text-sm">
                No games in your catalog yet. Browse games to add some.
              </p>
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
              <p className="text-zinc-500 text-sm col-span-3">
                No playlists yet.
              </p>
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

        {/* Friends tab */}
        {activeTab === 'friends' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {friends.length === 0 ? (
              <p className="text-zinc-500 text-sm col-span-3">
                No friends yet.
              </p>
            ) : (
              friends.map(friend => (
                <Link
                  key={friend.id}
                  to={`/users/${friend.id}`}
                  className="bg-[#1a1025] rounded-xl p-4 border border-purple-900/30 hover:border-purple-500/50 transition-colors flex items-center gap-3"
                >
                  {friend.avatar_url ? (
                    <img
                      src={friend.avatar_url}
                      className="w-10 h-10 rounded-full object-cover"
                      alt={friend.username}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center text-white font-bold">
                      {friend.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">
                      {friend.display_name || friend.username}
                    </p>
                    {friend.status && (
                      <p className="text-zinc-500 text-xs">{friend.status}</p>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyProfile