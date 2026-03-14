<template>
  <el-dialog
    v-model="dialogVisible"
    title="工作流运行配置"
    :width="isExecuting || displayItems.length > 0 ? '1200px' : '560px'"
    :close-on-click-modal="false"
    @close="handleClose"
    class="workflow-run-dialog"
  >
    <el-form
      ref="formRef"
      :model="runConfig"
      :rules="formRules"
      label-width="100px"
      :inline="isExecuting || displayItems.length > 0"
    >
      <!-- 测试数据集 -->
      <el-form-item label="测试数据集" prop="parameterizationId">
        <el-select
          v-model="runConfig.parameterizationId"
          placeholder="请选择测试数据集"
          :style="{ width: isExecuting || displayItems.length > 0 ? '150px' : '100%' }"
          :loading="datasetsLoading"
          clearable
        >
          <el-option
            label="不选择数据集"
            :value="null"
          />
          <el-option
            v-for="dataset in datasetsList"
            :key="dataset.parameterizationId"
            :label="dataset.name"
            :value="dataset.parameterizationId"
          />
        </el-select>
      </el-form-item>

      <!-- 环境选择器 -->
      <el-form-item label="执行环境" prop="envId">
        <el-select
          v-model="runConfig.envId"
          placeholder="请选择执行环境"
          :style="{ width: isExecuting || displayItems.length > 0 ? '150px' : '100%' }"
          :loading="environmentsLoading"
        >
          <el-option
            v-for="env in environmentsList"
            :key="env.id"
            :label="env.name"
            :value="env.id"
          />
        </el-select>
      </el-form-item>

      <!-- 循环次数和并发执行 -->
      <el-row :gutter="16" v-if="!isExecuting && displayItems.length === 0">
        <el-col :span="12">
          <el-form-item label="循环次数" prop="loopCount">
            <el-input-number
              v-model="runConfig.loopCount"
              :min="1"
              :max="1000"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="并发执行" prop="threadingCount">
            <el-input-number
              v-model="runConfig.threadingCount"
              :min="1"
              :max="100"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 执行时只显示循环次数 -->
      <el-form-item label="循环次数" prop="loopCount" v-if="isExecuting || displayItems.length > 0">
        <el-input-number
          v-model="runConfig.loopCount"
          :min="1"
          :max="1000"
          :style="{ width: '120px' }"
        />
      </el-form-item>
    </el-form>

    <!-- 统计面板 -->
    <div v-if="displayItems.length > 0 || isExecuting" class="stats-section">
      <el-row :gutter="24" style="align-items: center;">
        <el-col :span="6">
          <div class="stat-chart-wrapper">
            <div ref="chartRef" style="width: 160px; height: 160px; margin: 0 auto;"></div>
            <div class="chart-center-text">
              <div class="center-rate">{{ testStats.successRate }}%</div>
              <div class="center-label">成功率</div>
            </div>
          </div>
        </el-col>
        <el-col :span="18">
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">总接口数</div>
                <div class="stat-value">{{ testStats.total }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item stat-success">
                <div class="stat-label">成功数</div>
                <div class="stat-value">
                  {{ testStats.success }}
                  <span class="stat-rate">({{ testStats.successRate }}%)</span>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item stat-failed">
                <div class="stat-label">失败数</div>
                <div class="stat-value">
                  {{ testStats.failed }}
                  <span class="stat-rate">({{ testStats.failureRate }}%)</span>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">平均响应时长</div>
                <div class="stat-value">{{ testStats.avgResponseTime }}<span class="stat-unit">ms</span></div>
              </div>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </div>

    <!-- 测试结果展示 -->
    <div v-if="displayItems.length > 0 || isExecuting" class="test-results-container">
      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab" class="result-tabs">
        <el-tab-pane name="all">
          <template #label>
            <span>全部 <el-badge :value="testStats.total" :max="999" /></span>
          </template>
        </el-tab-pane>
        <el-tab-pane name="success">
          <template #label>
            <span>通过 <el-badge :value="testStats.success" :max="999" type="success" /></span>
          </template>
        </el-tab-pane>
        <el-tab-pane name="failed">
          <template #label>
            <span>失败 <el-badge :value="testStats.failed" :max="999" type="danger" /></span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 结果列表 -->
      <div class="results-list" ref="resultsListRef">
        <div v-if="filteredResults.length === 0 && isExecuting" class="no-results">
          正在执行测试...
        </div>
        <div v-else-if="filteredResults.length === 0" class="no-results">
          暂无测试结果
        </div>
        <div
          v-for="(result, index) in filteredResults"
          :key="index"
          :class="getResultItemClass(result)"
          @click="result.event_type === 'case_result' && result.log_id ? showExecutionDetail(result) : null"
        >
          <!-- Log 类型展示 -->
          <div v-if="result.event_type === 'log'" class="log-content">
            <div class="log-status">
              <el-icon :size="18" color="#6B7280">
                <InfoFilled />
              </el-icon>
            </div>
            <div class="log-info">
              <div class="log-message">{{ result.message }}</div>
              <div v-if="result.timestamp" class="log-timestamp">{{ formatTimestamp(result.timestamp) }}</div>
            </div>
          </div>

          <!-- Case Result 类型展示 -->
          <div v-else-if="result.event_type === 'case_result'" class="result-content">
            <!-- 状态图标 -->
            <div class="result-status">
              <el-icon :size="20" :color="result.is_success ? '#34C759' : '#FF3B30'">
                <component :is="result.is_success ? 'CircleCheck' : 'CircleClose'" />
              </el-icon>
            </div>

            <!-- 接口信息 -->
            <div class="result-info">
              <div class="result-main">
                <span class="result-name">{{ result.case_name }}</span>
                <el-tag
                  :type="getMethodTagType(result.request_method)"
                  size="small"
                  class="method-tag"
                >
                  {{ result.request_method }}
                </el-tag>
              </div>
              <div class="result-url">{{ result.request_url }}</div>
            </div>

            <!-- 响应信息 -->
            <div class="result-metrics">
              <div class="metric-item">
                <span class="metric-label">状态码</span>
                <el-tag
                  :type="getStatusCodeTagType(result.response_status_code)"
                  size="small"
                >
                  {{ result.response_status_code }}
                </el-tag>
              </div>
              <div class="metric-item">
                <span class="metric-label">响应时长</span>
                <span class="metric-value">{{ formatResponseTime(result.response_time) }}</span>
              </div>
            </div>

            <!-- 查看详情按钮 -->
            <div class="result-action" v-if="result.log_id">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="result.event_type === 'case_result' && !result.is_success && result.error_message" class="result-error">
            <el-icon><Warning /></el-icon>
            <span>{{ result.error_message }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="executionLogs.length > 0" @click="clearExecLogs">清空日志</el-button>
        <el-button @click="handleCancel">{{ isExecuting ? '关闭' : '取消' }}</el-button>
        <el-button v-if="!isExecuting && executionLogs.length === 0" @click="handleSave" :loading="saving">保存</el-button>
        <el-button v-if="isExecuting" type="danger" @click="stopExecution">停止</el-button>
        <el-button type="primary" @click="handleRun" :loading="isExecuting" :disabled="isExecuting">
          {{ isExecuting ? '执行中...' : '执行' }}
        </el-button>
      </div>
    </template>
  </el-dialog>

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
      :loading="detailLoading"
    />
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, CircleClose, Warning, ArrowRight, InfoFilled } from '@element-plus/icons-vue'
import { getWorkflowTestDataList } from '../api/testData'
import { listEnvironments } from '@/api/api_environments/environments'
import { getToken } from '@/utils/auth'
import * as echarts from 'echarts'
import { getExecutionLog } from '@/api/api_test_execution_log/execution_log'
import ExecutionDetail from '@/views/api_test_cases/test_cases/components/ExecutionDetail.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  workflowId: {
    type: [Number, String],
    default: null
  },
  currentEnvId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'run', 'save'])

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 表单引用
const formRef = ref()
const logContainerRef = ref()
const resultsListRef = ref()
const chartRef = ref()

