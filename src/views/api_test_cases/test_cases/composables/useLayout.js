import { ref, reactive, computed, watch, nextTick } from 'vue'

/**
 * 布局管理组合式函数
 * 负责管理应用的布局状态，包括面板大小、响应式断点等
 */
export function useLayout() {
  // 创建单例模式的布局状态
  if (!window.__layoutState) {
    window.__layoutState = createLayoutState()
  }
  
  return window.__layoutState
}

function createLayoutState() {
  // 面板尺寸配置
  const panelSizes = reactive({
    // 左侧面板（用例树）
    leftPaneSize: 25,
    leftPaneMinSize: 15,
    leftPaneMaxSize: 40,
    
    // 右侧面板（主工作区）
    rightPaneSize: 75,
    rightPaneMinSize: 60,
    rightPaneMaxSize: 85,
    
    // 右侧工作区内部垂直分割
    requestSectionSize: 50,
    requestSectionMinSize: 30,
    requestSectionMaxSize: 70,
    
    responseSectionSize: 50,
    responseSectionMinSize: 30,
    responseSectionMaxSize: 70
  })

  // 视口信息
  const viewport = reactive({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: false,
    isTablet: false,
    isDesktop: true
  })

  // 响应式断点
  const breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200,
    large: 1600
  }

  // 布局状态
  const layoutState = reactive({
    // 侧边栏状态
    sidebarCollapsed: false,
    sidebarVisible: true,
    
    // 面板状态
    leftPanelVisible: true,
    rightPanelVisible: true,
    
    // 全屏状态
    isFullscreen: false,
    fullscreenElement: null,
    
    // 拖拽状态
    isDragging: false,
    dragType: null, // 'horizontal' | 'vertical'
    
    // 布局模式
    layoutMode: 'default', // 'default' | 'focus' | 'minimal'
    
    // 主题相关
    contentMaxWidth: null,
    headerHeight: 50,
    footerHeight: 0,
    
    // 动画状态
    animationsEnabled: true,
    transitionDuration: 300
  })

  // 保存的布局配置
  const savedLayouts = ref({
    default: null,
    mobile: null,
    tablet: null
  })

  // 计算属性
  const isMobile = computed(() => viewport.width < breakpoints.mobile)
  const isTablet = computed(() => viewport.width >= breakpoints.mobile && viewport.width < breakpoints.desktop)
  const isDesktop = computed(() => viewport.width >= breakpoints.desktop)
  const isLargeScreen = computed(() => viewport.width >= breakpoints.large)

  const currentBreakpoint = computed(() => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    if (isLargeScreen.value) return 'large'
    return 'desktop'
  })

  // 响应式面板尺寸
  const responsivePanelSizes = computed(() => {
    if (isMobile.value) {
      return {
        leftPaneSize: layoutState.sidebarCollapsed ? 0 : 100,
        rightPaneSize: layoutState.sidebarCollapsed ? 100 : 0
      }
    }
    
    if (isTablet.value) {
      return {
        leftPaneSize: layoutState.sidebarCollapsed ? 5 : 35,
        rightPaneSize: layoutState.sidebarCollapsed ? 95 : 65
      }
    }
    
    return {
      leftPaneSize: layoutState.sidebarCollapsed ? 5 : panelSizes.leftPaneSize,
      rightPaneSize: layoutState.sidebarCollapsed ? 95 : panelSizes.rightPaneSize
    }
  })

  const contentHeight = computed(() => {
    return viewport.height - layoutState.headerHeight - layoutState.footerHeight
  })

  // 方法
  const methods = {
    // 更新视口信息
    updateViewport() {
      viewport.width = window.innerWidth
      viewport.height = window.innerHeight
      viewport.isMobile = isMobile.value
      viewport.isTablet = isTablet.value
      viewport.isDesktop = isDesktop.value
    },

    // 面板尺寸管理
    updatePanelSize(panel, size) {
      if (panel === 'left') {
        panelSizes.leftPaneSize = Math.max(
          panelSizes.leftPaneMinSize,
          Math.min(panelSizes.leftPaneMaxSize, size)
        )
        panelSizes.rightPaneSize = 100 - panelSizes.leftPaneSize
      } else if (panel === 'request') {
        panelSizes.requestSectionSize = Math.max(
          panelSizes.requestSectionMinSize,
          Math.min(panelSizes.requestSectionMaxSize, size)
        )
        panelSizes.responseSectionSize = 100 - panelSizes.requestSectionSize
      }
      
      this.savePanelSizes()
    },

    // 重置面板尺寸
    resetPanelSizes() {
      panelSizes.leftPaneSize = 25
      panelSizes.rightPaneSize = 75
      panelSizes.requestSectionSize = 50
      panelSizes.responseSectionSize = 50
      this.savePanelSizes()
    },

    // 侧边栏控制
    toggleSidebar() {
      layoutState.sidebarCollapsed = !layoutState.sidebarCollapsed
      this.saveLayoutState()
    },

    collapseSidebar() {
      layoutState.sidebarCollapsed = true
      this.saveLayoutState()
    },

    expandSidebar() {
      layoutState.sidebarCollapsed = false
      this.saveLayoutState()
    },

    // 面板可见性控制
    togglePanel(panel) {
      if (panel === 'left') {
        layoutState.leftPanelVisible = !layoutState.leftPanelVisible
      } else if (panel === 'right') {
        layoutState.rightPanelVisible = !layoutState.rightPanelVisible
      }
      this.saveLayoutState()
    },

    // 全屏控制
    enterFullscreen(element = null) {
      layoutState.isFullscreen = true
      layoutState.fullscreenElement = element
      
      if (element && element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
          console.warn('Failed to enter fullscreen:', err)
        })
      }
    },

    exitFullscreen() {
      layoutState.isFullscreen = false
      layoutState.fullscreenElement = null
      
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.warn('Failed to exit fullscreen:', err)
        })
      }
    },

    toggleFullscreen(element = null) {
      if (layoutState.isFullscreen) {
        this.exitFullscreen()
      } else {
        this.enterFullscreen(element)
      }
    },

    // 布局模式管理
    setLayoutMode(mode) {
      const validModes = ['default', 'focus', 'minimal']
      if (validModes.includes(mode)) {
        layoutState.layoutMode = mode
        this.applyLayoutMode(mode)
        this.saveLayoutState()
      }
    },

    applyLayoutMode(mode) {
      switch (mode) {
        case 'focus':
          // 专注模式：隐藏干扰元素
          layoutState.sidebarCollapsed = true
          break
        case 'minimal':
          // 极简模式：最小化界面元素
          layoutState.sidebarCollapsed = true
          layoutState.headerHeight = 40
          break
        case 'default':
        default:
          // 默认模式：恢复所有元素
          layoutState.sidebarCollapsed = false
          layoutState.headerHeight = 50
          break
      }
    },

    // 拖拽状态管理
    startDrag(type = 'horizontal') {
      layoutState.isDragging = true
      layoutState.dragType = type
    },

    stopDrag() {
      layoutState.isDragging = false
      layoutState.dragType = null
    },

    // 动画控制
    disableAnimations() {
      layoutState.animationsEnabled = false
    },

    enableAnimations() {
      layoutState.animationsEnabled = true
    },

    // 响应式处理
    handleResize() {
      this.updateViewport()
      
      // 移动端自动折叠侧边栏
      if (isMobile.value && !layoutState.sidebarCollapsed) {
        layoutState.sidebarCollapsed = true
      }
      
      // 平板端调整面板比例
      if (isTablet.value) {
        if (panelSizes.leftPaneSize > 35) {
          panelSizes.leftPaneSize = 35
          panelSizes.rightPaneSize = 65
        }
      }
    },

    // 保存和加载布局状态
    saveLayoutState() {
      const stateToSave = {
        panelSizes: { ...panelSizes },
        layoutState: { ...layoutState },
        timestamp: Date.now()
      }
      
      try {
        localStorage.setItem('api-tester-layout', JSON.stringify(stateToSave))
      } catch (error) {
        console.warn('Failed to save layout state:', error)
      }
    },

    loadLayoutState() {
      try {
        const saved = localStorage.getItem('api-tester-layout')
        if (saved) {
          const parsed = JSON.parse(saved)
          
          if (parsed.panelSizes) {
            Object.assign(panelSizes, parsed.panelSizes)
          }
          
          if (parsed.layoutState) {
            // 只恢复部分状态，避免恢复临时状态
            const stateToRestore = {
              sidebarCollapsed: parsed.layoutState.sidebarCollapsed,
              leftPanelVisible: parsed.layoutState.leftPanelVisible,
              rightPanelVisible: parsed.layoutState.rightPanelVisible,
              layoutMode: parsed.layoutState.layoutMode,
              animationsEnabled: parsed.layoutState.animationsEnabled
            }
            Object.assign(layoutState, stateToRestore)
          }
        }
      } catch (error) {
        console.warn('Failed to load layout state:', error)
      }
    },

    savePanelSizes() {
      this.saveLayoutState()
    },

    // 保存当前布局为预设
    saveLayoutPreset(name) {
      savedLayouts.value[name] = {
        panelSizes: { ...panelSizes },
        layoutState: { ...layoutState },
        viewport: { ...viewport },
        timestamp: Date.now()
      }
      
      try {
        localStorage.setItem('api-tester-layout-presets', JSON.stringify(savedLayouts.value))
      } catch (error) {
        console.warn('Failed to save layout preset:', error)
      }
    },

    // 加载布局预设
    loadLayoutPreset(name) {
      const preset = savedLayouts.value[name]
      if (preset) {
        Object.assign(panelSizes, preset.panelSizes)
        Object.assign(layoutState, preset.layoutState)
        return true
      }
      return false
    },

    // 获取当前布局配置
    getCurrentLayout() {
      return {
        panelSizes: { ...panelSizes },
        layoutState: { ...layoutState },
        viewport: { ...viewport },
        breakpoint: currentBreakpoint.value
      }
    },

    // 重置布局
    resetLayout() {
      this.resetPanelSizes()
      Object.assign(layoutState, {
        sidebarCollapsed: false,
        sidebarVisible: true,
        leftPanelVisible: true,
        rightPanelVisible: true,
        isFullscreen: false,
        fullscreenElement: null,
        layoutMode: 'default',
        animationsEnabled: true
      })
      this.saveLayoutState()
    }
  }

  // 初始化
  methods.updateViewport()
  methods.loadLayoutState()

  // 监听窗口大小变化
  let resizeTimer = null
  const handleResize = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      methods.handleResize()
    }, 100)
  }

  window.addEventListener('resize', handleResize)

  // 监听全屏状态变化
  const handleFullscreenChange = () => {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    )
    
    if (!isCurrentlyFullscreen && layoutState.isFullscreen) {
      layoutState.isFullscreen = false
      layoutState.fullscreenElement = null
    }
  }

  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)

  // 监听面板尺寸变化，自动保存
  watch(panelSizes, () => {
    methods.savePanelSizes()
  }, { deep: true })

  // 返回布局状态对象
  return {
    // 响应式数据
    panelSizes,
    viewport,
    layoutState,
    savedLayouts,
    
    // 计算属性
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    currentBreakpoint,
    responsivePanelSizes,
    contentHeight,
    
    // 方法
    ...methods,
    
    // 便捷访问
    leftPaneSize: computed(() => responsivePanelSizes.value.leftPaneSize),
    rightPaneSize: computed(() => responsivePanelSizes.value.rightPaneSize),
    requestSectionSize: computed(() => panelSizes.requestSectionSize),
    responseSectionSize: computed(() => panelSizes.responseSectionSize)
  }
}