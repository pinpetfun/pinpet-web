import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Decimal from 'decimal.js';
import { usePinPetSdk } from '../../contexts/PinPetSdkContext';
import { useWalletContext } from '../../contexts/WalletContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { TradingToast } from '../common';
import { getEmojiImage } from '../../config/emojiConfig';

const PartialCloseDialog = ({ isOpen, onClose, position, onConfirmPartialClose, onRefresh }) => {
  // SDK 和钱包 hooks
  const { sdk, isReady } = usePinPetSdk();
  const { walletAddress, connected } = useWalletContext();
  const { signTransaction } = useWallet();

  // 输入状态
  const [buyAmount, setBuyAmount] = useState('');
  const [error, setError] = useState('');
  
  // 计算状态
  const [estimatedReceive, setEstimatedReceive] = useState('0.000000000');
  
  // 交易状态
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 提示框状态
  const [toast, setToast] = useState({
    isVisible: false,
    type: 'success',
    message: '',
    txHash: ''
  });

  // 从 position 数据中提取需要的信息
  const {
    tokenImage,
    pair,
    direction,
    orderPda,
    order_pda_full,
    order_type,
    margin_sol_amount,
    grossProfit,
    profitPercentage,
    _profitDisplay,
    lock_lp_token_amount,
    lock_lp_sol_amount,
    mint
  } = position || {};

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

  // Format margin display (convert from lamports to SOL)
  const formatMarginSol = (marginLamports) => {
    if (!marginLamports || marginLamports === 0) return '0.00';
    const solAmount = marginLamports / 1000000000;
    return solAmount.toFixed(2);
  };

  // Format gross profit display
  const formatGrossProfitSol = (grossProfitLamports) => {
    if (grossProfitLamports === null || grossProfitLamports === undefined) return '0.00';
    const solAmount = grossProfitLamports / 1000000000;
    return solAmount.toFixed(2);
  };

  // Format profit percentage display
  const formatProfitPercentage = (percentage) => {
    if (percentage === null || percentage === undefined) return '--';
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  // Format token amount display (convert from raw to 6 decimal precision)
  const formatTokenAmount = (amount) => {
    if (!amount || amount === 0) return '0.000000';
    // Convert from raw amount to 6 decimal precision
    const tokenAmount = amount / 1000000; // Divide by 1e6 for 6 decimal precision
    return tokenAmount.toFixed(6);
  };

  // Calculate estimated receive amount
  const calculateEstimatedReceive = (inputAmount) => {
    if (!inputAmount || !lock_lp_token_amount || !grossProfit) {
      return '0.000000000';
    }
    
    try {
      // Use Decimal.js for precise calculation
      // Convert inputAmount (6 decimal display) back to raw amount for calculation
      const inputAmountRaw = parseFloat(inputAmount) * 1000000; // Convert 6 decimal to raw
      
      const grossProfitDecimal = new Decimal(grossProfit); // 9 decimal precision (lamports)
      const lockTokenAmountDecimal = new Decimal(lock_lp_token_amount); // Raw amount
      const inputAmountDecimal = new Decimal(inputAmountRaw); // Raw amount
      
      // Calculate: grossProfit * (inputAmount / lock_lp_token_amount)
      const ratio = inputAmountDecimal.div(lockTokenAmountDecimal);
      const estimatedLamports = grossProfitDecimal.mul(ratio);
      
      // Convert to SOL (divide by 1e9) and maintain 9 decimal places
      const estimatedSol = estimatedLamports.div(new Decimal(1000000000));
      
      return estimatedSol.toFixed(9);
    } catch (error) {
      console.error('Error calculating estimated receive:', error);
      return '0.000000000';
    }
  };

  // Reset dialog state
  const resetDialog = () => {
    setBuyAmount('');
    setError('');
    setEstimatedReceive('0.000000000');
    setIsProcessing(false);
    closeToast();
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      resetDialog();
    }
  }, [isOpen]);

  // Handle input change
  const handleBuyAmountChange = (e) => {
    const value = e.target.value;
    setBuyAmount(value);
    setError('');
    
    // Calculate estimated receive in real time
    if (value && !isNaN(value) && parseFloat(value) > 0) {
      const estimated = calculateEstimatedReceive(value);
      setEstimatedReceive(estimated);
    } else {
      setEstimatedReceive('0.000000000');
    }
  };

  // Handle percentage button click
  const handlePercentageClick = (percentage) => {
    if (percentage === 'Reset') {
      setBuyAmount('');
      setEstimatedReceive('0.000000000');
      return;
    }
    
    // Calculate based on actual lock_lp_token_amount (convert to 6 decimal precision)
    const maxAmountRaw = lock_lp_token_amount || 0;
    const maxAmount = maxAmountRaw / 1000000; // Convert to 6 decimal precision
    const amount = (maxAmount * (parseFloat(percentage) / 100)).toFixed(6);
    setBuyAmount(amount);
    
    // Use precise calculation function to calculate estimated receive
    const estimated = calculateEstimatedReceive(amount);
    setEstimatedReceive(estimated);
  };

  // Handle confirm close - implement real partial close logic
  const handleConfirmClose = async () => {
    // Validate input
    if (!buyAmount || buyAmount === '0') {
      setError('Please enter buy amount');
      return;
    }
    
    const amount = parseFloat(buyAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter valid amount');
      return;
    }

    // Validate prerequisites
    if (!connected) {
      showToast('error', 'Please connect your wallet first');
      return;
    }

    if (!isReady || !sdk) {
      showToast('error', 'SDK not ready, please try again later');
      return;
    }

    if (!mint) {
      showToast('error', 'Token address not found');
      return;
    }

    if (!walletAddress) {
      showToast('error', 'Unable to get wallet address');
      return;
    }

    if (!order_pda_full) {
      showToast('error', 'Order address not found');
      return;
    }

    if (!order_type) {
      showToast('error', 'Order type not found');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('[PartialCloseDialog] Starting partial close process...', {
        orderType: order_type,
        direction,
        mint,
        orderPda: order_pda_full,
        partialAmount: amount,
        lockLpTokenAmount: lock_lp_token_amount,
        lockLpSolAmount: lock_lp_sol_amount
      });

      // Convert 6 decimal display amount to raw integer amount
      const rawTokenAmount = Math.floor(amount * 1000000);
      console.log('[PartialCloseDialog] Precision conversion:', {
        displayAmount: amount,
        rawAmount: rawTokenAmount
      });

      let result;
      
      if (order_type === 1) { // Long partial close
        console.log('[PartialCloseDialog] Executing Long partial close...');
        result = await sdk.trading.closeLong({
          mintAccount: mint,
          closeOrder: order_pda_full,
          sellTokenAmount: new anchor.BN(rawTokenAmount.toString()),
          minSolOutput: new anchor.BN("0"),
          payer: new PublicKey(walletAddress)
        });
      } else { // Short partial close
        console.log('[PartialCloseDialog] Executing Short partial close...');
        result = await sdk.trading.closeShort({
          mintAccount: mint,
          closeOrder: order_pda_full,
          buyTokenAmount: new anchor.BN(rawTokenAmount.toString()),
          maxSolAmount: new anchor.BN(lock_lp_sol_amount.toString()),
          payer: new PublicKey(walletAddress)
        });
      }

      console.log('[PartialCloseDialog] SDK returned result:', result);

      // Get latest blockhash
      console.log('[PartialCloseDialog] Getting latest blockhash...');
      const connection = sdk.connection || sdk.getConnection();
      const { blockhash } = await connection.getLatestBlockhash();
      result.transaction.recentBlockhash = blockhash;
      result.transaction.feePayer = new PublicKey(walletAddress);

      console.log('[PartialCloseDialog] Updated blockhash:', blockhash);

      // Wallet signing
      console.log('[PartialCloseDialog] Requesting wallet signature...');
      const signedTransaction = await signTransaction(result.transaction);

      console.log('[PartialCloseDialog] Wallet signature completed');

      // Send transaction
      console.log('[PartialCloseDialog] Sending transaction...');
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      console.log('[PartialCloseDialog] Waiting for transaction confirmation...');
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('[PartialCloseDialog] ✅ Partial close successful!');
      console.log('[PartialCloseDialog] Transaction signature:', signature);

      // Show success toast
      showToast('success', `Successfully partially closed ${direction} position`, signature);

      // Call original callback (optional, for backward compatibility)
      if (onConfirmPartialClose) {
        onConfirmPartialClose({
          position,
          buyAmount: amount,
          estimatedReceive
        });
      }

      // Refresh positions list
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 2000); // 2 seconds delay to refresh data
      }

      // Auto close dialog after success toast is shown
      setTimeout(() => {
        handleClose();
      }, 3000); // Close after 3 seconds to let user see the success message

    } catch (error) {
      console.error('[PartialCloseDialog] Partial close failed:', error);

      let errorMessage = error.message;
      if (error.message.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL balance';
      } else if (error.message.includes('blockhash')) {
        errorMessage = 'Network busy, please try again later';
      }

      // Show error toast
      showToast('error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle close
  const handleClose = () => {
    resetDialog();
    onClose();
  };

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle ESC key and prevent background scrolling
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      
      // Prevent background scrolling
      const scrollY = window.scrollY;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (isOpen) {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [isOpen]);

  if (!isOpen || !position) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-cartoon w-full max-w-md p-6 space-y-4 relative">
        {/* 关闭按钮 */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold leading-none"
        >
          ×
        </button>

        {/* 标题 */}
        <h2 className="text-xl font-nunito text-black text-center mb-4">
          Close {direction === 'long' ? 'Long' : 'Short'} Position
        </h2>

        {/* 定单PDA编号 */}
        <div className="text-sm">
          <p className="text-gray-600">Order PDA:</p>
          <p className="text-black font-mono text-xs break-all bg-gray-50 p-2 rounded mt-1">
            {order_pda_full || orderPda || 'Ard96zyQrkk1YSvPWs8NZn7duJpEEjc54h9wCexEVvsQ'}
          </p>
        </div>

        {/* 三列网格信息 */}
        <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-gray-600">Margin Amount</p>
            <p className="text-black font-semibold">{formatMarginSol(margin_sol_amount)} SOL</p>
          </div>
          <div>
            <p className="text-gray-600">Profit</p>
            <p className={`font-semibold ${
              grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatGrossProfitSol(grossProfit)} SOL
            </p>
          </div>
          <div>
            <p className="text-gray-600">P&L Percentage</p>
            <p className={`font-semibold ${
              profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatProfitPercentage(profitPercentage)}
            </p>
          </div>
        </div>

        {/* 完全平仓提示 */}
        <p className="text-sm text-gray-600">
          Complete close requires {direction === 'long' ? 'selling' : 'buying'} {formatTokenAmount(lock_lp_token_amount)} tokens
        </p>

        {/* 输入框 */}
        <div className="relative">
          <input 
            className="w-full bg-gray-50 border border-gray-300 rounded-md py-3 pl-4 pr-24 text-black focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-500 text-left"
            placeholder={`Enter ${direction === 'long' ? 'sell' : 'buy'} amount`}
            type="text"
            value={buyAmount}
            onChange={handleBuyAmountChange}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-black font-semibold mr-2">{pair}</span>
            <img
              alt={`${pair} token logo`}
              className="w-6 h-6 rounded-full"
              src={tokenImage}
              onError={(e) => {
                (e.target as HTMLImageElement).src = getEmojiImage('default', 24);
              }}
            />
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {/* 百分比按钮组 */}
        <div className="flex space-x-2">
          {['Reset', '25%', '50%', '75%', '100%'].map((btn) => (
            <button 
              key={btn}
              onClick={() => handlePercentageClick(btn)}
              className="flex-1 py-2 text-sm bg-gray-200 text-black rounded-md hover:bg-gray-300 transition-all duration-200 font-nunito"
            >
              {btn}
            </button>
          ))}
        </div>

        {/* 预计收益 */}
        <p className="text-sm text-gray-600">
          you receive <span className="font-semibold text-green-600">{estimatedReceive} SOL</span>
        </p>

        {/* 确认按钮 */}
        <button 
          onClick={handleConfirmClose}
          disabled={isProcessing || !connected || !isReady}
          className="w-full bg-red-500 text-white font-nunito font-bold py-3 rounded-md hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200 text-lg shadow-cartoon-sm active:scale-95"
        >
          {isProcessing ? 'Closing...' : 'Close'}
        </button>
      </div>
      
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

  return createPortal(modalContent, document.body);
};

export default PartialCloseDialog;