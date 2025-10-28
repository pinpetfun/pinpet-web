import React, { useState } from 'react';
import { ClipboardDocumentIcon, ShareIcon, StarIcon, Cog6ToothIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useTradingData } from '../../hooks/useTradingData.js';
import { convertIpfsUrl, shortenAddress } from '../../config';
import { PdaInfoDialog } from '../common';
import { usePinPetSdk } from '../../contexts/PinPetSdkContext';
import { getEmojiImage } from '../../config/emojiConfig';

const TokenInfo = ({ 
  mintAddress,
  contractAddress = "G4V...bcoK"
}) => {
  // 获取 mintInfo 数据
  const { mintInfo, mintInfoLoading } = useTradingData(mintAddress);
  const { sdk, isReady } = usePinPetSdk();
  
  // PDA信息对话框状态
  const [showPdaInfoDialog, setShowPdaInfoDialog] = useState(false);
  
  // 格式化市值
  const formatMarketCap = (totalSolAmount) => {
    if (!totalSolAmount) return "$0.00";
    const marketCap = (totalSolAmount / 1000000000) * 2 * 230; // total_sol_amount * 2 * 230
    return `$${marketCap.toFixed(2)}`;
  };
  
  // 格式化创建日期
  const formatCreatedTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000); // 转换为毫秒
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };
  
  // 获取显示数据
  const getDisplayData = () => {
    if (mintInfoLoading) {
      return {
        tokenName: 'Loading...',
        creatorAddress: '...',
        tokenImage: getEmojiImage('loading', 80),
        marketCap: 'Loading...',
        createdTime: 'Loading...'
      };
    }

    if (mintInfo) {
      return {
        tokenName: mintInfo.symbol || 'BRONK',
        creatorAddress: shortenAddress(mintInfo.created_by) || 'FsbD...ZkDD',
        tokenImage: convertIpfsUrl(mintInfo.uri_data?.image) || getEmojiImage('token', 80),
        marketCap: formatMarketCap(mintInfo.total_sol_amount),
        createdTime: formatCreatedTime(mintInfo.create_timestamp)
      };
    }

    // fallback data
    return {
      tokenName: 'BRONK',
      creatorAddress: 'FsbD...ZkDD',
      tokenImage: getEmojiImage('token', 80),
      marketCap: '$16,561.13',
      createdTime: '2025/5/26 05:21:56'
    };
  };
  
  const { tokenName, creatorAddress, tokenImage, marketCap, createdTime } = getDisplayData();
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // 处理Info按钮点击
  const handleInfoClick = () => {
    if (isReady && sdk && mintAddress) {
      setShowPdaInfoDialog(true);
    }
  };

  // 处理PDA信息对话框关闭
  const handlePdaInfoDialogClose = () => {
    setShowPdaInfoDialog(false);
  };

  return (
    <div className="bg-white border-4 border-black rounded-2xl p-6 cartoon-shadow">
      <div className="flex items-center mb-4">
        <img 
          alt={`${tokenName} token icon`} 
          className="w-20 h-20 rounded-full mr-4 border-2 border-black object-cover" 
          src={tokenImage}
        />
        <div>
          <h3 className="text-3xl font-nunito text-black">{tokenName}</h3>
          <p className="text-base text-gray-600 font-nunito">Creator: {creatorAddress}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 text-base text-gray-600 font-nunito">
        <div className="flex items-center">
          <span>Contract: {contractAddress}</span>
          <button 
            onClick={() => copyToClipboard(contractAddress)}
            className="ml-2 text-gray-600 hover:text-black transition-colors"
          >
            <ClipboardDocumentIcon className="h-4 w-4 align-middle cursor-pointer" />
          </button>
        </div>
        
        <span>Market Cap: {marketCap}</span>
        <span>Created: {createdTime}</span>
        
        <div className="flex items-center space-x-2 ml-auto">
          <button className="text-gray-600 hover:text-black transition-colors">
            <ShareIcon className="h-5 w-5" />
          </button>
          <button className="text-gray-600 hover:text-black transition-colors">
            <StarIcon className="h-5 w-5" />
          </button>
          <button 
            onClick={handleInfoClick}
            className="text-gray-600 hover:text-black transition-colors"
            title="View PDA Information"
          >
            <InformationCircleIcon className="h-5 w-5" />
          </button>
          <button className="text-gray-600 hover:text-black transition-colors">
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* PDA信息对话框 */}
      <PdaInfoDialog
        isOpen={showPdaInfoDialog}
        onClose={handlePdaInfoDialogClose}
        title="BorrowingBondingCurve"
        pdaType="BorrowingBondingCurve"
        pdaAddress={mintAddress}
      />
    </div>
  );
};

export default TokenInfo;