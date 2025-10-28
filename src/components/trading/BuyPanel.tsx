import React, { useState, useEffect, useCallback } from 'react';
import { calculateTokensFromSOL, formatDisplayNumber } from '../../utils/priceCalculator';
import { usePinPetSdk } from '../../contexts/PinPetSdkContext';
import { useWalletContext } from '../../contexts/WalletContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { TradingToast } from '../common';
import { getActualSlippage } from '../../config/tradingConfig';

interface BuyPanelProps {
  mintAddress?: string;
  tokenSymbol?: string;
  solBalance?: number;
  slippageSettings?: { slippage: number };
  onBuy?: (amount: any, type: any) => Promise<void> | void;
  onRefreshData?: () => void;
  onUserInputDebounce?: () => void;
  onQuickActionRefresh?: () => void;
  tradingData?: any;
}

const BuyPanel = React.memo(({
  mintAddress = "",
  tokenSymbol = "FRIENDS",
  solBalance = 0,
  slippageSettings = { slippage: 2 },
  onBuy = () => {},
  onRefreshData = () => {},
  onUserInputDebounce = () => {}, // 新增：用户输入防抖回调
  onQuickActionRefresh = () => {}, // 新增：快捷操作刷新回调
  tradingData = {}
}: BuyPanelProps) => {
  const { _downOrders11, _upOrders11, upOrders1000, lastPrice, _hasData, loading } = tradingData;
  const [amount, setAmount] = useState('1');
  const [isValid, setIsValid] = useState(true);
  
  // 优化后的代币购买数量状态 
  const [optimizedTokenAmount, setOptimizedTokenAmount] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // SDK 和钱包 hooks
  const { sdk, isReady } = usePinPetSdk();
  const { walletAddress, connected } = useWalletContext();
  const { signTransaction } = useWallet();
  
  // 买入状态
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 提示框状态
  const [toast, setToast] = useState({
    isVisible: false,
    type: 'success', // 'success', 'error', 'info'
    message: '',
    txHash: ''
  });
  
  // 精度转换函数
  const convertToTokenDecimals = (amount, decimals = 6) => {
    const factor = Math.pow(10, decimals);
    return new anchor.BN(Math.floor(amount * factor).toString());
  };
  
  const convertToSolDecimals = (amount, decimals = 9) => {
    const factor = Math.pow(10, decimals);
    return new anchor.BN(Math.floor(amount * factor).toString());
  };
  
  // 滑点计算函数
  const calculateMaxSolAmount = (solAmount, slippagePercent) => {
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

  // 二分法优化 buyTokenAmount
  const optimizeBuyTokenAmount = useCallback(async (currentAmount, initialBuyTokenAmount) => {
    const userSolAmountLamports = convertToSolDecimals(parseFloat(currentAmount), 9);
    const userSolAmount = userSolAmountLamports.toString();
    
    let low = new anchor.BN('1000000'); // 下界：1 token (精度10^6)
    let high = initialBuyTokenAmount; // 上界：初始计算的数量
    let bestTokenAmount = low;
    let iterations = 0;
    const maxIterations = 15;
    const precision = new anchor.BN('10000000'); // 精度：0.01 token
    
    console.log('[BuyPanel] 开始二分法优化:', {
      userSolAmount,
      low: low.toString(),
      high: high.toString(),
      precision: precision.toString()
    });

    while (low.lte(high) && iterations < maxIterations) {
      iterations++;
      
      // 计算中点
      const mid = low.add(high).div(new anchor.BN('2'));
      
      try {

        console.log(`[BuyPanel] 二分法迭代----`,lastPrice, upOrders1000);
        // 调用模拟器
        const result = await sdk.simulator.simulateTokenBuy(
          mintAddress,
          mid.toString(),
          null,
          lastPrice,
          upOrders1000
        );
        
        const suggestedSolAmount = result.suggestedSolAmount || '0';
        
        console.log(`[BuyPanel] 二分法迭代 ${iterations}:`, {
          mid: mid.toString(),
          suggestedSolAmount,
          userSolAmount,
          satisfies: new anchor.BN(suggestedSolAmount).lte(new anchor.BN(userSolAmount))
        });
        
        // 检查是否满足条件：suggestedSolAmount <= userSolAmount
        if (new anchor.BN(suggestedSolAmount).lte(new anchor.BN(userSolAmount))) {
          bestTokenAmount = mid;
          low = mid.add(new anchor.BN('1')); // 尝试更大的值
        } else {
          high = mid.sub(new anchor.BN('1')); // 尝试更小的值
        }
        
        // 精度检查
        if (high.sub(low).lt(precision)) {
          console.log('[BuyPanel] 达到精度要求，提前结束');
          break;
        }
        
      } catch (error) {
        console.error(`[BuyPanel] 二分法迭代 ${iterations} 失败:`, error);
        high = mid.sub(new anchor.BN('1'));
      }
    }
    
    console.log('[BuyPanel] 二分法优化完成:', {
      iterations,
      bestTokenAmount: bestTokenAmount.toString(),
      bestTokenDisplay: (parseFloat(bestTokenAmount.toString()) / 1e6).toFixed(6)
    });
    
    return bestTokenAmount;
  }, [sdk, mintAddress, lastPrice, upOrders1000]);

  // 调用 SDK 模拟代币买入 (参考 LongPanel)
  const simulateTokenBuyOrder = useCallback(async (currentAmount) => {
    if (!isReady || !sdk || !mintAddress || !lastPrice || !upOrders1000) {
      console.log('[BuyPanel] SDK not ready or missing data for buy simulation');
      setOptimizedTokenAmount(null);
      return;
    }

    try {
      setIsOptimizing(true);
      
      // 计算初始 buyTokenAmount (u64 格式，精度 10^6)
      const calculatedTokensStr = calculateTokens(currentAmount);
      const calculatedTokensFloat = parseFloat(calculatedTokensStr.replace(/,/g, ''));
      const initialBuyTokenAmount = convertToTokenDecimals(calculatedTokensFloat, 6);

      console.log('[BuyPanel] 开始优化代币购买数量:', {
        mint: mintAddress,
        currentAmount,
        calculatedTokens: calculatedTokensFloat,
        initialBuyTokenAmount: initialBuyTokenAmount.toString(),
        hasLastPrice: !!lastPrice,
        hasOrdersData: !!upOrders1000
      });

      // 使用二分法优化
      const optimizedBuyTokenAmount = await optimizeBuyTokenAmount(currentAmount, initialBuyTokenAmount);
      
      // 进行最终模拟验证
      const finalResult = await sdk.simulator.simulateTokenBuy(
        mintAddress,
        optimizedBuyTokenAmount.toString(),
        null,
        lastPrice,
        upOrders1000
      );

      console.log('[BuyPanel] 最终优化结果 JSON:', JSON.stringify(finalResult, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      , 2));

      // 保存优化后的数量
      setOptimizedTokenAmount({
        tokenAmount: optimizedBuyTokenAmount,
        displayAmount: (parseFloat(optimizedBuyTokenAmount.toString()) / 1e6).toFixed(6),
        simulationResult: finalResult
      });

    } catch (error) {
      console.error('[BuyPanel] Token buy simulation failed:', error);
      setOptimizedTokenAmount(null);
    } finally {
      setIsOptimizing(false);
    }
  }, [isReady, sdk, mintAddress, lastPrice, upOrders1000, optimizeBuyTokenAmount]);

  // Calculate how many tokens user will receive using precise decimal calculation
  const calculateTokens = (solAmount) => {
    if (!lastPrice) {
      console.log('[BuyPanel] No lastPrice data available');
      return '0';
    }
    console.log('[BuyPanel] Calculating tokens:', { solAmount, lastPrice });
    const tokensAmount = calculateTokensFromSOL(solAmount, lastPrice);
    console.log('[BuyPanel] Raw tokens amount:', tokensAmount);
    const formatted = formatDisplayNumber(tokensAmount, 6);
    console.log('[BuyPanel] Formatted tokens:', formatted);
    return formatted;
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
      console.log('[BuyPanel] Quick amount button clicked, triggering refresh...');
      onQuickActionRefresh();
    }
  };

  // Handle amount input change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);

    // 清空之前的优化结果
    setOptimizedTokenAmount(null);

    const numValue = parseFloat(value) || 0;
    setIsValid(numValue <= solBalance && numValue > 0);

    // 用户输入时触发防抖刷新
    if (numValue > 0) {
      console.log('[BuyPanel] Amount input changed, triggering debounced refresh...');
      onUserInputDebounce();
    }
  };

  // Handle buy action
  const handleBuy = async () => {
    if (!isValid || parseFloat(amount) <= 0) {
      console.log('[BuyPanel] Invalid amount or conditions');
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

    try {
      setIsProcessing(true);
      console.log('[BuyPanel] 开始买入流程...');

      // 计算参数 - 优先使用优化后的值
      const solAmount = parseFloat(amount);
      let buyTokenAmount;
      let displayTokenAmount;
      
      if (optimizedTokenAmount && optimizedTokenAmount.tokenAmount) {
        // 使用优化后的代币数量
        buyTokenAmount = optimizedTokenAmount.tokenAmount;
        displayTokenAmount = parseFloat(optimizedTokenAmount.displayAmount);
        console.log('[BuyPanel] 使用优化后的代币数量:', buyTokenAmount.toString());
      } else {
        // 使用原始计算的代币数量
        const calculatedTokensStr = calculateTokens(amount);
        const calculatedTokensFloat = parseFloat(calculatedTokensStr.replace(/,/g, ''));
        buyTokenAmount = convertToTokenDecimals(calculatedTokensFloat, 6);
        displayTokenAmount = calculatedTokensFloat;
        console.log('[BuyPanel] 使用原始计算的代币数量:', buyTokenAmount.toString());
      }
      
      const actualSlippage = getActualSlippage(slippageSettings.slippage);
      const maxSolAmount = calculateMaxSolAmount(solAmount, actualSlippage);

      console.log('[BuyPanel] 买入参数:', {
        mintAddress,
        solAmount,
        slippagePercent: slippageSettings.slippage,
        actualSlippagePercent: actualSlippage,
        displayTokenAmount,
        buyTokenAmount: buyTokenAmount.toString(),
        maxSolAmount: maxSolAmount.toString(),
        walletAddress,
        usingOptimized: !!(optimizedTokenAmount && optimizedTokenAmount.tokenAmount)
      });




      // 调用 SDK 买入接口
      console.log('[BuyPanel] 调用 sdk.trading.buy...');
      const result = await sdk.trading.buy({
        mintAccount: mintAddress,
        buyTokenAmount: buyTokenAmount,
        maxSolAmount: maxSolAmount,
        payer: new PublicKey(walletAddress)
      });

      console.log('[BuyPanel] SDK 返回结果:', result);

      // 获取最新的 blockhash
      console.log('[BuyPanel] 获取最新 blockhash...');
      const connection = sdk.connection || sdk.getConnection();
      const { blockhash } = await connection.getLatestBlockhash();
      result.transaction.recentBlockhash = blockhash;
      result.transaction.feePayer = new PublicKey(walletAddress);

      console.log('[BuyPanel] 更新 blockhash:', blockhash);

      // 钱包签名
      console.log('[BuyPanel] 请求钱包签名...');
      const signedTransaction = await signTransaction(result.transaction);

      console.log('[BuyPanel] 钱包签名完成');

      // 发送交易
      console.log('[BuyPanel] 发送交易...');
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      console.log('[BuyPanel] 等待交易确认...');
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('[BuyPanel] ✅ 买入成功!');
      console.log('[BuyPanel] 交易签名:', signature);
      
      // 调用原有的回调（保持兼容性）
      onBuy(amount, 'buy');
      
      // 刷新余额数据
      console.log('[BuyPanel] 刷新余额数据...');
      onRefreshData();
      
      // 显示成功提示框
      showToast('success', `Successfully bought ${displayTokenAmount.toFixed(6)} ${tokenSymbol}`, signature);

    } catch (error) {
      console.error('[BuyPanel] 买入失败:', error);
      
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

  const hasInsufficientBalance = parseFloat(amount) > solBalance;
  const calculatedTokens = calculateTokens(amount);
  
  // 获取显示用的代币数量（优先使用优化后的值）
  const getDisplayTokenAmount = () => {
    if (isOptimizing) {
      return 'Optimizing...';
    }
    if (optimizedTokenAmount) {
      return optimizedTokenAmount.displayAmount;
    }
    return calculatedTokens;
  };

  // 监听 amount 变化，触发模拟器调用 (参考 LongPanel)
  useEffect(() => {
    try {
      const currentAmount = parseFloat(amount);
      console.log('[BuyPanel] Amount changed:', currentAmount);
      // 检查是否满足计算条件
      if (currentAmount > 0 && isReady && mintAddress && lastPrice && upOrders1000) {
        console.log('[BuyPanel] Amount changed, triggering buy simulation...');
        simulateTokenBuyOrder(amount);
      }else{
        console.log('[BuyPanel] Amount changed, skipping ',isReady , mintAddress ,lastPrice, upOrders1000);

      }
    } catch (error) {
      console.error('[BuyPanel] useEffect error:', error);
    }
  }, [amount, isReady, mintAddress, lastPrice, upOrders1000, simulateTokenBuyOrder]);

  return (
    <div className="space-y-4">

      {/* Balance Display */}
      <div className="text-gray-700 font-nunito">
        balance: <span className="font-bold">{solBalance} SOL</span>
      </div>

      {/* Amount Input */}
      <div className="relative">
        <input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          className="w-full bg-white text-black text-2xl font-bold p-4 rounded-lg border-2 border-black focus:border-green-500 focus:outline-none"
          placeholder="0"
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          <span className="text-black font-nunito">SOL</span>
          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-purple-300 rounded-full"></div>
          </div>
          <button className="text-black">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
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

      {/* Insufficient Balance Warning */}
      {hasInsufficientBalance && (
        <div className="text-red-500 text-sm font-nunito">
          Insufficient balance: you have {solBalance} SOL
        </div>
      )}

      {/* Calculated Result */}
      <div className="text-gray-700 font-nunito text-lg">
        {getDisplayTokenAmount()} {tokenSymbol}
      </div>


      {/* Buy Button */}
      <button
        onClick={handleBuy}
        disabled={
          !isValid || 
          hasInsufficientBalance || 
          parseFloat(amount) <= 0 || 
          loading || 
          !connected || 
          !isReady || 
          !mintAddress ||
          isProcessing
        }
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-4 rounded-lg text-lg font-nunito font-bold border-2 border-black cartoon-shadow trading-button"
      >
        {isProcessing 
          ? `Buying ${tokenSymbol}...` 
          : !connected
            ? 'Connect Wallet First'
            : !isReady
              ? 'SDK Not Ready'
              : !mintAddress
                ? 'Token Address Missing'
                : `Buy ${tokenSymbol}`
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
}, (prevProps: BuyPanelProps, nextProps: BuyPanelProps) => {
  // 优化重渲染：只有关键props变化才重新渲染
  return prevProps.mintAddress === nextProps.mintAddress &&
         prevProps.tokenSymbol === nextProps.tokenSymbol &&
         prevProps.solBalance === nextProps.solBalance &&
         prevProps.slippageSettings?.slippage === nextProps.slippageSettings?.slippage &&
         JSON.stringify(prevProps.tradingData) === JSON.stringify(nextProps.tradingData);
});

export default BuyPanel;