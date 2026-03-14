<template>
  <div class="main-workspace">
    <div v-if="!selectedWorkflow" class="empty-state">
      <div class="empty-icon">
        <el-icon><Cpu /></el-icon>
      </div>
      <div class="empty-text">
        <h3>选择一个工作流查看节点信息</h3>
        <p>从左侧工作流列表中选择一个工作流，查看其节点结构</p>
      </div>
    </div>

    <div v-else class="workspace-layout">
      <!-- ==================== 左侧区域 ==================== -->
      <div class="left-panel" :class="{ 'full-width': !showRightPanel }">
        <!-- 左侧顶部：Tab切换 -->
        <div class="left-header">
          <el-tabs v-model="activeTab" class="left-tabs" @tab-click="handleTabClick">
            <el-tab-pane label="测试步骤" name="test-steps" />
            <el-tab-pane label="测试数据" name="test-data" />
            <el-tab-pane label="测试报告" name="test-report" />
          </el-tabs>
        </div>

        <!-- 左侧内容区域 -->
        <div class="left-content">
          <!-- 测试步骤 Tab -->
          <div v-show="activeTab === 'test-steps'" class="tab-panel">
            <!-- 工具栏：测试套件名称 + 操作按钮 -->
            <div class="toolbar">
              <div class="toolbar-left">
                <el-icon class="toolbar-icon"><Connection /></el-icon>
                <span class="toolbar-title">{{ selectedWorkflow.name || '测试套件' }}</span>
              </div>
              <div class="toolbar-right">
                <el-button-group class="toolbar-btn-group">
                  <el-tooltip content="搜索节点" placement="top">
                    <el-button
                      size="small"
                      :type="showSearch ? 'primary' : ''"
                      @click="showSearch = !showSearch"
                    >
                      <el-icon><Search /></el-icon>
                    </el-button>
                  </el-tooltip>
                </el-button-group>
                <el-button-group class="toolbar-btn-group">
                  <el-tooltip content="展开所有" placement="top">
                    <el-button size="small" @click="handleExpandAll">
                      <el-icon><FolderOpened /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="折叠所有" placement="top">
                    <el-button size="small" @click="handleCollapseAll">
                      <el-icon><Folder /></el-icon>
                    </el-button>
                  </el-tooltip>
                </el-button-group>
                <el-button-group class="toolbar-btn-group">
                  <el-tooltip content="刷新" placement="top">
                    <el-button size="small" @click="handleRefresh">
                      <el-icon><Refresh /></el-icon>
                    </el-button>
                  </el-tooltip>
                </el-button-group>
              </div>
            </div>

            <!-- 搜索框 -->
            <div v-show="showSearch" class="search-bar">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索节点名称或类型..."
                size="small"
                clearable
                @input="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>

            <!-- 节点树 -->
            <div class="tree-container">
              <WorkflowNodeTree
                ref="workflowNodeTreeRef"
                :workflow-id="selectedWorkflow.workflowId"
                :workflow-name="selectedWorkflow.name"
                :env-id="selectedEnvironmentId"
                :show-header="false"
                :search-keyword="searchKeyword"
                @node-select="handleNodeSelect"
                @node-edit="handleNodeEdit"
                @node-delete="handleNodeDelete"
                @node-toggle="handleNodeToggle"
              />
            </div>
          </div>

          <!-- 测试数据 Tab -->
          <div v-show="activeTab === 'test-data'" class="tab-panel full-panel">
            <TestDataManager
              v-if="selectedWorkflow"
              ref="testDataManagerRef"
              :workflow-id="selectedWorkflow.workflowId"
            />
          </div>

          <!-- 测试报告 Tab -->
          <div v-show="activeTab === 'test-report'" class="tab-panel full-panel">
            <TestReport
              v-if="selectedWorkflow"
              ref="testReportRef"
              :workflow-id="selectedWorkflow.workflowId"
            />
          </div>
        </div>
      </div>

      <!-- ==================== 右侧区域（仅测试步骤Tab显示） ==================== -->
      <div v-show="showRightPanel" class="right-panel">
        <!-- 可拖拽调节宽度的手柄 -->
        <div
          class="resize-handle"
          @mousedown="startResize"
          @dblclick="resetPanelWidth"
        >
          <div class="resize-line"></div>
        </div>

        <!-- 右侧头部：节点名称 + 运行/环境选择器 -->
        <div class="right-header">
          <div class="right-header-left">
            <template v-if="selectedNodeData">
              <el-icon class="node-type-icon" :class="[`icon-${selectedNodeData.type}`]">
                <FolderOpened v-if="selectedNodeData.type === 'group'" />
                <Operation v-else-if="selectedNodeData.type === 'task'" />
                <QuestionFilled v-else-if="selectedNodeData.type === 'if'" />
                <ArrowRight v-else-if="selectedNodeData.type === 'else'" />
                <RefreshRight v-else-if="selectedNodeData.type === 'for'" />
                <Sort v-else-if="selectedNodeData.type === 'foreach'" />
                <Document v-else />
              </el-icon>
              <el-input
                v-model="editableNodeName"
                class="node-name-input"
                size="small"
                @blur="handleNodeNameBlur"
                @keyup.enter="handleNodeNameEnter"
              />
              <el-tooltip content="点击名称可编辑，Enter或失焦保存" placement="top">
                <el-icon class="edit-hint-icon">
                  <Edit />
                </el-icon>
              </el-tooltip>
              <el-tag size="small" :type="getNodeTypeTagType(selectedNodeData.type)">
                {{ getNodeTypeLabel(selectedNodeData.type) }}
              </el-tag>
            </template>
            <span v-else class="no-selection">请选择节点查看详情</span>
          </div>
          <div class="right-header-right">
            <!-- 运行按钮 -->
            <el-button
              type="success"
              size="small"
              :icon="VideoPlay"
              @click="showRunConfig = true"
            >
              运行
            </el-button>

            <!-- 环境选择器 -->
            <div class="environment-controls">
              <el-icon class="env-icon"><Monitor /></el-icon>
              <el-select
                v-model="selectedEnvironmentId"
                placeholder="选择环境"
                size="small"
                class="env-selector"
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
              <el-tooltip content="环境配置" placement="top">
                <el-button
                  size="small"
                  circle
                  class="env-config-btn"
                  @click="showEnvironmentConfig = true"
                >
                  <el-icon><Setting /></el-icon>
                </el-button>
              </el-tooltip>
            </div>

            <!-- 关闭详情按钮 -->
            <el-tooltip v-if="selectedNodeData" content="关闭详情" placement="top">
              <el-button size="small" circle @click="closeDetail">
                <el-icon><Close /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <!-- 右侧内容：节点详情 -->
        <div class="right-content">
          <NodeDetail
            v-if="selectedNodeData"
            ref="nodeDetailRef"
            :node-data="selectedNodeData"
            :env-id="selectedEnvironmentId"
            :show-header="false"
            @close="closeDetail"
            @edit="handleDetailEdit"
            @node-saved="handleNodeSaved"
          />
          <div v-else class="empty-detail">
            <el-icon class="empty-detail-icon"><DocumentCopy /></el-icon>
            <p>选择左侧节点查看详情</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 环境配置弹窗 -->
    <EnvironmentConfigDialog
      v-model="showEnvironmentConfig"
      :current-environment-id="selectedEnvironmentId"
      @save="handleEnvironmentSave"
    />

    <!-- 运行配置弹窗 -->
    <WorkflowRunConfig
      v-model="showRunConfig"
      :workflow-id="selectedWorkflow?.workflowId"
      :current-env-id="selectedEnvironmentId"
      @run="handleWorkflowRun"
    />
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { eventBus } from '@/utils/eventBus'
import request from '@/utils/request'
import {
  Cpu,
  VideoPlay,
  Monitor,
  Setting,
  Search,
  Refresh,
  FolderOpened,
  Folder,
  Connection,
  Close,
  Document,
  DocumentCopy,
  Operation,
  QuestionFilled,
  ArrowRight,
  RefreshRight,
  Sort,
  Edit
} from '@element-plus/icons-vue'
import WorkflowNodeTree from './WorkflowNodeTree.vue'
import NodeDetail from './NodeDetail.vue'
import TestDataManager from './TestDataManager.vue'
import TestReport from './TestReport.vue'
import EnvironmentConfigDialog from '@/views/api_test_cases/test_cases/components/EnvironmentConfigDialog.vue'
import WorkflowRunConfig from './WorkflowRunConfig.vue'
import { listEnvironments } from '@/api/api_environments/environments'

