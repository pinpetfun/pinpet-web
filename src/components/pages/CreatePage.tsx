import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@headlessui/react';
import { Keypair, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { uploadToIPFS, validateFile, uploadJSONToIPFS } from '../../services/pinataService.js';
import { useWalletContext } from '../../contexts/WalletContext.jsx';
import { usePinPetSdk } from '../../contexts/PinPetSdkContext.jsx';
import { generateTxExplorerUrl } from '../../config.js';
import {
  ChevronDownIcon,
  LinkIcon,
  FolderIcon,
  RectangleStackIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const CreatePage = () => {
  // 钱包和 SDK 状态
  const { signTransaction } = useWallet();
  const { walletAddress, connected } = useWalletContext();
  const { sdk, isReady, getConnection } = usePinPetSdk();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    coinName: '',
    ticker: '',
    description: '',
    website: '',
    twitter: '',
    telegram: '',
    image: null
  });

  const [showSocialLinks, setShowSocialLinks] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // IPFS 相关状态
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [ipfsData, setIpfsData] = useState(null); // 存储 CID, IPFS URL, Gateway URL
  const [dragActive, setDragActive] = useState(false);
  const [_uri, setUri] = useState(''); // 存储 JSON metadata 的 IPFS URI

  // 代币创建相关状态
  const [tokenCreationStatus, setTokenCreationStatus] = useState('idle'); // idle, creating, success, error
  const [_transactionHash, setTransactionHash] = useState('');
  const [createdTokenInfo, setCreatedTokenInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(3); // 跳转倒计时

  const fileInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理创建成功后的倒计时和自动跳转
  useEffect(() => {
    let timer;
    if (tokenCreationStatus === 'success' && createdTokenInfo) {
      // 每秒更新倒计时
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // 倒计时结束，跳转到币详情页
            navigate(`/coin/${createdTokenInfo.mintAddress}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // 清理定时器
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [tokenCreationStatus, createdTokenInfo, navigate]);

  // 立即跳转到币详情页
  const handleNavigateToCoin = () => {
    if (createdTokenInfo) {
      navigate(`/coin/${createdTokenInfo.mintAddress}`);
    }
  };

  // 组合表单数据为指定格式的 JSON
  const createMetadataJSON = () => {
    // 获取图片的 IPFS URL，使用 https://ipfs.io/ipfs/ + CID 格式
    const imageUrl = ipfsData ? `https://ipfs.io/ipfs/${ipfsData.cid}` : '';
    
    return {
      name: formData.coinName,
      symbol: formData.ticker,
      description: formData.description,
      image: imageUrl,
      showName: true,
      createdOn: "https://pinpet.fun",
      twitter: formData.twitter || "https://x.com/elonmusk/status/1966417879118876756",
      website: formData.website || "",
      telegram: formData.telegram || ""
    };
  };



  const handleImageUpload = async (file) => {
    if (!file) return;
    
    // 验证文件
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadStatus(`Error: ${validation.error}`);
      return;
    }
    
    // 更新本地预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // 上传到 IPFS
    setIsUploading(true);
    setUploadStatus('Getting upload URL...');
    
    try {
      const result = await uploadToIPFS(file);
      
      if (result.success) {
        setIpfsData(result.data);
        setImagePreview(result.data.gatewayUrl);
        setFormData(prev => ({
          ...prev,
          image: file
        }));
        setUploadStatus('Upload successful!');
      } else {
        setUploadStatus(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      setUploadStatus(`Upload error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // 拖拽事件处理
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  // 创建代币到链上
  const createTokenOnChain = async (metadataUri) => {
    try {
      // 验证前置条件
      if (!connected) {
        throw new Error('钱包未连接，请先连接钱包');
      }
      
      if (!isReady) {
        throw new Error('SDK 未准备好，请稍后再试');
      }
      
      if (!walletAddress) {
        throw new Error('无法获取钱包地址');
      }
      
      setTokenCreationStatus('creating');
      setErrorMessage('');
      setUploadStatus('Creating token on blockchain...');
      
      // 生成新的 mint keypair
      const mintKeypair = Keypair.generate();
      console.log('Generated mint keypair:', mintKeypair.publicKey.toString());
      
      // 准备代币创建参数
      const tokenParams = {
        mint: mintKeypair,
        name: formData.coinName,
        symbol: formData.ticker,
        uri: metadataUri,
        payer: new PublicKey(walletAddress)
      };
      
      console.log('Creating token with params:', {
        mint: mintKeypair.publicKey.toString(),
        name: tokenParams.name,
        symbol: tokenParams.symbol,
        uri: tokenParams.uri,
        payer: tokenParams.payer.toString()
      });
      
      // 调用 SDK 创建代币交易
      setUploadStatus('Preparing transaction...');
      const result = await sdk.token.create(tokenParams);
      
      console.log('Token creation transaction prepared:', result);
      
      // 获取最新的 blockhash
      setUploadStatus('Getting recent blockhash...');
      const connection = getConnection();
      const { blockhash } = await connection.getLatestBlockhash();
      result.transaction.recentBlockhash = blockhash;
      result.transaction.feePayer = new PublicKey(walletAddress);
      
      console.log('Transaction updated with blockhash:', blockhash);
      
      // 处理签名和发送交易
      setUploadStatus('Requesting wallet signature...');
      
      // 先用钱包签名
      const signedTransaction = await signTransaction(result.transaction);
      
      // 再用 mint keypair 签名
      signedTransaction.partialSign(mintKeypair);
      
      // 发送交易
      setUploadStatus('Sending transaction...');
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // 等待交易确认
      setUploadStatus('Waiting for confirmation...');
      await connection.confirmTransaction(signature, 'confirmed');
      
      // 成功处理
      setTokenCreationStatus('success');
      setTransactionHash(signature);
      setCreatedTokenInfo({
        mintAddress: mintKeypair.publicKey.toString(),
        name: formData.coinName,
        symbol: formData.ticker,
        signature: signature
      });
      setUploadStatus('Token created successfully!');
      setCountdown(3); // 重置倒计时
      
      console.log('=== Token Creation Success ===');
      console.log('Mint Address:', mintKeypair.publicKey.toString());
      console.log('Transaction Signature:', signature);
      console.log('Explorer URL:', generateTxExplorerUrl(signature));
      console.log('============================');
      
    } catch (error) {
      console.error('Token creation failed:', error);
      setTokenCreationStatus('error');
      
      // 用户友好的错误消息
      let friendlyMessage = error.message;
      if (error.message.includes('User rejected')) {
        friendlyMessage = 'Transaction was rejected by user. Please try again and approve the transaction in your wallet.';
      } else if (error.message.includes('insufficient funds')) {
        friendlyMessage = 'Insufficient SOL balance to create token. Please add more SOL to your wallet.';
      } else if (error.message.includes('blockhash')) {
        friendlyMessage = 'Network error: Failed to get recent blockhash. Please try again.';
      }
      
      setErrorMessage(friendlyMessage);
      setUploadStatus(`Token creation failed: ${friendlyMessage}`);
    }
  };

  const handleCreateCoin = async () => {
    try {
      // 重置状态
      setTokenCreationStatus('idle');
      setErrorMessage('');
      
      // 组合 JSON metadata
      const metadata = createMetadataJSON();
      console.log('Creating coin with metadata:', metadata);
      
      // 设置上传状态
      setIsUploading(true);
      setUploadStatus('Uploading metadata to IPFS...');
      
      // 上传 JSON 到 IPFS
      const result = await uploadJSONToIPFS(metadata);
      
      if (result.success) {
        // 存储 URI 到状态
        setUri(result.data.ipfsUrl);
        setUploadStatus('Metadata uploaded successfully!');
        
        // 在后台打印结果
        console.log('=== Metadata Upload Success ===');
        console.log('Metadata JSON:', JSON.stringify(metadata, null, 2));
        console.log('IPFS CID:', result.data.cid);
        console.log('IPFS URL:', result.data.ipfsUrl);
        console.log('Gateway URL:', result.data.gatewayUrl);
        console.log('URI stored in state:', result.data.ipfsUrl);
        console.log('===============================');
        
        // 继续创建代币到链上
        await createTokenOnChain(result.data.ipfsUrl);
      } else {
        setUploadStatus(`Upload failed: ${result.error}`);
        console.error('Failed to upload metadata:', result.error);
        alert(`❌ Failed to upload metadata: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating coin:', error);
      setUploadStatus(`Error: ${error.message}`);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 py-8">
      <div className="max-w-3xl mx-auto px-8">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-nunito text-gray-900 mb-2">Create new coin</h1>
          </div>

          {/* Coin Details Section */}
          <div className="bg-white border-4 border-black rounded-2xl p-6 cartoon-shadow">
              <h2 className="text-2xl font-nunito text-gray-900 mb-2">Coin details</h2>
              <p className="text-gray-600 font-nunito mb-6">Choose carefully, these can't be changed once the coin is created</p>

              <div className="space-y-6">
                {/* Coin Name and Ticker */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-nunito text-gray-700 mb-2">
                      Coin name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Name your coin"
                      value={formData.coinName}
                      onChange={(e) => handleInputChange('coinName', e.target.value)}
                      maxLength={32}
                      required
                      className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-nunito bg-gray-50"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">Required</span>
                      <span className="text-xs text-gray-500">{formData.coinName.length}/32</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-nunito text-gray-700 mb-2">
                      Ticker <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Add a coin ticker (e.g. DOGE)"
                      value={formData.ticker}
                      onChange={(e) => handleInputChange('ticker', e.target.value)}
                      maxLength={10}
                      required
                      className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-nunito bg-gray-50"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">Required</span>
                      <span className="text-xs text-gray-500">{formData.ticker.length}/10</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-nunito text-gray-700 mb-2">
                    Description <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="Write a short description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    maxLength={5000}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-nunito bg-gray-50 resize-none"
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500">{formData.description.length}/5000</span>
                  </div>
                </div>

                {/* Add Social Links - Collapsible */}
                <div>
                  <Button
                    onClick={() => setShowSocialLinks(!showSocialLinks)}
                    className="flex items-center text-gray-700 hover:text-orange-500 font-nunito transition-colors"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Add social links <span className="text-gray-500 ml-1">(Optional)</span>
                    <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showSocialLinks ? 'rotate-180' : ''}`} />
                  </Button>

                  {showSocialLinks && (
                    <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-nunito text-gray-700 mb-2">Website</label>
                          <input
                            type="url"
                            placeholder="Add URL"
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-nunito bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-nunito text-gray-700 mb-2">X</label>
                          <input
                            type="url"
                            placeholder="Add URL"
                            value={formData.twitter}
                            onChange={(e) => handleInputChange('twitter', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-nunito bg-gray-50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-nunito text-gray-700 mb-2">Telegram</label>
                        <input
                          type="url"
                          placeholder="Add URL"
                          value={formData.telegram}
                          onChange={(e) => handleInputChange('telegram', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-nunito bg-gray-50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="bg-white border-4 border-black rounded-2xl p-6 cartoon-shadow">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-orange-500 bg-orange-50' 
                    : isUploading 
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Coin preview" 
                    className="w-48 h-48 mx-auto rounded-xl border-2 border-black object-cover mb-4"
                  />
                ) : (
                  <div className="w-48 h-48 mx-auto rounded-xl border-2 border-black bg-gray-50 flex flex-col items-center justify-center mb-4">
                    <svg className="w-16 h-16 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-500 font-nunito text-sm">Upload Image</p>
                  </div>
                )}
                
                {/* Upload Status Display */}
                {uploadStatus && (
                  <div className={`mb-4 p-3 rounded-lg text-sm font-nunito ${
                    uploadStatus.includes('successful') 
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : uploadStatus.includes('Error') || uploadStatus.includes('failed')
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                  }`}>
                    {uploadStatus}
                  </div>
                )}

                {/* IPFS Information Display */}
                {ipfsData && (
                  <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
                    <h4 className="font-nunito font-bold text-gray-800 mb-2">IPFS Information:</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">CID:</span>
                        <code className="ml-2 bg-gray-200 px-2 py-1 rounded text-xs">{ipfsData.cid}</code>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">IPFS URL:</span>
                        <code className="ml-2 bg-gray-200 px-2 py-1 rounded text-xs break-all">{ipfsData.ipfsUrl}</code>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Gateway URL:</span>
                        <a 
                          href={ipfsData.gatewayUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs break-all"
                        >
                          {ipfsData.gatewayUrl}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="image-upload"
                  ref={fileInputRef}
                />
                
                <div className="space-y-4 mt-4">
                  <label htmlFor="image-upload">
                    <Button 
                      as="span" 
                      className="btn-cartoon bg-orange-500 hover:bg-orange-600 text-white cursor-pointer px-6 py-2 font-nunito inline-block"
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Choose File'}
                    </Button>
                  </label>
                  
                  <p className="text-sm text-gray-600 font-nunito text-center">
                    or drag and drop an image here
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <div className="flex items-center mb-2">
                    <FolderIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="font-nunito text-gray-700">File size and type</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Image - max 15mb: '.jpg', '.gif' or '.png' recommended</li>
                    <li>• Video - max 50mb: '.mp4' recommended</li>
                  </ul>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <RectangleStackIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="font-nunito text-gray-700">Resolution and aspect ratio</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Image - min. 1000x1000px, 1:1 square recommended</li>
                    <li>• Video - 16:9 or 9:16, 1080p+ recommended</li>
                  </ul>
                </div>
              </div>

            </div>

            {/* Warning */}
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-sm text-gray-700 font-nunito">
                  Coin data (social links, etc) can only be added now, and can't be changed or edited after creation
                </p>
              </div>
            </div>

          {/* Token Creation Status Display */}
          {tokenCreationStatus === 'success' && createdTokenInfo && (
            <div className="bg-green-100 border-2 border-green-400 rounded-lg p-6">
              <div className="flex items-start">
                <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-nunito text-green-800 mb-2">🎉 Token Created Successfully!</h3>
                  <div className="space-y-2 text-sm mb-4">
                    <div>
                      <span className="font-medium text-green-700">Token Name:</span>
                      <span className="ml-2">{createdTokenInfo.name} ({createdTokenInfo.symbol})</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-700">Mint Address:</span>
                      <code className="ml-2 bg-green-200 px-2 py-1 rounded text-xs break-all">{createdTokenInfo.mintAddress}</code>
                    </div>
                    <div>
                      <span className="font-medium text-green-700">Transaction:</span>
                      <a
                        href={generateTxExplorerUrl(createdTokenInfo.signature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-green-600 hover:text-green-800 underline text-xs break-all"
                      >
                        {createdTokenInfo.signature}
                      </a>
                    </div>
                  </div>

                  {/* Jump button and countdown */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-green-300">
                    <Button
                      onClick={handleNavigateToCoin}
                      className="btn-cartoon bg-green-500 hover:bg-green-600 text-white px-6 py-2 font-nunito"
                    >
                      View Token Details →
                    </Button>
                    <span className="text-sm text-green-700 font-nunito">
                      Redirecting in {countdown}s...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {tokenCreationStatus === 'error' && errorMessage && (
            <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4">
              <div className="flex items-start">
                <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <h3 className="text-lg font-nunito text-red-800 mb-1">Token Creation Failed</h3>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Create Button */}
          <Button
            onClick={handleCreateCoin}
            disabled={
              isUploading || 
              tokenCreationStatus === 'creating' || 
              !connected || 
              !isReady || 
              !ipfsData || 
              !formData.coinName.trim() || 
              !formData.ticker.trim()
            }
            className="w-full btn-cartoon bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-lg py-4"
          >
            {tokenCreationStatus === 'creating'
              ? 'Creating token...'
              : tokenCreationStatus === 'success'
                ? 'Token created successfully!'
                : tokenCreationStatus === 'error'
                  ? 'Creation failed - Try again'
                  : isUploading 
                    ? 'Uploading metadata...' 
                    : !connected
                      ? 'Connect wallet first'
                      : !isReady
                        ? 'SDK not ready'
                        : !formData.coinName.trim() || !formData.ticker.trim()
                          ? 'Fill required fields'
                          : !ipfsData 
                            ? 'Upload image first' 
                            : 'Create coin'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;