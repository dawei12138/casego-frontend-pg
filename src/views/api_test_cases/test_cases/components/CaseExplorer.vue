<template>
  <div class="case-explorer">
    <!-- 工具栏 -->
    <div class="explorer-header">
      <div class="header-title">
        <el-icon><FolderOpened /></el-icon>
        用例管理
      </div>
      <div class="header-actions">
        <el-tooltip content="新建用例组" placement="top">
          <el-button size="small" text @click="handleCreateGroup">
            <el-icon><FolderAdd /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="新建用例" placement="top">
          <el-button size="small" text @click="handleCreateCase">
            <el-icon><DocumentAdd /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="导入用例" placement="top">
          <el-button size="small" text @click="handleImport">
            <el-icon><Upload /></el-icon>
          </el-button>
        </el-tooltip>
        <el-dropdown @command="handleMoreActions">
          <el-button size="small" text>
            <el-icon><MoreFilled /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="export">导出用例</el-dropdown-item>
              <el-dropdown-item command="refresh">刷新</el-dropdown-item>
              <el-dropdown-item divided command="settings">设置</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="search-section">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用例..."
        size="small"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
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
        :current-node-key="currentNodeKey"
        node-key="id"
        highlight-current
        draggable
        :allow-drop="allowDrop"
        :allow-drag="allowDrag"
        @node-drop="handleNodeDrop"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <div class="tree-node" @mouseenter="handleNodeMouseEnter(data)" @mouseleave="handleNodeMouseLeave(data)">
            <div 
              v-if="hasChildren(data)"
              class="expand-icon"
              @click.stop="toggleNodeExpansion(node, data)"
            >
              <el-icon :class="{ 'is-expanded': node.expanded }">
                <CaretRight />
              </el-icon>
            </div>
            <div v-else class="expand-icon-placeholder"></div>

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
            
            <div 
              v-show="data.showActions" 
              class="node-hover-actions"
              @click.stop
              @mouseenter="handleNodeMouseEnter(data)"
              @mouseleave="handleActionMouseLeave(data)"
            >
              <template v-if="data.type === 'group'">
                <el-button
                  size="small"
                  text
                  type="primary"
                  class="hover-action-btn"
                  @click.stop="handleAddCaseInModule(data)"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>
                <el-dropdown 
                  @command="(command) => handleModuleDropdownAction(command, data)"
                  trigger="hover"
                  placement="bottom-start"
                  :hide-timeout="200"
                  @visible-change="(visible) => handleDropdownVisibleChange(visible, data)"
                >
                  <el-button
                    size="small"
                    text
                    class="hover-action-btn"
                    @click.stop
                  >
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="add-submodule">
                        <el-icon><FolderAdd /></el-icon>
                        新增子模块
                      </el-dropdown-item>
                      <el-dropdown-item command="rename">
                        <el-icon><Edit /></el-icon>
                        重命名
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" type="danger">
                        <el-icon><Delete /></el-icon>
                        删除模块
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
              
              <template v-else-if="data.type === 'case'">
                <el-button
                  size="small"
                  text
                  class="hover-action-btn"
                  @click.stop="handleEditCase(data)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button
                  size="small"
                  text
                  type="danger"
                  class="hover-action-btn"
                  @click.stop="handleDeleteCase(data)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </div>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- 底部统计信息 -->
    <div class="explorer-footer" v-if="statisticsData">
      <div class="statistics">
        <span>用例组: {{ statisticsData.groups }}</span>
        <span>用例: {{ statisticsData.cases }}</span>
      </div>
    </div>

    <!-- 导入类型选择对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入用例"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="import-type-selection">
        <div
          class="import-type-card"
          @click="handleSelectImportType('openapi')"
        >
          <div class="import-type-icon">
            <el-icon :size="32"><Document /></el-icon>
          </div>
          <div class="import-type-info">
            <div class="import-type-title">OpenAPI/Swagger</div>
            <div class="import-type-desc">导入 OpenAPI 3.0/3.1 或 Swagger 2.0 规范文件</div>
          </div>
          <el-icon class="import-type-arrow"><ArrowRight /></el-icon>
        </div>

        <div
          class="import-type-card"
          @click="handleSelectImportType('har')"
        >
          <div class="import-type-icon">
            <el-icon :size="32"><Monitor /></el-icon>
          </div>
          <div class="import-type-info">
            <div class="import-type-title">HAR 文件</div>
            <div class="import-type-desc">导入浏览器导出的 .har 网络请求文件</div>
          </div>
          <el-icon class="import-type-arrow"><ArrowRight /></el-icon>
        </div>

        <div
          class="import-type-card"
          @click="handleSelectImportType('curl')"
        >
          <div class="import-type-icon">
            <el-icon :size="32"><Promotion /></el-icon>
          </div>
          <div class="import-type-info">
            <div class="import-type-title">cURL 命令</div>
            <div class="import-type-desc">从浏览器复制的 cURL 命令快速创建接口</div>
          </div>
          <el-icon class="import-type-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </el-dialog>

    <!-- OpenAPI 导入对话框 -->
    <ImportOpenAPIDialog
      v-model:visible="openapiDialogVisible"
      :module-tree-options="moduleTreeOptions"
      @import-success="handleImportSuccess"
    />

    <!-- HAR 导入对话框 -->
    <ImportHARDialog
      v-model:visible="harDialogVisible"
      :module-tree-options="moduleTreeOptions"
      @import-success="handleImportSuccess"
    />

    <!-- cURL 导入对话框 -->
    <ImportCurlDialog
      v-model:visible="curlDialogVisible"
      @import-success="handleImportSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  FolderOpened,
  Folder,
  FolderAdd,
  DocumentAdd,
  Upload,
  UploadFilled,
  MoreFilled,
  Search,
  Edit,
  Delete,
  Plus,
  Loading,
  CaretRight,
  Document,
  ArrowRight,
  Monitor,
  Promotion
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  getTestCaseTree,
  addProjectSubmodule,
  updateProjectSubmodule,
  delProjectSubmodule,
  addTestCase,
  updateTestCase,
  delTestCase,
  getTestCase,
  transformTreeData,
  searchTreeData,
  getTreeStatistics,
  sortTestCase
} from '../composables/caseService'
import { sortProjectSubmodules } from '@/api/api_project_submodules/project_submodules'
import { useProjectStore } from '@/store/modules/project'
import ImportOpenAPIDialog from './ImportOpenAPIDialog.vue'
import ImportHARDialog from './ImportHARDialog.vue'
import ImportCurlDialog from './ImportCurlDialog.vue'
// 导入样式文件
import '../styles/case-explorer.css'

