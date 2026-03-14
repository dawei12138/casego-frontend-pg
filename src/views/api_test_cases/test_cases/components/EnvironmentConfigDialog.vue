<template>
  <el-dialog
    v-model="visible"
    title=""
    width="720px"
    :before-close="handleClose"
    destroy-on-close
    class="env-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <h2 class="dialog-title">环境配置</h2>
        <p class="dialog-subtitle">管理环境变量、请求头与 Cookie</p>
      </div>
    </template>

    <div class="environment-config">
      <!-- 加载状态 -->
      <div v-if="environmentsLoading" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中</span>
      </div>

      <!-- 环境选择器 -->
      <div v-else class="env-selector">
        <div class="env-tabs">
          <button
            v-for="env in environmentsList"
            :key="env.id"
            class="env-tab"
            :class="{ active: activeEnv === String(env.id) }"
            @click="selectEnvironment(env.id)"
          >
            {{ env.name }}
          </button>
        </div>
      </div>

      <!-- 配置内容 -->
      <div v-if="!environmentsLoading && activeEnv" class="config-content">
        <div v-if="configLoading" class="loading-state">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载配置</span>
        </div>

        <div v-else class="config-sections">
          <!-- 基础配置 -->
          <section class="config-section">
            <h3 class="section-label">基础配置</h3>
            <div class="form-grid">
              <div class="form-item">
                <label class="form-label">基础 URL</label>
                <el-select
                  v-model="currentConfig.baseUrl"
                  placeholder="选择或输入 URL"
                  filterable
                  allow-create
                  class="form-input"
                  @focus="loadServicesForCurrentEnv"
                >
                  <el-option
                    v-for="service in currentServices"
                    :key="service.id"
                    :label="service.url"
                    :value="service.url"
                  >
                    <div class="service-option">
                      <span class="service-name">{{ service.name }}</span>
                      <span class="service-url">{{ service.url }}</span>
                    </div>
                  </el-option>
                </el-select>
              </div>
              <div class="form-item form-item-small">
                <label class="form-label">超时 (ms)</label>
                <el-input-number
                  v-model="currentConfig.timeout"
                  :min="1000"
                  :max="60000"
                  :step="1000"
                  :controls="false"
                  class="form-input"
                />
              </div>
            </div>
            <div class="form-item">
              <label class="form-label">描述</label>
              <el-input
                v-model="currentConfig.description"
                type="textarea"
                :rows="2"
                placeholder="环境描述"
                resize="none"
                class="form-input"
              />
            </div>
          </section>

          <!-- 全局请求头 -->
          <section class="config-section">
            <div class="section-header">
              <h3 class="section-label">全局请求头</h3>
              <button class="add-btn" @click="addHeader">
                <el-icon><Plus /></el-icon>
                <span>添加</span>
              </button>
            </div>
            <div class="data-table" v-if="currentConfig.headers.length > 0">
              <div class="table-header">
                <span class="col-check"></span>
                <span class="col-key">名称</span>
                <span class="col-value">值</span>
                <span class="col-desc">描述</span>
                <span class="col-action"></span>
              </div>
              <div
                v-for="(header, index) in currentConfig.headers"
                :key="index"
                class="table-row"
              >
                <span class="col-check">
                  <el-checkbox v-model="header.enabled" />
                </span>
                <span class="col-key">
                  <input
                    v-model="header.key"
                    type="text"
                    placeholder="Header"
                    class="inline-input"
                  />
                </span>
                <span class="col-value">
                  <input
                    v-model="header.value"
                    type="text"
                    placeholder="Value"
                    class="inline-input"
                  />
                </span>
                <span class="col-desc">
                  <input
                    v-model="header.description"
                    type="text"
                    placeholder="描述"
                    class="inline-input"
                  />
                </span>
                <span class="col-action">
                  <button class="icon-btn danger" @click="removeHeader(index)">
                    <el-icon><Delete /></el-icon>
                  </button>
                </span>
              </div>
            </div>
            <div v-else class="empty-state">
              <span>暂无请求头</span>
            </div>
          </section>

          <!-- 全局 Cookie -->
          <section class="config-section">
            <div class="section-header">
              <h3 class="section-label">全局 Cookie</h3>
              <button class="add-btn" @click="addCookie">
                <el-icon><Plus /></el-icon>
                <span>添加</span>
              </button>
            </div>
            <div class="data-table" v-if="currentConfig.cookies.length > 0">
              <div class="table-header">
                <span class="col-check"></span>
                <span class="col-key">名称</span>
                <span class="col-value">值</span>
                <span class="col-desc">描述</span>
                <span class="col-action"></span>
              </div>
              <div
                v-for="(cookie, index) in currentConfig.cookies"
                :key="index"
                class="table-row"
              >
                <span class="col-check">
                  <el-checkbox v-model="cookie.enabled" />
                </span>
                <span class="col-key">
                  <input
                    v-model="cookie.key"
                    type="text"
                    placeholder="Cookie"
                    class="inline-input"
                  />
                </span>
                <span class="col-value">
                  <input
                    v-model="cookie.value"
                    type="text"
                    placeholder="Value"
                    class="inline-input"
                  />
                </span>
                <span class="col-desc">
                  <input
                    v-model="cookie.description"
                    type="text"
                    placeholder="描述"
                    class="inline-input"
                  />
                </span>
                <span class="col-action">
                  <button class="icon-btn danger" @click="removeCookie(index)">
                    <el-icon><Delete /></el-icon>
                  </button>
                </span>
              </div>
            </div>
            <div v-else class="empty-state">
              <span>暂无 Cookie</span>
            </div>
          </section>

          <!-- 环境变量 -->
          <section class="config-section">
            <div class="section-header">
              <h3 class="section-label">环境变量</h3>
              <button class="add-btn" @click="addVariable">
                <el-icon><Plus /></el-icon>
                <span>添加</span>
              </button>
            </div>
            <div class="data-table" v-if="visibleVariables.length > 0">
              <div class="table-header">
                <span class="col-key-wide">变量名</span>
                <span class="col-value-wide">值</span>
                <span class="col-action"></span>
              </div>
              <div
                v-for="(variable, index) in visibleVariables"
                :key="index"
                class="table-row"
              >
                <span class="col-key-wide">
                  <input
                    v-model="variable.key"
                    type="text"
                    placeholder="变量名"
                    class="inline-input"
                  />
                </span>
                <span class="col-value-wide">
                  <input
                    v-model="variable.value"
                    type="text"
                    placeholder="变量值"
                    class="inline-input"
                  />
                </span>
                <span class="col-action">
                  <button class="icon-btn danger" @click="removeVariable(variable)">
                    <el-icon><Delete /></el-icon>
                  </button>
                </span>
              </div>
            </div>
            <div v-else class="empty-state">
              <span>暂无变量</span>
            </div>
          </section>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="handleClose">取消</button>
        <button class="btn btn-primary" :disabled="saveLoading" @click="handleSave">
          {{ saveLoading ? '保存中...' : '保存' }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { Plus, Delete, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { listEnvironments } from '../composables/caseService'
import { useEnvironmentConfig } from '../composables/useEnvironmentConfig'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  currentEnvironmentId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const {
  getEnvironmentConfigData,
  getServicesListData,
  saveEnvironmentConfigData,
  loading: configLoading
} = useEnvironmentConfig()

const visible = ref(props.modelValue)
const activeEnv = ref('')
const environmentsLoading = ref(false)
const saveLoading = ref(false)
const environmentsList = ref([])
const currentServices = ref([])

const defaultConfig = {
  id: null,
  name: '',
  baseUrl: '',
  timeout: 30000,
  description: '',
  variables: [],
  headers: [],
  cookies: []
}

const currentConfig = reactive({ ...defaultConfig })
const configCache = ref(new Map())

const visibleVariables = computed(() => {
  return currentConfig.variables.filter(variable => !variable.is_delete)
})

const currentEnvironmentId = computed(() => {
  return activeEnv.value ? parseInt(activeEnv.value) : null
})

const loadEnvironmentsList = async () => {
  environmentsLoading.value = true
  try {
    const response = await listEnvironments({ pageNum: 1, pageSize: 999 })
    if (response && response.code === 200) {
      environmentsList.value = response.rows || []
      if (props.currentEnvironmentId && environmentsList.value.find(e => e.id == props.currentEnvironmentId)) {
        activeEnv.value = String(props.currentEnvironmentId)
      } else if (environmentsList.value.length > 0 && !activeEnv.value) {
        activeEnv.value = String(environmentsList.value[0].id)
      }
    }
  } catch (error) {
    console.error('Failed to load environments:', error)
    ElMessage.error('加载环境列表失败')
  } finally {
    environmentsLoading.value = false
  }
}

const loadEnvironmentConfig = async (environmentId, forceRefresh = false) => {
  if (!environmentId) return

  const cacheKey = String(environmentId)

  if (!forceRefresh && configCache.value.has(cacheKey)) {
    const cachedConfig = configCache.value.get(cacheKey)
    Object.assign(currentConfig, cachedConfig)
    return
  }

  try {
    const configData = await getEnvironmentConfigData(environmentId, forceRefresh)

    const processedConfig = {
      id: configData.id || environmentId,
      name: configData.name || environmentsList.value.find(e => e.id === environmentId)?.name || '',
      baseUrl: configData.baseUrl || '',
      timeout: configData.timeout || 30000,
      description: configData.description || '',
      variables: Array.isArray(configData.variables)
        ? configData.variables.map(v => ({
            key: v.key || '',
            value: v.value || '',
            id: v.id || null,
            is_delete: v.is_delete || false
          }))
        : [],
      headers: Array.isArray(configData.headers) ? configData.headers : [],
      cookies: Array.isArray(configData.cookies) ? configData.cookies : []
    }

    configCache.value.set(cacheKey, processedConfig)
    Object.assign(currentConfig, processedConfig)
  } catch (error) {
    console.error('Failed to load environment config:', error)
    ElMessage.error('加载环境配置失败')

    const env = environmentsList.value.find(e => e.id === environmentId)
    Object.assign(currentConfig, {
      ...defaultConfig,
      id: environmentId,
      name: env?.name || ''
    })
  }
}

const loadServicesForCurrentEnv = async () => {
  if (!currentEnvironmentId.value) return

  try {
    const services = await getServicesListData(currentEnvironmentId.value)
    currentServices.value = services || []
  } catch (error) {
    console.error('Failed to load services:', error)
    currentServices.value = []
  }
}

const selectEnvironment = async (envId) => {
  activeEnv.value = String(envId)
  await loadEnvironmentConfig(envId, false)
  await loadServicesForCurrentEnv()
}

const addVariable = () => {
  currentConfig.variables.push({
    key: '',
    value: '',
    id: null,
    is_delete: false
  })
}

const removeVariable = (variable) => {
  const index = currentConfig.variables.findIndex(v => v === variable)
  if (index > -1) {
    if (variable.id) {
      currentConfig.variables[index] = {
        ...currentConfig.variables[index],
        is_delete: true
      }
    } else {
      currentConfig.variables.splice(index, 1)
    }
  }
}

const addHeader = () => {
  currentConfig.headers.push({
    key: '',
    value: '',
    enabled: true,
    description: ''
  })
}

const removeHeader = (index) => {
  currentConfig.headers.splice(index, 1)
}

const addCookie = () => {
  currentConfig.cookies.push({
    key: '',
    value: '',
    enabled: true,
    description: ''
  })
}

const removeCookie = (index) => {
  currentConfig.cookies.splice(index, 1)
}

const handleClose = () => {
  configCache.value.clear()
  visible.value = false
  emit('update:modelValue', false)
}

const handleSave = async () => {
  if (!currentConfig.id) {
    ElMessage.error('请选择要保存的环境')
    return
  }

  if (!currentConfig.baseUrl?.trim()) {
    ElMessage.error('基础 URL 不能为空')
    return
  }

  for (const variable of visibleVariables.value) {
    if (!variable.key?.trim()) {
      ElMessage.error('存在空的变量名')
      return
    }
  }

  for (const header of currentConfig.headers) {
    if (header.enabled && !header.key?.trim()) {
      ElMessage.error('存在空的请求头名称')
      return
    }
  }

  for (const cookie of currentConfig.cookies) {
    if (cookie.enabled && !cookie.key?.trim()) {
      ElMessage.error('存在空的 Cookie 名称')
      return
    }
  }

  saveLoading.value = true

  try {
    const saveData = {
      ...currentConfig,
      variables: currentConfig.variables
    }

    const response = await saveEnvironmentConfigData(saveData)

    if (response && response.code === 200) {
      ElMessage.success('配置已保存')

      const cacheKey = String(currentConfig.id)
      configCache.value.delete(cacheKey)

      emit('save', currentConfig)
      handleClose()
    } else {
      throw new Error(response?.msg || '保存失败')
    }
  } catch (error) {
    console.error('Failed to save environment config:', error)
    ElMessage.error(`保存失败: ${error.message}`)
  } finally {
    saveLoading.value = false
  }
}

watch(() => props.modelValue, (newVal) => {
  visible.value = newVal

  if (newVal) {
    loadEnvironmentsList().then(() => {
      if (activeEnv.value) {
        loadEnvironmentConfig(parseInt(activeEnv.value), true)
        loadServicesForCurrentEnv()
      }
    })
  }
})

watch(() => props.currentEnvironmentId, (newEnvId) => {
  if (newEnvId && visible.value && environmentsList.value.length > 0) {
    const envExists = environmentsList.value.find(e => e.id == newEnvId)
    if (envExists) {
      activeEnv.value = String(newEnvId)
      loadEnvironmentConfig(parseInt(newEnvId), true)
      loadServicesForCurrentEnv()
    }
  }
})

watch(visible, (newVal) => {
  if (!newVal) {
    emit('update:modelValue', false)
  }
})
</script>

<style scoped>
.env-dialog :deep(.el-dialog__header) {
  padding: 24px 24px 0;
  margin: 0;
}

.env-dialog :deep(.el-dialog__body) {
  padding: 16px 24px;
}

.env-dialog :deep(.el-dialog__footer) {
  padding: 0 24px 24px;
}

.dialog-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  letter-spacing: -0.02em;
  margin: 0;
}

.dialog-subtitle {
  font-size: 13px;
  color: #86868b;
  margin: 0;
}

.environment-config {
  min-height: 400px;
  max-height: 560px;
  overflow-y: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: #86868b;
  gap: 8px;
}

.loading-state .el-icon {
  font-size: 20px;
}

/* Environment Tabs */
.env-selector {
  margin-bottom: 20px;
}

.env-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.env-tab {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
  background: #f5f5f7;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.env-tab:hover {
  background: #e8e8ed;
}

.env-tab.active {
  background: #1d1d1f;
  color: #fff;
}

/* Config Sections */
.config-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #1d1d1f;
  letter-spacing: -0.01em;
  margin: 0;
}

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 140px;
  gap: 12px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item-small {
  max-width: 140px;
}

