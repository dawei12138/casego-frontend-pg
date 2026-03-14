<template>
  <div class="node-config-detail">
    <!-- 头部信息 -->
    <div class="detail-header">
      <div class="header-left">
        <div class="node-icon">
          <el-icon v-if="nodeData.type === 'group'" class="group-icon">
            <Folder />
          </el-icon>
          <el-icon v-else-if="nodeData.type === 'task'" class="task-icon">
            <Operation />
          </el-icon>
          <el-icon v-else class="default-icon">
            <Document />
          </el-icon>
        </div>
        <div class="node-info">
          <h3 class="node-name">{{ nodeData.name }}</h3>
          <div class="node-meta">
            <el-tag 
              :type="getNodeTypeTagType(nodeData.type)" 
              size="small"
              effect="plain"
            >
              {{ getNodeTypeLabel(nodeData.type) }}
            </el-tag>
            <span v-if="nodeData.config?.taskConfig?.task_type" class="task-type">
              {{ nodeData.config.taskConfig.task_type }}
            </span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <el-tooltip content="编辑节点" placement="top">
          <el-button size="small" type="primary" @click="handleEdit">
            <el-icon><Edit /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="关闭详情" placement="top">
          <el-button size="small" @click="handleClose">
            <el-icon><Close /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="detail-section">
      <div class="section-title">
        <el-icon><InfoFilled /></el-icon>
        基本信息
      </div>
      <div class="section-content">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">节点ID:</span>
            <span class="info-value">{{ nodeData.nodeId }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">节点名称:</span>
            <span class="info-value">{{ nodeData.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">节点类型:</span>
            <span class="info-value">{{ getNodeTypeLabel(nodeData.type) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">父节点ID:</span>
            <span class="info-value">{{ nodeData.parentId || '无' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">运行状态:</span>
            <el-tag :type="nodeData.isRun === 1 ? 'success' : 'danger'" size="small">
              {{ nodeData.isRun === 1 ? '启用' : '禁用' }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">排序:</span>
            <span class="info-value">{{ nodeData.sort || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务配置 -->
    <div v-if="nodeData.config?.taskConfig" class="detail-section">
      <div class="section-title">
        <el-icon><Setting /></el-icon>
        任务配置
      </div>
      <div class="section-content">
        <div class="config-grid">
          <div v-if="nodeData.config.taskConfig.task_type" class="config-item">
            <span class="config-label">任务类型:</span>
            <el-tag type="primary" size="small">
              {{ nodeData.config.taskConfig.task_type }}
            </el-tag>
          </div>
          <div v-if="nodeData.config.taskConfig.case_id" class="config-item">
            <span class="config-label">用例ID:</span>
            <span class="config-value">{{ nodeData.config.taskConfig.case_id }}</span>
          </div>
          <div v-if="nodeData.config.taskConfig.api_id" class="config-item">
            <span class="config-label">接口ID:</span>
            <span class="config-value">{{ nodeData.config.taskConfig.api_id }}</span>
          </div>
          <div v-if="nodeData.config.taskConfig.db_operation_script" class="config-item full-width">
            <span class="config-label">数据库操作脚本:</span>
            <div class="config-code">
              <el-input
                :model-value="nodeData.config.taskConfig.db_operation_script"
                type="textarea"
                :rows="4"
                readonly
                resize="none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 条件配置 -->
    <div v-if="nodeData.config?.conditional" class="detail-section">
      <div class="section-title">
        <el-icon><Switch /></el-icon>
        条件配置
      </div>
      <div class="section-content">
        <div class="config-grid">
          <div v-if="nodeData.config.conditional.condition_type" class="config-item">
            <span class="config-label">条件类型:</span>
            <el-tag type="warning" size="small">
              {{ nodeData.config.conditional.condition_type }}
            </el-tag>
          </div>
          <div v-if="nodeData.config.conditional.condition_expression" class="config-item full-width">
            <span class="config-label">条件表达式:</span>
            <div class="config-code">
              <el-input
                :model-value="nodeData.config.conditional.condition_expression"
                type="textarea"
                :rows="3"
                readonly
                resize="none"
              />
            </div>
          </div>
          <div v-if="nodeData.config.conditional.true_branch" class="config-item">
            <span class="config-label">True分支:</span>
            <span class="config-value">{{ nodeData.config.conditional.true_branch }}</span>
          </div>
          <div v-if="nodeData.config.conditional.false_branch" class="config-item">
            <span class="config-label">False分支:</span>
            <span class="config-value">{{ nodeData.config.conditional.false_branch }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 循环配置 -->
    <div v-if="nodeData.config?.loop" class="detail-section">
      <div class="section-title">
        <el-icon><Refresh /></el-icon>
        循环配置
      </div>
      <div class="section-content">
        <div class="config-grid">
          <div v-if="nodeData.config.loop.loop_type" class="config-item">
            <span class="config-label">循环类型:</span>
            <el-tag type="info" size="small">
              {{ nodeData.config.loop.loop_type }}
            </el-tag>
          </div>
          <div v-if="nodeData.config.loop.loop_count" class="config-item">
            <span class="config-label">循环次数:</span>
            <span class="config-value">{{ nodeData.config.loop.loop_count }}</span>
          </div>
          <div v-if="nodeData.config.loop.loop_condition" class="config-item full-width">
            <span class="config-label">循环条件:</span>
            <div class="config-code">
              <el-input
                :model-value="nodeData.config.loop.loop_condition"
                type="textarea"
                :rows="3"
                readonly
                resize="none"
              />
            </div>
          </div>
          <div v-if="nodeData.config.loop.loop_variable" class="config-item">
            <span class="config-label">循环变量:</span>
            <span class="config-value">{{ nodeData.config.loop.loop_variable }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 子节点信息 -->
    <div v-if="nodeData.children && nodeData.children.length > 0" class="detail-section">
      <div class="section-title">
        <el-icon><Collection /></el-icon>
        子节点 ({{ nodeData.children.length }})
      </div>
      <div class="section-content">
        <div class="children-list">
          <div 
            v-for="child in nodeData.children" 
            :key="child.nodeId"
            class="child-item"
            @click="handleChildClick(child)"
          >
            <div class="child-icon">
              <el-icon v-if="child.type === 'group'" class="group-icon">
                <Folder />
              </el-icon>
              <el-icon v-else-if="child.type === 'task'" class="task-icon">
                <Operation />
              </el-icon>
              <el-icon v-else class="default-icon">
                <Document />
              </el-icon>
            </div>
            <div class="child-info">
              <div class="child-name">{{ child.name }}</div>
              <div class="child-meta">
                <el-tag 
                  :type="getNodeTypeTagType(child.type)" 
                  size="small"
                  effect="plain"
                >
                  {{ getNodeTypeLabel(child.type) }}
                </el-tag>
              </div>
            </div>
            <div class="child-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- JSON配置 -->
    <div class="detail-section">
      <div class="section-title">
        <el-icon><DocumentCopy /></el-icon>
        完整配置 (JSON)
        <el-button 
          size="small" 
          text 
          @click="copyConfig"
          style="margin-left: auto;"
        >
          <el-icon><CopyDocument /></el-icon>
          复制
        </el-button>
      </div>
      <div class="section-content">
        <div class="json-viewer">
          <pre class="json-content">{{ formatJson(nodeData) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Folder,
  Operation,
  Document,
  Edit,
  Close,
  InfoFilled,
  Setting,
  Switch,
  Refresh,
  Collection,
  ArrowRight,
  DocumentCopy,
  CopyDocument
} from '@element-plus/icons-vue'

const props = defineProps({
  nodeData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'close', 'child-select'])

// 计算属性
const getNodeTypeLabel = (type) => {
  const typeMap = {
    'task': '任务节点',
    'group': '分组节点',
    'condition': '条件节点',
    'loop': '循环节点'
  }
  return typeMap[type] || type
}

const getNodeTypeTagType = (type) => {
  const typeMap = {
    'task': 'primary',
    'group': 'success',
    'condition': 'warning',
    'loop': 'info'
  }
  return typeMap[type] || 'default'
}

// 方法
const handleEdit = () => {
  emit('edit', props.nodeData)
}

const handleClose = () => {
  emit('close')
}

const handleChildClick = (childData) => {
  emit('child-select', childData)
}

const formatJson = (data) => {
  try {
    return JSON.stringify(data, null, 2)
  } catch (error) {
    return '无法格式化JSON数据'
  }
}

const copyConfig = async () => {
  try {
    const jsonText = formatJson(props.nodeData)
    await navigator.clipboard.writeText(jsonText)
    ElMessage.success('配置已复制到剪贴板')
  } catch (error) {
    console.error('Copy failed:', error)
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped>
.node-config-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}

/* 头部样式 */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-page);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.node-icon {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}

.group-icon {
  color: var(--el-color-warning);
  font-size: 16px;
}

.task-icon {
  color: var(--el-color-primary);
  font-size: 16px;
}

.default-icon {
  color: var(--el-text-color-secondary);
  font-size: 16px;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-name {
  margin: 0 0 3px 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-type {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: 3px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 详情区域样式 */
.detail-section {
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.detail-section:last-child {
  border-bottom: none;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-extra-light);
}

.section-content {
  padding: 12px 16px;
  flex: 1;
  overflow-y: auto;
}

/* 信息网格样式 */
.info-grid,
.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.info-item,
.config-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.config-item.full-width {
  grid-column: 1 / -1;
}

.info-label,
.config-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.info-value,
.config-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.config-code {
  margin-top: 4px;
}

.config-code :deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  background: var(--el-fill-color-extra-light);
}

/* 子节点列表样式 */
.children-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.child-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.child-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.child-icon {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}

.child-info {
  flex: 1;
  min-width: 0;
}

.child-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.child-meta {
  display: flex;
  align-items: center;
}

.child-arrow {
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

/* JSON查看器样式 */
.json-viewer {
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.json-content {
  margin: 0;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  background: transparent;
  overflow: auto;
  flex: 1;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-header {
    padding: 12px 16px;
  }
  
  .section-title {
    padding: 12px 16px 8px;
    font-size: 13px;
  }
  
  .section-content {
    padding: 12px 16px;
  }
  
  .info-grid,
  .config-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .node-name {
    font-size: 14px;
  }
  
  .child-item {
    padding: 8px;
  }
  
  .json-content {
    padding: 12px;
    font-size: 11px;
  }
}
</style>