const globalState = inject('globalState')
const emit = defineEmits(['case-select', 'case-create', 'case-delete'])
const projectStore = useProjectStore()

const treeRef = ref()
const searchKeyword = ref('')
const expandedKeys = ref([])
const currentNodeKey = ref('')
const loading = ref(false)
const treeData = ref([])

// 导入相关状态
const importDialogVisible = ref(false)
const openapiDialogVisible = ref(false)
const harDialogVisible = ref(false)
const curlDialogVisible = ref(false)

// 添加防重复调用的状态
const isLoadingTree = ref(false)

// 获取当前项目ID
const getCurrentProjectId = () => {
  const projectId = projectStore.projectId
  if (!projectId) {
    ElMessage.error('请先选择项目')
    throw new Error('未选择项目')
  }
  return projectId
}

const treeProps = {
  children: 'children',
  label: 'name'
}

const hasChildren = (data) => {
  return data.children && data.children.length > 0
}

const toggleNodeExpansion = (node, data) => {
  node.expanded = !node.expanded
}

const handleNodeClick = (data, node, nodeComponent) => {
  currentNodeKey.value = data.id

  // 如果当前处于搜索状态，实现联动效果
  if (searchKeyword.value) {
    const clickedNodeId = data.id
    const clickedData = { ...data }

    // 1. 清空搜索条件
    searchKeyword.value = ''

    // 2. 等待树重新渲染后展开并定位到该节点
    nextTick(() => {
      // 获取该节点的所有父节点ID
      const parentIds = getNodeParentIds(clickedNodeId)

      // 3. 确保父节点都展开
      const newExpandedKeys = new Set(expandedKeys.value)
      parentIds.forEach(id => newExpandedKeys.add(id))
      expandedKeys.value = Array.from(newExpandedKeys)

      // 手动展开父节点
      parentIds.forEach(parentId => {
        const parentNode = treeRef.value?.getNode(parentId)
        if (parentNode && !parentNode.expanded) {
          parentNode.expanded = true
        }
      })

      // 4. 滚动到目标节点并高亮
      scrollToNodeAndHighlight(clickedNodeId)

      // 5. 如果是用例，触发选中事件
      if (clickedData.type === 'case') {
        emit('case-select', clickedData)
      }
    })
    return
  }

  if (data.type === 'group' && hasChildren(data)) {
    node.expanded = !node.expanded
  } else if (data.type === 'case') {
    if (treeRef.value) {
      treeRef.value.setCurrentKey(data.id)
    }
    emit('case-select', data)
  }
}

