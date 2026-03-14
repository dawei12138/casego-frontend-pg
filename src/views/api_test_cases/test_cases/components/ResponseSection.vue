<template>
  <div class="response-section">
    <!-- 响应状态栏 -->
    <div class="response-status-bar" v-if="responseData || loading">
      <div v-if="loading" class="status-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在发送请求...</span>
      </div>
      
      <div v-else-if="responseData" class="status-info">
        <div class="status-item">
          <span class="status-label">状态码:</span>
          <el-tag 
            :type="getStatusType(responseData.status)"
            effect="dark"
          >
            {{ responseData.status }} {{ responseData.statusText }}
          </el-tag>
        </div>
        
        <div class="status-item">
          <span class="status-label">响应时间:</span>
          <span class="status-value">{{ responseData.duration }}ms</span>
        </div>
        
        <div class="status-item">
          <span class="status-label">响应大小:</span>
          <span class="status-value">{{ formatSize(responseData.size) }}</span>
        </div>
      </div>
    </div>
    
    <!-- 响应内容 -->
    <div class="response-content">
      <div v-if="!responseData && !loading" class="empty-response">
        <el-icon class="empty-icon"><ChatLineRound /></el-icon>
        <p class="empty-text">点击发送按钮查看响应结果</p>
      </div>
      
      <div v-else-if="loading" class="loading-response">
        <el-icon class="is-loading loading-icon"><Loading /></el-icon>
        <p>请求发送中，请稍候...</p>
      </div>
      
      <el-tabs v-else-if="responseData" v-model="activeTab" type="card" class="response-tabs">
        <!-- 响应体 -->
        <el-tab-pane label="响应体" name="body">
          <div class="response-body">
            <el-input
              :model-value="formatResponseBody(responseData.data)"
              type="textarea"
              readonly
              :rows="20"
              placeholder="响应内容"
            />
          </div>
        </el-tab-pane>
        
        <!-- 响应头 -->
        <el-tab-pane label="响应头" name="headers">
          <div class="response-headers">
            <div v-for="(value, key) in responseData.headers" :key="key" class="header-item">
              <span class="header-key">{{ key }}:</span>
              <span class="header-value">{{ value }}</span>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- Cookies -->
        <el-tab-pane label="Cookies" name="cookies">
          <div class="response-cookies">
            <el-empty description="暂无Cookie信息" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Loading, ChatLineRound } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  responseData: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// 响应式数据
const activeTab = ref('body')

// 方法
const getStatusType = (status) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'danger'
  return 'info'
}

const formatSize = (size) => {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  let value = size
  
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index++
  }
  
  return `${value.toFixed(1)} ${units[index]}`
}

const formatResponseBody = (data) => {
  if (!data) return ''
  
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}
</script>

<style scoped>
.response-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.response-status-bar {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color-page);
}

.status-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-color-primary);
}

.status-info {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-label {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.status-value {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.response-content {
  flex: 1;
  overflow: hidden;
}

.empty-response,
.loading-response {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-regular);
}

.empty-icon,
.loading-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin: 0;
}

.response-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.response-body {
  padding: 16px;
}

.response-headers {
  padding: 16px;
}

.header-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-item:last-child {
  border-bottom: none;
}

.header-key {
  font-weight: 600;
  color: var(--el-text-color-primary);
  min-width: 150px;
  flex-shrink: 0;
}

.header-value {
  color: var(--el-text-color-regular);
  word-break: break-all;
}

.response-cookies {
  padding: 16px;
}

/* 自定义标签页样式 */
:deep(.el-tabs__header) {
  margin: 0;
  background-color: var(--el-bg-color-page);
  padding: 0 16px;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

:deep(.el-tab-pane) {
  height: 100%;
  overflow: auto;
}

/* 响应体文本框样式 */
:deep(.response-body .el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  background-color: var(--el-fill-color-extra-light);
}
</style>