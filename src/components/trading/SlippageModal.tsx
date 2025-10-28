import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  getSlippageSettings, 
  saveSlippageSettings, 
  validateSlippage, 
  SLIPPAGE_CONFIG,
  SPEED_OPTIONS 
} from '../../config/tradingConfig';

const SlippageModal = ({ isOpen, onClose, onSettingsChange }) => {
  const [settings, setSettings] = useState(getSlippageSettings());
  const [slippageInput, setSlippageInput] = useState(settings.slippage.toString());
  const [inputError, setInputError] = useState('');

  // 加载设置
  useEffect(() => {
    if (isOpen) {
      const currentSettings = getSlippageSettings();
      setSettings(currentSettings);
      setSlippageInput(currentSettings.slippage.toString());
      setInputError('');
    }
  }, [isOpen]);

  // 处理滑点输入
  const handleSlippageChange = (e) => {
    const value = e.target.value;
    setSlippageInput(value);
    
    if (value === '') {
      setInputError('');
      return;
    }
    
    if (!validateSlippage(value)) {
      setInputError(`请输入 ${SLIPPAGE_CONFIG.MIN}-${SLIPPAGE_CONFIG.MAX}% 之间的数值`);
    } else {
      setInputError('');
      const newSettings = { ...settings, slippage: parseFloat(value) };
      setSettings(newSettings);
      saveSlippageSettings(newSettings);
      onSettingsChange?.(newSettings);
    }
  };

  // 处理模态框关闭
  const handleClose = () => {
    // 如果输入为空，恢复默认值
    if (slippageInput === '' || inputError) {
      setSlippageInput(settings.slippage.toString());
      setInputError('');
    }
    onClose();
  };

  // 处理遮罩点击
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // 处理 ESC 键和防止背景滚动
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
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
  }, [isOpen]);

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
      <div className="bg-gray-800 text-white rounded-2xl border-4 border-gray-600 p-6 max-w-md w-full mx-4 cartoon-shadow">
        {/* 标题 */}
        <h3 className="text-lg font-nunito text-white mb-4">
          set max. slippage (%)
        </h3>

        {/* 滑点输入 */}
        <div className="mb-6">
          <input
            type="text"
            value={slippageInput}
            onChange={handleSlippageChange}
            className="w-full bg-gray-700 text-white rounded-lg border-2 border-gray-600 px-4 py-3 text-lg font-nunito focus:border-blue-400 focus:outline-none"
            placeholder="2"
          />
          {inputError && (
            <div className="text-red-400 text-sm mt-2">{inputError}</div>
          )}
          <div className="text-gray-400 text-sm mt-2">
            this is the maximum amount of slippage you are willing to accept when placing trades
          </div>
        </div>

        {/* Speed 选项 - 禁用状态 */}
        <div className="mb-6">
          <div className="text-white mb-2">
            <span className="font-nunito">speed:</span>
            <span className="ml-2 opacity-50">
              {SPEED_OPTIONS.map((speed, index) => (
                <span 
                  key={speed}
                  className={`px-2 py-1 rounded text-sm ${
                    speed === 'Turbo' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  } ${index > 0 ? 'ml-1' : ''}`}
                >
                  {speed}
                </span>
              ))}
            </span>
          </div>
          <div className="text-gray-500 text-sm opacity-50">
            higher speeds will increase your priority fees, making your transactions confirm faster
          </div>
        </div>

        {/* Front-running protection - 禁用状态 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-nunito text-white">enable front-running protection:</span>
            <div className="flex">
              <span className="px-3 py-1 rounded bg-gray-600 text-gray-300 text-sm opacity-50">On</span>
              <span className="px-3 py-1 rounded bg-gray-700 text-gray-400 text-sm ml-1 opacity-50">Off</span>
            </div>
          </div>
        </div>

        {/* Tip amount - 禁用状态 */}
        <div className="mb-6">
          <div className="text-white font-nunito mb-2">tip amount</div>
          <div className="flex items-center bg-gray-700 rounded-lg border-2 border-gray-600 opacity-50">
            <input
              type="text"
              value="0.003"
              disabled
              className="flex-1 bg-transparent text-white px-4 py-3 font-nunito focus:outline-none"
            />
            <div className="px-4 py-3 text-white font-nunito flex items-center">
              SOL
              <div className="w-6 h-6 bg-gray-600 rounded ml-2"></div>
            </div>
          </div>
          <div className="text-gray-500 text-sm mt-2 opacity-50">
            a higher tip amount will make your transactions confirm faster this is the transaction fee that you pay to the solana network on each trade.
          </div>
        </div>

        {/* 关闭按钮 */}
        <div className="text-center">
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white font-nunito text-sm transition-colors"
          >
            [close]
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SlippageModal;