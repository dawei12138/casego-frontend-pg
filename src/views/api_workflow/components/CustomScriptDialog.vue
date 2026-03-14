<template>
  <el-dialog
    v-model="visible"
    title="自定义脚本"
    width="700px"
    :close-on-click-modal="false"
    class="custom-script-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="节点名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入节点名称" />
        </el-form-item>
        <el-form-item label="脚本内容" prop="customScript">
          <div class="script-editor-wrapper">
            <div class="editor-toolbar">
              <div class="toolbar-left">
                <el-button size="small" @click="insertTemplate">
                  <el-icon><DocumentCopy /></el-icon>
                  插入模板
                </el-button>
                <el-button size="small" @click="clearScript">
                  <el-icon><Delete /></el-icon>
                  清空
                </el-button>
              </div>
              <div class="toolbar-right">
                <el-button size="small" :icon="isFullscreen ? Close : FullScreen" @click="toggleFullscreen">
                  {{ isFullscreen ? '退出全屏' : '全屏' }}
                </el-button>
                <el-button
                  size="small"
                  type="primary"
                  :loading="debugLoading"
                  @click="handleDebugScript"
                >
                  <el-icon><VideoPlay /></el-icon>
                  调试执行
                </el-button>
              </div>
            </div>
            <div class="monaco-editor-wrapper" :class="{ 'is-fullscreen': isFullscreen }">
              <div v-if="isFullscreen" class="monaco-fullscreen-toolbar">
                <el-button size="small" :icon="Close" @click="toggleFullscreen">
                  退出全屏
                </el-button>
              </div>
              <div
                ref="editorContainer"
                class="monaco-editor-container"
              ></div>
            </div>
          </div>
        </el-form-item>

        <!-- 调试结果展示 -->
        <el-form-item v-if="debugResult" label="执行结果">
          <div class="debug-result">
            <div class="result-header">
              <el-tag :type="debugResult.success ? 'success' : 'danger'" size="small">
                {{ debugResult.success ? '执行成功' : '执行失败' }}
              </el-tag>
              <el-button size="small" text type="info" @click="debugResult = null">
                <el-icon><Close /></el-icon>
                关闭
              </el-button>
            </div>
            <div class="result-content">
              <div v-if="debugResult.logs" class="result-output">
                <div class="output-label">执行日志:</div>
                <pre class="output-text">{{ debugResult.logs }}</pre>
              </div>
              <div v-if="debugResult.error" class="result-error">
                <div class="output-label">错误信息:</div>
                <el-alert :title="debugResult.error" type="error" :closable="false" show-icon />
              </div>
              <div v-if="debugResult.result !== null && debugResult.result !== undefined" class="result-return">
                <div class="output-label">返回值:</div>
                <pre class="output-text">{{ formatReturnValue(debugResult.result) }}</pre>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, toRaw, onBeforeUnmount } from 'vue'
import { VideoPlay, Close, FullScreen, DocumentCopy, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as monaco from 'monaco-editor'
import request from '@/utils/request'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  envId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref()
const loading = ref(false)
const formData = ref({
  name: '自定义脚本',
  customScript: ''
})

// Monaco Editor 相关状态
const editorContainer = ref(null)
const editorInstance = ref(null)
const isFullscreen = ref(false)
const debugLoading = ref(false)
const debugResult = ref(null)

const rules = {
  name: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  customScript: [{ required: true, message: '请输入脚本内容', trigger: 'blur' }]
}

// 初始化Monaco Editor
const initMonacoEditor = () => {
  if (!editorContainer.value) return

  // 清理旧实例
  if (editorInstance.value) {
    toRaw(editorInstance.value).dispose()
    editorInstance.value = null
  }

  const instance = monaco.editor.create(editorContainer.value, {
    value: formData.value.customScript || '',
    language: 'python',  // 固定使用Python
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

  editorInstance.value = instance

  // 监听内容变化
  instance.onDidChangeModelContent(() => {
    const rawEditor = toRaw(instance)
    formData.value.customScript = rawEditor.getValue()
  })
}

// 插入模板
const insertTemplate = () => {
  const pythonTemplate = `# 自定义Python脚本
# 可用变量: context (上下文)、variables (环境变量)

def execute(context, variables):
    """
    执行自定义逻辑
    :param context: 执行上下文
    :param variables: 环境变量
    :return: 执行结果
    """
    # 在这里编写你的逻辑
    result = "Hello, CaseGo!"

    return {
        "status": "success",
        "data": result
    }
`

  if (editorInstance.value) {
    toRaw(editorInstance.value).setValue(pythonTemplate)
  } else {
    formData.value.customScript = pythonTemplate
  }
}

const clearScript = () => {
  formData.value.customScript = ''
  if (editorInstance.value) {
    toRaw(editorInstance.value).setValue('')
  }
}

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  nextTick(() => {
    if (editorInstance.value) {
      setTimeout(() => {
        toRaw(editorInstance.value).layout()
      }, 50)
    }
  })
}

// 调试脚本
const handleDebugScript = async () => {
  if (!formData.value.customScript) {
    ElMessage.warning('请先输入脚本内容')
    return
  }

  if (!props.envId) {
    ElMessage.warning('请先选择环境')
    return
  }

  debugLoading.value = true
  debugResult.value = null

  try {
    const response = await request({
      url: '/api_script_library/script_library/debug',
      method: 'post',
      data: {
        scriptType: 'python',  // 固定使用Python
        scriptContent: formData.value.customScript,
        envId: props.envId
      }
    })

    debugResult.value = {
      success: response.data?.success ?? false,
      logs: response.data?.logs || '',
      error: response.data?.error || '',
      result: response.data?.result
    }
  } catch (error) {
    debugResult.value = {
      success: false,
      error: error.message || '执行脚本失败',
      logs: ''
    }
  } finally {
    debugLoading.value = false
  }
}

// 格式化返回值
const formatReturnValue = (value) => {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

const handleSubmit = async () => {
  // 防止重复提交
  if (loading.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    emit('confirm', {
      name: formData.value.name,
      customScript: formData.value.customScript
    })

    // 不在这里关闭对话框，由父组件在处理完成后关闭
  } catch (error) {
    console.error('表单验证失败:', error)
    loading.value = false
  }
}

const handleClose = () => {
  visible.value = false

  // 清理 Monaco Editor 实例
  if (editorInstance.value) {
    toRaw(editorInstance.value).dispose()
    editorInstance.value = null
  }

  // 重置表单数据
  formData.value = {
    name: '自定义脚本',
    customScript: ''
  }

  // 重置状态
  isFullscreen.value = false
  debugResult.value = null
}

watch(() => props.modelValue, (val) => {
  if (val) {
    // 对话框打开时初始化数据
    formData.value = {
      name: '自定义脚本',
      customScript: ''
    }

    debugResult.value = null

    // 延迟初始化 Monaco Editor
    nextTick(() => {
      setTimeout(() => {
        initMonacoEditor()
      }, 100)
    })
  }
})

// 组件卸载时清理
onBeforeUnmount(() => {
  if (editorInstance.value) {
    toRaw(editorInstance.value).dispose()
    editorInstance.value = null
  }
})
</script>

<style scoped>
.dialog-content {
  padding: 16px 0;
}

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
  min-height: 40px;
  background-color: #252526;
  border-radius: 4px;
  margin-bottom: 8px;
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
  height: 300px;
  min-height: 300px;
}

/* 调试结果样式 */
.debug-result {
  width: 100%;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
