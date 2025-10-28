import { useState, useCallback } from 'react';
import { usePinPetSdkReady } from '../contexts/PinPetSdkContext';
import { PublicKey } from '@solana/web3.js';
import anchor from '@coral-xyz/anchor';

/**
 * 交易相关的 Hook
 * 封装 SDK 的 trading 模块方法
 */
export const usePinPetTrading = () => {
  const { sdk, connection, walletAddress, canTrade } = usePinPetSdkReady();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 通用交易处理
  const handleTransaction = useCallback(async (transactionFn) => {
    if (!canTrade) {
      throw new Error('需要连接钱包才能执行交易');
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await transactionFn();
      return result;
    } catch (err) {
      console.error('PinPetTrading 交易失败:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [canTrade]);

  // 买入代币
  const buy = useCallback(async (params) => {
    return handleTransaction(async () => {
      const { mintAccount, buyTokenAmount, maxSolAmount, computeUnits = 1400000 } = params;
      
      return await sdk.trading.buy({
        mintAccount,
        buyTokenAmount: new anchor.BN(buyTokenAmount.toString()),
        maxSolAmount: new anchor.BN(maxSolAmount.toString()),
        payer: walletAddress
      }, { computeUnits });
    });
  }, [sdk, walletAddress, handleTransaction]);

  // 卖出代币
  const sell = useCallback(async (params) => {
    return handleTransaction(async () => {
      const { mintAccount, sellTokenAmount, minSolOutput, computeUnits = 1400000 } = params;
      
      return await sdk.trading.sell({
        mintAccount,
        sellTokenAmount: new anchor.BN(sellTokenAmount.toString()),
        minSolOutput: new anchor.BN(minSolOutput.toString()),
        payer: walletAddress
      }, { computeUnits });
    });
  }, [sdk, walletAddress, handleTransaction]);

  // 做多
  const long = useCallback(async (params) => {
    return handleTransaction(async () => {
      const { 
        mintAccount, 
        buyTokenAmount, 
        maxSolAmount, 
        marginSol, 
        closePrice, 
        prevOrder = null, 
        nextOrder = null,
        computeUnits = 1400000 
      } = params;
      
      return await sdk.trading.long({
        mintAccount,
        buyTokenAmount: new anchor.BN(buyTokenAmount.toString()),
        maxSolAmount: new anchor.BN(maxSolAmount.toString()),
        marginSol: new anchor.BN(marginSol.toString()),
        closePrice: new anchor.BN(closePrice.toString()),
        prevOrder: prevOrder ? new PublicKey(prevOrder) : null,
        nextOrder: nextOrder ? new PublicKey(nextOrder) : null,
        payer: walletAddress
      }, { computeUnits });
    });
  }, [sdk, walletAddress, handleTransaction]);

  // 做空
  const short = useCallback(async (params) => {
    return handleTransaction(async () => {
      const { 
        mintAccount, 
        borrowSellTokenAmount, 
        minSolOutput, 
        marginSol, 
        closePrice, 
        prevOrder = null, 
        nextOrder = null,
        computeUnits = 1400000 
      } = params;
      
      return await sdk.trading.short({
        mintAccount,
        borrowSellTokenAmount: new anchor.BN(borrowSellTokenAmount.toString()),
        minSolOutput: new anchor.BN(minSolOutput.toString()),
        marginSol: new anchor.BN(marginSol.toString()),
        closePrice: new anchor.BN(closePrice.toString()),
        prevOrder: prevOrder ? new PublicKey(prevOrder) : null,
        nextOrder: nextOrder ? new PublicKey(nextOrder) : null,
        payer: walletAddress
      }, { computeUnits });
    });
  }, [sdk, walletAddress, handleTransaction]);

  // 平仓做多
  const closeLong = useCallback(async (params) => {
    return handleTransaction(async () => {
      const { 
        mintAccount, 
        closeOrder, 
        sellTokenAmount, 
        minSolOutput,
        computeUnits = 1400000 
      } = params;
      
      return await sdk.trading.closeLong({
        mintAccount,
        closeOrder: new PublicKey(closeOrder),
        sellTokenAmount: new anchor.BN(sellTokenAmount.toString()),
        minSolOutput: new anchor.BN(minSolOutput.toString()),
        payer: walletAddress
      }, { computeUnits });
    });
  }, [sdk, walletAddress, handleTransaction]);

  // 平仓做空
  const closeShort = useCallback(async (params) => {
    return handleTransaction(async () => {
      const { 
        mintAccount, 
        closeOrder, 
        buyTokenAmount, 
        maxSolAmount,
        computeUnits = 1400000 
      } = params;
      
      return await sdk.trading.closeShort({
        mintAccount,
        closeOrder: new PublicKey(closeOrder),
        buyTokenAmount: new anchor.BN(buyTokenAmount.toString()),
        maxSolAmount: new anchor.BN(maxSolAmount.toString()),
        payer: walletAddress
      }, { computeUnits });
    });
  }, [sdk, walletAddress, handleTransaction]);

  // 发送交易的辅助方法
  const sendTransaction = useCallback(async (transaction, signers = []) => {
    if (!connection || !walletAddress) {
      throw new Error('连接或钱包未准备好');
    }

    try {
      setLoading(true);
      setError(null);

      // 这里需要外部钱包签名，具体实现依赖于钱包适配器
      console.log('准备发送交易，需要外部钱包签名');
      
      // 示例：返回交易对象供外部处理
      return {
        transaction,
        signers,
        needsWalletSignature: true
      };
      
    } catch (err) {
      console.error('发送交易失败:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connection, walletAddress]);

  return {
    // 状态
    loading,
    error,
    canTrade,

    // 交易方法
    buy,
    sell,
    long,
    short,
    closeLong,
    closeShort,

    // 工具方法
    sendTransaction,
    clearError: () => setError(null)
  };
};