// 注入全局状态
const globalState = inject('globalState')

// 组件事件
const emit = defineEmits([
  'node-select',
  'node-edit',
  'node-delete',
  'node-toggle'
])

// 响应式数据
const selectedWorkflow = ref(null)
const activeTab = ref('test-steps')
const workflowNodeTreeRef = ref(null)
const testDataManagerRef = ref(null)
const testReportRef = ref(null)
const selectedNodeData = ref(null)
const nodeDetailRef = ref(null)

// 节点名称编辑
const editableNodeName = ref('')
const originalNodeName = ref('')

// 搜索相关
const showSearch = ref(false)
const searchKeyword = ref('')

// 环境相关数据
const environmentsLoading = ref(false)
const environmentsList = ref([])
const selectedEnvironmentId = ref(null)
const showEnvironmentConfig = ref(false)

// 运行配置相关数据
const showRunConfig = ref(false)

// 面板宽度调节
const rightPanelWidth = ref(500)
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)
const minPanelWidth = 300
const maxPanelWidth = 800

// 计算属性：是否显示右侧面板
const showRightPanel = computed(() => {
  return activeTab.value === 'test-steps'
})

// 监听选中的工作流变化
watch(() => globalState?.selectedWorkflow, (newWorkflow) => {
  if (newWorkflow) {
    handleWorkflowSelect(newWorkflow)
  }
}, { immediate: true })

