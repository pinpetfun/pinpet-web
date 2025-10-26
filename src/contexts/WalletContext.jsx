import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// 创建 WalletContext
const WalletContext = createContext();

// 钱包地址格式化工具函数 - 前6位显示
export const formatWalletAddress = (address, prefixLength = 6) => {
  if (!address) return '';
  const addressStr = address.toString();
  if (addressStr.length <= prefixLength) return addressStr;
  
  return addressStr.slice(0, prefixLength);
};

// WalletProvider 组件
export const WalletProvider = ({ children }) => {
  const { publicKey, connected, disconnect, wallet, connecting } = useWallet();
  const [isAutoConnecting, setIsAutoConnecting] = useState(true);

  // 钱包连接状态变化时的处理
  useEffect(() => {
    if (connected && publicKey) {
      // 钱包连接成功，保存连接状态
      const walletData = {
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
    const checkAutoConnect = () => {
      const savedConnection = localStorage.getItem('pinpet_wallet_connection');
      if (savedConnection) {
        try {
          const connectionData = JSON.parse(savedConnection);
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
  const logout = async () => {
    try {
      await disconnect();
      localStorage.removeItem('pinpet_wallet_connection');
      console.log('用户手动登出');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // 复制地址到剪贴板
  const copyAddress = async () => {
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
  const contextValue = useMemo(() => {
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

// 自定义 hook
export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }
  return context;
};

// formatWalletAddress 已经在上面 export 了，这里不需要重复导出