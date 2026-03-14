<template>
  <div class="test-report-container">
    <!-- 报告列表 -->
    <div v-if="!selectedReport" class="report-list-section">
      <div class="section-header">
        <h3>测试报告</h3>
        <el-button type="primary" :icon="Refresh" @click="loadReportList" :loading="loading">
          刷新
        </el-button>
      </div>

      <div class="table-wrapper">
        <el-table
          :data="reportList"
          :loading="loading"
          stripe
          style="width: 100%; height: 100%"
          @row-click="viewReportDetail"
        >
        <el-table-column prop="name" label="报告名称" min-width="200" />
        <el-table-column label="执行状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isSuccess ? 'success' : 'danger'" size="small">
              {{ row.isSuccess ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalCases" label="总用例数" width="100" align="center" />
        <el-table-column prop="successCases" label="成功数" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #34C759;">{{ row.successCases }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="failedCases" label="失败数" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #FF3B30;">{{ row.failedCases }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="triggerType" label="触发方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.triggerType === 'manual' ? '手动' : '自动' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时(秒)" width="120" align="center">
          <template #default="{ row }">
            {{ row.duration ? row.duration.toFixed(2) : '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click.stop="viewReportDetail(row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>

      <div class="pagination-wrapper">
        <pagination
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          :total="total"
          @pagination="loadReportList"
        />
      </div>
    </div>

    <!-- 报告详情 -->
    <div v-else class="report-detail-section">
      <div class="detail-header">
        <el-button :icon="ArrowLeft" @click="backToList">返回列表</el-button>
        <h3>{{ selectedReport.name }}</h3>
      </div>

      <!-- 可滚动的内容区域 -->
      <div class="detail-content">
        <!-- 统计面板 -->
      <div class="stats-section">
        <el-row :gutter="24" style="align-items: center;">
          <el-col :span="6">
            <div class="stat-chart-wrapper">
              <div ref="chartRef" style="width: 160px; height: 160px; margin: 0 auto;"></div>
              <div class="chart-center-text">
                <div class="center-rate">{{ reportStats.successRate }}%</div>
                <div class="center-label">成功率</div>
              </div>
            </div>
          </el-col>
          <el-col :span="18">
            <el-row :gutter="16">
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">总接口数</div>
                  <div class="stat-value">{{ reportStats.total }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item stat-success">
                  <div class="stat-label">成功数</div>
                  <div class="stat-value">
                    {{ reportStats.success }}
                    <span class="stat-rate">({{ reportStats.successRate }}%)</span>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item stat-failed">
                  <div class="stat-label">失败数</div>
                  <div class="stat-value">
                    {{ reportStats.failed }}
                    <span class="stat-rate">({{ reportStats.failureRate }}%)</span>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">平均响应时长</div>
                  <div class="stat-value">{{ reportStats.avgResponseTime }}<span class="stat-unit">ms</span></div>
                </div>
              </el-col>
            </el-row>
          </el-col>
        </el-row>
      </div>

      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab" class="result-tabs">
        <el-tab-pane name="all">
          <template #label>
            <span>全部 <el-badge :value="reportStats.total" :max="999" /></span>
          </template>
        </el-tab-pane>
        <el-tab-pane name="success">
          <template #label>
            <span>通过 <el-badge :value="reportStats.success" :max="999" type="success" /></span>
          </template>
        </el-tab-pane>
        <el-tab-pane name="failed">
          <template #label>
            <span>失败 <el-badge :value="reportStats.failed" :max="999" type="danger" /></span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 日志列表 -->
      <div class="results-list">
        <div v-if="filteredLogs.length === 0" class="no-results">
          暂无日志记录
        </div>
        <div
          v-for="(log, index) in filteredLogs"
          :key="index"
          :class="getLogItemClass(log)"
          @click="log.eventType === 'case_result' && log.logId ? showExecutionDetail(log) : null"
        >
          <!-- Log 类型展示 -->
          <div v-if="log.eventType === 'log'" class="log-content">
            <div class="log-status">
              <el-icon :size="18" color="#6B7280">
                <InfoFilled />
              </el-icon>
            </div>
            <div class="log-info">
              <div class="log-message">{{ log.name }}</div>
              <div v-if="log.executionTime" class="log-timestamp">{{ formatTimestamp(log.executionTime) }}</div>
            </div>
          </div>

          <!-- Case Result 类型展示 -->
          <div v-else-if="log.eventType === 'case_result'" class="result-content">
            <!-- 状态图标 -->
            <div class="result-status">
              <el-icon :size="20" :color="log.isSuccess ? '#34C759' : '#FF3B30'">
                <component :is="log.isSuccess ? 'CircleCheck' : 'CircleClose'" />
              </el-icon>
            </div>

            <!-- 接口信息 -->
            <div class="result-info">
              <div class="result-main">
                <span class="result-name">{{ log.name }}</span>
                <el-tag
                  :type="getMethodTagType(log.method)"
                  size="small"
                  class="method-tag"
                >
                  {{ log.method }}
                </el-tag>
              </div>
              <div class="result-url">{{ log.path }}</div>
            </div>

            <!-- 响应信息 -->
            <div class="result-metrics">
              <div class="metric-item">
                <span class="metric-label">状态码</span>
                <el-tag
                  :type="getStatusCodeTagType(log.responseStatusCode)"
                  size="small"
                >
                  {{ log.responseStatusCode }}
                </el-tag>
              </div>
              <div class="metric-item">
                <span class="metric-label">响应时长</span>
                <span class="metric-value">{{ formatResponseTime(log.responseTime) }}</span>
              </div>
            </div>

            <!-- 查看详情按钮 -->
            <div class="result-action" v-if="log.logId">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>
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
        v-if="selectedLog"
        :execution-data="selectedLog"
        :loading="detailLoading"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, ArrowLeft, ArrowRight, CircleCheck, CircleClose, InfoFilled } from '@element-plus/icons-vue'
import { listWorkflowReports, getWorkflowReport } from '@/api/report/workflow_report'
import { getExecutionLog } from '@/api/api_test_execution_log/execution_log'
import Pagination from '@/components/Pagination'
import ExecutionDetail from '@/views/api_test_cases/test_cases/components/ExecutionDetail.vue'
import * as echarts from 'echarts'

const props = defineProps({
  workflowId: {
    type: [Number, String],
    required: true
  }
})

// 加载状态
const loading = ref(false)
const detailLoading = ref(false)

// 列表数据
const reportList = ref([])
const total = ref(0)
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  workflowId: props.workflowId
})

// 详情数据
const selectedReport = ref(null)
const reportLogs = ref([])
const activeTab = ref('all')

// 详情弹窗
const showDetailDialog = ref(false)
const selectedLog = ref(null)

// 图表引用
const chartRef = ref()
let chartInstance = null

// 计算属性 - 报告统计
const reportStats = computed(() => {
  if (!selectedReport.value || !reportLogs.value.length) {
    return {
      total: 0,
      success: 0,
      failed: 0,
      successRate: 0,
      failureRate: 0,
      avgResponseTime: 0
    }
  }

  // 只统计 case_result 类型的日志
  const caseResults = reportLogs.value.filter(log => log.eventType === 'case_result')
  const total = caseResults.length
  const success = caseResults.filter(r => r.isSuccess).length
  const failed = total - success
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0
  const failureRate = total > 0 ? Math.round((failed / total) * 100) : 0

  // 计算平均响应时长
  const totalResponseTime = caseResults.reduce((sum, r) => sum + (r.responseTime || 0), 0)
  const avgResponseTime = total > 0 ? Math.round((totalResponseTime / total) * 1000) : 0

  return {
    total,
    success,
    failed,
    successRate,
    failureRate,
    avgResponseTime
  }
})

// 计算属性 - 根据 Tab 过滤日志
const filteredLogs = computed(() => {
  if (activeTab.value === 'success') {
    return reportLogs.value.filter(log => log.eventType === 'case_result' && log.isSuccess)
  } else if (activeTab.value === 'failed') {
    return reportLogs.value.filter(log => log.eventType === 'case_result' && !log.isSuccess)
  }
  return reportLogs.value
})

// 获取日志项的CSS类
const getLogItemClass = (log) => {
  if (log.eventType === 'log') {
    return ['result-item', 'result-log']
  } else if (log.eventType === 'case_result') {
    return ['result-item', log.isSuccess ? 'result-success' : 'result-failed']
  }
  return ['result-item']
}

// 获取请求方法标签类型
const getMethodTagType = (method) => {
  const typeMap = {
    'GET': '',
    'POST': 'success',
    'PUT': 'warning',
    'DELETE': 'danger',
    'PATCH': 'info'
  }
  return typeMap[method] || ''
}

// 获取状态码标签类型
const getStatusCodeTagType = (code) => {
  if (code >= 200 && code < 300) return 'success'
  if (code >= 300 && code < 400) return 'info'
  if (code >= 400 && code < 500) return 'warning'
  if (code >= 500) return 'danger'
  return ''
}

// 格式化响应时长
const formatResponseTime = (time) => {
  if (!time) return '0ms'
  return `${Math.round(time * 1000)}ms`
}

// 格式化时间戳
const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', { hour12: false })
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

// 更新图表
const updateChart = () => {
  if (!chartInstance) return

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: reportStats.value.success,
            name: '成功',
            itemStyle: { color: '#34C759' }
          },
          {
            value: reportStats.value.failed,
            name: '失败',
            itemStyle: { color: '#FF3B30' }
          }
        ]
      }
    ]
  }

  chartInstance.setOption(option)
}

