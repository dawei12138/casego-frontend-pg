<template>
  <el-dialog
    v-model="visible"
    title="数据库脚本"
    width="900px"
    :close-on-click-modal="false"
    class="db-operation-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="节点名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入节点名称" />
        </el-form-item>
        <el-form-item label=" " :label-width="0">
          <DbOperationEditor
            ref="dbEditorRef"
            v-model:model-db-id="formData.dbOperationId"
            v-model:model-script="formData.dbOperationScript"
            :editor-height="300"
            @change="handleEditorChange"
          />
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
import { ElMessage } from 'element-plus'
import DbOperationEditor from './DbOperationEditor.vue'

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
const dbEditorRef = ref()
const loading = ref(false)
const formData = ref({
  name: '数据库查询',
  dbOperationId: null,
  dbOperationScript: ''
})

const rules = {
  name: [{ required: true, message: '请输入节点名称', trigger: 'blur' }]
}

// 编辑器内容变化
const handleEditorChange = ({ dbOperationId, dbOperationScript }) => {
  // 自动更新节点名称
  if (dbOperationId && dbEditorRef.value) {
    const dbName = dbEditorRef.value.getSelectedDbName()
    if (dbName && formData.value.name === '数据库查询') {
      formData.value.name = `查询_${dbName}`
    }
  }
}

const handleSubmit = async () => {
  // 防止重复提交
  if (loading.value) return

  try {
    await formRef.value.validate()

    if (!formData.value.dbOperationId) {
      ElMessage.warning('请选择数据库连接')
      return
    }
    if (!formData.value.dbOperationScript?.trim()) {
      ElMessage.warning('请输入SQL脚本')
      return
    }

    loading.value = true

    emit('confirm', {
      name: formData.value.name,
      dbOperationId: formData.value.dbOperationId,
      dbOperationScript: formData.value.dbOperationScript
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
    name: '数据库查询',
    dbOperationId: null,
    dbOperationScript: ''
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    formData.value = {
      name: '数据库查询',
      dbOperationId: null,
      dbOperationScript: ''
    }
  }
})
</script>

<style scoped>
.dialog-content {
  padding: 16px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
