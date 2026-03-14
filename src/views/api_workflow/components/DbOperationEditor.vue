<template>
  <div class="db-operation-editor">
    <!-- 数据库连接选择 -->
    <div class="editor-section">
      <div class="section-header">
        <span class="section-label">数据库连接</span>
        <div class="section-actions">
          <el-button
            size="small"
            :loading="testLoading"
            :disabled="!dbOperationId || readonly"
            @click="handleTestConnection"
          >
            <el-icon><Connection /></el-icon>
            测试连接
          </el-button>
        </div>
      </div>
      <el-select
        v-model="dbOperationId"
        placeholder="请选择数据库连接"
        style="width: 100%"
        filterable
        :loading="dbLoading"
        :disabled="readonly"
        @change="handleDbChange"
      >
        <el-option
          v-for="db in dbConnections"
          :key="db.id"
          :label="db.name"
          :value="db.id"
        >
          <div class="db-option">
            <span class="db-name">{{ db.name }}</span>
            <el-tag size="small" type="info">{{ db.dbType || 'MySQL' }}</el-tag>
          </div>
        </el-option>
      </el-select>
    </div>

    <!-- SQL编辑器 -->
    <div class="editor-section">
      <div class="section-header">
        <span class="section-label">SQL脚本</span>
        <div class="section-actions" v-if="!readonly">
          <el-button-group size="small">
            <el-button @click="insertSelectTemplate">SELECT</el-button>
            <el-button @click="insertInsertTemplate">INSERT</el-button>
            <el-button @click="insertUpdateTemplate">UPDATE</el-button>
            <el-button @click="insertDeleteTemplate">DELETE</el-button>
          </el-button-group>
          <el-button size="small" type="danger" @click="clearSql">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
        </div>
      </div>
      <div class="monaco-editor-wrapper">
        <div
          ref="editorContainer"
          class="monaco-editor-container"
          :style="{ height: editorHeight + 'px' }"
        ></div>
      </div>
    </div>

    <!-- 测试执行区域 -->
    <div class="editor-section">
      <div class="section-header">
        <span class="section-label">执行测试</span>
        <div class="section-actions">
          <el-button
            type="primary"
            size="small"
            :loading="executeLoading"
            :disabled="!dbOperationId || !dbOperationScript"
            @click="handleExecuteScript"
          >
            <el-icon><VideoPlay /></el-icon>
            执行脚本
          </el-button>
        </div>
      </div>

      <!-- 执行结果 -->
      <div v-if="executeResult" class="execute-result">
        <div class="result-header">
          <el-tag :type="executeResult.success ? 'success' : 'danger'" size="small">
            {{ executeResult.success ? '执行成功' : '执行失败' }}
          </el-tag>
          <span class="result-time" v-if="executeResult.executeTime">
            耗时: {{ executeResult.executeTime }}ms
          </span>
          <span class="result-count" v-if="executeResult.affectedRows !== undefined">
            影响行数: {{ executeResult.affectedRows }}
          </span>
        </div>

        <!-- 错误信息 -->
        <div v-if="!executeResult.success && executeResult.message" class="result-error">
          <el-alert :title="executeResult.message" type="error" :closable="false" />
        </div>

        <!-- 查询结果表格 -->
        <div v-if="executeResult.success && executeResult.data && executeResult.data.length > 0" class="result-table">
          <el-table
            :data="executeResult.data"
            border
            size="small"
            max-height="300"
            stripe
          >
            <el-table-column
              v-for="col in executeResult.columns"
              :key="col"
              :prop="col"
              :label="col"
              min-width="120"
              show-overflow-tooltip
            />
          </el-table>
          <div class="result-footer">
            共 {{ executeResult.data.length }} 条记录
            <span v-if="executeResult.total && executeResult.total > executeResult.data.length">
              （显示前 {{ executeResult.data.length }} 条，共 {{ executeResult.total }} 条）
            </span>
          </div>
        </div>

        <!-- 无数据 -->
        <div v-else-if="executeResult.success && (!executeResult.data || executeResult.data.length === 0)" class="result-empty">
          <el-empty description="查询无数据" :image-size="60" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, toRaw, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection, Delete, VideoPlay } from '@element-plus/icons-vue'