.form-label {
  font-size: 12px;
  font-weight: 500;
  color: #86868b;
}

.form-input {
  width: 100%;
}

.form-input :deep(.el-input__wrapper),
.form-input :deep(.el-textarea__inner) {
  background: #f5f5f7;
  border: none;
  box-shadow: none;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  transition: background-color 0.15s ease;
}

.form-input :deep(.el-input__wrapper:hover),
.form-input :deep(.el-textarea__inner:hover) {
  background: #e8e8ed;
}

.form-input :deep(.el-input__wrapper:focus-within),
.form-input :deep(.el-textarea__inner:focus) {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.3);
}

.form-input :deep(.el-input-number .el-input__wrapper) {
  padding: 0 12px;
}

/* Add Button */
.add-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #0071e3;
  background: rgba(0, 113, 227, 0.1);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.add-btn:hover {
  background: rgba(0, 113, 227, 0.15);
}

/* Data Table */
.data-table {
  display: flex;
  flex-direction: column;
  background: #f5f5f7;
  border-radius: 10px;
  overflow: hidden;
}

.table-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.03);
  font-size: 11px;
  font-weight: 600;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.table-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.table-row:first-of-type {
  border-top: none;
}

.col-check {
  width: 32px;
  flex-shrink: 0;
}

.col-key {
  width: 120px;
  flex-shrink: 0;
}

