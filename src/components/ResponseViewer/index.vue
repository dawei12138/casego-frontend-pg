<template>
  <div class="response-viewer-container">
    <div v-if="!data" class="no-data">
      <p>没有可用的执行数据。</p>
    </div>
    <div v-else>
      <div class="response-summary">
        <el-tag :type="statusTagType" class="status-code">{{ displayStatusCode }}</el-tag>
        <div class="summary-item">
          <strong>响应时间:</strong> {{ displayResponseTime }}
        </div>
        <div class="summary-item">
          <strong>执行时间:</strong> {{ formatTime(data.executionTime) }}
        </div>
        <div class="summary-item">
          <strong>状态:</strong>
          <el-tag :type="data.isSuccess ? 'success' : 'danger'">{{ data.isSuccess ? '成功' : '失败' }}</el-tag>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="response-tabs">
        <el-tab-pane label="响应体" name="body">
          <div class="tab-content">
            <pre class="json-content">{{ formattedBody }}</pre>
          </div>
        </el-tab-pane>
        <el-tab-pane label="响应头" name="headers">
          <div class="tab-content">
            <el-table :data="formattedHeaders" size="small" class="info-table">
              <el-table-column prop="key" label="名称" width="250" />
              <el-table-column prop="value" label="值" />
            </el-table>
          </div>
        </el-tab-pane>
        <el-tab-pane label="响应Cookies" name="cookies">
          <div class="tab-content">
            <div v-if="formattedCookies.length">
              <el-table :data="formattedCookies" size="small" class="info-table">
                <el-table-column prop="key" label="名称" width="250" />
                <el-table-column prop="value" label="值" />
              </el-table>
            </div>
            <p v-else class="no-data">没有响应 Cookies。</p>
          </div>
        </el-tab-pane>
        <el-tab-pane label="请求信息" name="request">
          <div class="tab-content">
            <div class="request-details">
              <div class="request-url">
                <el-tag :type="methodTagType" class="request-method">{{ request.request_method }}</el-tag>
                <span>{{ request.request_url }}</span>
              </div>

              <div v-if="formattedRequestHeaders.length" class="request-section">
                <h4>请求头</h4>
                <el-table :data="formattedRequestHeaders" size="small" class="info-table">
                  <el-table-column prop="key" label="名称" width="250" />
                  <el-table-column prop="value" label="值" />
                </el-table>
              </div>

              <div v-if="formattedRequestParams.length" class="request-section">
                <h4>请求参数</h4>
                <el-table :data="formattedRequestParams" size="small" class="info-table">
                  <el-table-column prop="key" label="名称" width="250" />
                  <el-table-column prop="value" label="值" />
                </el-table>
              </div>

              <div v-if="request.request_body" class="request-section">
                <h4>请求体</h4>
                <pre class="json-content">{{ formattedRequestBody }}</pre>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="断言结果" name="assertions">
          <div class="tab-content">
            <div v-if="assertionResult && assertionResult.log.results.length">
              <el-table :data="assertionResult.log.results" size="small" class="info-table">
                <el-table-column label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.success ? 'success' : 'danger'">
                      {{ row.success ? '通过' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="assertion_type" label="断言类型" width="150" />
                <el-table-column prop="assertion_method" label="比较方法" width="120" />
                <el-table-column prop="expected_value" label="期望值" />
                <el-table-column prop="actual_value" label="实际值" />
              </el-table>
            </div>
            <p v-else class="no-data">没有断言结果。</p>
          </div>
        </el-tab-pane>
        <el-tab-pane name="setup">
          <template #label>
            <span>
              前置执行
              <el-badge v-if="setupResults.length" :value="setupResults.length" class="tab-badge" />
            </span>
          </template>
          <div class="tab-content">
            <div v-if="setupResults.length" class="script-results-container">
              <el-collapse v-model="activeSetupPanels" accordion>
                <el-collapse-item
                  v-for="(result, index) in setupResults"
                  :key="index"
                  :name="index"
                >
                  <template #title>
                    <div class="script-result-header">
                      <el-tag :type="result.success ? 'success' : 'danger'" size="small">
                        {{ result.success ? '成功' : '失败' }}
                      </el-tag>
                      <span class="script-result-title">{{ result.message || '前置脚本 #' + (index + 1) }}</span>
                      <span class="script-result-time">{{ formatExecutionTime(result.execution_time) }}</span>
                    </div>
                  </template>
                  <div class="script-result-content">
                    <div v-if="result.error" class="result-error">
                      <strong>错误:</strong> {{ result.error }}
                    </div>
                    <div v-if="result.log" class="result-log">
                      <h5>执行日志:</h5>
                      <pre class="log-content">{{ formatScriptLog(result.log) }}</pre>
                    </div>
                    <div v-if="result.variables && Object.keys(result.variables).length" class="result-variables">
                      <h5>变量:</h5>
                      <pre class="json-content">{{ JSON.stringify(result.variables, null, 2) }}</pre>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
            <p v-else class="no-data">没有前置执行结果。</p>
          </div>
        </el-tab-pane>
        <el-tab-pane name="teardown">
          <template #label>
            <span>
              后置执行
              <el-badge v-if="teardownResults.length" :value="teardownResults.length" class="tab-badge" />
            </span>
          </template>
          <div class="tab-content">
            <div v-if="teardownResults.length" class="script-results-container">
              <el-collapse v-model="activeTeardownPanels" accordion>
                <el-collapse-item
                  v-for="(result, index) in teardownResults"
                  :key="index"
                  :name="index"
                >
                  <template #title>
                    <div class="script-result-header">
                      <el-tag :type="result.success ? 'success' : 'danger'" size="small">
                        {{ result.success ? '成功' : '失败' }}
                      </el-tag>
                      <span class="script-result-title">{{ result.message || '后置脚本 #' + (index + 1) }}</span>
                      <span class="script-result-time">{{ formatExecutionTime(result.execution_time) }}</span>
                    </div>
                  </template>
                  <div class="script-result-content">
                    <div v-if="result.error" class="result-error">
                      <strong>错误:</strong> {{ result.error }}
                    </div>
                    <div v-if="result.log" class="result-log">
                      <h5>执行日志:</h5>
                      <pre class="log-content">{{ formatScriptLog(result.log) }}</pre>
                    </div>
                    <div v-if="result.variables && Object.keys(result.variables).length" class="result-variables">
                      <h5>变量:</h5>
                      <pre class="json-content">{{ JSON.stringify(result.variables, null, 2) }}</pre>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
            <p v-else class="no-data">没有后置执行结果。</p>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => null
  }
})

