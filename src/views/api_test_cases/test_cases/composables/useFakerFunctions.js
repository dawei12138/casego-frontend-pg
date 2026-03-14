import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getFakerFunctions, testFakerFunction } from '@/api/api_faker_config/faker_config'

/**
 * Faker 函数管理 composable
 * 提供 Faker 函数列表、测试功能等
 */
export function useFakerFunctions() {
  const functionList = ref([])
  const loading = ref(false)
  const testLoading = ref(false)
  const testResult = ref('')
  const testDialogVisible = ref(false)
  const testForm = ref({
    functionName: '',
    doc: '',
    params: [],
    argsStr: ''
  })

  // 自定义函数
  const customFunctions = computed(() => {
    return functionList.value.filter(f => f.source === 'custom')
  })

  // 内置函数
  const builtinFunctions = computed(() => {
    return functionList.value.filter(f => f.source === 'builtin')
  })

  // 加载函数列表
  const loadFunctions = async () => {
    if (loading.value) return
    loading.value = true
    try {
      const res = await getFakerFunctions()
      if (res.code === 200 && res.data) {
        functionList.value = res.data
      }
    } catch (error) {
      console.error('Failed to load faker functions:', error)
    } finally {
      loading.value = false
    }
  }

  // 格式化参数显示
  const formatParams = (params) => {
    if (!params || params.length === 0) return ''
    return params.join(', ')
  }

  // 生成函数调用代码
  const generateFunctionCall = (func) => {
    const params = func.params && func.params.length > 0
      ? func.params.join(', ')
      : ''
    return `$F{${func.name}(${params})}`
  }

  // 打开测试对话框
  const openTestDialog = (func) => {
    testForm.value = {
      functionName: func.name,
      doc: func.doc || '',
      params: func.params || [],
      argsStr: ''
    }
    testDialogVisible.value = true
  }

  // 测试函数
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

  return {
    functionList,
    customFunctions,
    builtinFunctions,
    loading,
    testLoading,
    testResult,
    testDialogVisible,
    testForm,
    loadFunctions,
    formatParams,
    generateFunctionCall,
    openTestDialog,
    handleTestFunction
  }
}
