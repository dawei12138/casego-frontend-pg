<template>
  <div class="post-response-scripts">
    <!-- 脚本列表 -->
    <div v-if="internalTeardownList.filter(s => s.delFlag !== '1').length > 0" class="scripts-list">
      <draggable 
        v-model="internalTeardownList" 
        @change="handleDragChange"
        item-key="teardownId"
        handle=".drag-handle"
        :animation="200"
        ghost-class="sortable-ghost"
        chosen-class="sortable-chosen"
        drag-class="sortable-drag"
        :group="{ name: 'scripts', pull: false, put: false }"
      >
        <template #item="{ element: script, index }">
          <div v-show="script.delFlag !== '1'" class="script-item" :key="script.teardownId">
            <!-- 脚本头部 -->
            <div class="script-header" @click="toggleScriptExpand(script)">
              <div class="script-info">
                <span class="drag-handle">⋮⋮</span>
                <div class="script-badge" :class="getScriptBadgeClass(script.teardownType)">
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
              <div v-if="script.teardownType === 'EXTRACT_VARIABLE'" class="config-content">
                <div class="config-row">
                  <label class="config-label">操作名称</label>
                  <el-input v-model="script.name" placeholder="请输入操作名称" size="small" />
                </div>
                
                <div class="config-row">
                  <label class="config-label">提取方法</label>
                  <el-select v-model="script.extractVariableMethod" size="small" style="width: 200px;" @change="handleExtractMethodChange(script)">
                    <el-option label="响应JSON" value="response_json" />
                    <el-option label="响应文本" value="response_text" />
                    <el-option label="响应XML" value="response_xml" />
                    <el-option label="响应头" value="response_header" />
                    <el-option label="响应Cookie" value="response_cookie" />
                  </el-select>
                </div>
                
                <!-- JSONPath配置 (response_json) -->
                <template v-if="script.extractVariableMethod === 'response_json'">
                  <div class="config-row">
                    <label class="config-label">JSONPath</label>
                    <el-input 
                      v-model="script.jsonpath" 
                      placeholder="$.data.token" 
                      size="small"
                    >
                      <template #append>
                        <el-button size="small" @click="showJsonPathHelp">
                          <el-icon><QuestionFilled /></el-icon>
                        </el-button>
                      </template>
                    </el-input>
                  </div>
                  
                  <div class="config-row">
                    <label class="config-label">提取索引</label>
                    <div class="index-config">
                      <el-switch
                        v-model="script.extractIndexIsRun"
                        size="small"
                      />
                      <span class="index-label">启用索引</span>
                      <el-input-number
                        v-if="script.extractIndexIsRun"
                        v-model="script.extractIndex"
                        :min="0"
                        size="small"
                        style="width: 80px;"
                        placeholder="索引"
                      />
                    </div>
                  </div>
                </template>
                
                <!-- 正则表达式配置 (response_text) -->
                <div v-else-if="script.extractVariableMethod === 'response_text'" class="config-row">
                  <label class="config-label">正则表达式</label>
                  <el-input 
                    v-model="script.regularExpression" 
                    placeholder="请输入正则表达式" 
                    size="small"
                  />
                </div>
                
                <!-- XPath表达式配置 (response_xml) -->
                <div v-else-if="script.extractVariableMethod === 'response_xml'" class="config-row">
                  <label class="config-label">XPath表达式</label>
                  <el-input 
                    v-model="script.xpathExpression" 
                    placeholder="请输入XPath表达式" 
                    size="small"
                  />
                </div>
                
                <!-- 响应头配置 (response_header) -->
                <div v-else-if="script.extractVariableMethod === 'response_header'" class="config-row">
                  <label class="config-label">响应头名称</label>
                  <el-input 
                    v-model="script.responseHeader" 
                    placeholder="请输入响应头名称" 
                    size="small"
                  />
                </div>
                
                <!-- 响应Cookie配置 (response_cookie) -->
                <div v-else-if="script.extractVariableMethod === 'response_cookie'" class="config-row">
                  <label class="config-label">Cookie名称</label>
                  <el-input 
                    v-model="script.responseCookie" 
                    placeholder="请输入Cookie名称" 
                    size="small"
                  />
                </div>
                
                <!-- 变量名 (所有方法都需要) -->
                <div class="config-row">
                  <label class="config-label">变量名</label>
                  <el-input v-model="script.variableName" placeholder="token" size="small" />
                </div>
              </div>
              
              <!-- 数据库操作 -->
              <div v-else-if="script.teardownType === 'DB_CONNECTION'" class="config-content">
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
                    v-model="script.databaseId" 
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
                  <label class="config-label">数据库操作</label>
                  <el-input 
                    v-model="script.dbOperation" 
                    type="textarea" 
                    :rows="4" 
                    size="small"
                    placeholder="请输入SQL语句或数据库操作脚本"
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
              <div v-else-if="['PYTHON_SCRIPT', 'JS_SCRIPT'].includes(script.teardownType)" class="config-content">
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
              <div v-else-if="script.teardownType === 'WAIT_TIME'" class="config-content">
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
          <span>添加后置操作</span>
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

    <!-- JSONPath帮助对话框 -->
    <el-dialog v-model="showJsonPathDialog" title="JSONPath 语法帮助" width="600px">
      <div class="jsonpath-help">
        <h4>常用 JSONPath 表达式：</h4>
        <ul class="help-list">
          <li><code>$.data</code> - 获取根对象的 data 属性</li>
          <li><code>$.data.status</code> - 获取 data 对象的 status 属性</li>
          <li><code>$.items[0]</code> - 获取 items 数组的第一个元素</li>
          <li><code>$.items[*].name</code> - 获取 items 数组中所有元素的 name 属性</li>
          <li><code>$..name</code> - 递归搜索所有 name 属性</li>
          <li><code>$.items[?(@.price > 10)]</code> - 过滤条件：价格大于10</li>
        </ul>
      </div>
      <template #footer>
        <el-button @click="showJsonPathDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch, toRaw } from 'vue'
