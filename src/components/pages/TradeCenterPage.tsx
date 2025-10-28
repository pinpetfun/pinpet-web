import React from 'react';
import { useParams } from 'react-router-dom';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import { TradingChart, TokenInfo, TradingPanel, TokenInfoTabs, PositionPanel } from '../trading';
import { WebSocketDebug, ConfigDebug } from '../common';

const TradeCenterPage = () => {
  const { mintAddress } = useParams();

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Debug Panels */}
      {/* <WebSocketDebug /> */}
      {/* <ConfigDebug /> */}
      {/* Warning Banner */}
      {/* <div className="bg-yellow-200 border-2 border-yellow-500 text-yellow-800 px-4 py-2 mx-4 mt-4 rounded-lg flex items-center text-base cartoon-shadow">
        <LightBulbIcon className="h-5 w-5 mr-2 animate-pulse" />
        <span className="font-nunito">
          Exploring risky? Try <a className="font-bold underline hover:text-yellow-700" href="#">LaunchLabs &gt;</a>
        </span>
      </div> */}

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart and Token Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trading Chart */}
            <TradingChart mintAddress={mintAddress} />
            
            {/* Token Info */}
            <TokenInfo 
              mintAddress={mintAddress}
              contractAddress={mintAddress ? `${mintAddress.slice(0, 3)}...${mintAddress.slice(-4)}` : "G4V...bcoK"}
            />
            
            {/* Token Info Tabs */}
            <TokenInfoTabs mintAddress={mintAddress} />
          </div>

          {/* Right Column - Trading Panel */}
          <div>
            <TradingPanel mintAddress={mintAddress} />
            <PositionPanel mintAddress={mintAddress} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TradeCenterPage;