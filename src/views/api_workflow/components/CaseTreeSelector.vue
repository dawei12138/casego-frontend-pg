<template>
  <div class="case-tree-selector">
    <!-- 双栏布局 -->
    <div class="selector-layout">
      <!-- 左侧：用例树选择区 -->
      <div class="left-panel">
        <!-- 搜索框 -->
        <div class="search-section">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索用例..."
            size="small"
            clearable
            @input="handleSearch"
            @clear="handleSearchClear"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- 操作按钮 -->
        <div class="action-section">
          <el-button-group size="small">
            <el-button @click="handleSelectAllVisible" :icon="CircleCheck">全选当前</el-button>
            <el-button @click="handleClearAll" :icon="CircleClose">清空已选</el-button>
          </el-button-group>
        </div>

        <!-- 树形结构 -->
        <div class="tree-container">
          <div v-if="loading" class="loading-container">
            <el-icon class="is-loading">
              <Loading />
            </el-icon>
            <span>加载中...</span>
          </div>
          <el-tree
            v-else
            ref="treeRef"
            :data="filteredTreeData"
            :props="treeProps"
            :expand-on-click-node="false"
            :default-expanded-keys="expandedKeys"
            :check-strictly="false"
            :indent="24"
            node-key="id"
            show-checkbox
            highlight-current
            @check="handleNodeCheck"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <div class="tree-node" @mouseenter="hoveredNodeId = data.id" @mouseleave="hoveredNodeId = null">
                <div class="node-icon">
                  <el-icon v-if="data.type === 'group'">
                    <Folder v-if="!node.expanded" />
                    <FolderOpened v-else />
                  </el-icon>
                  <div v-else-if="data.type === 'case' && data.apiType === 'api'" class="api-method-container">
                    <span class="method-badge" :class="data.method?.toLowerCase()">
                      {{ data.method || 'GET' }}
                    </span>
                  </div>
                  <div v-else-if="data.type === 'case' && data.apiType === 'case'" class="case-icon-container">
                    <div class="lightning-badge">
                      <svg viewBox="0 0 24 24" class="lightning-icon">
                        <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z" fill="currentColor"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="node-label-container">
                  <span class="node-label" :title="data.name">{{ data.name }}</span>
                  <span v-if="data.count && data.count > 0" class="count-text">({{ data.count }})</span>
                </div>

                <!-- 分组快选按钮 - 鼠标悬停时显示 -->
                <div v-if="data.type === 'group' && hoveredNodeId === data.id" class="quick-select-btns" @click.stop>
                  <el-tooltip content="添加该分组下所有用例" placement="top">
                    <el-button
                      type="primary"
                      size="small"
                      link
                      @click.stop="handleSelectGroup(data, true)"
                    >
                      <el-icon><CirclePlus /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="移除该分组下所有用例" placement="top">
                    <el-button
                      type="danger"
                      size="small"
                      link
                      @click.stop="handleSelectGroup(data, false)"
                    >
                      <el-icon><Remove /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </template>
          </el-tree>
        </div>

        <!-- 底部统计信息 -->
        <div class="selector-footer" v-if="statisticsData">
          <div class="statistics">
            <span>当前显示: {{ statisticsData.cases }} 个用例</span>
          </div>
        </div>
      </div>

      <!-- 右侧：已选用例列表 -->
      <div class="right-panel">
        <div class="panel-header">
          <span class="panel-title">
            <el-icon><Collection /></el-icon>
            已选用例
          </span>
          <el-tag type="primary" size="small">{{ selectedCaseMap.size }}</el-tag>
        </div>

        <div class="selected-list-container">
          <el-scrollbar v-if="selectedCaseMap.size > 0">
            <TransitionGroup name="list" tag="div" class="selected-list">
              <div
                v-for="[caseId, item] in selectedCaseMap"
                :key="caseId"
                class="selected-item"
              >
                <div class="item-icon">
                  <div v-if="item.apiType === 'api'" class="api-method-container">
                    <span class="method-badge small" :class="item.method?.toLowerCase()">
                      {{ item.method || 'GET' }}
                    </span>
                  </div>
                  <div v-else class="lightning-badge small">
                    <svg viewBox="0 0 24 24" class="lightning-icon">
                      <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z" fill="currentColor"/>
                    </svg>
                  </div>
                </div>
                <div class="item-info">
                  <span class="item-name" :title="item.name">{{ item.name }}</span>
                  <span class="item-path" :title="item.path">{{ item.path }}</span>
                </div>
                <el-button
                  type="danger"
                  size="small"
                  link
                  class="remove-btn"
                  @click="handleRemoveSelected(item)"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </TransitionGroup>
          </el-scrollbar>

          <div v-else class="empty-selected">
            <el-icon class="empty-icon"><DocumentCopy /></el-icon>
            <p>请从左侧选择用例</p>
            <p class="tip">支持多次搜索累计选择</p>
          </div>
        </div>

        <div class="panel-footer" v-if="selectedCaseMap.size > 0">
          <el-button size="small" type="danger" link @click="handleClearAll">
            <el-icon><Delete /></el-icon>
            清空已选
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import {
  FolderOpened,
  Folder,
  Search,
  Loading,
  CircleCheck,
  CircleClose,
  CirclePlus,
  Remove,
  Collection,
  Close,
  Delete,
  DocumentCopy
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getTestCaseTree, transformTreeData, searchTreeData, getCaseOnlyStatistics } from '@/views/api_test_cases/test_cases/composables/caseService'

