<template>
  <div class="faker-config-container">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>自定义Faker函数管理</span>
          <div class="header-actions">
            <el-button type="info" :loading="validateLoading" @click="handleValidate">
              <el-icon><Check /></el-icon>
              校验语法
            </el-button>
            <el-button type="primary" :loading="saveLoading" @click="handleSave">
              <el-icon><DocumentChecked /></el-icon>
              保存
            </el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="16" class="content-row">
        <el-col :span="16">
          <div class="editor-section">
            <div class="section-title">
              <div class="title-left">
                <span>代码编辑器</span>
                <el-tag v-if="hasUnsavedChanges" type="warning" size="small">未保存</el-tag>
              </div>
              <el-button size="small" :icon="isFullscreen ? Close : FullScreen" @click="toggleFullscreen">
                {{ isFullscreen ? '退出全屏' : '全屏' }}
              </el-button>
            </div>
            <div class="monaco-editor-wrapper" :class="{ 'is-fullscreen': isFullscreen }">
              <div v-if="isFullscreen" class="fullscreen-toolbar">
                <el-button size="small" :icon="Close" @click="toggleFullscreen">
                  退出全屏
                </el-button>
              </div>
              <div ref="editorContainer" class="monaco-editor-container"></div>
            </div>
          </div>
        </el-col>

        <el-col :span="8">
          <div class="right-panel">
            <div class="function-list-section">
              <div class="section-title">函数列表</div>
              <el-collapse v-model="activeCollapse">
                <el-collapse-item title="自定义函数" name="custom">
                  <div v-if="customFunctions.length === 0" class="empty-tip">暂无自定义函数</div>
                  <div
                    v-for="func in customFunctions"
                    :key="func.name"
                    class="function-item"
                    @click="selectFunction(func)"
                  >
                    <div class="func-info">
                      <span class="func-name">{{ func.name }}({{ formatParams(func.params) }})</span>
                      <span v-if="func.doc" class="func-doc">{{ func.doc }}</span>
                    </div>
                    <el-button link type="primary" size="small" @click.stop="openTestDialog(func)">
                      测试
                    </el-button>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="内置函数" name="builtin">
                  <div v-if="builtinFunctions.length === 0" class="empty-tip">暂无内置函数</div>
                  <div
                    v-for="func in builtinFunctions"
                    :key="func.name"
                    class="function-item"
                  >
                    <div class="func-info">
                      <span class="func-name">{{ func.name }}()</span>
                      <span v-if="func.doc" class="func-doc">{{ func.doc }}</span>
                    </div>
                    <el-button link type="primary" size="small" @click.stop="openTestDialog(func)">
                      测试
                    </el-button>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>

            <div class="test-result-section">
              <div class="section-title">测试结果</div>
              <el-input
                v-model="testResult"
                type="textarea"
                :rows="4"
                placeholder="函数执行结果将在此显示..."
                readonly
              />
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-dialog
      v-model="testDialogVisible"
      title="测试函数"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="testForm" label-width="100px">
        <el-form-item label="函数名">
          <el-input v-model="testForm.functionName" disabled />
        </el-form-item>
        <el-form-item v-if="testForm.doc" label="描述">
          <el-text type="info">{{ testForm.doc }}</el-text>
        </el-form-item>
        <el-form-item v-if="testForm.params && testForm.params.length > 0" label="参数">
          <el-text type="info" size="small">参数: {{ testForm.params.join(', ') }}</el-text>
        </el-form-item>
        <el-form-item label="调用参数">
          <el-input
            v-model="testForm.argsStr"
            placeholder="输入参数，用逗号分隔，例如: 60, 100"
          />
          <div class="form-tip">支持 int/float/str/list/dict 类型。字符串需要引号。</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="testLoading" @click="handleTestFunction">
          执行
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, toRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, DocumentChecked, FullScreen, Close } from '@element-plus/icons-vue'
import * as monaco from 'monaco-editor'
import {
  getFakerContent,
  validateFakerCode,
  saveFakerConfig,
  testFakerFunction,
  getFakerFunctions
} from '@/api/api_faker_config/faker_config'

const editorContainer = ref(null)
let editorInstance = null
const editorContent = ref('')
const originalContent = ref('')
const functionList = ref([])
const validateLoading = ref(false)
const saveLoading = ref(false)
const testLoading = ref(false)
const activeCollapse = ref(['custom', 'builtin'])
const testResult = ref('')
const testDialogVisible = ref(false)
const isFullscreen = ref(false)
const testForm = ref({
  functionName: '',
  doc: '',
  params: [],
  argsStr: ''
})

const hasUnsavedChanges = computed(() => {
  return editorContent.value !== originalContent.value
})

const customFunctions = computed(() => {
  return functionList.value.filter(f => f.source === 'custom')
})

const builtinFunctions = computed(() => {
  return functionList.value.filter(f => f.source === 'builtin')
})

const initEditor = () => {
  if (!editorContainer.value) return

  editorInstance = monaco.editor.create(editorContainer.value, {
    value: editorContent.value,
    language: 'python',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    tabSize: 4,
    insertSpaces: true,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true }
  })

  editorInstance.onDidChangeModelContent(() => {
    editorContent.value = toRaw(editorInstance).getValue()
  })
}

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  nextTick(() => {
    if (editorInstance) {
      setTimeout(() => {
        toRaw(editorInstance).layout()
      }, 50)
    }
  })
}

const loadContent = async () => {
  try {
    const res = await getFakerContent()
    if (res.code === 200 && res.data) {
      editorContent.value = res.data.content || ''
      originalContent.value = res.data.content || ''
      if (editorInstance) {
        editorInstance.setValue(editorContent.value)
      }
      if (res.data.functions) {
        const funcs = res.data.functions.map(f => ({
          ...f,
          source: f.source || 'custom'
        }))
        functionList.value = funcs
      }
    }
  } catch (error) {
    console.error('Failed to load content:', error)
    ElMessage.error('加载配置失败')
  }
}

