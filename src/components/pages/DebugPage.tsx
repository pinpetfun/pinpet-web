import React, { useState } from 'react';
import PdaInfoDialog from '../common/PdaInfoDialog.jsx';

const DebugPage = () => {
  const [pdaAddress, setPdaAddress] = useState('');
  const [pdaType, setPdaType] = useState('MarginOrder');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenPdaInfo = () => {
    if (pdaAddress.trim()) {
      setIsDialogOpen(true);
    }
  };

  return (
    <main className="px-8 py-12 relative overflow-hidden">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-4xl font-nunito text-center mb-8">Debug</h1>
        
        {/* PDA Debug Section */}
        <div className="bg-white rounded-lg shadow-cartoon p-6 border-2 border-black">
          <h2 className="text-2xl font-nunito mb-4">PDA Info Viewer</h2>
          
          {/* PDA Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PDA Type:
            </label>
            <select
              value={pdaType}
              onChange={(e) => setPdaType(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
            >
              <option value="MarginOrder">MarginOrder</option>
              <option value="BorrowingBondingCurve">BorrowingBondingCurve</option>
            </select>
          </div>

          {/* PDA Address Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PDA Address:
            </label>
            <input
              type="text"
              value={pdaAddress}
              onChange={(e) => setPdaAddress(e.target.value)}
              placeholder="Enter PDA address..."
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Open Button */}
          <button
            onClick={handleOpenPdaInfo}
            disabled={!pdaAddress.trim()}
            className="btn-cartoon bg-orange-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-nunito"
          >
            Open PDA Info
          </button>
        </div>

        {/* PDA Info Dialog */}
        <PdaInfoDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          title={`${pdaType} Info`}
          pdaType={pdaType}
          pdaAddress={pdaAddress}
        />
      </div>
    </main>
  );
};

export default DebugPage;