// 处理工作流选择
const handleWorkflowSelect = (workflowData) => {
  console.log('MainWorkspace handleWorkflowSelect:', workflowData)
  selectedWorkflow.value = workflowData
  // 切换工作流时清空选中的节点
  selectedNodeData.value = null
}

// 节点选择处理
const handleNodeSelect = async (nodeData) => {
  console.log('Node selected:', nodeData)

  // 检查当前节点是否有未保存的更改
  if (selectedNodeData.value && nodeDetailRef.value) {
    const hasUnsavedChanges = nodeDetailRef.value.hasUnsavedChanges?.()

    if (hasUnsavedChanges) {
      try {
        await ElMessageBox.confirm(
          '当前节点有未保存的内容，是否保存？',
          '提示',
          {
            confirmButtonText: '保存',
            cancelButtonText: '不保存',
            type: 'warning',
            distinguishCancelAndClose: true
          }
        )
        // 用户选择保存
        await nodeDetailRef.value.saveNodeConfig?.()
      } catch (action) {
        if (action === 'cancel') {
          // 用户选择不保存，继续切换
        } else {
          // 用户点击关闭或取消，不切换节点
          return
        }
      }
    }
  }

  selectedNodeData.value = nodeData
  editableNodeName.value = nodeData?.name || ''
  originalNodeName.value = nodeData?.name || ''
  emit('node-select', nodeData)
}

