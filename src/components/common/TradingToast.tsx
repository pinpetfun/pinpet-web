import React, { useState, useEffect } from 'react';
import { generateTxExplorerUrl } from '../../config.js';

const TradingToast = ({ isVisible, type, message, txHash, onClose }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // 延迟一帧让组件渲染，然后开始动画
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });

      // 5秒后开始淡出动画
      const timer = setTimeout(() => {
        setIsAnimating(false);
        // 动画结束后隐藏组件
        setTimeout(() => {
          setShouldRender(false);
          onClose();
        }, 300); // 等待淡出动画完成
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      setShouldRender(false);
    }
  }, [isVisible, onClose]);

  if (!shouldRender) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 transform ${
      isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className={`
        max-w-sm w-80 p-4 border-4 border-black rounded-2xl cartoon-shadow
        ${isSuccess ? 'bg-green-100' : isError ? 'bg-red-100' : 'bg-blue-100'}
      `}>
        {/* 关闭按钮 */}
        <button
          onClick={() => {
            setIsAnimating(false);
            setTimeout(() => {
              setShouldRender(false);
              onClose();
            }, 300);
          }}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ×
        </button>

        {/* 图标和标题 */}
        <div className="flex items-center mb-2">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white font-bold
            ${isSuccess ? 'bg-green-500' : isError ? 'bg-red-500' : 'bg-blue-500'}
          `}>
            {isSuccess ? '✓' : isError ? '✗' : 'i'}
          </div>
          <h3 className={`
            text-lg font-nunito font-bold
            ${isSuccess ? 'text-green-800' : isError ? 'text-red-800' : 'text-blue-800'}
          `}>
            {isSuccess ? '🎉 Transaction Successful!' : isError ? '❌ Transaction Failed' : '💫 Transaction In Progress'}
          </h3>
        </div>

        {/* 消息内容 */}
        <div className={`
          text-sm font-nunito mb-3
          ${isSuccess ? 'text-green-700' : isError ? 'text-red-700' : 'text-blue-700'}
        `}>
          {message}
        </div>

        {/* 交易哈希（仅成功时显示） */}
        {isSuccess && txHash && (
          <div className="space-y-2">
            <div className="text-xs font-nunito text-gray-600">
              Transaction Hash:
            </div>
            <div className="bg-white border-2 border-gray-300 rounded-lg p-2">
              <code className="text-xs break-all text-gray-800 font-mono">
                {txHash}
              </code>
            </div>
            {/* 区块链浏览器链接 */}
            <div className="flex justify-end">
              <a
                href={generateTxExplorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-nunito text-blue-600 hover:text-blue-800 underline"
              >
                <span className="mr-1">🔍</span>
                View on Explorer
              </a>
            </div>
          </div>
        )}

        {/* 进度条（5秒倒计时） */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className={`
                h-1 rounded-full transition-all duration-[5000ms] ease-linear
                ${isSuccess ? 'bg-green-500' : isError ? 'bg-red-500' : 'bg-blue-500'}
                ${isAnimating ? 'w-0' : 'w-full'}
              `}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingToast;