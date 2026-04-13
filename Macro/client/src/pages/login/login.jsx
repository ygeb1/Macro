import '../../index.css'
import { useState } from 'react'

function Login() {
  return (
    <div className="flex justify-center items-center min-h-screen">
        {/* Used element as reference by Cybercom682 on UIverse*/}
        <form className="w-100 bg-linear-to-br font-['Nunito'] from-[#271B3C]/20 to-[#8726B7]/1 shadow-2xl rounded-2xl overflow-hidden ring-3 ring-purple-300/90">
            <div className="px-8 py-10 md:px-10">
                <h2 className="text-3xl font-bold text-center text-white">
                    Welcome to Macro!
                </h2>
                <p className="text-center text-zinc-400 mt-3">
                    Create an account or login to continue.
                </p>
            </div>
            <div className="mt-10 px-10 pb-10">
                <div className="relative">
                    <label
                    className="block mb-3 text-sm font-medium text-zinc-200"
                    for="email"
                    >Email</label
                    >
                    <input
                    placeholder="you@example.com"
                    className="block w-full px-4 py-3 mt-2  border-2 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 focus:border-purple-400 focus:ring-opacity-50 focus:outline-none focus:ring focus:ring-purple-400"
                    name="email"
                    id="email"
                    type="email"
                    />
                </div>
                <div className="mt-6">
                    <label
                    className="block mb-3 text-sm font-medium text-zinc-200"
                    for="password"
                    >Password</label
                    >
                    <input
                    placeholder="••••••••"
                    className="block w-full px-4 py-3 mt-2 border-2 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 focus:border-purple-400 focus:ring-opacity-50 focus:outline-none focus:ring focus:ring-purple-400"
                    name="password"
                    id="password"
                    type="password"
                    />
                </div>
                <div className="mt-6">
                    <label
                    className="block mb-3 text-sm font-medium text-zinc-200"
                    for="password"
                    >Confirm Password</label
                    >
                    <input
                    placeholder="••••••••"
                    className="block w-full px-4 py-3 mt-2 border-2 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 focus:border-purple-400 focus:ring-opacity-50 focus:outline-none focus:ring focus:ring-purple-400"
                    name="password"
                    id="password"
                    type="password"
                    />
                </div>
                <div className="mt-10">
                    <button
                    className="w-full px-4 py-3 tracking-wide text-white transition-colors duration-200 transform bg-linear-to-r from-purple-500 to-violet-400 rounded-lg hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-4 focus:ring-purple-800"
                    type="submit"
                    >
                    Create
                    </button>
                </div>
            </div>
            <div className="px-8 py-4 bg-linear-to-br from-[#3E364B]/20 to-[#8726B7]/1">
                <div className="text-sm text-[#E4CAFB] text-center">
                    Already have an account?
                    <a className="font-medium underline" href="#">Login</a>
                </div>
            </div>
        </form>
    </div>
  )
}

export default Login