const activeTab = ref('body')
const activeSetupPanels = ref(null)
const activeTeardownPanels = ref(null)

const executionData = computed(() => props.data?.executionData || {})
// 后端将请求与响应相关信息都放在 executionData.response 内
const http = computed(() => executionData.value.response || {})
const request = computed(() => http.value || {})
const assertionResult = computed(() => executionData.value.assersion_result || null)
const setupResults = computed(() => executionData.value.setup_results || [])
const teardownResults = computed(() => executionData.value.teardown_results || [])
const executionTimeSeconds = computed(() => (http.value.elapsed_ms || 0) / 1000)

const displayStatusCode = computed(() => props.data?.responseStatusCode ?? http.value.status_code ?? '-')
const displayResponseTime = computed(() => {
  if (props.data?.responseTime !== undefined && props.data?.responseTime !== null) {
    return `${Number(props.data.responseTime).toFixed(3)}s`
  }
  return `${executionTimeSeconds.value.toFixed(3)}s`
})

const formattedBody = computed(() => {
  const body = http.value.response_body
  if (body === undefined || body === null || body === '') return '响应体为空。'
  try {
    return typeof body === 'string' ? JSON.stringify(JSON.parse(body), null, 2) : JSON.stringify(body, null, 2)
  } catch {
    return typeof body === 'string' ? body : JSON.stringify(body, null, 2)
  }
})

