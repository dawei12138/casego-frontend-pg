<template>
  <div class="workflow-node-tree">
    <!-- 统一顶部栏：左侧工具栏 + 右侧节点标题（仅当 showHeader 为 true 时显示） -->
    <div v-if="showHeader" class="unified-header">
      <!-- 左侧：测试套件名称 + 操作按钮 -->
      <div class="header-left-section">
        <el-icon class="title-icon"><Connection /></el-icon>
        <span class="toolbar-title">{{ workflowName || '测试套件' }}</span>
        <div class="toolbar-buttons">
          <el-button-group class="toolbar-button-group">
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

          <el-button-group class="toolbar-button-group">
            <el-tooltip content="展开所有" placement="top">
              <el-button size="small" @click="expandAll">
                <el-icon><FolderOpened /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="折叠所有" placement="top">
              <el-button size="small" @click="collapseAll">
                <el-icon><Folder /></el-icon>
              </el-button>
            </el-tooltip>
          </el-button-group>

          <el-button-group class="toolbar-button-group">
            <el-tooltip content="刷新" placement="top">
              <el-button size="small" @click="refreshTree">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </el-tooltip>
          </el-button-group>
        </div>
      </div>

      <!-- 右侧：选中节点标题（仅当有选中节点时显示） -->
      <div v-if="selectedNodeData" class="header-right-section">
        <div class="header-divider"></div>
        <el-icon class="detail-node-icon" :class="[`icon-${selectedNodeData.type}`]">
          <FolderOpened v-if="selectedNodeData.type === 'group'" />
          <Operation v-else-if="selectedNodeData.type === 'task'" />
          <QuestionFilled v-else-if="selectedNodeData.type === 'if'" />
          <ArrowRight v-else-if="selectedNodeData.type === 'else'" />
          <RefreshRight v-else-if="selectedNodeData.type === 'for'" />
          <Sort v-else-if="selectedNodeData.type === 'foreach'" />
          <Document v-else />
        </el-icon>
        <span class="detail-node-name">{{ selectedNodeData.name }}</span>
        <el-tag size="small" :type="getNodeTypeTagType(selectedNodeData.type)">
          {{ getNodeTypeLabel(selectedNodeData.type) }}
        </el-tag>
        <el-tooltip content="关闭详情" placement="top">
          <el-button size="small" circle class="close-detail-btn" @click="closeDetail">
            <el-icon><Close /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 搜索框（仅当 showHeader 为 true 时显示内部搜索框） -->
    <div v-if="showHeader" v-show="showSearch" class="search-container">
      <el-input
        v-model="internalSearchKeyword"
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

    <!-- 主要内容区域 -->
    <div class="tree-main-content">
      <!-- 左侧树区域 -->
      <div class="tree-panel" :class="{ 'with-detail': showHeader && selectedNodeData }">
        <!-- 加载状态 - 只在首次加载时显示 -->
        <div v-if="loading && isInitialLoad" class="loading-container">
          <el-skeleton :rows="5" animated />
        </div>

        <!-- 空状态 -->
        <div v-else-if="!treeData || treeData.length === 0" class="empty-state">
          <div class="empty-icon">
            <el-icon><DocumentCopy /></el-icon>
          </div>
          <div class="empty-text">
            <h4>暂无节点数据</h4>
            <p>当前工作流还没有配置任何节点</p>
          </div>
          <div class="empty-actions">
            <el-button
              type="primary"
              size="default"
              @click="handleCreateRootNode"
            >
              <el-icon><Plus /></el-icon>
              创建第一个节点
            </el-button>
          </div>
        </div>

        <!-- 节点树 -->
        <div v-else ref="treeContainerRef" class="tree-container" :class="{ 'is-refreshing': loading && !isInitialLoad }">
          <!-- 批量操作工具栏 - 只在有选中项时显示 -->
          <div v-if="selectedNodeIds.length > 0" class="batch-operations-toolbar">
            <div class="batch-selection">
              <el-checkbox
                v-model="selectAll"
                :indeterminate="isIndeterminate"
                @change="handleSelectAllChange"
              >
                全选
              </el-checkbox>
              <span class="selected-count">
                已选择 {{ selectedNodeIds.length }} 个节点
              </span>
            </div>
            <div class="batch-actions">
              <el-button
                type="danger"
                size="small"
                @click="handleBatchDelete"
              >
                <el-icon><Delete /></el-icon>
                批量删除
              </el-button>
            </div>
          </div>

          <el-tree
            ref="treeRef"
            :data="filteredTreeData"
            :props="treeProps"
            :expand-on-click-node="false"
            :default-expand-all="true"
            :highlight-current="true"
            :draggable="true"
            :allow-drop="allowDrop"
            :allow-drag="allowDrag"
            node-key="nodeId"
            @node-click="handleNodeClick"
            @node-expand="handleNodeExpand"
            @node-collapse="handleNodeCollapse"
            @node-drop="handleNodeDrop"
          >
            <template #default="{ node, data }">
              <div class="tree-node" :class="{ 
                'selected': selectedNodeId === data.nodeId,
                'node-disabled': isNodeEffectivelyDisabled(data)
              }">
                <!-- 层级辅助线 -->
                <div class="node-level-lines">
                  <div 
                    v-for="level in node.level - 1" 
                    :key="level" 
                    class="level-line"
                    :class="{ 'has-sibling': hasNextSibling(node, level) }"
                  ></div>
                  <div 
                    v-if="node.level > 1" 
                    class="node-connector"
                    :class="{ 'last-child': isLastChild(node) }"
                  ></div>
                </div>

                <div class="node-content">
                  <!-- 复选框（最左侧） -->
                  <div class="node-checkbox">
                    <el-checkbox 
                      :model-value="isNodeSelected(data.nodeId)"
                      @change="handleNodeSelectionChange(data, $event)"
                      @click.stop
                    />
                  </div>
                  
                  <!-- 展开/收缩图标 -->
                  <div class="node-expand-icon" v-if="data.children && data.children.length > 0" @click.stop="toggleNodeExpand(node)">
                    <el-icon>
                      <ArrowRight v-if="!node.expanded" />
                      <ArrowDown v-else />
                    </el-icon>
                  </div>
                  <div class="node-expand-placeholder" v-else></div>
                  
                  <!-- 节点类型（点击显示节点详情） -->
                  <div class="node-type-section clickable" @click.stop="handleNodeClick(data, node)">
                    <div class="node-type-icon" :class="[`icon-${data.type}`, { 'clickable': data.children && data.children.length > 0 }]">
                    <el-icon v-if="data.type === 'group'">
                      <FolderOpened v-if="node.expanded" />
                      <Folder v-else />
                    </el-icon>
                    <!-- API和API用例使用自定义图标 -->
                    <svg-icon v-else-if="data.type === 'task' && (getTaskSubType(data) === 'api' || getTaskSubType(data) === 'api_case')" icon-class="API-copy-copy" style="width: 18px; height: 18px;" />
                    <el-icon v-else-if="data.type === 'task'" :class="getTaskSubType(data) ? `task-${getTaskSubType(data)}-icon` : ''">
                      <!-- 等待任务 -->
                      <Timer v-if="getTaskSubType(data) === 'wait'" />
                      <!-- 自定义脚本 -->
                      <EditPen v-else-if="getTaskSubType(data) === 'custom'" />
                      <!-- 公共脚本 -->
                      <Document v-else-if="getTaskSubType(data) === 'public_script'" />
                      <!-- 数据库操作 -->
                      <Coin v-else-if="getTaskSubType(data) === 'db_operation'" />
                      <!-- Web用例 -->
                      <Monitor v-else-if="getTaskSubType(data) === 'web_case'" />
                      <!-- 其他类型使用默认图标 -->
                      <Operation v-else />
                    </el-icon>
                    <el-icon v-else-if="data.type === 'condition'">
                      <Switch />
                    </el-icon>
                    <el-icon v-else-if="data.type === 'loop'">
                      <Refresh />
                    </el-icon>
                    <el-icon v-else-if="data.type === 'for'" class="for-icon">
                      <RefreshRight />
                    </el-icon>
                    <el-icon v-else-if="data.type === 'foreach'" class="foreach-icon">
                      <Sort />
                    </el-icon>
                    <el-icon v-else-if="data.type === 'if'" class="if-icon">
                      <QuestionFilled />
                    </el-icon>
                    <el-icon v-else-if="data.type === 'else'" class="else-icon">
                      <ArrowRight />
                    </el-icon>
                    <el-icon v-else>
                      <Document />
                    </el-icon>
                  </div>
                    <span class="node-type-text" :class="{ 
                      'if-text': data.type === 'if', 
                      'else-text': data.type === 'else',
                      'for-text': data.type === 'for',
                      'foreach-text': data.type === 'foreach',
                      'task-subtype-text': data.type === 'task' && getTaskSubType(data) && !['api', 'api_case'].includes(getTaskSubType(data))
                    }">{{ 
                      data.type === 'task' && getTaskSubType(data) && !['api', 'api_case'].includes(getTaskSubType(data)) 
                        ? getTaskTypeLabel(getTaskSubType(data)) 
                        : getNodeTypeLabel(data.type) 
                    }}</span>
                  </div>

                  <!-- 节点主要信息（一行展示） -->
                   <div class="node-main-info clickable" @click.stop="handleNodeClick(data, node)">
                     <el-tooltip 
                       :content="data.name" 
                       placement="top" 
                       :disabled="!isTextOverflowing(data.name)"
                       :show-after="500"
                     >
                       <div class="node-name">{{ data.name }}</div>
                     </el-tooltip>
                   </div>

                  <!-- 节点功能按钮区域 -->
                  <div class="node-actions">
                    <!-- 添加节点按钮 -->
                    <el-button 
                      type="text" 
                      size="small" 
                      class="action-btn add-btn"
                      @click.stop="handleAddNode(data, node)"
                      title="添加节点"
                    >
                      <el-icon><Plus /></el-icon>
                    </el-button>
                    
                    <!-- 节点ID显示 -->
                    <div class="node-id-display">
                      <span class="node-id-text">{{ data.nodeId }}</span>
                      <el-button 
                        type="text" 
                        size="small" 
                        class="action-btn copy-btn"
                        @click.stop="handleCopyNode(data)"
                        title="复制节点"
                      >
                        <el-icon><DocumentCopy /></el-icon>
                      </el-button>
                    </div>
                    
                    <!-- 禁用/启用按钮 -->
                    <el-button 
                      type="text" 
                      size="small" 
                      class="action-btn disable-btn"
                      :class="{ 'disabled': !data.isRun }"
                      @click.stop="handleToggleNodeStatus(data)"
                      :title="data.isRun ? '禁用节点' : '启用节点'"
                    >
                      <el-icon v-if="data.isRun"><VideoPlay /></el-icon>
                      <el-icon v-else><VideoPause /></el-icon>
                    </el-button>
                    
                    <!-- 删除按钮 -->
                    <el-button 
                      type="text" 
                      size="small" 
                      class="action-btn delete-btn"
                      @click.stop="handleDeleteNode(data)"
                      title="删除节点"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>

                </div>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧详情面板（仅当 showHeader 为 true 时显示内部详情面板） -->
      <div v-if="showHeader && selectedNodeData" class="detail-panel" :style="{ width: detailPanelWidth + 'px' }">
        <!-- 拖拽调节手柄 -->
        <div
          class="resize-handle"
          @mousedown="startResize"
          @dblclick="resetPanelWidth"
        >
          <div class="resize-line"></div>
        </div>

        <!-- 详情内容区域 -->
        <div class="detail-content">
          <NodeDetail
            :node-data="selectedNodeData"
            :env-id="props.envId"
            :show-header="false"
            @close="closeDetail"
            @edit="handleDetailEdit"
            @node-saved="handleNodeSaved"
          />
        </div>
      </div>
    </div>

    <!-- 添加节点级别选择弹窗 - 使用新的优化组件 -->
    <AddNodeLevelDialog
      v-model="showAddNodeDialog"
      :node-data="currentAddNodeData?.nodeData"
      @select="handleSelectAddLevel"
    />

    <!-- 节点类型选择弹窗 - 使用新的优化组件 -->
    <NodeTypeSelector
      v-model="showNodeTypeDialog"
      :add-type="currentAddNodeType"
      @select="handleSelectNodeType"
    />

    <!-- 用例导入对话框 -->
    <el-dialog
      v-model="showCaseImportDialog"
      :title="caseImportDialogTitle"
      width="1000px"
      :close-on-click-modal="false"
    >
      <CaseTreeSelector
        v-if="showCaseImportDialog"
        ref="caseTreeSelectorRef"
        @selection-change="handleCaseSelectionChange"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCaseImportDialog = false">取消</el-button>
          <el-button
            type="primary"
            :loading="caseImportLoading"
            @click="handleConfirmImport"
            :disabled="selectedCaseIds.length === 0"
          >
            确认导入 ({{ selectedCaseIds.length }})
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 接口导入对话框 -->
    <el-dialog
      v-model="showApiImportDialog"
      title="从接口导入"
      width="1000px"
      :close-on-click-modal="false"
    >
      <ApiTreeSelector
        v-if="showApiImportDialog"
        ref="apiTreeSelectorRef"
        @selection-change="handleApiSelectionChange"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showApiImportDialog = false">取消</el-button>
          <el-button
            type="primary"
            :loading="apiImportLoading"
            @click="handleConfirmApiImport"
            :disabled="selectedApiIds.length === 0"
          >
            确认导入 ({{ selectedApiIds.length }})
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 等待时间弹窗 -->
    <WaitTimeDialog
      v-model="showWaitTimeDialog"
      @confirm="handleWaitTimeConfirm"
    />

    <!-- 自定义脚本弹窗 -->
    <CustomScriptDialog
      v-model="showCustomScriptDialog"
      :env-id="props.envId"
      @confirm="handleCustomScriptConfirm"
    />

    <!-- 公共脚本弹窗 -->
    <PublicScriptDialog
      v-model="showPublicScriptDialog"
      @confirm="handlePublicScriptConfirm"
    />

    <!-- 数据库脚本弹窗 -->
    <DbOperationDialog
      v-model="showDbOperationDialog"
      @confirm="handleDbOperationConfirm"
    />

    <!-- cURL导入弹窗 -->
    <CurlImportDialog
      v-model="showCurlImportDialog"
      @confirm="handleCurlImportConfirm"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  FullScreen,
  Fold,
  Expand,
  FolderOpened,
  Folder,
  Operation,
  Document,
  CircleCheck,
  CircleClose,
  MoreFilled,
  Edit,
  DocumentCopy,
  Switch,
  Delete,
  Close,
  ArrowRight,
  ArrowDown,
  QuestionFilled,
  RefreshRight,
  Sort,
  Timer,
  EditPen,
  Coin,
  Monitor,
  Connection,
  VideoPlay,
  VideoPause,
  Plus
} from '@element-plus/icons-vue'
import SvgIcon from '@/components/SvgIcon'
import {
  getWorkflowNodes,
  addWorkflowNode,
  copyWorkflowNode,
  updateNodesSort,
  transformNodeTreeData,
  searchNodeTree,
  formatNodeConfigForDisplay,
  delWorkflowNodes
} from '@/api/workflow/workflowNodes'
import { updateWorknodes, delWorknodes } from '@/api/api_worknodes/worknodes'
import NodeDetail from './NodeDetail.vue'
import CaseTreeSelector from './CaseTreeSelector.vue'
import ApiTreeSelector from './ApiTreeSelector.vue'
import AddNodeLevelDialog from './AddNodeLevelDialog.vue'
import NodeTypeSelector from './NodeTypeSelector.vue'
import WaitTimeDialog from './WaitTimeDialog.vue'
import CustomScriptDialog from './CustomScriptDialog.vue'
import PublicScriptDialog from './PublicScriptDialog.vue'
import DbOperationDialog from './DbOperationDialog.vue'
import CurlImportDialog from './CurlImportDialog.vue'
import { useProjectStore } from '@/store/modules/project'


