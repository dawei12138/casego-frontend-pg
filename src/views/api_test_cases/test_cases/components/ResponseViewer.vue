<template>
  <div
    ref="containerRef"
    class="response-viewer"
    :class="{ 'drawer-mode': drawerMode }"
    :style="{ '--response-content-max-height': contentScrollableHeight + 'px' }"
  >
    <!-- 响应状态栏 -->
    <div ref="statusBarRef" class="response-status-bar">
      <div v-if="loading" class="status-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在发送请求...</span>
      </div>
      
      <div v-else-if="normalizedData?.response" class="status-info" :class="{ 'drawer-mode': drawerMode }">
        <el-tag
          :type="getStatusType(normalizedData.response.responseStatusCode)"
          effect="dark"
          size="large"
        >
          {{ normalizedData.response.responseStatusCode }}
        </el-tag>

        <div class="status-item">
          <span class="status-label">响应时间:</span>
          <span class="status-value">{{ formatTime(normalizedData.response.responseTime) }}s</span>
        </div>

        <div class="status-item">
          <span class="status-label">执行时间:</span>
          <span class="status-value">{{ normalizedData.response.executionTime }}</span>
        </div>

        <div class="status-item">
          <span class="status-label">状态:</span>
          <el-tag :type="normalizedData.response.isSuccess ? 'success' : 'danger'" size="small">
            {{ normalizedData.response.isSuccess ? '成功' : '失败' }}
          </el-tag>
        </div>
      </div>
    </div>
    
    <!-- 响应内容 -->
    <div class="response-content" ref="contentRef">
      <div v-if="!normalizedData && !loading" class="empty-response">
        <el-icon class="empty-icon"><ChatLineRound /></el-icon>
        <p class="empty-text">点击发送按钮查看响应结果</p>
      </div>

      <div v-else-if="loading" class="loading-response">
        <el-icon class="is-loading loading-icon"><Loading /></el-icon>
        <p>请求发送中，请稍候...</p>
      </div>

      <el-tabs
        v-else-if="normalizedData"
        v-model="activeTab"
        type="card"
        class="response-tabs"
        ref="tabsRef"
      >
        <!-- 响应体 -->
        <el-tab-pane label="响应体" name="body">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>响应内容</span>
                <div class="header-actions">
                  <!-- JSONPath 测试输入框 - 仅在JSON响应时显示 -->
                  <template v-if="isJsonResponse()">
                    <el-input
                      v-model="jsonpathExpression"
                      placeholder="输入 JSONPath 或右键编辑器提取路径"
                      clearable
                      @keyup.enter="testJsonPath"
                      style="width: 300px; margin-right: 8px;"
                      size="small"
                    >
                      <template #prepend>JSONPath</template>
                    </el-input>
                    <el-button size="small" type="primary" @click="testJsonPath" :disabled="!jsonpathExpression">
                      测试
                    </el-button>
                    <el-button size="small" @click="clearJsonPathResult" :disabled="jsonpathResult === null">
                      清空
                    </el-button>
                    <el-divider direction="vertical" />
                  </template>
                  <el-button v-if="isJsonResponse()" size="small" :icon="isResponseBodyFullscreen ? Close : FullScreen" @click="toggleResponseBodyFullscreen">
                    {{ isResponseBodyFullscreen ? '退出全屏' : '全屏' }}
                  </el-button>
                  <el-button size="small" @click="copyResponse">复制</el-button>
                  <el-button v-if="!normalizedData.response.isSuccess" size="small" type="danger" @click="showErrorDetail">
                    查看错误
                  </el-button>
                </div>
              </div>
            </template>
            
            <!-- 显示错误信息 -->
            <div v-if="!normalizedData.response.isSuccess && normalizedData.response.errorMessage" class="error-message">
              <el-alert
                :title="normalizedData.response.errorMessage"
                type="error"
                :closable="false"
                show-icon
              />
            </div>
            
            <!-- 图片预览 -->
            <div v-if="isImageResponse()" class="image-preview">
              <img :src="getImageSrc()" alt="响应图片" />
              <div class="image-info">
                <p>类型: {{ normalizedData.response.responseBody.content_type }}</p>
                <p>大小: {{ formatFileSize(normalizedData.response.responseBody.size) }}</p>
              </div>
            </div>

            <!-- HTML响应 -->
            <div v-else-if="isHtmlResponse()" class="html-response">
              <el-tabs v-model="htmlViewMode" type="border-card">
                <el-tab-pane label="渲染视图" name="preview">
                  <div class="html-preview-container">
                    <iframe
                      ref="htmlPreviewFrame"
                      :srcdoc="getHtmlContent()"
                      class="html-preview-frame"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </el-tab-pane>
                <el-tab-pane label="源码" name="source">
                  <el-input
                    :model-value="getHtmlContent()"
                    type="textarea"
                    readonly
                    :rows="12"
                    class="response-textarea"
                  />
                </el-tab-pane>
              </el-tabs>
            </div>

            <!-- 普通文本响应 - JSON 使用 Monaco Editor 编辑器 -->
            <template v-else-if="isJsonResponse()">
              <!-- JSONPath 测试结果展示 -->
              <div v-if="jsonpathResult !== null" class="jsonpath-result">
                <div class="result-header">
                  <span class="result-label">测试结果:</span>
                  <el-button size="small" @click="copyJsonPathResult">复制结果</el-button>
                </div>
                <div class="result-content">
                  <pre>{{ jsonpathResultFormatted }}</pre>
                </div>
              </div>

              <!-- JSON 编辑器 -->
              <div class="monaco-editor-wrapper" :class="{ 'is-fullscreen': isResponseBodyFullscreen }">
                <!-- 全屏模式下的工具栏 -->
                <div v-if="isResponseBodyFullscreen" class="monaco-toolbar fullscreen-toolbar">
                  <el-input
                    v-model="jsonpathExpression"
                    placeholder="输入 JSONPath 或右键编辑器提取路径"
                    clearable
                    @keyup.enter="testJsonPath"
                    style="width: 400px; margin-right: 8px;"
                  >
                    <template #prepend>JSONPath</template>
                  </el-input>
                  <el-button type="primary" @click="testJsonPath" :disabled="!jsonpathExpression">
                    测试
                  </el-button>
                  <el-button @click="clearJsonPathResult" :disabled="jsonpathResult === null">
                    清空
                  </el-button>
                  <div style="flex: 1;"></div>
                  <el-button :icon="Close" @click="toggleResponseBodyFullscreen">
                    退出全屏
                  </el-button>
                </div>
                <div class="monaco-response-container" :ref="setResponseBodyMonacoRef"></div>
              </div>
            </template>

            <!-- 其他文本响应 -->
            <el-input
              v-else
              :model-value="formatResponseBody(normalizedData.response.responseBody)"
              type="textarea"
              readonly
              :rows="12"
              class="response-textarea"
            />
          </el-card>
        </el-tab-pane>
        
        <!-- 响应头 -->
        <el-tab-pane label="响应头" name="headers">
          <el-card shadow="never">
            <el-table :data="formatHeaders(normalizedData.response.responseHeaders)" stripe>
              <el-table-column prop="key" label="名称" width="200" />
              <el-table-column prop="value" label="值" show-overflow-tooltip />
            </el-table>
          </el-card>
        </el-tab-pane>
        
        <!-- 响应Cookies -->
        <el-tab-pane name="response-cookies">
          <template #label>
            响应Cookies
            <el-badge 
              v-if="getResponseCookiesCount() > 0" 
              :value="getResponseCookiesCount()" 
              class="tab-badge"
            />
          </template>
          <el-card shadow="never">
            <template v-if="normalizedData.response.responseCookies && Object.keys(normalizedData.response.responseCookies).length > 0">
              <el-table :data="formatResponseCookies(normalizedData.response.responseCookies)" stripe>
                <el-table-column prop="name" label="Cookie名称" width="150" />
                <el-table-column prop="value" label="值" width="200" show-overflow-tooltip />
                <el-table-column prop="domain" label="域名" width="120" />
                <el-table-column prop="path" label="路径" width="100" />
                <el-table-column prop="expires" label="过期时间" width="180" show-overflow-tooltip />
                <el-table-column prop="httponly" label="HttpOnly" width="80">
                  <template #default="{ row }">
                    <el-tag v-if="row.httponly" type="success" size="small">是</el-tag>
                    <el-tag v-else type="info" size="small">否</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="secure" label="Secure" width="80">
                  <template #default="{ row }">
                    <el-tag v-if="row.secure" type="success" size="small">是</el-tag>
                    <el-tag v-else type="info" size="small">否</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="samesite" label="SameSite" width="100" />
              </el-table>
            </template>
            <el-empty v-else description="暂无响应Cookie" />
          </el-card>
        </el-tab-pane>
        
        <!-- 请求信息 -->
        <el-tab-pane label="请求信息" name="request">
          <el-card shadow="never" class="request-info-card">
            <!-- 请求基本信息 -->
            <div class="request-basic-info">
              <div class="request-info-row">
                <span class="info-label">请求方法:</span>
                <el-tag>{{ normalizedData.response.requestMethod }}</el-tag>
              </div>
              <div class="request-info-row">
                <span class="info-label">请求URL:</span>
                <el-tooltip
                  :content="normalizedData.response.requestUrl"
                  placement="top-start"
                  :show-after="300"
                  effect="dark"
                >
                  <span class="info-value">{{ normalizedData.response.requestUrl }}</span>
                </el-tooltip>
              </div>
            </div>
            
            <el-divider />
            
            <el-descriptions :column="1" border>
              <el-descriptions-item label="请求头">
                <template v-if="normalizedData.response.requestHeaders && Object.keys(normalizedData.response.requestHeaders).length > 0">
                  <el-table :data="formatRequestHeaders(normalizedData.response.requestHeaders)" size="small" stripe>
                    <el-table-column prop="key" label="请求头名称" width="200" />
                    <el-table-column prop="value" label="值" show-overflow-tooltip />
                  </el-table>
                </template>
                <span v-else class="no-data">暂无请求头</span>
              </el-descriptions-item>
              <el-descriptions-item label="请求参数">
                <pre class="json-preview">{{ formatJson(normalizedData.response.requestParams) }}</pre>
              </el-descriptions-item>
              <el-descriptions-item label="请求体">
                <template v-if="isRequestBodyJson()">
                  <div class="monaco-editor-wrapper" :class="{ 'is-fullscreen': isRequestBodyFullscreen }">
                    <div class="monaco-toolbar">
                      <el-button size="small" :icon="isRequestBodyFullscreen ? Close : FullScreen" @click="toggleRequestBodyFullscreen">
                        {{ isRequestBodyFullscreen ? '退出全屏' : '全屏' }}
                      </el-button>
                    </div>
                    <div class="monaco-request-body-container" :ref="setRequestBodyMonacoRef"></div>
                  </div>
                </template>
                <pre v-else class="json-preview">{{ formatJson(normalizedData.response.requestBody) }}</pre>
              </el-descriptions-item>
              <el-descriptions-item label="请求Cookies">
                <template v-if="normalizedData.response.requestCookies && Object.keys(normalizedData.response.requestCookies).length > 0">
                  <el-table :data="formatRequestCookies(normalizedData.response.requestCookies)" size="small" stripe>
                    <el-table-column prop="name" label="Cookie名称" width="150" />
                    <el-table-column prop="value" label="值" show-overflow-tooltip />
                  </el-table>
                </template>
                <span v-else class="no-data">暂无请求Cookie</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-tab-pane>
        
        <!-- 前置脚本结果 -->
        <el-tab-pane v-if="normalizedData.setupResults?.length" name="setup">
          <template #label>
            前置脚本 <el-badge :value="normalizedData.setupResults.length" />
          </template>
          <el-card shadow="never">
            <el-collapse v-model="setupActiveNames">
              <el-collapse-item 
                v-for="(result, index) in normalizedData.setupResults" 
                :key="index"
                :name="index"
              >
                <template #title>
                  <div class="script-result-title">
                    <el-tag :type="result.success ? 'success' : 'danger'" size="small">
                      {{ result.success ? '成功' : '失败' }}
                    </el-tag>
                    <span class="script-message">{{ result.message }}</span>
                    <span class="execution-time">({{ formatTime(result.executionTime) }}s)</span>
                  </div>
                </template>
                <div class="script-result-content">
                  <div v-if="result.variables && Object.keys(result.variables).length">
                    <h4>提取的变量:</h4>
                    <el-table :data="formatVariables(result.variables)" size="small">
                      <el-table-column prop="key" label="变量名" width="150" />
                      <el-table-column prop="value" label="变量值" show-overflow-tooltip />
                    </el-table>
                  </div>
                  <div v-if="result.log">
                    <h4>执行日志:</h4>
                    <el-input 
                      :model-value="formatLog(result.log)" 
                      type="textarea" 
                      readonly 
                      :rows="8"
                      class="log-textarea"
                    />
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-card>
        </el-tab-pane>
        
        <!-- 后置脚本结果 -->
        <el-tab-pane v-if="normalizedData.teardownResults?.length" name="teardown">
          <template #label>
            后置脚本 <el-badge :value="normalizedData.teardownResults.length" />
          </template>
          <el-card shadow="never">
            <el-collapse v-model="teardownActiveNames">
              <el-collapse-item 
                v-for="(result, index) in normalizedData.teardownResults" 
                :key="index"
                :name="index"
              >
                <template #title>
                  <div class="script-result-title">
                    <el-tag :type="result.success ? 'success' : 'danger'" size="small">
                      {{ result.success ? '成功' : '失败' }}
                    </el-tag>
                    <span class="script-message">{{ result.message }}</span>
                    <span class="execution-time">({{ formatTime(result.executionTime) }}s)</span>
                  </div>
                </template>
                <div class="script-result-content">
                  <div v-if="result.variables && Object.keys(result.variables).length">
                    <h4>提取的变量:</h4>
                    <el-table :data="formatVariables(result.variables)" size="small">
                      <el-table-column prop="key" label="变量名" width="150" />
                      <el-table-column prop="value" label="变量值" show-overflow-tooltip />
                    </el-table>
                  </div>
                  <div v-if="result.log">
                    <h4>执行日志:</h4>
                    <el-input 
                      :model-value="formatLog(result.log)" 
                      type="textarea" 
                      readonly 
                      :rows="8"
                      class="log-textarea"
                    />
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-card>
        </el-tab-pane>
        
        <!-- 断言结果 -->
        <el-tab-pane v-if="normalizedData.assersionResult" name="assertions">
          <template #label>
            断言结果
            <el-badge
              :value="`${normalizedData.assersionResult.log?.success || 0}/${normalizedData.assersionResult.log?.total || 0}`"
              :type="normalizedData.assersionResult.success ? 'success' : 'danger'"
            />
          </template>
          <el-card shadow="never">
            <div class="assertion-summary">
              <el-tag :type="normalizedData.assersionResult.success ? 'success' : 'danger'" size="large">
                {{ normalizedData.assersionResult.message }}
              </el-tag>
              <span class="execution-time">执行时间: {{ formatTime(normalizedData.assersionResult.executionTime) }}s</span>
            </div>

            <el-table v-if="normalizedData.assersionResult.log?.results" :data="normalizedData.assersionResult.log.results" class="assertion-table">
              <el-table-column label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.success ? 'success' : 'danger'" size="small">
                    {{ row.success ? '通过' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="assertion_type" label="断言类型" width="120" />
              <el-table-column prop="assertion_method" label="断言方法" width="100" />
              <el-table-column prop="expected_value" label="期望值" show-overflow-tooltip />
              <el-table-column prop="actual_value" label="实际值" show-overflow-tooltip />
            </el-table>
          </el-card>
        </el-tab-pane>

        <!-- 执行日志 -->
        <el-tab-pane v-if="normalizedData.executionLog" name="execution-log">
          <template #label>
            <el-icon><Document /></el-icon>
            执行日志
          </template>
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>执行日志</span>
                <div class="header-actions">
                  <el-button size="small" @click="copyExecutionLog">复制日志</el-button>
                </div>
              </div>
            </template>
            <div class="monaco-editor-wrapper" :class="{ 'is-fullscreen': isExecutionLogFullscreen }">
              <div class="monaco-toolbar">
                <el-button size="small" :icon="isExecutionLogFullscreen ? Close : FullScreen" @click="toggleExecutionLogFullscreen">
                  {{ isExecutionLogFullscreen ? '退出全屏' : '全屏' }}
                </el-button>
              </div>
              <div class="monaco-execution-log-container" :ref="setExecutionLogMonacoRef"></div>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 错误详情对话框 -->
    <el-dialog
      v-model="showErrorDialog"
      title="错误详情"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-alert
        :title="responseData?.response?.errorMessage || '未知错误'"
        type="error"
        :closable="false"
        show-icon
      />
      <div v-if="responseData?.response?.errorMessage" class="error-detail">
        <h4>错误信息:</h4>
        <pre class="error-content">{{ normalizedData.response.errorMessage }}</pre>
      </div>
      <template #footer>
        <el-button @click="showErrorDialog = false">关闭</el-button>
        <el-button type="primary" @click="copyErrorMessage">复制错误信息</el-button>
      </template>
    </el-dialog>

    <!-- 添加提取变量对话框 -->
    <AddVariableDialog
      v-model:visible="showAddVariableDialog"
      :case-id="caseId"
      :jsonpath="addVariableJsonPath"
      :response-data="normalizedData?.response?.responseBody"
      @success="handleAddVariableSuccess"
    />

    <!-- 添加断言对话框 -->
    <AddAssertionDialog
      v-model:visible="showAddAssertionDialog"
      :case-id="caseId"
      :jsonpath="addAssertionJsonPath"
      :response-data="normalizedData?.response?.responseBody"
      @success="handleAddAssertionSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, toRaw } from 'vue'
import { Loading, ChatLineRound, Document, FullScreen, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { JSONPath } from 'jsonpath-plus'
import '../styles/response-viewer.css'
import AddVariableDialog from './AddVariableDialog.vue'
import AddAssertionDialog from './AddAssertionDialog.vue'

// Monaco Editor imports（从全局配置导入，确保 Worker 已配置）
import { monaco } from '@/utils/monaco-setup'

// 使用普通变量存储 Monaco 实例，避免 Vue 响应式代理导致卡死
let responseBodyMonacoInstance = null
let responseBodyMonacoContainer = null
let requestBodyMonacoInstance = null
let requestBodyMonacoContainer = null
let executionLogMonacoInstance = null
let executionLogMonacoContainer = null

const props = defineProps({
  // 实时请求响应数据格式
  responseData: {
    type: Object,
    default: null
  },
  // 执行日志数据格式（来自 ExecutionDetail）
  executionData: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  drawerMode: {
    type: Boolean,
    default: false
  },
  // 当前测试用例ID
  caseId: {
    type: [String, Number],
    default: null
  }
})

// 定义事件
const emit = defineEmits(['add-assertion', 'add-variable', 'variable-added', 'assertion-added', 'refresh-case'])

// 统一数据格式 - 将两种数据格式转换为组件内部使用的标准格式
const normalizedData = computed(() => {
  // 如果有 responseData，直接使用（实时请求格式）
  if (props.responseData?.response) {
    return {
      ...props.responseData,
      // 确保 log 字段被正确传递
      executionLog: props.responseData.log || null
    }
  }

  // 如果有 executionData，转换为标准格式（执行日志格式）
  // API 返回的字段是驼峰命名（responseStatusCode, responseBody 等）
  if (props.executionData) {
    const execData = props.executionData
    const httpData = execData.executionData?.response || {}

    return {
      response: {
        responseStatusCode: execData.responseStatusCode ?? httpData.responseStatusCode,
        responseTime: execData.responseTime ?? httpData.responseTime,
        executionTime: execData.executionTime ? formatExecutionTime(execData.executionTime) : (httpData.executionTime || ''),
        isSuccess: execData.isSuccess ?? httpData.isSuccess ?? true,
        responseBody: httpData.responseBody,
        responseHeaders: httpData.responseHeaders || {},
        responseCookies: httpData.responseCookies || {},
        requestUrl: httpData.requestUrl,
        requestMethod: httpData.requestMethod,
        requestHeaders: httpData.requestHeaders || {},
        requestParams: httpData.requestParams || {},
        requestBody: httpData.requestBody,
        requestCookies: httpData.requestCookies || {},
        errorMessage: execData.errorMessage || httpData.errorMessage
      },
      // API 返回的字段是驼峰命名 assersionResult
      assersionResult: execData.executionData?.assersionResult ? {
        success: execData.executionData.assersionResult.success,
        message: execData.executionData.assersionResult.message,
        executionTime: execData.executionData.assersionResult.executionTime,
        log: execData.executionData.assersionResult.log
      } : null,
      setupResults: execData.executionData?.setupResults || [],
      teardownResults: execData.executionData?.teardownResults || [],
      // 添加执行日志字段
      executionLog: execData.executionData?.log || null
    }
  }

  return null
})

// 格式化执行时间字符串
const formatExecutionTime = (timeStr) => {
  if (!timeStr) return ''
  try {
    return new Date(timeStr).toLocaleString('zh-CN')
  } catch {
    return timeStr
  }
}

const activeTab = ref('body')
const setupActiveNames = ref([])
const teardownActiveNames = ref([])
const showErrorDialog = ref(false)
const htmlViewMode = ref('preview')
const htmlPreviewFrame = ref(null)

// Monaco Editor 容器引用
const responseBodyContainerRef = ref(null)
const requestBodyContainerRef = ref(null)
const executionLogContainerRef = ref(null)

// 全屏状态
const isResponseBodyFullscreen = ref(false)
const isRequestBodyFullscreen = ref(false)
const isExecutionLogFullscreen = ref(false)

// JSONPath 相关状态
const jsonpathExpression = ref('')
const jsonpathResult = ref(null)

// 提取变量对话框相关状态
const showAddVariableDialog = ref(false)
const addVariableJsonPath = ref('')

// 添加断言对话框相关状态
const showAddAssertionDialog = ref(false)
const addAssertionJsonPath = ref('')

// JSONPath 结果格式化
const jsonpathResultFormatted = computed(() => {
  if (jsonpathResult.value === null) return ''
  if (typeof jsonpathResult.value === 'object') {
    return JSON.stringify(jsonpathResult.value, null, 2)
  }
  return String(jsonpathResult.value)
})

// 刷新编辑器布局（传入具体尺寸确保正确渲染）
const refreshEditorLayout = (editorInstance, containerRef, isFullscreen) => {
  if (!editorInstance) return
  const rawEditor = toRaw(editorInstance)

  const doLayout = () => {
    let width, height

    if (isFullscreen) {
      // 全屏模式：使用窗口尺寸减去 padding 和 toolbar 高度
      width = window.innerWidth - 32  // 16px padding * 2
      height = window.innerHeight - 80  // padding + toolbar + margin
    } else {
      // 非全屏模式：从容器获取尺寸
      const container = containerRef?.value
      if (container) {
        const rect = container.getBoundingClientRect()
        width = rect.width || container.clientWidth
        height = rect.height || container.clientHeight
      }
    }

    if (width && height) {
      rawEditor.layout({ width, height })
    }
  }

  // 立即执行一次
  doLayout()

  // 延迟执行确保 CSS 过渡完成后布局正确
  setTimeout(doLayout, 50)
  setTimeout(doLayout, 150)
  setTimeout(doLayout, 300)
}

// 全屏切换方法
const toggleResponseBodyFullscreen = () => {
  isResponseBodyFullscreen.value = !isResponseBodyFullscreen.value
  nextTick(() => {
    setTimeout(() => {
      refreshEditorLayout(responseBodyMonacoInstance, responseBodyContainerRef, isResponseBodyFullscreen.value)
    }, 50)
  })
}

const toggleRequestBodyFullscreen = () => {
  isRequestBodyFullscreen.value = !isRequestBodyFullscreen.value
  nextTick(() => {
    setTimeout(() => {
      refreshEditorLayout(requestBodyMonacoInstance, requestBodyContainerRef, isRequestBodyFullscreen.value)
    }, 50)
  })
}

const toggleExecutionLogFullscreen = () => {
  isExecutionLogFullscreen.value = !isExecutionLogFullscreen.value
  nextTick(() => {
    setTimeout(() => {
      refreshEditorLayout(executionLogMonacoInstance, executionLogContainerRef, isExecutionLogFullscreen.value)
    }, 50)
  })
}

// 获取 Monaco 语言模式
const getMonacoLanguage = (contentType) => {
  if (!contentType) return 'plaintext'
  const ct = contentType.toLowerCase()
  if (ct.includes('json')) return 'json'
  if (ct.includes('xml')) return 'xml'
  if (ct.includes('html')) return 'html'
  if (ct.includes('javascript')) return 'javascript'
  return 'plaintext'
}

// 创建 Monaco Editor 通用配置（只读、轻量展示）
const getMonacoOptions = (language = 'json') => ({
  value: '',
  language,
  theme: 'vs-dark',
  readOnly: true,
  automaticLayout: true,
  minimap: { enabled: false },
  fontSize: 13,
  tabSize: 2,
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  folding: true,
  foldingStrategy: 'indentation',
  renderWhitespace: 'none',
  contextmenu: true,  // 启用右键菜单以支持 JSONPath 提取
  scrollbar: {
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8
  }
})

// 判断是否为图片响应（需要在 isJsonResponse 之前定义）
const isImageResponse = () => {
  const responseBody = normalizedData.value?.response?.responseBody
  return responseBody &&
         responseBody.type === 'binary_data' &&
         responseBody.content_type &&
         responseBody.content_type.startsWith('image/')
}

// 判断是否为HTML响应（需要在 isJsonResponse 之前定义）
const isHtmlResponse = () => {
  const responseHeaders = normalizedData.value?.response?.responseHeaders
  if (!responseHeaders) return false

  const contentType = responseHeaders['Content-Type'] || responseHeaders['content-type']
  return contentType && contentType.toLowerCase().includes('text/html')
}

// 判断响应体是否为 JSON 类型
const isJsonResponse = () => {
  const responseHeaders = normalizedData.value?.response?.responseHeaders
  if (!responseHeaders) return false

  const contentType = responseHeaders['Content-Type'] || responseHeaders['content-type']
  if (contentType && contentType.toLowerCase().includes('application/json')) {
    return true
  }

  // 如果没有明确的 Content-Type，尝试检测响应体是否为 JSON 对象
  const responseBody = normalizedData.value?.response?.responseBody
  return responseBody && typeof responseBody === 'object' && !isImageResponse() && !isHtmlResponse()
}

// 判断请求体是否为字典/对象类型
const isRequestBodyJson = () => {
  const requestBody = normalizedData.value?.response?.requestBody
  return requestBody && typeof requestBody === 'object'
}

// 工具方法（需要在 initMonacoEditors 之前定义）
const formatResponseBody = (data) => {
  if (!data) return ''
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

const formatJson = (data) => {
  if (!data) return ''
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

// JSONPath 测试方法
const testJsonPath = () => {
  if (!jsonpathExpression.value) {
    ElMessage.warning('请输入 JSONPath 表达式')
    return
  }

  try {
    const responseBody = normalizedData.value?.response?.responseBody
    if (!responseBody) {
      ElMessage.error('没有可用的响应数据')
      return
    }

    const result = JSONPath({ path: jsonpathExpression.value, json: responseBody })
    jsonpathResult.value = result

    if (result.length === 0) {
      ElMessage.info('未找到匹配的结果')
    } else {
      ElMessage.success('JSONPath 测试成功')
    }
  } catch (error) {
    ElMessage.error(`JSONPath 测试失败: ${error.message}`)
    jsonpathResult.value = null
  }
}

// 清空 JSONPath 结果
const clearJsonPathResult = () => {
  jsonpathResult.value = null
  jsonpathExpression.value = ''
}

// 复制 JSONPath 结果
const copyJsonPathResult = async () => {
  try {
    await navigator.clipboard.writeText(jsonpathResultFormatted.value)
    ElMessage.success('结果已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 从 Monaco Editor 位置提取 JSONPath（基于字符偏移量的精确算法）
const extractJsonPathFromPosition = (position) => {
  if (!responseBodyMonacoInstance) return null

  try {
    const rawEditor = toRaw(responseBodyMonacoInstance)
    const model = rawEditor.getModel()
    if (!model) return null

    const content = model.getValue()

    // 验证JSON有效性
    try {
      JSON.parse(content)
    } catch {
      return null
    }

    // 获取光标的字符偏移量（Monaco提供精确的偏移位置）
    const targetOffset = model.getOffsetAt(position)

    // 使用基于偏移量的解析器查找路径
    return parseJsonPathAtOffset(content, targetOffset)
  } catch (error) {
    console.error('Failed to extract JSONPath:', error)
    return null
  }
}

// 基于字符偏移量的JSON路径解析器
const parseJsonPathAtOffset = (content, targetOffset) => {
  let pos = 0

  // 跳过空白字符
  const skipWhitespace = () => {
    while (pos < content.length && /\s/.test(content[pos])) {
      pos++
    }
  }

  // 解析字符串，返回字符串值
  const parseString = () => {
    pos++ // 跳过开始的 "
    let str = ''
    while (pos < content.length && content[pos] !== '"') {
      if (content[pos] === '\\') {
        str += content[pos + 1]
        pos += 2
      } else {
        str += content[pos]
        pos++
      }
    }
    pos++ // 跳过结束的 "
    return str
  }

  // 跳过一个完整的JSON值（用于跳过不需要深入解析的值）
  const skipValue = () => {
    skipWhitespace()
    const char = content[pos]

    if (char === '"') {
      parseString()
    } else if (char === '{') {
      skipObject()
    } else if (char === '[') {
      skipArray()
    } else if (char === 't') {
      pos += 4 // true
    } else if (char === 'f') {
      pos += 5 // false
    } else if (char === 'n') {
      pos += 4 // null
    } else {
      // 数字
      while (pos < content.length && /[-\d.eE+]/.test(content[pos])) {
        pos++
      }
    }
  }

  // 跳过对象
  const skipObject = () => {
    pos++ // 跳过 {
    skipWhitespace()
    while (pos < content.length && content[pos] !== '}') {
      parseString() // 键
      skipWhitespace()
      pos++ // 跳过 :
      skipValue()
      skipWhitespace()
      if (content[pos] === ',') {
        pos++
        skipWhitespace()
      }
    }
    pos++ // 跳过 }
  }

  // 跳过数组
  const skipArray = () => {
    pos++ // 跳过 [
    skipWhitespace()
    while (pos < content.length && content[pos] !== ']') {
      skipValue()
      skipWhitespace()
      if (content[pos] === ',') {
        pos++
        skipWhitespace()
      }
    }
    pos++ // 跳过 ]
  }

  // 解析值并查找路径
  const parseValue = (currentPath) => {
    skipWhitespace()

    if (pos >= content.length) return null

    const valueStart = pos
    const char = content[pos]

    if (char === '{') {
      return parseObject(currentPath)
    } else if (char === '[') {
      return parseArray(currentPath)
    } else {
      // 标量值（字符串、数字、布尔、null）
      skipValue()
      // 如果目标在这个值的范围内，返回当前路径
      if (targetOffset >= valueStart && targetOffset < pos) {
        return currentPath
      }
      return null
    }
  }

  // 解析对象并查找路径
  const parseObject = (currentPath) => {
    const objectStart = pos
    pos++ // 跳过 {
    skipWhitespace()

    // 空对象
    if (content[pos] === '}') {
      pos++
      if (targetOffset >= objectStart && targetOffset < pos) {
        return currentPath
      }
      return null
    }

    while (pos < content.length && content[pos] !== '}') {
      skipWhitespace()

      // 记录键名的位置
      const keyStart = pos
      const key = parseString()
      const keyEnd = pos

      skipWhitespace()
      pos++ // 跳过 :
      skipWhitespace()

      // 构建这个键的完整路径
      const keyPath = currentPath === '$' ? `$.${key}` : `${currentPath}.${key}`

      // 如果目标偏移量在键名范围内，返回这个键的路径
      if (targetOffset >= keyStart && targetOffset < keyEnd) {
        return keyPath
      }

      // 记录值的起始位置
      const valueStart = pos

      // 递归解析值
      const result = parseValue(keyPath)
      if (result) return result

      // 如果目标在值的范围内但parseValue没有返回（简单值情况）
      if (targetOffset >= valueStart && targetOffset < pos) {
        return keyPath
      }

      skipWhitespace()
      if (content[pos] === ',') {
        pos++
        skipWhitespace()
      }
    }

    const objectEnd = pos
    pos++ // 跳过 }

    // 如果目标在对象范围内但没有匹配到具体键（如在 { 或 } 上）
    if (targetOffset >= objectStart && targetOffset <= objectEnd) {
      return currentPath
    }

    return null
  }

  // 解析数组并查找路径
  const parseArray = (currentPath) => {
    const arrayStart = pos
    pos++ // 跳过 [
    skipWhitespace()

    // 空数组
    if (content[pos] === ']') {
      pos++
      if (targetOffset >= arrayStart && targetOffset < pos) {
        return currentPath
      }
      return null
    }

    let index = 0
    while (pos < content.length && content[pos] !== ']') {
      skipWhitespace()

      const itemPath = `${currentPath}[${index}]`
      const itemStart = pos

      // 递归解析数组元素
      const result = parseValue(itemPath)
      if (result) return result

      // 如果目标在元素范围内
      if (targetOffset >= itemStart && targetOffset < pos) {
        return itemPath
      }

      skipWhitespace()
      if (content[pos] === ',') {
        pos++
        skipWhitespace()
      }
      index++
    }

    const arrayEnd = pos
    pos++ // 跳过 ]

    // 如果目标在数组范围内但没有匹配到具体元素
    if (targetOffset >= arrayStart && targetOffset <= arrayEnd) {
      return currentPath
    }

    return null
  }

  // 从根开始解析
  const result = parseValue('$')
  return result || '$'
}

// 行尾按钮 widget 相关变量
let lineEndWidget = null
let lineEndWidgetDom = null
let currentWidgetLine = 0

// 创建行尾按钮 DOM 元素
const createLineEndButtonsDom = () => {
  const container = document.createElement('div')
  container.className = 'line-end-buttons'
  container.style.cssText = `
    display: flex;
    gap: 6px;
    padding: 4px 8px;
    background: rgba(30, 30, 30, 0.95);
    border-radius: 4px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    z-index: 100;
    border: 1px solid rgba(64, 158, 255, 0.3);
  `

  // 添加断言按钮
  const assertionBtn = document.createElement('button')
  assertionBtn.textContent = '添加断言'
  assertionBtn.style.cssText = `
    padding: 4px 10px;
    font-size: 12px;
    border: none;
    border-radius: 3px;
    background: #409eff;
    color: white;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  `
  assertionBtn.onmouseenter = () => { assertionBtn.style.background = '#66b1ff' }
  assertionBtn.onmouseleave = () => { assertionBtn.style.background = '#409eff' }
  assertionBtn.onclick = (e) => {
    e.stopPropagation()
    handleAddAssertion()
  }

  // 添加提取变量按钮
  const variableBtn = document.createElement('button')
  variableBtn.textContent = '提取变量'
  variableBtn.style.cssText = `
    padding: 4px 10px;
    font-size: 12px;
    border: none;
    border-radius: 3px;
    background: #67c23a;
    color: white;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  `
  variableBtn.onmouseenter = () => { variableBtn.style.background = '#85ce61' }
  variableBtn.onmouseleave = () => { variableBtn.style.background = '#67c23a' }
  variableBtn.onclick = (e) => {
    e.stopPropagation()
    handleAddVariable()
  }

  container.appendChild(assertionBtn)
  container.appendChild(variableBtn)

  return container
}

// 处理添加断言
const handleAddAssertion = () => {
  if (!responseBodyMonacoInstance) return

  const rawEditor = toRaw(responseBodyMonacoInstance)
  const position = rawEditor.getPosition()
  const jsonPath = position ? extractJsonPathFromPosition(position) : null

  if (!props.caseId) {
    ElMessage.error('未找到用例ID，无法添加断言')
    console.error('添加断言失败 - caseId 为空')
    return
  }

  if (!jsonPath) {
    ElMessage.warning('无法提取当前位置的 JSONPath')
    return
  }

  console.log('添加断言 - caseId:', props.caseId)
  console.log('添加断言 - jsonPath:', jsonPath)

  // 设置 JSONPath 并打开对话框
  addAssertionJsonPath.value = jsonPath
  showAddAssertionDialog.value = true
}

// 处理添加断言成功
const handleAddAssertionSuccess = (data) => {
  console.log('断言添加成功:', data)
  // 触发刷新事件通知父组件
  emit('assertion-added', data)
  emit('refresh-case')
}

// 处理添加提取变量
const handleAddVariable = () => {
  if (!responseBodyMonacoInstance) return

  const rawEditor = toRaw(responseBodyMonacoInstance)
  const position = rawEditor.getPosition()
  const jsonPath = position ? extractJsonPathFromPosition(position) : null

  if (!props.caseId) {
    ElMessage.error('未找到用例ID，无法添加提取变量')
    console.error('添加提取变量失败 - caseId 为空')
    return
  }

  if (!jsonPath) {
    ElMessage.warning('无法提取当前位置的 JSONPath')
    return
  }

  console.log('添加提取变量 - caseId:', props.caseId)
  console.log('添加提取变量 - jsonPath:', jsonPath)

  // 设置 JSONPath 并打开对话框
  addVariableJsonPath.value = jsonPath
  showAddVariableDialog.value = true
}

// 处理添加提取变量成功
const handleAddVariableSuccess = (data) => {
  console.log('提取变量添加成功:', data)
  // 触发刷新事件通知父组件
  emit('variable-added', data)
  emit('refresh-case')
}

// 初始化响应体 Monaco Editor
const initResponseBodyMonaco = (content, language = 'json') => {
  if (!responseBodyContainerRef.value) return

  // 如果容器变化了，需要重新创建编辑器
  if (responseBodyMonacoContainer && responseBodyMonacoContainer !== responseBodyContainerRef.value) {
    destroyResponseBodyMonaco()
  }

  responseBodyMonacoContainer = responseBodyContainerRef.value

  if (responseBodyMonacoInstance) {
    // 更新已存在的编辑器内容和语言
    const rawEditor = toRaw(responseBodyMonacoInstance)
    rawEditor.setValue(content || '')
    const model = rawEditor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, language)
    }
    return
  }

  // 延迟创建，避免transition导致的卡死
  setTimeout(() => {
    if (!responseBodyContainerRef.value) return

    responseBodyMonacoInstance = monaco.editor.create(responseBodyContainerRef.value, {
      ...getMonacoOptions(language),
      value: content || ''
    })

    const rawEditor = toRaw(responseBodyMonacoInstance)

    // 创建行尾按钮 widget
    lineEndWidgetDom = createLineEndButtonsDom()
    lineEndWidget = {
      getId: () => 'line-end-buttons-widget',
      getDomNode: () => lineEndWidgetDom,
      getPosition: () => {
        if (currentWidgetLine <= 0) return null
        const model = rawEditor.getModel()
        if (!model) return null
        const lineLength = model.getLineLength(currentWidgetLine)
        return {
          position: { lineNumber: currentWidgetLine, column: lineLength + 1 },
          preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
        }
      }
    }

    // 添加 widget 到编辑器
    rawEditor.addContentWidget(lineEndWidget)

    // 监听鼠标点击事件，固定显示按钮
    rawEditor.onMouseDown((e) => {
      if (e.target.position) {
        const clickedLine = e.target.position.lineNumber
        if (clickedLine !== currentWidgetLine) {
          currentWidgetLine = clickedLine
          // 设置光标位置到点击的行
          rawEditor.setPosition({ lineNumber: clickedLine, column: 1 })
          rawEditor.layoutContentWidget(lineEndWidget)
        }
      }
    })

    // 监听光标位置变化（仅在没有固定行时才移动按钮）
    rawEditor.onDidChangeCursorPosition((e) => {
      // 如果是点击导致的位置变化，保持按钮在当前行
      const newLine = e.position.lineNumber
      if (newLine !== currentWidgetLine) {
        currentWidgetLine = newLine
        rawEditor.layoutContentWidget(lineEndWidget)
      }
    })

    // 不再监听失焦事件，让按钮保持显示
    // 只有在切换到其他行时才移动按钮

    // 添加右键菜单项 - 提取 JSONPath
    rawEditor.addAction({
      id: 'extract-jsonpath',
      label: '提取 JSONPath 路径',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: (editor) => {
        const position = editor.getPosition()
        if (position) {
          const path = extractJsonPathFromPosition(position)
          if (path) {
            jsonpathExpression.value = path
            ElMessage.success('JSONPath 已提取到测试框')
          } else {
            ElMessage.warning('无法提取当前位置的 JSONPath')
          }
        }
      }
    })

    // 添加右键菜单项 - 提取并测试 JSONPath
    rawEditor.addAction({
      id: 'extract-and-test-jsonpath',
      label: '提取并测试 JSONPath',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.6,
      run: (editor) => {
        const position = editor.getPosition()
        if (position) {
          const path = extractJsonPathFromPosition(position)
          if (path) {
            jsonpathExpression.value = path
            // 自动执行测试
            nextTick(() => {
              testJsonPath()
            })
          } else {
            ElMessage.warning('无法提取当前位置的 JSONPath')
          }
        }
      }
    })

    // 添加右键菜单项 - 复制 JSONPath
    rawEditor.addAction({
      id: 'copy-jsonpath',
      label: '复制 JSONPath 路径',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.7,
      run: async (editor) => {
        const position = editor.getPosition()
        if (position) {
          const path = extractJsonPathFromPosition(position)
          if (path) {
            try {
              await navigator.clipboard.writeText(path)
              ElMessage.success('JSONPath 已复制到剪贴板')
            } catch {
              ElMessage.error('复制失败')
            }
          } else {
            ElMessage.warning('无法提取当前位置的 JSONPath')
          }
        }
      }
    })
  }, 100)
}

// 销毁响应体 Monaco Editor
const destroyResponseBodyMonaco = () => {
  if (responseBodyMonacoInstance) {
    // 先保存引用并清空，防止重复销毁
    const editorToDispose = responseBodyMonacoInstance
    const widgetToRemove = lineEndWidget
    responseBodyMonacoInstance = null
    responseBodyMonacoContainer = null
    lineEndWidget = null
    lineEndWidgetDom = null
    currentWidgetLine = 0

    // 延迟销毁，避免 Monaco Editor 内部异步操作抛出 Canceled 错误
    requestAnimationFrame(() => {
      try {
        const rawEditor = toRaw(editorToDispose)
        // 移除 widget
        if (widgetToRemove) {
          rawEditor.removeContentWidget(widgetToRemove)
        }
        rawEditor.dispose()
      } catch (e) {
        // 忽略销毁时的错误
      }
    })
  }
}

// 设置响应体编辑器引用
const setResponseBodyMonacoRef = (el) => {
  if (!el) return
  responseBodyContainerRef.value = el

  // 如果有数据，初始化编辑器
  if (isJsonResponse() && normalizedData.value?.response?.responseBody) {
    const content = formatResponseBody(normalizedData.value.response.responseBody)
    const responseHeaders = normalizedData.value?.response?.responseHeaders
    const contentType = responseHeaders?.['Content-Type'] || responseHeaders?.['content-type'] || ''
    const language = getMonacoLanguage(contentType)

    nextTick(() => {
      initResponseBodyMonaco(content, language)
    })
  }
}

// 初始化请求体 Monaco Editor
const initRequestBodyMonaco = (content, language = 'json') => {
  if (!requestBodyContainerRef.value) return

  if (requestBodyMonacoContainer && requestBodyMonacoContainer !== requestBodyContainerRef.value) {
    destroyRequestBodyMonaco()
  }

  requestBodyMonacoContainer = requestBodyContainerRef.value

  if (requestBodyMonacoInstance) {
    const rawEditor = toRaw(requestBodyMonacoInstance)
    rawEditor.setValue(content || '')
    const model = rawEditor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, language)
    }
    return
  }

  setTimeout(() => {
    if (!requestBodyContainerRef.value) return

    requestBodyMonacoInstance = monaco.editor.create(requestBodyContainerRef.value, {
      ...getMonacoOptions(language),
      value: content || ''
    })
  }, 100)
}

// 销毁请求体 Monaco Editor
const destroyRequestBodyMonaco = () => {
  if (requestBodyMonacoInstance) {
    // 先保存引用并清空，防止重复销毁
    const editorToDispose = requestBodyMonacoInstance
    requestBodyMonacoInstance = null
    requestBodyMonacoContainer = null

    // 延迟销毁，避免 Monaco Editor 内部异步操作抛出 Canceled 错误
    requestAnimationFrame(() => {
      try {
        const rawEditor = toRaw(editorToDispose)
        rawEditor.dispose()
      } catch (e) {
        // 忽略销毁时的错误
      }
    })
  }
}

// 设置请求体编辑器引用
const setRequestBodyMonacoRef = (el) => {
  if (!el) return
  requestBodyContainerRef.value = el

  if (isRequestBodyJson() && normalizedData.value?.response?.requestBody) {
    const content = formatJson(normalizedData.value.response.requestBody)
    nextTick(() => {
      initRequestBodyMonaco(content, 'json')
    })
  }
}

// 初始化执行日志 Monaco Editor
const initExecutionLogMonaco = (content) => {
  if (!executionLogContainerRef.value) return

  if (executionLogMonacoContainer && executionLogMonacoContainer !== executionLogContainerRef.value) {
    destroyExecutionLogMonaco()
  }

  executionLogMonacoContainer = executionLogContainerRef.value

  if (executionLogMonacoInstance) {
    const rawEditor = toRaw(executionLogMonacoInstance)
    rawEditor.setValue(content || '')
    // 更新高亮
    applyLogHighlighting(rawEditor)
    return
  }

  setTimeout(() => {
    if (!executionLogContainerRef.value) return

    executionLogMonacoInstance = monaco.editor.create(executionLogContainerRef.value, {
      ...getMonacoOptions('plaintext'),
      value: content || '',
      lineNumbers: 'on',
      wordWrap: 'on'
    })

    // 应用日志高亮
    applyLogHighlighting(executionLogMonacoInstance)
  }, 100)
}

// 存储日志装饰器ID
let executionLogDecorationIds = []

// 应用日志级别高亮
const applyLogHighlighting = (editor) => {
  if (!editor) return

  const rawEditor = toRaw(editor)
  const model = rawEditor.getModel()
  if (!model) return

  const content = model.getValue()
  const lines = content.split('\n')
  const decorations = []

  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const upperLine = line.toUpperCase()

    let inlineClassName = ''
    let lineClassName = ''
    if (upperLine.includes('| ERROR') || upperLine.includes('ERROR |') || upperLine.includes(' ERROR ')) {
      inlineClassName = 'log-line-error'
      lineClassName = 'log-line-error-bg'
    } else if (upperLine.includes('| WARNING') || upperLine.includes('WARNING |') || upperLine.includes(' WARNING ')) {
      inlineClassName = 'log-line-warning'
      lineClassName = 'log-line-warning-bg'
    } else if (upperLine.includes('| INFO') || upperLine.includes('INFO |') || upperLine.includes(' INFO ')) {
      inlineClassName = 'log-line-info'
      lineClassName = 'log-line-info-bg'
    } else if (upperLine.includes('| DEBUG') || upperLine.includes('DEBUG |') || upperLine.includes(' DEBUG ')) {
      inlineClassName = 'log-line-debug'
      lineClassName = 'log-line-debug-bg'
    }

    if (inlineClassName) {
      decorations.push({
        range: new monaco.Range(lineNumber, 1, lineNumber, line.length + 1),
        options: {
          isWholeLine: true,
          inlineClassName: inlineClassName,
          className: lineClassName
        }
      })
    }
  })

  // 使用存储的ID替换旧装饰器
  executionLogDecorationIds = rawEditor.deltaDecorations(executionLogDecorationIds, decorations)
}

// 销毁执行日志 Monaco Editor
const destroyExecutionLogMonaco = () => {
  if (executionLogMonacoInstance) {
    // 先保存引用并清空，防止重复销毁
    const editorToDispose = executionLogMonacoInstance
    const decorationIds = executionLogDecorationIds.slice()
    executionLogMonacoInstance = null
    executionLogMonacoContainer = null
    executionLogDecorationIds = []

    // 延迟销毁，避免 Monaco Editor 内部异步操作抛出 Canceled 错误
    requestAnimationFrame(() => {
      try {
        const rawEditor = toRaw(editorToDispose)
        // 清理装饰器
        if (decorationIds.length > 0) {
          rawEditor.deltaDecorations(decorationIds, [])
        }
        rawEditor.dispose()
      } catch (e) {
        // 忽略销毁时的错误
      }
    })
  }
}

// 设置执行日志编辑器引用
const setExecutionLogMonacoRef = (el) => {
  if (!el) return
  executionLogContainerRef.value = el

  if (normalizedData.value?.executionLog) {
    const log = normalizedData.value.executionLog
    const content = typeof log === 'string' ? log : JSON.stringify(log, null, 2)
    nextTick(() => {
      initExecutionLogMonaco(content)
    })
  }
}

// 初始化所有 Monaco Editor 内容
const initMonacoEditors = () => {
  if (normalizedData.value?.response) {
    // 设置响应体内容
    if (isJsonResponse() && responseBodyContainerRef.value) {
      const content = formatResponseBody(normalizedData.value.response.responseBody)
      const responseHeaders = normalizedData.value?.response?.responseHeaders
      const contentType = responseHeaders?.['Content-Type'] || responseHeaders?.['content-type'] || ''
      const language = getMonacoLanguage(contentType)
      initResponseBodyMonaco(content, language)
    }

    // 设置请求体内容
    if (isRequestBodyJson() && requestBodyContainerRef.value) {
      const content = formatJson(normalizedData.value.response.requestBody)
      initRequestBodyMonaco(content, 'json')
    }
  }

  // 设置执行日志内容
  if (normalizedData.value?.executionLog && executionLogContainerRef.value) {
    const log = normalizedData.value.executionLog
    const content = typeof log === 'string' ? log : JSON.stringify(log, null, 2)
    initExecutionLogMonaco(content)
  }
}

// 销毁所有 Monaco Editor
const destroyAllMonacoEditors = () => {
  destroyResponseBodyMonaco()
  destroyRequestBodyMonaco()
  destroyExecutionLogMonaco()
}

// 监听 Tab 切换，刷新对应的编辑器
watch(activeTab, (newTab) => {
  if (newTab === 'body' && responseBodyMonacoInstance) {
    // 切换到响应体 Tab 时刷新编辑器
    nextTick(() => {
      setTimeout(() => {
        if (responseBodyMonacoInstance) {
          toRaw(responseBodyMonacoInstance).layout()
        }
      }, 100)
    })
  } else if (newTab === 'request' && requestBodyMonacoInstance) {
    // 切换到请求信息 Tab 时刷新编辑器
    nextTick(() => {
      setTimeout(() => {
        if (requestBodyMonacoInstance) {
          toRaw(requestBodyMonacoInstance).layout()
        }
      }, 100)
    })
  } else if (newTab === 'execution-log' && executionLogMonacoInstance) {
    // 切换到执行日志 Tab 时刷新编辑器
    nextTick(() => {
      setTimeout(() => {
        if (executionLogMonacoInstance) {
          toRaw(executionLogMonacoInstance).layout()
        }
      }, 100)
    })
  }
})

// 监听数据变化，更新 Monaco Editor 内容
watch(normalizedData, (newData) => {
  if (newData?.response) {
    initMonacoEditors()
  }
}, { immediate: true, deep: true })

// 工具方法
const getStatusType = (status) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'danger'
  return 'info'
}

const formatTime = (time) => {
  if (typeof time === 'number') {
    return time.toFixed(2)
  }
  return time
}

const formatHeaders = (headers) => {
  if (!headers) return []
  return Object.entries(headers).map(([key, value]) => ({
    key,
    value: String(value)
  }))
}

// 格式化请求头
const formatRequestHeaders = (headers) => {
  if (!headers) return []
  return Object.entries(headers).map(([key, value]) => ({
    key,
    value: String(value)
  }))
}

// 格式化响应Cookies
const formatResponseCookies = (cookies) => {
  if (!cookies) return []
  return Object.entries(cookies).map(([name, cookieData]) => ({
    name,
    value: cookieData.value,
    domain: cookieData.domain || '',
    path: cookieData.path || '',
    expires: cookieData.expires || '',
    httponly: cookieData.httponly === 'true' || cookieData.httponly === true,
    secure: cookieData.secure === 'true' || cookieData.secure === true,
    samesite: cookieData.samesite || '',
    'max-age': cookieData['max-age'] || ''
  }))
}

// 格式化请求Cookies
const formatRequestCookies = (cookies) => {
  if (!cookies) return []
  return Object.entries(cookies).map(([name, value]) => ({
    name,
    value: String(value)
  }))
}

// 获取响应Cookie数量
const getResponseCookiesCount = () => {
  if (!normalizedData.value?.response?.responseCookies) return 0
  return Object.keys(normalizedData.value.response.responseCookies).length
}

const formatVariables = (variables) => {
  if (!variables) return []
  return Object.entries(variables).map(([key, value]) => ({
    key,
    value: String(value)
  }))
}

const formatLog = (log) => {
  if (!log) return ''
  if (typeof log === 'string') return log
  try {
    return JSON.stringify(log, null, 2)
  } catch {
    return String(log)
  }
}

const copyResponse = async () => {
  try {
    const text = formatResponseBody(normalizedData.value?.response?.responseBody)
    await navigator.clipboard.writeText(text)
    ElMessage.success('响应内容已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 显示错误详情
const showErrorDetail = () => {
  showErrorDialog.value = true
}

// 复制错误信息
const copyErrorMessage = async () => {
  try {
    const errorText = normalizedData.value?.response?.errorMessage || '未知错误'
    await navigator.clipboard.writeText(errorText)
    ElMessage.success('错误信息已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 获取图片源
const getImageSrc = () => {
  const responseBody = normalizedData.value?.response?.responseBody
  if (!isImageResponse()) return ''

  const { content_type, data, encoding } = responseBody
  if (encoding === 'base64') {
    return `data:${content_type};base64,${data}`
  }
  return ''
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取HTML内容
const getHtmlContent = () => {
  const responseBody = normalizedData.value?.response?.responseBody
  if (!responseBody) return ''

  if (typeof responseBody === 'string') {
    return responseBody
  }

  try {
    return JSON.stringify(responseBody, null, 2)
  } catch {
    return String(responseBody)
  }
}

// 复制执行日志
const copyExecutionLog = async () => {
  try {
    const log = normalizedData.value?.executionLog || ''
    await navigator.clipboard.writeText(typeof log === 'string' ? log : JSON.stringify(log, null, 2))
    ElMessage.success('执行日志已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 组件卸载时清理 Monaco Editor 实例
onBeforeUnmount(() => {
  destroyAllMonacoEditors()
})
</script>

<style>
/* 全局样式 - Monaco Editor 日志高亮装饰器 */
/* 必须是非scoped才能影响Monaco Editor内部元素 */
.monaco-editor .log-line-error,
.monaco-editor .view-line .log-line-error,
.monaco-editor .view-lines .log-line-error {
  color: #f48771 !important;
}

.monaco-editor .log-line-warning,
.monaco-editor .view-line .log-line-warning,
.monaco-editor .view-lines .log-line-warning {
  color: #cca700 !important;
}

.monaco-editor .log-line-info,
.monaco-editor .view-line .log-line-info,
.monaco-editor .view-lines .log-line-info {
  color: #4fc1ff !important;
}

.monaco-editor .log-line-debug,
.monaco-editor .view-line .log-line-debug,
.monaco-editor .view-lines .log-line-debug {
  color: #b5cea8 !important;
}

/* 整行高亮样式 */
.monaco-editor .log-line-error-bg {
  background-color: rgba(244, 135, 113, 0.15) !important;
}

.monaco-editor .log-line-warning-bg {
  background-color: rgba(204, 167, 0, 0.15) !important;
}

.monaco-editor .log-line-info-bg {
  background-color: rgba(79, 193, 255, 0.1) !important;
}

.monaco-editor .log-line-debug-bg {
  background-color: rgba(181, 206, 168, 0.1) !important;
}

/* el-descriptions 防止横向扩展 - 请求信息标签页 */
.response-viewer .el-descriptions {
  width: 100% !important;
  table-layout: fixed !important;
}

.response-viewer .el-descriptions__body {
  width: 100% !important;
}

.response-viewer .el-descriptions__body .el-descriptions__table {
  width: 100% !important;
  table-layout: fixed !important;
}

.response-viewer .el-descriptions__label.el-descriptions__cell {
  width: 100px !important;
  min-width: 100px !important;
  max-width: 100px !important;
}

.response-viewer .el-descriptions__content.el-descriptions__cell {
  overflow-x: hidden !important;
  overflow-y: auto !important;
  word-break: break-all !important;
}

/* 请求信息卡片防止横向扩展但允许垂直滚动 */
.response-viewer .request-info-card {
  overflow-x: hidden !important;
  overflow-y: auto !important;
  height: auto !important;
  max-height: none !important;
}

.response-viewer .request-info-card .el-card__body {
  overflow-x: hidden !important;
  overflow-y: visible !important;
  height: auto !important;
}

/* 修复 Element Plus 组件高度和滚动问题 */
.response-viewer .el-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.response-viewer .el-tabs__header {
  flex-shrink: 0;
}

.response-viewer .el-tabs__content {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.response-viewer .el-tab-pane {
  height: auto;
  min-height: 100%;
}

.response-viewer .el-card {
  height: auto;
  min-height: 0;
}

.response-viewer .el-card__body {
  overflow: visible;
  height: auto;
}
</style>
