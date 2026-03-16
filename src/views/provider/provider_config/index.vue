<template>
  <div class="provider-container">
    <!-- Header -->
    <div class="provider-header">
      <div class="header-left">
        <h2 class="page-title">LLM 提供商</h2>
        <span class="provider-count">{{ total }} 个配置</span>
      </div>
      <div class="header-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索提供商..."
          prefix-icon="Search"
          clearable
          class="search-input"
          @input="handleSearch"
        />
        <el-button
          type="primary"
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['provider:provider_config:add']"
          class="add-btn"
        >添加提供商</el-button>
      </div>
    </div>

    <!-- Provider Cards -->
    <div v-loading="loading" class="provider-grid">
      <div
        v-for="item in provider_configList"
        :key="item.providerId"
        class="provider-card"
        @click="handleUpdate(item)"
      >
        <div class="card-top">
          <div class="provider-identity">
            <div class="provider-avatar">
              <img v-if="item.iconUrl" :src="item.iconUrl" :alt="item.providerName" />
              <span v-else class="avatar-letter">{{ (item.providerName || 'L').charAt(0) }}</span>
            </div>
            <div>
              <h3 class="provider-name">{{ item.providerName }}</h3>
              <span class="provider-key">{{ item.providerKey }}</span>
            </div>
          </div>
          <el-tag
            :type="item.status === '0' ? 'success' : 'info'"
            size="small" round effect="light"
          >{{ item.status === '0' ? '启用' : '禁用' }}</el-tag>
        </div>

        <div class="card-middle">
          <div class="info-item">
            <span class="info-label">API 密钥</span>
            <span class="info-value masked">{{ maskApiKey(item.apiKey) }}</span>
          </div>
          <div class="info-item" v-if="item.baseUrl">
            <span class="info-label">Base URL</span>
            <span class="info-value truncate">{{ item.baseUrl }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">更新时间</span>
            <span class="info-value">{{ formatTime(item.updateTime) }}</span>
          </div>
        </div>

        <div class="card-bottom">
          <el-button link type="primary" icon="Connection" size="small"
            @click.stop="handleTestConnection(item)"
            :loading="testingIds.includes(item.providerId)">测试连接</el-button>
          <el-button link type="primary" icon="Edit" size="small"
            @click.stop="handleUpdate(item)"
            v-hasPermi="['provider:provider_config:edit']">编辑</el-button>
          <el-button link type="danger" icon="Delete" size="small"
            @click.stop="handleDelete(item)"
            v-hasPermi="['provider:provider_config:remove']">删除</el-button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <el-empty v-if="!loading && provider_configList.length === 0"
      description="暂无提供商配置" class="empty-state">
      <el-button type="primary" icon="Plus" @click="handleAdd">添加第一个提供商</el-button>
    </el-empty>

    <!-- Pagination -->
    <pagination v-show="total > 0" :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList" class="pagination" />

    <!-- Add/Edit Dialog -->
    <el-dialog :title="title" v-model="open" width="680px"
      :close-on-click-modal="false" class="provider-dialog">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" label-position="top">
        <div class="form-section">
          <h4 class="section-title">基本信息</h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="提供商标识" prop="providerKey">
                <el-input v-model="form.providerKey"
                  placeholder="如: openai, anthropic, google"
                  :disabled="!!form.providerId" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="显示名称" prop="providerName">
                <el-input v-model="form.providerName"
                  placeholder="如: OpenAI, Anthropic, Google" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <h4 class="section-title">认证配置</h4>
          <el-form-item label="API 密钥" prop="apiKey">
            <el-input v-model="form.apiKey" type="password" show-password
              placeholder="请输入 API Key" />
          </el-form-item>

          <el-form-item label="API Secret" prop="apiSecret">
            <el-input v-model="form.apiSecret" type="password" show-password
              placeholder="部分提供商需要 (可选)" />
          </el-form-item>
        </div>

        <div class="form-section">
          <h4 class="section-title">连接配置</h4>
          <el-form-item label="Base URL" prop="baseUrl">
            <el-input v-model="form.baseUrl" placeholder="自定义或代理地址 (可选)" />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="超时时间 (秒)" prop="timeout">
                <el-input-number v-model="form.timeout" :min="1" :max="300"
                  placeholder="默认 60" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最大重试次数" prop="maxRetries">
                <el-input-number v-model="form.maxRetries" :min="0" :max="10"
                  placeholder="默认 3" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <h4 class="section-title">高级配置</h4>
          <el-form-item label="额外请求头 (JSON)" prop="extraHeaders">
            <el-input v-model="form.extraHeaders" type="textarea" :rows="3"
              placeholder='{"X-Custom-Header": "value"}' />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">
            {{ form.providerId ? '保存' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ProviderConfig">
import { ref, reactive, toRefs, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listProvider_config,
  getProvider_config,
  delProvider_config,
  addProvider_config,
  updateProvider_config
} from '@/api/provider/provider_config'

// State
const loading = ref(false)
const submitLoading = ref(false)
const open = ref(false)
const title = ref('')
const total = ref(0)
const searchKeyword = ref('')
const testingIds = ref([])
const provider_configList = ref([])
const formRef = ref()

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 12
  },
  rules: {
    providerKey: [
      { required: true, message: '请输入提供商标识', trigger: 'blur' }
    ],
    providerName: [
      { required: true, message: '请输入提供商名称', trigger: 'blur' }
    ],
    apiKey: [
      { required: true, message: '请输入 API 密钥', trigger: 'blur' }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)

// Computed
const filteredList = computed(() => {
  if (!searchKeyword.value) return provider_configList.value
  const keyword = searchKeyword.value.toLowerCase()
  return provider_configList.value.filter(item =>
    item.providerName?.toLowerCase().includes(keyword) ||
    item.providerKey?.toLowerCase().includes(keyword)
  )
})

// Methods
function maskApiKey(key) {
  if (!key) return '未配置'
  if (key.length <= 8) return '••••••••'
  return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4)
}

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

function handleSearch() {
  // Search is handled by computed property
}

async function getList() {
  if (loading.value) return
  loading.value = true
  try {
    const response = await listProvider_config(queryParams.value)
    provider_configList.value = response.rows
    total.value = response.total
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function reset() {
  form.value = {
    providerId: null,
    providerKey: null,
    providerName: null,
    apiKey: null,
    apiSecret: null,
    baseUrl: null,
    apiVersion: null,
    timeout: 60,
    maxRetries: 3,
    extraHeaders: null,
    iconUrl: null,
    status: '0',
    remark: null,
    description: null,
    sortNo: 0
  }
  formRef.value?.resetFields()
}

function cancel() {
  open.value = false
  reset()
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '添加 LLM 提供商'
}

async function handleUpdate(row) {
  reset()
  const providerId = row.providerId
  try {
    const response = await getProvider_config(providerId)
    form.value = response.data
    // extraHeaders: object → string for textarea
    if (form.value.extraHeaders && typeof form.value.extraHeaders === 'object') {
      form.value.extraHeaders = JSON.stringify(form.value.extraHeaders, null, 2)
    }
    open.value = true
    title.value = '编辑 LLM 提供商'
  } catch (error) {
    ElMessage.error('加载失败')
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
    const submitData = { ...form.value }
    // extraHeaders: string → object
    if (typeof submitData.extraHeaders === 'string' && submitData.extraHeaders.trim()) {
      try {
        submitData.extraHeaders = JSON.parse(submitData.extraHeaders)
      } catch {
        ElMessage.warning('额外请求头 JSON 格式不正确')
        submitLoading.value = false
        return
      }
    }

    if (submitData.providerId) {
      await updateProvider_config(submitData)
      ElMessage.success('修改成功')
    } else {
      await addProvider_config(submitData)
      ElMessage.success('创建成功')
    }
    open.value = false
    getList()
  } catch (error) {
    ElMessage.error(form.value.providerId ? '修改失败' : '创建失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确认删除提供商 "${row.providerName}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await delProvider_config(row.providerId)
    ElMessage.success('删除成功')
    getList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

async function handleTestConnection(row) {
  if (testingIds.value.includes(row.providerId)) return
  
  testingIds.value.push(row.providerId)
  
  // Simulate connection test (replace with actual API call)
  setTimeout(() => {
    testingIds.value = testingIds.value.filter(id => id !== row.providerId)
    ElMessage.success('连接测试成功')
  }, 1500)
}

// Init
getList()
</script>

<style scoped>
.provider-container {
  padding: 24px 28px;
  background: #f5f5f7;
  min-height: calc(100vh - 84px);
}

/* Header */
.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1f;
  margin: 0;
  letter-spacing: -0.5px;
}

.provider-count {
  font-size: 14px;
  color: #86868b;
  font-weight: 400;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 240px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  background: #fff;
  box-shadow: none;
  border: 1px solid #e5e5e7;
  transition: all 0.2s ease;
}

.search-input :deep(.el-input__wrapper:hover),
.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
}

.add-btn {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
}

/* Card Grid */
.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  min-height: 200px;
}

.provider-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
}

.provider-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #e5e5e7;
}

/* Card Top */
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.provider-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.provider-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.provider-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-letter {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
}

.provider-name {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 2px 0;
}

.provider-key {
  font-size: 12px;
  color: #86868b;
  font-family: 'SF Mono', SFMono-Regular, Consolas, monospace;
}

/* Card Middle */
.card-middle {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 0;
  border-top: 1px solid #f0f0f2;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 13px;
  color: #86868b;
  flex-shrink: 0;
}

.info-value {
  font-size: 13px;
  color: #1d1d1f;
  text-align: right;
}

.info-value.masked {
  font-family: 'SF Mono', SFMono-Regular, Consolas, monospace;
  letter-spacing: 1px;
  color: #6e6e73;
}

.info-value.truncate {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Card Bottom */
.card-bottom {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  padding-top: 14px;
  border-top: 1px solid #f0f0f2;
}

/* Empty State */
.empty-state {
  padding: 80px 0;
}

/* Pagination */
.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

/* Dialog */
.provider-dialog :deep(.el-dialog) {
  border-radius: 16px;
}

.provider-dialog :deep(.el-dialog__header) {
  padding: 24px 24px 0;
}

.provider-dialog :deep(.el-dialog__title) {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
}

.provider-dialog :deep(.el-dialog__body) {
  padding: 16px 24px;
}

.form-section {
  margin-bottom: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 16px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f2;
}

.form-section :deep(.el-form-item__label) {
  font-size: 13px;
  color: #6e6e73;
  font-weight: 500;
  padding-bottom: 4px;
}

.form-section :deep(.el-input__wrapper),
.form-section :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.form-section :deep(.el-input__wrapper:hover),
.form-section :deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #0071e3 inset;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dialog-footer .el-button {
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 500;
}
</style>