const props = defineProps({
  workflowId: {
    type: [Number, String],
    default: null
  },
  workflowName: {
    type: String,
    default: ''
  },
  envId: {
    type: [Number, String],
    default: null
  },
  autoLoad: {
    type: Boolean,
    default: true
  },
  // 是否显示内部的头部（工具栏和详情面板）
  showHeader: {
    type: Boolean,
    default: true
  },
  // 从父组件传入的搜索关键词
  searchKeyword: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['node-select', 'node-edit', 'node-delete', 'tree-refresh'])

// 响应式数据
const treeRef = ref()
const treeContainerRef = ref() // 树容器引用，用于获取滚动位置
const loading = ref(false)
const isInitialLoad = ref(true) // 是否是首次加载，用于控制骨架屏显示
const showSearch = ref(false)
const internalSearchKeyword = ref('')
const treeData = ref([])
const expandedNodes = ref([])
const selectedNodeId = ref(null)
const selectedNodeData = ref(null)

// 计算实际使用的搜索关键词（优先使用 props 传入的值）
const effectiveSearchKeyword = computed(() => {
  return props.searchKeyword || internalSearchKeyword.value
})

// 添加节点相关数据
const showAddNodeDialog = ref(false)
const showNodeTypeDialog = ref(false)
const currentAddNodeData = ref(null)
const currentAddNodeType = ref('') // 'sibling' 或 'child'

// 用例导入相关数据
const showCaseImportDialog = ref(false)
const caseImportDialogTitle = ref('')
const selectedCaseIds = ref([])
const caseTreeSelectorRef = ref(null)
const currentImportType = ref('') // 'api_case' 或 'test_case'

// 接口导入相关数据
const showApiImportDialog = ref(false)
const selectedApiIds = ref([])
const apiTreeSelectorRef = ref(null)

// 各类型节点弹窗状态
const showWaitTimeDialog = ref(false)
const showCustomScriptDialog = ref(false)
const showPublicScriptDialog = ref(false)
const showDbOperationDialog = ref(false)
const showCurlImportDialog = ref(false)

// 导入按钮的 loading 状态
const caseImportLoading = ref(false)
const apiImportLoading = ref(false)

// 初始化项目存储
const projectStore = useProjectStore()

// 多选删除相关数据
const selectedNodeIds = ref([]) // 选中的节点ID数组
const selectAll = ref(false) // 全选状态
const isIndeterminate = ref(false) // 半选状态

// 详情面板宽度调节相关
const detailPanelWidth = ref(600) // 默认宽度600px
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)
const minPanelWidth = 320 // 最小宽度
const maxPanelWidth = 1000 // 最大宽度