import { listApi_databases, testApi_databases, executeApi_databases } from '@/api/api_databases/api_databases'
import * as monaco from 'monaco-editor'

const props = defineProps({
  // 数据库连接ID
  modelDbId: {
    type: [Number, String],
    default: null
  },
  // SQL脚本
  modelScript: {
    type: String,
    default: ''
  },
  // 是否只读模式
  readonly: {
    type: Boolean,
    default: false
  },
  // 编辑器高度
  editorHeight: {
    type: Number,
    default: 250
  }
})

const emit = defineEmits(['update:modelDbId', 'update:modelScript', 'change'])

// 响应式数据
const dbOperationId = ref(props.modelDbId)
const dbOperationScript = ref(props.modelScript)
const dbConnections = ref([])
const dbLoading = ref(false)
const testLoading = ref(false)
const executeLoading = ref(false)
const executeResult = ref(null)

// Monaco Editor 相关
const editorContainer = ref(null)
const editorInstance = ref(null)

// 加载数据库连接列表
const loadDbConnections = async () => {
  dbLoading.value = true
  try {
    const response = await listApi_databases({
      pageNum: 1,
      pageSize: 999
    })
    if (response && response.code === 200) {
      dbConnections.value = response.rows || []
    }
  } catch (error) {
    console.error('加载数据库连接列表失败:', error)
  } finally {
    dbLoading.value = false
  }
}

// 数据库选择变化
const handleDbChange = (dbId) => {
  emit('update:modelDbId', dbId)
  emit('change', { dbOperationId: dbId, dbOperationScript: dbOperationScript.value })
}

// 脚本变化
const handleScriptChange = () => {
  emit('update:modelScript', dbOperationScript.value)
  emit('change', { dbOperationId: dbOperationId.value, dbOperationScript: dbOperationScript.value })
}

// 初始化 Monaco Editor
const initMonacoEditor = () => {
  if (!editorContainer.value) return

  // 清理旧实例
  if (editorInstance.value) {
    toRaw(editorInstance.value).dispose()
    editorInstance.value = null
  }

  const instance = monaco.editor.create(editorContainer.value, {
    value: dbOperationScript.value || '',
    language: 'sql',
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
    bracketPairColorization: { enabled: true },
    readOnly: props.readonly
  })

  editorInstance.value = instance

  // 监听内容变化
  instance.onDidChangeModelContent(() => {
    const rawEditor = toRaw(instance)
    dbOperationScript.value = rawEditor.getValue()
    handleScriptChange()
  })
}

// 测试数据库连接
const handleTestConnection = async () => {
  if (!dbOperationId.value) {
    ElMessage.warning('请先选择数据库连接')
    return
  }

  testLoading.value = true
  try {
    const response = await testApi_databases(dbOperationId.value)
    if (response && response.code === 200) {
      ElMessage.success('数据库连接成功')
    } else {
      ElMessage.error(response?.msg || '数据库连接失败')
    }
  } catch (error) {
    console.error('测试数据库连接失败:', error)
    ElMessage.error('测试数据库连接失败: ' + (error.message || '未知错误'))
  } finally {
    testLoading.value = false
  }
}

