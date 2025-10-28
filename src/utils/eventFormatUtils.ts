import { Decimal } from 'decimal.js';
import { u128ToDecimalPrice } from './priceCalculator.js';

// Configure Decimal.js precision
Decimal.set({ precision: 28 });

/**
 * Format time ago from timestamp
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Formatted time ago (e.g., "2m ago", "1h ago")
 */
export const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000); // difference in seconds
  
  if (diff < 60) {
    return `${diff}s ago`;
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`;
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h ago`;
  } else {
    return `${Math.floor(diff / 86400)}d ago`;
  }
};

/**
 * Get subscript number for zero count display
 * @param {number} num - Number to convert to subscript
 * @returns {string} - Subscript representation
 */
const getSubscriptNumber = (num) => {
  const subscripts = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
  };
  return num.toString().split('').map(digit => subscripts[digit]).join('');
};

/**
 * Format price with subscript notation for small numbers
 * @param {string|number} price - Price value (28-digit precision)
 * @returns {string} - Formatted price (e.g., "$0.0₇48636")
 */
export const formatEventPrice = (price) => {
  if (!price || price === '0') return '-';
  
  try {
    // Convert 28-digit precision price to decimal
    const priceDecimal = u128ToDecimalPrice(price);
    const num = parseFloat(priceDecimal.toString());
    
    if (num === 0) return '-';
    
    // Convert to string with sufficient precision
    let str;
    if (Math.abs(num) < 1e-15) {
      return '$0';
    } else if (Math.abs(num) < 1e-6) {
      str = num.toFixed(15);
    } else {
      str = num.toString();
    }
    
    // Handle decimal part for subscript notation
    if (str.includes('.')) {
      const [integer, decimal] = str.split('.');
      
      // Count consecutive zeros after decimal point
      let zeroCount = 0;
      for (let i = 0; i < decimal.length; i++) {
        if (decimal[i] === '0') {
          zeroCount++;
        } else {
          break;
        }
      }
      
      // Use subscript notation for more than 3 consecutive zeros
      if (zeroCount > 3) {
        const significantPart = decimal.substring(zeroCount);
        const subscriptNumber = getSubscriptNumber(zeroCount);
        
        // Show 5-8 significant digits
        let trimmedSignificant = significantPart;
        if (trimmedSignificant.length > 8) {
          trimmedSignificant = significantPart.substring(0, 8);
        }
        
        const withoutTrailingZeros = trimmedSignificant.replace(/0+$/, '');
        const finalSignificant = withoutTrailingZeros.length >= 5 ? 
          withoutTrailingZeros : 
          trimmedSignificant.substring(0, 5);
        
        return `$${integer}.0${subscriptNumber}${finalSignificant}`;
      }
    }
    
    // Normal formatting for larger numbers
    if (Math.abs(num) >= 0.001) {
      return `$${num.toFixed(6).replace(/\.?0+$/, '')}`;
    } else {
      return `$${num.toFixed(8).replace(/\.?0+$/, '')}`;
    }
  } catch (error) {
    console.error('Error formatting event price:', error);
    return '-';
  }
};

/**
 * Format token amount with K/M suffix
 * @param {string|number} amount - Token amount (6-digit precision)
 * @param {number} precision - Token precision (default 6)
 * @returns {string} - Formatted token amount (e.g., "1.23", "166.2K", "26.2M")
 */
export const formatTokenAmount = (amount, precision = 6) => {
  if (!amount || amount === '0') return '-';
  
  try {
    const amountDecimal = new Decimal(amount).div(new Decimal(10).pow(precision));
    const num = parseFloat(amountDecimal.toString());
    
    if (num === 0) return '-';
    
    // Format with K/M suffixes
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num.toFixed(2);
    }
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '-';
  }
};

/**
 * Format SOL amount with K/M suffix
 * @param {string|number} amount - SOL amount (9-digit precision)
 * @returns {string} - Formatted SOL amount (e.g., "0.99", "1.2K", "5.3M")
 */
export const formatSolAmount = (amount) => {
  if (!amount || amount === '0') return '-';
  
  try {
    const amountDecimal = new Decimal(amount).div(new Decimal(10).pow(9)); // SOL has 9 decimals
    const num = parseFloat(amountDecimal.toString());
    
    if (num === 0) return '-';
    
    // Format with K/M suffixes
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num.toFixed(2);
    }
  } catch (error) {
    console.error('Error formatting SOL amount:', error);
    return '-';
  }
};

/**
 * Format address to short form
 * @param {string} address - Full address
 * @returns {string} - Shortened address (e.g., "GKQXMq...DoTyqU")
 */
export const formatAddress = (address) => {
  if (!address || address.length < 10) return address || '-';
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

/**
 * Get event type display name
 * @param {string} eventType - Event type from API
 * @returns {string} - Display name
 */
export const getEventTypeName = (eventType) => {
  const typeNames = {
    'TokenCreated': 'Create',
    'BuySell': (data) => data.is_buy ? 'Buy' : 'Sell',
    'LongShort': (data) => data.order_type === 1 ? 'Long' : 'Short',
    'ForceLiquidate': 'Liquidate',
    'FullClose': (data) => data.is_close_long ? 'Close Long' : 'Close Short',
    'PartialClose': (data) => data.is_close_long ? 'Close Long' : 'Close Short',
    'MilestoneDiscount': 'Fee Update'
  };
  
  return typeNames[eventType] || eventType;
};

/**
 * Get account address for display based on event type
 * @param {string} eventType - Event type
 * @param {object} eventData - Event data
 * @returns {string} - Address to display
 */
export const getEventAddress = (eventType, eventData) => {
  switch (eventType) {
    case 'TokenCreated':
    case 'BuySell':
    case 'MilestoneDiscount':
      return eventData.payer;
    case 'ForceLiquidate':
      return eventData.order_pda;
    case 'LongShort':
      return eventData.user;
    case 'FullClose':
    case 'PartialClose':
      return eventData.user_sol_account;
    default:
      return eventData.payer || eventData.user || '-';
  }
};