// 树配置
const treeProps = {
  children: 'children',
  label: 'name'
}

// 计算属性
const filteredTreeData = computed(() => {
  if (!effectiveSearchKeyword.value) {
    return treeData.value
  }
  return searchNodeTree(treeData.value, effectiveSearchKeyword.value)
})
// 统计信息
const statistics = computed(() => {
  const getNodeTreeStatistics = (nodes) => {
    let taskCount = 0
    let groupCount = 0
    let totalCount = 0
    
    const countNodes = (nodeList) => {
      nodeList.forEach(node => {
        totalCount++
        if (node.type === 'task') {
          taskCount++
        } else if (node.type === 'group') {
          groupCount++
        }
        if (node.children && node.children.length > 0) {
          countNodes(node.children)
        }
      })
    }
    
    countNodes(nodes)
    return { taskCount, groupCount, totalCount }
  }
  
  return getNodeTreeStatistics(treeData.value)
})

const formattedConfig = ref({})

// 格式化所有节点的配置信息
const formatAllConfigs = () => {
  const formatNodeConfigs = (nodes) => {
    nodes.forEach(node => {
      if (node.config) {
        formattedConfig.value[node.nodeId] = formatNodeConfigForDisplay(node.config)
      }
      if (node.children && node.children.length > 0) {
        formatNodeConfigs(node.children)
      }
    })
  }
  
  formattedConfig.value = {}
  formatNodeConfigs(treeData.value)
}

