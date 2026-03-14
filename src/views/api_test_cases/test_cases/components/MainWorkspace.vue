<template>
  <div class="main-workspace">
    <!-- 标签页管理器 -->
    <div class="tabs-container" v-if="tabs.length > 0">
      <!-- 标签页头部 - 标签导航 + 环境选择器在同一行 -->
      <div class="tabs-header-row">
        <el-tabs
          v-model="activeTabId"
          type="card"
          closable
          @tab-remove="handleTabRemove"
          @tab-click="handleTabClick"
          class="workspace-tabs"
        >
          <el-tab-pane
            v-for="tab in tabs"
            :key="tab.id"
            :label="tab.name"
            :name="tab.id"
            :closable="tab.closable !== false"
          >
            <template #label>
              <div class="tab-label">
                <span class="method-badge" :class="tab.method?.toLowerCase()" v-if="tab.method">
                  {{ tab.method }}
                </span>
                <span class="tab-name" :title="tab.name">{{ tab.name }}</span>
                <el-icon
                  v-if="tab.modified"
                  class="modified-indicator"
                  :style="{ color: 'var(--el-color-warning)' }"
                >
                  <WarningFilled />
                </el-icon>
              </div>
            </template>
          </el-tab-pane>
        </el-tabs>

        <!-- 环境控制栏 - 固定在右侧 -->
        <div class="environment-controls">
          <el-select
            v-model="selectedEnvironmentId"
            placeholder="选择环境"
            size="small"
            style="width: 120px;"
            :loading="environmentsLoading"
            @change="handleEnvironmentChange"
          >
            <el-option
              v-for="env in environmentsList"
              :key="env.id"
              :label="env.name"
              :value="env.id"
            />
          </el-select>

          <el-button
            size="small"
            @click="showEnvironmentConfig = true"
          >
            <el-icon><Operation /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 标签页内容区域 -->
      <div class="tabs-content-area">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          v-show="tab.id === activeTabId"
          class="tab-content-panel"
        >
          <CaseEditor
            :case-data="tab.data"
            :tab-id="tab.id"
            :env-id="selectedEnvironmentId"
            @case-save="handleCaseSave"
            @case-send="handleCaseSend"
            @case-reload-needed="handleCaseReloadNeeded"
          />
        </div>
      </div>
    </div>

    <!-- 空状态 - 也显示环境选择器 -->
    <div class="empty-state" v-else>
      <div class="empty-header">
        <div class="environment-controls">
          <el-select
            v-model="selectedEnvironmentId"
            placeholder="选择环境"
            size="small"
            style="width: 120px;"
            :loading="environmentsLoading"
            @change="handleEnvironmentChange"
          >
            <el-option
              v-for="env in environmentsList"
              :key="env.id"
              :label="env.name"
              :value="env.id"
            />
          </el-select>

          <el-button
            size="small"
            @click="showEnvironmentConfig = true"
          >
            <el-icon><Operation /></el-icon>
          </el-button>
        </div>
      </div>
      <div class="empty-content">
        <el-icon class="empty-icon">
          <Document />
        </el-icon>
        <h3 class="empty-title">欢迎使用 CASEGO</h3>
        <p class="empty-description">
          选择一个接口开始测试，或者创建新的接口
        </p>
        
        <div class="empty-actions">
          <el-button type="primary" @click="handleCreateNewCase" :loading="createCaseLoading">
            <el-icon v-if="!createCaseLoading"><Plus /></el-icon>
            {{ createCaseLoading ? '创建中...' : '创建新用例' }}
          </el-button>
          <el-button @click="handleImportCase">
            <el-icon><Upload /></el-icon>
            导入用例
          </el-button>
        </div>
      </div>
    </div>

    <!-- 环境配置弹窗 -->
    <EnvironmentConfigDialog
      v-model="showEnvironmentConfig"
      :current-environment-id="selectedEnvironmentId"
      @save="handleEnvironmentSave"
    />
    <!-- 右键菜单 -->
    <el-dropdown
      ref="tabContextMenuRef"
      trigger="contextmenu"
      :teleported="false"
      @command="handleTabContextMenu"
    >
      <span></span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="save">
            <el-icon><DocumentChecked /></el-icon>
            保存
          </el-dropdown-item>
          <el-dropdown-item command="save-as">
            <el-icon><DocumentCopy /></el-icon>
            另存为
          </el-dropdown-item>
          <el-dropdown-item divided command="duplicate">
            <el-icon><CopyDocument /></el-icon>
            复制标签页
          </el-dropdown-item>
          <el-dropdown-item command="close">
            <el-icon><Close /></el-icon>
            关闭
          </el-dropdown-item>
          <el-dropdown-item command="close-others">
            <el-icon><CloseBold /></el-icon>
            关闭其他
          </el-dropdown-item>
          <el-dropdown-item command="close-all">
            <el-icon><CircleClose /></el-icon>
            关闭所有
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, watch, nextTick, reactive, toRefs } from 'vue'
import { 
  Document, 
  Plus, 
  Upload, 
  WarningFilled,
  DocumentChecked,
  DocumentCopy,
  Close,
  CloseBold,
  CircleClose,
  Operation
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 引入组件
import CaseEditor from './CaseEditor.vue'
import EnvironmentConfigDialog from './EnvironmentConfigDialog.vue'

// 引入API接口
import { listEnvironments, addTestCase, getTestCase } from '../composables/caseService'

// 注入全局状态
const globalState = inject('globalState')

// 标签页数据
const tabs = ref([])
const activeTabId = ref('')
const tabContextMenuRef = ref()
const contextTabId = ref('')
const showEnvironmentConfig = ref(false)

// 环境相关数据
const environmentsLoading = ref(false)
const environmentsList = ref([])
const selectedEnvironmentId = ref(null)

// 创建用例的loading状态
const createCaseLoading = ref(false)

// 初始化查询参数
const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 999,
    name: null,
    projectId: null,
    createTime: null,
  }
})

