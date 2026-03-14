<template>
  <el-dialog
    v-model="dialogVisible"
    title="导入 cURL 命令"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="curl-import-container">
      <!-- 说明信息 -->
      <el-alert
        type="info"
        :closable="false"
        class="info-alert"
      >
        <template #title>
          <span>支持从浏览器开发者工具复制的 cURL 命令（Bash/CMD 格式均可）</span>
        </template>
      </el-alert>

      <!-- cURL 命令输入 -->
      <div class="curl-input-section">
        <div class="section-label">cURL 命令</div>
        <el-input
          v-model="curlCommand"
          type="textarea"
          :rows="12"
          placeholder="粘贴 cURL 命令，例如：
curl 'https://api.example.com/users' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{&quot;name&quot;: &quot;test&quot;}'

提示：在浏览器开发者工具 Network 面板中，右键请求 → Copy as cURL"
          class="curl-textarea"
        />
      </div>

      <!-- 支持的选项说明 -->
      <el-collapse class="options-collapse">
        <el-collapse-item title="支持的 cURL 选项" name="options">
          <div class="options-list">
            <el-tag size="small" type="info">-X, --request</el-tag>
            <el-tag size="small" type="info">-H, --header</el-tag>
            <el-tag size="small" type="info">-d, --data</el-tag>
            <el-tag size="small" type="info">--data-raw</el-tag>
            <el-tag size="small" type="info">--data-binary</el-tag>
            <el-tag size="small" type="info">--data-urlencode</el-tag>
            <el-tag size="small" type="info">-F, --form</el-tag>
            <el-tag size="small" type="info">-b, --cookie</el-tag>
            <el-tag size="small" type="info">-A, --user-agent</el-tag>
            <el-tag size="small" type="info">-e, --referer</el-tag>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!curlCommand.trim()"
          @click="handleImport"
        >
          导入
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { importCurlCommand } from '@/api/api_test_cases/test_cases'
import { getTest_cases } from '@/api/api_test_cases/test_cases'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'import-success'])

// 对话框可见性
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 加载状态
const loading = ref(false)

// cURL 命令
const curlCommand = ref('')

// 导入
const handleImport = async () => {
  if (loading.value) return

  const command = curlCommand.value.trim()
  if (!command) {
    ElMessage.warning('请输入 cURL 命令')
    return
  }

  // 简单验证是否包含 curl
  if (!command.toLowerCase().startsWith('curl')) {
    ElMessage.warning('请输入有效的 cURL 命令')
    return
  }

  loading.value = true

  try {
    const response = await importCurlCommand({
      curlCommand: command
    })

    if (response && response.code === 200) {
      const caseId = response.data?.caseId
      ElMessage.success(response.msg || '导入成功')

      // 触发导入成功事件，传递新创建的用例 ID
      emit('import-success', { caseId })
      handleClose()
    } else {
      throw new Error(response?.msg || '导入失败')
    }
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error(`导入失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  curlCommand.value = ''
}

// 监听对话框关闭
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})
</script>

<style scoped>
.curl-import-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-alert {
  margin-bottom: 0;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.curl-textarea :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.options-collapse {
  border: none;
}

.options-collapse :deep(.el-collapse-item__header) {
  font-size: 13px;
  color: #909399;
  height: 36px;
  line-height: 36px;
}

.options-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}

.options-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 8px;
}

.options-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