// 方法
const loadTreeData = async (options = {}) => {
  const { preserveState = true } = options

  if (!props.workflowId) {
    treeData.value = []
    return
  }

  // 判断是否是首次加载（树还没有数据）
  const isFirstLoad = treeData.value.length === 0

  // 保存当前状态用于无感刷新
  let savedExpandedKeys = []
  let savedScrollTop = 0
  let savedSelectedNodeId = selectedNodeId.value

  // 只有在非首次加载且需要保持状态时才保存
  if (!isFirstLoad && preserveState) {
    // 保存展开的节点
    if (treeRef.value) {
      savedExpandedKeys = getExpandedKeys()
    }
    // 保存滚动位置 - 使用树容器的滚动位置
    if (treeContainerRef.value) {
      savedScrollTop = treeContainerRef.value.scrollTop
    }
  }

  // 首次加载时设置标志
  if (isFirstLoad) {
    isInitialLoad.value = true
  } else {
    // 刷新时不显示骨架屏
    isInitialLoad.value = false
  }

  loading.value = true
  try {
    const response = await getWorkflowNodes(props.workflowId)
    if (response && response.code === 200) {
      // 先保存旧数据，用于对比
      const oldTreeData = [...treeData.value]

      treeData.value = transformNodeTreeData(response)

      // 清空多选状态
      selectedNodeIds.value = []
      updateSelectAllState()

      // 恢复状态（无感刷新）- 只有非首次加载时才恢复
      if (!isFirstLoad && preserveState) {
        await nextTick()

        // 恢复展开状态
        if (savedExpandedKeys.length > 0) {
          restoreExpandedKeys(savedExpandedKeys)
        }

        // 恢复滚动位置
        await nextTick()
        if (treeContainerRef.value && savedScrollTop > 0) {
          treeContainerRef.value.scrollTop = savedScrollTop
        }

        // 恢复选中状态（如果节点仍然存在）
        if (savedSelectedNodeId) {
          const nodeData = findNodeById(treeData.value, savedSelectedNodeId)
          if (nodeData) {
            selectedNodeId.value = savedSelectedNodeId
            selectedNodeData.value = nodeData
          }
        }
      }
    } else {
      treeData.value = []
      ElMessage.warning('获取节点数据失败')
    }

  } catch (error) {
    console.error('Load tree data failed:', error)
    treeData.value = []
    ElMessage.error('加载节点数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
    // 加载完成后重置首次加载标志
    isInitialLoad.value = false
  }
}

// 获取当前展开的节点keys
const getExpandedKeys = () => {
  const expandedKeys = []
  if (!treeRef.value) return expandedKeys

  const traverse = (nodes) => {
    nodes.forEach(node => {
      const treeNode = treeRef.value.getNode(node.nodeId)
      if (treeNode && treeNode.expanded) {
        expandedKeys.push(node.nodeId)
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }

  traverse(treeData.value)
  return expandedKeys
}

// 恢复展开的节点
const restoreExpandedKeys = (keys) => {
  if (!treeRef.value) return

  keys.forEach(key => {
    const node = treeRef.value.getNode(key)
    if (node) {
      node.expanded = true
    }
  })
}

// 在树中查找节点
const findNodeById = (nodes, nodeId) => {
  for (const node of nodes) {
    if (node.nodeId === nodeId) {
      return node
    }
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, nodeId)
      if (found) return found
    }
  }
  return null
}

const refreshTree = () => {
  loadTreeData()
  emit('tree-refresh')
}

const expandAll = () => {
  if (treeRef.value) {
    const allNodeIds = []
    const collectNodeIds = (nodes) => {
      nodes.forEach(node => {
        allNodeIds.push(node.nodeId)
        if (node.children && node.children.length > 0) {
          collectNodeIds(node.children)
        }
      })
    }
    collectNodeIds(treeData.value)
    
    allNodeIds.forEach(nodeId => {
      const node = treeRef.value.getNode(nodeId)
      if (node && node.childNodes.length > 0) {
        node.expanded = true
      }
    })
  }
}

const collapseAll = () => {
  if (treeRef.value) {
    const allNodeIds = []
    const collectNodeIds = (nodes) => {
      nodes.forEach(node => {
        allNodeIds.push(node.nodeId)
        if (node.children && node.children.length > 0) {
          collectNodeIds(node.children)
        }
      })
    }
    collectNodeIds(treeData.value)
    
    allNodeIds.forEach(nodeId => {
      const node = treeRef.value.getNode(nodeId)
      if (node) {
        node.expanded = false
      }
    })
  }
  expandedNodes.value = []
}

const handleSearch = () => {
  // 使用本地搜索功能
  // filteredTreeData 计算属性会自动处理搜索过滤
  
  // 搜索时自动展开匹配的节点
  if (searchKeyword.value && filteredTreeData.value.length > 0) {
    nextTick(() => {
      expandAll()
    })
  }
}

const handleNodeClick = (data, node) => {
  selectedNodeId.value = data.nodeId
  selectedNodeData.value = data
  emit('node-select', data)
}

const handleNodeExpand = (data, node) => {
  if (!expandedNodes.value.includes(data.nodeId)) {
    expandedNodes.value.push(data.nodeId)
  }
}

const handleNodeCollapse = (data, node) => {
  const index = expandedNodes.value.indexOf(data.nodeId)
  if (index > -1) {
    expandedNodes.value.splice(index, 1)
  }
}

// 切换节点展开/收缩状态
const toggleNodeExpand = (node) => {
  if (node.expanded) {
    treeRef.value.store.nodesMap[node.key].collapse()
  } else {
    treeRef.value.store.nodesMap[node.key].expand()
  }
}

const handleNodeAction = async (command) => {
  const { action, node } = command
  
  switch (action) {
    case 'edit':
      emit('node-edit', node)
      break
      
    case 'copy':
      try {
        await copyWorkflowNode(node.nodeId)
        ElMessage.success('节点复制成功')
        refreshTree()
      } catch (error) {
        ElMessage.error('复制失败: ' + (error.message || '未知错误'))
      }
      break
      
    case 'toggle':
      try {
        const newStatus = node.isRun === 1 ? 0 : 1
        const updateData = {
          nodeId: node.nodeId,
          isRun: newStatus
        }
        
        await updateWorkflowNode(updateData)
        
        // 更新本地数据
        node.isRun = newStatus
        
        ElMessage.success(`节点已${newStatus === 1 ? '启用' : '禁用'}`)
        emit('node-toggle', node)
        refreshTree()
      } catch (error) {
        ElMessage.error('操作失败: ' + (error.message || '未知错误'))
      }
      break
      
    case 'delete':
      try {
        await ElMessageBox.confirm(
          `确定要删除节点 "${node.name}" 吗？\n删除后将无法恢复。`,
          '删除确认',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await delWorkflowNode(node.nodeId)
        ElMessage.success('删除成功')
        emit('node-delete', node)
        await loadTreeData()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败: ' + (error.message || '未知错误'))
        }
      }
      break
  }
}



// 切换节点展开/折叠
const toggleNode = (node) => {
  node.expanded = !node.expanded
}

// 检查是否有下一个兄弟节点
const hasNextSibling = (node, level) => {
  // 获取指定层级的祖先节点
  let currentNode = node
  for (let i = node.level; i > level; i--) {
    currentNode = currentNode.parent
  }
  
  if (!currentNode || !currentNode.parent) return false
  
  // 检查该层级的节点是否有后续兄弟节点
  const siblings = currentNode.parent.childNodes
  const currentIndex = siblings.indexOf(currentNode)
  return currentIndex < siblings.length - 1
}

// 关闭详情面板
const closeDetail = () => {
  selectedNodeId.value = null
  selectedNodeData.value = null
}

// 详情面板编辑事件
const handleDetailEdit = (nodeData) => {
  emit('node-edit', nodeData)
}

// 节点保存事件处理
const handleNodeSaved = (nodeData) => {
  console.log('Node saved, refreshing tree:', nodeData)
  refreshTree()
}

// 添加节点
const handleAddNode = (nodeData, node) => {
  // 存储 afterNodeId 用于排序，表示新节点要添加在哪个节点之后
  currentAddNodeData.value = { nodeData, node, afterNodeId: nodeData.nodeId }

  // 如果是任务类型节点，只能添加同级节点
  if (nodeData.type === 'task') {
    currentAddNodeType.value = 'sibling'
    showNodeTypeDialog.value = true
  } else {
    // 其他类型节点可以选择添加同级或子级
    showAddNodeDialog.value = true
  }
}

// 选择添加节点级别
const handleSelectAddLevel = (level) => {
  currentAddNodeType.value = level
  showAddNodeDialog.value = false
  showNodeTypeDialog.value = true
}

// 节点类型映射
const getNodeTypeFromSelection = (selection) => {
  const typeMap = {
    '分组类别': 'group',
    '条件分支': 'if',
    'ForEach循环': 'foreach',
    'For循环': 'for',
    '从接口导入': 'task',
    '从接口测试用例导入': 'task',
    '添加HTTP请求': 'task',
    '从CURL导入': 'task',
    '公共脚本': 'task',
    '自定义脚本': 'task',
    '数据库脚本': 'task',
    '等待时间': 'task',
    '从其他测试场景导入': 'task',
    '引用其他测试场景': 'task'
  }
  return typeMap[selection] || 'task'
}

// 计算新节点的排序值
const calculateSortNo = (parentNodeData, addType) => {
  // 获取有效排序值的辅助函数（排除sortNo为0的节点）
  const getMaxValidSortNo = (nodes) => {
    if (!nodes || nodes.length === 0) {
      return 0
    }
    
    // 过滤出sortNo大于0的节点
    const validSortNodes = nodes.filter(node => (node.sortNo || 0) > 0)
    
    if (validSortNodes.length === 0) {
      return 0
    }
    
    return Math.max(...validSortNodes.map(node => node.sortNo || 0))
  }
  
  if (addType === 'root') {
    // 根节点创建：查找所有根节点中sortNo大于0的最大排序值
    const rootNodes = treeData.value || []
    const maxSort = getMaxValidSortNo(rootNodes)
    return maxSort + 1
  } else if (addType === 'child') {
    // 子节点：查找父节点下sortNo大于0的最大排序值
    const children = parentNodeData.children || []
    const maxSort = getMaxValidSortNo(children)
    return maxSort + 1
  } else {
    // 同级节点：查找同级节点中sortNo大于0的最大排序值
    const parentId = parentNodeData.parentId
    let siblings = []
    
    if (parentId) {
      // 有父节点，查找父节点的所有子节点
      const findParentInTree = (nodes, targetParentId) => {
        for (const node of nodes) {
          if (node.nodeId === targetParentId) {
            return node.children || []
          }
          if (node.children) {
            const result = findParentInTree(node.children, targetParentId)
            if (result.length > 0) return result
          }
        }
        return []
      }
      siblings = findParentInTree(treeData.value, parentId)
    } else {
      // 根节点，查找所有根节点
      siblings = treeData.value
    }
    
    const maxSort = getMaxValidSortNo(siblings)
    return maxSort + 1
  }
}

// 获取父节点ID
const getParentNodeId = (nodeData, addType) => {
  if (addType === 'child') {
    // 子节点：当前节点作为父节点
    return nodeData.nodeId
  } else {
    // 同级节点：与当前节点同一个父节点
    return nodeData.parentId || null
  }
}

// 选择节点类型
const handleSelectNodeType = async (type) => {
  try {
    showNodeTypeDialog.value = false

    const { nodeData } = currentAddNodeData.value
    const addType = currentAddNodeType.value

    // 处理用例导入类型
    if (type === '从接口导入') {
      // 清空之前的选择
      selectedApiIds.value = []
      // 显示接口导入对话框
      showApiImportDialog.value = true
      return
    }

    // 处理测试用例导入类型
    if (type === '从接口测试用例导入') {
      // 设置导入类型和对话框标题
      currentImportType.value = 'test_case'
      caseImportDialogTitle.value = '从接口测试用例导入'

      // 清空之前的选择
      selectedCaseIds.value = []

      // 显示用例导入对话框
      showCaseImportDialog.value = true
      return
    }

    // 处理等待时间类型
    if (type === '等待时间') {
      showWaitTimeDialog.value = true
      return
    }

    // 处理自定义脚本类型
    if (type === '自定义脚本') {
      showCustomScriptDialog.value = true
      return
    }

    // 处理公共脚本类型
    if (type === '公共脚本') {
      showPublicScriptDialog.value = true
      return
    }

    // 处理数据库脚本类型
    if (type === '数据库脚本') {
      showDbOperationDialog.value = true
      return
    }

    // 处理添加HTTP请求类型 - 直接创建节点，不再弹窗
    if (type === '添加HTTP请求') {
      await createHttpRequestNode()
      return
    }

    // 处理从cURL导入类型
    if (type === '从CURL导入') {
      showCurlImportDialog.value = true
      return
    }

    // 获取节点类型
    const nodeType = getNodeTypeFromSelection(type)

    // 暂时跳过其他TASK类型节点的创建
    if (nodeType === 'task') {
      const actionText = addType === 'root' ? '根' : (addType === 'sibling' ? '同级' : '子级')
      ElMessage.info(`功能开发中: 添加${actionText}${type}节点`)
      // 重置数据
      currentAddNodeData.value = null
      currentAddNodeType.value = ''
      return
    }

    // 创建节点参数
    let newNodeParams
    if (addType === 'root') {
      // 根节点创建
      newNodeParams = {
        type: nodeType,
        sortNo: calculateSortNo(null, 'root'), // 根节点排序
        parentId: null, // 根节点没有父节点
        workflowId: props.workflowId,
        name: type, // 使用选择的类型作为默认名称
        isRun: 1, // 默认启用
        description: `新建的${type}节点`
      }
    } else {
      // 普通节点创建 - 添加 afterNodeId 参数
      const afterNodeId = currentAddNodeData.value?.afterNodeId || null
      newNodeParams = {
        type: nodeType,
        sortNo: calculateSortNo(nodeData, addType),
        parentId: getParentNodeId(nodeData, addType),
        workflowId: props.workflowId,
        name: type, // 使用选择的类型作为默认名称
        isRun: 1, // 默认启用
        description: `新建的${type}节点`,
        afterNodeId: afterNodeId // 表示新节点要添加在哪个节点之后
      }
    }

    console.log('Creating new node with params:', newNodeParams)

    // 调用接口创建节点
    await addWorkflowNode(newNodeParams)

    ElMessage.success(`${type}节点创建成功`)

    // 刷新树形结构
    refreshTree()

    // 成功后重置数据
    currentAddNodeData.value = null
    currentAddNodeType.value = ''

  } catch (error) {
    console.error('创建节点失败:', error)
    ElMessage.error('创建节点失败: ' + (error.message || '未知错误'))
    // 出错时重置数据
    currentAddNodeData.value = null
    currentAddNodeType.value = ''
  }
  // 注意：不在finally中重置数据，因为用例导入需要保留这些数据
}

// 复制节点
const handleCopyNode = async (nodeData) => {
  try {
    // 调用复制接口
    await copyWorkflowNode(nodeData.nodeId)
    ElMessage.success('节点复制成功')
    refreshTree()
  } catch (error) {
    ElMessage.error('复制失败: ' + (error.message || '未知错误'))
  }
}

// 切换节点启用/禁用状态
const handleToggleNodeStatus = async (nodeData) => {
  try {
    const newStatus = nodeData.isRun ? 0 : 1
    const updateData = {
      nodeId: nodeData.nodeId,
      isRun: newStatus
    }
    
    await updateWorknodes(updateData)
    
    // 更新本地数据
    nodeData.isRun = newStatus
    
    ElMessage.success(`节点已${newStatus === 1 ? '启用' : '禁用'}`)
    
    // 如果禁用节点，需要处理后续节点的置灰效果
    if (newStatus === 0) {
      updateSubsequentNodesStatus(nodeData, false)
    } else {
      updateSubsequentNodesStatus(nodeData, true)
    }
    
    refreshTree()
  } catch (error) {
    ElMessage.error('操作失败: ' + (error.message || '未知错误'))
  }
}

// 删除节点
const handleDeleteNode = async (nodeData) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除节点 "${nodeData.name}" 吗？\n删除后将无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 检查被删除的节点是否是当前选中的节点，或者是选中节点的祖先
    const shouldCloseDetail = selectedNodeId.value === nodeData.nodeId ||
      isDescendant(nodeData, { nodeId: selectedNodeId.value })

    // 使用DELETE方法删除节点
    await delWorknodes(nodeData.nodeId)
    ElMessage.success('删除成功')
    emit('node-delete', nodeData)

    // 如果删除的是当前选中的节点或其祖先，关闭右侧详情面板
    if (shouldCloseDetail) {
      closeDetail()
    }

    await loadTreeData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  }
}

