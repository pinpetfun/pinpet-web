import { useState, useCallback } from 'react';
import { useSpinPetSdkReady } from '../contexts/SpinPetSdkContext';
import { Keypair } from '@solana/web3.js';

/**
 * 代币管理相关的 Hook
 * 封装 SDK 的 token 模块方法
 */
export const useSpinPetToken = () => {
  const { sdk, walletAddress, canTrade } = useSpinPetSdkReady();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 通用代币操作处理
  const handleTokenOperation = useCallback(async (operationFn) => {
    if (!canTrade) {
      throw new Error('需要连接钱包才能执行代币操作');
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await operationFn();
      return result;
    } catch (err) {
      console.error('SpinPetToken 操作失败:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [canTrade]);

  // 创建新代币
  const createToken = useCallback(async (params) => {
    return handleTokenOperation(async () => {
      const { name, symbol, uri } = params;
      
      // 生成新的 mint keypair
      const mintKeypair = Keypair.generate();
      
      const result = await sdk.token.create({
        mint: mintKeypair,
        name,
        symbol,
        uri,
        payer: walletAddress
      });

      // 返回结果包含 mint keypair，用于签名
      return {
        ...result,
        mintKeypair,
        mintAddress: mintKeypair.publicKey.toString()
      };
    });
  }, [sdk, walletAddress, handleTokenOperation]);

  // 生成代币地址（预览）
  const generateMintAddress = useCallback(() => {
    const keypair = Keypair.generate();
    return {
      keypair,
      address: keypair.publicKey.toString(),
      // 注意：这个 keypair 需要保存用于后续的 createToken 调用
    };
  }, []);

  // 验证代币元数据
  const validateTokenMetadata = useCallback((metadata) => {
    const errors = [];
    
    if (!metadata.name || metadata.name.trim().length === 0) {
      errors.push('代币名称不能为空');
    }
    
    if (metadata.name && metadata.name.length > 32) {
      errors.push('代币名称不能超过32个字符');
    }
    
    if (!metadata.symbol || metadata.symbol.trim().length === 0) {
      errors.push('代币符号不能为空');
    }
    
    if (metadata.symbol && metadata.symbol.length > 10) {
      errors.push('代币符号不能超过10个字符');
    }
    
    if (!metadata.uri || !metadata.uri.startsWith('https://')) {
      errors.push('元数据URI必须是有效的HTTPS地址');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // 预估创建代币费用
  const estimateCreationCost = useCallback(async () => {
    try {
      // 这里可以添加实际的费用计算逻辑
      // 目前返回估算值
      return {
        rentExemption: 0.00203928, // SOL - 账户租金豁免
        transactionFee: 0.000005,  // SOL - 交易费用
        total: 0.002044280         // SOL - 总费用
      };
    } catch (err) {
      console.error('估算创建费用失败:', err);
      throw err;
    }
  }, []);

  return {
    // 状态
    loading,
    error,
    canTrade,

    // 代币操作方法
    createToken,
    generateMintAddress,

    // 验证和估算方法
    validateTokenMetadata,
    estimateCreationCost,

    // 工具方法
    clearError: () => setError(null)
  };
};