const { queryParams } = toRefs(data)

// 计算属性
const currentTab = computed(() => {
  return tabs.value.find(tab => tab.id === activeTabId.value)
})

// 加载环境列表
const loadEnvironments = async () => {
  environmentsLoading.value = true
  try {
    const response = await listEnvironments(queryParams.value)
    
    if (response && response.code === 200) {
      environmentsList.value = response.rows || []
      
      // 查找默认环境并设置为选中状态
      const defaultEnv = environmentsList.value.find(env => env.isDefault === 1)
      if (defaultEnv) {
        selectedEnvironmentId.value = defaultEnv.id
        console.log('默认环境已选中:', defaultEnv.name, '(ID:', defaultEnv.id, ')')
      } else if (environmentsList.value.length > 0) {
        // 如果没有默认环境，选中第一个
        selectedEnvironmentId.value = environmentsList.value[0].id
        console.log('未找到默认环境，选中第一个环境:', environmentsList.value[0].name)
      }
    } else {
      throw new Error(response?.msg || '加载环境列表失败')
    }
  } catch (error) {
    console.error('加载环境列表失败:', error)
    ElMessage.error(`加载环境列表失败: ${error.message}`)
  } finally {
    environmentsLoading.value = false
  }
}

// 标签页管理方法
const createTab = (caseData) => {
  console.log('Creating tab with case data:', caseData)
  
  const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const newTab = {
    id: tabId,
    name: caseData.name || '新建用例',
    method: caseData.method || 'GET',
    data: { ...caseData },
    modified: false,
    closable: true,
    createTime: new Date()
  }
  
  // 检查是否已经打开了相同的用例
  const existingTab = tabs.value.find(tab => 
    tab.data.caseId === caseData.caseId && caseData.caseId
  )
  
  if (existingTab) {
    // 如果已经打开，就激活该标签页
    activeTabId.value = existingTab.id
    console.log('Tab already exists, activating:', existingTab.id)
    return existingTab
  }
  
  // 添加新标签页
  tabs.value.push(newTab)
  activeTabId.value = tabId
  
  console.log('New tab created:', newTab)
  console.log('Current tabs:', tabs.value)
  
  // 更新全局状态
  syncTabsToGlobalState()
  
  return newTab
}