// ECharts 实例
let chartInstance = null

// 加载状态
const datasetsLoading = ref(false)
const environmentsLoading = ref(false)
const saving = ref(false)
const isExecuting = ref(false)

// 数据列表
const datasetsList = ref([])
const environmentsList = ref([])

// 执行日志
const executionLogs = ref([])

// 测试用例结果（仅用于统计）
const caseResults = ref([])

// 所有展示项（包括log和case_result）
const displayItems = ref([])

// Tab 切换状态
const activeTab = ref('all')

// 详情弹窗状态
const showDetailDialog = ref(false)
const selectedRecord = ref(null)
const detailLoading = ref(false)

// 执行统计
const executionStats = reactive({
  totalNodes: 0,
  successNodes: 0,
  failedNodes: 0,
  currentLoop: 0
})

// 运行配置
const runConfig = ref({
  parameterizationId: null,
  envId: null,
  loopCount: 1,
  threadingCount: 1
})

// 计算属性 - 测试统计
const testStats = computed(() => {
  const total = caseResults.value.length
  const success = caseResults.value.filter(r => r.is_success).length
  const failed = total - success
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0
  const failureRate = total > 0 ? Math.round((failed / total) * 100) : 0

  // 计算平均响应时长
  const totalResponseTime = caseResults.value.reduce((sum, r) => sum + (r.response_time || 0), 0)
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

// 计算属性 - 根据 Tab 过滤结果
const filteredResults = computed(() => {
  if (activeTab.value === 'success') {
    return displayItems.value.filter(r => r.event_type === 'case_result' && r.is_success)
  } else if (activeTab.value === 'failed') {
    return displayItems.value.filter(r => r.event_type === 'case_result' && !r.is_success)
  }
  return displayItems.value
})

// 计算属性 - 进度百分比
const progressPercentage = computed(() => {
  if (executionStats.totalNodes === 0) return 0
  return Math.round((executionStats.successNodes / executionStats.totalNodes) * 100)
})

const progressStatus = computed(() => {
  if (executionStats.failedNodes > 0) return 'exception'
  if (progressPercentage.value === 100) return 'success'
  return ''
})

// 表单验证规则
const formRules = {
  envId: [
    { required: true, message: '请选择执行环境', trigger: 'change' }
  ],
  loopCount: [
    { required: true, message: '请输入循环次数', trigger: 'blur' },
    { type: 'number', min: 1, max: 1000, message: '循环次数范围：1-1000', trigger: 'blur' }
  ],
  threadingCount: [
    { required: true, message: '请输入并发执行数', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '并发执行数范围：1-100', trigger: 'blur' }
  ]
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
  return date.toLocaleTimeString('zh-CN', { hour12: false })
}

// 获取结果项的CSS类
const getResultItemClass = (result) => {
  if (result.event_type === 'log') {
    return ['result-item', 'result-log']
  } else if (result.event_type === 'case_result') {
    return ['result-item', result.is_success ? 'result-success' : 'result-failed']
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

// 获取日志标签类型
const getLogTagType = (type) => {
  const typeMap = {
    'workflow_start': 'success',
    'workflow_end': 'success',
    'node_start': 'primary',
    'node_end': 'info',
    'log': '',
    'loop_start': 'warning',
    'loop_end': 'warning',
    'loop_iteration': 'warning',
    'custom': 'info',
    'config_info': 'info',
    'end': 'success'
  }
  return typeMap[type] || ''
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
            value: testStats.value.success,
            name: '成功',
            itemStyle: { color: '#34C759' }
          },
          {
            value: testStats.value.failed,
            name: '失败',
            itemStyle: { color: '#FF3B30' }
          }
        ]
      }
    ]
  }

  chartInstance.setOption(option)
}

