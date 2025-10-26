import React, { useState, useEffect } from 'react';
import { TokenCard } from '../common';
import { fetchFeaturedTokens } from '../../services/featuredTokensService';

const FeaturedTokens = () => {
  const [featuredTokens, setFeaturedTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 加载精选代币数据
  useEffect(() => {
    const loadFeaturedTokens = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await fetchFeaturedTokens(15); // 获取前15个代币
        
        if (result.success) {
          setFeaturedTokens(result.data);
        } else {
          setError(result.error || 'Failed to load featured tokens');
        }
      } catch (err) {
        console.error('Error loading featured tokens:', err);
        setError('Failed to load featured tokens');
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedTokens();
  }, []);

  // 点击代币卡片，跳转到交易页面
  const handleTokenClick = (mintAccount) => {
    if (mintAccount) {
      // 打开新窗口跳转到交易页面
      window.open(`/coin/${mintAccount}`, '_blank');
    }
  };

  // 渲染loading状态
  if (loading) {
    return (
      <div className="relative z-10">
        <div className="text-left mb-6">
          <h2 className="text-5xl font-nunito text-orange-500 drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">
            Featured Tokens
          </h2>
          <p className="text-gray-600 font-nunito text-xl">The hottest tokens right now, worth your attention.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-x-2 gap-y-4 items-start" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'}}>
          {[...Array(15)].map((_, index) => (
            <div key={index} className="bg-white border-4 border-black rounded-2xl p-4 cartoon-shadow w-full max-w-[280px] mx-auto h-[320px] flex flex-col animate-pulse">
              <div className="relative mb-3 flex-shrink-0">
                <div className="w-full h-32 bg-gray-300 rounded-xl"></div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-3 bg-gray-300 rounded w-16"></div>
              </div>
              <div className="mb-3 flex-grow">
                <div className="h-3 bg-gray-300 rounded w-16 mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-12"></div>
              </div>
              <div className="mt-auto">
                <div className="w-full bg-gray-300 rounded-full h-3 mb-2"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-300 rounded w-12"></div>
                  <div className="h-3 bg-gray-300 rounded w-8"></div>
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
      <div className="relative z-10">
        <div className="text-left mb-6">
          <h2 className="text-5xl font-nunito text-orange-500 drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">
            Featured Tokens
          </h2>
          <p className="text-gray-600 font-nunito text-xl">The hottest tokens right now, worth your attention.</p>
        </div>
        
        <div className="text-center py-8">
          <p className="text-red-600 font-semibold mb-4">Failed to load featured tokens</p>
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
    <div className="relative z-10">
      <div className="text-left mb-6">
        <h2 className="text-5xl font-nunito text-orange-500 drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          Featured Tokens
        </h2>
        <p className="text-gray-600 font-nunito text-xl">The hottest tokens right now, worth your attention.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-x-2 gap-y-4 items-start" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'}}>
        {featuredTokens.length > 0 ? (
          featuredTokens.map((token, index) => (
            <TokenCard key={token.mintAccount || index} {...token} onClick={() => handleTokenClick(token.mintAccount)} />
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-600">No featured tokens available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedTokens;