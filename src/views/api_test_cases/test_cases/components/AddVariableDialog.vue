<template>
  <el-dialog
    v-model="dialogVisible"
    title="添加提取变量"
    width="600px"
    :close-on-click-modal="false"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      label-position="right"
    >
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入提取变量的名称"
          clearable
        />
      </el-form-item>

      <el-form-item label="变量名" prop="variableName">
        <el-input
          v-model="formData.variableName"
          placeholder="请输入要保存的变量名"
          clearable
        />
      </el-form-item>

      <el-form-item label="JSONPath" prop="jsonpath">
        <el-input
          v-model="formData.jsonpath"
          placeholder="请输入 JSONPath 表达式"
          clearable
        >
          <template #append>
            <el-button @click="testJsonPath" :disabled="!formData.jsonpath">
              测试
            </el-button>
          </template>
        </el-input>
      </el-form-item>

      <!-- JSONPath 测试结果 -->
      <el-form-item v-if="testResult !== null" label="测试结果">
        <el-alert
          :type="testResultSuccess ? 'success' : 'error'"
          :closable="false"
          show-icon
        >
          <template #title>
            <span v-if="testResultSuccess">提取成功</span>
            <span v-else>提取失败</span>
          </template>
          <div v-if="testResultSuccess" class="test-result-content">
            <pre>{{ formatTestResult(testResult) }}</pre>
          </div>
          <div v-else>
            {{ testResult }}
          </div>
        </el-alert>
      </el-form-item>

      <el-form-item label="额外提取索引">
        <el-switch
          v-model="extractIndexEnabled"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>

      <el-form-item
        v-if="extractIndexEnabled"
        label="索引值"
        prop="extractIndex"
      >
        <el-input-number
          v-model="formData.extractIndex"
          :min="0"
          :max="9999"
          placeholder="请输入索引值"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { JSONPath } from 'jsonpath-plus'
import { addTeardown } from '@/api/api_teardown/teardown'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  caseId: {
    type: [String, Number],
    required: true
  },
  jsonpath: {
    type: String,
    default: ''
  },
  responseData: {
    type: Object,
    default: () => null
  }
})

// Emits
const emit = defineEmits(['update:visible', 'success'])

// 响应式数据
const formRef = ref(null)
const submitLoading = ref(false)
const extractIndexEnabled = ref(false)
const testResult = ref(null)
const testResultSuccess = ref(false)

// 表单数据
const formData = reactive({
  name: '',
  variableName: '',
  jsonpath: props.jsonpath || '',
  extractIndex: 0,
  caseId: props.caseId,
  teardownType: 'EXTRACT_VARIABLE',
  extractVariableMethod: 'response_json'
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' }
  ],
  variableName: [
    { required: true, message: '请输入变量名', trigger: 'blur' }
  ],
  jsonpath: [
    { required: true, message: '请输入 JSONPath 表达式', trigger: 'blur' }
  ]
}

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 测试 JSONPath
const testJsonPath = () => {
  if (!formData.jsonpath) {
    ElMessage.warning('请输入 JSONPath 表达式')
    return
  }

  if (!props.responseData) {
    ElMessage.error('没有可用的响应数据')
    return
  }

  try {
    const result = JSONPath({ path: formData.jsonpath, json: props.responseData })
    testResult.value = result
    testResultSuccess.value = true

    if (result.length === 0) {
      ElMessage.info('未找到匹配的结果')
    } else {
      ElMessage.success('JSONPath 测试成功')
    }
  } catch (error) {
    testResult.value = error.message
    testResultSuccess.value = false
    ElMessage.error(`JSONPath 测试失败: ${error.message}`)
  }
}

// 格式化测试结果
const formatTestResult = (result) => {
  if (typeof result === 'object') {
    return JSON.stringify(result, null, 2)
  }
  return String(result)
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    submitLoading.value = true

    // 构建请求数据
    const requestData = {
      name: formData.name,
      caseId: props.caseId,
      jsonpath: formData.jsonpath,
      extractIndex: extractIndexEnabled.value ? formData.extractIndex : 0,
      teardownType: 'EXTRACT_VARIABLE',
      variableName: formData.variableName,
      extractIndexIsRun: extractIndexEnabled.value ? 1 : 0,
      extractVariableMethod: 'response_json'
    }

    console.log('Submitting add variable request:', requestData)

    const response = await addTeardown(requestData)

    if (response.code === 200) {
      ElMessage.success('添加提取变量成功')
      emit('success', response.data)
      handleClose()
    } else {
      throw new Error(response.msg || '添加失败')
    }
  } catch (error) {
    if (error.message) {
      console.error('Add variable error:', error)
      ElMessage.error(`添加失败: ${error.message}`)
    }
  } finally {
    submitLoading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  formRef.value?.resetFields()
  testResult.value = null
  testResultSuccess.value = false
  extractIndexEnabled.value = false
  emit('update:visible', false)
}

// 监听 jsonpath prop 变化
watch(() => props.jsonpath, (newVal) => {
  if (newVal) {
    formData.jsonpath = newVal
    // 清空之前的测试结果
    testResult.value = null
    testResultSuccess.value = false
  }
}, { immediate: true })

// 监听 caseId prop 变化
watch(() => props.caseId, (newVal) => {
  if (newVal) {
    formData.caseId = newVal
  }
}, { immediate: true })
</script>

<style scoped>
.test-result-content {
  margin-top: 8px;
}

.test-result-content pre {
  margin: 0;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
}
</style>
