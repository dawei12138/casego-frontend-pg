<template>
  <el-dialog
    v-model="visible"
    title="选择公共脚本"
    width="600px"
    :close-on-click-modal="false"
    class="public-script-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="节点名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入节点名称" />
        </el-form-item>
        <el-form-item label="公共脚本" prop="publicScript">
          <el-select
            v-model="formData.publicScript"
            placeholder="请选择公共脚本"
            style="width: 100%"
            filterable
            :loading="scriptsLoading"
            @change="handleScriptChange"
          >
            <el-option
              v-for="script in publicScripts"
              :key="script.scriptId"
              :label="script.scriptName"
              :value="script.scriptId"
            >
              <div class="script-option">
                <span class="script-name">{{ script.scriptName }}</span>
                <span class="script-desc">{{ script.description }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectedScript" label="脚本预览">
          <div class="script-preview">
            <pre>{{ selectedScript.scriptContent || '暂无脚本内容' }}</pre>
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
import { ref, computed, watch, onMounted } from 'vue'
import request from '@/utils/request'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref()
const loading = ref(false)
const scriptsLoading = ref(false)
const publicScripts = ref([])
const selectedScript = ref(null)
const formData = ref({
  name: '公共脚本',
  publicScript: null
})

const rules = {
  name: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  publicScript: [{ required: true, message: '请选择公共脚本', trigger: 'change' }]
}

const loadPublicScripts = async () => {
  scriptsLoading.value = true
  try {
    const response = await request({
      url: '/api_script_library/script_library/list',
      method: 'get',
      params: { pageNum: 1, pageSize: 9999 }
    })
    if (response && response.code === 200) {
      publicScripts.value = response.rows || []
    }
  } catch (error) {
    console.error('加载公共脚本列表失败:', error)
  } finally {
    scriptsLoading.value = false
  }
}

const handleScriptChange = (scriptId) => {
  selectedScript.value = publicScripts.value.find(s => s.scriptId === scriptId) || null
  if (selectedScript.value) {
    formData.value.name = selectedScript.value.scriptName
  }
}

const handleSubmit = async () => {
  // 防止重复提交
  if (loading.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    emit('confirm', {
      name: formData.value.name,
      publicScript: String(formData.value.publicScript)
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
    name: '公共脚本',
    publicScript: null
  }
  selectedScript.value = null
}

watch(() => props.modelValue, (val) => {
  if (val) {
    loadPublicScripts()
    formData.value = {
      name: '公共脚本',
      publicScript: null
    }
    selectedScript.value = null
  }
})
</script>

<style scoped>
.dialog-content {
  padding: 16px 0;
}

.script-option {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.script-name {
  font-weight: 500;
}

.script-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.script-preview {
  width: 100%;
  max-height: 200px;
  overflow: auto;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  padding: 12px;
}

.script-preview pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
