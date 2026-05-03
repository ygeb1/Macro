import { Link } from 'react-router-dom'

function FeedItem({ item }) {
  const {
    type,
    actor_username,
    actor_display_name,
    actor_avatar_url,
    actor_id,
    igdb_id,
    review_game_title,
    review_game_cover,
    review_body,
    review_rating,
    subject_game_title,
    subject_review_body,
    subject_user_username,
    subject_user_display_name,
    playlist_title,
    created_at,
    is_friend,
  } = item

  const actorName = actor_display_name || actor_username
  const gameTitle = review_game_title || subject_game_title

  function getActionText() {
    switch (type) {
      case 'review': return 'reviewed'
      case 'catalog_add': return 'added to catalog'
      case 'like': return 'liked a review of'
      case 'reply': return 'replied to a review of'
      case 'playlist_create': return 'created playlist'
      case 'playlist_add': return 'added a game to'
      default: return 'did something with'
    }
  }

  function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000)
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  return (
    <div className="bg-[#160f20] border border-purple-900/20 rounded-xl p-4 hover:border-purple-900/40 transition-colors">

      {/* Actor row */}
      <div className="flex items-center gap-3 mb-3">
        <Link to={`/users/${actor_id}`}>
          {actor_avatar_url ? (
            <img
              src={actor_avatar_url}
              className="w-9 h-9 rounded-full object-cover"
              alt={actor_username}
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-purple-900 flex items-center justify-center text-white text-sm font-bold">
              {actor_username?.[0]?.toUpperCase()}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap text-sm">
            <Link
              to={`/users/${actor_id}`}
              className="text-white font-medium hover:text-[#B68EDA] transition-colors"
            >
              {actorName}
            </Link>
            <span className="text-zinc-500">{getActionText()}</span>
            {gameTitle && (
              <Link
                to={`/games/${igdb_id}`}
                className="text-[#B68EDA] font-medium hover:underline truncate"
              >
                {gameTitle}
              </Link>
            )}
            {playlist_title && (
              <span className="text-[#B68EDA] font-medium">{playlist_title}</span>
            )}
          </div>
          <span className="text-zinc-600 text-xs">{timeAgo(created_at)}</span>
        </div>

        {/* Game cover thumbnail */}
        {review_game_cover && (
          <Link to={`/games/${igdb_id}`} className="shrink-0">
            <img
              src={review_game_cover}
              alt={gameTitle}
              className="w-10 h-14 object-cover rounded-lg"
            />
          </Link>
        )}
      </div>

      {/* Review content */}
      {type === 'review' && (
        <div className="ml-12">
          {review_rating && (
            <span className="text-white font-bold text-sm">
              {review_rating}<span className="text-zinc-500">/10</span>
            </span>
          )}
          {review_body && (
            <p className="text-zinc-300 text-sm mt-1 leading-relaxed line-clamp-3">
              {review_body}
            </p>
          )}
        </div>
      )}

      {/* Like/reply subject preview */}
      {(type === 'like' || type === 'reply') && subject_review_body && (
        <div className="ml-12 mt-2 pl-3 border-l-2 border-purple-900/40">
          <p className="text-zinc-500 text-xs mb-1">
            {subject_user_display_name || subject_user_username}'s review
          </p>
          <p className="text-zinc-400 text-sm line-clamp-2">
            {subject_review_body}
          </p>
        </div>
      )}

      {/* Viral badge for non-friend content in following feed */}
      {is_friend === 0 && (
        <div className="ml-12 mt-2">
          <span className="text-xs text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded-full">
            Trending in your interests
          </span>
        </div>
      )}
    </div>
  )
}

export default FeedItem