const loadFunctions = async () => {
  try {
    const res = await getFakerFunctions()
    if (res.code === 200 && res.data) {
      functionList.value = res.data
    }
  } catch (error) {
    console.error('Failed to load functions:', error)
  }
}

const handleValidate = async () => {
  if (validateLoading.value) return
  validateLoading.value = true
  try {
    const res = await validateFakerCode({ content: editorContent.value })
    if (res.code === 200 && res.data) {
      if (res.data.valid) {
        ElMessage.success(res.data.message || '语法校验通过')
        if (res.data.functions) {
          const customFuncs = res.data.functions.map(f => ({
            ...f,
            source: 'custom'
          }))
          const builtins = functionList.value.filter(f => f.source === 'builtin')
          functionList.value = [...customFuncs, ...builtins]
        }
      } else {
        ElMessage.error(res.data.message || '语法校验失败')
        highlightErrorLine(res.data.message)
      }
    }
  } catch (error) {
    console.error('Validation failed:', error)
    ElMessage.error('校验请求失败')
  } finally {
    validateLoading.value = false
  }
}

const highlightErrorLine = (message) => {
  if (!editorInstance || !message) return
  const match = message.match(/line\s*(\d+)/i) || message.match(/(\d+)\s*line/i)
  if (match) {
    const lineNumber = parseInt(match[1])
    editorInstance.revealLineInCenter(lineNumber)
    editorInstance.setPosition({ lineNumber, column: 1 })
  }
}

const handleSave = async () => {
  if (saveLoading.value) return
  saveLoading.value = true
  try {
    const res = await saveFakerConfig({ content: editorContent.value })
    if (res.code === 200) {
      ElMessage.success('保存成功，已热加载')
      originalContent.value = editorContent.value
      if (res.data && res.data.functions) {
        const customFuncs = res.data.functions.map(f => ({
          ...f,
          source: 'custom'
        }))
        const builtins = functionList.value.filter(f => f.source === 'builtin')
        functionList.value = [...customFuncs, ...builtins]
      }
      await loadFunctions()
    } else {
      ElMessage.error(res.msg || '保存失败')
      highlightErrorLine(res.msg)
    }
  } catch (error) {
    console.error('Save failed:', error)
    ElMessage.error('保存请求失败')
  } finally {
    saveLoading.value = false
  }
}

const formatParams = (params) => {
  if (!params || params.length === 0) return ''
  return params.join(', ')
}

const selectFunction = (func) => {
  if (!editorInstance) return
  const content = editorInstance.getValue()
  const regex = new RegExp(`def\\s+${func.name}\\s*\\(`)
  const match = content.match(regex)
  if (match) {
    const index = match.index
    const lines = content.substring(0, index).split('\n')
    const lineNumber = lines.length
    editorInstance.revealLineInCenter(lineNumber)
    editorInstance.setPosition({ lineNumber, column: 1 })
    editorInstance.focus()
  }
}

const openTestDialog = (func) => {
  testForm.value = {
    functionName: func.name,
    doc: func.doc || '',
    params: func.params || [],
    argsStr: ''
  }
  testDialogVisible.value = true
}

const handleTestFunction = async () => {
  if (testLoading.value) return
  testLoading.value = true
  try {
    let args = []
    if (testForm.value.argsStr.trim()) {
      try {
        args = JSON.parse('[' + testForm.value.argsStr + ']')
      } catch (e) {
        ElMessage.warning('参数格式无效，请检查')
        testLoading.value = false
        return
      }
    }

    const res = await testFakerFunction({
      function_name: testForm.value.functionName,
      args: args
    })

    if (res.code === 200 && res.data) {
      if (res.data.success) {
        testResult.value = res.data.result || ''
        ElMessage.success('执行成功: ' + res.data.result)
        testDialogVisible.value = false
      } else {
        testResult.value = '错误: ' + res.data.error
        ElMessage.error(res.data.error || '执行失败')
      }
    }
  } catch (error) {
    console.error('Test execution failed:', error)
    ElMessage.error('测试请求失败')
  } finally {
    testLoading.value = false
  }
}

onMounted(async () => {
  await loadContent()
  await loadFunctions()
  await nextTick()
  initEditor()
})

onBeforeUnmount(() => {
  if (editorInstance) {
    try {
      toRaw(editorInstance).dispose()
    } catch (e) {
      // 忽略销毁时的错误
    }
    editorInstance = null
  }
})
</script>

<style scoped>
.faker-config-container {
  padding: 16px;
  height: calc(100vh - 84px);
}

.main-card {
  height: 100%;
}

.main-card :deep(.el-card__body) {
  height: calc(100% - 60px);
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.content-row {
  height: 100%;
}

.content-row :deep(.el-col) {
  height: 100%;
}

.editor-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.monaco-editor-container {
  flex: 1;
  min-height: 500px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

/* Monaco Editor 包装器样式 */
.monaco-editor-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 全屏模式样式 */
.fullscreen-toolbar {
  display: none;
}

.monaco-editor-wrapper.is-fullscreen .fullscreen-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 16px;
  height: 40px;
  background-color: #252526;
  border-radius: 4px;
  margin-bottom: 8px;
}

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

.right-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.function-list-section {
  flex: 1;
  overflow: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
}

.function-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.function-item:hover {
  background: #ecf5ff;
}

.func-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.func-name {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: #409eff;
}

.func-doc {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-tip {
  color: #909399;
  font-size: 13px;
  text-align: center;
  padding: 12px;
}

.test-result-section {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
}

.test-result-section :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