.col-value {
  flex: 1;
  min-width: 0;
}

.col-desc {
  width: 100px;
  flex-shrink: 0;
}

.col-action {
  width: 32px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

.col-key-wide {
  width: 160px;
  flex-shrink: 0;
}

.col-value-wide {
  flex: 1;
  min-width: 0;
}

.inline-input {
  width: 100%;
  padding: 6px 8px;
  font-size: 13px;
  color: #1d1d1f;
  background: transparent;
  border: none;
  border-radius: 4px;
  outline: none;
  transition: background-color 0.15s ease;
}

.inline-input:hover {
  background: rgba(0, 0, 0, 0.04);
}

.inline-input:focus {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.3);
}

.inline-input::placeholder {
  color: #c7c7cc;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #86868b;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}

.icon-btn.danger:hover {
  color: #ff453a;
  background: rgba(255, 69, 58, 0.1);
}

/* Empty State */
.empty-state {
  padding: 24px;
  text-align: center;
  background: #f5f5f7;
  border-radius: 10px;
  color: #86868b;
  font-size: 13px;
}

/* Service Option */
.service-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.service-name {
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
}

.service-url {
  font-size: 12px;
  color: #86868b;
}

/* Dialog Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-secondary {
  color: #1d1d1f;
  background: #f5f5f7;
}

.btn-secondary:hover {
  background: #e8e8ed;
}

.btn-primary {
  color: #fff;
  background: #0071e3;
}

.btn-primary:hover {
  background: #0077ed;
}

.btn-primary:disabled {
  background: #c7c7cc;
  cursor: not-allowed;
}

/* Scrollbar */
.environment-config::-webkit-scrollbar {
  width: 6px;
}

.environment-config::-webkit-scrollbar-track {
  background: transparent;
}

.environment-config::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.environment-config::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

/* Checkbox Override */
:deep(.el-checkbox) {
  height: auto;
}

:deep(.el-checkbox__inner) {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border-color: #c7c7cc;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #0071e3;
  border-color: #0071e3;
}

/* Select Override */
:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  background: #f5f5f7;
  border: none;
  box-shadow: none;
  border-radius: 8px;
  padding: 10px 12px;
}

:deep(.el-select .el-input__wrapper:hover) {
  background: #e8e8ed;
}

:deep(.el-select .el-input.is-focus .el-input__wrapper) {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.3);
}
</style>
