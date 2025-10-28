import { useState } from 'react'
import { motion } from 'framer-motion'
import Navigation from '../components/Header/Navigation'
import HeroSection from '../components/Layout/HeroSection'
import SearchAndFilters from '../components/Search/SearchAndFilters'
import ProjectCard from '../components/Card/ProjectCard'
import Container from '../components/Layout/Container'
import { hotProjects, featuredProjects } from '../data/mockData'

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('hot')
  const [filteredProjects, setFilteredProjects] = useState(featuredProjects)

  const handleSearch = (term) => {
    setSearchTerm(term)
    filterProjects(term, activeFilter)
  }

  const handleFilter = (filter) => {
    setActiveFilter(filter)
    filterProjects(searchTerm, filter)
  }

  const filterProjects = (term, filter) => {
    let filtered = [...featuredProjects]
    
    // Search filter
    if (term) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(term.toLowerCase())
      )
    }
    
    // Sort filter
    switch (filter) {
      case 'hot':
        filtered.sort((a, b) => parseFloat(b.progress) - parseFloat(a.progress))
        break
      case 'time':
        // Sort by creation time (mock - in real app would use actual timestamps)
        filtered.sort((a, b) => a.id - b.id)
        break
      case 'trending':
        filtered.sort((a, b) => parseFloat(a.progress) - parseFloat(b.progress))
        break
      default:
        break
    }
    
    setFilteredProjects(filtered)
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <Navigation />
      
      <main>
        <HeroSection />
        
        <Container>
          {/* Hot Projects Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {hotProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
              >
                <ProjectCard project={project} variant="compact" isHot={project.isHot} />
              </motion.div>
            ))}
          </motion.div>

          <SearchAndFilters onSearch={handleSearch} onFilter={handleFilter} />

          {/* Featured Projects Section */}
          <motion.div 
            className="text-left mb-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <h2 className="text-5xl font-fredoka text-orange-500 drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              特色代币
            </h2>
            <p className="text-gray-600 font-fredoka text-xl">目前最热门的代币，值得关注。</p>
          </motion.div>

          {/* Featured Projects Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            layout
          >
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ProjectCard 
                  project={project} 
                  variant={project.timeAgo ? 'compact' : 'large'} 
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Load More Section */}
          <motion.div 
            className="text-center mt-12 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.5 }}
          >
            <button className="btn-cartoon text-lg px-8 py-3">
              加载更多代币
            </button>
          </motion.div>
        </Container>
      </main>
    </div>
  )
}