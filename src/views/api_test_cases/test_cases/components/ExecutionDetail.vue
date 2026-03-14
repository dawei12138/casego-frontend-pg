<template>
  <div class="execution-detail">
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else-if="!executionData" class="empty-container">
      <p>没有可用的执行数据。</p>
    </div>
    <div v-else class="detail-content">
      <ResponseViewer
        :execution-data="executionData"
        :case-id="actualCaseId"
        drawer-mode
        @refresh-case="emit('refresh-case')"
      />
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import ResponseViewer from './ResponseViewer.vue'

const props = defineProps({
  executionData: {
    type: Object,
    default: () => null
  },
  loading: {
    type: Boolean,
    default: false
  },
  caseId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['refresh-case'])

// 计算 caseId：优先使用 prop，如果没有则从 executionData 中提取
const actualCaseId = computed(() => {
  return props.caseId || props.executionData?.caseId || null
})
</script>

<style scoped>
.execution-detail {
  height: 100%;
}

.detail-section {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item label {
  font-weight: 600;
  color: var(--el-text-color-secondary);
  min-width: 80px;
}

.info-block {
  margin-bottom: 24px;
}

.info-block h4 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 8px;
}

.url-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.url {
  font-family: 'Courier New', monospace;
  word-break: break-all;
}

.headers-table,
.params-table,
.cookies-table {
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  overflow: hidden;
}

.body-content {
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  overflow: hidden;
}

.json-content {
  margin: 0;
  padding: 16px;
  background: var(--el-fill-color-light);
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

.assertion-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-item label {
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.summary-item .success {
  color: var(--el-color-success);
  font-weight: 600;
}

.summary-item .failed {
  color: var(--el-color-danger);
  font-weight: 600;
}

.assertion-message {
  margin-bottom: 20px;
}

.assertion-results {
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  overflow: hidden;
}

.script-results {
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  overflow: hidden;
}

.script-result {
  border-bottom: 1px solid var(--el-border-color-light);
}

.script-result:last-child {
  border-bottom: none;
}

.script-content {
  margin: 0;
  padding: 16px;
  background: var(--el-fill-color-light);
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>