// 执行SQL脚本
const handleExecuteScript = async () => {
  if (!dbOperationId.value) {
    ElMessage.warning('请先选择数据库连接')
    return
  }
  if (!dbOperationScript.value?.trim()) {
    ElMessage.warning('请输入SQL脚本')
    return
  }

  executeLoading.value = true
  executeResult.value = null

  try {
    const response = await executeApi_databases({
      dbId: dbOperationId.value,
      script: dbOperationScript.value
    })

    if (response && response.code === 200) {
      executeResult.value = {
        success: true,
        data: response.data?.rows || response.rows || [],
        columns: response.data?.columns || response.columns || [],
        affectedRows: response.data?.affectedRows ?? response.affectedRows,
        executeTime: response.data?.executeTime || response.executeTime,
        total: response.data?.total || response.total
      }
      ElMessage.success('SQL执行成功')
    } else {
      executeResult.value = {
        success: false,
        message: response?.msg || 'SQL执行失败'
      }
      ElMessage.error(response?.msg || 'SQL执行失败')
    }
  } catch (error) {
    console.error('执行SQL脚本失败:', error)
    executeResult.value = {
      success: false,
      message: error.message || '执行SQL脚本失败'
    }
    ElMessage.error('执行SQL脚本失败: ' + (error.message || '未知错误'))
  } finally {
    executeLoading.value = false
  }
}

// SQL模板插入
const insertSelectTemplate = () => {
  const template = `SELECT *
FROM table_name
WHERE 1=1
LIMIT 100;`

  dbOperationScript.value = template
  if (editorInstance.value) {
    toRaw(editorInstance.value).setValue(template)
  }
  handleScriptChange()
}

const insertInsertTemplate = () => {
  const template = `INSERT INTO table_name (column1, column2)
VALUES (value1, value2);`

  dbOperationScript.value = template
  if (editorInstance.value) {
    toRaw(editorInstance.value).setValue(template)
  }
  handleScriptChange()
}

const insertUpdateTemplate = () => {
  const template = `UPDATE table_name
SET column1 = value1
WHERE id = 1;`

  dbOperationScript.value = template
  if (editorInstance.value) {
    toRaw(editorInstance.value).setValue(template)
  }
  handleScriptChange()
}

const insertDeleteTemplate = () => {
  const template = `DELETE FROM table_name
WHERE id = 1;`

  dbOperationScript.value = template
  if (editorInstance.value) {
    toRaw(editorInstance.value).setValue(template)
  }
  handleScriptChange()
}

const clearSql = () => {
  dbOperationScript.value = ''
  if (editorInstance.value) {
    toRaw(editorInstance.value).setValue('')
  }
  executeResult.value = null
  handleScriptChange()
}

// 监听props变化
watch(() => props.modelDbId, (val) => {
  dbOperationId.value = val
})

watch(() => props.modelScript, (val) => {
  dbOperationScript.value = val
  // 同步到 Monaco Editor
  if (editorInstance.value && val !== toRaw(editorInstance.value).getValue()) {
    toRaw(editorInstance.value).setValue(val || '')
  }
})

// 监听 readonly 变化
watch(() => props.readonly, (val) => {
  if (editorInstance.value) {
    toRaw(editorInstance.value).updateOptions({ readOnly: val })
  }
})

// 获取当前选中的数据库名称
const getSelectedDbName = () => {
  const db = dbConnections.value.find(d => d.id === dbOperationId.value)
  return db?.name || ''
}

// 暴露方法
defineExpose({
  getSelectedDbName,
  loadDbConnections
})

onMounted(() => {
  loadDbConnections()

  // 延迟初始化 Monaco Editor，避免卡死
  nextTick(() => {
    setTimeout(() => {
      initMonacoEditor()
    }, 100)
  })
})

onBeforeUnmount(() => {
  // 清理 Monaco Editor 实例
  if (editorInstance.value) {
    toRaw(editorInstance.value).dispose()
    editorInstance.value = null
  }
})
</script>

<style scoped>
.db-operation-editor {
  width: 100%;
}

.editor-section {
  margin-bottom: 16px;
}

.editor-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.db-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.db-name {
  font-weight: 500;
}

.monaco-editor-wrapper {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.monaco-editor-container {
  min-height: 200px;
}

/* SQL 语法高亮在 Monaco 内置主题中已包含 */

/* 执行结果样式 */
.execute-result {
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

.result-time,
.result-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.result-error {
  margin-bottom: 12px;
}

.result-table {
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.result-footer {
  padding: 8px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-extra-light);
  border-top: 1px solid var(--el-border-color-lighter);
}

.result-empty {
  padding: 20px;
  text-align: center;
}
</style>