const formattedHeaders = computed(() => {
  if (!http.value.response_headers) return []
  return Object.entries(http.value.response_headers).map(([key, value]) => ({ key, value }))
})

const formattedCookies = computed(() => {
  const cookies = http.value.response_cookies
  if (!cookies) return []
  return Object.entries(cookies).map(([key, value]) => ({ key, value }))
})

const formattedRequestHeaders = computed(() => {
  if (!request.value.request_headers) return []
  return Object.entries(request.value.request_headers).map(([key, value]) => ({ key, value }))
})

const formattedRequestParams = computed(() => {
  if (!request.value.request_params) return []
  return Object.entries(request.value.request_params).map(([key, value]) => ({ key, value }))
})

const formattedRequestBody = computed(() => {
  const body = request.value.request_body
  if (body === undefined || body === null || body === '') return '请求体为空。'
  try {
    return typeof body === 'string' ? JSON.stringify(JSON.parse(body), null, 2) : JSON.stringify(body, null, 2)
  } catch {
    return typeof body === 'string' ? body : JSON.stringify(body, null, 2)
  }
})

const statusTagType = computed(() => {
  const code = props.data?.responseStatusCode ?? http.value.status_code
  if (code >= 200 && code < 300) return 'success'
  if (code >= 300 && code < 400) return 'warning'
  if (code >= 400) return 'danger'
  return 'info'
})

const methodTagType = computed(() => {
  const method = request.value.request_method
  if (['POST', 'PUT', 'PATCH'].includes(method)) return 'warning'
  if (method === 'DELETE') return 'danger'
  return 'success'
})

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return new Date(timeStr).toLocaleString()
}

const formatExecutionTime = (time) => {
  if (time === undefined || time === null) return ''
  if (time < 1) {
    return `${(time * 1000).toFixed(2)}ms`
  }
  return `${time.toFixed(3)}s`
}

const formatScriptLog = (log) => {
  if (!log) return '无日志'
  try {
    // log 是一个 JSON 字符串，尝试解析并格式化
    const logObj = JSON.parse(log)
    if (logObj.logs) {
      return logObj.logs
    }
    return JSON.stringify(logObj, null, 2)
  } catch {
    return log
  }
}
</script>

<style scoped>
.response-viewer-container {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  padding: 20px;
  background-color: #f7f8fa;
}

.no-data {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.response-summary {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.status-code {
  font-size: 18px;
  font-weight: bold;
}

.summary-item {
  font-size: 14px;
}

.response-tabs {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}

.tab-content {
  padding: 15px;
  min-height: 300px;
  max-height: 50vh;
  overflow-y: auto;
}

.json-content {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: 15px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 48vh;
  overflow: auto;
}

.info-table {
  width: 100%;
}

.request-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.request-url {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: bold;
}

.request-method {
  font-weight: bold;
}

.request-section h4 {
  margin-bottom: 10px;
  font-size: 14px;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 5px;
}

.tab-badge {
  margin-left: 5px;
}

.script-results-container {
  padding: 0;
}

.script-result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.script-result-title {
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.script-result-time {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

.script-result-content {
  padding: 15px;
  background-color: #f7f8fa;
  border-radius: 4px;
}

.script-result-content > div {
  margin-bottom: 15px;
}

.script-result-content > div:last-child {
  margin-bottom: 0;
}

.result-message {
  padding: 10px;
  background-color: #e1f3d8;
  border-left: 3px solid #67c23a;
  border-radius: 4px;
  color: #606266;
}

.result-error {
  padding: 10px;
  background-color: #fef0f0;
  border-left: 3px solid #f56c6c;
  border-radius: 4px;
  color: #f56c6c;
}

.result-log h5,
.result-variables h5 {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #606266;
  font-weight: 600;
}

.log-content {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: 12px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow: auto;
  margin: 0;
  font-family: 'Courier New', Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
}

</style>
