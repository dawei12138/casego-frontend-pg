<template>
  <el-select
    v-model="selectedId"
    placeholder="选择项目"
    @change="onChange"
    :clearable="false"
    :style="{ width: '240px', height: '36px' }"
    class="custom-select"
  >
    <template #prefix>
      <el-icon><Menu /></el-icon>
    </template>
    <el-option
      v-for="item in projects"
      :key="item.id"
      :label="item.name"
      :value="String(item.id)"
      :style="{ height: '36px' }"
    />
  </el-select>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProjectStore } from '@/store/modules/project'
import { listProject } from "@/api/api_project/project"
import { Menu } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const projectStore = useProjectStore()
const selectedId = ref(null)
const projects = ref([])
const loading = ref(false)
const total = ref(0)
const queryParams = ref({
  pageNum: 1,
  pageSize: 100
})

// 获取项目列表的函数
async function fetchProjects() {
  loading.value = true
  try {
    const response = await listProject(queryParams.value)
    projects.value = response.rows || []
    total.value = response.total || 0
   
    const currentId = projectStore.projectId
    const exists = projects.value.some(p => String(p.id) === currentId)
   
    if (exists) {
      selectedId.value = currentId
    } else if (projects.value.length) {
      const firstId = String(projects.value[0].id)
      selectedId.value = firstId
      projectStore.setProjectId(firstId)
    }
  } catch (e) {
    console.error("加载项目列表失败", e)
  } finally {
    loading.value = false
  }
}

// 组件挂载时只调用一次
onMounted(() => {
  fetchProjects()
})

function onChange(value) {
  if (value === null) {
    projectStore.clearProjectId()
  } else {
    projectStore.setProjectId(value)
    ElMessage.success('项目切换成功')
    // 刷新整个页面
    window.location.reload()
  }
}
</script>