import { Plus, Delete, ArrowDown, QuestionFilled, VideoPlay, Close, DocumentCopy, FullScreen } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import { useDatabaseList } from '../composables/useDatabaseList'
import { debugScript_library } from '@/api/api_script_library/script_library'
// 导入样式文件
import '../styles/post-response-scripts.css'

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
  }
]

const props = defineProps({
  teardownList: { type: Array, default: () => [] },
  caseId: {
    type: [Number, String],
    default: null
  },
  envId: {
    type: [Number, String],
    default: null
  }
})

const internalTeardownList = ref([])
const loading = ref(true);
const showJsonPathDialog = ref(false)

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
    console.log('PostResponseScripts: Database list loaded from cache')
  } catch (error) {
    console.error('PostResponseScripts: Failed to get database list:', error)
  }
}

const scriptTypes = [
  { label: '提取变量', value: 'EXTRACT_VARIABLE' },
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
const getMonacoLanguage = (teardownType) => {
  return teardownType === 'PYTHON_SCRIPT' ? 'python' : 'javascript'
}

// 获取脚本的唯一标识
const getScriptKey = (script) => {
  return script.teardownId || `temp_${script.sortNo}_${script.teardownType}`
}

// 初始化单个脚本的编辑器
const initEditorForScript = (script) => {
  const key = getScriptKey(script)
  const container = editorContainerMap.get(key)

  if (!container || editorInstanceMap.has(key)) return

  const editorInstance = monaco.editor.create(container, {
    value: script.script || '',
    language: getMonacoLanguage(script.teardownType),
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
const getScriptPlaceholder = (teardownType) => {
  if (teardownType === 'PYTHON_SCRIPT') {
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
  if (script.expanded && ['PYTHON_SCRIPT', 'JS_SCRIPT'].includes(script.teardownType)) {
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
    const scriptType = script.teardownType === 'PYTHON_SCRIPT' ? 'python' : 'javascript'
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

// 新增处理提取方法变化的函数
const handleExtractMethodChange = (script) => {
  // 清空其他方法的字段
  script.jsonpath = ''
  script.extractIndex = 0
  script.extractIndexIsRun = false
  script.regularExpression = ''
  script.xpathExpression = ''
  script.responseHeader = ''
  script.responseCookie = ''
  
  // 根据新方法设置默认值
  if (script.extractVariableMethod === 'response_json') {
    script.extractIndexIsRun = false
    script.extractIndex = 0
  }
}

// 显示JSONPath帮助
const showJsonPathHelp = () => {
  showJsonPathDialog.value = true
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

// 字段映射函数 - 修改这里处理script字段
const mapBackendFields = (backendItem) => {
  return {
    caseId: props.caseId,
    teardownId: backendItem.teardownId,
    name: backendItem.name || '',
    teardownType: backendItem.teardownType,
    script: backendItem.script || '', // 脚本内容直接使用script字段
    databaseId: backendItem.databaseId || null,
    dbOperation: backendItem.dbOperation || '',
    waitTime: backendItem.waitTime || 0,
    extractVariableMethod: backendItem.extractVariableMethod || 'response_json',
    // 提取变量相关字段
    jsonpath: backendItem.jsonpath || '',
    extractIndex: backendItem.extractIndex || 0,
    extractIndexIsRun: backendItem.extractIndexIsRun === true || backendItem.extractIndexIsRun === 1,
    variableName: backendItem.variableName || '',
    regularExpression: backendItem.regularExpression || '',
    xpathExpression: backendItem.xpathExpression || '',
    responseHeader: backendItem.responseHeader || '',
    responseCookie: backendItem.responseCookie || '',
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

// 排序函数
const sortInternalList = () => {
  internalTeardownList.value.sort((a, b) => {
    if (a.delFlag === '1' && b.delFlag !== '1') return '1'
    if (a.delFlag !== '1' && b.delFlag === '1') return '-1'
    if (a.delFlag === '1' && b.delFlag === '1') return '0'
    
    const sortNoA = a.sortNo || 999999
    const sortNoB = b.sortNo || 999999
    return sortNoA - sortNoB
  })
}

// 获取显示索引
const getDisplayIndex = (script) => {
  const validScripts = internalTeardownList.value.filter(s => s.delFlag !== '1')
  const index = validScripts.findIndex(s => s.teardownId === script.teardownId)
  return index + 1
}

// 获取脚本类型标签
const getScriptTypeLabel = (type) => {
  const found = scriptTypes.find(t => t.value === type)
  return found ? found.label : '未知'
}

// 获取脚本摘要（一行显示）
const getScriptSummary = (script) => {
  switch (script.teardownType) {
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

// 初始化数据 - 添加防重复初始化逻辑
const initializeData = () => {
  console.log('PostResponseScripts initializeData called with:', props.teardownList, props.caseId)
  
  // 如果当前内部数据不为空且与props数据长度相同，且caseId匹配，则跳过初始化
  if (internalTeardownList.value.length > 0 && 
      props.teardownList && 
      internalTeardownList.value.length === props.teardownList.length &&
      internalTeardownList.value[0]?.caseId === props.caseId) {
    console.log('Skipping initialization - data already matches')
    return
  }
  
  if (props.teardownList && props.teardownList.length > 0) {
    const sortedList = [...props.teardownList].sort((a, b) => {
      const sortNoA = a.sortNo || 999999
      const sortNoB = b.sortNo || 999999
      return sortNoA - sortNoB
    })
    
    internalTeardownList.value = sortedList.map((item, index) => {
      const mapped = mapBackendFields(item)
      if (!mapped.sortNo || mapped.sortNo === 0) {
        mapped.sortNo = index + 1
      }
      return mapped
    })
    
    sortInternalList()
  } else {
    internalTeardownList.value = []
  }
}

// 添加脚本 - 修改这里为script类型设置空的script字段
const addScript = (type) => {
  const newScript = {
    caseId: props.caseId,
    name: '',
    teardownType: type,
    script: '', // 所有类型都有script字段，对于脚本类型来说这是脚本内容
    databaseId: null,
    dbOperation: '',
    waitTime: type === 'WAIT_TIME' ? 1000 : 0,
    extractVariableMethod: type === 'EXTRACT_VARIABLE' ? 'response_json' : undefined,
    // 提取变量字段初始化
    jsonpath: '',
    extractIndex: 0,
    extractIndexIsRun: false,
    variableName: '',
    regularExpression: '',
    xpathExpression: '',
    responseHeader: '',
    responseCookie: '',
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

  internalTeardownList.value.push(newScript)
  sortInternalList()

  // 使用 nextTick 延迟展开
  nextTick(() => {
    newScript.expanded = true
  })
}

// 删除脚本
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

    if (script.isNew) {
      const index = internalTeardownList.value.findIndex(s => s.teardownId === script.teardownId)
      if (index > -1) {
        internalTeardownList.value.splice(index, 1)
      }
    } else {
      script.delFlag = '1'
    }
    ElMessage.success('表单项已删除')
    ensureProperSorting()
    sortInternalList()
  } catch {}
}

// 拖拽处理
const handleDragChange = (evt) => {
  nextTick(() => {
    updateSortOrder()
    sortInternalList()
  })
}

// 获取下一个排序号
const getNextSortNo = () => {
  const validScripts = internalTeardownList.value.filter(script => script.delFlag !== '1')
  const maxSort = Math.max(0, ...validScripts.map(s => s.sortNo || 0))
  return maxSort + 1
}

// 更新排序
const updateSortOrder = () => {
  const validScripts = internalTeardownList.value.filter(script => script.delFlag !== '1')
  validScripts.forEach((script, index) => {
    script.sortNo = index + 1
  })
}

// 确保排序正确
const ensureProperSorting = () => {
  const validScripts = internalTeardownList.value.filter(script => script.delFlag !== '1')
  validScripts.forEach((script, index) => {
    script.sortNo = index + 1
  })
}

// 验证脚本 - 修改这里添加对Python/JS脚本的验证
const validate = () => {
  const errors = []
  
  internalTeardownList.value.forEach((script, index) => {
    if (script.delFlag === '1') return
    
    if (script.teardownType === 'EXTRACT_VARIABLE') {
      if (!script.variableName) {
        errors.push(`第${index + 1}个提取变量操作缺少变量名`)
      }
      
      // 根据提取方法验证对应字段
      switch (script.extractVariableMethod) {
        case 'response_json':
          if (!script.jsonpath) {
            errors.push(`第${index + 1}个JSON提取操作缺少JSONPath`)
          }
          break
        // case 'response_text':
        //   if (!script.regularExpression) {
        //     errors.push(`第${index + 1}个文本提取操作缺少正则表达式`)
        //   }
        //   break
        case 'response_xml':
          if (!script.xpathExpression) {
            errors.push(`第${index + 1}个XML提取操作缺少XPath表达式`)
          }
          break
        case 'response_header':
          if (!script.responseHeader) {
            errors.push(`第${index + 1}个响应头提取操作缺少响应头名称`)
          }
          break
        case 'response_cookie':
          if (!script.responseCookie) {
            errors.push(`第${index + 1}个Cookie提取操作缺少Cookie名称`)
          }
          break
      }
    }
    
    if (script.teardownType === 'DB_CONNECTION') {
      if (!script.databaseId) {
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
    
    // 添加对脚本内容的验证
    if (['PYTHON_SCRIPT', 'JS_SCRIPT'].includes(script.teardownType)) {
      if (!script.script || script.script.trim() === '') {
        errors.push(`第${index + 1}个${script.teardownType === 'PYTHON_SCRIPT' ? 'Python' : 'JavaScript'}脚本内容不能为空`)
      }
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

// 获取数据 - 修改这里确保script字段正确保存
const getData = () => {
  ensureProperSorting()
  sortInternalList()

  return internalTeardownList.value.map(script => {
    const { expanded, isNew, debugLoading, debugResult, ...dataToSave } = script

    // 处理数据库操作的提取变量，清理空的提取变量
    if (script.teardownType === 'DB_CONNECTION' && script.extractVariables) {
      dataToSave.extractVariables = script.extractVariables.filter(extractVar =>
        extractVar.jsonpath && extractVar.jsonpath.trim() !== '' ||
        extractVar.variable_name && extractVar.variable_name.trim() !== ''
      )

      // 如果没有有效的提取变量，则设置为空数组
      if (dataToSave.extractVariables.length === 0) {
        dataToSave.extractVariables = []
      }
    }

    // 确保脚本类型的数据正确保存script字段
    if (['PYTHON_SCRIPT', 'JS_SCRIPT'].includes(script.teardownType)) {
      // 确保script字段包含脚本内容
      dataToSave.script = script.script || ''
    }

    // 确保提取变量类型保存所有相关字段
    if (script.teardownType === 'EXTRACT_VARIABLE') {
      dataToSave.jsonpath = script.jsonpath || ''
      dataToSave.extractIndex = script.extractIndex || 0
      dataToSave.extractIndexIsRun = script.extractIndexIsRun || false
      dataToSave.variableName = script.variableName || ''
      dataToSave.regularExpression = script.regularExpression || ''
      dataToSave.xpathExpression = script.xpathExpression || ''
      dataToSave.responseHeader = script.responseHeader || ''
      dataToSave.responseCookie = script.responseCookie || ''
    }

    return dataToSave
  })
}

// 无感同步数据（根据后端返回数据完全替换本地数据，而非仅同步ID）
const syncIds = async (latestDataList) => {
  console.log('PostResponseScripts: syncIds called with:', latestDataList)

  if (!Array.isArray(latestDataList)) {
    console.log('PostResponseScripts: invalid data to sync')
    return
  }

  try {
    // 保存当前展开状态
    const expandedStates = new Map()
    internalTeardownList.value.forEach(item => {
      const key = item.teardownId || `${item.name}_${item.teardownType}`
      expandedStates.set(key, item.expanded)
    })

    // 完全替换本地数据为后端返回的数据
    internalTeardownList.value = latestDataList.map((item, index) => {
      const mapped = mapBackendFields(item)
      // 恢复展开状态
      const key = mapped.teardownId || `${mapped.name}_${mapped.teardownType}`
      if (expandedStates.has(key)) {
        mapped.expanded = expandedStates.get(key)
      }
      if (!mapped.sortNo || mapped.sortNo === 0) {
        mapped.sortNo = index + 1
      }
      return mapped
    })

    sortInternalList()
    console.log('PostResponseScripts: data synced successfully, count:', internalTeardownList.value.length)
  } catch (error) {
    console.error('PostResponseScripts: Error syncing data:', error)
  }
}

// 获取启用的后置脚本数量（用于badge显示）
const getEnabledCount = () => {
  return internalTeardownList.value.filter(item =>
    item.isRun === true && item.name && item.delFlag !== '1'
  ).length
}

defineExpose({ validate, getData, syncIds, getEnabledCount })

// 监听caseId变化 - 只在切换用例时才重新初始化，不监听teardownList内容变化
watch(() => props.caseId, (newCaseId, oldCaseId) => {
  if (newCaseId !== oldCaseId) {
    console.log('PostResponseScripts: caseId changed from', oldCaseId, 'to', newCaseId, '- reinitializing')
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