// 监听测试统计变化，更新图表
watch(() => testStats.value, () => {
  updateChart()
}, { deep: true })

// 监听对话框显示状态，初始化图表
watch(() => [props.modelValue, caseResults.value.length], ([visible, resultsLength]) => {
  if (visible && resultsLength > 0) {
    nextTick(() => {
      initChart()
    })
  }
}, { immediate: true })

// 组件挂载时初始化
onMounted(() => {
  if (caseResults.value.length > 0) {
    initChart()
  }
})

// 组件卸载时销毁图表
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

// 滚动到结果列表底部
const scrollResultsToBottom = () => {
  nextTick(() => {
    if (resultsListRef.value) {
      resultsListRef.value.scrollTop = resultsListRef.value.scrollHeight
    }
  })
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
    }
  })
}

// 解析SSE数据
const parseSSEData = (data) => {
  try {
    return JSON.parse(data)
  } catch (e) {
    console.error('解析SSE数据失败:', e)
    return null
  }
}

// 更新统计
const updateStats = (log) => {
  if (log.type === 'node_start') {
    executionStats.totalNodes++
  } else if (log.type === 'node_end') {
    if (log.message && log.message.includes('完成')) {
      executionStats.successNodes++
    }
  } else if (log.type === 'workflow_start') {
    executionStats.currentLoop++
  }
}

