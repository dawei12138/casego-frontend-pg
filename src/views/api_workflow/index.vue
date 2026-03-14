<template>
  <div class="api-workflow">
    <splitpanes class="workflow-splitpanes">
      <!-- 左侧工作流浏览器 -->
      <pane :size="leftPaneSize" :min-size="isLeftPaneCollapsed ? 0 : 15" :max-size="isLeftPaneCollapsed ? 0 : 40">
        <div v-show="!isLeftPaneCollapsed" class="workflow-explorer-wrapper">
          <WorkflowExplorer
            @workflow-select="handleWorkflowSelect"
            @workflow-create="handleWorkflowCreate"
            @workflow-edit="handleWorkflowEdit"
            @workflow-delete="handleWorkflowDelete"
            @module-create="handleModuleCreate"
            @module-edit="handleModuleEdit"
            @module-delete="handleModuleDelete"
          />
        </div>
      </pane>

      <!-- 右侧主工作区 -->
      <pane :size="rightPaneSize" :min-size="60">
        <MainWorkspace
          @workflow-create="handleWorkflowCreate"
        />
      </pane>
    </splitpanes>

    <!-- 折叠按钮 - 移到外层 -->
    <div
      class="collapse-button"
      :class="{ 'collapsed': isLeftPaneCollapsed }"
      :style="{ left: collapseButtonPosition }"
      @click="toggleLeftPane"
      @mouseenter="handleButtonMouseEnter"
      @mouseleave="handleButtonMouseLeave"
    >
      <el-icon>
        <DArrowLeft v-if="!isLeftPaneCollapsed" />
        <DArrowRight v-else />
      </el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onBeforeUnmount, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DArrowLeft, DArrowRight } from '@element-plus/icons-vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import WorkflowExplorer from './components/WorkflowExplorer.vue'
import MainWorkspace from './components/MainWorkspace.vue'
import { eventBus } from '@/utils/eventBus'
import { useProjectStore } from '@/store/modules/project'
import {
  addWorkflow,
  updateWorkflow,
  addWorkflowModule,
  updateWorkflowModule,
  delWorkflowModule
} from '@/api/workflow/workflow'

// Store
const projectStore = useProjectStore()

// 左侧面板折叠状态
const isLeftPaneCollapsed = ref(false)
const leftPaneSize = ref(25)
const rightPaneSize = computed(() => isLeftPaneCollapsed.value ? 100 : 75)
let mouseEnterTimer = null

// 计算折叠按钮位置
const collapseButtonPosition = computed(() => {
  if (isLeftPaneCollapsed.value) {
    return '0px'
  }
  return `calc(${leftPaneSize.value}% - 12px)`
})

// 切换左侧面板
const toggleLeftPane = () => {
  // 清除自动展开定时器
  if (mouseEnterTimer) {
    clearTimeout(mouseEnterTimer)
    mouseEnterTimer = null
  }

  isLeftPaneCollapsed.value = !isLeftPaneCollapsed.value
  if (isLeftPaneCollapsed.value) {
    leftPaneSize.value = 0
  } else {
    leftPaneSize.value = 25
  }
}

// 鼠标移入按钮 - 自动展开
const handleButtonMouseEnter = () => {
  if (isLeftPaneCollapsed.value) {
    // 设置延迟展开，避免误触
    mouseEnterTimer = setTimeout(() => {
      isLeftPaneCollapsed.value = false
      leftPaneSize.value = 25
    }, 200)
  }
}

// 鼠标移出按钮
const handleButtonMouseLeave = () => {
  // 清除展开定时器
  if (mouseEnterTimer) {
    clearTimeout(mouseEnterTimer)
    mouseEnterTimer = null
  }
}

// 全局状态
const globalState = ref({
  selectedWorkflow: null,
  selectedModule: null,
  selectedNode: null
})

// 提供全局状态给子组件
provide('globalState', globalState)

// 处理工作流选择
const handleWorkflowSelect = (workflowData) => {
  console.log('Index handleWorkflowSelect:', workflowData)
  globalState.value.selectedWorkflow = workflowData
  eventBus.emit('workflow-select', workflowData)

  // 自动收缩左侧面板
  if (workflowData && !isLeftPaneCollapsed.value) {
    setTimeout(() => {
      toggleLeftPane()
    }, 300)
  }
}

// 处理工作流创建
const handleWorkflowCreate = async (parentNode, type = 'workflow') => {
  try {
    const { value: name } = await ElMessageBox.prompt(
      type === 'workflow' ? '请输入工作流名称' : '请输入模块名称',
      type === 'workflow' ? '创建工作流' : '创建模块',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValidator: (value) => {
          if (!value || value.trim() === '') {
            return '名称不能为空'
          }
          return true
        }
      }
    )
    
    if (name && name.trim()) {
      if (type === 'workflow') {
        await addWorkflow({
          name: name.trim(),
          moduleId: parentNode?.moduleId || null,
          projectId: projectStore.projectId
        })
        ElMessage.success('工作流创建成功')
      } else {
        await addWorkflowModule({
          name: name.trim(),
          parentId: parentNode?.moduleId || null,
          projectId: projectStore.projectId
        })
        ElMessage.success('模块创建成功')
      }
      
      // 刷新树
      eventBus.emit('refresh-workflow-tree')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Create failed:', error)
      ElMessage.error('创建失败: ' + (error.message || '未知错误'))
    }
  }
}

