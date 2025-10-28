import React, { useState, useEffect, useCallback, useRef } from 'react';
import { calculateTokensFromSOL, formatDisplayNumber } from '../../utils/priceCalculator';
import { Decimal } from 'decimal.js';
import { usePinPetSdk } from '../../contexts/PinPetSdkContext';
import { useWalletContext } from '../../contexts/WalletContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { TradingToast } from '../common';
import { getSlippageSettings, getActualSlippage } from '../../config/tradingConfig';

interface ShortPanelProps {
  tokenSymbol?: string;
  solBalance?: number;
  mintAddress?: string;
  onShort?: (amount: any, type: any, options?: any) => Promise<void> | void;
  onUserInputDebounce?: () => void;
  onQuickActionRefresh?: () => void;
  tradingData?: any;
}

const ShortPanel = React.memo(({
  tokenSymbol = "FRIENDS",
  solBalance = 0,
  mintAddress = "",
  onShort = () => {},
  onUserInputDebounce = () => {}, // 新增：用户输入防抖回调
  onQuickActionRefresh = () => {}, // 新增：快捷操作刷新回调
  tradingData = {}
}: ShortPanelProps) => {
  const { upOrders1000, lastPrice, loading } = tradingData;
  const [amount, setAmount] = useState('1');
  const [leverage, setLeverage] = useState(2.0);
  const [stopLoss] = useState(30);
  const [isValid, setIsValid] = useState(true);
  
  // Stop Loss 分析相关状态
  const [stopLossAnalysis, setStopLossAnalysis] = useState(null);
  const [stopLossLoading, setStopLossLoading] = useState(false);
  const [stopLossError, setStopLossError] = useState(null);
  
  // SDK 和钱包 hooks
  const { sdk, isReady } = usePinPetSdk();
  const { walletAddress, connected } = useWalletContext();
  const { signTransaction } = useWallet();
  
  // 做空状态
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 提示框状态
  const [toast, setToast] = useState({
    isVisible: false,
    type: 'success', // 'success', 'error', 'info'
    message: '',
    txHash: ''
  });

  // 精度转换函数 (参考 LongPanel)
  const convertToSolDecimals = (amount, decimals = 9) => {
    const factor = Math.pow(10, decimals);
    return new anchor.BN(Math.floor(amount * factor).toString());
  };
  
  // 滑点计算函数 - minSolOutput (参考 SellPanel，做空卖出时减去滑点)
  const calculateMinSolOutput = (solAmount, slippagePercent) => {
    const slippageMultiplier = 1 - (slippagePercent / 100);
    const minAmount = parseFloat(solAmount) * slippageMultiplier;
    return convertToSolDecimals(minAmount, 9);
  };
  
  // 滑点计算函数 - marginSol (保证金加上滑点)
  const calculateMaxMarginSol = (solAmount, slippagePercent) => {
    const slippageMultiplier = 1 + (slippagePercent / 100);
    const maxAmount = parseFloat(solAmount) * slippageMultiplier;
    return convertToSolDecimals(maxAmount, 9);
  };
  
  // 显示提示框
  const showToast = (type, message, txHash = '') => {
    setToast({
      isVisible: true,
      type,
      message,
      txHash
    });
  };
  
  // 关闭提示框
  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Calculate position value in SOL with leverage - 使用 SDK 返回的 leverage
  const calculatePositionValue = (solAmount) => {
    const numAmount = parseFloat(solAmount) || 0;
    // 如果有 SDK 返回的 leverage，使用它；否则使用滑动条的值
    const effectiveLeverage = stopLossAnalysis?.leverage ? parseFloat(stopLossAnalysis.leverage) : leverage;
    return numAmount * effectiveLeverage;
  };

  // Calculate how many tokens to short using precise decimal calculation
  const calculateTokensToShort = (solAmount) => {
    if (!lastPrice) return '0';
    const numAmount = parseFloat(solAmount) || 0;
    const leveragedAmount = numAmount * leverage;
    const tokensAmount = calculateTokensFromSOL(leveragedAmount.toString(), lastPrice);
    return formatDisplayNumber(tokensAmount, 6);
  };
  
  // 获取显示用的 leverage
  const getDisplayLeverage = () => {
    return stopLossAnalysis?.leverage ? parseFloat(stopLossAnalysis.leverage) : leverage;
  };
  
  // 获取显示用的代币数量
  const getDisplayTokens = () => {
    if (stopLossAnalysis?.sellTokenAmount) {
      // SDK 返回的是 u64 格式 (10^6 精度)
      const tokenAmount = parseFloat(stopLossAnalysis.sellTokenAmount) / 1e6;
      return formatDisplayNumber(tokenAmount.toString(), 6);
    }
    return calculateTokensToShort(amount);
  };
  
  // 计算动态百分比: (estimatedMargin / sellSolAmount) * 100
  const getDynamicPercentage = () => {
    if (stopLossAnalysis?.estimatedMargin) {
      try {
        // sellSolAmount 是当前用户输入的 SOL 数量转换为 lamports
        const sellSolAmountInLamports = convertToSolDecimals(parseFloat(amount), 9);
        const estimatedMarginValue = parseFloat(stopLossAnalysis.estimatedMargin);
        const sellSolAmountValue = parseFloat(sellSolAmountInLamports.toString());
        
        if (sellSolAmountValue > 0) {
          const percentage = Math.floor((estimatedMarginValue / sellSolAmountValue) * 100);
          // 98% 及以上都显示 100%
          return percentage >= 98 ? 100 : percentage;
        }
      } catch (error) {
        console.error('[ShortPanel] 动态百分比计算错误:', error);
      }
    }
    return 100; // 默认值
  };
  
  // 计算调整后的头寸价值
  const getAdjustedPositionValue = () => {
    const percentage = getDynamicPercentage();
    const baseValue = calculatePositionValue(amount);
    const adjustedValue = baseValue * (percentage / 100);
    
    console.log('[ShortPanel] 调整后头寸价值计算:', {
      percentage: percentage,
      baseValue: baseValue,
      adjustedValue: adjustedValue
    });
    
    return adjustedValue;
  };

  // Handle quick amount buttons
  const handleQuickAmount = (type) => {
    let newAmount = '0';
    switch(type) {
      case 'reset':
        newAmount = '0';
        break;
      case '0.1':
        newAmount = '0.1';
        break;
      case '0.5':
        newAmount = '0.5';
        break;
      case '1':
        newAmount = '1';
        break;
      case 'max':
        newAmount = solBalance.toString();
        break;
      default:
        break;
    }

    setAmount(newAmount);

    // 快捷按钮（除了 Reset）立即刷新数据
    if (type !== 'reset' && parseFloat(newAmount) > 0) {
      console.log('[ShortPanel] Quick amount button clicked, triggering refresh...');
      onQuickActionRefresh();
    }
  };

  // Handle amount input change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);

    const numValue = parseFloat(value) || 0;
    setIsValid(numValue <= solBalance && numValue > 0);

    // 用户输入时触发防抖刷新
    if (numValue > 0) {
      console.log('[ShortPanel] Amount input changed, triggering debounced refresh...');
      onUserInputDebounce();
    }
  };

  // Handle leverage change
  const handleLeverageChange = (e) => {
    const value = parseFloat(e.target.value);
    setLeverage(parseFloat(value.toFixed(1)));

    // 杠杆调整也触发防抖刷新
    console.log('[ShortPanel] Leverage changed, triggering debounced refresh...');
    onUserInputDebounce();
  };

  // 计算 stopLossPrice (做空逻辑：价格上涨时止损)
  const calculateStopLossPrice = useCallback((currentLeverage, priceData) => {
    console.log('[ShortPanel] calculateStopLossPrice called with:', {
      currentLeverage,
      priceData,
      priceDataType: typeof priceData
    });
    
    // 处理不同的价格数据格式
    let rawPrice;
    if (typeof priceData === 'string' || typeof priceData === 'number') {
      // 直接是价格字符串/数字
      rawPrice = priceData;
    } else if (priceData?.data?.price) {
      // 对象格式 { data: { price: "..." } }
      rawPrice = priceData.data.price;
    } else {
      console.log('[ShortPanel] calculateStopLossPrice failed: invalid price data format');
      return null;
    }
    
    if (!rawPrice) {
      console.log('[ShortPanel] calculateStopLossPrice failed: no price value');
      return null;
    }
    
    try {
      // lastPrice 是 u128 格式
      const currentPriceRaw = new Decimal(rawPrice);
      
      // 做空止损逻辑：价格上涨 1/leverage 比例时止损
      // stopLossPrice = currentPrice × (1 + 1/leverage)
      const stopLossMultiplier = new Decimal(1).plus(new Decimal(1).div(currentLeverage));
      const stopLossPrice = currentPriceRaw.mul(stopLossMultiplier);
      
      console.log('[ShortPanel] StopLoss calculation:', {
        leverage: currentLeverage,
        stopLossMultiplier: stopLossMultiplier.toString(),
        currentPriceRaw: currentPriceRaw.toString(),
        stopLossPrice: stopLossPrice.toString()
      });
      
      // 返回整数字符串格式 (u128) - 使用 toFixed(0) 避免科学计数法
      return stopLossPrice.floor().toFixed(0);
    } catch (error) {
      console.error('[ShortPanel] StopLoss price calculation error:', error);
      setStopLossError(error);
      return null;
    }
  }, []);

  // 调用 SDK 模拟 Short Stop Loss (使用 SOL 金额输入)
  const simulateStopLoss = useCallback(async (currentAmount, currentLeverage) => {
    if (!isReady || !sdk || !mintAddress || !lastPrice || !upOrders1000) {
      console.log('[ShortPanel] SDK not ready or missing data for stop loss simulation');
      return;
    }

    try {
      setStopLossLoading(true);
      setStopLossError(null);

      // 将 SOL 金额转换为 u64 格式 (9位精度 lamports)
      const sellSolAmount = convertToSolDecimals(parseFloat(currentAmount), 9).toString();

      // 计算 stopLossPrice (使用滑动条的 leverage)
      const stopLossPrice = calculateStopLossPrice(currentLeverage, lastPrice);
      
      if (!stopLossPrice) {
        console.log('[ShortPanel] Failed to calculate stopLossPrice');
        return;
      }

      console.log('[ShortPanel] Simulating stop loss with:', {
        mint: mintAddress,
        sellSolAmount,
        stopLossPrice,
        hasLastPrice: !!lastPrice,
        hasOrdersData: !!upOrders1000
      });

      // 调用 SDK - 使用 simulateSellSolStopLoss
      const inputParams = {
        mintAddress,
        sellSolAmount,
        stopLossPrice,
        lastPrice,
        upOrders1000
      };
      console.log('[ShortPanel] simulateSellSolStopLoss1 input params JSON:', JSON.stringify(inputParams, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      , 2));
      
      const result = await sdk.simulator.simulateSellSolStopLoss(
        mintAddress,
        sellSolAmount,
        stopLossPrice,
        lastPrice,
        upOrders1000
      );


      console.log('[ShortPanel] simulateSellSolStopLoss2 result JSON:', JSON.stringify(result, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      , 2));
      setStopLossAnalysis(result);

    } catch (error) {
      console.error('[ShortPanel] Stop loss simulation failed:', error);
      setStopLossError(error);
    } finally {
      setStopLossLoading(false);
    }
  }, [isReady, sdk, mintAddress, lastPrice, upOrders1000, calculateStopLossPrice]);

  // Handle short action - 完整的做空功能
  const handleShort = async () => {
    if (!isValid || parseFloat(amount) <= 0) {
      console.log('[ShortPanel] Invalid amount or conditions');
      return;
    }

    // 验证前置条件
    if (!connected) {
      showToast('error', 'Please connect your wallet first');
      return;
    }

    if (!isReady || !sdk) {
      showToast('error', 'SDK not ready, please try again later');
      return;
    }

    if (!mintAddress) {
      showToast('error', 'Token address not found');
      return;
    }

    if (!walletAddress) {
      showToast('error', 'Unable to get wallet address');
      return;
    }

    if (!stopLossAnalysis || !stopLossAnalysis.executableStopLossPrice) {
      showToast('error', 'Stop loss data not available, please wait for calculation');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('[ShortPanel] 开始做空流程...');

      // 获取滑点设置
      const slippageSettings = getSlippageSettings();
      const slippagePercent = slippageSettings.slippage;
      const actualSlippage = getActualSlippage(slippagePercent);

      // 计算参数 - 使用 SDK 返回的值
      const originalSolAmount = parseFloat(amount);
      const effectiveLeverage = stopLossAnalysis.leverage ? parseFloat(stopLossAnalysis.leverage) : leverage;
      const leveragedSolAmount = originalSolAmount * effectiveLeverage; // 杠杆后的头寸价值

      // 使用 SDK 返回的 sellTokenAmount (已经是 u64 格式)
      const borrowSellTokenAmount = new anchor.BN(stopLossAnalysis.sellTokenAmount.toString());

      // 计算 minSolOutput (positionValue减去滑点，9位精度)
      const minSolOutput = calculateMinSolOutput(leveragedSolAmount, actualSlippage);

      // 计算 marginSol (保证金加上滑点，9位精度)
      const marginSol = calculateMaxMarginSol(originalSolAmount, actualSlippage);
      
      // 止损参数
      const closePrice = new anchor.BN(stopLossAnalysis.executableStopLossPrice.toString());
      const prevOrder = stopLossAnalysis.prev_order_pda ? new PublicKey(stopLossAnalysis.prev_order_pda) : null;
      const nextOrder = stopLossAnalysis.next_order_pda ? new PublicKey(stopLossAnalysis.next_order_pda) : null;

      console.log('[ShortPanel] 做空参数:', {
        mintAddress,
        originalSolAmount,
        leveragedSolAmount,
        effectiveLeverage,
        slippagePercent,
        borrowSellTokenAmount: borrowSellTokenAmount.toString(),
        minSolOutput: minSolOutput.toString(),
        marginSol: marginSol.toString(),
        closePrice: closePrice.toString(),
        prevOrder: prevOrder?.toString(),
        nextOrder: nextOrder?.toString(),
        walletAddress
      });

      // 调用 SDK 做空接口
      console.log('[ShortPanel] 调用 sdk.trading.short...');
      const result = await sdk.trading.short({
        mintAccount: mintAddress,
        borrowSellTokenAmount: borrowSellTokenAmount,
        minSolOutput: minSolOutput,
        marginSol: marginSol,
        closePrice: closePrice,
        prevOrder: prevOrder,
        nextOrder: nextOrder,
        payer: new PublicKey(walletAddress)
      });

      console.log('[ShortPanel] SDK 返回结果:', result);

      // 获取最新的 blockhash
      console.log('[ShortPanel] 获取最新 blockhash...');
      const connection = sdk.connection || sdk.getConnection();
      const { blockhash } = await connection.getLatestBlockhash();
      result.transaction.recentBlockhash = blockhash;
      result.transaction.feePayer = new PublicKey(walletAddress);

      console.log('[ShortPanel] 更新 blockhash:', blockhash);

      // 钱包签名
      console.log('[ShortPanel] 请求钱包签名...');
      const signedTransaction = await signTransaction(result.transaction);

      console.log('[ShortPanel] 钱包签名完成');

      // 发送交易
      console.log('[ShortPanel] 发送交易...');
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      console.log('[ShortPanel] 等待交易确认...');
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('[ShortPanel] ✅ 做空成功!');
      console.log('[ShortPanel] 交易签名:', signature);
      
      // 调用原有的回调（保持兼容性）
      onShort(amount, 'short', { leverage, stopLoss, stopLossAnalysis });
      
      // 显示成功提示框
      const displayTokenAmount = parseFloat(stopLossAnalysis.sellTokenAmount) / 1e6;
      showToast('success', `Successfully opened short position: ${displayTokenAmount.toFixed(6)} ${tokenSymbol} with ${effectiveLeverage.toFixed(1)}x leverage`, signature);

    } catch (error) {
      console.error('[ShortPanel] 做空失败:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL balance';
      } else if (error.message.includes('blockhash')) {
        errorMessage = 'Network busy, please try again later';
      }
      
      // 显示错误提示框
      showToast('error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // 防抖计算状态 - 使用 useRef 避免无限循环
  const lastCalculationTimeRef = useRef(0);
  const debounceTimeoutRef = useRef(null);
  const lastUserInputRef = useRef({ amount: amount, leverage: leverage });

  // 监听 amount 和 leverage 变化，触发 stop loss 计算
  useEffect(() => {
    try {
      const currentAmount = parseFloat(amount);
      const now = Date.now();
      
      // 清理之前的定时器
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      
      // 检查是否满足计算条件
      if (currentAmount > 0 && leverage > 0 && isReady && mintAddress && lastPrice && upOrders1000) {
        // 检查是否是用户主动操作 (amount 或 leverage 发生变化)
        const lastInput = lastUserInputRef.current;
        const isUserAction = lastInput.amount !== amount || lastInput.leverage !== leverage;
        
        if (isUserAction) {
          // 用户主动操作：立即执行
          console.log('[ShortPanel] 用户操作触发，立即计算 Stop Loss...');
          lastCalculationTimeRef.current = now;
          lastUserInputRef.current = { amount, leverage };
          simulateStopLoss(amount, leverage);
        } else {
          // 其他数据变化：应用10秒防抖
          const timeSinceLastCalculation = now - lastCalculationTimeRef.current;
          const shouldWait = timeSinceLastCalculation < 10000; // 10秒
          
          if (shouldWait) {
            console.log('[ShortPanel] 数据更新防抖: 距离上次计算', Math.round(timeSinceLastCalculation/1000), '秒，等待中...');
            
            // 设置定时器，在剩余时间后执行
            const remainingTime = 10000 - timeSinceLastCalculation;
            debounceTimeoutRef.current = setTimeout(() => {
              console.log('[ShortPanel] 防抖计时结束，开始计算...');
              lastCalculationTimeRef.current = Date.now();
              simulateStopLoss(amount, leverage);
            }, remainingTime);
          } else {
            // 可以立即执行
            console.log('[ShortPanel] 数据更新，立即执行 Stop Loss 计算...');
            lastCalculationTimeRef.current = now;
            simulateStopLoss(amount, leverage);
          }
        }
      } else {
        // 条件不满足，清空分析结果
        setStopLossAnalysis(null);
        setStopLossError(null);
      }
    } catch (error) {
      console.error('[ShortPanel] useEffect error:', error);
    }

    // 清理函数
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [amount, leverage, isReady, mintAddress, lastPrice, upOrders1000, simulateStopLoss]);

  const hasInsufficientBalance = parseFloat(amount) > solBalance;

  return (
    <div className="space-y-4">

      {/* Balance Display */}
      <div className="text-gray-700 font-nunito">
        balance: <span className="font-bold">{solBalance} SOL</span>
      </div>

      {/* Amount Input with Leverage Display */}
      <div className="flex items-center justify-between space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="w-full bg-white text-black text-xl font-bold p-3 rounded-lg border-2 border-black focus:border-red-500 focus:outline-none"
            placeholder="0"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-black font-nunito text-sm">SOL</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="text-xs font-nunito text-gray-500 leading-none">{getDynamicPercentage()}%</div>
          <span className="text-xl font-nunito font-bold">x {getDisplayLeverage().toFixed(1)} ≈</span>
        </div>
        <div className="flex-1 relative">
          <div className="w-full bg-purple-100 text-black text-xl font-bold p-3 rounded-lg border-2 border-black">
            {getAdjustedPositionValue().toFixed(1)}
          </div>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-black font-nunito text-sm">SOL</span>
          </div>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => handleQuickAmount('reset')}
          className="flex-1 bg-gray-600 text-white py-2 px-1 rounded font-nunito text-xs hover:bg-gray-700 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => handleQuickAmount('0.1')}
          className="flex-1 bg-gray-600 text-white py-2 px-1 rounded font-nunito text-xs hover:bg-gray-700 transition-colors"
        >
          0.1 SOL
        </button>
        <button
          onClick={() => handleQuickAmount('0.5')}
          className="flex-1 bg-gray-600 text-white py-2 px-1 rounded font-nunito text-xs hover:bg-gray-700 transition-colors"
        >
          0.5 SOL
        </button>
        <button
          onClick={() => handleQuickAmount('1')}
          className="flex-1 bg-gray-600 text-white py-2 px-1 rounded font-nunito text-xs hover:bg-gray-700 transition-colors"
        >
          1 SOL
        </button>
        <button
          onClick={() => handleQuickAmount('max')}
          className="flex-1 bg-gray-600 text-white py-2 px-1 rounded font-nunito text-xs hover:bg-gray-700 transition-colors"
        >
          Max
        </button>
      </div>

      {/* Calculated Result */}
      <div className="text-center text-gray-700 font-nunito">
        You will short <span className="font-bold">{getDisplayTokens()}</span> {tokenSymbol} tokens
      </div>

      {/* Leverage Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-nunito font-bold text-gray-700">Leverage:</span>
          <span className="font-nunito font-bold text-xl">
            x{getDisplayLeverage().toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="0.1"
          value={leverage}
          onChange={handleLeverageChange}
          className="w-full h-3 bg-purple-200 rounded-lg cursor-pointer border-2 border-black leverage-slider"
          style={{
            background: `linear-gradient(to right, #F87171 0%, #F87171 ${(leverage-1)/9*100}%, #FCA5A5 ${(leverage-1)/9*100}%, #FCA5A5 100%)`
          }}
        />
      </div>

      {/* Stop Loss */}
      <div className="text-center">
        <div className="font-nunito font-bold text-lg mb-2">
          {stopLossLoading ? (
            <span className="text-blue-600">Stop Loss Calculating...</span>
          ) : stopLossError ? (
            <span className="text-red-600">Stop Loss Calculation Error</span>
          ) : stopLossAnalysis?.stopLossPercentage ? (
            <span>Stop Loss Percentage: {parseFloat(stopLossAnalysis.stopLossPercentage).toFixed(1)}%</span>
          ) : (
            <span className="text-gray-500">Stop Loss Percentage: --</span>
          )}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {stopLossAnalysis?.tradeAmount ? (
            <div>You need: {(parseFloat(stopLossAnalysis.tradeAmount) / 1e9).toFixed(6)} SOL to cover stop-loss</div>
          ) : (
            <div>Margin will be fully liquidated at stop-loss.</div>
          )}
        </div>
        {stopLossError && (
          <div className="text-xs text-red-500 mt-1">
            Error: {stopLossError.message || 'Unknown error'}
          </div>
        )}
      </div>

      {/* Insufficient Balance Warning */}
      {hasInsufficientBalance && (
        <div className="text-red-500 text-sm font-nunito">
          Insufficient balance: you have {solBalance} SOL
        </div>
      )}


      {/* Short Button */}
      <button
        onClick={handleShort}
        disabled={
          !isValid || 
          hasInsufficientBalance || 
          parseFloat(amount) <= 0 || 
          loading || 
          !connected || 
          !isReady || 
          !mintAddress ||
          isProcessing ||
          !stopLossAnalysis?.executableStopLossPrice
        }
        className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-4 rounded-lg text-lg font-nunito font-bold border-2 border-black cartoon-shadow trading-button"
      >
        {isProcessing 
          ? `Opening Short Position...` 
          : !connected
            ? 'Connect Wallet First'
            : !isReady
              ? 'SDK Not Ready'
              : !mintAddress
                ? 'Token Address Missing'
                : !stopLossAnalysis?.executableStopLossPrice
                  ? 'Calculating Stop Loss...'
                  : `Short ${tokenSymbol}`
        }
      </button>
      
      {/* 交易结果提示框 */}
      <TradingToast
        isVisible={toast.isVisible}
        type={toast.type}
        message={toast.message}
        txHash={toast.txHash}
        onClose={closeToast}
      />
    </div>
  );
}, (prevProps: ShortPanelProps, nextProps: ShortPanelProps) => {
  // 优化重渲染：只有关键props变化才重新渲染
  return prevProps.tokenSymbol === nextProps.tokenSymbol &&
         prevProps.solBalance === nextProps.solBalance &&
         prevProps.mintAddress === nextProps.mintAddress &&
         JSON.stringify(prevProps.tradingData) === JSON.stringify(nextProps.tradingData);
});

export default ShortPanel;