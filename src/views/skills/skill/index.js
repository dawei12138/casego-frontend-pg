import { ref, reactive, toRefs, computed, getCurrentInstance } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listSkill,
  getSkill,
  addSkill,
  updateSkill,
  delSkill,
  uploadSkill,
  importUrlSkill
} from '@/api/skills/skill'

export function useSkillManagement() {
  const { proxy } = getCurrentInstance()

  // State
  const skillList = ref([])
  const loading = ref(false)
  const submitLoading = ref(false)
  const total = ref(0)
  const searchKeyword = ref('')

  // Dialog state
  const open = ref(false)
  const dialogTitle = ref('')
  const importOpen = ref(false)
  const importType = ref('zip')

  // Selection
  const ids = ref([])
  const single = ref(true)
  const multiple = ref(true)

  // Form refs
  const formRef = ref()
  const importFormRef = ref()

  const data = reactive({
    form: {},
    queryParams: {
      pageNum: 1,
      pageSize: 12,
      skillName: undefined,
      enabled: undefined
    },
    rules: {
      skillName: [
        { required: true, message: '请输入技能目录名', trigger: 'blur' },
        {
          pattern: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
          message: '仅允许小写字母、数字和连字符，且不能以连字符开头或结尾',
          trigger: 'blur'
        }
      ]
    },
    importForm: {
      url: '',
      skillName: ''
    },
    importRules: {
      url: [
        { required: true, message: '请输入导入 URL', trigger: 'blur' },
        { type: 'url', message: '请输入有效的 URL', trigger: 'blur' }
      ]
    }
  })

  const { queryParams, form, rules, importForm, importRules } = toRefs(data)

  // Source type labels
  const sourceTypeMap = {
    manual: '手动创建',
    upload: 'ZIP 上传',
    url: 'URL 导入'
  }

  function getSourceLabel(type) {
    return sourceTypeMap[type] || type || '-'
  }

  function getSourceTagType(type) {
    const map = { manual: '', upload: 'success', url: 'warning' }
    return map[type] || 'info'
  }

  // Fetch list
  async function getList() {
    if (loading.value) return
    loading.value = true
    try {
      const response = await listSkill(queryParams.value)
      skillList.value = response.rows || []
      total.value = response.total || 0
    } catch {
      ElMessage.error('加载技能列表失败')
    } finally {
      loading.value = false
    }
  }

  // Search
  function handleQuery() {
    queryParams.value.pageNum = 1
    getList()
  }

  function resetQuery() {
    queryParams.value = {
      pageNum: 1,
      pageSize: 12,
      skillName: undefined,
      enabled: undefined
    }
    getList()
  }

  // Form reset
  function reset() {
    form.value = {
      skillId: null,
      skillName: '',
      displayName: '',
      description: '',
      enabled: true,
      allowedTools: '',
      licenseInfo: '',
      remark: '',
      sortNo: 0
    }
    formRef.value?.resetFields()
  }

  function cancel() {
    open.value = false
    reset()
  }

  // CRUD
  function handleAdd() {
    reset()
    open.value = true
    dialogTitle.value = '新增技能'
  }

  async function handleUpdate(row) {
    reset()
    const skillId = row.skillId || ids.value[0]
    try {
      const response = await getSkill(skillId)
      form.value = response.data
      open.value = true
      dialogTitle.value = '编辑技能'
    } catch {
      ElMessage.error('加载技能详情失败')
    }
  }

  async function submitForm() {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
    } catch {
      return
    }

    if (submitLoading.value) return
    submitLoading.value = true

    try {
      if (form.value.skillId) {
        await updateSkill(form.value)
        ElMessage.success('修改成功')
      } else {
        await addSkill(form.value)
        ElMessage.success('新增成功')
      }
      open.value = false
      getList()
    } catch {
      ElMessage.error(form.value.skillId ? '修改失败' : '新增失败')
    } finally {
      submitLoading.value = false
    }
  }

  async function handleDelete(row) {
    const skillIds = row.skillId || ids.value.join(',')
    const name = row.skillName || `${ids.value.length} 项`
    try {
      await ElMessageBox.confirm(
        `确认删除技能「${name}」吗？删除后将同时移除所有关联文件。`,
        '删除确认',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      )
      await delSkill(skillIds)
      ElMessage.success('删除成功')
      getList()
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败')
      }
    }
  }

  // Selection
  function handleSelectionChange(selection) {
    ids.value = selection.map(item => item.skillId)
    single.value = selection.length !== 1
    multiple.value = !selection.length
  }

  // Export
  function handleExport() {
    proxy.download('skills/skill/export', {
      ...queryParams.value
    }, `skill_${new Date().getTime()}.xlsx`)
  }

  // Import dialog
  function openImport() {
    importType.value = 'zip'
    importForm.value = { url: '', skillName: '' }
    importOpen.value = true
  }

  function cancelImport() {
    importOpen.value = false
    importForm.value = { url: '', skillName: '' }
    importFormRef.value?.resetFields()
  }

  // ZIP upload
  async function handleUpload(file) {
    const formData = new FormData()
    formData.append('file', file.raw || file)
    try {
      const res = await uploadSkill(formData)
      ElMessage.success(res.msg || '导入成功')
      importOpen.value = false
      getList()
    } catch {
      ElMessage.error('上传失败')
    }
    return false
  }

  // URL import
  async function handleUrlImport() {
    if (!importFormRef.value) return
    try {
      await importFormRef.value.validate()
    } catch {
      return
    }

    if (submitLoading.value) return
    submitLoading.value = true

    try {
      const payload = { url: importForm.value.url }
      if (importForm.value.skillName) {
        payload.skillName = importForm.value.skillName
      }
      const res = await importUrlSkill(payload)
      ElMessage.success(res.msg || '导入成功')
      importOpen.value = false
      getList()
    } catch {
      ElMessage.error('URL 导入失败')
    } finally {
      submitLoading.value = false
    }
  }

  // Toggle enabled
  async function handleToggleEnabled(row) {
    const newVal = !row.enabled
    try {
      await updateSkill({ skillId: row.skillId, skillName: row.skillName, enabled: newVal })
      row.enabled = newVal
      ElMessage.success(newVal ? '已启用' : '已停用')
    } catch {
      ElMessage.error('操作失败')
    }
  }

  // Format time
  function formatTime(time) {
    if (!time) return '-'
    const date = new Date(time)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days} 天前`
    return date.toLocaleDateString('zh-CN')
  }

  return {
    // State
    skillList,
    loading,
    submitLoading,
    total,
    searchKeyword,
    open,
    dialogTitle,
    importOpen,
    importType,
    ids,
    single,
    multiple,
    formRef,
    importFormRef,
    // Data
    queryParams,
    form,
    rules,
    importForm,
    importRules,
    // Methods
    getSourceLabel,
    getSourceTagType,
    getList,
    handleQuery,
    resetQuery,
    reset,
    cancel,
    handleAdd,
    handleUpdate,
    submitForm,
    handleDelete,
    handleSelectionChange,
    handleExport,
    openImport,
    cancelImport,
    handleUpload,
    handleUrlImport,
    handleToggleEnabled,
    formatTime
  }
}
