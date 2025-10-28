import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePinPetSdk } from '../../contexts/PinPetSdkContext';

const PdaInfoDialog = ({ isOpen, onClose, title, pdaType, pdaAddress }) => {
  const { sdk, isReady } = usePinPetSdk();
  const [pdaData, setPdaData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch PDA data when dialog opens
  useEffect(() => {
    if (isOpen && pdaAddress && isReady && sdk) {
      fetchPdaData();
    }
  }, [isOpen, pdaAddress, isReady, sdk]);

  // Fetch PDA data from blockchain
  const fetchPdaData = async () => {
    try {
      setIsLoading(true);
      setPdaData(null);

      let data = null;
      
      // Call appropriate SDK method based on PDA type
      if (pdaType === 'MarginOrder') {
        data = await sdk.chain.getOrderAccount(pdaAddress);
      } else if (pdaType === 'BorrowingBondingCurve') {
        data = await sdk.chain.getCurveAccount(pdaAddress);
      }
      // Add more PDA types as needed in the future
      
      setPdaData(data);
    } catch (error) {
      console.error('[PdaInfoDialog] Failed to fetch PDA data:', error);
      setPdaData(null); // Show empty state on error
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when dialog closes
  const resetDialog = () => {
    setPdaData(null);
    setIsLoading(false);
  };

  // Handle close
  const handleClose = () => {
    resetDialog();
    onClose();
  };

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      
      // Prevent background scrolling
      const scrollY = window.scrollY;
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

  // JSON syntax highlighting function
  const syntaxHighlight = (json) => {
    if (typeof json !== 'string') {
      json = JSON.stringify(json, (key, value) =>
        typeof value === 'bigint' ? value.toString() + 'n' : value, 2);
    }
    
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?n?)/g, function(match) {
      let className = 'text-blue-400'; // numbers
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          className = 'text-purple-400'; // keys
        } else {
          className = 'text-green-400'; // strings
        }
      } else if (/true|false/.test(match)) {
        className = 'text-yellow-400'; // booleans
      } else if (/null/.test(match)) {
        className = 'text-red-400'; // null
      } else if (match.endsWith('n')) {
        className = 'text-cyan-400'; // bigint
      }
      return `<span class="${className}">${match}</span>`;
    });
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
      <div className="bg-white rounded-lg shadow-cartoon w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b-2 border-gray-200">
          <h2 className="text-xl font-nunito text-black font-bold">{title}</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* PDA Address Info */}
          <p className="text-sm text-gray-600 mb-4">
            On-chain PDA (Solana):{' '}
            <code className="bg-gray-200 px-1 rounded font-mono text-xs break-all">
              {pdaAddress}
            </code>
          </p>

          {/* JSON Display Area */}
          <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono overflow-x-auto min-h-[200px]">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-2xl mb-2">⏳</div>
                <div className="font-nunito text-lg">Loading...</div>
              </div>
            ) : pdaData ? (
              <pre 
                className="text-gray-100 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: syntaxHighlight(pdaData)
                }}
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                <div className="text-2xl mb-2">📭</div>
                <div className="font-nunito text-lg">No Data Available</div>
                <div className="text-sm mt-1">Unable to fetch PDA data from blockchain</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PdaInfoDialog;