const saveExpandedState = () => {
  const treeComponent = treeRef.value
  if (treeComponent && treeComponent.store) {
    const expandedNodes = []
    const collectExpandedNodes = (nodes) => {
      nodes.forEach(node => {
        if (node.expanded) {
          expandedNodes.push(node.key)
        }
        if (node.childNodes && node.childNodes.length > 0) {
          collectExpandedNodes(node.childNodes)
        }
      })
    }
    collectExpandedNodes(treeComponent.store.root.childNodes)
    expandedKeys.value = expandedNodes
  }
}

const restoreExpandedStateAndFocus = (focusNodeId = null) => {
  if (!treeRef.value) return
  
  setTimeout(() => {
    if (expandedKeys.value.length > 0) {
      expandedKeys.value.forEach(key => {
        const node = treeRef.value.getNode(key)
        if (node) {
          node.expanded = true
        }
      })
    }
    
    if (focusNodeId) {
      setTimeout(() => {
        currentNodeKey.value = focusNodeId
        treeRef.value?.setCurrentKey(focusNodeId)
        
        const targetElement = document.querySelector(`[data-key="${focusNodeId}"]`)
        if (targetElement) {
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
        }
      }, 100)
    }
  }, 100)
}

// 修改 loadTreeData，添加防重复调用机制
const loadTreeData = async (showLoading = true, focusNodeId = null) => {
  // 防止重复调用
  if (isLoadingTree.value) {
    console.log('Tree is already loading, skipping duplicate call')
    return
  }

  isLoadingTree.value = true

  if (!showLoading && treeRef.value) {
    saveExpandedState()
  }
  
  if (showLoading) {
    loading.value = true
  }
  
  try {
    const response = await getTestCaseTree()
    
    if (response && response.code === 200) {
      const transformedData = transformTreeData(response)
      treeData.value = transformedData
      
      if (showLoading) {
        expandedKeys.value = transformedData.map(node => node.id)
      }
      
      restoreExpandedStateAndFocus(focusNodeId)

      // if (showLoading) {
      //   ElNotification({
      //     title: '加载成功',
      //     message: `已加载 ${response.rows?.length || 0} 个模块`,
      //     type: 'success',
      //     duration: 2000
      //   })
      // }
    } else {
      throw new Error(response?.msg || '未知错误')
    }
  } catch (error) {
    console.error('Failed to load tree data:', error)
    ElMessage.error(`加载用例树失败: ${error.message}`)
  } finally {
    loading.value = false
    isLoadingTree.value = false
  }
}

const filteredTreeData = computed(() => {
  if (!searchKeyword.value) {
    return treeData.value
  }
  return searchTreeData(treeData.value, searchKeyword.value)
})

const statisticsData = computed(() => {
  return getTreeStatistics(filteredTreeData.value)
})

// 用于导入对话框的模块树选项
const moduleTreeOptions = computed(() => {
  const convertToModuleTree = (nodes) => {
    return nodes
      .filter(node => node.type === 'group')
      .map(node => ({
        ...node,
        children: node.children ? convertToModuleTree(node.children) : []
      }))
  }
  return convertToModuleTree(treeData.value)
})

const handleNodeMouseEnter = (data) => {
  data.showActions = true
}

const handleNodeMouseLeave = (data) => {
  setTimeout(() => {
    if (!data.dropdownVisible) {
      data.showActions = false
    }
  }, 100)
}

const handleActionMouseLeave = (data) => {
  setTimeout(() => {
    if (!data.dropdownVisible) {
      data.showActions = false
    }
  }, 100)
}

