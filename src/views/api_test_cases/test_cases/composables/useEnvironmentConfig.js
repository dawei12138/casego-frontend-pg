// composables/useEnvironmentConfig.js - 修复全局请求头格式
import { ref, computed } from 'vue'
import { getEnvironmentConfig, saveEnvironmentConfig, getServicesList } from './caseService'

// 全局缓存状态
const globalEnvironmentConfigState = {
  configCache: ref(new Map()),
  servicesCache: ref(new Map()),
  loading: ref(false),
  lastFetchTime: ref(new Map()),
  cacheExpiry: 5 * 60 * 1000,
  isInitialized: ref(false)
}

export function useEnvironmentConfig() {
  const {
    configCache,
    servicesCache,
    loading,
    lastFetchTime,
    cacheExpiry,
    isInitialized
  } = globalEnvironmentConfigState

  const isCacheExpired = (cacheKey) => {
    const fetchTime = lastFetchTime.value.get(cacheKey)
    if (!fetchTime) return true
    return Date.now() - fetchTime > cacheExpiry
  }

  /**
   * 转换后端globalHeaders到前端headers格式
   * @param {Array} globalHeaders - 后端返回的全局请求头数组
   * @returns {Array} 转换后的请求头列表
   */
  const transformGlobalHeadersToHeaders = (globalHeaders) => {
    if (!Array.isArray(globalHeaders)) return []
    
    return globalHeaders.map(header => ({
      key: header.key || '',
      value: header.value || '',
      description: header.description || '',
      enabled: header.is_run !== false // 默认为true，只有明确为false时才禁用
    }))
  }

  /**
   * 转换前端headers到后端globalHeaders格式
   * @param {Array} headers - 前端的请求头列表
   * @returns {Array} 转换后的全局请求头数组
   */
  const transformHeadersToGlobalHeaders = (headers) => {
    if (!Array.isArray(headers)) return []

    // 只保留有键名的请求头
    return headers
      .filter(header => header.key && header.key.trim())
      .map(header => ({
        key: header.key.trim(),
        value: header.value || '',
        description: header.description || '',
        is_run: header.enabled !== false // 默认为true
      }))
  }

  /**
   * 转换后端globalCookies到前端cookies格式
   * @param {Array} globalCookies - 后端返回的全局Cookie数组
   * @returns {Array} 转换后的Cookie列表
   */
  const transformGlobalCookiesToCookies = (globalCookies) => {
    if (!Array.isArray(globalCookies)) return []

    return globalCookies.map(cookie => ({
      key: cookie.key || '',
      value: cookie.value || '',
      description: cookie.description || '',
      enabled: cookie.is_run !== false
    }))
  }

  /**
   * 转换前端cookies到后端globalCookies格式
   * @param {Array} cookies - 前端的Cookie列表
   * @returns {Array} 转换后的全局Cookie数组
   */
  const transformCookiesToGlobalCookies = (cookies) => {
    if (!Array.isArray(cookies)) return []

    return cookies
      .filter(cookie => cookie.key && cookie.key.trim())
      .map(cookie => ({
        key: cookie.key.trim(),
        value: cookie.value || '',
        description: cookie.description || '',
        is_run: cookie.enabled !== false
      }))
  }

  /**
   * 转换cacheList到variables格式
   */
  const transformCacheListToVariables = (cacheList) => {
    if (!Array.isArray(cacheList)) return []
    
    return cacheList.map(cache => ({
      key: cache.cacheKey || '',
      value: cache.cacheValue || '',
      type: 'text',
      isSecret: false,
      enabled: true,
      description: '',
      id: cache.id,
      is_delete: cache.is_delete || false  // 添加 is_delete 字段处理
    }))
  }

  /**
   * 转换variables到cacheList格式
   */
  const transformVariablesToCacheList = (variables) => {
    if (!Array.isArray(variables)) return []
    
    return variables
      .filter(variable => variable.key && variable.key.trim())
      .map(variable => ({
        id: variable.id,
        cacheKey: variable.key,
        cacheValue: variable.value || '',
        is_delete: variable.is_delete || false  // 添加 is_delete 字段
      }))
  }

  /**
   * 获取环境配置数据
   */
  const getEnvironmentConfigData = async (environmentId, forceRefresh = false) => {
    const cacheKey = `config_${environmentId}`
    
    if (!forceRefresh && configCache.value.has(environmentId) && !isCacheExpired(cacheKey)) {
      console.log('Using cached environment config for:', environmentId)
      return configCache.value.get(environmentId)
    }

    if (loading.value && !forceRefresh) {
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!loading.value) {
            resolve(configCache.value.get(environmentId) || getDefaultConfig(environmentId))
          } else {
            setTimeout(checkLoading, 100)
          }
        }
        checkLoading()
      })
    }

    loading.value = true
    
    try {
      console.log(`${forceRefresh ? 'Force fetching' : 'Fetching'} environment config for:`, environmentId)
      const response = await getEnvironmentConfig(environmentId)
      
      if (response && response.code === 200) {
        const configData = response
        
        const processedConfig = {
          id: configData.id || environmentId,
          name: configData.name || '',
          baseUrl: configData.url || '',
          timeout: configData.requestTimeout || 30000,
          description: configData.description || configData.remark || '',
          variables: transformCacheListToVariables(configData.cacheList || []),
          headers: transformGlobalHeadersToHeaders(configData.globalHeaders || configData.global_headers || []),
          cookies: transformGlobalCookiesToCookies(configData.globalCookies || configData.global_cookies || [])
        }
        
        configCache.value.set(environmentId, processedConfig)
        lastFetchTime.value.set(cacheKey, Date.now())
        isInitialized.value = true
        
        console.log(`Environment config fetched successfully for:`, environmentId, processedConfig)
        return processedConfig
      } else {
        throw new Error(response?.msg || '获取环境配置失败')
      }
    } catch (error) {
      console.error('Failed to fetch environment config:', error)
      
      if (!forceRefresh && configCache.value.has(environmentId)) {
        console.log('Using cached environment config due to error')
        return configCache.value.get(environmentId)
      }
      
      const defaultConfig = getDefaultConfig(environmentId)
      configCache.value.set(environmentId, defaultConfig)
      return defaultConfig
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取服务列表数据
   */
  const getServicesListData = async (environmentId) => {
    if (!environmentId) return []
    
    const cacheKey = `services_${environmentId}`
    
    if (servicesCache.value.has(environmentId) && !isCacheExpired(cacheKey)) {
      console.log('Using cached services list for:', environmentId)
      return servicesCache.value.get(environmentId)
    }

    try {
      console.log('Fetching services list for:', environmentId)
      const response = await getServicesList({
        pageNum: 1,
        pageSize: 10,
        environmentId: environmentId
      })
      
      if (response && response.code === 200) {
        const servicesData = response.rows || []
        servicesCache.value.set(environmentId, servicesData)
        lastFetchTime.value.set(cacheKey, Date.now())
        
        console.log('Services list fetched successfully for:', environmentId, servicesData.length, 'items')
        return servicesData
      } else {
        console.warn('Failed to fetch services list:', response?.msg)
        return []
      }
    } catch (error) {
      console.error('Failed to fetch services list for environment', environmentId, ':', error)
      
      if (servicesCache.value.has(environmentId)) {
        console.log('Using cached services list due to error')
        return servicesCache.value.get(environmentId)
      }
      
      return []
    }
  }

  /**
   * 保存环境配置数据
   */
  const saveEnvironmentConfigData = async (configData) => {
    try {
      const saveData = {
        id: configData.id,
        name: configData.name,
        url: configData.baseUrl,
        requestTimeout: configData.timeout,
        description: configData.description,
        cacheList: transformVariablesToCacheList(configData.variables),
        globalHeaders: transformHeadersToGlobalHeaders(configData.headers),
        globalCookies: transformCookiesToGlobalCookies(configData.cookies)
      }
      
      console.log('Saving environment config:', saveData)
      console.log('GlobalHeaders format:', saveData.globalHeaders)
      
      const response = await saveEnvironmentConfig(saveData)
      
      if (response && response.code === 200) {
        configCache.value.set(configData.id, configData)
        const cacheKey = `config_${configData.id}`
        lastFetchTime.value.set(cacheKey, Date.now())
        
        console.log('Environment config saved successfully')
        return response
      } else {
        throw new Error(response?.msg || '保存失败')
      }
    } catch (error) {
      console.error('Failed to save environment config:', error)
      throw error
    }
  }

  /**
   * 预加载环境配置和服务列表
   */
  const preloadEnvironmentData = async (environmentId) => {
    if (!environmentId) return
    
    try {
      await Promise.allSettled([
        getEnvironmentConfigData(environmentId),
        getServicesListData(environmentId)
      ])
      
      console.log('Environment data preloaded for:', environmentId)
    } catch (error) {
      console.warn('Failed to preload environment data:', error)
    }
  }

  /**
   * 获取默认配置
   */
  const getDefaultConfig = (environmentId) => {
    return {
      id: environmentId,
      name: '',
      baseUrl: '',
      timeout: 30000,
      description: '',
      variables: [],
      headers: [],
      cookies: []
    }
  }

  /**
   * 清除指定环境的缓存
   */
  const clearEnvironmentCache = (environmentId) => {
    if (environmentId) {
      configCache.value.delete(environmentId)
      servicesCache.value.delete(environmentId)
      lastFetchTime.value.delete(`config_${environmentId}`)
      lastFetchTime.value.delete(`services_${environmentId}`)
      console.log('Cleared cache for environment:', environmentId)
    }
  }

  /**
   * 清除所有缓存
   */
  const clearAllCache = () => {
    configCache.value.clear()
    servicesCache.value.clear()
    lastFetchTime.value.clear()
    isInitialized.value = false
    console.log('All environment cache cleared')
  }

  /**
   * 获取缓存状态信息
   */
  const getCacheInfo = () => {
    return {
      isInitialized: isInitialized.value,
      configCount: configCache.value.size,
      servicesCount: servicesCache.value.size,
      isLoading: loading.value,
      cacheKeys: Array.from(lastFetchTime.value.keys())
    }
  }

  return {
    loading: computed(() => loading.value),
    isInitialized: computed(() => isInitialized.value),
    getEnvironmentConfigData,
    getServicesListData,
    saveEnvironmentConfigData,
    preloadEnvironmentData,
    clearEnvironmentCache,
    clearAllCache,
    getCacheInfo
  }
}