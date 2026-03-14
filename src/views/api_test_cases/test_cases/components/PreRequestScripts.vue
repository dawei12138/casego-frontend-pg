<template>
  <div class="pre-request-scripts">
    <!-- 脚本列表 -->
    <div v-if="internalSetupList.filter(s => s.delFlag !== '1').length > 0" class="scripts-list">
      <draggable 
        v-model="internalSetupList" 
        @change="handleDragChange"
        item-key="setupId"
        handle=".drag-handle"
        :animation="200"
        ghost-class="sortable-ghost"
        chosen-class="sortable-chosen"
        drag-class="sortable-drag"
        :group="{ name: 'scripts', pull: false, put: false }"
      >
        <template #item="{ element: script, index }">
          <div v-show="script.delFlag !== '1'" class="script-item" :key="script.setupId">
            <!-- 脚本头部 -->
            <div class="script-header" @click="toggleScriptExpand(script)">
              <div class="script-info">
                <span class="drag-handle">⋮⋮</span>
                <div class="script-badge" :class="getScriptBadgeClass(script.setupType)">
                  {{ getDisplayIndex(script) }}
                </div>
                <div class="script-details">
                  <span class="script-summary">{{ getScriptSummary(script) }}</span>
                </div>
              </div>
              <div class="script-controls">
                <el-switch
                  v-model="script.isRun"
                  :active-value="true"
                  :inactive-value="false"
                  size="small"
                  @click.stop
                />
                <el-button size="small" text type="danger" @click.stop="removeScript(script)">
                  <el-icon><Delete /></el-icon>
                </el-button>
                <el-icon class="expand-icon" :class="{ 'is-expanded': script.expanded }">
                  <ArrowDown />
                </el-icon>
              </div>
            </div>
            
            <!-- 脚本配置 -->
            <div v-if="script.expanded === true" class="script-config">
              <!-- 提取变量 -->
              <div v-if="script.setupType === 'EXTRACT_VARIABLE'" class="config-content">
                <div class="config-row">
                  <label class="config-label">操作名称</label>
                  <el-input v-model="script.name" placeholder="请输入操作名称" size="small" />
                </div>
                <div class="config-row">
                  <label class="config-label">提取方法</label>
                  <el-select v-model="script.extractVariableMethod" size="small" style="width: 200px;">
                    <el-option label="Response Text" value="response_text" />
                    <el-option label="Response JSON" value="response_json" />
                    <el-option label="Response Header" value="response_header" />
                    <el-option label="Response XML" value="response_xml" />
                  </el-select>
                </div>

                <div class="config-row">
                  <label class="config-label">变量名</label>
                  <el-input v-model="script.variableName" placeholder="token" size="small" />
                </div>
                <div class="config-row">
                  <label class="config-label">JSONPath</label>
                  <el-input v-model="script.jsonpath" placeholder="$.data.token" size="small" />
                </div>
              </div>
              
              <!-- 数据库操作 -->
              <div v-else-if="script.setupType === 'DB_CONNECTION'" class="config-content">
                <div class="config-row">
                  <label class="config-label">操作名称</label>
                  <el-input 
                    v-model="script.name" 
                    placeholder="请输入操作名称" 
                    size="small" 
                    @click="handleInputClick"
                    @focus="handleInputFocus"
                    @input="handleInputChange"
                  />
                </div>
                <div class="config-row">
                  <label class="config-label">数据库连接</label>
                  <el-select 
                    v-model="script.dbConnectionId" 
                    size="small" 
                    :loading="loadingDatabases"
                    placeholder="选择数据库"
                    clearable
                    style="width: 300px;"
                    @click="handleSelectClick"
                    @focus="handleSelectFocus"
                    @change="handleSelectChange"
                  >
                    <el-option 
                      v-for="db in databaseList" 
                      :key="db.id" 
                      :label="`${db.name} (${db.host}:${db.port})`" 
                      :value="db.id" 
                    />
                  </el-select>
                </div>
                <div class="config-row full-width">
                  <label class="config-label">SQL脚本</label>
                  <el-input 
                    v-model="script.script" 
                    type="textarea" 
                    :rows="4" 
                    size="small" 
                    placeholder="请输入SQL脚本"
                    @click="handleTextareaClick"
                    @focus="handleTextareaFocus"
                    @input="handleTextareaChange"
                  />
                </div>
                
                <!-- 数据库提取变量部分 -->
                <div class="extract-variables-section">
                  <div class="section-header">
                    <label class="config-label">提取变量</label>
                    <el-button size="small" type="primary" text @click="handleAddExtractVariable(script)">
                      <el-icon><Plus /></el-icon>
                      添加变量提取
                    </el-button>
                  </div>
                  
                  <div v-if="script.extractVariables && script.extractVariables.length > 0" class="extract-variables-list">
                    <div 
                      v-for="(extractVar, varIndex) in script.extractVariables" 
                      :key="`extract-${varIndex}`" 
                      class="extract-variable-item"
                    >
                      <div class="extract-variable-content">
                        <div class="extract-row">
                          <div class="extract-field">
                            <label class="extract-label">变量名</label>
                            <el-input 
                              v-model="extractVar.variable_name" 
                              placeholder="user_id" 
                              size="small" 
                              @click="handleExtractInputClick"
                              @focus="handleExtractInputFocus"
                              @input="handleExtractInputChange"
                            />
                          </div>
                          <div class="extract-field">
                            <label class="extract-label">JSONPath</label>
                            <el-input 
                              v-model="extractVar.jsonpath" 
                              placeholder="$.data[0].id" 
                              size="small" 
                              @click="handleExtractInputClick"
                              @focus="handleExtractInputFocus"
                              @input="handleExtractInputChange"
                            />
                          </div>

                          <div class="extract-actions">
                            <el-button 
                              size="small" 
                              text 
                              type="danger" 
                              @click="handleRemoveExtractVariable(script, varIndex)"
                            >
                              <el-icon><Delete /></el-icon>
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else class="no-extract-variables">
                    <el-text type="info" size="small">暂无变量提取配置</el-text>
                  </div>
                </div>
              </div>
              
              <!-- Python/JS脚本 -->
              <div v-else-if="['PYTHON_SCRIPT', 'JS_SCRIPT'].includes(script.setupType)" class="config-content">
                <div class="config-row">
                  <label class="config-label">操作名称</label>
                  <el-input v-model="script.name" placeholder="请输入脚本名称" size="small" />
                </div>
                <div class="config-row full-width">
                  <label class="config-label">脚本内容</label>
                  <div class="script-editor-wrapper">
                    <div class="editor-toolbar">
                      <div class="toolbar-left">
                        <el-dropdown trigger="click" @command="(cmd) => insertSnippet(cmd, script)">
                          <el-button size="small">
                            <el-icon><DocumentCopy /></el-icon>
                            代码片段
                            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                          </el-button>
                          <template #dropdown>
                            <el-dropdown-menu class="snippet-dropdown-menu">
                              <template v-for="category in scriptSnippets" :key="category.category">
                                <div class="snippet-category-title">{{ category.category }}</div>
                                <el-dropdown-item
                                  v-for="item in category.items"
                                  :key="item.name"
                                  :command="item.code"
                                  class="snippet-item"
                                >
                                  {{ item.name }}
                                </el-dropdown-item>
                              </template>
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                        <el-button size="small" @click.stop="clearScriptContent(script)">
                          <el-icon><Delete /></el-icon>
                          清空
                        </el-button>
                      </div>
                      <div class="toolbar-right">
                        <el-button
                          size="small"
                          type="primary"
                          :loading="script.debugLoading"
                          @click.stop="handleDebugScript(script)"
                        >
                          <el-icon><VideoPlay /></el-icon>
                          调试执行
                        </el-button>
                      </div>
                    </div>
                    <div class="monaco-editor-wrapper" :class="{ 'is-fullscreen': isScriptFullscreen(script) }">
                      <div class="monaco-fullscreen-toolbar">
                        <el-button size="small" :icon="isScriptFullscreen(script) ? Close : FullScreen" @click.stop="toggleScriptFullscreen(script)">
                          {{ isScriptFullscreen(script) ? '退出全屏' : '全屏' }}
                        </el-button>
                      </div>
                      <div
                        :ref="(el) => setEditorRef(el, script)"
                        class="monaco-editor-container"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- 调试结果展示 -->
                <div v-if="script.debugResult" class="debug-result-section">
                  <div class="debug-result">
                    <div class="result-header">
                      <el-tag :type="script.debugResult.success ? 'success' : 'danger'" size="small">
                        {{ script.debugResult.success ? '执行成功' : '执行失败' }}
                      </el-tag>
                      <el-button size="small" text type="info" @click.stop="script.debugResult = null">
                        <el-icon><Close /></el-icon>
                        关闭
                      </el-button>
                    </div>
                    <div class="result-content">
                      <div v-if="script.debugResult.logs" class="result-output">
                        <div class="output-label">执行日志:</div>
                        <pre class="output-text">{{ script.debugResult.logs }}</pre>
                      </div>
                      <div v-if="script.debugResult.error" class="result-error">
                        <div class="output-label">错误信息:</div>
                        <el-alert :title="script.debugResult.error" type="error" :closable="false" show-icon />
                      </div>
                      <div v-if="script.debugResult.result !== null && script.debugResult.result !== undefined" class="result-return">
                        <div class="output-label">返回值:</div>
                        <pre class="output-text">{{ formatReturnValue(script.debugResult.result) }}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 等待时间 -->
              <div v-else-if="script.setupType === 'WAIT_TIME'" class="config-content">
                <div class="config-row">
                  <label class="config-label">操作名称</label>
                  <el-input v-model="script.name" placeholder="请输入操作名称" size="small" />
                </div>
                <div class="config-row">
                  <label class="config-label">等待时间</label>
                  <div class="wait-time-input">
                    <el-input-number 
                      v-model="script.waitTime" 
                      :min="0" 
                      size="small" 
                      style="width: 120px;"
                    />
                    <span class="time-unit">毫秒</span>
                    <span v-if="script.waitTime > 0" class="time-display">
                      ({{ formatWaitTime(script.waitTime) }})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>
    
    <!-- 添加按钮 -->
    <div class="add-section">
      <el-dropdown @command="addScript" placement="bottom-start">
        <div class="add-button">
          <el-icon><Plus /></el-icon>
          <span>添加前置操作</span>
          <el-icon class="arrow-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="script-type-menu">
            <el-dropdown-item 
              v-for="type in scriptTypes" 
              :key="type.value" 
              :command="type.value"
              class="script-type-item"
            >
              <div class="type-icon" :class="getScriptBadgeClass(type.value)"></div>
              <span>{{ type.label }}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, toRaw } from 'vue'
