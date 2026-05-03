function Radio({ activeTab, onTabChange }) {
  const tabs = [
    { value: 'trending', label: 'Trending' },
    { value: 'following', label: 'Your Feed' },
    { value: 'friends', label: 'Friends' },
  ]

  return (
    <div className="flex w-120 space-x-2 bg-linear-to-br from-[#1f152e]/40 to-[#8726B7]/1 border border-gray-300/10 shadow-black rounded-xl select-none">
      {tabs.map(tab => (
        <label key={tab.value} className="radio flex grow items-center justify-center rounded-lg p-1 cursor-pointer">
          <input
            type="radio"
            name="radio"
            value={tab.value}
            className="peer hidden"
            checked={activeTab === tab.value}
            onChange={() => onTabChange(tab.value)}
          />
          <span className="tracking-widest peer-checked:bg-linear-to-r peer-checked:from-[blueviolet] peer-checked:to-[violet] peer-checked:text-white text-[#B68EDA] p-2 rounded-lg transition duration-150 ease-in-out">
            {tab.label}
          </span>
        </label>
      ))}
    </div>
  )
}

export default Radio