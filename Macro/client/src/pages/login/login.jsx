import '../../index.css'
import { useState } from 'react'
import { login, register } from '../../auth'
import { registerUser } from '../../api'

function Login() {
  const [isLogin, setIsLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login flow
        await login(email, password)
        // onAuthStateChanged in App.jsx will handle redirect
      } else {
        // Registration flow
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        // 1. Create Firebase user
        console.log("creating firebase user")
        const user = await register(email, password)
        console.log("firebase user created:", user.uid)
        // 2. Get token
        const token = await user.getIdToken()
        console.log("got token starting with:", token.substring(0,20))
        // 3. Create SQL user row
        const result = await registerUser(username, displayName, token)
        console.log('sql user created:', result)
      }
    } catch (err) {
      // Firebase error codes are readable
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists')
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="w-100 bg-linear-to-br from-[#271B3C]/20 to-[#8726B7]/1 shadow-2xl rounded-2xl overflow-hidden ring-3 ring-purple-300/90"
      >
        <div className="px-8 py-10 md:px-10">
          <h2 className="text-3xl font-bold text-center text-white">
            Welcome to Macro!
          </h2>
          <p className="text-center text-zinc-400 mt-3">
            {isLogin ? 'Login to your account.' : 'Create an account to continue.'}
          </p>
        </div>

        <div className="mt-10 px-10 pb-10">

          {/* Username — registration only */}
          {!isLogin && (
            <div className="relative mb-6">
              <label className="block mb-3 text-sm font-medium text-zinc-200">
                Username
              </label>
              <input
                placeholder="yourusername"
                className="block w-full px-4 py-3 mt-2 border-2 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 focus:border-purple-400 focus:ring-opacity-50 focus:outline-none focus:ring focus:ring-purple-400"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          {/* Display name — registration only */}
          {!isLogin && (
            <div className="relative mb-6">
              <label className="block mb-3 text-sm font-medium text-zinc-200">
                Display Name
              </label>
              <input
                placeholder="Your Name"
                className="block w-full px-4 py-3 mt-2 border-2 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 focus:border-purple-400 focus:ring-opacity-50 focus:outline-none focus:ring focus:ring-purple-400"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <label className="block mb-3 text-sm font-medium text-zinc-200">
              Email
            </label>
            <input
              placeholder="you@example.com"
              className="block w-full px-4 py-3 mt-2 border-2 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 focus:border-purple-400 focus:ring-opacity-50 focus:outline-none focus:ring focus:ring-purple-400"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="mt-6">
            <label className="block mb-3 text-sm font-medium text-zinc-200">
              Password
            </label>
            <input
              placeholder="••••••••"
              className="block w-full px-4 py-3 mt-2 border-2 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 focus:border-purple-400 focus:ring-opacity-50 focus:outline-none focus:ring focus:ring-purple-400"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm password — registration only */}
          {!isLogin && (
            <div className="mt-6">
              <label className="block mb-3 text-sm font-medium text-zinc-200">
                Confirm Password
              </label>
              <input
                placeholder="••••••••"
                className="block w-full px-4 py-3 mt-2 border-2 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 focus:border-purple-400 focus:ring-opacity-50 focus:outline-none focus:ring focus:ring-purple-400"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
          )}

          {/* Submit button */}
          <div className="mt-10">
            <button
              className="w-full px-4 py-3 tracking-wide text-white transition-colors duration-200 transform bg-linear-to-r from-purple-500 to-violet-400 rounded-lg hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-4 focus:ring-purple-800 disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </div>
        </div>

        {/* Toggle between login and register */}
        <div className="px-8 py-4 bg-linear-to-br from-[#3E364B]/20 to-[#8726B7]/1">
          <div className="text-sm text-[#E4CAFB] text-center">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              className="font-medium underline"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Login