const props = defineProps({
  importType: {
    type: String,
    default: 'api',
    validator: (value) => ['api', 'case'].includes(value)
  }
})

const emit = defineEmits(['selection-change', 'node-click'])

const treeRef = ref()
const searchKeyword = ref('')
const expandedKeys = ref([])
const loading = ref(false)
const treeData = ref([])
const hoveredNodeId = ref(null)
const currentNodeKey = ref(null)
const lastClickedNode = ref(null)

// 使用 Map 来存储已选用例，key 是 caseId，value 是用例详情
// 这样可以保证搜索过滤时不会丢失已选数据
const selectedCaseMap = ref(new Map())

const treeProps = {
  children: 'children',
  label: 'name'
}

// 过滤后的树数据
const filteredTreeData = computed(() => {
  if (!searchKeyword.value) {
    return treeData.value
  }
  return searchTreeData(treeData.value, searchKeyword.value)
})

// 统计数据（只统计 case 类型）
const statisticsData = computed(() => {
  return getCaseOnlyStatistics(filteredTreeData.value)
})

// 构建节点ID到详细信息的映射（只映射 apiType === 'case' 的节点）
const nodeMap = computed(() => {
  const map = new Map()
  const traverse = (nodes, path = '') => {
    nodes.forEach(node => {
      const currentPath = path ? `${path} / ${node.name}` : node.name
      // 只映射 case 类型的节点
      if (node.type === 'case' && node.apiType === 'case' && node.caseId) {
        map.set(node.id, {
          id: node.id,
          caseId: node.caseId,
          name: node.name,
          path: path || '根目录',
          apiType: node.apiType,
          method: node.method,
          parentApiName: node.parentApiName
        })
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children, currentPath)
      }
    })
  }
  traverse(treeData.value)
  return map
})