// 处理节点名称失焦保存
const handleNodeNameBlur = async () => {
  if (editableNodeName.value !== originalNodeName.value && selectedNodeData.value) {
    try {
      await request({
        url: '/api_worknodes/worknodes',
        method: 'put',
        data: {
          nodeId: selectedNodeData.value.nodeId,
          name: editableNodeName.value,
          type: selectedNodeData.value.type,
          workflowId: selectedNodeData.value.workflowId,
          position: selectedNodeData.value.position,
          config: selectedNodeData.value.config
        }
      })

      // 更新本地数据
      selectedNodeData.value.name = editableNodeName.value
      originalNodeName.value = editableNodeName.value

      // 刷新节点树
      handleRefresh()

      ElMessage.success('节点名称已保存')
    } catch (error) {
      console.error('Save node name error:', error)
      ElMessage.error('保存节点名称失败')
      // 恢复原名称
      editableNodeName.value = originalNodeName.value
    }
  }
}

// 处理节点名称回车
const handleNodeNameEnter = (event) => {
  event.target.blur()
}

// 节点编辑处理
const handleNodeEdit = (nodeData) => {
  console.log('Node edit:', nodeData)
  emit('node-edit', nodeData)
}

// 节点删除处理
const handleNodeDelete = (nodeData) => {
  console.log('Node deleted:', nodeData)
  // 如果删除的是当前选中的节点，清空选中状态
  if (selectedNodeData.value?.nodeId === nodeData.nodeId) {
    selectedNodeData.value = null
  }
  emit('node-delete', nodeData)
}

// 节点切换处理
const handleNodeToggle = (nodeData) => {
  console.log('Node toggle:', nodeData)
  emit('node-toggle', nodeData)
}

// Tab切换处理
const handleTabClick = (tab) => {
  const tabName = tab.props.name
  console.log('Tab clicked:', tabName)

  // 切换到测试数据或测试报告时刷新数据
  if (tabName === 'test-data') {
    testDataManagerRef.value?.refresh()
  } else if (tabName === 'test-report') {
    testReportRef.value?.refresh()
  }
}

// 工具栏操作
const handleExpandAll = () => {
  workflowNodeTreeRef.value?.expandAll()
}

const handleCollapseAll = () => {
  workflowNodeTreeRef.value?.collapseAll()
}

const handleRefresh = () => {
  workflowNodeTreeRef.value?.refreshTree()
}

const handleSearch = () => {
  // 搜索逻辑由 WorkflowNodeTree 组件内部处理
}

// 关闭详情面板
const closeDetail = () => {
  selectedNodeData.value = null
}

// 详情面板编辑事件
const handleDetailEdit = (nodeData) => {
  emit('node-edit', nodeData)
}

// 节点保存事件处理
const handleNodeSaved = (nodeData) => {
  console.log('Node saved, refreshing tree:', nodeData)
  handleRefresh()
}

// 环境相关方法
const loadEnvironments = async () => {
  environmentsLoading.value = true
  try {
    const queryParams = {
      pageNum: 1,
      pageSize: 999,
      name: null,
      projectId: null,
      createTime: null,
    }

    const response = await listEnvironments(queryParams)

    if (response && response.code === 200) {
      environmentsList.value = response.rows || []

      // 查找默认环境并设置为选中状态
      const defaultEnv = environmentsList.value.find(env => env.isDefault === 1)
      if (defaultEnv) {
        selectedEnvironmentId.value = defaultEnv.id
      } else if (environmentsList.value.length > 0) {
        selectedEnvironmentId.value = environmentsList.value[0].id
      }

      // 从localStorage恢复环境选择
      const savedEnvId = localStorage.getItem('api-tester-environment-id')
      if (savedEnvId && environmentsList.value.find(env => env.id == savedEnvId)) {
        selectedEnvironmentId.value = parseInt(savedEnvId)
      }
    }
  } catch (error) {
    console.error('加载环境列表失败:', error)
  } finally {
    environmentsLoading.value = false
  }
}

const handleEnvironmentChange = (newEnvId) => {
  const selectedEnv = environmentsList.value.find(env => env.id === newEnvId)
  if (selectedEnv) {
    localStorage.setItem('api-tester-environment-id', newEnvId)
    ElMessage.success(`已切换到环境: ${selectedEnv.name}`)
  }
}

