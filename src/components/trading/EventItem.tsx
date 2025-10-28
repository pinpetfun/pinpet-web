import React from 'react';
import { 
  formatTimeAgo,
  formatEventPrice,
  formatTokenAmount,
  formatSolAmount,
  formatAddress,
  getEventTypeName,
  getEventAddress
} from '../../utils/eventFormatUtils.js';

const EventItem = ({ event }) => {
  const { event_type, event_data, timestamp } = event;

  // Get event data for display
  const getEventDisplayData = () => {
    // Get display name (may depend on event data)
    const typeName = typeof getEventTypeName(event_type) === 'function' 
      ? getEventTypeName(event_type)(event_data) 
      : getEventTypeName(event_type);
    
    // Get price
    let price = '-';
    if (event_data.latest_price) {
      price = formatEventPrice(event_data.latest_price);
    }
    
    // Get token and SOL amounts based on event type
    let tokenAmount = '-';
    let solAmount = '-';
    
    switch (event_type) {
      case 'BuySell':
        tokenAmount = formatTokenAmount(event_data.token_amount);
        solAmount = formatSolAmount(event_data.sol_amount);
        break;
      case 'LongShort':
        tokenAmount = formatTokenAmount(event_data.lock_lp_token_amount);
        solAmount = formatSolAmount(event_data.lock_lp_sol_amount);
        break;
      case 'FullClose':
      case 'PartialClose':
        tokenAmount = formatTokenAmount(event_data.final_token_amount);
        solAmount = formatSolAmount(event_data.final_sol_amount);
        break;
      default:
        // TokenCreated, ForceLiquidate, MilestoneDiscount have no amounts
        break;
    }
    
    // Get address - special handling for Liquidate events
    let address;
    if (event_type === 'ForceLiquidate') {
      // For Liquidate events, show first 8 characters of PDA
      const pda = getEventAddress(event_type, event_data);
      address = pda && pda.length >= 14 ? pda.slice(0, 14) : (pda || '-');
    } else {
      address = formatAddress(getEventAddress(event_type, event_data));
    }
    
    return {
      typeName,
      price,
      tokenAmount,
      solAmount,
      address,
      timeAgo: formatTimeAgo(timestamp)
    };
  };


  const eventData = getEventDisplayData();

  return (
    <div className="border border-gray-200 rounded-lg p-2 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between text-sm font-mono">
        <div className="flex items-center space-x-3 flex-1">
          <span className="text-gray-500 w-16 text-right">{eventData.timeAgo}</span>
          <span className="text-gray-400">|</span>
          <span className="font-semibold w-20 text-left">{eventData.typeName}</span>
          <span className="text-gray-400">|</span>
          <span className="text-blue-600 w-24 text-right">{eventData.price}</span>
          <span className="text-gray-400">|</span>
          <span className="text-green-600 w-16 text-right">{eventData.tokenAmount}</span>
          <span className="text-gray-400">|</span>
          <span className="text-orange-600 w-16 text-right">{eventData.solAmount}</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600 flex-1 truncate">{eventData.address}</span>
        </div>
      </div>
    </div>
  );
};

export default EventItem;