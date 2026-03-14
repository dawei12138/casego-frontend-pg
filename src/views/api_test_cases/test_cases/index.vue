<template>
  <div class="app-container" :class="{ 'dark': globalState.settings.theme === 'dark' }">
    <!-- 主要内容区域 -->
    <div class="app-content">
      <splitpanes
        class="default-theme"
        :dbl-click-splitter="false"
        resizerStyle="background-color: #e4e7ed; width: 4px;"
      >
        <!-- 左侧用例探索器 -->
        <pane :size="28" :min-size="20" :max-size="40">
          <CaseExplorer
            @case-select="handleCaseSelect"
            @case-create="handleCaseCreate"
            @case-delete="handleCaseDelete"
          />
        </pane>

        <!-- 右侧主工作区 -->
        <pane :size="72" :min-size="60" :max-size="80">
          <MainWorkspace ref="mainWorkspaceRef" />
        </pane>
      </splitpanes>
    </div>
  </div>
</template>

<script setup>
import { provide, computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import CaseExplorer from './components/CaseExplorer.vue'
import MainWorkspace from './components/MainWorkspace.vue'
import { useGlobalState } from './composables/useGlobalState'
import { useLayout } from './composables/useLayout'

// 全局状态管理
const globalState = useGlobalState()
const layoutState = useLayout()

// 主工作区引用
const mainWorkspaceRef = ref(null)

// 提供全局状态给子组件
provide('globalState', globalState)
provide('layoutState', layoutState)

// 事件处理
const handleCaseSelect = (caseData) => {
  console.log('Index.vue handleCaseSelect:', caseData)
  
  // 确保数据完整性
  const completeData = {
    caseId: caseData.caseId,
    name: caseData.name,
    method: caseData.method || 'GET',
    path: caseData.path || '',
    type: caseData.type || 'case',
    apiType: caseData.apiType,
    moduleId: caseData.moduleId,
    description: caseData.description || '',
    // 初始化空的配置数据
    paramsList: caseData.paramsList || [],
    headersList: caseData.headersList || [],
    cookiesList: caseData.cookiesList || [],
    jsonData: caseData.jsonData || '',
    formdata: caseData.formdata || [], // 修改为 formdata
    filePath: caseData.filePath || '',
    setupList: caseData.setupList || [],
    teardownList: caseData.teardownList || [],
    assertionList: caseData.assertionList || []
  }
  
  // 更新全局状态
  globalState.selectedCase.value = completeData
  
  // 发送事件给MainWorkspace
  globalState.eventBus.emit('case-select', completeData)
  console.log('Event emitted with data:', completeData)
}

const handleCaseCreate = (parentId, caseType) => {
  console.log('Index.vue handleCaseCreate:', parentId, caseType)
  globalState.eventBus.emit('case-create', { parentId, caseType })
}

const handleCaseDelete = (deletedId) => {
  console.log('Index.vue handleCaseDelete:', deletedId)
  
  // 通过事件总线通知主工作区关闭相关标签页
  globalState.eventBus.emit('case-delete', deletedId)
}

// 全局快捷键
const handleKeydown = (event) => {
  // Ctrl/Cmd + S 保存当前标签页
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    // 直接调用主工作区的保存方法
    if (mainWorkspaceRef.value && mainWorkspaceRef.value.saveCurrentTab) {
      mainWorkspaceRef.value.saveCurrentTab()
    } else {
      // 兜底方案：通过事件总线触发
      globalState.eventBus.emit('save-current-case')
    }
  }
  // Ctrl/Cmd + N 新建用例
  if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
    event.preventDefault()
    globalState.eventBus.emit('create-new-case')
  }
  // Ctrl/Cmd + W 关闭当前标签页
  if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
    event.preventDefault()
    globalState.eventBus.emit('close-current-tab')
  }
}

// 生命周期
onMounted(() => {
  console.log('Index.vue mounted, globalState:', globalState)
  
  // 监听键盘事件
  document.addEventListener('keydown', handleKeydown)
  
  // 初始化主题
  const savedTheme = localStorage.getItem('api-tester-theme')
  if (savedTheme) {
    globalState.settings.value.theme = savedTheme
  }
  
  // 初始化环境变量
  const savedEnv = localStorage.getItem('api-tester-environment')
  if (savedEnv) {
    globalState.environment.value.current = savedEnv
  }
  
  // 验证EventBus是否正常工作
  console.log('EventBus available:', !!globalState.eventBus)
  console.log('EventBus methods:', Object.keys(globalState.eventBus))
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
  transition: all 0.3s ease;
  overflow: hidden;
  padding: 0; /* 覆盖全局的 padding: 20px */
  flex: 1; /* 占满可用空间 */
}

.app-container.dark {
  --el-bg-color: #1a1a1a;
  --el-bg-color-page: #0d1117;
  --el-text-color-primary: #e6edf3;
  --el-text-color-regular: #c9d1d9;
  --el-border-color: #30363d;
}

.app-content {
  flex: 1;
  overflow: hidden;
  min-height: 0; /* 关键：确保 flex 子元素可以收缩 */
}

/* splitpanes 容器 */
:deep(.splitpanes) {
  height: 100%;
}

/* splitpanes 的 pane 面板 - 确保可以独立滚动 */
:deep(.splitpanes__pane) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

/* 分割线样式 */
:deep(.splitpanes--vertical > .splitpanes__splitter) {
  background-color: var(--el-border-color);
  border-left: 1px solid var(--el-border-color-darker);
  border-right: 1px solid var(--el-border-color-darker);
  width: 4px;
  cursor: col-resize;
  transition: background-color 0.3s ease;
}

:deep(.splitpanes--vertical > .splitpanes__splitter:hover) {
  background-color: var(--el-color-primary-light-7);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    height: 100%;
  }
}
</style>