import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';

// 导入自定义的 WalletProvider 和 SpinPetSdkProvider
import { WalletProvider as CustomWalletProvider } from './contexts/WalletContext.jsx';
import { SpinPetSdkProvider } from './contexts/SpinPetSdkContext.jsx';
import { WebSocketProvider } from './contexts/WebSocketContext.jsx';

// 导入页面组件
import { Header, Footer } from './components/common';
import { HomePage, CreatePage, TradeCenterPage, DebugPage } from './components/pages';

function App() {
  // 网络配置和RPC端点 (从环境变量读取)
  const endpoint = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta');
  
  // 支持的钱包列表 - 暂时为空，后续添加具体钱包适配器
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <CustomWalletProvider>
          <SpinPetSdkProvider>
            <WebSocketProvider>
              <Router>
              <div className="min-h-screen text-black">
                <Header />
                
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/create" element={<CreatePage />} />
                  <Route path="/coin/:mintAddress" element={<TradeCenterPage />} />
                  <Route path="/trending" element={<div className="p-8 text-center"><h1 className="text-4xl font-fredoka">Trending Page Coming Soon! 🚀</h1></div>} />
                  <Route path="/resources" element={<div className="p-8 text-center"><h1 className="text-4xl font-fredoka">Resources Page Coming Soon! 📚</h1></div>} />
                  <Route path="/debug" element={<DebugPage />} />
                </Routes>
                
                <Footer />
              </div>
              </Router>
            </WebSocketProvider>
          </SpinPetSdkProvider>
        </CustomWalletProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;