const handleDropdownVisibleChange = (visible, data) => {
  data.dropdownVisible = visible
  if (!visible) {
    setTimeout(() => {
      data.showActions = false
    }, 100)
  }
}

// 获取节点的所有父节点ID（用于展开路径）
const getNodeParentIds = (nodeId) => {
  const findParents = (nodes, targetId, ancestors = []) => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return ancestors
      }
      if (node.children && node.children.length > 0) {
        const result = findParents(node.children, targetId, [...ancestors, node.id])
        if (result !== null) {
          return result
        }
      }
    }
    return null
  }
  return findParents(treeData.value, nodeId) || []
}

// 滚动到指定节点并高亮
const scrollToNodeAndHighlight = (nodeId) => {
  nextTick(() => {
    if (!treeRef.value) return

    // 设置当前高亮节点
    currentNodeKey.value = nodeId
    treeRef.value.setCurrentKey(nodeId)

    // 尝试滚动到节点位置
    nextTick(() => {
      const treeEl = treeRef.value?.$el
      if (!treeEl) return

      // 查找高亮的节点元素
      const currentNode = treeEl.querySelector('.el-tree-node.is-current')
      if (currentNode) {
        // 滚动到节点位置，使其在容器中居中显示
        const container = treeEl.closest('.tree-container')
        if (container) {
          const nodeRect = currentNode.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          const scrollTop = container.scrollTop + (nodeRect.top - containerRect.top) - containerRect.height / 2 + nodeRect.height / 2
          container.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          })
        }
      }
    })
  })
}

const handleSearch = (value) => {
  if (value) {
    const getAllNodeIds = (nodes) => {
      const ids = []
      nodes.forEach(node => {
        ids.push(node.id)
        if (node.children) {
          ids.push(...getAllNodeIds(node.children))
        }
      })
      return ids
    }
    expandedKeys.value = getAllNodeIds(filteredTreeData.value)
  }
}

const handleAddCaseInModule = async (moduleData) => {
  try {
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

    const caseData = {
      name: caseName,
      method: 'GET',
      parent_submodule_id: moduleData.moduleId,
      caseType: "1",
      projectId: getCurrentProjectId()
    }
    
    const response = await addTestCase(caseData)
    
    if (response && response.code === 200) {
      ElMessage.success('创建用例成功')
      
      const newCaseNodeId = `case_${response.caseId}`
      await loadTreeData(false, newCaseNodeId)
      
      const newCaseId = response.caseId
      if (newCaseId) {
        try {
          const caseDetailResponse = await getTestCase(newCaseId)
          if (caseDetailResponse && caseDetailResponse.code === 200) {
            const caseDetail = caseDetailResponse.data
            
            const completeData = {
              ...caseDetail,
              id: newCaseNodeId,
              type: 'case',
              apiType: 'case'
            }
            
            emit('case-select', completeData)
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
  }
}

const handleModuleDropdownAction = async (command, moduleData) => {
  switch (command) {
    case 'add-submodule':
      await handleAddSubModule(moduleData)
      break
    case 'rename':
      await handleRenameModule(moduleData)
      break
    case 'delete':
      await handleDeleteModule(moduleData)
      break
  }
}

const handleAddSubModule = async (parentModule) => {
  try {
    const { value: moduleName } = await ElMessageBox.prompt(
      '请输入子模块名称',
      '新建子模块',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '模块名称不能为空'
      }
    )

    const moduleData = {
      name: moduleName,
      parentId: parentModule.moduleId,
      projectId: getCurrentProjectId()
    }
    
    const response = await addProjectSubmodule(moduleData)
    
    if (response && response.code === 200 && response.moduleId) {
      ElMessage.success('创建子模块成功')
      const newModuleNodeId = `module_${response.moduleId}`
      await loadTreeData(false, newModuleNodeId)
    } else {
      ElMessage.success('创建子模块成功')
      await loadTreeData(false, parentModule.id)
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建子模块失败:', error)
      ElMessage.error(`创建子模块失败: ${error.message}`)
    }
  }
}

const handleRenameModule = async (moduleData) => {
  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入新的模块名称',
      '重命名模块',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: moduleData.name,
        inputPattern: /\S+/,
        inputErrorMessage: '名称不能为空'
      }
    )
    
    await updateProjectSubmodule({
      id: moduleData.moduleId,
      name: newName
    })
    
    ElMessage.success('重命名成功')
    await loadTreeData(false, moduleData.id)
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重命名失败:', error)
      ElMessage.error(`重命名失败: ${error.message}`)
    }
  }
}

