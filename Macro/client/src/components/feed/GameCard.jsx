import { Link } from 'react-router-dom'

function GameCard({ game }) {
  function formatYear(timestamp) {
    if (!timestamp) return null
    return new Date(timestamp * 1000).getFullYear()
  }

  return (
    <Link
      to={`/games/${game.igdb_id}`}
      className="flex items-center gap-4 bg-[#160f20] border border-purple-900/20 rounded-xl p-4 hover:border-purple-500/40 transition-colors group"
    >
      {game.cover_url ? (
        <img
          src={game.cover_url}
          alt={game.title}
          className="w-12 h-16 object-cover rounded-lg shrink-0"
        />
      ) : (
        <div className="w-12 h-16 bg-purple-900/20 rounded-lg shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium group-hover:text-[#B68EDA] transition-colors truncate">
          {game.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 flex-wrap">
          {game.release_date && <span>{formatYear(game.release_date)}</span>}
          {game.genres?.slice(0, 2).map(g => (
            <span key={g.id} className="bg-purple-900/20 text-purple-400 px-1.5 py-0.5 rounded">
              {g.name}
            </span>
          ))}
        </div>
      </div>

      <div className="shrink-0 text-right">
        {game.trending_score && (
          <div className="text-[#B68EDA] font-bold text-sm">
            {Math.round(game.trending_score)}
          </div>
        )}
        {game.macro_score > 0 && (
          <div className="text-zinc-600 text-xs">{game.macro_score} activity</div>
        )}
      </div>
    </Link>
  )
}

export default GameCard