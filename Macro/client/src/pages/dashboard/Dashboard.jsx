import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getFriendsFeed,
  getFollowingFeed,
  getTrendingFeed,
} from '../../api'
import FeedItem from '../../components/feed/FeedItem'
import GameCard from '../../components/feed/GameCard'
import Header from '../../components/header/header'
import Radio from '../../components/radio/radio'

const TABS = ['trending', 'following', 'friends']

function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState('trending')
  const [items, setItems] = useState([])
  const [trendingGames, setTrendingGames] = useState([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef(null)
  const bottomRef = useRef(null)

  const fetchFeed = useCallback(async (tab, pageNum) => {
    setLoading(true)
    try {
      let data
      if (tab === 'friends') data = await getFriendsFeed(pageNum)
      else if (tab === 'following') data = await getFollowingFeed(pageNum)
      else data = await getTrendingFeed(pageNum)

      if (tab === 'trending') {
        setTrendingGames(prev =>
          pageNum === 0 ? (data.games || []) : [...prev, ...(data.games || [])]
        )
        const activity = data.activity || []
        setItems(prev => pageNum === 0 ? activity : [...prev, ...activity])
        setHasMore((data.games?.length || 0) === 10)
      } else {
        const newItems = Array.isArray(data) ? data : []
        setItems(prev => pageNum === 0 ? newItems : [...prev, ...newItems])
        setHasMore(newItems.length === 10)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Reset and fetch when tab changes
  useEffect(() => {
    setItems([])
    setTrendingGames([])
    setPage(0)
    setHasMore(true)
    fetchFeed(activeTab, 0)
  }, [activeTab, fetchFeed])

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        const nextPage = page + 1
        setPage(nextPage)
        fetchFeed(activeTab, nextPage)
      }
    }, { threshold: 0.1 })

    if (bottomRef.current) observerRef.current.observe(bottomRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasMore, loading, page, activeTab, fetchFeed])

  function EmptyState({ tab }) {
    const messages = {
      trending: "No trending activity yet — start reviewing games!",
      following: "Follow some genres or platforms to see activity here.",
      friends: "Follow other users and they follow you back to see friend activity.",
    }
    return (
      <div className="text-center py-16">
        <p className="text-zinc-600">{messages[tab]}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0e0a15]">
      <Header radio={<Radio activeTab={activeTab} onTabChange={setActiveTab} />} user={user} />

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Trending games section */}
        {activeTab === 'trending' && trendingGames.length > 0 && (
          <div className="mb-6">
            <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Trending Games
            </h2>
            <div className="space-y-2">
              {trendingGames.map(game => (
                <GameCard key={game.igdb_id} game={game} />
              ))}
            </div>
            {items.length > 0 && (
              <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mt-6 mb-3">
                Recent Activity
              </h2>
            )}
          </div>
        )}

        {/* Feed items */}
        <div className="space-y-3">
          {items.length === 0 && !loading ? (
            <EmptyState tab={activeTab} />
          ) : (
            items.map(item => (
              <FeedItem key={item.id} item={item} />
            ))
          )}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-8 text-zinc-600 text-sm">
            Loading...
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={bottomRef} className="h-4" />

        {/* End of feed */}
        {!hasMore && items.length > 0 && (
          <p className="text-center text-zinc-700 text-sm py-8">
            You're all caught up
          </p>
        )}
      </div>
    </div>
  )
}

export default Dashboard