// 处理测试用例结果和日志
const processCaseResult = (eventData) => {
  // 处理接口测试结果（计入统计）
  // API 返回的字段是驼峰命名（eventType, caseId, caseName 等）
  if (eventData.eventType === 'case_result' && eventData.data && eventData.data.response) {
    const response = eventData.data.response
    const caseResult = {
      event_type: 'case_result',
      case_id: response.caseId,
      case_name: response.caseName,
      request_method: response.requestMethod,
      request_url: response.requestUrl,
      response_status_code: response.responseStatusCode,
      response_time: response.responseTime,
      is_success: response.isSuccess,
      error_message: response.errorMessage,
      // logId 在顶层 eventData 中，而不是在 response 中
      log_id: eventData.logId || response.logId,
      timestamp: eventData.timestamp
    }
    caseResults.value.push(caseResult)
    displayItems.value.push(caseResult)
    scrollResultsToBottom()
  }
  // 处理日志（不计入统计，仅展示）
  else if (eventData.eventType === 'log') {
    const logItem = {
      event_type: 'log',
      message: eventData.message,
      timestamp: eventData.timestamp,
      node_id: eventData.nodeId,
      log_id: eventData.logId,
      is_success: eventData.isSuccess,
      data: eventData.data
    }
    displayItems.value.push(logItem)
    scrollResultsToBottom()
  }
}

// 查看执行详情
const showExecutionDetail = async (result) => {
  if (!result.log_id) {
    ElMessage.warning('该记录没有日志ID')
    return
  }

  showDetailDialog.value = true
  selectedRecord.value = null
  detailLoading.value = true

  try {
    const response = await getExecutionLog(result.log_id)
    if (response.code === 200) {
      selectedRecord.value = response.data
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

// 加载测试数据集列表
const loadDatasets = async () => {
  if (!props.workflowId) return

  datasetsLoading.value = true
  try {
    const response = await getWorkflowTestDataList(props.workflowId)
    if (response && response.code === 200) {
      datasetsList.value = response.rows || []

      // 默认不选择数据集
      if (!runConfig.value.parameterizationId) {
        runConfig.value.parameterizationId = null
      }
    }
  } catch (error) {
    console.error('加载测试数据集失败:', error)
    ElMessage.error('加载测试数据集失败')
  } finally {
    datasetsLoading.value = false
  }
}

// 加载环境列表
const loadEnvironments = async () => {
  environmentsLoading.value = true
  try {
    const queryParams = {
      pageNum: 1,
      pageSize: 999,
      name: null,
      projectId: null,
      createTime: null,
    }

    const response = await listEnvironments(queryParams)

    if (response && response.code === 200) {
      environmentsList.value = response.rows || []

      // 如果传入了当前环境ID，使用它
      if (props.currentEnvId) {
        runConfig.value.envId = props.currentEnvId
      } else if (environmentsList.value.length > 0) {
        // 查找默认环境
        const defaultEnv = environmentsList.value.find(env => env.isDefault === 1)
        if (defaultEnv) {
          runConfig.value.envId = defaultEnv.id
        } else {
          runConfig.value.envId = environmentsList.value[0].id
        }
      }
    }
  } catch (error) {
    console.error('加载环境列表失败:', error)
    ElMessage.error('加载环境列表失败')
  } finally {
    environmentsLoading.value = false
  }
}

// 监听对话框打开
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    // 对话框打开时加载数据
    loadDatasets()
    loadEnvironments()

    // 设置默认值
    if (props.currentEnvId) {
      runConfig.value.envId = props.currentEnvId
    }
  }
})

// 取消
const handleCancel = () => {
  dialogVisible.value = false
}

// 关闭
const handleClose = () => {
  // 重置表单
  formRef.value?.resetFields()
  runConfig.value = {
    parameterizationId: null,
    envId: null,
    loopCount: 1,
    threadingCount: 1
  }
  // 不清空日志，让用户可以查看历史执行记录
}

