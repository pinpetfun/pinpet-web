import React from 'react';
import { config } from '../../config.js';

const ConfigDebug = () => {
  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-black rounded-lg p-4 cartoon-shadow z-50 text-xs font-mono max-w-sm">
      <h3 className="font-nunito font-bold mb-2">Config Debug</h3>
      <div className="space-y-1">
        <div>serverUrl: {config.serverUrl || 'undefined'}</div>
        <div>spinpetApiUrl: {config.pinpetApiUrl || 'undefined'}</div>
        <div>tradeQuoteWs: {config.tradeQuoteWs || 'undefined'}</div>
        <div>isDev: {config.isDev ? 'true' : 'false'}</div>
      </div>
    </div>
  );
};

export default ConfigDebug;