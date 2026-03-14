<template>
  <el-dialog
    v-model="visible"
    title="设置等待时间"
    width="400px"
    :close-on-click-modal="false"
    class="wait-time-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="节点名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入节点名称" />
        </el-form-item>
        <el-form-item label="等待时间" prop="waitTime">
          <el-input-number
            v-model="formData.waitTime"
            :min="0"
            :max="600000"
            :step="1000"
            placeholder="毫秒"
            style="width: 100%"
          />
          <div class="time-hint">
            <span v-if="formData.waitTime">约 {{ formatTime(formData.waitTime) }}</span>
          </div>
        </el-form-item>
        <el-form-item label="快捷设置">
          <div class="quick-options">
            <el-button size="small" @click="setQuickTime(1000)">1秒</el-button>
            <el-button size="small" @click="setQuickTime(3000)">3秒</el-button>
            <el-button size="small" @click="setQuickTime(5000)">5秒</el-button>
            <el-button size="small" @click="setQuickTime(10000)">10秒</el-button>
            <el-button size="small" @click="setQuickTime(30000)">30秒</el-button>
            <el-button size="small" @click="setQuickTime(60000)">1分钟</el-button>
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
import { ref, computed, watch } from 'vue'

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
const formData = ref({
  name: '等待',
  waitTime: 3000
})

const rules = {
  name: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  waitTime: [{ required: true, message: '请设置等待时间', trigger: 'change' }]
}

const formatTime = (ms) => {
  if (ms < 1000) return `${ms}毫秒`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}秒`
  return `${(ms / 60000).toFixed(1)}分钟`
}

const setQuickTime = (time) => {
  formData.value.waitTime = time
  formData.value.name = `等待${formatTime(time)}`
}

const handleSubmit = async () => {
  // 防止重复提交
  if (loading.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    emit('confirm', {
      name: formData.value.name,
      waitTime: formData.value.waitTime
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
    name: '等待',
    waitTime: 3000
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    formData.value = {
      name: '等待',
      waitTime: 3000
    }
  }
})
</script>

<style scoped>
.dialog-content {
  padding: 16px 0;
}

.time-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.quick-options {
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
