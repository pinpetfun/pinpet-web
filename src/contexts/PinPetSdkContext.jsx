import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import * as PinPetSdk from 'pinpet-sdk';
import { useWalletContext } from './WalletContext';

const PinPetSdkContext = createContext();

export const PinPetSdkProvider = ({ children }) => {
  const { connected, walletAddress } = useWalletContext();
  const [sdk, setSdk] = useState(null);
  const [status, setStatus] = useState('initializing');
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);

  // 初始化 SDK 配置
  useEffect(() => {
    try {
      setStatus('initializing');
      setError(null);

      // 调试 PinPetSdk 对象
      console.log('PinPetSdk 对象:', PinPetSdk);
      console.log('PinPetSdk 的keys:', Object.keys(PinPetSdk));
      console.log('PinPetSdk.getDefaultOptions:', typeof PinPetSdk.getDefaultOptions);

      // 创建 Solana 连接
      const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
      const connection = new Connection(rpcUrl, 'confirmed');

      // 获取网络配置
      const network = import.meta.env.VITE_SOLANA_NETWORKS || 'MAINNET';
      
      // 检查函数是否存在 - 从 default 对象中获取
      if (typeof PinPetSdk.default?.getDefaultOptions !== 'function') {
        throw new Error(`getDefaultOptions is not a function, type is: ${typeof PinPetSdk.default?.getDefaultOptions}`);
      }
      
      const defaultOptions = PinPetSdk.default.getDefaultOptions(network);

      // 合并配置
      const sdkConfig = {
        ...defaultOptions,
        defaultDataSource: import.meta.env.VITE_DEFAULT_DATA_SOURCE || 'fast',
        spin_fast_api_url: import.meta.env.VITE_SPIN_FAST_API_URL || defaultOptions.spin_fast_api_url,
        commitment: 'confirmed',
        preflightCommitment: 'processed',
        skipPreflight: false,
        maxRetries: 3
      };

      // 初始化 SDK
      const sdkInstance = new PinPetSdk.default.PinPetSdk(
        connection,
        PinPetSdk.default.SPINPET_PROGRAM_ID,
        sdkConfig
      );

      setSdk(sdkInstance);
      setConfig({
        connection,
        network,
        rpcUrl,
        ...sdkConfig
      });
      setStatus('ready');

      console.log('PinPetSdk 初始化成功:', {
        network,
        rpcUrl,
        dataSource: sdkConfig.defaultDataSource
      });

    } catch (err) {
      console.error('PinPetSdk 初始化失败:', err);
      setError(err);
      setStatus('error');
    }
  }, []);

  // 监听钱包连接状态变化
  useEffect(() => {
    if (sdk) {
      if (connected && walletAddress) {
        console.log('钱包已连接，SDK 可以执行交易:', walletAddress);
      } else {
        console.log('钱包未连接，SDK 仅可查询数据');
      }
    }
  }, [sdk, connected, walletAddress]);

  // Context 值
  const contextValue = useMemo(() => ({
    // SDK 实例和状态
    sdk,
    status,
    error,
    config,

    // 便捷状态
    isReady: status === 'ready' && sdk !== null,
    isError: status === 'error',
    isInitializing: status === 'initializing',
    canTrade: status === 'ready' && connected && walletAddress,

    // 钱包信息
    connected,
    walletAddress: walletAddress ? new PublicKey(walletAddress) : null,

    // 工具方法
    getConnection: () => config?.connection,
    getSdk: () => sdk,
    getConfig: () => config
  }), [sdk, status, error, config, connected, walletAddress]);

  return (
    <PinPetSdkContext.Provider value={contextValue}>
      {children}
    </PinPetSdkContext.Provider>
  );
};

// 基础 Hook
export const usePinPetSdk = () => {
  const context = useContext(PinPetSdkContext);
  if (!context) {
    throw new Error('usePinPetSdk must be used within PinPetSdkProvider');
  }
  return context;
};

// 便捷 Hook - 确保 SDK 已准备好
export const usePinPetSdkReady = () => {
  const context = usePinPetSdk();

  if (context.isError) {
    throw new Error(`PinPetSdk 初始化失败: ${context.error?.message}`);
  }

  if (!context.isReady) {
    throw new Error('PinPetSdk 尚未准备好');
  }
  
  return {
    sdk: context.sdk,
    config: context.config,
    connection: context.getConnection(),
    walletAddress: context.walletAddress,
    canTrade: context.canTrade
  };
};