// 保存配置
const handleSave = async () => {
  try {
    await formRef.value.validate()

    saving.value = true

    // TODO: 调用保存配置的接口
    // await saveWorkflowConfig(props.workflowId, runConfig.value)

    ElMessage.success('配置已保存')
    emit('save', runConfig.value)

  } catch (error) {
    if (error !== false) {
      console.error('保存配置失败:', error)
      ElMessage.error('保存配置失败')
    }
  } finally {
    saving.value = false
  }
}

// 当前请求的 AbortController
let abortController = null

// 执行
const handleRun = async () => {
  try {
    await formRef.value.validate()

    // 重置状态
    executionStats.totalNodes = 0
    executionStats.successNodes = 0
    executionStats.failedNodes = 0
    executionStats.currentLoop = 0
    executionLogs.value = []
    caseResults.value = []
    displayItems.value = []
    activeTab.value = 'all'

    isExecuting.value = true

    // 创建 AbortController 用于取消请求
    abortController = new AbortController()

    const token = getToken()
    let url = '/dev-api/workflow/workflow/exec'

    if (import.meta.env.PROD) {
      const baseUrl = import.meta.env.VITE_APP_BASE_API || ''
      url = `${baseUrl}/workflow/workflow/exec`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        parameterizationId: runConfig.value.parameterizationId,
        envId: runConfig.value.envId,
        loopCount: runConfig.value.loopCount,
        workflowId: props.workflowId
      }),
      signal: abortController.signal
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    // 流式读取数据
    const processStream = async () => {
      try {
        while (true) {
          // ⭐ 检查是否已经中止
          if (abortController?.signal.aborted) {
            console.log('检测到中止信号，停止读取流')
            break
          }

          const { done, value } = await reader.read()

          if (done) {
            // 处理缓冲区中剩余的数据
            if (buffer.trim()) {
              processLine(buffer)
            }
            isExecuting.value = false
            ElMessage.success('工作流执行完成')
            emit('run', runConfig.value)
            break
          }

          // 解码并添加到缓冲区
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // 按行分割处理
          const lines = buffer.split('\n')
          // 保留最后一个可能不完整的行
          buffer = lines.pop() || ''

          // 处理完整的行
          for (const line of lines) {
            processLine(line)
          }
        }
      } finally {
        // ⭐ 确保 reader 被正确关闭
        try {
          await reader.cancel()
        } catch (e) {
          // 忽略取消错误
        }
      }
    }

    await processStream()

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('请求已取消')
    } else {
      console.error('执行失败:', error)
      ElMessage.error('执行失败: ' + error.message)
    }
    isExecuting.value = false
  }
}

// 处理单行数据
const processLine = (line) => {
  const trimmedLine = line.trim()
  if (trimmedLine.startsWith('data: ')) {
    const jsonStr = trimmedLine.substring(6).trim()
    if (jsonStr) {
      const eventData = parseSSEData(jsonStr)
      if (eventData) {
        // 处理测试用例结果
        processCaseResult(eventData)

        // 保留原有的日志处理逻辑（如果需要的话）
        executionLogs.value.push(eventData)
        updateStats(eventData)
        scrollToBottom()

        if (eventData.eventType === 'end' || eventData.type === 'end') {
          isExecuting.value = false
        }
      }
    }
  }
}

// 停止执行
const stopExecution = () => {
  if (!abortController) {
    console.warn('没有正在执行的任务')
    return
  }

  console.log('正在停止工作流执行...')

  // ⭐ 中止 fetch 请求，这会：
  // 1. 设置 abortController.signal.aborted = true
  // 2. 触发 processStream 中的检查，退出循环
  // 3. 关闭网络连接，后端会检测到断开并停止执行
  abortController.abort()
  abortController = null

  isExecuting.value = false
  ElMessage.warning('已停止执行')
}

// 清空执行日志
const clearExecLogs = () => {
  executionLogs.value = []
  caseResults.value = []
  displayItems.value = []
  executionStats.totalNodes = 0
  executionStats.successNodes = 0
  executionStats.failedNodes = 0
  executionStats.currentLoop = 0
  activeTab.value = 'all'
}
</script>

<style scoped>
/* ===== 对话框样式 (Apple Design) ===== */
.workflow-run-dialog :deep(.el-dialog) {
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.03);
}

.workflow-run-dialog :deep(.el-dialog__header) {
  padding: 24px 24px 16px;
  border-bottom: 1px solid rgba(120, 120, 128, 0.2);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(180%) blur(30px);
}