// 创建根节点
const handleCreateRootNode = () => {
  // 设置为根节点创建模式
  currentAddNodeData.value = {
    nodeData: null, // 根节点没有父节点
    addType: 'root'
  }
  currentAddNodeType.value = 'root'
  
  // 直接显示节点类型选择对话框
  showNodeTypeDialog.value = true
}

// 获取节点类型对话框标题
const getNodeTypeDialogTitle = () => {
  const addType = currentAddNodeType.value
  if (addType === 'root') {
    return '选择根节点类型'
  } else if (addType === 'sibling') {
    return '选择同级节点类型'
  } else if (addType === 'child') {
    return '选择子节点类型'
  }
  return '选择节点类型'
}

// 处理用例选择变化
const handleCaseSelectionChange = (caseIds) => {
  selectedCaseIds.value = caseIds
}

// 处理接口选择变化
const handleApiSelectionChange = (apiIds) => {
  selectedApiIds.value = apiIds
}

// 确认导入用例
const handleConfirmImport = async () => {
  // 防止重复提交
  if (caseImportLoading.value) return

  try {
    if (selectedCaseIds.value.length === 0) {
      ElMessage.warning('请选择要导入的用例')
      return
    }

    // 检查必要的数据是否存在
    if (!currentAddNodeData.value) {
      ElMessage.error('导入数据丢失，请重新操作')
      showCaseImportDialog.value = false
      return
    }

    caseImportLoading.value = true

    const { nodeData } = currentAddNodeData.value
    const addType = currentAddNodeType.value

    // 创建节点参数
    // 从接口导入 -> api_case, 从测试用例导入 -> api_case
    let newNodeParams
    if (addType === 'root') {
      // 根节点创建
      newNodeParams = {
        type: 'task',
        sortNo: calculateSortNo(null, 'root'),
        parentId: null,
        workflowId: props.workflowId,
        caseIds: selectedCaseIds.value,
        config: {
          taskConfig: {
            taskType: 'api_case'
          }
        }
      }
    } else {
      // 普通节点创建 - 添加 afterNodeId 参数
      const afterNodeId = currentAddNodeData.value?.afterNodeId || null
      newNodeParams = {
        type: 'task',
        sortNo: calculateSortNo(nodeData, addType),
        parentId: getParentNodeId(nodeData, addType),
        workflowId: props.workflowId,
        caseIds: selectedCaseIds.value,
        config: {
          taskConfig: {
            taskType: 'api_case'
          }
        },
        afterNodeId: afterNodeId // 表示新节点要添加在哪个节点之后
      }
    }

    console.log('Creating task node with case import:', newNodeParams)

    // 调用接口创建节点
    await addWorkflowNode(newNodeParams)

    ElMessage.success(`成功导入 ${selectedCaseIds.value.length} 个用例`)

    // 关闭对话框
    showCaseImportDialog.value = false

    // 刷新树形结构
    refreshTree()

  } catch (error) {
    console.error('导入用例失败:', error)
    ElMessage.error('导入用例失败: ' + (error.message || '未知错误'))
  } finally {
    caseImportLoading.value = false
    // 重置数据
    currentAddNodeData.value = null
    currentAddNodeType.value = ''
    selectedCaseIds.value = []
    currentImportType.value = ''
  }
}

// 确认导入接口
const handleConfirmApiImport = async () => {
  // 防止重复提交
  if (apiImportLoading.value) return

  try {
    if (selectedApiIds.value.length === 0) {
      ElMessage.warning('请选择要导入的接口')
      return
    }

    // 检查必要的数据是否存在
    if (!currentAddNodeData.value) {
      ElMessage.error('导入数据丢失，请重新操作')
      showApiImportDialog.value = false
      return
    }

    apiImportLoading.value = true

    const { nodeData } = currentAddNodeData.value
    const addType = currentAddNodeType.value

    // 创建节点参数 - 使用 api_case 类型
    let newNodeParams
    if (addType === 'root') {
      // 根节点创建
      newNodeParams = {
        type: 'task',
        sortNo: calculateSortNo(null, 'root'),
        parentId: null,
        workflowId: props.workflowId,
        caseIds: selectedApiIds.value,
        config: {
          taskConfig: {
            taskType: 'api_case'
          }
        }
      }
    } else {
      // 普通节点创建 - 添加 afterNodeId 参数
      const afterNodeId = currentAddNodeData.value?.afterNodeId || null
      newNodeParams = {
        type: 'task',
        sortNo: calculateSortNo(nodeData, addType),
        parentId: getParentNodeId(nodeData, addType),
        workflowId: props.workflowId,
        caseIds: selectedApiIds.value,
        config: {
          taskConfig: {
            taskType: 'api_case'
          }
        },
        afterNodeId: afterNodeId // 表示新节点要添加在哪个节点之后
      }
    }

    console.log('Creating task node with api import:', newNodeParams)

    // 调用接口创建节点
    await addWorkflowNode(newNodeParams)

    ElMessage.success(`成功导入 ${selectedApiIds.value.length} 个接口`)

    // 关闭对话框
    showApiImportDialog.value = false

    // 刷新树形结构
    refreshTree()

  } catch (error) {
    console.error('导入接口失败:', error)
    ElMessage.error('导入接口失败: ' + (error.message || '未知错误'))
  } finally {
    apiImportLoading.value = false
    // 重置数据
    currentAddNodeData.value = null
    currentAddNodeType.value = ''
    selectedApiIds.value = []
  }
}