import { Plus, Delete, ArrowDown, VideoPlay, Close, DocumentCopy, FullScreen } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import { useDatabaseList } from '../composables/useDatabaseList'
import { debugScript_library } from '@/api/api_script_library/script_library'

// Monaco Editor imports
import * as monaco from 'monaco-editor'

// 使用普通 Map 存储 Monaco 实例，避免 Vue 响应式代理导致卡死
const editorInstanceMap = new Map()
const editorContainerMap = new Map()

// 当前全屏的脚本key
const fullscreenScriptKey = ref(null)

// 代码片段数据
const scriptSnippets = [
    {
    category: '环境变量缓存',
    items: [
      { name: '设置缓存', code: 'await set_cache("key", "value")' },
      { name: '获取缓存', code: 'await get_cache("key")' },
      { name: '删除缓存', code: 'await delete_cache("key")' }
    ]
  },
  {
    category: 'Header 请求头',
    items: [
      { name: '设置请求头', code: 'context.request_info.set_header("key", "value")' },
      { name: '获取请求头', code: 'context.request_info.get_header("key")' },
      { name: '删除请求头', code: 'context.request_info.remove_header("key")' }
    ]
  },
  {
    category: 'Param 查询参数',
    items: [
      { name: '设置查询参数', code: 'context.request_info.set_param("key", "value")' },
      { name: '获取查询参数', code: 'context.request_info.get_param("key")' },
      { name: '删除查询参数', code: 'context.request_info.remove_param("key")' }
    ]
  },
  {
    category: 'Cookie',
    items: [
      { name: '设置Cookie', code: 'context.request_info.set_cookie("key", "value")' },
      { name: '获取Cookie', code: 'context.request_info.get_cookie("key")' },
      { name: '删除Cookie', code: 'context.request_info.remove_cookie("key")' }
    ]
  },
  {
    category: 'JSON Body',
    items: [
      { name: '设置字段', code: 'context.request_info.set_json_field("key", "value")' },
      { name: '设置嵌套字段', code: 'context.request_info.set_json_field("user.name", "value")' },
      { name: '获取字段', code: 'context.request_info.get_json_field("key")' },
      { name: '删除字段', code: 'context.request_info.remove_json_field("key")' }
    ]
  },

  {
    category: '其他',
    items: [
      { name: '修改URL', code: 'context.request_info.url = "http://example.com/api"' },
      { name: '修改Method', code: 'context.request_info.method = "POST"' }
    ]
  }
]

