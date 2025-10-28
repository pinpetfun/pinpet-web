import React, { useState } from 'react';
import BuyPanel from './BuyPanel';
import SellPanel from './SellPanel';
import LongPanel from './LongPanel';
import ShortPanel from './ShortPanel';
import SlippageModal from './SlippageModal';
import { useTradingData } from '../../hooks/useTradingData';
import { getSlippageSettings } from '../../config/tradingConfig';

interface TradingPanelProps {
  mintAddress?: string;
  tokenSymbol?: string;
  onTrade?: (amount?: any, type?: any) => Promise<void> | void;
}

const TradingPanel = React.memo(({
  mintAddress = "",
  tokenSymbol = "FRIENDS",
  onTrade = () => {}
}: TradingPanelProps) => {
  const [activeMode, setActiveMode] = useState('buy');
  const [showSlippageModal, setShowSlippageModal] = useState(false);
  const [slippageSettings, setSlippageSettings] = useState(getSlippageSettings());

  // 从 useTradingData 获取刷新方法
  const {
    downOrders11,
    upOrders11,
    downOrders1000,
    upOrders1000,
    lastPrice,
    loading: tradingDataLoading,
    error: tradingDataError,
    _refreshData,
    forceRefreshWithBalance,
    userActionRefresh, // 新增：用户操作快速刷新
    hasData,
    _lastUpdated,
    _sdkReady,
    sdkError,
    retryCount,
    isBlocked,
    canRetry,
    // SOL 余额数据
    solBalance: realSolBalance,
    _balanceLoading,
    balanceError,
    _fetchSolBalance,
    // Token 余额数据
    tokenBalance: realTokenBalance,
    _tokenBalanceLoading,
    tokenBalanceError,
    _fetchTokenBalance,
    // 钱包状态
    _walletAddress,
    walletConnected,
    // Mint 信息数据
    mintInfo,
    mintInfoLoading
  } = useTradingData(mintAddress, {
    autoRefresh: true,
    refreshInterval: 30000 // 30秒刷新一次
  });

  // 用户输入防抖定时器
  const inputDebounceTimerRef = React.useRef(null);

  // 用户输入防抖刷新（400ms）
  const handleUserInputDebounce = React.useCallback(() => {
    if (inputDebounceTimerRef.current) {
      clearTimeout(inputDebounceTimerRef.current);
    }

    inputDebounceTimerRef.current = setTimeout(() => {
      console.log('[TradingPanel] User input stopped for 400ms, refreshing...');
      userActionRefresh(); // 使用用户操作刷新（400ms间隔）
    }, 400);
  }, [userActionRefresh]);

  // 快捷操作立即刷新
  const handleQuickActionRefresh = React.useCallback(() => {
    console.log('[TradingPanel] Quick action triggered, refreshing immediately...');
    userActionRefresh(); // 使用用户操作刷新（400ms间隔）
  }, [userActionRefresh]);

  // 清理防抖定时器
  React.useEffect(() => {
    return () => {
      if (inputDebounceTimerRef.current) {
        clearTimeout(inputDebounceTimerRef.current);
      }
    };
  }, []);

  // 获取动态 tokenSymbol
  const getDynamicTokenSymbol = () => {
    if (mintInfoLoading) {
      return 'Loading...';
    }
    
    if (mintInfo && mintInfo.symbol) {
      return mintInfo.symbol;
    }
    
    // fallback to prop or default
    return tokenSymbol || 'FRIENDS';
  };

  const dynamicTokenSymbol = getDynamicTokenSymbol();

  // Handle trading action
  const handleTrade = async (amount, type) => {
    try {
      console.log(`[TradingPanel] Trade initiated: ${type} ${amount}`);

      // 调用原始的交易回调
      if (onTrade) {
        const result = onTrade(amount, type);

        // 如果 onTrade 返回 Promise，等待它完成
        if (result && typeof result === 'object' && 'then' in result && typeof result.then === 'function') {
          console.log('[TradingPanel] Waiting for trade to complete...');
          await result;
          console.log('[TradingPanel] Trade completed successfully');
        } else {
          console.log('[TradingPanel] Trade callback returned immediately');
          // 如果没有返回 Promise，延迟一小段时间再刷新
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 交易完成后强制刷新数据和余额
      console.log('[TradingPanel] Force refreshing data after trade');
      forceRefreshWithBalance();

    } catch (error) {
      console.error('[TradingPanel] Trade failed:', error);

      // 即使交易失败，也要刷新数据（可能部分操作已经执行）
      console.log('[TradingPanel] Force refreshing data after trade failure');
      forceRefreshWithBalance();
    }
  };

  // 监听模式切换，智能刷新数据
  React.useEffect(() => {
    console.log(`[TradingPanel] Mode changed to: ${activeMode}`);

    // 检查是否需要不同的数据
    const needsDifferentData = (
      // 从 Buy/Sell 切换到 Long/Short，或反之
      (activeMode === 'long' || activeMode === 'short') && !downOrders1000 && !upOrders1000
    ) || !hasData; // 或者完全没有数据

    if (needsDifferentData) {
      console.log('[TradingPanel] Mode requires different data, refreshing...');
      userActionRefresh(); // 使用用户操作刷新
    }
  }, [activeMode, downOrders1000, upOrders1000, hasData, userActionRefresh]);

  // 确保余额安全，没有连接钱包时返回 0
  const safeSolBalance = walletConnected && !balanceError ? realSolBalance : 0;
  const safeTokenBalance = walletConnected && !tokenBalanceError ? realTokenBalance : 0;

  return (
    <div className="bg-white border-4 border-black rounded-2xl p-6 cartoon-shadow h-fit">
      {/* Four Trading Mode Toggle */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Buy + Long Group */}
        <div className="flex">
          <button 
            onClick={() => setActiveMode('buy')}
            className={`flex-1 py-3 text-lg font-nunito border-2 border-black cartoon-shadow trading-button rounded-lg btn-group-left ${
              activeMode === 'buy' 
                ? 'bg-green-500 text-white' 
                : 'bg-green-200 text-black hover:bg-green-300'
            }`}
          >
            Buy
          </button>
          <button 
            onClick={() => setActiveMode('long')}
            className={`flex-1 py-3 text-lg font-nunito border-2 border-black cartoon-shadow trading-button rounded-lg btn-group-right ${
              activeMode === 'long' 
                ? 'bg-green-500 text-white' 
                : 'bg-green-200 text-black hover:bg-green-300'
            }`}
          >
            Long
          </button>
        </div>
        
        {/* Sell + Short Group */}
        <div className="flex">
          <button 
            onClick={() => setActiveMode('sell')}
            className={`flex-1 py-3 text-lg font-nunito border-2 border-black cartoon-shadow trading-button rounded-lg btn-group-left ${
              activeMode === 'sell' 
                ? 'bg-red-500 text-white' 
                : 'bg-red-200 text-black hover:bg-red-300'
            }`}
          >
            Sell
          </button>
          <button 
            onClick={() => setActiveMode('short')}
            className={`flex-1 py-3 text-lg font-nunito border-2 border-black cartoon-shadow trading-button rounded-lg btn-group-right ${
              activeMode === 'short' 
                ? 'bg-red-500 text-white' 
                : 'bg-red-200 text-black hover:bg-red-300'
            }`}
          >
            Short
          </button>
        </div>
      </div>

      {/* Error status display */}
      {sdkError && (
        <div className="bg-red-50 border border-red-200 rounded p-2 mb-4">
          <div className="text-red-600 text-sm">SDK Error: {tradingDataError?.message || 'SDK initialization failed'}</div>
        </div>
      )}

      {isBlocked && (
        <div className="bg-red-50 border border-red-200 rounded p-2 mb-4">
          <div className="text-red-600 text-sm">
            ⛔ Data requests stopped due to repeated failures ({retryCount}/10)
          </div>
          <div className="text-red-500 text-xs mt-1">
            Please check your connection or try again later
          </div>
        </div>
      )}

      {tradingDataError && !isBlocked && retryCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-4">
          <div className="text-yellow-600 text-sm">
            ⚠️ Connection issues detected ({retryCount}/10 attempts)
          </div>
          <div className="text-yellow-500 text-xs mt-1">
            {canRetry ? 'Retrying automatically...' : 'Waiting 60s before retry...'}
          </div>
        </div>
      )}

      {/* Switch to Token and Set Max Slippage Buttons */}
      <div className="flex justify-between items-center mb-4">
        <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-nunito border border-gray-400 hover:bg-gray-300 transition-colors">
          Switch to {dynamicTokenSymbol}
        </button>
        <button 
          onClick={() => setShowSlippageModal(true)}
          className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-nunito hover:bg-gray-300 border border-gray-400 transition-colors"
        >
          Set max slippage ({slippageSettings.slippage}%)
        </button>
      </div>

      {/* Dynamic Panel Content */}
      {activeMode === 'buy' && (
        <BuyPanel
          mintAddress={mintAddress}
          tokenSymbol={dynamicTokenSymbol}
          solBalance={safeSolBalance}
          slippageSettings={slippageSettings}
          onBuy={handleTrade}
          onRefreshData={forceRefreshWithBalance}
          onUserInputDebounce={handleUserInputDebounce}
          onQuickActionRefresh={handleQuickActionRefresh}
          tradingData={{
            downOrders11,
            upOrders11,
            upOrders1000,
            lastPrice,
            hasData,
            loading: tradingDataLoading
          }}
        />
      )}
      {activeMode === 'sell' && (
        <SellPanel
          mintAddress={mintAddress}
          tokenSymbol={dynamicTokenSymbol}
          tokenBalance={safeTokenBalance}
          slippageSettings={slippageSettings}
          onSell={handleTrade}
          onRefreshData={forceRefreshWithBalance}
          onUserInputDebounce={handleUserInputDebounce}
          onQuickActionRefresh={handleQuickActionRefresh}
          tradingData={{
            downOrders11,
            upOrders11,
            lastPrice,
            hasData,
            loading: tradingDataLoading
          }}
        />
      )}
      {activeMode === 'long' && (
        <>
          {console.log('[TradingPanel] Rendering LongPanel with data:', {
            mintAddress,
            hasDownOrders1000: !!downOrders1000,
            hasLastPrice: !!lastPrice,
            lastPrice,
            downOrders1000
          })}
          <LongPanel
            tokenSymbol={dynamicTokenSymbol}
            solBalance={safeSolBalance}
            mintAddress={mintAddress}
            onLong={handleTrade}
            onUserInputDebounce={handleUserInputDebounce}
            onQuickActionRefresh={handleQuickActionRefresh}
            tradingData={{
              downOrders11,
              upOrders11,
              downOrders1000,
              upOrders1000,
              lastPrice,
              hasData,
              loading: tradingDataLoading
            }}
          />
        </>
      )}
      {activeMode === 'short' && (
        <ShortPanel
          tokenSymbol={dynamicTokenSymbol}
          solBalance={safeSolBalance}
          mintAddress={mintAddress}
          onShort={handleTrade}
          onUserInputDebounce={handleUserInputDebounce}
          onQuickActionRefresh={handleQuickActionRefresh}
          tradingData={{
            downOrders11,
            upOrders11,
            upOrders1000,
            lastPrice,
            hasData,
            loading: tradingDataLoading
          }}
        />
      )}
      
      {/* Slippage Modal */}
      <SlippageModal 
        isOpen={showSlippageModal}
        onClose={() => setShowSlippageModal(false)}
        onSettingsChange={setSlippageSettings}
      />
    </div>
  );
}, (prevProps: TradingPanelProps, nextProps: TradingPanelProps) => {
  // 只有关键props变化才重渲染，避免数据刷新导致的无意义重渲染
  return prevProps.mintAddress === nextProps.mintAddress &&
         prevProps.tokenSymbol === nextProps.tokenSymbol &&
         prevProps.onTrade === nextProps.onTrade;
});

export default TradingPanel;