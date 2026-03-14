// composables/useDatabaseList.js - 数据库列表缓存管理
import { ref, computed } from 'vue'
import { listApi_databases } from "@/api/api_databases/api_databases"

// 全局缓存状态
const globalDatabaseState = {
  databaseList: ref([]),
  loading: ref(false),
  lastFetchTime: ref(null),
  error: ref(null),
  cacheExpiry: 5 * 60 * 1000, // 5分钟缓存过期时间
  isInitialized: ref(false)
}

/**
 * 数据库列表缓存管理组合式函数
 * 提供全局共享的数据库列表数据，避免重复请求
 */
export function useDatabaseList() {
  const {
    databaseList,
    loading,
    lastFetchTime,
    error,
    cacheExpiry,
    isInitialized
  } = globalDatabaseState

  // 检查缓存是否过期
  const isCacheExpired = computed(() => {
    if (!lastFetchTime.value) return true
    return Date.now() - lastFetchTime.value > cacheExpiry
  })

  // 检查是否需要获取数据
  const needsFetch = computed(() => {
    return !isInitialized.value || 
           databaseList.value.length === 0 || 
           isCacheExpired.value ||
           error.value
  })

  /**
   * 获取数据库列表
   * @param {boolean} forceRefresh - 是否强制刷新，忽略缓存
   * @returns {Promise} 返回数据库列表
   */
  const fetchDatabaseList = async (forceRefresh = false) => {
    // 如果正在加载中，返回现有的Promise
    if (loading.value && !forceRefresh) {
      console.log('Database list is already being fetched, waiting...')
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!loading.value) {
            resolve(databaseList.value)
          } else {
            setTimeout(checkLoading, 100)
          }
        }
        checkLoading()
      })
    }

    // 如果有缓存且未过期，直接返回缓存数据
    if (!forceRefresh && !needsFetch.value) {
      console.log('Using cached database list:', databaseList.value.length, 'items')
      return databaseList.value
    }

    console.log('Fetching database list from API...')
    loading.value = true
    error.value = null

    try {
      const response = await listApi_databases()
      
      if (response && response.rows) {
        databaseList.value = response.rows
        lastFetchTime.value = Date.now()
        isInitialized.value = true
        error.value = null
        
        console.log('Database list fetched successfully:', databaseList.value.length, 'items')
        return databaseList.value
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Failed to fetch database list:', err)
      error.value = err.message || '获取数据库列表失败'
      
      // 如果有缓存数据，在出错时继续使用缓存
      if (databaseList.value.length > 0) {
        console.log('Using cached database list due to error')
        return databaseList.value
      }
      
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取数据库列表（智能缓存）
   * 优先使用缓存，必要时自动获取最新数据
   */
  const getDatabaseList = async () => {
    try {
      return await fetchDatabaseList(false)
    } catch (error) {
      console.error('Error getting database list:', error)
      return databaseList.value // 返回当前缓存的数据，即使可能为空
    }
  }

  /**
   * 强制刷新数据库列表
   */
  const refreshDatabaseList = async () => {
    console.log('Force refreshing database list...')
    try {
      return await fetchDatabaseList(true)
    } catch (error) {
      console.error('Error refreshing database list:', error)
      throw error
    }
  }

  /**
   * 清除缓存
   */
  const clearCache = () => {
    console.log('Clearing database list cache')
    databaseList.value = []
    lastFetchTime.value = null
    error.value = null
    isInitialized.value = false
  }

  /**
   * 预加载数据库列表
   * 在应用启动时调用，预先获取数据
   */
  const preloadDatabaseList = async () => {
    if (!isInitialized.value) {
      console.log('Preloading database list...')
      try {
        await fetchDatabaseList()
      } catch (error) {
        console.warn('Failed to preload database list:', error)
        // 预加载失败不抛出错误，避免影响应用启动
      }
    }
  }

  /**
   * 获取缓存状态信息
   */
  const getCacheInfo = () => {
    return {
      isInitialized: isInitialized.value,
      itemCount: databaseList.value.length,
      lastFetchTime: lastFetchTime.value,
      isExpired: isCacheExpired.value,
      isLoading: loading.value,
      hasError: !!error.value,
      errorMessage: error.value
    }
  }

  return {
    // 响应式数据
    databaseList: computed(() => databaseList.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    isInitialized: computed(() => isInitialized.value),
    
    // 计算属性
    isCacheExpired,
    needsFetch,
    
    // 方法
    getDatabaseList,
    fetchDatabaseList,
    refreshDatabaseList,
    clearCache,
    preloadDatabaseList,
    getCacheInfo
  }
}