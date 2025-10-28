import React, { useState, useEffect } from 'react';
import { fetchHotProjects } from '../../services/hotProjectsService';
import { FireIcon } from '@heroicons/react/24/outline';
import { getTokenEmojiImage, getCircleEmojiImage } from '../../config/emojiConfig';

const HotProjectCard = ({ 
  name, 
  _marketCap,
  progress, 
  color, 
  isHot = false, 
  petImage, 
  contractAddress,
  mintAccount,
  onClick 
}) => {
  const handleClick = () => {
    if (onClick && mintAccount) {
      onClick(mintAccount);
    }
  };

  return (
    <div 
      className="bg-white text-black rounded-2xl border-2 border-gray-300 hover:border-orange-400 transition-all duration-300 shadow-md flex flex-col overflow-hidden max-w-sm mx-auto transform hover:-translate-y-2 cursor-pointer"
      onClick={handleClick}
    >
      <img
        alt="A cute pet illustration"
        className="w-full h-64 object-cover"
        src={petImage || getTokenEmojiImage(name, 400, 200, `#${color}`)}
      />
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center mb-2">
          <img
            alt={`${name} logo`}
            className="w-10 h-10 rounded-full border-2 border-gray-200"
            src={getCircleEmojiImage('token', 40)}
          />
          <div className="ml-3">
            <h3 className="text-lg font-bold text-gray-800">{name}</h3>
            <p className="text-sm text-gray-500">CA: <span className="font-bold text-gray-800">{contractAddress}</span></p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3">Join the hottest launches happening right now!</p>
        <div className="mt-auto pt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${color === 'FFA500' ? 'bg-orange-500' : color === '32CD32' ? 'bg-green-500' : color === '87CEEB' ? 'bg-blue-500' : 'bg-purple-500'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm font-medium">
            <span className="text-gray-500">Progress</span>
            <div>
              {isHot ? (
                <span className="text-red-500 font-bold">{progress}% HOT</span>
              ) : (
                <span className="text-gray-800">{progress}%</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HotProjectsSection = () => {
  const [hotProjects, setHotProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 加载热门项目数据
  useEffect(() => {
    const loadHotProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await fetchHotProjects(3); // 获取前3个项目
        
        if (result.success) {
          setHotProjects(result.data);
        } else {
          setError(result.error || 'Failed to load hot projects');
        }
      } catch (err) {
        console.error('Error loading hot projects:', err);
        setError('Failed to load hot projects');
      } finally {
        setLoading(false);
      }
    };

    loadHotProjects();
  }, []);

  // 点击项目卡片，跳转到交易页面
  const handleProjectClick = (mintAccount) => {
    if (mintAccount) {
      // 打开新窗口跳转到交易页面
      window.open(`/coin/${mintAccount}`, '_blank');
    }
  };

  // 渲染loading状态
  if (loading) {
    return (
      <div className="bg-cyan-300 border-4 border-black p-8 rounded-2xl mb-12 cartoon-shadow relative">
        <div className="absolute -top-6 -left-6 bg-pink-500 text-white font-nunito text-2xl px-4 py-2 rounded-full transform -rotate-12 border-2 border-black">
          LIVE!
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-4xl font-nunito flex items-center justify-center text-black">
            <FireIcon className="mr-2 text-red-500 w-12 h-12 animate-bounce" />
            Hot Projects
          </h2>
          <p className="mt-2 text-black font-nunito text-lg">Join the hottest launches happening right now!</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white text-black rounded-2xl border-2 border-gray-300 shadow-md flex flex-col overflow-hidden max-w-sm mx-auto animate-pulse">
              <div className="w-full h-64 bg-gray-300"></div>
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                  <div className="ml-3 flex-grow">
                    <div className="h-4 bg-gray-300 rounded mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-300 rounded mb-3"></div>
                <div className="mt-auto pt-2">
                  <div className="w-full bg-gray-300 rounded-full h-2.5 mb-2"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                    <div className="h-3 bg-gray-300 rounded w-12"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className="bg-cyan-300 border-4 border-black p-8 rounded-2xl mb-12 cartoon-shadow relative">
        <div className="absolute -top-6 -left-6 bg-pink-500 text-white font-nunito text-2xl px-4 py-2 rounded-full transform -rotate-12 border-2 border-black">
          LIVE!
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-4xl font-nunito flex items-center justify-center text-black">
            <FireIcon className="mr-2 text-red-500 w-12 h-12 animate-bounce" />
            Hot Projects
          </h2>
          <p className="mt-2 text-black font-nunito text-lg">Join the hottest launches happening right now!</p>
        </div>
        
        <div className="text-center py-8">
          <p className="text-red-600 font-semibold mb-4">Failed to load hot projects</p>
          <p className="text-gray-600 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cyan-300 border-4 border-black p-8 rounded-2xl mb-12 cartoon-shadow relative">
      <div className="absolute -top-6 -left-6 bg-pink-500 text-white font-nunito text-2xl px-4 py-2 rounded-full transform -rotate-12 border-2 border-black">
        LIVE!
      </div>
      
      <div className="text-center mb-6">
        <h2 className="text-4xl font-nunito flex items-center justify-center text-black">
          <FireIcon className="mr-2 text-red-500 w-12 h-12 animate-bounce" />
          Hot Projects
        </h2>
        <p className="mt-2 text-black font-nunito text-lg">Join the hottest launches happening right now!</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {hotProjects.length > 0 ? (
          hotProjects.map((project, index) => (
            <HotProjectCard key={project.mintAccount || index} {...project} onClick={handleProjectClick} />
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-600">No hot projects available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotProjectsSection;