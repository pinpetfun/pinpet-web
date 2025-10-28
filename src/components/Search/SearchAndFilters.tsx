import { useState } from 'react'
import { MagnifyingGlassIcon, FireIcon, ClockIcon, Squares2X2Icon, ClockIcon as HistoryIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

export default function SearchAndFilters({ onSearch, onFilter }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('hot')

  const filters = [
    { id: 'hot', label: '最热门', icon: FireIcon, bgColor: 'bg-pink-400 hover:bg-pink-500' },
    { id: 'time', label: '创建时间', icon: ClockIcon, bgColor: 'bg-yellow-400 hover:bg-yellow-500' },
    { id: 'trending', label: '升序', icon: ClockIcon, bgColor: 'bg-yellow-400 hover:bg-yellow-500' },
    { id: 'view', label: '查看视图', icon: Squares2X2Icon, bgColor: 'bg-yellow-400 hover:bg-yellow-500' },
  ]

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    onSearch?.(e.target.value)
  }

  const handleFilterClick = (filterId) => {
    setActiveFilter(filterId)
    onFilter?.(filterId)
  }

  return (
    <div className="relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        {/* Search Box */}
        <div className="flex items-center bg-white border-2 border-black rounded-lg p-2 w-full md:w-auto shadow-cartoon-sm">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
          <input 
            className="bg-transparent text-black placeholder-gray-500 focus:outline-none ml-2 font-fredoka flex-1 md:w-64" 
            placeholder="搜索代币..." 
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-2 flex-wrap justify-center">
          <span className="text-gray-700 font-fredoka text-lg">筛选:</span>
          
          {filters.map((filter) => {
            const IconComponent = filter.icon
            return (
              <motion.button
                key={filter.id}
                onClick={() => handleFilterClick(filter.id)}
                className={`btn-cartoon ${filter.bgColor} flex items-center ${
                  activeFilter === filter.id ? 'ring-2 ring-orange-500' : ''
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent className="w-4 h-4 mr-1" />
                {filter.label}
              </motion.button>
            )
          })}
        </div>

        {/* All Tokens Link */}
        <button className="text-gray-700 hover:text-orange-500 flex items-center font-fredoka transition-colors">
          <HistoryIcon className="w-4 h-4 mr-1" />
          所有代币
        </button>
      </div>
    </div>
  )
}