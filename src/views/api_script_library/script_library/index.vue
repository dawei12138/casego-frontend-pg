<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="脚本名称" prop="scriptName">
        <el-input
          v-model="queryParams.scriptName"
          placeholder="请输入脚本名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="脚本类型" prop="scriptType">
        <el-select v-model="queryParams.scriptType" placeholder="请选择脚本类型" clearable style="width: 240px">
          <el-option
            v-for="item in scriptTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 240px">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['api_script_library:script_library:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['api_script_library:script_library:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['api_script_library:script_library:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['api_script_library:script_library:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="script_libraryList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="脚本ID" align="center" prop="scriptId" width="80" />
      <el-table-column label="脚本名称" align="center" prop="scriptName" min-width="150" show-overflow-tooltip />
      <el-table-column label="脚本类型" align="center" prop="scriptType" width="120">
        <template #default="scope">
          <el-tag :type="getScriptTypeTagType(scope.row.scriptType)">
            {{ getScriptTypeLabel(scope.row.scriptType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="1"
            :inactive-value="0"
            @change="handleChangeStatus(scope.row)"
            v-hasPermi="['api_script_library:script_library:edit']"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['api_script_library:script_library:edit']">修改</el-button>
          <el-button link type="success" icon="VideoPlay" @click="handleDebug(scope.row)" v-hasPermi="['api_script_library:script_library:edit']">调试</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['api_script_library:script_library:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改公共脚本库对话框 -->
    <el-dialog :title="title" v-model="open" width="900px" append-to-body destroy-on-close @opened="handleDialogOpened" @closed="handleDialogClosed">
      <el-form ref="script_libraryRef" :model="form" :rules="rules" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="脚本名称" prop="scriptName">
              <el-input v-model="form.scriptName" placeholder="请输入脚本名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="脚本类型" prop="scriptType">
              <el-select v-model="form.scriptType" placeholder="请选择脚本类型" style="width: 100%" @change="handleScriptTypeChange">
                <el-option
                  v-for="item in scriptTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-switch
                v-model="form.status"
                :active-value="1"
                :inactive-value="0"
                active-text="正常"
                inactive-text="停用"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="脚本内容" prop="scriptContent">
          <div class="script-editor-wrapper">
            <div class="editor-toolbar">
              <div class="toolbar-left">
                <el-button size="small" @click="clearScriptContent">
                  <el-icon><Delete /></el-icon>
                  清空
                </el-button>
              </div>
              <div class="toolbar-right">
                <el-button size="small" :icon="isFullscreen ? Close : FullScreen" @click="toggleFullscreen">
                  {{ isFullscreen ? '退出全屏' : '全屏' }}
                </el-button>
                <el-button size="small" type="primary" :loading="debugLoading" @click="handleDebugScript">
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
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Script_library">
import { ref, reactive, computed, toRefs, nextTick, toRaw } from 'vue'
import { listScript_library, getScript_library, delScript_library, addScript_library, updateScript_library, debugScript_library, debugScriptById } from "@/api/api_script_library/script_library"
import { Delete, VideoPlay, FullScreen, Close } from '@element-plus/icons-vue'
import * as monaco from 'monaco-editor'

const { proxy } = getCurrentInstance()

// 脚本类型选项
const scriptTypeOptions = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' }
]

// 状态选项
const statusOptions = [
  { value: 1, label: '正常' },
  { value: 0, label: '停用' }
]

const script_libraryList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const debugLoading = ref(false)
const debugResult = ref(null)
const editorInstance = ref(null)
const editorContainer = ref(null)
const isFullscreen = ref(false)
const autoDebug = ref(false)  // 标记是否需要自动调试

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    scriptName: null,
    scriptType: null,
    status: null,
  },
  rules: {
    scriptName: [
      { required: true, message: '脚本名称不能为空', trigger: 'blur' }
    ],
    scriptType: [
      { required: true, message: '请选择脚本类型', trigger: 'change' }
    ],
    scriptContent: [
      { required: true, message: '脚本内容不能为空', trigger: 'blur' }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)

// Monaco Editor 语言映射
const getMonacoLanguage = () => {
  return form.value.scriptType === 'python' ? 'python' : 'javascript'
}

// 获取脚本类型标签类型
function getScriptTypeTagType(type) {
  const typeMap = {
    'python': 'success',
    'javascript': 'warning'
  }
  return typeMap[type] || 'info'
}

// 获取脚本类型标签文字
function getScriptTypeLabel(type) {
  const typeMap = {
    'python': 'Python',
    'javascript': 'JavaScript'
  }
  return typeMap[type] || type
}

// 获取脚本占位符
function getScriptPlaceholder() {
  if (form.value.scriptType === 'python') {
    return '# 请输入Python脚本\n# 示例:\ndef main():\n    print("Hello World")\n    return {"status": "success"}'
  }
  return '// 请输入JavaScript脚本\n// 示例:\nfunction main() {\n    console.log("Hello World");\n    return { status: "success" };\n}'
}

// 格式化返回值
function formatReturnValue(value) {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

/** 查询公共脚本库列表 */
function getList() {
  loading.value = true
  listScript_library(queryParams.value).then(response => {
    script_libraryList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 取消按钮 */
function cancel() {
  open.value = false
  // reset() 在 @closed 事件中调用，避免组件销毁时的竞态条件
}

/** 对话框关闭后重置表单 */
function handleDialogClosed() {
  reset()
}

/** 表单重置 */
function reset() {
  form.value = {
    scriptId: null,
    scriptName: null,
    scriptType: 'python',
    scriptContent: null,
    status: 1,
  }
  debugResult.value = null
  isFullscreen.value = false
  autoDebug.value = false

  // 清理Monaco Editor实例
  if (editorInstance.value) {
    toRaw(editorInstance.value).dispose()
    editorInstance.value = null
  }
  editorContainer.value = null

  proxy.resetForm("script_libraryRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 多选框选中数据  */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.scriptId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加脚本"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _scriptId = row.scriptId || ids.value
  getScript_library(_scriptId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改脚本"
  })
}

/** 调试按钮操作 - 先保存再执行调试 */
function handleDebug(row) {
  reset()
  autoDebug.value = true  // 设置自动调试标记
  getScript_library(row.scriptId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "调试脚本"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["script_libraryRef"].validate(valid => {
    if (valid) {
      if (form.value.scriptId != null) {
        updateScript_library(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addScript_library(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _scriptIds = row.scriptId || ids.value
  proxy.$modal.confirm('是否确认删除公共脚本库编号为"' + _scriptIds + '"的数据项？').then(function() {
    return delScript_library(_scriptIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('api_script_library/script_library/export', {
    ...queryParams.value
  }, `script_library_${new Date().getTime()}.xlsx`)
}

/** 修改状态操作 */
function handleChangeStatus(row) {
  const statusText = row.status === 1 ? '启用' : '停用'
  updateScript_library({ scriptId: row.scriptId, status: row.status }).then(() => {
    proxy.$modal.msgSuccess(`${statusText}成功`)
  }).catch(() => {
    // 失败时恢复原状态
    row.status = row.status === 1 ? 0 : 1
  })
}

/** 脚本类型变化 */
function handleScriptTypeChange() {
  // 清空脚本内容让用户重新编写
  // form.value.scriptContent = ''

  // 更新Monaco Editor的语言模式
  if (editorInstance.value) {
    const model = toRaw(editorInstance.value).getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, getMonacoLanguage())
    }
  }
}

/** 清空脚本内容 */
function clearScriptContent() {
  form.value.scriptContent = ''
  if (editorInstance.value) {
    toRaw(editorInstance.value).setValue('')
  }
}

/** 初始化Monaco Editor */
function initMonacoEditor() {
  if (!editorContainer.value || editorInstance.value) return

  const instance = monaco.editor.create(editorContainer.value, {
    value: form.value.scriptContent || '',
    language: getMonacoLanguage(),
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
    form.value.scriptContent = rawEditor.getValue()
  })
}

/** 切换全屏 */
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  nextTick(() => {
    if (editorInstance.value) {
      setTimeout(() => {
        toRaw(editorInstance.value).layout()
      }, 50)
    }
  })
}

/** 对话框打开后初始化编辑器 */
function handleDialogOpened() {
  nextTick(() => {
    setTimeout(() => {
      initMonacoEditor()

      // 如果是自动调试模式，先保存再执行调试
      if (autoDebug.value) {
        autoDebug.value = false
        executeDebugWithSave()
      }
    }, 50)
  })
}

/** 先保存再执行调试 */
async function executeDebugWithSave() {
  // 先保存脚本
  try {
    await proxy.$refs["script_libraryRef"].validate()
    if (form.value.scriptId) {
      await updateScript_library(form.value)
      proxy.$modal.msgSuccess("保存成功，开始调试...")
      // 保存成功后执行调试
      executeDebugById(form.value.scriptId)
    }
  } catch (error) {
    proxy.$modal.msgWarning("请先完善脚本信息")
  }
}

/** 根据脚本ID执行调试 */
function executeDebugById(scriptId) {
  debugLoading.value = true
  debugResult.value = null

  debugScriptById(scriptId).then(response => {
    debugResult.value = {
      success: response.data?.success ?? false,
      logs: response.data?.logs || '',
      error: response.data?.error || '',
      result: response.data?.result
    }
  }).catch(error => {
    debugResult.value = {
      success: false,
      error: error.message || '执行脚本失败',
      logs: ''
    }
  }).finally(() => {
    debugLoading.value = false
  })
}

/** 调试脚本 */
function handleDebugScript() {
  if (!form.value.scriptContent) {
    proxy.$modal.msgWarning('请先输入脚本内容')
    return
  }
  if (!form.value.scriptType) {
    proxy.$modal.msgWarning('请先选择脚本类型')
    return
  }

  debugLoading.value = true
  debugResult.value = null

  debugScript_library({
    scriptType: form.value.scriptType,
    scriptContent: form.value.scriptContent
  }).then(response => {
    debugResult.value = {
      success: response.data?.success ?? false,
      logs: response.data?.logs || '',
      error: response.data?.error || '',
      result: response.data?.result
    }
  }).catch(error => {
    debugResult.value = {
      success: false,
      error: error.message || '执行脚本失败',
      logs: ''
    }
  }).finally(() => {
    debugLoading.value = false
  })
}

getList()
</script>

<style scoped>
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
  gap: 12px;
  margin-bottom: 12px;
}

.result-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
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
  max-height: 200px;
  overflow: auto;
}

.result-error {
  margin-top: 8px;
}
</style>
