<template>
  <el-dialog
    v-model="visible"
    title="从cURL导入"
    width="700px"
    :close-on-click-modal="false"
    class="curl-import-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="节点名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入节点名称" />
        </el-form-item>
        <el-form-item label="cURL命令" prop="curlCommand">
          <div class="curl-editor-container">
            <div class="curl-toolbar">
              <el-button size="small" @click="pasteFromClipboard">
                <el-icon><DocumentCopy /></el-icon>
                粘贴
              </el-button>
              <el-button size="small" @click="clearCurl">清空</el-button>
              <el-button size="small" @click="insertExample">示例</el-button>
            </div>
            <el-input
              v-model="formData.curlCommand"
              type="textarea"
              :rows="10"
              placeholder="请粘贴cURL命令，例如：
curl 'https://api.example.com/users' \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{&quot;name&quot;:&quot;test&quot;}'"
              class="curl-textarea"
            />
          </div>
        </el-form-item>
        <el-form-item>
          <el-alert type="info" :closable="false" show-icon>
            <template #default>
              支持从浏览器开发者工具中复制的cURL命令，系统将自动解析URL、请求方法、Headers和Body等信息
            </template>
          </el-alert>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          导入
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentCopy } from '@element-plus/icons-vue'
import { useProjectStore } from '@/store/modules/project'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const projectStore = useProjectStore()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref()
const loading = ref(false)
const formData = ref({
  name: 'cURL导入',
  curlCommand: ''
})

const rules = {
  name: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  curlCommand: [
    { required: true, message: '请输入cURL命令', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value && !value.toLowerCase().includes('curl')) {
          callback(new Error('请输入有效的cURL命令'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      formData.value.curlCommand = text
      ElMessage.success('已从剪贴板粘贴')
    }
  } catch (error) {
    ElMessage.warning('无法访问剪贴板，请手动粘贴')
  }
}

const clearCurl = () => {
  formData.value.curlCommand = ''
}

const insertExample = () => {
  formData.value.curlCommand = `curl 'https://api.example.com/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -X POST \\
  -d '{"name":"test","email":"test@example.com"}'`
}

const handleSubmit = async () => {
  // 防止重复提交
  if (loading.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    emit('confirm', {
      name: formData.value.name,
      projectId: projectStore.projectId,
      curlCommand: formData.value.curlCommand
    })

    // 不在这里关闭对话框，由父组件在处理完成后关闭
  } catch (error) {
    console.error('表单验证失败:', error)
    loading.value = false
  }
}

const handleClose = () => {
  visible.value = false
  formData.value = {
    name: 'cURL导入',
    curlCommand: ''
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    formData.value = {
      name: 'cURL导入',
      curlCommand: ''
    }
  }
})
</script>

<style scoped>
.dialog-content {
  padding: 16px 0;
}

.curl-editor-container {
  width: 100%;
}

.curl-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.curl-textarea :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