.workflow-run-dialog :deep(.el-dialog__title) {
  font-size: 22px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif;
  line-height: 1.2;
}

.workflow-run-dialog :deep(.el-dialog__body) {
  padding: 24px;
  background: #F2F2F7;
}

.workflow-run-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid rgba(120, 120, 128, 0.2);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(180%) blur(30px);
}

/* ===== 表单样式 (Apple Design) ===== */
:deep(.el-form-item__label) {
  font-weight: 500;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.85);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  padding: 1px 11px;
}

:deep(.el-input__wrapper) {
  background: #E5E5EA;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 10px 12px;
  transition: all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: none;
}

:deep(.el-input__wrapper:hover) {
  background: rgba(229, 229, 234, 0.8);
}

:deep(.el-input__wrapper.is-focus) {
  background: #FFFFFF;
  border-color: #007AFF;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

/* ===== 统计面板样式 (Apple Design - 完全去除卡片设计，仅留白) ===== */
.stats-section {
  margin-bottom: 24px;
  padding: 24px 0;
}

/* ===== 图表包装器 (Apple Design) ===== */
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

/* ===== 统计项样式 (Apple Design - 完全去除卡片设计，仅留白) ===== */
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
.test-results-container {
  margin-top: 20px;
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
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.results-list::-webkit-scrollbar {
  width: 6px;
}

.results-list::-webkit-scrollbar-track {
  background: #F3F4F6;
  border-radius: 3px;
}

.results-list::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
  transition: background 0.2s;
}

.results-list::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}

.no-results {
  text-align: center;
  color: #9CA3AF;
  padding: 80px 0;
  font-size: 14px;
  font-weight: 400;
}

/* ===== 结果项样式 (Apple Design - 去除卡片设计) ===== */
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

/* ===== 错误信息样式 (Apple Design - 去除卡片设计) ===== */
.result-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 14px;
  background: #FEE2E2;
  border-radius: 6px;
  color: #EF4444;
  font-size: 13px;
  line-height: 1.6;
}

.result-error .el-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

/* ===== 底部按钮区域 ===== */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer :deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
  padding: 9px 20px;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: all 0.2s;
}

.dialog-footer :deep(.el-button--primary) {
  background-color: #3B82F6;
  border-color: #3B82F6;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.dialog-footer :deep(.el-button--primary:hover) {
  background-color: #2563EB;
  border-color: #2563EB;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

.dialog-footer :deep(.el-button--danger) {
  background-color: #EF4444;
  border-color: #EF4444;
}

.dialog-footer :deep(.el-button--danger:hover) {
  background-color: #DC2626;
  border-color: #DC2626;
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
}

.dialog-footer :deep(.el-button--default) {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  color: #1F2937;
}

.dialog-footer :deep(.el-button--default:hover) {
  background: #F9FAFB;
  border-color: #D1D5DB;
}

/* ===== 旧样式 - 保留兼容 (优化) ===== */
.exec-log-container {
  height: 350px;
  overflow-y: auto;
  background: #F8FAFC;
  border-radius: 8px;
  padding: 12px;
}

.exec-log-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: #FFFFFF;
  border-radius: 6px;
  font-size: 12px;
  border-left: 3px solid transparent;
}

.log-type-workflow_start,
.log-type-workflow_end {
  border-left-color: #10B981;
  background: #ECFDF5;
}

.log-type-node_start,
.log-type-node_end {
  border-left-color: #3B82F6;
}

.log-type-log {
  border-left-color: #6B7280;
}

.log-type-loop_start,
.log-type-loop_end,
.log-type-loop_iteration {
  border-left-color: #F59E0B;
  background: #FEF3C7;
}

.log-type-end {
  border-left-color: #10B981;
  background: #ECFDF5;
}

.log-icon {
  margin-right: 8px;
}

.log-time {
  color: #9CA3AF;
  font-size: 11px;
  margin-right: 8px;
  white-space: nowrap;
  font-weight: 500;
}

.log-message {
  flex: 1;
  color: #1F2937;
  margin-left: 8px;
  font-weight: 400;
}

.log-node-id {
  color: #9CA3AF;
  font-size: 11px;
  margin-left: 8px;
}

.no-logs {
  text-align: center;
  color: #9CA3AF;
  padding: 60px 0;
}
</style>