const handleEnvironmentSave = async (environmentConfig) => {
  console.log('Environment config saved:', environmentConfig)

  try {
    // 保存当前保存的环境ID
    const savedEnvironmentId = environmentConfig.id

    // 重新加载环境列表
    await loadEnvironments()

    // 将环境选择器更新为刚保存的环境
    selectedEnvironmentId.value = savedEnvironmentId
    console.log('环境选择器已更新为保存的环境:', savedEnvironmentId)

    // 保存到localStorage
    localStorage.setItem('api-tester-environment-id', savedEnvironmentId)

    // 查找对应的环境名称并显示成功提示
    const selectedEnv = environmentsList.value.find(env => env.id === savedEnvironmentId)
    if (selectedEnv) {
      ElMessage.success(`环境配置已保存，当前环境: ${selectedEnv.name}`)
    } else {
      ElMessage.success('环境配置已保存')
    }

  } catch (error) {
    console.error('Failed to handle environment save:', error)
    ElMessage.error('保存环境配置时发生错误')
  }
}

// 处理工作流运行
const handleWorkflowRun = (runConfig) => {
  console.log('工作流运行配置:', runConfig)
  ElMessage.success('工作流已开始运行')
}

// 面板宽度调节方法
const startResize = (e) => {
  isResizing.value = true
  startX.value = e.clientX
  startWidth.value = rightPanelWidth.value

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'

  e.preventDefault()
}

const handleResize = (e) => {
  if (!isResizing.value) return

  const deltaX = startX.value - e.clientX
  const newWidth = startWidth.value + deltaX

  if (newWidth >= minPanelWidth && newWidth <= maxPanelWidth) {
    rightPanelWidth.value = newWidth
  }
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''

  localStorage.setItem('workflow-right-panel-width', rightPanelWidth.value.toString())
}

const resetPanelWidth = () => {
  rightPanelWidth.value = 500
  localStorage.setItem('workflow-right-panel-width', '500')
}

// 节点类型相关方法
const getNodeTypeLabel = (type) => {
  const typeMap = {
    'task': '任务',
    'group': '分组',
    'condition': '条件',
    'loop': '循环',
    'for': '循环',
    'foreach': '遍历',
    'if': 'IF判断',
    'else': 'ELSE分支'
  }
  return typeMap[type] || type
}

const getNodeTypeTagType = (type) => {
  const typeMap = {
    'task': 'primary',
    'group': 'success',
    'condition': 'warning',
    'loop': 'info',
    'for': 'info',
    'foreach': 'success',
    'if': 'danger',
    'else': 'warning'
  }
  return typeMap[type] || 'default'
}

// 生命周期
onMounted(() => {
  eventBus.on('workflow-select', handleWorkflowSelect)
  loadEnvironments()

  // 恢复面板宽度设置
  const savedWidth = localStorage.getItem('workflow-right-panel-width')
  if (savedWidth) {
    const width = parseInt(savedWidth)
    if (width >= minPanelWidth && width <= maxPanelWidth) {
      rightPanelWidth.value = width
    }
  }
})

onBeforeUnmount(() => {
  eventBus.off('workflow-select', handleWorkflowSelect)
})
</script>

<style scoped>
.main-workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  min-height: 0;
  overflow: hidden;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 60px 30px;
  background: var(--el-bg-color-page);
}

.empty-icon {
  font-size: 72px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 24px;
}

.empty-text h3 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 600;
}

.empty-text p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 15px;
  line-height: 1.6;
}

/* ==================== 左右布局 ==================== */
.workspace-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* ==================== 左侧面板 ==================== */
.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 280px;
  max-width: 450px;
  overflow: hidden;
  border-right: 1px solid var(--el-border-color-light);
}

.left-panel.full-width {
  max-width: none;
  border-right: none;
}

/* 左侧顶部 Tab */
.left-header {
  flex-shrink: 0;
  height: 48px;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
  padding: 0 16px;
}

.left-tabs {
  height: 100%;
}

.left-tabs :deep(.el-tabs__header) {
  margin: 0;
  border-bottom: none;
  height: 100%;
}

