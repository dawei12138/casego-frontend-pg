<template>
  <div class="execution-history">
    <!-- 头部操作栏 -->
    <div class="history-header">
      <div class="header-title">
        <el-icon><Clock /></el-icon>
        <span>执行历史</span>
      </div>
      <div class="header-actions">
        <el-tag v-if="total > 0" size="small" type="info" effect="plain">
          共 {{ total }} 条记录
        </el-tag>
        <span v-else class="no-data-hint">暂无记录</span>
        <el-button
          :icon="Refresh"
          size="small"
          @click="refreshHistory"
          :loading="loading"
        >
          刷新
        </el-button>
        <el-button
          size="small"
          type="primary"
          @click="handleClose"
        >
          关闭
        </el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="history-content">
      <!-- 加载状态 -->
      <div v-if="loading && !historyList.length" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!historyList.length" class="empty-state">
        <el-icon class="empty-icon"><DocumentRemove /></el-icon>
        <p class="empty-text">暂无执行记录</p>
        <p class="empty-hint">执行用例后将在此显示历史记录</p>
      </div>

      <!-- 列表容器 -->
      <div v-else class="history-list-container">
        <div class="history-list">
          <div
            v-for="record in historyList"
            :key="record.logId"
            class="history-card"
            :class="{ 'is-success': record.isSuccess, 'is-failed': !record.isSuccess }"
            @click="showExecutionDetail(record)"
          >
            <!-- 左侧状态指示 -->
            <div class="card-status-bar"></div>

            <!-- 主要内容 -->
            <div class="card-content">
              <!-- 第一行：状态标签 + 时间 -->
              <div class="card-row card-header">
                <div class="status-info">
                  <el-tag
                    :type="record.isSuccess ? 'success' : 'danger'"
                    size="small"
                    effect="dark"
                  >
                    {{ record.isSuccess ? '执行成功' : '执行失败' }}
                  </el-tag>
                </div>
                <div class="time-info">
                  <el-icon><Timer /></el-icon>
                  <span>{{ formatTime(record.executionTime) }}</span>
                </div>
              </div>

              <!-- 第二行：指标数据 -->
              <div class="card-row card-metrics">
                <div class="metric-item">
                  <span class="metric-label">状态码</span>
                  <el-tag
                    :type="getStatusCodeType(record.responseStatusCode)"
                    size="small"
                    effect="plain"
                  >
                    {{ record.responseStatusCode || '-' }}
                  </el-tag>
                </div>
                <div class="metric-item">
                  <span class="metric-label">响应时间</span>
                  <span class="metric-value">{{ formatResponseTime(record.responseTime) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">断言结果</span>
                  <el-tag
                    :type="record.assertionSuccess ? 'success' : 'danger'"
                    size="small"
                    effect="plain"
                  >
                    {{ record.assertionSuccess ? '通过' : '失败' }}
                  </el-tag>
                </div>
              </div>
            </div>

            <!-- 右侧箭头 -->
            <div class="card-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 执行详情弹窗 -->
    <el-dialog
      v-model="showDetailDialog"
      title="执行详情"
      width="80%"
      :close-on-click-modal="false"
      append-to-body
    >
      <ExecutionDetail
        v-if="selectedRecord"
        :execution-data="selectedRecord"
        :case-id="props.caseId"
        :loading="detailLoading"
        @refresh-case="handleRefreshCase"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import {
  Refresh, Loading, DocumentRemove,
  Check, Close, ArrowRight, Timer, Clock
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { listExecutionLog, getExecutionLog } from '@/api/api_test_execution_log/execution_log'
import ExecutionDetail from './ExecutionDetail.vue'

// Props
const props = defineProps({
  caseId: {
    type: [String, Number],
    required: true
  },
  caseName: {
    type: String,
    default: ''
  }
})

// 定义事件
const emit = defineEmits(['refresh-case', 'close'])

// 关闭抽屉
const handleClose = () => {
  emit('close')
}

// 响应式数据
const loading = ref(false)
const historyList = ref([])
const total = ref(0)
const showDetailDialog = ref(false)
const selectedRecord = ref(null)
const detailLoading = ref(false)

// 查询参数
const queryParams = reactive({
  caseId: props.caseId,
  pageNum: 1,
  pageSize: 20
})

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取状态码类型
const getStatusCodeType = (code) => {
  if (!code) return 'info'
  if (code >= 200 && code < 300) return 'success'
  if (code >= 300 && code < 400) return 'warning'
  if (code >= 400) return 'danger'
  return 'info'
}

// 格式化响应时间
const formatResponseTime = (time) => {
  if (!time && time !== 0) return '-'
  if (time < 1) return `${Math.round(time * 1000)}ms`
  return `${time.toFixed(2)}s`
}

// 加载历史记录
const loadHistoryList = async () => {
  if (!props.caseId) return
  if (loading.value) return

  loading.value = true
  try {
    const params = {
      caseId: Number(queryParams.caseId),
      pageNum: Number(queryParams.pageNum),
      pageSize: Number(queryParams.pageSize)
    }

    const response = await listExecutionLog(params)
    if (response.code === 200) {
      historyList.value = response.rows || []
      total.value = response.total || 0
    } else {
      throw new Error(response.msg || '获取历史记录失败')
    }
  } catch (error) {
    console.error('Failed to load execution history:', error)
    ElMessage.error(`加载失败: ${error.message}`)
    historyList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 刷新历史
const refreshHistory = () => {
  queryParams.pageNum = 1
  loadHistoryList()
}

// 显示执行详情
const showExecutionDetail = async (record) => {
  showDetailDialog.value = true
  selectedRecord.value = null
  detailLoading.value = true
  try {
    const response = await getExecutionLog(record.logId)
    if (response.code === 200) {
      selectedRecord.value = response.data
    } else {
      throw new Error(response.msg || '获取详情失败')
    }
  } catch (error) {
    console.error('Failed to load execution detail:', error)
    ElMessage.error(`加载详情失败: ${error.message}`)
    showDetailDialog.value = false
  } finally {
    detailLoading.value = false
  }
}

// 分页处理
const handleSizeChange = (size) => {
  queryParams.pageSize = Number(size)
  queryParams.pageNum = 1
  loadHistoryList()
}

const handleCurrentChange = (page) => {
  queryParams.pageNum = Number(page)
  loadHistoryList()
}

// 处理刷新用例
const handleRefreshCase = () => {
  emit('refresh-case')
}

// 监听 caseId 变化
watch(() => props.caseId, (newCaseId) => {
  if (newCaseId) {
    queryParams.caseId = Number(newCaseId)
    queryParams.pageNum = 1
    loadHistoryList()
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  if (props.caseId) {
    loadHistoryList()
  }
})
</script>

<style scoped>
/* 使用绝对定位撑满父容器，解决 el-drawer__body 没有固定高度导致 height:100% 失效的问题 */
.execution-history {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  overflow: hidden;
}

/* 头部 - 固定高度 */
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
  height: 72px;
  box-sizing: border-box;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-title .el-icon {
  font-size: 18px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.no-data-hint {
  font-size: 13px;
  color: #909399;
}

/* 内容区域 - 占据剩余空间 */
.history-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #909399;
}

.loading-state .el-icon {
  font-size: 32px;
  color: #409eff;
}

.empty-icon {
  font-size: 64px;
  color: #dcdfe6;
}

.empty-text {
  margin: 0;
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.empty-hint {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

/* 列表容器 - 占据剩余空间并启用滚动 */
.history-list-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

/* 列表 */
.history-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 卡片 - 固定最小高度 */
.history-card {
  display: flex;
  align-items: stretch;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  position: relative;
  min-height: 88px;
  flex-shrink: 0;
}

.history-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.history-card:active {
  transform: translateY(0);
}

/* 左侧状态条 */
.card-status-bar {
  width: 4px;
  background: #dcdfe6;
  transition: background 0.3s ease;
  flex-shrink: 0;
}

.history-card.is-success .card-status-bar {
  background: linear-gradient(180deg, #67c23a 0%, #85ce61 100%);
}

.history-card.is-failed .card-status-bar {
  background: linear-gradient(180deg, #f56c6c 0%, #f78989 100%);
}

/* 卡片内容 */
.card-content {
  flex: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 卡片头部 */
.card-header {
  gap: 12px;
}

.status-info {
  display: flex;
  align-items: center;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
}

.time-info .el-icon {
  font-size: 14px;
}

/* 指标行 */
.card-metrics {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metric-label {
  font-size: 13px;
  color: #909399;
}

.metric-value {
  font-size: 13px;
  color: #606266;
  font-weight: 600;
  font-family: 'Consolas', 'Monaco', monospace;
}

/* 右侧箭头 */
.card-arrow {
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: #c0c4cc;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.history-card:hover .card-arrow {
  color: #409eff;
  transform: translateX(4px);
}

.card-arrow .el-icon {
  font-size: 16px;
}

/* 分页 - 固定高度 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
  flex-shrink: 0;
  height: 64px;
  box-sizing: border-box;
}

/* 滚动条美化 */
.history-list-container::-webkit-scrollbar {
  width: 8px;
}

.history-list-container::-webkit-scrollbar-track {
  background: #f0f2f5;
  border-radius: 4px;
}

.history-list-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
  transition: background 0.3s;
}

.history-list-container::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

/* 响应式 */
@media (max-width: 768px) {
  .card-metrics {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .metric-item {
    width: 100%;
  }
}
</style>