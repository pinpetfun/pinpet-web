import { motion } from 'framer-motion'
import { FireIcon } from '@heroicons/react/24/solid'

export default function HeroSection() {
  return (
    <div className="px-8 py-12 relative overflow-hidden">
      {/* Background Decorations */}
      <motion.img 
        alt="cute cat" 
        className="absolute -top-10 -left-10 w-48 opacity-80 z-0" 
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9n6c7f5o8a4b3c2d1e0f9g8h7i6j5k4l3m2n1o0p9q8r7s6t5u4v3w2x1y0z_a_b_c_d_e_f_g"
        initial={{ rotate: -15, scale: 0 }}
        animate={{ rotate: -15, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      <motion.img 
        alt="cute dog" 
        className="absolute -bottom-16 -right-12 w-64 opacity-80 z-0" 
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCf_k3j2i1h0g9f8e7d6c5b4a3z2y1x0w9v8u7t6s5r4q3p2o1n0m9l8k7j6h5g4f3e2d1c"
        initial={{ rotate: 20, scale: 0 }}
        animate={{ rotate: 20, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />

      {/* Main Title */}
      <motion.div 
        className="text-center mb-16 relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-7xl font-fredoka text-orange-500 drop-shadow-[5px_5px_0px_rgba(0,0,0,1)] mb-4">
          BONKFun
        </h1>
        <p className="text-2xl text-gray-700 font-fredoka">为社区而建,由社区打造</p>
      </motion.div>

      {/* Hot Projects Section */}
      <motion.div 
        className="bg-cyan-300 border-4 border-black p-8 rounded-2xl mb-12 shadow-cartoon relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <motion.div 
          className="absolute -top-6 -left-6 bg-pink-500 text-white font-fredoka text-2xl px-4 py-2 rounded-full transform -rotate-12 border-2 border-black"
          animate={{ rotate: [-12, -8, -12] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          LIVE!
        </motion.div>
        
        <div className="text-center mb-6">
          <h2 className="text-4xl font-fredoka flex items-center justify-center text-black">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              <FireIcon className="w-12 h-12 mr-2 text-red-500" />
            </motion.div>
            热门项目
          </h2>
          <p className="mt-2 text-black font-fredoka text-lg">Join the hottest launches happening right now!</p>
        </div>
      </motion.div>
    </div>
  )
}