// 处理工作流编辑
const handleWorkflowEdit = async (workflowData) => {
  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入新的工作流名称',
      '编辑工作流',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: workflowData.name,
        inputValidator: (value) => {
          if (!value || value.trim() === '') {
            return '工作流名称不能为空'
          }
          return true
        }
      }
    )
    
    if (newName && newName.trim() !== workflowData.name) {
      await updateWorkflow({
        workflowId: workflowData.workflowId,
        name: newName.trim()
      })
      ElMessage.success('工作流更新成功')
      
      // 刷新树
      eventBus.emit('refresh-workflow-tree')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Update workflow failed:', error)
      ElMessage.error('更新失败: ' + (error.message || '未知错误'))
    }
  }
}

// 处理工作流删除（WorkflowExplorer 已完成确认和删除，这里只处理状态清理）
const handleWorkflowDelete = (workflowId) => {
  // 如果删除的是当前选中的工作流，清空选择
  if (globalState.value.selectedWorkflow?.workflowId === workflowId) {
    globalState.value.selectedWorkflow = null
    eventBus.emit('workflow-select', null)
  }
}

// 处理模块创建
const handleModuleCreate = async (parentNode) => {
  await handleWorkflowCreate(parentNode, 'module')
}

// 处理模块编辑
const handleModuleEdit = async (moduleData) => {
  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入新的模块名称',
      '编辑模块',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: moduleData.name,
        inputValidator: (value) => {
          if (!value || value.trim() === '') {
            return '模块名称不能为空'
          }
          return true
        }
      }
    )
    
    if (newName && newName.trim() !== moduleData.name) {
      await updateWorkflowModule({
        moduleId: moduleData.moduleId,
        name: newName.trim()
      })
      ElMessage.success('模块更新成功')
      
      // 刷新树
      eventBus.emit('refresh-workflow-tree')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Update module failed:', error)
      ElMessage.error('更新失败: ' + (error.message || '未知错误'))
    }
  }
}

// 处理模块删除
const handleModuleDelete = async (moduleData) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模块 "${moduleData.name}" 吗？\n删除模块将同时删除其下的所有子模块和工作流。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await delWorkflowModule({
      moduleId: moduleData.moduleId
    })
    ElMessage.success('模块删除成功')
    
    // 刷新树
    eventBus.emit('refresh-workflow-tree')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete module failed:', error)
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  }
}

// 键盘事件处理
const handleKeydown = (event) => {
  const isCtrlOrCmd = event.ctrlKey || event.metaKey
  
  if (isCtrlOrCmd) {
    switch (event.key.toLowerCase()) {
      case 's':
        event.preventDefault()
        // 触发保存事件
        eventBus.emit('save-workflow')
        break
      case 'n':
        event.preventDefault()
        // 触发新建事件
        handleWorkflowCreate(null, 'workflow')
        break
      case 'w':
        event.preventDefault()
        // 触发关闭事件
        globalState.value.selectedWorkflow = null
        eventBus.emit('workflow-select', null)
        break
    }
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.api-workflow {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
  overflow: hidden;
  position: relative;
  padding: 0;
}

.workflow-splitpanes {
  height: 100%;
  flex: 1;
  min-height: 0;
}

.workflow-explorer-wrapper {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 折叠按钮样式 */
.collapse-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 32px;
  background: var(--el-color-primary);
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: 2px 0 6px rgba(64, 158, 255, 0.25);
}

.collapse-button:hover {
  background: var(--el-color-primary-light-3);
  width: 20px;
  box-shadow: 2px 0 8px rgba(64, 158, 255, 0.4);
}

.collapse-button .el-icon {
  color: white;
  font-size: 12px;
  transition: transform 0.3s ease;
}

.collapse-button:hover .el-icon {
  transform: scale(1.1);
}

/* Splitpanes样式覆盖 */
:deep(.splitpanes__pane) {
  background: var(--el-bg-color);
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:deep(.splitpanes__splitter) {
  background-color: var(--el-border-color);
  position: relative;
  transition: all 0.3s ease;
}

:deep(.splitpanes__splitter:hover) {
  background-color: var(--el-color-primary);
}

:deep(.splitpanes__splitter:before) {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 40px;
  background: var(--el-color-primary);
  border-radius: 2px;
  opacity: 0;
  transition: all 0.3s ease;
}

:deep(.splitpanes__splitter:hover:before) {
  opacity: 1;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  :deep(.splitpanes__pane:first-child) {
    min-width: 200px !important;
  }
}

@media (max-width: 768px) {
  .api-workflow {
    overflow-y: auto;
  }

  :deep(.splitpanes) {
    flex-direction: column;
  }

  :deep(.splitpanes__splitter) {
    min-height: 8px;
  }

  .collapse-button {
    display: none;
  }
}
</style>