const props = defineProps({
  setupList: { type: Array, default: () => [] },
  caseId: {
    type: [Number, String],
    default: null
  },
  envId: {
    type: [Number, String],
    default: null
  }
})

const internalSetupList = ref([])
const loading = ref(true);

// 使用全局数据库列表缓存
const {
  databaseList,
  loading: loadingDatabases,
  getDatabaseList,
  error: databaseError
} = useDatabaseList()

/** 获取数据库配置列表 */
async function getList() {
  try {
    await getDatabaseList()
    console.log('PreRequestScripts: Database list loaded from cache')
  } catch (error) {
    console.error('PreRequestScripts: Failed to get database list:', error)
  }
}

const scriptTypes = [
  // { label: '提取变量', value: 'EXTRACT_VARIABLE' },
  { label: '数据库操作', value: 'DB_CONNECTION' },
  { label: 'Python脚本', value: 'PYTHON_SCRIPT' },
  { label: 'JavaScript脚本', value: 'JS_SCRIPT' },
  { label: '等待时间', value: 'WAIT_TIME' }
]

// 获取脚本徽章样式类
const getScriptBadgeClass = (type) => {
  const classMap = {
    'EXTRACT_VARIABLE': 'badge-extract',
    'DB_CONNECTION': 'badge-database',
    'PYTHON_SCRIPT': 'badge-python',
    'JS_SCRIPT': 'badge-javascript',
    'WAIT_TIME': 'badge-wait'
  }
  return classMap[type] || 'badge-default'
}