// 监听统计变化，更新图表
watch(() => reportStats.value, () => {
  updateChart()
}, { deep: true })

// 监听 workflowId 变化，重新加载数据
watch(() => props.workflowId, (newVal, oldVal) => {
  if (newVal !== oldVal && newVal) {
    // 更新查询参数
    queryParams.value.workflowId = newVal
    queryParams.value.pageNum = 1
    // 重置到列表视图
    if (selectedReport.value) {
      backToList()
    }
    // 重新加载报告列表
    loadReportList()
  }
}, { immediate: false })

// 监听选中报告变化，初始化图表
watch(() => selectedReport.value, (newVal) => {
  if (newVal) {
    nextTick(() => {
      initChart()
    })
  }
}, { immediate: true })

// 加载报告列表
const loadReportList = async () => {
  loading.value = true
  try {
    const response = await listWorkflowReports(queryParams.value)
    if (response && response.code === 200) {
      reportList.value = response.rows || []
      total.value = response.total || 0
    } else {
      throw new Error(response.msg || '加载报告列表失败')
    }
  } catch (error) {
    console.error('Failed to load report list:', error)
    ElMessage.error('加载报告列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 查看报告详情
const viewReportDetail = async (report) => {
  loading.value = true
  try {
    const response = await getWorkflowReport(report.reportId)
    if (response && response.code === 200) {
      selectedReport.value = response.data
      reportLogs.value = response.data.reportLogs || []
      activeTab.value = 'all'
    } else {
      throw new Error(response.msg || '加载报告详情失败')
    }
  } catch (error) {
    console.error('Failed to load report detail:', error)
    ElMessage.error('加载报告详情失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 返回列表
const backToList = () => {
  selectedReport.value = null
  reportLogs.value = []
  activeTab.value = 'all'
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
}

// 查看执行详情
const showExecutionDetail = async (log) => {
  if (!log.logId) {
    ElMessage.warning('该记录没有日志ID')
    return
  }

  showDetailDialog.value = true
  selectedLog.value = null
  detailLoading.value = true

  try {
    const response = await getExecutionLog(log.logId)
    if (response.code === 200) {
      selectedLog.value = response.data
    } else {
      throw new Error(response.msg || '获取详情失败')
    }
  } catch (error) {
    console.error('Failed to load execution detail:', error)
    ElMessage.error(`加载执行详情失败: ${error.message}`)
    showDetailDialog.value = false
  } finally {
    detailLoading.value = false
  }
}

// 组件挂载时加载列表
onMounted(() => {
  loadReportList()
})

// 暴露刷新方法给父组件
defineExpose({
  refresh: loadReportList
})

// 组件卸载时销毁图表
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.test-report-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  overflow: hidden;
}

/* ===== 列表区域 ===== */
.report-list-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 表格包装器 - 占据剩余空间并可滚动 */
.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.table-wrapper :deep(.el-table__row) {
  cursor: pointer;
}

.table-wrapper :deep(.el-table__row:hover) {
  background-color: rgba(102, 126, 234, 0.05);
}

/* 分页固定在底部 */
.pagination-wrapper {
  flex-shrink: 0;
  padding-top: 16px;
}

/* ===== 详情区域 ===== */
.report-detail-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.detail-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 可滚动的内容区域 */
.detail-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.detail-content::-webkit-scrollbar {
  width: 6px;
}

.detail-content::-webkit-scrollbar-track {
  background: #F3F4F6;
  border-radius: 3px;
}

.detail-content::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
  transition: background 0.2s;
}

.detail-content::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}

/* ===== 统计面板样式 ===== */
.stats-section {
  margin-bottom: 24px;
  padding: 24px;
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* ===== 图表包装器 ===== */
.stat-chart-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.center-rate {
  font-size: 34px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.2;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif;
}

.center-label {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 4px;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;
}

/* ===== 统计项样式 ===== */
.stat-item {
  text-align: center;
  padding: 20px 16px;
  transition: opacity 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.stat-item:hover {
  opacity: 0.85;
}

.stat-label {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.2;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif;
}

.stat-rate {
  font-size: 15px;
  font-weight: 400;
  margin-left: 6px;
  color: rgba(0, 0, 0, 0.55);
}

.stat-unit {
  font-size: 15px;
  font-weight: 400;
  margin-left: 4px;
  color: rgba(0, 0, 0, 0.55);
}

.stat-success .stat-value {
  color: #34C759;
}

.stat-failed .stat-value {
  color: #FF3B30;
}

/* ===== Tab 样式 ===== */
.result-tabs {
  margin-bottom: 16px;
}

.result-tabs :deep(.el-tabs__nav) {
  margin-bottom: 16px;
}

.result-tabs :deep(.el-tabs__item) {
  font-weight: 500;
  color: #6B7280;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.result-tabs :deep(.el-tabs__item.is-active) {
  color: #3B82F6;
  font-weight: 600;
}

.result-tabs :deep(.el-tabs__active-bar) {
  background-color: #3B82F6;
}

.result-tabs :deep(.el-badge) {
  margin-left: 8px;
}

.result-tabs :deep(.el-badge__content.is-fixed) {
  border-radius: 10px;
  font-weight: 600;
}

/* ===== 结果列表样式 ===== */
.results-list {
  padding-right: 8px;
}

.no-results {
  text-align: center;
  color: #9CA3AF;
  padding: 80px 0;
  font-size: 14px;
  font-weight: 400;
}

/* ===== 结果项样式 ===== */
.result-item {
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 8px;
  transition: background 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 150ms;
  background: #FFFFFF;
  position: relative;
}

.result-item.result-success,
.result-item.result-failed {
  cursor: pointer;
}

.result-item.result-success:hover,
.result-item.result-failed:hover {
  background: #F9FAFB;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.result-success {
  background: #ECFDF5;
}

.result-success:hover {
  background: #D1FAE5;
}

.result-failed {
  background: #FEF2F2;
}

.result-failed:hover {
  background: #FEE2E2;
}

.result-log {
  background: #F8FAFC;
  border-left: 3px solid #6B7280;
}

.result-log:hover {
  background: #F1F5F9;
}

.result-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

/* ===== Log 内容样式 ===== */
.log-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.log-status {
  flex-shrink: 0;
  padding-top: 2px;
}

.log-info {
  flex: 1;
  min-width: 0;
}

.log-message {
  font-size: 14px;
  font-weight: 500;
  color: #1F2937;
  line-height: 1.6;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.log-timestamp {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
  font-weight: 400;
}

.result-status {
  flex-shrink: 0;
  padding-top: 2px;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-main {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.result-name {
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
  flex-shrink: 0;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.method-tag {
  flex-shrink: 0;
}

.result-url {
  font-size: 13px;
  color: #6B7280;
  word-break: break-all;
  line-height: 1.6;
  font-weight: 400;
}

.result-metrics {
  display: flex;
  gap: 24px;
  flex-shrink: 0;
  padding-top: 4px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.metric-label {
  font-size: 11px;
  color: #9CA3AF;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.result-action {
  flex-shrink: 0;
  padding-top: 4px;
  color: #9CA3AF;
  transition: color 200ms, transform 200ms;
}

.result-item:hover .result-action {
  color: #3B82F6;
  transform: translateX(4px);
}
</style>