const closeTab = (tabId) => {
  const tabIndex = tabs.value.findIndex(tab => tab.id === tabId)
  if (tabIndex === -1) return
  
  const tab = tabs.value[tabIndex]
  
  // 如果有未保存的修改，询问用户
  if (tab.modified) {
    return ElMessageBox.confirm(
      `用例 "${tab.name}" 有未保存的修改，确定要关闭吗？`,
      '确认关闭',
      {
        confirmButtonText: '关闭',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      doCloseTab(tabId)
    }).catch(() => {
      // 用户取消关闭
    })
  } else {
    doCloseTab(tabId)
  }
}

const doCloseTab = (tabId) => {
  const tabIndex = tabs.value.findIndex(tab => tab.id === tabId)
  if (tabIndex === -1) return
  
  // 删除标签页
  tabs.value.splice(tabIndex, 1)
  
  // 如果关闭的是当前激活的标签页，需要激活其他标签页
  if (activeTabId.value === tabId) {
    if (tabs.value.length > 0) {
      // 激活相邻的标签页
      const newActiveIndex = Math.min(tabIndex, tabs.value.length - 1)
      activeTabId.value = tabs.value[newActiveIndex].id
    } else {
      activeTabId.value = ''
    }
  }
  
  syncTabsToGlobalState()
}

// 根据用例/模块ID关闭相关的标签页
const closeTabsByCaseOrModuleId = (deletedId) => {
  console.log('关闭删除项相关的标签页:', deletedId)
  
  // 查找需要关闭的标签页
  const tabsToClose = tabs.value.filter(tab => {
    // 如果是用例节点被删除，关闭对应的标签页
    if (tab.data.caseId && deletedId === `case_${tab.data.caseId}`) {
      return true
    }
    
    // 如果是模块节点被删除，关闭该模块下所有用例的标签页
    if (tab.data.moduleId && deletedId === `module_${tab.data.moduleId}`) {
      return true
    }
    
    return false
  })
  
  console.log('找到需要关闭的标签页:', tabsToClose)
  
  // 逐个关闭标签页
  tabsToClose.forEach(tab => {
    console.log(`关闭标签页: ${tab.name} (ID: ${tab.id})`)
    doCloseTab(tab.id)
  })
  
  if (tabsToClose.length > 0) {
    ElMessage.info(`已关闭 ${tabsToClose.length} 个相关标签页`)
  }
}

// 更新标签页数据
const updateTabData = (tabId, newData) => {
  console.log('Updating tab data for:', tabId, newData)
  
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab) {
    // 更新标签页数据
    tab.data = { ...tab.data, ...newData }
    
    // 更新标签页标题和方法
    if (newData.name) {
      tab.name = newData.name
    }
    if (newData.method) {
      tab.method = newData.method
    }
    
    // 重置修改状态，因为已经保存成功
    tab.modified = false
    
    console.log('Tab data updated:', tab)
    syncTabsToGlobalState()
  }
}

const saveTab = async (tabId) => {
  const tab = tabs.value.find(t => t.id === tabId)
  if (!tab) return
  
  try {
    // 这里应该调用实际的保存API
    await new Promise(resolve => setTimeout(resolve, 500)) // 模拟保存
    
    tab.modified = false
    ElMessage.success(`用例 "${tab.name}" 保存成功`)
  } catch (error) {
    ElMessage.error(`保存失败: ${error.message}`)
  }
}

const saveCurrentTab = async () => {
  if (!activeTabId.value) {
    console.log('No active tab to save')
    return
  }
  
  console.log('MainWorkspace: saveCurrentTab called for tabId:', activeTabId.value)
  
  // 直接通过事件总线触发统一保存逻辑
  // 这样确保所有保存操作都走相同的代码路径
  globalState.eventBus.emit('trigger-save-current-tab', activeTabId.value)
}

const duplicateTab = (tabId) => {
  const tab = tabs.value.find(t => t.id === tabId)
  if (!tab) return
  
  const duplicatedData = {
    ...tab.data,
    caseId: undefined, // 清除ID，作为新用例
    name: `${tab.data.name} - 副本`
  }
  
  createTab(duplicatedData)
}

// 同步标签页状态到全局状态
const syncTabsToGlobalState = () => {
  if (globalState && globalState.tabs) {
    globalState.tabs.value = tabs.value
    globalState.activeTabId.value = activeTabId.value
  }
}