// 格式化等待时间显示
const formatWaitTime = (milliseconds) => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}秒`
  } else {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = ((milliseconds % 60000) / 1000).toFixed(1)
    return `${minutes}分${seconds}秒`
  }
}

// Monaco Editor 语言映射
const getMonacoLanguage = (setupType) => {
  return setupType === 'PYTHON_SCRIPT' ? 'python' : 'javascript'
}

// 获取脚本的唯一标识
const getScriptKey = (script) => {
  return script.setupId || `temp_${script.sortNo}_${script.setupType}`
}

// 初始化单个脚本的编辑器
const initEditorForScript = (script) => {
  const key = getScriptKey(script)
  const container = editorContainerMap.get(key)

  if (!container || editorInstanceMap.has(key)) return

  const editorInstance = monaco.editor.create(container, {
    value: script.script || '',
    language: getMonacoLanguage(script.setupType),
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    tabSize: 2,
    insertSpaces: true,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true }
  })

  // 存储到 Map 中（非响应式）
  editorInstanceMap.set(key, editorInstance)

  // 监听内容变化，使用 toRaw 获取原始对象
  editorInstance.onDidChangeModelContent(() => {
    const rawEditor = toRaw(editorInstance)
    script.script = rawEditor.getValue()
  })
}

// 设置编辑器引用（仅保存 DOM 引用，不立即初始化）
const setEditorRef = (el, script) => {
  if (!el) return

  const key = getScriptKey(script)
  const existingContainer = editorContainerMap.get(key)

  // 如果 DOM 容器变化了（v-if 导致重建），需要清理旧实例
  if (existingContainer && existingContainer !== el) {
    const oldInstance = editorInstanceMap.get(key)
    if (oldInstance) {
      toRaw(oldInstance).dispose()
      editorInstanceMap.delete(key)
    }
  }

  editorContainerMap.set(key, el)

  // 如果脚本已展开，则初始化编辑器（不使用延迟）
  if (script.expanded && !editorInstanceMap.has(key)) {
    nextTick(() => {
      initEditorForScript(script)
    })
  }
}

// 获取脚本占位符
const getScriptPlaceholder = (setupType) => {
  if (setupType === 'PYTHON_SCRIPT') {
    return '# 请输入Python脚本\n# 示例:\ndef main():\n    print("Hello World")\n    return {"status": "success"}'
  }
  return '// 请输入JavaScript脚本\n// 示例:\nfunction main() {\n    console.log("Hello World");\n    return { status: "success" };\n}'
}

// 格式化返回值
const formatReturnValue = (value) => {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

// 展开/收起脚本面板
const toggleScriptExpand = (script) => {
  script.expanded = !script.expanded

  // 如果是展开操作且是脚本类型
  if (script.expanded && ['PYTHON_SCRIPT', 'JS_SCRIPT'].includes(script.setupType)) {
    nextTick(() => {
      const key = getScriptKey(script)
      const existingInstance = editorInstanceMap.get(key)

      // 如果编辑器未初始化，先初始化
      if (!existingInstance && editorContainerMap.has(key)) {
        initEditorForScript(script)
      } else if (existingInstance) {
        // 已初始化则刷新布局，使用 toRaw 获取原始对象
        toRaw(existingInstance).layout()
      }
    })
  }
}

// 切换脚本编辑器全屏
const toggleScriptFullscreen = (script) => {
  const key = getScriptKey(script)
  if (fullscreenScriptKey.value === key) {
    fullscreenScriptKey.value = null
  } else {
    fullscreenScriptKey.value = key
  }
  nextTick(() => {
    const editorInstance = editorInstanceMap.get(key)
    if (editorInstance) {
      setTimeout(() => {
        toRaw(editorInstance).layout()
      }, 50)
    }
  })
}

// 检查脚本是否全屏
const isScriptFullscreen = (script) => {
  return fullscreenScriptKey.value === getScriptKey(script)
}

// 清空脚本内容
const clearScriptContent = (script) => {
  script.script = ''
  const key = getScriptKey(script)
  const editorInstance = editorInstanceMap.get(key)
  if (editorInstance) {
    toRaw(editorInstance).setValue('')
  }
}

// 插入代码片段
const insertSnippet = (code, script) => {
  const key = getScriptKey(script)
  const editorInstance = editorInstanceMap.get(key)

  if (editorInstance) {
    const rawEditor = toRaw(editorInstance)
    const position = rawEditor.getPosition()
    const range = new monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column
    )
    rawEditor.executeEdits('insert-snippet', [{
      range: range,
      text: code + '\n',
      forceMoveMarkers: true
    }])
    rawEditor.focus()
  } else {
    // 如果 Monaco 实例不存在，直接追加到脚本内容
    script.script = (script.script || '') + code + '\n'
  }
}

// 调试脚本
const handleDebugScript = async (script) => {
  if (!script.script) {
    ElMessage.warning('请先输入脚本内容')
    return
  }

  script.debugLoading = true
  script.debugResult = null

  try {
    const scriptType = script.setupType === 'PYTHON_SCRIPT' ? 'python' : 'javascript'
    const response = await debugScript_library({
      scriptType: scriptType,
      scriptContent: script.script,
      envId: props.envId
    })

    script.debugResult = {
      success: response.data?.success ?? false,
      logs: response.data?.logs || '',
      error: response.data?.error || '',
      result: response.data?.result
    }
  } catch (error) {
    script.debugResult = {
      success: false,
      error: error.message || '执行脚本失败',
      logs: ''
    }
  } finally {
    script.debugLoading = false
  }
}

// 安全的事件处理函数
const safeStopPropagation = (event) => {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation()
  }
}

// 修复后的事件处理函数
const handleInputClick = (event) => {
  safeStopPropagation(event)
}

const handleInputFocus = (event) => {
  safeStopPropagation(event)
}

const handleInputChange = (value, event) => {
  safeStopPropagation(event)
}

const handleSelectClick = (event) => {
  safeStopPropagation(event)
}

const handleSelectFocus = (event) => {
  safeStopPropagation(event)
}

const handleSelectChange = (value, event) => {
  safeStopPropagation(event)
}

const handleTextareaClick = (event) => {
  safeStopPropagation(event)
}

const handleTextareaFocus = (event) => {
  safeStopPropagation(event)
}

const handleTextareaChange = (value, event) => {
  safeStopPropagation(event)
}

const handleExtractInputClick = (event) => {
  safeStopPropagation(event)
}

const handleExtractInputFocus = (event) => {
  safeStopPropagation(event)
}

const handleExtractInputChange = (value, event) => {
  safeStopPropagation(event)
}

const handleAddExtractVariable = (script) => {
  // 阻止事件冒泡，防止触发展开/收起
  addExtractVariable(script)
}

const handleRemoveExtractVariable = (script, index) => {
  // 阻止事件冒泡，防止触发展开/收起
  removeExtractVariable(script, index)
}

// 添加提取变量
const addExtractVariable = (script) => {
  if (!script.extractVariables) {
    script.extractVariables = []
  }
  script.extractVariables.push({
    jsonpath: '',
    variable_name: ''
  })
}

// 删除提取变量
const removeExtractVariable = async (script, index) => {
  try {
    await ElMessageBox.confirm('确定删除此变量提取？', '确认', { type: 'warning' })
    script.extractVariables.splice(index, 1)
    ElMessage.success('变量提取已删除')
  } catch {}
}

// 字段映射函数
const mapBackendFields = (backendItem) => {
  return {
    caseId: props.caseId,
    setupId: backendItem.setupId,
    name: backendItem.name || '',
    setupType: backendItem.setupType,
    script: backendItem.script || '',
    dbConnectionId: backendItem.dbConnectionId || null,
    waitTime: backendItem.waitTime || 0,
    extractVariableMethod: backendItem.extractVariableMethod || 'response_json',
    jsonpath: backendItem.jsonpath || '',
    variableName: backendItem.variableName || '',
    extractIndexIsRun: backendItem.extractIndexIsRun || false,
    extractIndex: backendItem.extractIndex || 0,
    isRun: backendItem.isRun === true || backendItem.isRun === 1,
    sortNo: backendItem.sortNo || 0,
    delFlag: backendItem.delFlag || '0',
    expanded: false,
    createTime: backendItem.createTime,
    updateTime: backendItem.updateTime,
    createBy: backendItem.createBy,
    updateBy: backendItem.updateBy,
    caseId: backendItem.caseId,
    remark: backendItem.remark,
    description: backendItem.description,
    // 新增：数据库提取变量支持
    extractVariables: backendItem.extractVariables || [],
    // 新增：脚本调试相关（不再存储 Monaco 实例，使用独立 Map）
    debugLoading: false,
    debugResult: null
  }
}

const getDisplayIndex = (script) => {
  const validScripts = internalSetupList.value.filter(s => s.delFlag !== '1')
  const index = validScripts.findIndex(s => s.setupId === script.setupId)
  return index + 1
}

const getScriptTypeLabel = (type) => {
  const found = scriptTypes.find(t => t.value === type)
  return found ? found.label : '未知'
}

// 获取脚本摘要（一行显示）
const getScriptSummary = (script) => {
  switch (script.setupType) {
    case 'PYTHON_SCRIPT':
      return `Python脚本：${script.name || '未命名'}`
    case 'JS_SCRIPT':
      return `JavaScript脚本：${script.name || '未命名'}`
    case 'DB_CONNECTION':
      return `数据库操作：${script.name || '未命名'}`
    case 'WAIT_TIME':
      const seconds = (script.waitTime || 0) / 1000
      return `等待${seconds}秒`
    case 'EXTRACT_VARIABLE':
      return `提取变量：${script.name || '未命名'}`
    default:
      return script.name || '未命名操作'
  }
}

// 排序函数
const sortInternalList = () => {
  internalSetupList.value.sort((a, b) => {
    if (a.delFlag === '1' && b.delFlag !== '1') return '1'
    if (a.delFlag !== '1' && b.delFlag === '1') return '-1'
    if (a.delFlag === '1' && b.delFlag === '1') return '0'
    
    const sortNoA = a.sortNo || 999999
    const sortNoB = b.sortNo || 999999
    return sortNoA - sortNoB
  })
}

// 初始化数据 - 添加防重复初始化逻辑
const initializeData = () => {
  console.log('PreRequestScripts initializeData called with:', props.setupList, props.caseId)
  
  // 如果当前内部数据不为空且与props数据长度相同，且caseId匹配，则跳过初始化
  if (internalSetupList.value.length > 0 && 
      props.setupList && 
      internalSetupList.value.length === props.setupList.length &&
      internalSetupList.value[0]?.caseId === props.caseId) {
    console.log('Skipping initialization - data already matches')
    return
  }
  
  if (props.setupList && props.setupList.length > 0) {
    internalSetupList.value = props.setupList.map((item, index) => {
      const mapped = mapBackendFields(item)
      if (!mapped.sortNo || mapped.sortNo === 0) {
        mapped.sortNo = index + 1
      }
      return mapped
    })
    sortInternalList()
  } else {
    internalSetupList.value = []
  }
}

const ensureProperSorting = () => {
  const validScripts = internalSetupList.value.filter(script => script.delFlag !== '1')
  validScripts.forEach((script, index) => {
    script.sortNo = index + 1
  })
}

const addScript = (type) => {
  const newScript = {
    caseId: props.caseId,
    name: '',
    setupType: type,
    script: '',
    dbConnectionId: null,
    waitTime: type === 'WAIT_TIME' ? 1000 : 0,
    extractVariableMethod: type === 'EXTRACT_VARIABLE' ? 'response_json' : undefined,
    jsonpath: '',
    variableName: '',
    extractIndexIsRun: false,
    extractIndex: 0,
    isRun: true,
    sortNo: getNextSortNo(),
    delFlag: '0',
    expanded: false, // 默认不展开，避免立即初始化编辑器
    isNew: true,
    // 新增：为数据库操作初始化空的提取变量数组
    extractVariables: type === 'DB_CONNECTION' ? [] : undefined,
    // 新增：脚本调试相关（不再存储 Monaco 实例，使用独立 Map）
    debugLoading: false,
    debugResult: null
  }

  internalSetupList.value.push(newScript)
  sortInternalList()

  // 使用 nextTick 延迟展开
  nextTick(() => {
    newScript.expanded = true
  })
}

const removeScript = async (script) => {
  try {
    await ElMessageBox.confirm('确定删除此操作？', '确认', { type: 'warning' })

    // 清理对应的 Monaco 实例
    const key = getScriptKey(script)
    const editorInstance = editorInstanceMap.get(key)
    if (editorInstance) {
      toRaw(editorInstance).dispose()
      editorInstanceMap.delete(key)
      editorContainerMap.delete(key)
    }

    script.delFlag = '1'
    ElMessage.success('表单项已删除')
    ensureProperSorting()
    sortInternalList()
  } catch {}
}

const handleDragChange = (evt) => {
  nextTick(() => {
    updateSortOrder()
    sortInternalList()
  })
}

const getNextSortNo = () => {
  const validScripts = internalSetupList.value.filter(script => script.delFlag !== '1')
  const maxSort = Math.max(0, ...validScripts.map(s => s.sortNo || 0))
  return maxSort + 1
}

const updateSortOrder = () => {
  const validScripts = internalSetupList.value.filter(script => script.delFlag !== '1')
  validScripts.forEach((script, index) => {
    script.sortNo = index + 1
  })
}

const validate = () => {
  const errors = []
  
  internalSetupList.value.forEach((script, index) => {
    if (script.delFlag === '1') return
    
    if (script.setupType === 'DB_CONNECTION') {
      if (!script.dbConnectionId) {
        errors.push(`第${index + 1}个数据库操作未选择数据库`)
      }
      
      // 验证提取变量
      if (script.extractVariables && script.extractVariables.length > 0) {
        script.extractVariables.forEach((extractVar, varIndex) => {
          if (extractVar.jsonpath && !extractVar.variable_name) {
            errors.push(`第${index + 1}个数据库操作的第${varIndex + 1}个提取变量缺少变量名`)
          }
          if (!extractVar.jsonpath && extractVar.variable_name) {
            errors.push(`第${index + 1}个数据库操作的第${varIndex + 1}个提取变量缺少JSONPath`)
          }
        })
      }
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

const getData = () => {
  ensureProperSorting()
  sortInternalList()

  return internalSetupList.value
    .map(script => {
      const { expanded, isNew, debugLoading, debugResult, ...dataToSave } = script

      // 处理数据库操作的提取变量，清理空的提取变量
      if (script.setupType === 'DB_CONNECTION' && script.extractVariables) {
        dataToSave.extractVariables = script.extractVariables.filter(extractVar =>
          extractVar.jsonpath && extractVar.jsonpath.trim() !== '' ||
          extractVar.variable_name && extractVar.variable_name.trim() !== ''
        )

        // 如果没有有效的提取变量，则设置为空数组
        if (dataToSave.extractVariables.length === 0) {
          dataToSave.extractVariables = []
        }
      }

      return dataToSave
    })
}

// 无感同步数据（根据后端返回数据完全替换本地数据，而非仅同步ID）
const syncIds = async (latestDataList) => {
  console.log('PreRequestScripts: syncIds called with:', latestDataList)

  if (!Array.isArray(latestDataList)) {
    console.log('PreRequestScripts: invalid data to sync')
    return
  }

  try {
    // 保存当前展开状态
    const expandedStates = new Map()
    internalSetupList.value.forEach(item => {
      const key = item.setupId || `${item.name}_${item.setupType}`
      expandedStates.set(key, item.expanded)
    })

    // 完全替换本地数据为后端返回的数据
    internalSetupList.value = latestDataList.map((item, index) => {
      const mapped = mapBackendFields(item)
      // 恢复展开状态
      const key = mapped.setupId || `${mapped.name}_${mapped.setupType}`
      if (expandedStates.has(key)) {
        mapped.expanded = expandedStates.get(key)
      }
      if (!mapped.sortNo || mapped.sortNo === 0) {
        mapped.sortNo = index + 1
      }
      return mapped
    })

    sortInternalList()
    console.log('PreRequestScripts: data synced successfully, count:', internalSetupList.value.length)
  } catch (error) {
    console.error('PreRequestScripts: Error syncing data:', error)
  }
}

// 获取启用的前置脚本数量（用于badge显示）
const getEnabledCount = () => {
  return internalSetupList.value.filter(item =>
    item.isRun === true && item.name && item.delFlag !== '1'
  ).length
}

defineExpose({ validate, getData, syncIds, getEnabledCount })

// 监听caseId变化 - 只在切换用例时才重新初始化，不监听setupList内容变化
watch(() => props.caseId, (newCaseId, oldCaseId) => {
  if (newCaseId !== oldCaseId) {
    console.log('PreRequestScripts: caseId changed from', oldCaseId, 'to', newCaseId, '- reinitializing')
    initializeData()
  }
}, { immediate: false })

onMounted(() => {
  initializeData()
  getList()
})

onBeforeUnmount(() => {
  // 清理所有 Monaco 编辑器实例
  editorInstanceMap.forEach((instance) => {
    if (instance) {
      toRaw(instance).dispose()
    }
  })
  editorInstanceMap.clear()
  editorContainerMap.clear()
})
</script>

<style scoped>
.pre-request-scripts {
  padding: 12px;
  height: 100%;
  overflow: auto;
  background-color: var(--el-bg-color);
}

.scripts-list {
  margin-bottom: 16px;
}

.script-item {
  margin-bottom: 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color-page);
  transition: all 0.2s ease;
  overflow: hidden;
}

.script-item:hover {
  border-color: var(--el-border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.script-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  background: var(--el-bg-color-page);
  transition: background-color 0.2s ease;
}

.script-header:hover {
  background: var(--el-fill-color-extra-light);
}

.script-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.drag-handle {
  cursor: move;
  color: var(--el-text-color-placeholder);
  user-select: none;
  font-size: 12px;
}

.script-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.badge-extract {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.badge-database {
  background: linear-gradient(135deg, #409eff, #79bbff);
}

.badge-python {
  background: linear-gradient(135deg, #3776ab, #4b8bbe);
}

.badge-javascript {
  background: linear-gradient(135deg, #f7df1e, #d4c441);
  color: #333;
}

.badge-wait {
  background: linear-gradient(135deg, #e6a23c, #eebe77);
}

.badge-default {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.script-details {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.script-summary {
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.script-type {
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.script-name {
  color: var(--el-text-color-regular);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.script-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.expand-icon {
  color: var(--el-text-color-placeholder);
  transition: transform 0.2s ease;
  font-size: 14px;
}

.expand-icon.is-expanded {
  transform: rotate(180deg);
}

.script-config {
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.config-content {
  padding: 16px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.config-row.full-width {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.config-row:last-child {
  margin-bottom: 0;
}

.config-label {
  min-width: 80px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  font-weight: 500;
  flex-shrink: 0;
}

.full-width .config-label {
  min-width: auto;
}

.wait-time-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-unit {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.time-display {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

/* 数据库提取变量相关样式 */
.extract-variables-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.extract-variables-list {
  space-y: 8px;
}

.extract-variable-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-extra-light);
  margin-bottom: 8px;
}

.extract-variable-content {
  padding: 12px;
}

.extract-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.extract-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.extract-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.extract-actions {
  display: flex;
  align-items: center;
  padding-bottom: 2px;
}

.no-extract-variables {
  text-align: center;
  padding: 20px;
  color: var(--el-text-color-placeholder);
}

.add-section {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.add-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color-page);
}

.add-button:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.arrow-icon {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.script-type-menu {
  min-width: 180px;
}

.script-type-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px !important;
}

.type-icon {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

/* 拖拽样式 */
.sortable-ghost {
  opacity: 0.6;
  transform: scale(0.98);
}

.sortable-chosen {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.sortable-drag {
  transform: rotate(2deg);
}

/* 滚动条优化 */
.pre-request-scripts::-webkit-scrollbar {
  width: 6px;
}

.pre-request-scripts::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: 3px;
}

.pre-request-scripts::-webkit-scrollbar-thumb {
  background: var(--el-fill-color-dark);
  border-radius: 3px;
}

.pre-request-scripts::-webkit-scrollbar-thumb:hover {
  background: var(--el-fill-color-darker);
}

/* 表单控件优化 */
:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-textarea__inner) {
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

:deep(.el-input-number .el-input__wrapper) {
  border-radius: 6px;
}

/* 脚本编辑器样式 */
.script-editor-wrapper {
  width: 100%;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 代码片段下拉菜单样式 */
.snippet-dropdown-menu {
  max-height: 400px;
  overflow-y: auto;
}

.snippet-category-title {
  padding: 8px 16px 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.snippet-item {
  font-size: 13px;
  padding-left: 24px !important;
}

.snippet-item:hover {
  background: var(--el-color-primary-light-9);
}

.monaco-editor-wrapper {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Monaco Editor 全屏工具栏 */
.monaco-fullscreen-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 8px;
  gap: 8px;
  min-height: 32px;
  background-color: #1e1e1e;
}

/* 全屏模式样式 */
.monaco-editor-wrapper.is-fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  background-color: #1e1e1e !important;
  padding: 16px !important;
  box-sizing: border-box !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  border-radius: 0 !important;
}

.monaco-editor-wrapper.is-fullscreen .monaco-fullscreen-toolbar {
  flex: 0 0 40px !important;
  height: 40px !important;
  max-height: 40px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  padding: 0 16px !important;
  background-color: #252526 !important;
  border-radius: 4px !important;
  margin-bottom: 8px !important;
}

.monaco-editor-wrapper.is-fullscreen .monaco-editor-container {
  flex: 1 1 0 !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: none !important;
  position: relative !important;
  overflow: hidden !important;
}

.monaco-editor-wrapper.is-fullscreen .monaco-editor-container .monaco-editor {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

.monaco-editor-container {
  height: 200px;
  min-height: 200px;
}

/* 调试结果样式 */
.debug-result-section {
  margin-top: 12px;
}

.debug-result {
  width: 100%;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 12px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-output,
.result-return {
  background: #fff;
  border-radius: 4px;
  padding: 8px 12px;
}

.output-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.output-text {
  margin: 0;
  padding: 8px;
  background: var(--el-fill-color-extra-light);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 150px;
  overflow: auto;
}

.result-error {
  margin-top: 8px;
}
</style>