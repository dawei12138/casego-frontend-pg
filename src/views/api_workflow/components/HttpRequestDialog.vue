<template>
  <el-dialog
    v-model="visible"
    title="添加HTTP请求"
    width="600px"
    :close-on-click-modal="false"
    class="http-request-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="节点名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入节点名称" />
        </el-form-item>
        <el-form-item label="所属项目" prop="projectId">
          <el-select
            v-model="formData.projectId"
            placeholder="请选择项目"
            style="width: 100%"
            filterable
            :loading="projectsLoading"
          >
            <el-option
              v-for="project in projects"
              :key="project.projectId"
              :label="project.name"
              :value="project.projectId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="请求说明">
          <el-alert
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              创建空白HTTP请求节点后，可在节点详情中配置请求URL、方法、参数等
            </template>
          </el-alert>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          创建
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
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
const projectsLoading = ref(false)
const projects = ref([])
const formData = ref({
  name: 'HTTP请求',
  projectId: null
})

const rules = {
  name: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }]
}

const loadProjects = async () => {
  projectsLoading.value = true
  try {
    const response = await request({
      url: '/api_projects/projects',
      method: 'get',
      params: { pageNum: 1, pageSize: 999 }
    })
    if (response && response.code === 200) {
      projects.value = response.rows || []
      if (projects.value.length > 0 && !formData.value.projectId) {
        formData.value.projectId = projects.value[0].projectId
      }
    }
  } catch (error) {
    console.error('加载项目列表失败:', error)
  } finally {
    projectsLoading.value = false
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    loading.value = true

    emit('confirm', {
      name: formData.value.name,
      projectId: formData.value.projectId
    })

    handleClose()
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  visible.value = false
  formData.value = {
    name: 'HTTP请求',
    projectId: null
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    loadProjects()
    formData.value = {
      name: 'HTTP请求',
      projectId: null
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