// 事件处理
const handleTabRemove = (tabId) => {
  closeTab(tabId)
}

const handleTabClick = (tab) => {
  activeTabId.value = tab.props.name
}

const handleCaseSave = (tabId) => {
  console.log('Saving case for tab:', tabId)
  // 保存成功后标签页的修改状态会在handleCaseReloadNeeded中处理
}

const handleCaseSend = (tabId, requestData) => {
  console.log('Sending request for tab:', tabId, requestData)
  // 处理发送请求的结果
}

// 处理用例重新加载需求
const handleCaseReloadNeeded = ({ tabId, caseId, updatedData }) => {
  console.log('Case reload needed for tab:', tabId, 'caseId:', caseId, 'updatedData:', updatedData)
  
  // 更新标签页数据
  if (updatedData) {
    updateTabData(tabId, updatedData)
  }
  
  // 通知用户保存成功并已重新加载
  console.log('Tab data reloaded successfully after save')
}

// 修改后的创建新用例方法 - 和左侧用例树的逻辑一致
const handleCreateNewCase = async () => {
  if (createCaseLoading.value) return
  
  createCaseLoading.value = true
  
  try {
    // 弹出输入框让用户输入用例名称
    const { value: caseName } = await ElMessageBox.prompt(
      '请输入用例名称',
      '新建用例',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '用例名称不能为空'
      }
    )
    
    // 构造用例数据
    const caseData = {
      name: caseName,
      method: 'GET',
      moduleId: null, // 根级用例
      caseType: "1",
      projectId: globalState.workspace.currentProject?.id
    }
    
    console.log('创建用例请求数据:', caseData)
    
    // 调用API创建用例
    const response = await addTestCase(caseData)
    console.log('创建用例响应:', response)
    
    if (response && response.code === 200) {
      ElMessage.success('创建用例成功')
      
      // 获取返回的用例ID
      const newCaseId = response.caseId
      if (newCaseId) {
        console.log('自动打开新建用例，caseId:', newCaseId)
        
        // 获取用例详情
        try {
          const caseDetailResponse = await getTestCase(newCaseId)
          if (caseDetailResponse && caseDetailResponse.code === 200) {
            const caseDetail = caseDetailResponse.data
            
            // 构造完整的用例数据并创建标签页
            const completeData = {
              ...caseDetail,
              id: `case_${newCaseId}`,
              type: 'case',
              apiType: 'case'
            }
            
            console.log('创建标签页并打开新用例:', completeData)
            createTab(completeData)
          }
        } catch (detailError) {
          console.error('获取新建用例详情失败:', detailError)
          ElMessage.warning('用例创建成功，但无法自动打开')
        }
      }
    } else {
      throw new Error(response?.msg || '创建用例失败')
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建用例失败:', error)
      ElMessage.error(`创建用例失败: ${error.message}`)
    }
  } finally {
    createCaseLoading.value = false
  }
}

const handleImportCase = () => {
  // 触发导入用例事件，让 CaseExplorer 打开导入对话框
  if (globalState && globalState.eventBus) {
    globalState.eventBus.emit('open-import-dialog')
  }
}

// 环境变化处理
const handleEnvironmentChange = (newEnvId) => {
  console.log('环境变更:', newEnvId)
  
  // 查找对应的环境名称
  const selectedEnv = environmentsList.value.find(env => env.id === newEnvId)
  if (selectedEnv) {
    console.log('选中环境:', selectedEnv.name, '(ID:', selectedEnv.id, ')')
    
    // 保存环境变化到localStorage
    localStorage.setItem('api-tester-environment-id', newEnvId)
    
    // 可以触发全局事件通知其他组件
    if (globalState && globalState.eventBus) {
      globalState.eventBus.emit('environment-changed', {
        id: newEnvId,
        name: selectedEnv.name,
        environment: selectedEnv
      })
    }
    
    ElMessage.success(`已切换到环境: ${selectedEnv.name}`)
  }
}