const handleDeleteModule = async (moduleData) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模块 "${moduleData.name}" 吗？删除模块会同时删除其下所有用例。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )
    
    await delProjectSubmodule(moduleData.moduleId)
    ElMessage.success('删除成功')
    
    emit('case-delete', moduleData.id)
    await loadTreeData(false)
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(`删除失败: ${error.message}`)
    }
  }
}

const handleEditCase = async (caseData) => {
  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入新的用例名称',
      '重命名用例',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: caseData.name,
        inputPattern: /\S+/,
        inputErrorMessage: '名称不能为空'
      }
    )
    
    await updateTestCase({
      caseId: caseData.caseId,
      name: newName
    })
    
    ElMessage.success('重命名成功')
    await loadTreeData(false, caseData.id)
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重命名失败:', error)
      ElMessage.error(`重命名失败: ${error.message}`)
    }
  }
}

const handleDeleteCase = async (caseData) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用例 "${caseData.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await delTestCase(caseData.caseId)
    ElMessage.success('删除成功')
    
    emit('case-delete', caseData.id)
    await loadTreeData(false)
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(`删除失败: ${error.message}`)
    }
  }
}

const handleCreateGroup = async () => {
  try {
    const { value: groupName } = await ElMessageBox.prompt(
      '请输入模块名称',
      '新建模块',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '模块名称不能为空'
      }
    )

    const moduleData = {
      name: groupName,
      parentId: null,
      projectId: getCurrentProjectId()
    }

    await addProjectSubmodule(moduleData)
    ElMessage.success('创建模块成功')
    loadTreeData(false)
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`创建模块失败: ${error.message}`)
    }
  }
}

const handleCreateCase = async () => {
  try {
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

    const caseData = {
      name: caseName,
      method: 'GET',
      moduleId: null,
      caseType: "1",
      projectId: getCurrentProjectId()
    }
    
    const response = await addTestCase(caseData)
    if (response && response.code === 200) {
      ElMessage.success('创建用例成功')
      
      const newCaseNodeId = `case_${response.caseId}`
      await loadTreeData(false, newCaseNodeId)
      
      const newCaseId = response.caseId
      if (newCaseId) {
        try {
          const caseDetailResponse = await getTestCase(newCaseId)
          if (caseDetailResponse && caseDetailResponse.code === 200) {
            const completeData = {
              ...caseDetailResponse.data,
              id: newCaseNodeId,
              type: 'case',
              apiType: 'case'
            }
            emit('case-select', completeData)
          }
        } catch (detailError) {
          console.error('获取新建用例详情失败:', detailError)
        }
      }
    } else {
      throw new Error(response?.msg || '创建用例失败')
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`创建用例失败: ${error.message}`)
    }
  }
}

const handleImport = () => {
  importDialogVisible.value = true
}

// 选择导入类型
const handleSelectImportType = (type) => {
  importDialogVisible.value = false
  if (type === 'openapi') {
    openapiDialogVisible.value = true
  } else if (type === 'har') {
    harDialogVisible.value = true
  } else if (type === 'curl') {
    curlDialogVisible.value = true
  }
}

// 导入成功回调
const handleImportSuccess = async (data) => {
  const caseId = data?.caseId

  // 如果有 caseId，加载树后打开并聚焦到该用例
  if (caseId) {
    const newCaseNodeId = `case_${caseId}`
    await loadTreeData(false, newCaseNodeId)

    // 获取用例详情并选中
    try {
      const caseDetailResponse = await getTestCase(caseId)
      if (caseDetailResponse && caseDetailResponse.code === 200) {
        const caseDetail = caseDetailResponse.data
        const completeData = {
          ...caseDetail,
          id: newCaseNodeId,
          type: 'case',
          apiType: 'api'
        }
        emit('case-select', completeData)
      }
    } catch (error) {
      console.error('获取用例详情失败:', error)
    }
  } else {
    await loadTreeData(false)
  }
}

const handleMoreActions = async (command) => {
  switch (command) {
    case 'export':
      ElMessage.info('导出功能开发中...')
      break
    case 'refresh':
      await loadTreeData()
      ElMessage.success('刷新成功')
      break
    case 'settings':
      ElMessage.info('设置功能开发中...')
      break
  }
}

