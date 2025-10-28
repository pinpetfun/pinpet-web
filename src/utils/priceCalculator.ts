import { Decimal } from 'decimal.js';

// Configure Decimal.js to use 28-bit precision to match rust_decimal
Decimal.set({ precision: 28 });

/**
 * Precision factors based on spin-sdk curve_amm.js
 */
//const PRICE_PRECISION_FACTOR_DECIMAL = new Decimal('10000000000000000000000000000'); // 10^28
const PRICE_PRECISION_FACTOR_DECIMAL = new Decimal('100000000000000000000000000'); // 10^26
const TOKEN_PRECISION_FACTOR_DECIMAL = new Decimal('1000000'); // 10^6 - Token has 6 decimal places
const SOL_PRECISION_FACTOR_DECIMAL = new Decimal('1000000000'); // 10^9 - SOL has 9 decimal places

/**
 * Convert u128 price to Decimal (from 28-digit precision to human readable)
 * @param {string|number|bigint} price - Raw price from API (like 279589934762348555452)
 * @returns {Decimal} - Human readable price (1 token = X SOL)
 */
export const u128ToDecimalPrice = (price) => {
  if (!price) return new Decimal(0);
  
  let priceStr = price;
  if (typeof price === 'bigint') {
    priceStr = price.toString();
  } else if (typeof price === 'number') {
    priceStr = price.toString();
  }
  
  const priceDecimal = new Decimal(priceStr);
  return priceDecimal.div(PRICE_PRECISION_FACTOR_DECIMAL);
};

/**
 * Calculate how many tokens can be bought with given SOL amount
 * @param {string|number} solAmount - Amount of SOL to spend
 * @param {object} lastPrice - Price data from API (lastPrice.data.price)
 * @returns {string} - Number of tokens that can be bought (formatted)
 */
export const calculateTokensFromSOL = (solAmount, lastPrice) => {
  try {
    // Handle both direct price value and nested data structure
    const priceValue = typeof lastPrice === 'string' || typeof lastPrice === 'number' 
      ? lastPrice 
      : lastPrice?.data?.price;
      
    if (!solAmount || !priceValue) {
      return '0';
    }
    
    const solAmountDecimal = new Decimal(solAmount);
    if (solAmountDecimal.lte(0)) {
      return '0';
    }
    
    // Convert raw price to human readable (1 token = X SOL)
    const pricePerToken = u128ToDecimalPrice(priceValue);
    
    if (pricePerToken.lte(0)) {
      return '0';
    }
    
    // SOL amount / price per token = number of tokens
    const tokensAmount = solAmountDecimal.div(pricePerToken);
    
    // Return with 6 decimal places (token precision)
    const result = tokensAmount.toFixed(6);
    return result;
    
  } catch (error) {
    console.error('Error calculating tokens from SOL:', error);
    return '0';
  }
};

/**
 * Calculate how much SOL will be received for given token amount
 * @param {string|number} tokenAmount - Amount of tokens to sell
 * @param {object} lastPrice - Price data from API (lastPrice.data.price)
 * @returns {string} - Amount of SOL that will be received (formatted)
 */
export const calculateSOLFromTokens = (tokenAmount, lastPrice) => {
  try {
    // Handle both direct price value and nested data structure
    const priceValue = typeof lastPrice === 'string' || typeof lastPrice === 'number' 
      ? lastPrice 
      : lastPrice?.data?.price;
      
    if (!tokenAmount || !priceValue) return '0';
    
    const tokenAmountDecimal = new Decimal(tokenAmount);
    if (tokenAmountDecimal.lte(0)) return '0';
    
    // Convert raw price to human readable (1 token = X SOL)
    const pricePerToken = u128ToDecimalPrice(priceValue);
    
    if (pricePerToken.lte(0)) return '0';
    
    // Token amount * price per token = SOL amount
    const solAmount = tokenAmountDecimal.mul(pricePerToken);
    
    // Return with 9 decimal places (SOL precision)
    return solAmount.toFixed(9);
    
  } catch (error) {
    console.error('Error calculating SOL from tokens:', error);
    return '0';
  }
};

/**
 * Format number for display with appropriate decimal places
 * @param {string|number} value - Value to format
 * @param {number} maxDecimals - Maximum decimal places to show
 * @returns {string} - Formatted value
 */
export const formatDisplayNumber = (value, maxDecimals = 6) => {
  try {
    const decimal = new Decimal(value);
    if (decimal.eq(0)) return '0';
    
    // For very small numbers, show more precision
    if (decimal.lt(0.001)) {
      return decimal.toFixed(maxDecimals);
    }
    
    // For normal numbers, remove unnecessary trailing zeros
    const fixed = decimal.toFixed(maxDecimals);
    return parseFloat(fixed).toString();
    
  } catch (error) {
    console.error('Error formatting display number:', error);
    return '0';
  }
};

/**
 * Get readable price information for debugging
 * @param {object} lastPrice - Price data from API
 * @returns {object} - Readable price information
 */
export const getPriceDebugInfo = (lastPrice) => {
  // Handle both direct price value and nested data structure
  const priceValue = typeof lastPrice === 'string' || typeof lastPrice === 'number' 
    ? lastPrice 
    : lastPrice?.data?.price;
    
  if (!priceValue) {
    return {
      rawPrice: 'N/A',
      readablePrice: 'N/A',
      priceDisplay: 'N/A'
    };
  }
  
  try {
    const readablePrice = u128ToDecimalPrice(priceValue);
    
    return {
      rawPrice: priceValue.toString(),
      readablePrice: readablePrice.toFixed(28),
      priceDisplay: `1 token = ${formatDisplayNumber(readablePrice, 9)} SOL`
    };
  } catch (error) {
    console.error('Error getting price debug info:', error);
    return {
      rawPrice: 'Error',
      readablePrice: 'Error',
      priceDisplay: 'Error'
    };
  }
};