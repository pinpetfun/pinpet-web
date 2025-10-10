import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function ProjectCard({ project, variant = 'large', isHot = false }) {
  const progress = parseFloat(project.progress)
  
  if (variant === 'compact') {
    return (
      <motion.div 
        className="card-cartoon p-4 flex items-center"
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
      >
        <img 
          alt={`${project.name} icon`} 
          className="w-24 h-24 rounded-full mr-4 border-2 border-black object-cover" 
          src={project.image}
        />
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-1">
            <div>
              <h3 className="text-xl font-fredoka">{project.name}</h3>
              <p className="text-xs text-gray-500">CA: {project.contractAddress}</p>
              <p className="text-xs text-gray-400">{project.timeAgo}</p>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-sm text-gray-500 font-semibold">市值</p>
            <p className="font-semibold text-lg">{project.marketCap}</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 border-2 border-black mb-1">
            <div 
              className={clsx(
                "h-full rounded-full",
                progress > 50 ? "bg-orange-400" : progress > 20 ? "bg-green-400" : "bg-gray-400"
              )} 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span>进度</span>
            <span>{project.progress}%</span>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="card-cartoon p-4"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative mb-4">
        <img 
          alt={`${project.name} coin`} 
          className="w-full h-40 object-cover rounded-xl border-2 border-black" 
          src={project.image}
        />
        {project.status && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 px-3 py-1 rounded-full text-white text-sm font-fredoka border-2 border-white">
            {project.status}
          </div>
        )}
        {isHot && (
          <div className="absolute top-2 right-2 bg-red-500 text-white font-fredoka text-xs px-2 py-1 rounded-full border-2 border-white animate-pulse">
            HOT
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-2xl font-fredoka">{project.name}</h3>
        <span className="text-sm text-gray-500">CA: {project.contractAddress}</span>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500 font-semibold">市值</p>
        <p className="text-xl font-bold">{project.marketCap}</p>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-4 border-2 border-black mb-2">
        <div 
          className={clsx(
            "h-full rounded-full border-r-2 border-black",
            progress > 50 ? "bg-orange-400" : progress > 20 ? "bg-green-400" : "bg-gray-400"
          )} 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex justify-between text-sm font-semibold">
        <span>进度</span>
        <div className="flex items-center">
          <span>{project.progress}%</span>
          {isHot && (
            <span className="ml-1 text-red-500 font-bold text-xs">HOT</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}