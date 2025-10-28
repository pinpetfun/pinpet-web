import { PinataSDK } from 'pinata'
import { config } from '../config.js'

// 初始化 Pinata SDK
const pinata = new PinataSDK({
  pinataJwt: "",
  pinataGateway: config.gatewayUrl
})

/**
 * 上传文件到 IPFS 通过 Pinata
 * @param {File} file - 要上传的文件
 * @returns {Promise<{success: boolean, data?: {cid: string, ipfsUrl: string, gatewayUrl: string}, error?: string}>}
 */
export const uploadToIPFS = async (file) => {
  try {
    // 获取预签名 URL
    const urlResponse = await fetch(`${config.serverUrl}/presigned_url`, {
      method: "GET",
      headers: {
        // Handle your own server authorization here
      }
    })
    
    if (!urlResponse.ok) {
      throw new Error(`Failed to get presigned URL: ${urlResponse.status}`)
    }
    
    const urlData = await urlResponse.json()
    
    // 上传文件到 Pinata
    const upload = await pinata.upload.public
      .file(file)
      .url(urlData.url)
    
    if (!upload.cid) {
      throw new Error('Upload failed: No CID returned')
    }
    
    // 生成 IPFS URL
    const gatewayUrl = await pinata.gateways.public.convert(upload.cid)
    const ipfsUrl = `ipfs://${upload.cid}`
    
    return {
      success: true,
      data: {
        cid: upload.cid,
        ipfsUrl: ipfsUrl,
        gatewayUrl: gatewayUrl
      }
    }
  } catch (error) {
    console.error('IPFS upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * 验证文件类型和大小
 * @param {File} file - 要验证的文件
 * @returns {{valid: boolean, error?: string}}
 */
export const validateFile = (file) => {
  const maxSize = 15 * 1024 * 1024 // 15MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  
  if (!file) {
    return { valid: false, error: 'Please select a file' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size cannot exceed 15MB' }
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, GIF image formats are supported' }
  }
  
  return { valid: true }
}

/**
 * 上传 JSON 数据到 IPFS 通过 Pinata
 * @param {Object} jsonData - 要上传的 JSON 数据
 * @returns {Promise<{success: boolean, data?: {cid: string, ipfsUrl: string, gatewayUrl: string}, error?: string}>}
 */
export const uploadJSONToIPFS = async (jsonData) => {
  try {
    // 获取预签名 URL
    const urlResponse = await fetch(`${config.serverUrl}/presigned_url`, {
      method: "GET",
      headers: {
        // Handle your own server authorization here
      }
    })
    
    if (!urlResponse.ok) {
      throw new Error(`Failed to get presigned URL: ${urlResponse.status}`)
    }
    
    const urlData = await urlResponse.json()
    
    // 将 JSON 转换为 Blob
    const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: 'application/json'
    })
    
    // 创建 File 对象
    const jsonFile = new File([jsonBlob], 'metadata.json', {
      type: 'application/json'
    })
    
    // 上传文件到 Pinata
    const upload = await pinata.upload.public
      .file(jsonFile)
      .url(urlData.url)
    
    if (!upload.cid) {
      throw new Error('Upload failed: No CID returned')
    }
    
    // 生成 IPFS URL
    const gatewayUrl = await pinata.gateways.public.convert(upload.cid)
    const ipfsUrl = `ipfs://${upload.cid}`
    
    return {
      success: true,
      data: {
        cid: upload.cid,
        ipfsUrl: ipfsUrl,
        gatewayUrl: gatewayUrl
      }
    }
  } catch (error) {
    console.error('JSON IPFS upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}