.left-tabs :deep(.el-tabs__nav-wrap) {
  height: 100%;
}

.left-tabs :deep(.el-tabs__nav-scroll) {
  height: 100%;
}

.left-tabs :deep(.el-tabs__nav) {
  height: 100%;
}

.left-tabs :deep(.el-tabs__item) {
  height: 48px;
  line-height: 48px;
  padding: 0 20px;
}

.left-tabs :deep(.el-tabs__active-bar) {
  bottom: 0;
}

.left-tabs :deep(.el-tabs__content) {
  display: none;
}

/* 左侧内容区域 */
.left-content {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.tab-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-panel.full-panel {
  padding: 0;
}

/* 工具栏 */
.toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  height: 44px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.toolbar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn-group {
  display: flex;
}

/* 搜索栏 */
.search-bar {
  flex-shrink: 0;
  padding: 8px 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

/* 节点树容器 */
.tree-container {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* ==================== 右侧面板 ==================== */
.right-panel {
  flex: 2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background-color: var(--el-bg-color);
  min-width: 400px;
}

/* 拖拽调节手柄 */
.resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-handle:hover .resize-line,
.resize-handle:active .resize-line {
  background-color: var(--el-color-primary);
}

.resize-line {
  width: 2px;
  height: 40px;
  background-color: var(--el-border-color);
  border-radius: 1px;
  transition: background-color 0.2s;
}

/* 右侧头部 */
.right-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
}

.right-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.right-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.node-type-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.node-type-icon.icon-group { color: var(--el-color-success); }
.node-type-icon.icon-task { color: var(--el-color-primary); }
.node-type-icon.icon-if { color: var(--el-color-danger); }
.node-type-icon.icon-else { color: var(--el-color-warning); }
.node-type-icon.icon-for { color: var(--el-color-info); }
.node-type-icon.icon-foreach { color: var(--el-color-success); }

.node-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 节点名称输入框 */
.node-name-input {
  max-width: 200px;
  margin: 0 8px;
}

.node-name-input :deep(.el-input__wrapper) {
  background: transparent;
  box-shadow: none;
  padding: 0 4px;
}

.node-name-input :deep(.el-input__wrapper):hover {
  background: var(--el-fill-color-light);
}

.node-name-input :deep(.el-input__wrapper.is-focus) {
  background: var(--el-bg-color);
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.node-name-input :deep(.el-input__inner) {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

/* 编辑提示图标 */
.edit-hint-icon {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  margin-left: 4px;
  cursor: help;
  transition: color 0.2s;
}

.edit-hint-icon:hover {
  color: var(--el-color-primary);
}

.no-selection {
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

/* 环境选择器 */
.environment-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.env-icon {
  font-size: 16px;
  color: var(--el-color-primary);
}

.env-selector {
  width: 120px;
}

.env-config-btn {
  width: 28px;
  height: 28px;
}

/* 右侧内容区域 */
.right-content {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* 空详情状态 */
.empty-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
}

.empty-detail-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-detail p {
  margin: 0;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .right-panel {
    width: 400px !important;
  }

  .env-selector {
    width: 100px;
  }
}

@media (max-width: 768px) {
  .workspace-layout {
    flex-direction: column;
  }

  .left-panel {
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-light);
    min-height: 300px;
  }

  .right-panel {
    width: 100% !important;
    min-height: 300px;
  }

  .resize-handle {
    display: none;
  }

  .toolbar {
    flex-wrap: wrap;
    height: auto;
    padding: 8px 12px;
    gap: 8px;
  }

  .toolbar-left {
    width: 100%;
  }

  .toolbar-right {
    width: 100%;
    justify-content: flex-end;
  }

  .right-header-row1,
  .right-header-row2 {
    flex-wrap: wrap;
    height: auto;
    padding: 8px 12px;
    gap: 8px;
  }

  .right-header-left {
    width: 100%;
  }

  .right-toolbar-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