// 正确的版本 - 替换上面的函数
const handleEnvironmentSave = async (environmentConfig) => {
  console.log('Environment config saved:', environmentConfig)

  try {
    // 保存当前保存的环境ID
    const savedEnvironmentId = environmentConfig.id

    // 更新全局状态中的当前环境配置
    if (globalState && globalState.environment) {
      const envId = environmentConfig.id
      const envName = environmentConfig.name || `env_${envId}`

      // 确保 environment.value.variables 存在
      if (!globalState.environment.value.variables) {
        globalState.environment.value.variables = {}
      }

      // 更新对应环境的配置
      globalState.environment.value.variables[envName] = {
        id: envId,
        name: environmentConfig.name,
        baseUrl: environmentConfig.baseUrl,
        timeout: environmentConfig.timeout,
        description: environmentConfig.description,
        variables: environmentConfig.variables || [],
        headers: environmentConfig.headers || []
      }

      console.log('Updated global environment state for env:', envName)
    }

    // 触发全局事件通知其他组件环境配置已更新
    if (globalState && globalState.eventBus) {
      globalState.eventBus.emit('environment-config-updated', {
        environmentId: environmentConfig.id,
        config: environmentConfig
      })
    }

    // 重新加载环境列表
    await loadEnvironments()

    // 将环境选择器更新为刚保存的环境
    selectedEnvironmentId.value = savedEnvironmentId
    console.log('环境选择器已更新为保存的环境:', savedEnvironmentId)

    // 保存到localStorage
    localStorage.setItem('api-tester-environment-id', savedEnvironmentId)

    // 查找对应的环境名称
    const selectedEnv = environmentsList.value.find(env => env.id === savedEnvironmentId)
    if (selectedEnv) {
      // 触发环境变化事件
      if (globalState && globalState.eventBus) {
        globalState.eventBus.emit('environment-changed', {
          id: savedEnvironmentId,
          name: selectedEnv.name,
          environment: selectedEnv
        })
      }
    }

    ElMessage.success('环境配置已保存')

  } catch (error) {
    console.error('Failed to handle environment save:', error)
    ElMessage.error('保存环境配置时发生错误')
  }
}
// 右键菜单处理
const handleTabContextMenu = (command) => {
  const tabId = contextTabId.value
  if (!tabId) return
  
  switch (command) {
    case 'save':
      saveTab(tabId)
      break
    case 'save-as':
      ElMessage.info('另存为功能开发中...')
      break
    case 'duplicate':
      duplicateTab(tabId)
      break
    case 'close':
      closeTab(tabId)
      break
    case 'close-others':
      const otherTabs = tabs.value.filter(tab => tab.id !== tabId)
      otherTabs.forEach(tab => closeTab(tab.id))
      break
    case 'close-all':
      const allTabs = [...tabs.value]
      allTabs.forEach(tab => closeTab(tab.id))
      break
  }
}

// 监听全局事件
onMounted(async () => {
  console.log('MainWorkspace mounted, globalState:', globalState)
  
  // 首先加载环境列表
  await loadEnvironments()
  
  // 尝试从localStorage恢复上次选择的环境
  const savedEnvId = localStorage.getItem('api-tester-environment-id')
  if (savedEnvId && environmentsList.value.find(env => env.id == savedEnvId)) {
    selectedEnvironmentId.value = parseInt(savedEnvId)
    console.log('从localStorage恢复环境选择:', savedEnvId)
  }
  
  // 监听用例选择事件
  if (globalState && globalState.eventBus) {
    globalState.eventBus.on('case-select', (caseData) => {
      console.log('Received case-select event:', caseData)
      createTab(caseData)
    })
    
    // 监听删除事件 - 关闭相关的标签页
    globalState.eventBus.on('case-delete', (deletedId) => {
      console.log('Received case-delete event:', deletedId)
      closeTabsByCaseOrModuleId(deletedId)
    })
    
    // 监听保存当前用例事件
    globalState.eventBus.on('save-current-case', () => {
      if (activeTabId.value) {
        saveTab(activeTabId.value)
      }
    })
    
    // 监听关闭当前标签页事件
    globalState.eventBus.on('close-current-tab', () => {
      if (activeTabId.value) {
        closeTab(activeTabId.value)
      }
    })
    
    // 监听创建新用例事件
    globalState.eventBus.on('create-new-case', () => {
      handleCreateNewCase()
    })
  } else {
    console.error('GlobalState or eventBus not available')
  }
})

// 监听标签页变化，同步到全局状态
watch([tabs, activeTabId], () => {
  syncTabsToGlobalState()
}, { deep: true })

