<template>
  <div class="workflow-explorer">
    <!-- 工具栏 -->
    <div class="explorer-header">
      <div class="header-title">
        <el-icon><FolderOpened /></el-icon>
        <span>工作流管理</span>
      </div>
      <div class="header-actions">
        <el-tooltip content="新建工作流" placement="bottom">
          <el-button size="small" type="primary" @click="handleCreateWorkflow" circle>
            <el-icon><DocumentAdd /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="新建分组" placement="bottom">
          <el-button size="small" @click="handleCreateGroup" circle>
            <el-icon><FolderAdd /></el-icon>
          </el-button>
        </el-tooltip>
        <el-dropdown @command="handleMoreActions" trigger="click">
          <el-tooltip content="更多操作" placement="bottom">
            <el-button size="small" circle>
              <el-icon><MoreFilled /></el-icon>
            </el-button>
          </el-tooltip>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="refresh">
                <el-icon><Refresh /></el-icon>
                刷新列表
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="search-section">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索工作流..."
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
              <el-icon v-if="data.type === 'module'" class="folder-icon">
                <Folder v-if="!node.expanded" />
                <FolderOpened v-else />
              </el-icon>
              <div v-else-if="data.type === 'workflow'" class="workflow-icon-container">
                <div class="workflow-badge">
                  <el-icon class="workflow-icon"><Connection /></el-icon>
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
              <template v-if="data.type === 'module'">
                <el-tooltip content="添加工作流" placement="top">
                  <el-button
                    size="small"
                    text
                    type="primary"
                    class="hover-action-btn"
                    @click.stop="handleAddWorkflowInModule(data)"
                  >
                    <el-icon><Plus /></el-icon>
                  </el-button>
                </el-tooltip>
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
                      <el-dropdown-item command="delete" divided>
                        <el-icon color="#f56c6c"><Delete /></el-icon>
                        <span style="color: #f56c6c">删除模块</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>

              <template v-else-if="data.type === 'workflow'">
                <el-tooltip content="编辑" placement="top">
                  <el-button
                    size="small"
                    text
                    class="hover-action-btn"
                    @click.stop="handleEditWorkflow(data)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button
                    size="small"
                    text
                    type="danger"
                    class="hover-action-btn"
                    @click.stop="handleDeleteWorkflow(data)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-tooltip>
              </template>
            </div>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- 底部统计 -->
    <div class="explorer-footer">
      <div class="statistics">
        <span>模块: {{ statisticsData.moduleCount }}</span>
        <span>工作流: {{ statisticsData.workflowCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount, watch } from 'vue'
import { eventBus } from '@/utils/eventBus'
import {
  FolderOpened,
  Folder,
  FolderAdd,
  DocumentAdd,
  MoreFilled,
  Search,
  Edit,
  Delete,
  Plus,
  Loading,
  CaretRight,
  Refresh,
  Connection
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  getWorkflowTree,
  addWorkflowModule,
  updateWorkflowModule,
  delWorkflowModule,
  addWorkflow,
  updateWorkflow,
  delWorkflow,
  transformWorkflowTreeData,
  searchWorkflowTreeData,
  getWorkflowTreeStatistics
} from '../api/workflow'
import { useProjectStore } from '@/store/modules/project'
// 导入样式文件
import '../styles/workflow-explorer.css'

const globalState = inject('globalState')
const emit = defineEmits(['workflow-select', 'workflow-create', 'workflow-delete'])
const projectStore = useProjectStore()

const treeRef = ref()
const searchKeyword = ref('')
const expandedKeys = ref([])
const currentNodeKey = ref('')
const loading = ref(false)
const treeData = ref([])

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
  
  if (data.type === 'module' && hasChildren(data)) {
    node.expanded = !node.expanded
  } else if (data.type === 'workflow') {
    if (treeRef.value) {
      treeRef.value.setCurrentKey(data.id)
    }
    emit('workflow-select', data)
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
    const response = await getWorkflowTree()
    
    if (response && response.code === 200) {
      const transformedData = transformWorkflowTreeData(response.rows)
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
    ElMessage.error(`加载工作流树失败: ${error.message}`)
  } finally {
    loading.value = false
    isLoadingTree.value = false
  }
}

const filteredTreeData = computed(() => {
  if (!searchKeyword.value) {
    return treeData.value
  }
  return searchWorkflowTreeData(treeData.value, searchKeyword.value)
})

const statisticsData = computed(() => {
  return getWorkflowTreeStatistics(filteredTreeData.value)
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

const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
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
      parentId: null  // 一级节点 parentId 为 null
    }

    const response = await addWorkflowModule(moduleData)
    if (response && response.code === 200) {
      ElMessage.success('创建模块成功')
      const newModuleNodeId = response.moduleId ? `module_${response.moduleId}` : null
      await loadTreeData(false, newModuleNodeId)
    } else {
      throw new Error(response?.msg || '创建模块失败')
    }

  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建模块失败:', error)
      ElMessage.error(`创建模块失败: ${error.message}`)
    }
  }
}