// ==================== 各类型节点弹窗确认处理 ====================

// 创建任务节点的通用方法
const createTaskNode = async (taskConfig, nodeName) => {
  try {
    const { nodeData } = currentAddNodeData.value || {}
    const addType = currentAddNodeType.value

    let newNodeParams
    if (addType === 'root') {
      newNodeParams = {
        type: 'task',
        sortNo: calculateSortNo(null, 'root'),
        parentId: null,
        workflowId: props.workflowId,
        name: nodeName,
        isRun: 1,
        config: { taskConfig }
      }
    } else {
      // 添加 afterNodeId 参数
      const afterNodeId = currentAddNodeData.value?.afterNodeId || null
      newNodeParams = {
        type: 'task',
        sortNo: calculateSortNo(nodeData, addType),
        parentId: getParentNodeId(nodeData, addType),
        workflowId: props.workflowId,
        name: nodeName,
        isRun: 1,
        config: { taskConfig },
        afterNodeId: afterNodeId // 表示新节点要添加在哪个节点之后
      }
    }

    console.log('Creating task node:', newNodeParams)
    await addWorkflowNode(newNodeParams)
    ElMessage.success(`${nodeName} 创建成功`)
    refreshTree()
  } catch (error) {
    console.error('创建节点失败:', error)
    ElMessage.error('创建节点失败: ' + (error.message || '未知错误'))
  } finally {
    currentAddNodeData.value = null
    currentAddNodeType.value = ''
  }
}

// 等待时间弹窗确认
const handleWaitTimeConfirm = async (data) => {
  await createTaskNode(
    { taskType: 'wait', waitTime: data.waitTime },
    data.name
  )
  showWaitTimeDialog.value = false
}

// 自定义脚本弹窗确认
const handleCustomScriptConfirm = async (data) => {
  await createTaskNode(
    { taskType: 'custom', customScript: data.customScript },
    data.name
  )
  showCustomScriptDialog.value = false
}

// 公共脚本弹窗确认
const handlePublicScriptConfirm = async (data) => {
  await createTaskNode(
    { taskType: 'public_script', publicscript: data.publicScript },
    data.name
  )
  showPublicScriptDialog.value = false
}

// 数据库脚本弹窗确认
const handleDbOperationConfirm = async (data) => {
  await createTaskNode(
    {
      taskType: 'db_operation',
      dbOperationId: data.dbOperationId,
      dbOperationScript: data.dbOperationScript
    },
    data.name
  )
  showDbOperationDialog.value = false
}

// HTTP请求节点直接创建（不再弹窗）
const createHttpRequestNode = async () => {
  try {
    const { nodeData } = currentAddNodeData.value || {}
    const addType = currentAddNodeType.value

    let newNodeParams
    if (addType === 'root') {
      newNodeParams = {
        name: 'HTTP请求',
        type: 'task',
        isRun: 1,
        config: {
          taskConfig: {
            taskType: 'api'
          }
        },
        sortNo: calculateSortNo(null, 'root'),
        parentId: null,
        workflowId: props.workflowId
      }
    } else {
      // 添加 afterNodeId 参数
      const afterNodeId = currentAddNodeData.value?.afterNodeId || null
      newNodeParams = {
        name: 'HTTP请求',
        type: 'task',
        isRun: 1,
        config: {
          taskConfig: {
            taskType: 'api'
          }
        },
        sortNo: calculateSortNo(nodeData, addType),
        parentId: getParentNodeId(nodeData, addType),
        workflowId: props.workflowId,
        afterNodeId: afterNodeId // 表示新节点要添加在哪个节点之后
      }
    }

    console.log('Creating HTTP request node:', newNodeParams)
    await addWorkflowNode(newNodeParams)
    ElMessage.success('HTTP请求节点创建成功')
    refreshTree()
  } catch (error) {
    console.error('创建节点失败:', error)
    ElMessage.error('创建节点失败: ' + (error.message || '未知错误'))
  } finally {
    currentAddNodeData.value = null
    currentAddNodeType.value = ''
  }
}

// cURL导入弹窗确认
const handleCurlImportConfirm = async (data) => {
  try {
    const { nodeData } = currentAddNodeData.value || {}
    const addType = currentAddNodeType.value

    let newNodeParams
    if (addType === 'root') {
      newNodeParams = {
        type: 'task',
        sortNo: calculateSortNo(null, 'root'),
        parentId: null,
        workflowId: props.workflowId,
        name: data.name,
        projectId: data.projectId,
        curlCommand: data.curlCommand,
        isRun: 1
      }
    } else {
      // 添加 afterNodeId 参数
      const afterNodeId = currentAddNodeData.value?.afterNodeId || null
      newNodeParams = {
        type: 'task',
        sortNo: calculateSortNo(nodeData, addType),
        parentId: getParentNodeId(nodeData, addType),
        workflowId: props.workflowId,
        name: data.name,
        projectId: data.projectId,
        curlCommand: data.curlCommand,
        isRun: 1,
        afterNodeId: afterNodeId // 表示新节点要添加在哪个节点之后
      }
    }

    console.log('Creating cURL import node:', newNodeParams)
    await addWorkflowNode(newNodeParams)
    ElMessage.success('cURL导入节点创建成功')
    refreshTree()
  } catch (error) {
    console.error('创建节点失败:', error)
    ElMessage.error('创建节点失败: ' + (error.message || '未知错误'))
  } finally {
    showCurlImportDialog.value = false
    currentAddNodeData.value = null
    currentAddNodeType.value = ''
  }
}

// ==================== 多选删除相关方法 ====================

// 检查节点是否被选中
const isNodeSelected = (nodeId) => {
  return selectedNodeIds.value.includes(nodeId)
}