// 拖拽相关函数
// 判断节点是否允许被拖拽
const allowDrag = (draggingNode) => {
  const data = draggingNode.data
  // 模块和用例都允许拖拽
  return data.type === 'group' || data.type === 'case'
}

// 判断节点是否允许放置
const allowDrop = (draggingNode, dropNode, type) => {
  const draggingData = draggingNode.data
  const dropData = dropNode.data

  // 模块节点拖拽
  if (draggingData.type === 'group') {
    // 模块只能拖到其他模块的前后，或放到其他模块内部（作为子模块）
    if (dropData.type === 'group') {
      return true // 可以放在前后，也可以放到内部
    }
    // 不能拖到用例节点
    return false
  }

  // 接口节点（apiType === 'api'）
  if (draggingData.type === 'case' && draggingData.apiType === 'api') {
    // 接口可以拖到模块下
    if (dropData.type === 'group') {
      return type === 'inner' // 只能放到模块内部
    }
    // 接口可以与同类型的接口同级拖拽
    if (dropData.type === 'case' && dropData.apiType === 'api') {
      return type !== 'inner' // 可以放在前后，不能放到内部
    }
    // 不能拖到用例节点
    return false
  }

  // 用例节点（apiType === 'case'）
  if (draggingData.type === 'case' && draggingData.apiType === 'case') {
    // 用例只能拖到接口下
    if (dropData.type === 'case' && dropData.apiType === 'api') {
      return type === 'inner' // 只能放到接口内部
    }
    // 用例可以与同级用例拖拽
    if (dropData.type === 'case' && dropData.apiType === 'case') {
      // 确保它们有相同的父节点（都在同一个接口下）
      return type !== 'inner' // 可以放在前后，不能放到内部
    }
    // 不能拖到模块节点
    return false
  }

  return false
}

// 处理拖拽结束
const handleNodeDrop = async (draggingNode, dropNode, dropType, ev) => {
  try {
    const draggingData = draggingNode.data
    const dropData = dropNode.data

    // 处理模块拖拽排序
    if (draggingData.type === 'group') {
      let affectedModules = []
      let parentModuleId = null

      if (dropType === 'inner') {
        // 放到另一个模块内部（作为子模块）
        parentModuleId = dropData.moduleId
        affectedModules = dropNode.childNodes
          .filter(node => node.data.type === 'group')
          .map((node, index) => ({
            id: node.data.moduleId,
            sortNo: index + 1,
            parentId: parentModuleId
          }))
      } else {
        // 放到节点前后（同级）
        const parentNode = dropNode.parent
        if (parentNode) {
          const parentData = parentNode.data

          if (parentData && parentData.type === 'group') {
            // 父节点是模块
            parentModuleId = parentData.moduleId
          }

          affectedModules = parentNode.childNodes
            .filter(node => node.data.type === 'group')
            .map((node, index) => ({
              id: node.data.moduleId,
              sortNo: index + 1,
              parentId: parentModuleId
            }))
        }
      }

      // 调用模块排序API
      const response = await sortProjectSubmodules(affectedModules)

      if (response && response.code === 200) {
        ElMessage.success('模块排序成功')
        // 刷新树数据，保持当前节点选中
        await loadTreeData(false, draggingData.id)
      } else {
        throw new Error(response?.msg || '模块排序失败')
      }
      return
    }

    // 处理用例拖拽排序（原有逻辑）
    // 收集所有受影响的节点
    let affectedCases = []
    let parentCaseId = null
    let parentSubmoduleId = null

    if (dropType === 'inner') {
      // 放到节点内部
      if (dropData.type === 'group') {
        // 拖到模块下 - 接口类型需要 parent_submodule_id
        parentSubmoduleId = dropData.moduleId
        affectedCases = dropNode.childNodes
          .filter(node => node.data.type === 'case')
          .map((node, index) => ({
            caseId: node.data.caseId,
            sortNo: index + 1,
            parent_submodule_id: parentSubmoduleId
          }))
      } else if (dropData.type === 'case' && dropData.apiType === 'api') {
        // 拖到接口下 - 用例类型需要 parent_case_id
        parentCaseId = dropData.caseId
        affectedCases = dropNode.childNodes
          .filter(node => node.data.type === 'case')
          .map((node, index) => ({
            caseId: node.data.caseId,
            sortNo: index + 1,
            parent_case_id: parentCaseId
          }))
      }
    } else {
      // 放到节点前后（同级）
      const parentNode = dropNode.parent
      if (parentNode) {
        // 获取父节点的数据
        const parentData = parentNode.data

        if (parentData) {
          // 有具体的父节点
          if (parentData.type === 'group') {
            // 父节点是模块
            parentSubmoduleId = parentData.moduleId
            affectedCases = parentNode.childNodes
              .filter(node => node.data.type === 'case')
              .map((node, index) => ({
                caseId: node.data.caseId,
                sortNo: index + 1,
                parent_submodule_id: parentSubmoduleId
              }))
          } else if (parentData.type === 'case' && parentData.apiType === 'api') {
            // 父节点是接口
            parentCaseId = parentData.caseId
            affectedCases = parentNode.childNodes
              .filter(node => node.data.type === 'case')
              .map((node, index) => ({
                caseId: node.data.caseId,
                sortNo: index + 1,
                parent_case_id: parentCaseId
              }))
          }
        } else {
          // 根节点，没有父节点
          affectedCases = parentNode.childNodes
            .filter(node => node.data.type === 'case')
            .map((node, index) => ({
              caseId: node.data.caseId,
              sortNo: index + 1
            }))
        }
      }
    }

    // 调用排序API - 直接传数组
    const response = await sortTestCase(affectedCases)

    if (response && response.code === 200) {
      ElMessage.success('排序成功')
      // 刷新树数据，保持当前节点选中
      await loadTreeData(false, draggingData.id)
    } else {
      throw new Error(response?.msg || '排序失败')
    }
  } catch (error) {
    console.error('拖拽排序失败:', error)
    ElMessage.error(`排序失败: ${error.message}`)
    // 失败时刷新树以恢复原状态
    await loadTreeData(false)
  }
}

