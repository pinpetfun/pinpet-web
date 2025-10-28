import React from 'react';

const TokenCard = ({ 
  name, 
  contractAddress, 
  marketCap, 
  progress, 
  image, 
  isCompleted = false, 
  isCompact = false,
  timeAgo = null,
  mintAccount,
  onClick 
}) => {
  const handleClick = () => {
    if (onClick && mintAccount) {
      onClick(mintAccount);
    }
  };
  if (isCompact) {
    return (
      <div 
        className="bg-white border-4 border-black rounded-2xl p-4 cartoon-shadow flex items-center transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer"
        onClick={handleClick}
      >
        <img 
          alt={`${name} coin`} 
          className="w-24 h-24 rounded-lg mr-4 border-2 border-black object-cover" 
          src={image}
        />
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-1">
            <div>
              <h3 className="text-xl font-nunito">{name}</h3>
              <p className="text-xs text-gray-500">CA: {contractAddress}</p>
              {timeAgo && <p className="text-xs text-gray-400">{timeAgo}</p>}
            </div>
          </div>
          <div className="mb-2">
            <p className="text-sm text-gray-500 font-semibold">Market Cap</p>
            <p className="font-semibold text-lg">{marketCap}</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 border-2 border-black mb-1">
            <div className="bg-gray-400 h-full rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white border-4 border-black rounded-2xl p-4 cartoon-shadow transform hover:-translate-y-2 transition-transform duration-300 w-full max-w-[280px] mx-auto h-[320px] flex flex-col cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative mb-3 flex-shrink-0">
        <img 
          alt={`${name} coin`} 
          className="w-full h-32 object-cover rounded-xl border-2 border-black" 
          src={image}
        />
        {isCompleted && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 px-2 py-1 rounded-full text-white text-xs font-nunito border-2 border-white">
            Completed
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-nunito">{name}</h3>
        <span className="text-xs text-gray-500">CA: {contractAddress}</span>
      </div>
      
      <div className="mb-3 flex-grow">
        <p className="text-xs text-gray-500 font-semibold">Market Cap</p>
        <p className="text-lg font-bold">{marketCap}</p>
      </div>
      
      <div className="mt-auto">
        <div className="w-full bg-gray-200 rounded-full h-3 border-2 border-black mb-2">
          <div 
            className={`h-full rounded-full border-r-2 border-black ${
              progress > 50 ? 'bg-orange-400' : progress > 20 ? 'bg-green-400' : 'bg-gray-400'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs font-semibold">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default TokenCard;