import React, { useState, useEffect } from 'react';
import { InformationCircleIcon, ChartBarIcon, RectangleGroupIcon } from '@heroicons/react/24/outline';
import { useWebSocket } from '../../contexts/WebSocketContext.jsx';
import { useTradingData } from '../../hooks/useTradingData.js';
import EventItem from './EventItem.jsx';

const TokenInfoTabs = ({ _tokenName = "BRONK", mintAddress }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [tradingEvents, setTradingEvents] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  
  // 获取 mintInfo 数据
  const { mintInfo, mintInfoLoading } = useTradingData(mintAddress);
  
  // 使用WebSocket Context
  const { connectionStatus } = useWebSocket();

  // 监听历史交易事件
  useEffect(() => {
    const handleHistoryEvents = (event) => {
      const { symbol, events } = event.detail;
      
      // 只处理当前代币的数据
      if (symbol === mintAddress && events && events.length > 0) {
        console.log('📈 TokenInfoTabs 收到历史事件:', events.length, '条');
        setTradingEvents(events);
        setHistoryLoaded(true);
      }
    };

    window.addEventListener('history_events_update', handleHistoryEvents);
    
    return () => {
      window.removeEventListener('history_events_update', handleHistoryEvents);
    };
  }, [mintAddress]);

  // 监听实时交易事件
  useEffect(() => {
    const handleEventUpdate = (event) => {
      const { symbol, eventType, eventData, timestamp } = event.detail;
      
      // 只处理当前代币的数据
      if (symbol === mintAddress) {
        console.log('🔔 TokenInfoTabs 收到实时事件:', eventType);
        
        const newEvent = {
          event_type: eventType,
          event_data: eventData,
          timestamp: timestamp,
          symbol: symbol
        };
        
        // 实时事件添加到顶部
        setTradingEvents(prev => [newEvent, ...prev]);
      }
    };

    window.addEventListener('event_update', handleEventUpdate);
    
    return () => {
      window.removeEventListener('event_update', handleEventUpdate);
    };
  }, [mintAddress]);


  // 获取代币描述
  const getTokenDescription = () => {
    if (mintInfoLoading) {
      return 'Loading token information...';
    }
    
    if (mintInfo && mintInfo.uri_data && mintInfo.uri_data.description) {
      return mintInfo.uri_data.description;
    }
    
    // fallback 到原有描述
    return ``;
  };

  const tabContent = {
    info: (
      <div>
        <h4 className="text-2xl font-nunito mb-4 flex items-center">
          <InformationCircleIcon className="h-5 w-5 mr-2" />
          About Token
        </h4>
        <p className="text-base text-black leading-relaxed font-nunito">
          {getTokenDescription()}
        </p>
      </div>
    ),
    activity: (
      <div>
        <h4 className="text-2xl font-nunito mb-4 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2" />
          Trading Activity {connectionStatus === 'connected' && (
            <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Live</span>
          )}
        </h4>
        <div className="space-y-3 max-h-[48rem] overflow-y-auto">
          {tradingEvents.length > 0 ? (
            tradingEvents.map((event, index) => (
              <EventItem 
                key={`${event.timestamp}-${index}`} 
                event={event}
              />
            ))
          ) : (
            <div className="border-2 border-gray-200 rounded-lg p-3">
              <p className="text-sm font-nunito text-gray-600">
                {connectionStatus === 'connected' 
                  ? (historyLoaded ? 'No trading events found' : 'Loading trading events...') 
                  : 'Connection required to load trading events'
                }
              </p>
            </div>
          )}
        </div>
        {tradingEvents.length > 0 && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Showing {tradingEvents.length} trading events
          </div>
        )}
      </div>
    ),
    bubblemap: (
      <div>
        <h4 className="text-2xl font-nunito mb-4 flex items-center">
          <RectangleGroupIcon className="h-5 w-5 mr-2" />
          Bubblemap
        </h4>
        <div className="border-2 border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 font-nunito">Bubblemap visualization coming soon</p>
        </div>
      </div>
    ),
  };

  return (
    <div className="bg-white border-4 border-black rounded-2xl p-6 cartoon-shadow">
      {/* Tab Navigation */}
      <div className="flex border-b-2 border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab('info')}
          className={`py-2 px-4 text-base font-nunito transition-all ${
            activeTab === 'info' 
              ? 'border-b-3 border-orange-500 text-orange-500' 
              : 'text-gray-600 hover:text-black'
          }`}
        >
          Token Info
        </button>
        <button 
          onClick={() => setActiveTab('activity')}
          className={`py-2 px-4 text-base font-nunito transition-all ${
            activeTab === 'activity' 
              ? 'border-b-3 border-orange-500 text-orange-500' 
              : 'text-gray-600 hover:text-black'
          }`}
        >
          Trading Activity
          {tradingEvents.length > 0 && (
            <span className="ml-1 text-xs bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded-full">
              {tradingEvents.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('bubblemap')}
          className={`py-2 px-4 text-base font-nunito transition-all ${
            activeTab === 'bubblemap' 
              ? 'border-b-3 border-orange-500 text-orange-500' 
              : 'text-gray-600 hover:text-black'
          }`}
        >
          Bubblemap
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {tabContent[activeTab]}
      </div>
    </div>
  );
};

export default TokenInfoTabs;