// 事件监听器清理函数
let eventListenersRegistered = false

onMounted(() => {
  loadTreeData()
  
  // 确保事件监听器只注册一次
  if (!eventListenersRegistered && globalState && globalState.eventBus) {
    globalState.eventBus.on('create-new-case', handleCreateCase)
    globalState.eventBus.on('refresh-tree', () => loadTreeData())
    globalState.eventBus.on('open-import-dialog', handleImport)

    // 修改复制用例后的刷新逻辑，去除多余的成功提示
    globalState.eventBus.on('refresh-tree-after-copy', async (copyData) => {
      console.log('Handling refresh-tree-after-copy event:', copyData)
      
      // 保存当前展开状态
      saveExpandedState()
      
      const moduleIdToExpand = copyData.moduleId
      const expandKeys = [...expandedKeys.value]
      
      if (moduleIdToExpand) {
        const moduleNodeId = `module_${moduleIdToExpand}`
        if (!expandKeys.includes(moduleNodeId)) {
          expandKeys.push(moduleNodeId)
        }
      }
      
      expandedKeys.value = expandKeys
      
      // 静默刷新，不显示成功消息
      await loadTreeData(false)
      
      // 展开对应层级
      setTimeout(() => {
        if (moduleIdToExpand) {
          const moduleNodeId = `module_${moduleIdToExpand}`
          const node = treeRef.value?.getNode(moduleNodeId)
          if (node && !node.expanded) {
            node.expanded = true
          }
          
          const targetElement = document.querySelector(`[data-key="${moduleNodeId}"]`)
          if (targetElement) {
            targetElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            })
          }
        }
      }, 300)
    })

    eventListenersRegistered = true
  }
})

onBeforeUnmount(() => {
  // 清理事件监听器
  if (eventListenersRegistered && globalState && globalState.eventBus) {
    globalState.eventBus.off('create-new-case', handleCreateCase)
    globalState.eventBus.off('refresh-tree', () => loadTreeData())
    globalState.eventBus.off('refresh-tree-after-copy')
    globalState.eventBus.off('open-import-dialog', handleImport)
    eventListenersRegistered = false
  }
})

watch(treeData, (newData) => {
  globalState.caseTree.value = newData
}, { deep: true, immediate: true })
</script>