// 为标签页添加右键菜单支持
const setupTabContextMenu = () => {
  nextTick(() => {
    const tabElements = document.querySelectorAll('.el-tabs__item')
    tabElements.forEach(tabEl => {
      tabEl.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        const tabId = tabEl.getAttribute('aria-controls')?.replace('pane-', '')
        if (tabId) {
          contextTabId.value = tabId
        }
      })
    })
  })
}

// 监听标签页DOM变化
watch(tabs, () => {
  setupTabContextMenu()
}, { flush: 'post' })

// 暴露方法给父组件
defineExpose({
  saveCurrentTab
})
</script>

<style scoped>
.main-workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  min-height: 0; /* 确保 flex 容器可以正确收缩 */
  overflow: hidden; /* 防止整体溢出 */
  flex: 1; /* 占满可用空间 */
}

.tabs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0; /* 确保在 flex 容器中可以正确收缩 */
}

.tabs-header-row {
  display: flex;
  align-items: center;
  background-color: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color);
  flex-shrink: 0;
  height: 40px;
}

.workspace-tabs {
  flex: 1;
  min-width: 0; /* 防止溢出 */
  overflow: hidden;
}

.environment-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  flex-shrink: 0; /* 固定宽度，不收缩 */
  border-left: 1px solid var(--el-border-color-lighter);
  height: 100%;
}

.tabs-content-area {
  flex: 1;
  overflow: auto; /* 允许内容区域滚动 */
  min-height: 0; /* 确保在 flex 容器中可以正确滚动 */
}

.tab-content-panel {
  height: 100%;
  min-height: 0; /* 确保在 flex 容器中可以正确工作 */
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 200px;
}

.method-badge {
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  color: white;
  min-width: 35px;
  text-align: center;
  display: inline-block;
}

.method-badge.get {
  background-color: #67c23a;
}

.method-badge.post {
  background-color: #409eff;
}

.method-badge.put {
  background-color: #e6a23c;
}

.method-badge.delete {
  background-color: #f56c6c;
}

.method-badge.patch {
  background-color: #909399;
}

.tab-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modified-indicator {
  font-size: 8px;
  margin-left: 4px;
}

/* 空状态样式 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
}

.empty-header {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color);
  flex-shrink: 0;
}

.empty-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
  padding: 40px;
}

.empty-icon {
  font-size: 64px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 16px;
}

.empty-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.empty-description {
  margin: 0 0 24px 0;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.empty-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 自定义标签页样式 */
:deep(.workspace-tabs .el-tabs__header) {
  margin: 0;
  border-bottom: none;
  background-color: transparent;
  height: 100%;
}

:deep(.workspace-tabs .el-tabs__nav-wrap) {
  border-bottom: none;
  height: 100%;
}

:deep(.workspace-tabs .el-tabs__nav-scroll) {
  height: 100%;
}

:deep(.workspace-tabs .el-tabs__nav) {
  border: none;
  height: 100%;
}

:deep(.workspace-tabs .el-tabs__content) {
  display: none; /* 隐藏Element Plus默认内容区域 */
}

:deep(.workspace-tabs .el-tabs__item) {
  border: none;
  border-right: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-fill-color-lighter);
  color: var(--el-text-color-regular);
  padding: 0 16px;
  height: 40px;
  line-height: 40px;
  transition: all 0.3s ease;
}

:deep(.workspace-tabs .el-tabs__item:hover) {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

:deep(.workspace-tabs .el-tabs__item.is-active) {
  background-color: var(--el-bg-color);
  color: var(--el-color-primary);
  border-bottom: 2px solid var(--el-color-primary);
}

/* 标签页关闭按钮样式 */
:deep(.el-tabs__item .el-icon-close) {
  margin-left: 6px;
  font-size: 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

:deep(.el-tabs__item .el-icon-close:hover) {
  background-color: var(--el-color-danger-light-7);
  color: var(--el-color-danger);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tab-label {
    max-width: 120px;
  }

  .empty-content {
    padding: 20px;
  }

  .empty-actions {
    flex-direction: column;
    align-items: center;
  }

  .environment-controls {
    padding: 0 8px;
  }
}
</style>