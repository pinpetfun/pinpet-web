import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import type { PublicKey } from '@solana/web3.js';

/**
 * @interface WalletConnectionData
 * @description 钱包连接数据
 */
interface WalletConnectionData {
  address: string;
  walletName: string;
  connectedAt: string;
  autoConnect: boolean;
}

/**
 * @interface WalletContextValue
 * @description 钱包上下文值
 */
interface WalletContextValue {
  walletAddress?: string;
  shortAddress: string;
  walletName?: string;
  connected: boolean;
  connecting: boolean;
  isAutoConnecting: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  copyAddress: () => Promise<boolean>;
  formatWalletAddress: (address?: string | PublicKey, prefixLength?: number) => string;
}

/**
 * @interface WalletProviderProps
 * @description 钱包Provider组件属性
 */
interface WalletProviderProps {
  children: ReactNode;
}

// 创建 WalletContext
const WalletContext = createContext<WalletContextValue | undefined>(undefined);

/**
 * @function formatWalletAddress
 * @description 钱包地址格式化工具函数 - 前6位显示
 * @param {string | PublicKey} [address] - 钱包地址
 * @param {number} [prefixLength=6] - 前缀长度
 * @returns {string} 格式化后的地址
 */
export const formatWalletAddress = (address?: string | PublicKey, prefixLength: number = 6): string => {
  if (!address) return '';
  const addressStr = address.toString();
  if (addressStr.length <= prefixLength) return addressStr;

  return addressStr.slice(0, prefixLength);
};

/**
 * @component WalletProvider
 * @description 钱包Provider组件
 * @param {WalletProviderProps} props - 组件属性
 * @returns {JSX.Element} WalletProvider组件
 */
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { publicKey, connected, disconnect, wallet, connecting } = useWallet();
  const [isAutoConnecting, setIsAutoConnecting] = useState<boolean>(true);

  // 钱包连接状态变化时的处理
  useEffect(() => {
    if (connected && publicKey) {
      // 钱包连接成功，保存连接状态
      const walletData: WalletConnectionData = {
        address: publicKey.toString(),
        walletName: wallet?.adapter?.name || 'Unknown',
        connectedAt: new Date().toISOString(),
        autoConnect: true
      };

      localStorage.setItem('pinpet_wallet_connection', JSON.stringify(walletData));
      console.log('钱包连接成功:', walletData);
      setIsAutoConnecting(false);
    } else if (!connected && !connecting) {
      // 钱包断开，清除连接状态
      localStorage.removeItem('pinpet_wallet_connection');
      console.log('钱包已断开连接');
      setIsAutoConnecting(false);
    }
  }, [connected, publicKey, wallet, connecting]);

  // 应用启动时检查是否需要自动连接
  useEffect(() => {
    const checkAutoConnect = (): void => {
      const savedConnection = localStorage.getItem('pinpet_wallet_connection');
      if (savedConnection) {
        try {
          const connectionData: WalletConnectionData = JSON.parse(savedConnection);
          if (connectionData.autoConnect) {
            console.log('检测到之前的钱包连接，准备自动连接');
            // wallet adapter 的 autoConnect 会自动处理重连
          }
        } catch (error) {
          console.error('恢复连接状态失败:', error);
          localStorage.removeItem('pinpet_wallet_connection');
        }
      }
      setIsAutoConnecting(false);
    };

    // 延迟检查，确保 wallet adapter 初始化完成
    const timer = setTimeout(checkAutoConnect, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 手动登出函数
  const logout = async (): Promise<void> => {
    try {
      await disconnect();
      localStorage.removeItem('pinpet_wallet_connection');
      console.log('用户手动登出');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // 复制地址到剪贴板
  const copyAddress = async (): Promise<boolean> => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey.toString());
        console.log('地址已复制到剪贴板');
        return true;
      } catch (error) {
        console.error('复制地址失败:', error);
        return false;
      }
    }
    return false;
  };

  // Context 值
  const contextValue = useMemo((): WalletContextValue => {
    const walletAddress = publicKey?.toString();
    const shortAddress = formatWalletAddress(walletAddress, 6);

    return {
      // 钱包信息
      walletAddress,
      shortAddress,
      walletName: wallet?.adapter?.name,

      // 连接状态
      connected,
      connecting,
      isAutoConnecting,
      isLoggedIn: connected && !!walletAddress,

      // 操作函数
      logout,
      copyAddress,
      formatWalletAddress
    };
  }, [publicKey, connected, connecting, wallet, isAutoConnecting]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

/**
 * @hook useWalletContext
 * @description 使用钱包上下文的自定义Hook
 * @returns {WalletContextValue} 钱包上下文值
 * @throws {Error} 当在WalletProvider外部使用时抛出错误
 */
export const useWalletContext = (): WalletContextValue => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }
  return context;
};