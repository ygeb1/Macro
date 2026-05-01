import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getGames } from '../../api'

function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef(null)

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const data = await getGames(q)
      setResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Run search on initial load if there's a query param
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) runSearch(q)
  }, [runSearch])

  // Debounce search as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runSearch(query)
      setSearchParams({ q: query })
    }, 400)

    return () => clearTimeout(debounceRef.current)
  }, [query, runSearch, setSearchParams])

  function formatDate(timestamp) {
    if (!timestamp) return null
    return new Date(timestamp * 1000).getFullYear()
  }

  return (
    <div className="min-h-screen bg-[#0e0a15] text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Search input */}
        <div className="relative mb-8">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search games..."
            autoFocus
            className="w-full px-5 py-4 text-lg bg-[#160f20] border-2 border-purple-900/40 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
              Searching...
            </div>
          )}
          {query && !loading && (
            <button
              onClick={() => {
                setQuery('')
                setResults([])
                setSearched(false)
                setSearchParams({})
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors text-xl"
            >
              ×
            </button>
          )}
        </div>

        {/* Results */}
        {searched && !loading && results.length === 0 && (
          <p className="text-zinc-500 text-center py-12">
            No games found for "{query}"
          </p>
        )}

        {results.length > 0 && (
          <>
            <p className="text-zinc-500 text-sm mb-4">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
            <div className="space-y-3">
              {results.map(game => (
                <Link
                  key={game.id}
                  to={`/games/${game.igdb_id}`}
                  className="flex items-center gap-4 bg-[#160f20] border border-purple-900/20 rounded-xl p-4 hover:border-purple-500/40 transition-colors group"
                >
                  <div className="shrink-0">
                    {game.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={game.title}
                        className="w-12 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-purple-900/20 rounded-lg flex items-center justify-center text-zinc-700 text-xs">
                        ?
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium group-hover:text-[#B68EDA] transition-colors truncate">
                      {game.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500 flex-wrap">
                      {game.release_date && (
                        <span>{formatDate(game.release_date)}</span>
                      )}
                      {game.genres?.length > 0 && (
                        <span>{game.genres.slice(0, 2).map(g => g.name).join(', ')}</span>
                      )}
                      {game.platforms?.length > 0 && (
                        <span>{game.platforms.slice(0, 2).map(p => p.name).join(', ')}</span>
                      )}
                    </div>
                  </div>

                  {game.total_rating && (
                    <div className="shrink-0 text-right">
                      <span className="text-[#B68EDA] font-bold">
                        {Math.round(game.total_rating)}
                      </span>
                      <span className="text-zinc-600 text-sm">/100</span>
                    </div>
                  )}

                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-zinc-700 group-hover:text-purple-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </>
        )}

        {!searched && (
          <div className="text-center py-16">
            <p className="text-zinc-600 text-lg mb-2">Search for a game</p>
            <p className="text-zinc-700 text-sm">
              Type a game name to find it in the catalog
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Search