// 获取所有需要展开的节点ID（模块和api类型）
const getAllExpandableNodeIds = (nodes) => {
  const ids = []
  const traverse = (nodeList) => {
    nodeList.forEach(node => {
      // 展开模块节点
      if (node.type === 'group') {
        ids.push(node.id)
      }
      // 展开 api 类型节点（有子用例的接口）
      if (node.type === 'case' && node.apiType === 'api' && node.children && node.children.length > 0) {
        ids.push(node.id)
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(nodes)
  return ids
}

// 加载树数据
const loadTreeData = async () => {
  loading.value = true
  try {
    const response = await getTestCaseTree()
    if (response && response.code === 200) {
      const transformedData = transformTreeData(response)
      treeData.value = transformedData
      // 展开所有模块和接口节点
      expandedKeys.value = getAllExpandableNodeIds(transformedData)
      return transformedData
    } else {
      throw new Error(response?.msg || '未知错误')
    }
  } catch (error) {
    console.error('Failed to load tree data:', error)
    ElMessage.error(`加载用例树失败: ${error.message}`)
    return []
  } finally {
    loading.value = false
  }
}

// 获取所有节点ID
const getAllNodeIds = (nodes) => {
  const ids = []
  const traverse = (nodeList) => {
    nodeList.forEach(node => {
      ids.push(node.id)
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(nodes)
  return ids
}

// 获取节点下的所有用例信息（只获取 apiType === 'case' 的节点）
const getCasesFromNodes = (nodes, path = '') => {
  const cases = []
  const traverse = (nodeList, currentPath) => {
    nodeList.forEach(node => {
      const nodePath = currentPath ? `${currentPath} / ${node.name}` : node.name
      // 只收集 case 类型的节点
      if (node.type === 'case' && node.apiType === 'case' && node.caseId) {
        cases.push({
          id: node.id,
          caseId: node.caseId,
          name: node.name,
          path: currentPath || '根目录',
          apiType: node.apiType,
          method: node.method,
          parentApiName: node.parentApiName
        })
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children, nodePath)
      }
    })
  }
  traverse(nodes, path)
  return cases
}

// 处理搜索
const handleSearch = () => {
  // 搜索后需要恢复已选节点的勾选状态
  nextTick(() => {
    syncTreeCheckState()
  })
}

// 清空搜索
const handleSearchClear = () => {
  nextTick(() => {
    syncTreeCheckState()
  })
}

// 同步树的勾选状态（根据 selectedCaseMap）
const syncTreeCheckState = () => {
  if (!treeRef.value) return

  // 获取当前应该勾选的节点ID
  const checkedNodeIds = []
  for (const [caseId, item] of selectedCaseMap.value) {
    checkedNodeIds.push(item.id)
  }

  treeRef.value.setCheckedKeys(checkedNodeIds)
}

// 处理节点点击
const handleNodeClick = (data, node) => {
  currentNodeKey.value = data.id
  lastClickedNode.value = data
  emit('node-click', {
    type: data.type,
    data: data,
    node: node
  })
}

// 处理节点勾选变化 - 核心逻辑：增量更新（只处理 case 类型）
const handleNodeCheck = (data, checkedInfo) => {
  const { checkedNodes } = checkedInfo

  // 获取当前树中显示的所有用例节点（只有 apiType === 'case' 的）
  const visibleCases = getCasesFromNodes(filteredTreeData.value)
  const visibleCaseIds = new Set(visibleCases.map(c => c.caseId))

  // 获取当前勾选的用例（只统计 apiType === 'case' 的节点）
  const checkedCaseIds = new Set()
  checkedNodes.forEach(node => {
    if (node.type === 'case' && node.apiType === 'case' && node.caseId) {
      checkedCaseIds.add(node.caseId)
    }
  })

  // 对于当前可见的用例：根据勾选状态更新 selectedCaseMap
  visibleCases.forEach(caseInfo => {
    if (checkedCaseIds.has(caseInfo.caseId)) {
      // 勾选了 -> 添加到已选
      if (!selectedCaseMap.value.has(caseInfo.caseId)) {
        selectedCaseMap.value.set(caseInfo.caseId, caseInfo)
      }
    } else {
      // 未勾选 -> 从已选移除
      selectedCaseMap.value.delete(caseInfo.caseId)
    }
  })

  // 触发更新
  emitSelectionChange()
}

// 处理分组快选
const handleSelectGroup = (groupData, isSelect) => {
  // 获取分组下所有用例
  const groupPath = getNodePath(groupData.id)
  const groupCases = getCasesFromNodes(groupData.children || [], groupPath)

  if (isSelect) {
    // 添加到已选
    groupCases.forEach(caseInfo => {
      selectedCaseMap.value.set(caseInfo.caseId, caseInfo)
    })
  } else {
    // 从已选移除
    groupCases.forEach(caseInfo => {
      selectedCaseMap.value.delete(caseInfo.caseId)
    })
  }

  // 同步树的勾选状态
  syncTreeCheckState()
  emitSelectionChange()
}

// 获取节点路径
const getNodePath = (nodeId) => {
  const findPath = (nodes, targetId, path = '') => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return path
      }
      if (node.children && node.children.length > 0) {
        const currentPath = path ? `${path} / ${node.name}` : node.name
        const result = findPath(node.children, targetId, currentPath)
        if (result !== null) {
          return result
        }
      }
    }
    return null
  }
  return findPath(treeData.value, nodeId) || ''
}

// 移除已选中的用例
const handleRemoveSelected = (item) => {
  selectedCaseMap.value.delete(item.caseId)
  syncTreeCheckState()
  emitSelectionChange()
}

// 全选当前可见的用例
const handleSelectAllVisible = () => {
  const visibleCases = getCasesFromNodes(filteredTreeData.value)
  visibleCases.forEach(caseInfo => {
    selectedCaseMap.value.set(caseInfo.caseId, caseInfo)
  })
  syncTreeCheckState()
  emitSelectionChange()
}

// 清空所有选择
const handleClearAll = () => {
  selectedCaseMap.value.clear()
  if (treeRef.value) {
    treeRef.value.setCheckedKeys([])
  }
  emitSelectionChange()
}

// 触发选择变化事件
const emitSelectionChange = () => {
  const caseIds = Array.from(selectedCaseMap.value.keys())
  emit('selection-change', caseIds)
}

// 监听过滤后的树数据变化，同步勾选状态
watch(filteredTreeData, () => {
  nextTick(() => {
    syncTreeCheckState()
  })
})

// 生命周期
onMounted(() => {
  loadTreeData()
})

// 监听导入类型变化
watch(() => props.importType, () => {
  handleClearAll()
})

// 暴露方法
defineExpose({
  refresh: loadTreeData,
  getCurrentNode: () => lastClickedNode.value
})
</script>

<style scoped>
.case-tree-selector {
  height: 500px;
  display: flex;
  flex-direction: column;
}

.selector-layout {
  display: flex;
  height: 100%;
  gap: 12px;
}

/* 左侧面板 */
.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  overflow: hidden;
}

.search-section {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.action-section {
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tree-container {
  flex: 1;
  overflow: auto;
  padding: 8px;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: var(--el-text-color-secondary);
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding-right: 8px;
}

.node-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.api-method-container {
  display: flex;
  align-items: center;
}

.method-badge {
  display: inline-block;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: bold;
  color: white;
  min-width: 32px;
  text-align: center;
}

.method-badge.small {
  font-size: 9px;
  padding: 0 3px;
  min-width: 28px;
}

.method-badge.get { background-color: #67c23a; }
.method-badge.post { background-color: #409eff; }
.method-badge.put { background-color: #e6a23c; }
.method-badge.delete { background-color: #f56c6c; }
.method-badge.patch { background-color: #909399; }

.case-icon-container {
  display: flex;
  align-items: center;
}

.lightning-badge {
  width: 16px;
  height: 16px;
  background-color: #f0f4ff;
  color: #4a6cf7;
  border: 1px solid #d1e0ff;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightning-badge.small {
  width: 14px;
  height: 14px;
}

.lightning-icon {
  width: 10px;
  height: 10px;
}

.node-label-container {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.count-text {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  flex-shrink: 0;
}

/* 分组快选按钮 */
.quick-select-btns {
  display: flex;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}

.selector-footer {
  padding: 8px 12px;
  border-top: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color-page);
}

.statistics {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 右侧面板 */
.right-panel {
  width: 280px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  overflow: hidden;
}

.panel-header {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--el-bg-color-page);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  font-size: 14px;
}

.selected-list-container {
  flex: 1;
  overflow: hidden;
}

.selected-list {
  padding: 8px;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  background-color: var(--el-fill-color-light);
  margin-bottom: 6px;
  transition: all 0.2s;
}

.selected-item:hover {
  background-color: var(--el-fill-color);
}

.selected-item:hover .remove-btn {
  opacity: 1;
}

.item-icon {
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-path {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.empty-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  color: var(--el-text-color-placeholder);
}

.empty-selected p {
  margin: 0;
  font-size: 13px;
}

.empty-selected .tip {
  font-size: 12px;
  margin-top: 4px;
  color: var(--el-text-color-placeholder);
}

.panel-footer {
  padding: 8px 12px;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: flex-end;
}

/* 列表过渡动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 树样式 */
:deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--el-color-primary-light-9);
}

:deep(.el-tree-node__content) {
  cursor: pointer;
  height: 32px;
}

:deep(.el-tree-node__content:hover) {
  background-color: var(--el-fill-color-light);
}

/* 层级缩进和连接线样式 */
:deep(.el-tree-node) {
  position: relative;
}

:deep(.el-tree-node__children) {
  padding-left: 0;
}

/* 展开/折叠箭头样式 */
:deep(.el-tree-node__expand-icon) {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

:deep(.el-tree-node__expand-icon.is-leaf) {
  color: transparent;
}

/* 层级背景色区分 */
:deep(.el-tree > .el-tree-node > .el-tree-node__content) {
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
  margin-bottom: 2px;
}

:deep(.el-tree > .el-tree-node > .el-tree-node__children > .el-tree-node > .el-tree-node__content) {
  background-color: transparent;
  border-left: 2px solid var(--el-border-color);
  margin-left: 8px;
  padding-left: 8px;
}

:deep(.el-tree > .el-tree-node > .el-tree-node__children > .el-tree-node > .el-tree-node__children > .el-tree-node > .el-tree-node__content) {
  background-color: var(--el-fill-color-extra-light);
  border-left: 2px solid var(--el-color-primary-light-7);
  margin-left: 8px;
  padding-left: 8px;
  border-radius: 2px;
}
</style>