const handleCreateWorkflow = async () => {
  try {
    const { value: workflowName } = await ElMessageBox.prompt(
      '请输入工作流名称',
      '新建工作流',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '工作流名称不能为空'
      }
    )

    const workflowData = {
      name: workflowName,
      parent_submodule_id: null,  // 顶级工作流没有父模块
      projectId: getCurrentProjectId()
    }

    const response = await addWorkflow(workflowData)
    if (response && response.code === 200) {
      ElMessage.success('创建工作流成功')
      const newWorkflowNodeId = response.workflowId ? `workflow_${response.workflowId}` : null
      await loadTreeData(false, newWorkflowNodeId)

      // 选中新创建的工作流
      if (response.workflowId) {
        const newWorkflowData = {
          id: newWorkflowNodeId,
          workflowId: response.workflowId,
          name: workflowName,
          type: 'workflow'
        }
        emit('workflow-select', newWorkflowData)
      }
    } else {
      throw new Error(response?.msg || '创建工作流失败')
    }

  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建工作流失败:', error)
      ElMessage.error(`创建工作流失败: ${error.message}`)
    }
  }
}

const handleImport = () => {
  ElMessage.info('导入功能开发中...')
}

const handleMoreActions = (command) => {
  switch (command) {
    case 'import':
      ElMessage.info('导入功能开发中...')
      break
    case 'export':
      ElMessage.info('导出功能开发中...')
      break
    case 'refresh':
      loadTreeData(true)
      break
    case 'settings':
      ElMessage.info('设置功能开发中...')
      break
  }
}

const handleAddWorkflowInModule = async (data) => {
  try {
    const { value: workflowName } = await ElMessageBox.prompt(
      '请输入工作流名称',
      '新建工作流',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '工作流名称不能为空'
      }
    )

    const workflowData = {
      name: workflowName,
      parent_submodule_id: data.moduleId,  // 传入父模块ID
      projectId: getCurrentProjectId()
    }

    const response = await addWorkflow(workflowData)
    if (response && response.code === 200) {
      ElMessage.success('创建工作流成功')
      const newWorkflowNodeId = response.workflowId ? `workflow_${response.workflowId}` : null
      await loadTreeData(false, newWorkflowNodeId)

      // 选中新创建的工作流
      if (response.workflowId) {
        const newWorkflowData = {
          id: newWorkflowNodeId,
          workflowId: response.workflowId,
          name: workflowName,
          type: 'workflow',
          moduleId: data.moduleId
        }
        emit('workflow-select', newWorkflowData)
      }
    } else {
      throw new Error(response?.msg || '创建工作流失败')
    }

  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建工作流失败:', error)
      ElMessage.error(`创建工作流失败: ${error.message}`)
    }
  }
}

const handleModuleDropdownAction = async (command, data) => {
  switch (command) {
    case 'add-submodule':
      await handleAddSubModule(data)
      break
    case 'rename':
      await handleRenameModule(data)
      break
    case 'delete':
      await handleDeleteModule(data)
      break
  }
}

// 新增子模块
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
      parentId: parentModule.moduleId  // 传入父模块ID
    }

    const response = await addWorkflowModule(moduleData)
    if (response && response.code === 200) {
      ElMessage.success('创建子模块成功')
      const newModuleNodeId = response.moduleId ? `module_${response.moduleId}` : null
      await loadTreeData(false, newModuleNodeId || parentModule.id)
    } else {
      throw new Error(response?.msg || '创建子模块失败')
    }

  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建子模块失败:', error)
      ElMessage.error(`创建子模块失败: ${error.message}`)
    }
  }
}

const handleRenameModule = async (data) => {
  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入新的模块名称',
      '重命名模块',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: data.name,
        inputPattern: /\S+/,
        inputErrorMessage: '模块名称不能为空'
      }
    )

    if (newName && newName.trim() !== data.name) {
      await updateWorkflowModule({
        id: data.moduleId,  // 使用 id 参数
        name: newName.trim()
      })

      ElMessage.success('重命名成功')
      await loadTreeData(false, data.id)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Rename module failed:', error)
      ElMessage.error('重命名失败: ' + (error.message || '未知错误'))
    }
  }
}

const handleDeleteModule = async (data) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模块 "${data.name}" 吗？此操作将同时删除该模块下的所有工作流。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await delWorkflowModule(data.moduleId)
    ElMessage.success('模块删除成功')
    loadTreeData(false)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete module failed:', error)
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  }
}

const handleEditWorkflow = async (data) => {
  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入新的工作流名称',
      '重命名工作流',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: data.name,
        inputPattern: /\S+/,
        inputErrorMessage: '工作流名称不能为空'
      }
    )

    if (newName && newName.trim() !== data.name) {
      await updateWorkflow({
        workflowId: data.workflowId,
        name: newName.trim()
      })

      ElMessage.success('重命名成功')
      await loadTreeData(false, data.id)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Edit workflow failed:', error)
      ElMessage.error('重命名失败: ' + (error.message || '未知错误'))
    }
  }
}

const handleDeleteWorkflow = async (data) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除工作流 "${data.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await delWorkflow(data.workflowId)
    ElMessage.success('工作流删除成功')
    emit('workflow-delete', data.workflowId)
    loadTreeData(false)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete workflow failed:', error)
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  }
}

// 生命周期
onMounted(() => {
  loadTreeData(true)
  
  // 监听全局事件
  eventBus.on('refresh-workflow-tree', () => {
    loadTreeData(false)
  })
})

onBeforeUnmount(() => {
  eventBus.off('refresh-workflow-tree')
})
</script>