// 获取所有节点ID（用于全选）
const getAllNodeIds = (nodes = treeData.value) => {
  const ids = []
  const traverse = (nodeList) => {
    nodeList.forEach(node => {
      ids.push(node.nodeId)
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(nodes)
  return ids
}

// 获取节点的所有子节点ID
const getChildNodeIds = (nodeData) => {
  const ids = []
  if (nodeData.children && nodeData.children.length > 0) {
    const traverse = (children) => {
      children.forEach(child => {
        ids.push(child.nodeId)
        if (child.children && child.children.length > 0) {
          traverse(child.children)
        }
      })
    }
    traverse(nodeData.children)
  }
  return ids
}

// 更新全选状态
const updateSelectAllState = () => {
  const allNodeIds = getAllNodeIds()
  const selectedCount = selectedNodeIds.value.length
  const totalCount = allNodeIds.length
  
  if (selectedCount === 0) {
    selectAll.value = false
    isIndeterminate.value = false
  } else if (selectedCount === totalCount) {
    selectAll.value = true
    isIndeterminate.value = false
  } else {
    selectAll.value = false
    isIndeterminate.value = true
  }
}

// 处理单个节点选择变化
const handleNodeSelectionChange = (nodeData, checked) => {
  if (checked) {
    // 选中节点：添加当前节点和所有子节点
    const nodeIds = [nodeData.nodeId, ...getChildNodeIds(nodeData)]
    nodeIds.forEach(id => {
      if (!selectedNodeIds.value.includes(id)) {
        selectedNodeIds.value.push(id)
      }
    })
  } else {
    // 取消选中：移除当前节点和所有子节点
    const nodeIds = [nodeData.nodeId, ...getChildNodeIds(nodeData)]
    selectedNodeIds.value = selectedNodeIds.value.filter(id => !nodeIds.includes(id))
  }
  
  updateSelectAllState()
}

// 处理全选/取消全选
const handleSelectAllChange = (checked) => {
  if (checked) {
    selectedNodeIds.value = getAllNodeIds()
  } else {
    selectedNodeIds.value = []
  }
  updateSelectAllState()
}

// 批量删除节点
const handleBatchDelete = async () => {
  if (selectedNodeIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的节点')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedNodeIds.value.length} 个节点吗？\n删除后将无法恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 检查当前选中显示详情的节点是否在被删除的列表中
    const shouldCloseDetail = selectedNodeId.value &&
      selectedNodeIds.value.includes(selectedNodeId.value)

    // 调用批量删除API
    await delWorkflowNodes(selectedNodeIds.value)

    ElMessage.success(`成功删除 ${selectedNodeIds.value.length} 个节点`)

    // 清空选择
    selectedNodeIds.value = []
    updateSelectAllState()

    // 如果删除的节点包含当前选中显示详情的节点，关闭右侧详情面板
    if (shouldCloseDetail) {
      closeDetail()
    }

    // 刷新树形结构
    await loadTreeData()

  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败: ' + (error.message || '未知错误'))
    }
  }
}

// 检查节点的祖先节点是否有禁用状态
const isAncestorDisabled = (nodeData) => {
  // 如果没有父节点，则不受祖先影响
  if (!nodeData.parentId) {
    return false
  }
  
  // 在整个树中查找父节点
  const findNodeInTree = (nodes, nodeId) => {
    for (const node of nodes) {
      if (node.nodeId === nodeId) {
        return node
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeInTree(node.children, nodeId)
        if (found) return found
      }
    }
    return null
  }
  
  const parentNode = findNodeInTree(treeData.value, nodeData.parentId)
  if (!parentNode) {
    return false
  }
  
  // 如果父节点被禁用，则当前节点应该被置灰
  if (parentNode.isRun === 0 || parentNode.isRun === false) {
    return true
  }
  
  // 递归检查父节点的祖先
  return isAncestorDisabled(parentNode)
}

// 检查节点是否应该显示为禁用状态（考虑自身状态和祖先状态）
const isNodeEffectivelyDisabled = (nodeData) => {
  // 如果祖先节点被禁用，则当前节点应该显示为禁用
  if (isAncestorDisabled(nodeData)) {
    return true
  }
  
  // 否则根据自身的isRun状态决定
  return nodeData.isRun === 0 || nodeData.isRun === false
}

// 更新后续节点的状态（用于禁用节点时的置灰效果）
const updateSubsequentNodesStatus = (currentNode, isEnabled) => {
  // 由于我们现在使用isNodeEffectivelyDisabled函数来自动计算层级禁用状态
  // 这个方法主要用于触发视图的重新渲染，确保所有子节点都能重新计算显示状态
  
  console.log(`更新节点 ${currentNode.nodeId} 及后续节点状态为: ${isEnabled ? '启用' : '禁用'}`)
  
  // 强制更新树组件，确保所有节点的CSS类都能重新计算
  nextTick(() => {
    if (treeRef.value) {
      // 通过更新treeData来触发重新渲染
      // 这样所有节点的isNodeEffectivelyDisabled状态都会重新计算
      treeData.value = [...treeData.value]
    }
  })
}

// 拖拽相关函数
// 判断是否允许拖拽
const allowDrag = (draggingNode) => {
  // 可以根据节点类型或其他条件来限制拖拽
  // 例如：某些特殊类型的节点不允许拖拽
  return true
}

// 判断是否允许放置
const allowDrop = (draggingNode, dropNode, type) => {
  // type: 'prev' | 'inner' | 'next'
  // prev: 放置在目标节点前面
  // inner: 放置在目标节点内部（作为子节点）
  // next: 放置在目标节点后面
  
  const dragData = draggingNode.data
  const dropData = dropNode.data
  
  // 不允许拖拽到自己
  if (dragData.nodeId === dropData.nodeId) {
    return false
  }
  
  // 处理inner类型拖拽（变成子节点）
  if (type === 'inner') {
    // 只有特定类型的节点可以接受子节点
    const supportChildrenTypes = ['if', 'else', 'for', 'foreach', 'group']
    
    // 检查目标节点是否支持子节点
    if (!supportChildrenTypes.includes(dropData.type)) {
      return false
    }
    
    // TASK类型节点不能接受子节点（TASK是最小执行单元）
    if (dropData.type === 'task') {
      return false
    }
    
    // 不允许拖拽到自己的子孙节点中（避免循环引用）
    if (isDescendant(dragData, dropData)) {
      return false
    }
    
    return true
  }
  
  // 处理prev/next类型拖拽（同级排序）
  // 不允许拖拽到自己的子孙节点的同级位置（避免循环引用）
  if (isDescendant(dragData, dropData)) {
    return false
  }
  
  // 允许子节点拖拽到父节点或祖先节点的同级位置
  // 允许在任何节点前后进行排序
  return true
}

// 检查descendant是否是ancestor的子孙节点
const isDescendant = (ancestor, descendant) => {
  if (!ancestor || !descendant) return false
  
  // 递归检查ancestor的所有子孙节点
  const checkInChildren = (node) => {
    if (!node.children || node.children.length === 0) return false
    
    // 检查直接子节点
    for (const child of node.children) {
      if (child.nodeId === descendant.nodeId) return true
      // 递归检查子节点的子节点
      if (checkInChildren(child)) return true
    }
    return false
  }
  
  return checkInChildren(ancestor)
}

// 处理节点拖拽放置
const handleNodeDrop = async (draggingNode, dropNode, dropType, ev) => {
  try {
    loading.value = true
    
    // 获取拖拽节点和目标节点的数据
    const dragData = draggingNode.data
    const dropData = dropNode.data
    
    console.log('拖拽操作:', {
      dragNode: dragData.name,
      dropNode: dropData.name,
      dropType: dropType
    })
    
    let updatedNodes = []
    
    if (dropType === 'inner') {
      // 层级变更：将拖拽节点变成目标节点的子节点
      updatedNodes = calculateHierarchyChange(dragData, dropData)
    } else {
      // 同级排序：在同一层级内调整顺序
      updatedNodes = calculateNewSort(dragData, dropData, dropType)
    }
    
    if (updatedNodes.length > 0) {
      // 调用API更新排序
      await updateNodesSort(updatedNodes)
      
      // 重新加载树数据
      await loadTreeData()
      
      const operationType = dropType === 'inner' ? '层级变更' : '节点排序'
      ElMessage.success(`${operationType}更新成功`)
    }
    
  } catch (error) {
    console.error('更新节点失败:', error)
    ElMessage.error('更新节点失败: ' + error.message)
    
    // 重新加载数据以恢复原始状态
    await loadTreeData()
  } finally {
    loading.value = false
  }
}

// 计算层级变更（将节点变成另一个节点的子节点）
const calculateHierarchyChange = (dragData, dropData) => {
  const updatedNodes = []
  
  // 1. 更新拖拽节点的parentId和sortNo
  const newParentId = dropData.nodeId
  const newParentChildren = getSiblingNodes(newParentId)
  
  // 计算新的sortNo，考虑sortNo为0节点的特殊处理
  let newSortNo
  if ((dragData.sortNo || 0) === 0) {
    newSortNo = 0 // 原本sortNo为0的节点保持为0
  } else {
    // 非0排序节点放在新父节点的子节点列表末尾（排除sortNo为0的节点）
    const nonZeroChildren = newParentChildren.filter(node => (node.sortNo || 0) !== 0)
    newSortNo = (nonZeroChildren.length + 1) * 10
  }
  
  updatedNodes.push({
    nodeId: dragData.nodeId,
    parentId: newParentId,
    sortNo: newSortNo,
    type: dragData.type
  })
  
  // 2. 重新计算原来同级节点的sortNo（填补空缺）
  const originalParentId = dragData.parentId
  const originalSiblings = getSiblingNodes(originalParentId).filter(node => node.nodeId !== dragData.nodeId)
  
  // 分离sortNo为0的节点和非0的节点
  const originalZeroSortNodes = originalSiblings.filter(node => (node.sortNo || 0) === 0)
  const originalNonZeroSortNodes = originalSiblings.filter(node => (node.sortNo || 0) !== 0)
  
  // 重新排序：非0排序节点在前，sortNo为0的节点在后
  const originalFinalOrder = [...originalNonZeroSortNodes, ...originalZeroSortNodes]
  
  originalFinalOrder.forEach((node, index) => {
    let newSortNo
    if ((node.sortNo || 0) === 0) {
      newSortNo = 0
    } else {
      newSortNo = (index + 1) * 10
    }
    
    if (node.sortNo !== newSortNo) {
      updatedNodes.push({
        nodeId: node.nodeId,
        parentId: node.parentId,
        sortNo: newSortNo,
        type: node.type
      })
    }
  })
  
  return updatedNodes
}

// 计算新的排序值（同级排序）
const calculateNewSort = (dragData, dropData, dropType) => {
  const updatedNodes = []
  
  // 获取目标位置的parentId
  const targetParentId = dropData.parentId
  
  // 获取目标父节点下的所有子节点
  const siblings = getSiblingNodes(targetParentId)
  
  // 移除拖拽的节点（如果它原本就在这个父节点下）
  const filteredSiblings = siblings.filter(node => node.nodeId !== dragData.nodeId)
  
  // 找到目标节点的位置
  const dropIndex = filteredSiblings.findIndex(node => node.nodeId === dropData.nodeId)
  
  // 根据放置类型确定插入位置
  let insertIndex = dropIndex
  if (dropType === 'next') {
    insertIndex = dropIndex + 1
  } else if (dropType === 'prev') {
    insertIndex = dropIndex
  }
  
  // 确保插入位置在有效范围内
  insertIndex = Math.max(0, Math.min(insertIndex, filteredSiblings.length))
  
  // 在指定位置插入拖拽节点，并更新其parentId
  const updatedDragData = { ...dragData, parentId: targetParentId }
  filteredSiblings.splice(insertIndex, 0, updatedDragData)
  
  // 重新计算所有同级节点的sortNo，特殊处理else节点
  const sortedSiblings = [...filteredSiblings]
  
  // 将sortNo为0的节点移到最后
  const zeroSortNodes = sortedSiblings.filter(node => (node.sortNo || 0) === 0)
  const nonZeroSortNodes = sortedSiblings.filter(node => (node.sortNo || 0) !== 0)
  
  // 重新排列：非0排序节点在前，sortNo为0的节点在后
  const finalOrder = [...nonZeroSortNodes, ...zeroSortNodes]
  
  finalOrder.forEach((node, index) => {
    let newSortNo
    if ((node.sortNo || 0) === 0 && node.nodeId !== dragData.nodeId) {
      // 原本sortNo为0的节点保持为0，但在显示时排在最后
      newSortNo = 0
    } else if (index < nonZeroSortNodes.length) {
      // 非0排序节点使用正常的排序值
      newSortNo = (index + 1) * 10
    } else {
      // 如果是拖拽到sortNo为0区域的节点，也设为0
      newSortNo = 0
    }
    
    if (node.sortNo !== newSortNo || node.nodeId === dragData.nodeId || node.parentId !== targetParentId) {
      updatedNodes.push({
        nodeId: node.nodeId,
        parentId: targetParentId,
        sortNo: newSortNo,
        type: node.type // 添加type参数
      })
    }
  })
  
  // 如果拖拽节点原来在不同的父节点下，需要重新计算原父节点下剩余节点的排序
  if (dragData.parentId && dragData.parentId !== targetParentId) {
    const originalSiblings = getSiblingNodes(dragData.parentId).filter(node => node.nodeId !== dragData.nodeId)
    
    // 重新排序原父节点下的剩余节点
    const originalZeroSortNodes = originalSiblings.filter(node => (node.sortNo || 0) === 0)
    const originalNonZeroSortNodes = originalSiblings.filter(node => (node.sortNo || 0) !== 0)
    const originalFinalOrder = [...originalNonZeroSortNodes, ...originalZeroSortNodes]
    
    originalFinalOrder.forEach((node, index) => {
      let newSortNo
      if ((node.sortNo || 0) === 0) {
        newSortNo = 0
      } else {
        newSortNo = (index + 1) * 10
      }
      
      if (node.sortNo !== newSortNo) {
        updatedNodes.push({
          nodeId: node.nodeId,
          parentId: node.parentId,
          sortNo: newSortNo,
          type: node.type
        })
      }
    })
  }
  
  return updatedNodes
}

// 获取同级节点
const getSiblingNodes = (parentId) => {
  const allNodes = []
  
  // 递归收集所有节点
  const collectNodes = (nodes) => {
    nodes.forEach(node => {
      allNodes.push(node)
      if (node.children && node.children.length > 0) {
        collectNodes(node.children)
      }
    })
  }
  
  collectNodes(treeData.value)
  
  // 过滤出同级节点并按sortNo排序
  return allNodes
    .filter(node => node.parentId === parentId)
    .sort((a, b) => (a.sortNo || 0) - (b.sortNo || 0))
}

// 检查是否是最后一个子节点
const isLastChild = (node) => {
  if (!node.parent) return false
  const siblings = node.parent.childNodes
  return siblings[siblings.length - 1] === node
}

// 详情面板宽度调节方法
const startResize = (e) => {
  isResizing.value = true
  startX.value = e.clientX
  startWidth.value = detailPanelWidth.value
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  
  e.preventDefault()
}

const handleResize = (e) => {
  if (!isResizing.value) return
  
  const deltaX = startX.value - e.clientX // 注意：向左拖拽是正值，向右拖拽是负值
  const newWidth = startWidth.value + deltaX
  
  // 限制宽度范围
  if (newWidth >= minPanelWidth && newWidth <= maxPanelWidth) {
    detailPanelWidth.value = newWidth
  }
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  
  // 保存宽度设置到localStorage
  localStorage.setItem('workflow-detail-panel-width', detailPanelWidth.value.toString())
}

const resetPanelWidth = () => {
  detailPanelWidth.value = 600 // 重置为默认宽度
  localStorage.setItem('workflow-detail-panel-width', '600')
}

const getNodeTypeLabel = (type) => {
  const typeMap = {
    'task': ' ',
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

// 获取任务子类型
const getTaskSubType = (nodeData) => {
  return nodeData?.config?.taskConfig?.taskType || null
}

// 获取任务子类型标签
const getTaskTypeLabel = (taskType) => {
  const typeMap = {
    'wait': '等待',
    'custom': '脚本',
    'public_script': '脚本',
    'db_operation': '数据库',
    'api_case': 'API用例',
    'api': 'API接口',
    'web_case': 'Web用例'
  }
  return typeMap[taskType] || taskType
}

// 获取任务子类型样式
const getTaskTypeTagType = (taskType) => {
  const typeMap = {
    'wait': 'info',
    'custom': 'warning',
    'public_script': 'success',
    'db_operation': 'danger',
    'api_case': 'primary',
    'api': 'primary',
    'web_case': 'success'
  }
  return typeMap[taskType] || 'default'
}

// 检测文本是否溢出（简化版本，基于文本长度）
const isTextOverflowing = (text) => {
  if (!text) return false
  // 基于节点宽度和字体大小估算，大约可以显示25-30个字符
  return text.length > 25
}

// 监听器
watch(() => props.workflowId, (newVal, oldVal) => {
  if (newVal && props.autoLoad) {
    // 如果是切换到不同的工作流，重置为首次加载状态
    if (newVal !== oldVal) {
      treeData.value = [] // 清空数据，触发首次加载逻辑
      selectedNodeId.value = null
      selectedNodeData.value = null
      isInitialLoad.value = true
    }
    loadTreeData()
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  if (props.workflowId && props.autoLoad) {
    loadTreeData()
  }

  // 恢复详情面板宽度设置
  const savedWidth = localStorage.getItem('workflow-detail-panel-width')
  if (savedWidth) {
    const width = parseInt(savedWidth)
    if (width >= minPanelWidth && width <= maxPanelWidth) {
      detailPanelWidth.value = width
    }
  }
})

// 暴露方法
defineExpose({
  loadTreeData,
  refreshTree,
  expandAll,
  collapseAll
})
</script>

<style scoped>
/* 导入拆分的样式文件 */
@import '../styles/workflow-node-tree-base.css';
@import '../styles/workflow-node-tree-toolbar.css';
@import '../styles/workflow-node-tree-nodes.css';
@import '../styles/workflow-node-tree-icons.css';
@import '../styles/workflow-node-tree-info.css';
@import '../styles/workflow-node-tree-actions.css';
@import '../styles/workflow-node-tree-responsive.css';
</style>