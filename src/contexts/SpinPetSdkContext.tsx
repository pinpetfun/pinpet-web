import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import * as PinPetSdk from 'pinpet-sdk';
import { useWalletContext } from './WalletContext';

/**
 * @interface SpinPetSdkConfig
 * @description SpinPetSdk配置接口
 */
interface SpinPetSdkConfig {
  connection: Connection;
  network: string;
  rpcUrl: string;
  defaultDataSource: string;
  spin_fast_api_url: string;
  commitment: string;
  preflightCommitment: string;
  skipPreflight: boolean;
  maxRetries: number;
  [key: string]: any;
}

/**
 * @interface SpinPetSdkContextValue
 * @description SpinPetSdk上下文值接口
 */
interface SpinPetSdkContextValue {
  sdk: any;
  status: 'initializing' | 'ready' | 'error';
  error: Error | null;
  config: SpinPetSdkConfig | null;
  isReady: boolean;
  isError: boolean;
  isInitializing: boolean;
  canTrade: boolean;
  connected: boolean;
  walletAddress: PublicKey | null;
  getConnection: () => Connection | undefined;
  getSdk: () => any;
  getConfig: () => SpinPetSdkConfig | null;
}

/**
 * @interface SpinPetSdkProviderProps
 * @description SpinPetSdkProvider组件属性
 */
interface SpinPetSdkProviderProps {
  children: ReactNode;
}

/**
 * @interface SpinPetSdkReadyResult
 * @description SpinPetSdk准备就绪结果接口
 */
interface SpinPetSdkReadyResult {
  sdk: any;
  config: SpinPetSdkConfig | null;
  connection: Connection | undefined;
  walletAddress: PublicKey | null;
  canTrade: boolean;
}

const SpinPetSdkContext = createContext<SpinPetSdkContextValue | undefined>(undefined);

/**
 * @component SpinPetSdkProvider
 * @description SpinPetSdk提供者组件
 * @param {SpinPetSdkProviderProps} props - 组件属性
 * @returns {JSX.Element} SpinPetSdkProvider组件
 */
export const SpinPetSdkProvider: React.FC<SpinPetSdkProviderProps> = ({ children }) => {
  const { connected, walletAddress } = useWalletContext();
  const [sdk, setSdk] = useState<any>(null);
  const [status, setStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<SpinPetSdkConfig | null>(null);

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
      const rpcUrl: string = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
      const connection = new Connection(rpcUrl, 'confirmed');

      // 获取网络配置
      const network: string = import.meta.env.VITE_SOLANA_NETWORKS || 'MAINNET';

      // 检查函数是否存在 - 从 default 对象中获取
      if (typeof (PinPetSdk as any).default?.getDefaultOptions !== 'function') {
        throw new Error(`getDefaultOptions is not a function, type is: ${typeof (PinPetSdk as any).default?.getDefaultOptions}`);
      }

      const defaultOptions = (PinPetSdk as any).default.getDefaultOptions(network);

      // 合并配置
      const sdkConfig: SpinPetSdkConfig = {
        ...defaultOptions,
        connection,
        network,
        rpcUrl,
        defaultDataSource: import.meta.env.VITE_DEFAULT_DATA_SOURCE || 'fast',
        spin_fast_api_url: import.meta.env.VITE_SPIN_FAST_API_URL || defaultOptions.spin_fast_api_url,
        commitment: 'confirmed',
        preflightCommitment: 'processed',
        skipPreflight: false,
        maxRetries: 3
      };

      // 初始化 SDK
      const sdkInstance = new (PinPetSdk as any).default.PinPetSdk(
        connection,
        (PinPetSdk as any).default.SPINPET_PROGRAM_ID,
        sdkConfig
      );

      setSdk(sdkInstance);
      setConfig(sdkConfig);
      setStatus('ready');

      console.log('SpinPetSdk 初始化成功:', {
        network,
        rpcUrl,
        dataSource: sdkConfig.defaultDataSource
      });

    } catch (err) {
      console.error('SpinPetSdk 初始化失败:', err);
      setError(err as Error);
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
  const contextValue = useMemo((): SpinPetSdkContextValue => ({
    // SDK 实例和状态
    sdk,
    status,
    error,
    config,

    // 便捷状态
    isReady: status === 'ready' && sdk !== null,
    isError: status === 'error',
    isInitializing: status === 'initializing',
    canTrade: status === 'ready' && connected && !!walletAddress,

    // 钱包信息
    connected,
    walletAddress: walletAddress ? new PublicKey(walletAddress) : null,

    // 工具方法
    getConnection: () => config?.connection,
    getSdk: () => sdk,
    getConfig: () => config
  }), [sdk, status, error, config, connected, walletAddress]);

  return (
    <SpinPetSdkContext.Provider value={contextValue}>
      {children}
    </SpinPetSdkContext.Provider>
  );
};

/**
 * @hook useSpinPetSdk
 * @description 使用SpinPetSdk上下文的基础Hook
 * @returns {SpinPetSdkContextValue} SpinPetSdk上下文值
 * @throws {Error} 当在SpinPetSdkProvider外部使用时抛出错误
 */
export const useSpinPetSdk = (): SpinPetSdkContextValue => {
  const context = useContext(SpinPetSdkContext);
  if (!context) {
    throw new Error('useSpinPetSdk must be used within SpinPetSdkProvider');
  }
  return context;
};

/**
 * @hook useSpinPetSdkReady
 * @description 便捷Hook - 确保SDK已准备好
 * @returns {SpinPetSdkReadyResult} SDK准备就绪结果
 * @throws {Error} 当SDK初始化失败或尚未准备好时抛出错误
 */
export const useSpinPetSdkReady = (): SpinPetSdkReadyResult => {
  const context = useSpinPetSdk();

  if (context.isError) {
    throw new Error(`SpinPetSdk 初始化失败: ${context.error?.message}`);
  }

  if (!context.isReady) {
    throw new Error('SpinPetSdk 尚未准备好');
  }

  return {
    sdk: context.sdk,
    config: context.config,
    connection: context.getConnection(),
    walletAddress: context.walletAddress,
    canTrade: context.canTrade
  };
};