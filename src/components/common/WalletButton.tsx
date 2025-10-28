import React, { useState, useEffect } from 'react';
import { Button, Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletContext } from '../../contexts/WalletContext';
import { createPortal } from 'react-dom';
import { 
  WalletIcon, 
  ChevronDownIcon, 
  UserIcon, 
  ClipboardDocumentIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

const WalletButton = () => {
  const { connect, select, wallets, wallet } = useWallet();
  const { 
    connected, 
    connecting, 
    shortAddress, 
    walletName,
    logout, 
    copyAddress,
    isAutoConnecting
  } = useWalletContext();
  
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // 处理连接
  const handleConnect = async () => {
    if (connecting) return;
    
    try {
      if (wallet) {
        await connect();
      } else {
        // 没有选择钱包，显示钱包选择器
        if (wallets.length > 0) {
          setWalletModalOpen(true);
        } else {
          // 如果没有配置钱包适配器，显示提示
          alert('钱包功能正在开发中，请稍后再试。目前钱包适配器尚未配置完成。');
        }
      }
    } catch (error) {
      console.error('连接钱包失败:', error);
      if (error.name === 'WalletNotSelectedError') {
        alert('请先选择一个钱包');
      } else {
        alert('连接失败: ' + error.message);
      }
    }
  };

  // 处理钱包选择
  const handleSelectWallet = async (walletAdapter) => {
    try {
      select(walletAdapter.name);
      setWalletModalOpen(false);
      // 选择后自动连接
      setTimeout(() => connect(), 100);
    } catch (error) {
      console.error('选择钱包失败:', error);
    }
  };

  // 处理复制地址
  const handleCopyAddress = async () => {
    const success = await copyAddress();
    if (success) {
      // 可以添加 toast 通知
      alert('地址已复制到剪贴板！');
    } else {
      alert('复制失败，请手动复制');
    }
  };

  // 打开钱包
  const handleViewWallet = () => {
    if (walletName === 'Phantom') {
      window.open('https://phantom.app/', '_blank');
    } else if (walletName === 'Solflare') {
      window.open('https://solflare.com/', '_blank');
    } else {
      // 通用处理
      console.log('打开钱包:', walletName);
    }
  };

  // 查看个人资料
  const handleProfile = () => {
    // 跳转到用户个人资料页面
    console.log('查看个人资料');
  };

  // 获取按钮状态和文本
  const getButtonContent = () => {
    if (connecting || isAutoConnecting) {
      return (
        <>
          <WalletIcon className="h-5 w-5 text-white" />
          <span className="ml-2">Connecting...</span>
        </>
      );
    }
    
    if (connected && shortAddress) {
      return shortAddress; // 显示前6位地址，如 "g3fe4z"
    }
    
    // 默认状态显示 Connect Wallet
    return (
      <>
        <WalletIcon className="h-5 w-5 text-white" />
        <span className="ml-2">Connect Wallet</span>
      </>
    );
  };

  const isButtonDisabled = connecting || isAutoConnecting;

  // 未连接状态 - 显示连接按钮或钱包选择
  if (!connected) {
    return (
      <>
        <Button
          onClick={handleConnect}
          disabled={isButtonDisabled}
          className="btn-cartoon bg-orange-500 hover:bg-orange-600 text-white h-[44px] px-4 flex items-center"
        >
          {getButtonContent()}
        </Button>

        {/* 钱包选择模态框 */}
        <WalletModal 
          isOpen={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
          wallets={wallets}
          onSelectWallet={handleSelectWallet}
        />
      </>
    );
  }

  // 已连接状态 - 显示下拉菜单
  return (
    <Menu as="div" className="relative">
      <MenuButton className="btn-cartoon bg-green-500 hover:bg-green-600 text-white h-[44px] px-4 flex items-center space-x-2">
        <div className="w-6 h-6 bg-green-300 rounded-full flex items-center justify-center">
          <span className="text-xs">🐾</span>
        </div>
        <span>{shortAddress}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </MenuButton>

      <MenuItems className="absolute right-0 mt-2 w-48 bg-gray-800 border-2 border-black rounded-xl cartoon-shadow overflow-hidden z-10">
        <MenuItem>
          {({ active }) => (
            <button
              onClick={handleProfile}
              className={`w-full text-left px-4 py-3 text-white flex items-center space-x-3 ${
                active ? 'bg-gray-700' : ''
              }`}
            >
              <UserIcon className="h-4 w-4" />
              <span className="font-nunito">Profile</span>
            </button>
          )}
        </MenuItem>

        <MenuItem>
          {({ active }) => (
            <button
              onClick={handleViewWallet}
              className={`w-full text-left px-4 py-3 text-white flex items-center space-x-3 ${
                active ? 'bg-gray-700' : ''
              }`}
            >
              <WalletIcon className="h-4 w-4" />
              <span className="font-nunito">View Wallet</span>
            </button>
          )}
        </MenuItem>

        <MenuItem>
          {({ active }) => (
            <button
              onClick={handleCopyAddress}
              className={`w-full text-left px-4 py-3 text-white flex items-center space-x-3 ${
                active ? 'bg-gray-700' : ''
              }`}
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
              <span className="font-nunito">Copy address</span>
            </button>
          )}
        </MenuItem>

        <MenuItem>
          {({ active }) => (
            <button
              onClick={logout}
              className={`w-full text-left px-4 py-3 text-red-400 flex items-center space-x-3 ${
                active ? 'bg-gray-700' : ''
              }`}
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="font-nunito">Log out</span>
            </button>
          )}
        </MenuItem>
      </MenuItems>
    </Menu>
  );
};

// 钱包选择模态框组件
const WalletModal = ({ isOpen, onClose, wallets, onSelectWallet }) => {
  // 处理 ESC 键和防止背景滚动
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 保存当前滚动位置
      const scrollY = window.scrollY;
      // 防止背景位移：使用 padding 补偿滚动条宽度
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
        // 恢复滚动位置
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [isOpen, onClose]);

  // 处理遮罩点击
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

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
      <div className="bg-white rounded-2xl border-4 border-black cartoon-shadow p-6 max-w-md w-full mx-4">
        <h3 className="text-2xl font-nunito text-gray-900 mb-4">Select Wallet</h3>
        <div className="space-y-3">
          {wallets.length > 0 ? wallets.map((walletAdapter) => (
            <Button
              key={walletAdapter.adapter.name}
              onClick={() => onSelectWallet(walletAdapter.adapter)}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border-2 border-gray-200 hover:border-orange-500 transition-colors"
            >
              <img 
                src={walletAdapter.adapter.icon} 
                alt={walletAdapter.adapter.name}
                className="w-8 h-8"
              />
              <span className="font-nunito">{walletAdapter.adapter.name}</span>
            </Button>
          )) : (
            <div className="text-gray-500 text-center py-4">
              <p>No wallets detected</p>
              <p className="text-sm mt-2">Please install a Solana wallet like Phantom</p>
            </div>
          )}
        </div>
        <Button
          onClick={onClose}
          className="mt-4 w-full btn-cartoon bg-gray-500 hover:bg-gray-600 text-white"
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default WalletButton;