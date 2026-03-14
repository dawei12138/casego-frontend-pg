import { ref, reactive } from 'vue'

// 简单的事件总线实现
class EventBus {
  constructor() {
    this.events = {}
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  off(event, callback) {
    if (!this.events[event]) return
    
    const index = this.events[event].indexOf(callback)
    if (index > -1) {
      this.events[event].splice(index, 1)
    }
  }

  emit(event, ...args) {
    if (!this.events[event]) return
    
    this.events[event].forEach(callback => {
      try {
        callback(...args)
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error)
      }
    })
  }

  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }

  clear(event) {
    if (event) {
      delete this.events[event]
    } else {
      this.events = {}
    }
  }
}

// 全局状态管理
export function useGlobalState() {
  // 创建单例模式的全局状态
  if (!window.__globalState) {
    window.__globalState = createGlobalState()
  }
  
  return window.__globalState
}

function createGlobalState() {
  // 事件总线
  const eventBus = new EventBus()

  // 环境配置
  const environment = ref({
    current: 'dev',
    variables: {
      dev: {
        baseUrl: 'https://dev-api.example.com',
        timeout: 5000,
        token: ''
      },
      test: {
        baseUrl: 'https://test-api.example.com',
        timeout: 8000,
        token: ''
      },
      prod: {
        baseUrl: 'https://api.example.com',
        timeout: 10000,
        token: ''
      }
    }
  })

  // 应用设置
  const settings = ref({
    theme: 'light',
    autoSave: true,
    autoSaveInterval: 30000, // 30秒
    requestTimeout: 30000,   // 30秒
    maxTabs: 10,
    showResponseTime: true,
    showStatusCode: true,
    enableCodeFolding: true,
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true,
    autoFormat: true,
    validateJson: true,
    language: 'zh-CN',
    // 新增：缓存相关设置
    enableDataCache: true,
    cacheExpiration: 5 * 60 * 1000, // 5分钟
    preloadData: true // 是否在应用启动时预加载数据
  })

  // 标签页管理
  const tabs = ref([])
  const activeTabId = ref('')

  // 用例数据
  const caseTree = ref([])
  const selectedCase = ref(null)

  // 请求历史记录
  const requestHistory = ref([])

  // 全局加载状态
  const loading = reactive({
    savingCase: false,
    loadingCase: false,
    sendingRequest: false,
    importingCases: false,
    exportingCases: false,
    // 新增：数据预加载状态
    preloadingData: false,
    loadingDatabases: false
  })

  // 全局错误状态
  const errors = ref([])

  // 用户信息
  const user = ref({
    id: null,
    name: '',
    email: '',
    avatar: '',
    permissions: []
  })

  // 工作区状态
  const workspace = reactive({
    currentProject: null,
    recentProjects: [],
    collections: [],
    sharedCollections: []
  })

  // 新增：全局缓存状态
  const cache = reactive({
    databases: {
      data: [],
      lastFetch: null,
      isLoaded: false,
      error: null
    },
    environments: {
      data: [],
      lastFetch: null,
      isLoaded: false,
      error: null
    }
  })

  // 辅助方法
  const methods = {
    // 环境管理
    getCurrentEnvironment() {
      return environment.value.variables[environment.value.current] || {}
    },

    setEnvironmentVariable(key, value, env = null) {
      const targetEnv = env || environment.value.current
      if (!environment.value.variables[targetEnv]) {
        environment.value.variables[targetEnv] = {}
      }
      environment.value.variables[targetEnv][key] = value
      
      // 触发环境变量更新事件
      eventBus.emit('environment-updated', {
        environment: targetEnv,
        key,
        value
      })
    },

    getEnvironmentVariable(key, env = null) {
      const targetEnv = env || environment.value.current
      return environment.value.variables[targetEnv]?.[key]
    },

    // 标签页管理
    addTab(tab) {
      // 检查标签页数量限制
      if (tabs.value.length >= settings.value.maxTabs) {
        console.warn('达到最大标签页数量限制')
        return false
      }

      tabs.value.push(tab)
      activeTabId.value = tab.id
      eventBus.emit('tab-added', tab)
      return true
    },

    removeTab(tabId) {
      const index = tabs.value.findIndex(tab => tab.id === tabId)
      if (index > -1) {
        const removedTab = tabs.value.splice(index, 1)[0]
        
        // 如果移除的是当前激活标签页，需要切换到其他标签页
        if (activeTabId.value === tabId) {
          if (tabs.value.length > 0) {
            const newActiveIndex = Math.min(index, tabs.value.length - 1)
            activeTabId.value = tabs.value[newActiveIndex].id
          } else {
            activeTabId.value = ''
          }
        }
        
        eventBus.emit('tab-removed', removedTab)
        return removedTab
      }
      return null
    },

    findTab(tabId) {
      return tabs.value.find(tab => tab.id === tabId)
    },

    updateTab(tabId, updates) {
      const tab = this.findTab(tabId)
      if (tab) {
        Object.assign(tab, updates)
        eventBus.emit('tab-updated', { tabId, updates })
        return tab
      }
      return null
    },

    // 设置管理
    updateSettings(newSettings) {
      Object.assign(settings.value, newSettings)
      localStorage.setItem('api-tester-settings', JSON.stringify(settings.value))
      eventBus.emit('settings-updated', settings.value)
    },

    loadSettings() {
      try {
        const savedSettings = localStorage.getItem('api-tester-settings')
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          Object.assign(settings.value, parsed)
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    },

    // 新增：数据预加载管理
    async preloadApplicationData() {
      if (!settings.value.preloadData || loading.preloadingData) {
        return
      }

      console.log('开始预加载应用数据...')
      loading.preloadingData = true

      try {
        // 并发预加载多个数据源
        const preloadTasks = []

        // 预加载数据库列表
        if (settings.value.enableDataCache) {
          preloadTasks.push(this.preloadDatabases())
        }

        // 可以在这里添加更多预加载任务
        // preloadTasks.push(this.preloadEnvironments())
        // preloadTasks.push(this.preloadProjects())

        // 等待所有预加载任务完成
        const results = await Promise.allSettled(preloadTasks)
        
        // 记录预加载结果
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.warn(`预加载任务 ${index} 失败:`, result.reason)
          }
        })

        console.log('应用数据预加载完成')
        eventBus.emit('data-preload-completed', results)

      } catch (error) {
        console.error('数据预加载失败:', error)
        this.addError({ 
          message: '数据预加载失败', 
          type: 'warning',
          details: error.message 
        })
      } finally {
        loading.preloadingData = false
      }
    },

    async preloadDatabases() {
      console.log('预加载数据库列表...')
      
      try {
        // 动态导入数据库缓存模块，避免循环依赖
        const { useDatabaseList } = await import('./useDatabaseList')
        const { preloadDatabaseList } = useDatabaseList()
        
        await preloadDatabaseList()
        cache.databases.isLoaded = true
        console.log('数据库列表预加载成功')
        
      } catch (error) {
        console.error('预加载数据库列表失败:', error)
        cache.databases.error = error.message
        throw error
      }
    },

    // 缓存管理
    clearAllCache() {
      // 清理数据库缓存
      if (window.__globalState?.methods?.clearDatabaseCache) {
        window.__globalState.methods.clearDatabaseCache()
      }
      
      // 重置本地缓存状态
      cache.databases = {
        data: [],
        lastFetch: null,
        isLoaded: false,
        error: null
      }
      
      cache.environments = {
        data: [],
        lastFetch: null,
        isLoaded: false,
        error: null
      }
      
      console.log('所有缓存已清理')
      eventBus.emit('cache-cleared')
    },

    getCacheStatus() {
      return {
        databases: {
          isLoaded: cache.databases.isLoaded,
          itemCount: cache.databases.data.length,
          lastFetch: cache.databases.lastFetch,
          hasError: !!cache.databases.error
        },
        environments: {
          isLoaded: cache.environments.isLoaded,
          itemCount: cache.environments.data.length,
          lastFetch: cache.environments.lastFetch,
          hasError: !!cache.environments.error
        }
      }
    },

    // 错误处理
    addError(error) {
      const errorObj = {
        id: Date.now(),
        message: error.message || error,
        type: error.type || 'error',
        timestamp: new Date(),
        stack: error.stack,
        details: error.details || null
      }
      errors.value.push(errorObj)
      eventBus.emit('error-added', errorObj)
      
      // 自动清理旧错误（保留最近100个）
      if (errors.value.length > 100) {
        errors.value.splice(0, errors.value.length - 100)
      }
    },

    clearErrors() {
      errors.value.splice(0)
      eventBus.emit('errors-cleared')
    },

    removeError(errorId) {
      const index = errors.value.findIndex(error => error.id === errorId)
      if (index > -1) {
        const removedError = errors.value.splice(index, 1)[0]
        eventBus.emit('error-removed', removedError)
        return removedError
      }
      return null
    },

    // 请求历史管理
    addToHistory(requestData, response) {
      const historyItem = {
        id: Date.now(),
        timestamp: new Date(),
        request: { ...requestData },
        response: response ? { ...response } : null,
        status: response?.status || 'pending',
        duration: response?.duration || 0
      }

      requestHistory.value.unshift(historyItem)
      
      // 限制历史记录数量（保留最近1000条）
      if (requestHistory.value.length > 1000) {
        requestHistory.value.splice(1000)
      }

      eventBus.emit('history-added', historyItem)
      return historyItem
    },

    clearHistory() {
      requestHistory.value.splice(0)
      eventBus.emit('history-cleared')
    },

    // 数据持久化
    saveToLocalStorage() {
      try {
        const dataToSave = {
          environment: environment.value,
          settings: settings.value,
          caseTree: caseTree.value,
          requestHistory: requestHistory.value.slice(0, 100), // 只保存最近100条历史
          user: user.value,
          workspace: workspace,
          cache: {
            // 只保存缓存的元数据，不保存实际数据
            databases: {
              lastFetch: cache.databases.lastFetch,
              isLoaded: cache.databases.isLoaded
            },
            environments: {
              lastFetch: cache.environments.lastFetch,
              isLoaded: cache.environments.isLoaded
            }
          }
        }
        
        localStorage.setItem('api-tester-data', JSON.stringify(dataToSave))
        eventBus.emit('data-saved')
      } catch (error) {
        console.error('Failed to save data to localStorage:', error)
        this.addError({ message: '保存数据失败', type: 'warning' })
      }
    },

    loadFromLocalStorage() {
      try {
        const savedData = localStorage.getItem('api-tester-data')
        if (savedData) {
          const parsed = JSON.parse(savedData)
          
          if (parsed.environment) {
            Object.assign(environment.value, parsed.environment)
          }
          if (parsed.settings) {
            Object.assign(settings.value, parsed.settings)
          }
          if (parsed.caseTree) {
            caseTree.value = parsed.caseTree
          }
          if (parsed.requestHistory) {
            requestHistory.value = parsed.requestHistory
          }
          if (parsed.user) {
            Object.assign(user.value, parsed.user)
          }
          if (parsed.workspace) {
            Object.assign(workspace, parsed.workspace)
          }
          if (parsed.cache) {
            // 恢复缓存元数据
            if (parsed.cache.databases) {
              Object.assign(cache.databases, parsed.cache.databases)
            }
            if (parsed.cache.environments) {
              Object.assign(cache.environments, parsed.cache.environments)
            }
          }
          
          eventBus.emit('data-loaded')
        }
      } catch (error) {
        console.error('Failed to load data from localStorage:', error)
        this.addError({ message: '加载数据失败', type: 'warning' })
      }
    },

    // 重置所有数据
    reset() {
      tabs.value.splice(0)
      activeTabId.value = ''
      caseTree.value.splice(0)
      selectedCase.value = null
      requestHistory.value.splice(0)
      errors.value.splice(0)
      
      // 重置环境和设置到默认值
      environment.value.current = 'dev'
      Object.assign(settings.value, {
        theme: 'light',
        autoSave: true,
        autoSaveInterval: 30000,
        requestTimeout: 30000,
        maxTabs: 10,
        enableDataCache: true,
        preloadData: true
      })

      // 清理所有缓存
      this.clearAllCache()
      
      eventBus.emit('data-reset')
    }
  }

  // 初始化时加载数据
  methods.loadSettings()
  methods.loadFromLocalStorage()

  // 如果启用了预加载，延迟执行预加载
  if (settings.value.preloadData) {
    // 使用 setTimeout 确保在组件挂载后执行
    setTimeout(() => {
      methods.preloadApplicationData().catch(error => {
        console.warn('Background preload failed:', error)
      })
    }, 1000) // 延迟1秒执行，确保应用基础加载完成
  }

  // 返回全局状态对象
  return {
    // 响应式数据
    eventBus,
    environment,
    settings,
    tabs,
    activeTabId,
    caseTree,
    selectedCase,
    requestHistory,
    loading,
    errors,
    user,
    workspace,
    cache, // 新增缓存状态
    
    // 方法
    ...methods
  }
}