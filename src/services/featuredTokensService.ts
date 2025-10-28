import { config, convertIpfsUrl, shortenAddress } from '../config.js'
import { getTokenEmojiImage } from '../config/emojiConfig'

/**
 * 获取mints列表 - Featured Tokens版本
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const fetchMints = async () => {
  try {
    const response = await fetch(`${config.pinpetApiUrl}/api/mints?page=1&limit=100&sort_by=slot_desc`, {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch mints')
    }

    return {
      success: true,
      data: result.data.mints || []
    }
  } catch (error) {
    console.error('Error fetching mints:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 获取mints详细信息 - Featured Tokens版本
 * @param {Array<string>} mints - mint账户地址数组
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const fetchMintDetails = async (mints) => {
  if (!mints || mints.length === 0) {
    return {
      success: true,
      data: []
    }
  }

  try {
    const response = await fetch(`${config.pinpetApiUrl}/api/details`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mints: mints
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch mint details')
    }

    return {
      success: true,
      data: result.data.details || []
    }
  } catch (error) {
    console.error('Error fetching mint details:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 转换API数据为FeaturedToken格式
 * @param {Object} mintDetail - API返回的mint详情
 * @returns {Object} - FeaturedToken格式的数据
 */
export const transformToFeaturedToken = (mintDetail) => {
  // 生成随机进度 (0-100)
  const randomProgress = Math.floor(Math.random() * 100)
  
  // 随机决定是否为Completed (30%概率)
  const isCompleted = Math.random() < 0.3

  // 转换图片URL
  const image = mintDetail.uri_data?.image ?
    convertIpfsUrl(mintDetail.uri_data.image) :
    getTokenEmojiImage(mintDetail.symbol, 400, 200, '#FFD700')

  return {
    name: mintDetail.symbol || mintDetail.name || 'Unknown',
    contractAddress: shortenAddress(mintDetail.mint_account),
    marketCap: `$${Math.floor(Math.random() * 200)}K`, // 暂时用随机值
    progress: randomProgress,
    image: image,
    isCompleted: isCompleted,
    mintAccount: mintDetail.mint_account // 保存完整地址用于跳转
  }
}

/**
 * 获取精选代币数据
 * @param {number} limit - 限制返回数量，默认15
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const fetchFeaturedTokens = async (limit = 15) => {
  try {
    // 1. 获取mints列表
    const mintsResult = await fetchMints()
    if (!mintsResult.success) {
      throw new Error(mintsResult.error)
    }

    const mints = mintsResult.data.slice(0, limit) // 只取前N个
    
    if (mints.length === 0) {
      return {
        success: true,
        data: []
      }
    }

    // 2. 获取详细信息
    const detailsResult = await fetchMintDetails(mints)
    if (!detailsResult.success) {
      throw new Error(detailsResult.error)
    }

    // 3. 转换数据格式
    const featuredTokens = detailsResult.data.map(transformToFeaturedToken)

    return {
      success: true,
      data: featuredTokens
    }
  } catch (error) {
    console.error('Error fetching featured tokens:', error)
    return {
      success: false,
      error: error.message
    }
  }
}