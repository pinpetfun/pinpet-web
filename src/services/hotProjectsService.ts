import { config, convertIpfsUrl, shortenAddress } from '../config.js'
import { getTokenEmojiImage } from '../config/emojiConfig'

/**
 * 获取mints列表
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
 * 获取mints详细信息
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
 * 转换API数据为HotProject格式
 * @param {Object} mintDetail - API返回的mint详情
 * @returns {Object} - HotProject格式的数据
 */
export const transformToHotProject = (mintDetail) => {
  // 生成随机颜色
  const colors = ['32CD32', 'FFA500', '87CEEB', '9370DB', 'FF69B4', '20B2AA']
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  
  // 生成随机进度 (0-100)
  const randomProgress = Math.floor(Math.random() * 100)
  
  // 随机决定是否为Hot (20%概率)
  const isHot = Math.random() < 0.2

  // 转换图片URL
  const petImage = mintDetail.uri_data?.image ?
    convertIpfsUrl(mintDetail.uri_data.image) :
    getTokenEmojiImage(mintDetail.symbol, 400, 200, `#${randomColor}`)

  return {
    name: mintDetail.symbol || mintDetail.name || 'Unknown',
    marketCap: `$${Math.floor(Math.random() * 200)}K`, // 暂时用随机值
    progress: randomProgress,
    color: randomColor,
    isHot: isHot,
    petImage: petImage,
    contractAddress: shortenAddress(mintDetail.mint_account),
    mintAccount: mintDetail.mint_account // 保存完整地址用于跳转
  }
}

/**
 * 获取热门项目数据
 * @param {number} limit - 限制返回数量，默认3
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const fetchHotProjects = async (limit = 3) => {
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
    const hotProjects = detailsResult.data.map(transformToHotProject)

    return {
      success: true,
      data: hotProjects
    }
  } catch (error) {
    console.error('Error fetching hot projects:', error)
    return {
      success: false,
      error: error.message
    }
  }
}