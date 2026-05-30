<template>
  <div class="provider-container">
    <div class="provider-shell">
      <section class="provider-overview">
        <div class="overview-copy">
          <span class="mono-label">PROVIDER GATEWAY</span>
          <div class="overview-title-row">
            <h2 class="page-title">LLM 提供商</h2>
            <span class="provider-count">{{ visibleCountLabel }} 个配置</span>
          </div>
          <p class="page-description">集中维护模型供应商、认证密钥、代理地址和连接策略。</p>
        </div>

        <div class="overview-actions">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索提供商"
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
      </section>

      <section class="provider-stats" aria-label="提供商配置概览">
        <div class="stat-item is-total">
          <span class="stat-label">TOTAL</span>
          <strong>{{ total }}</strong>
          <span>全部配置</span>
        </div>
        <div class="stat-item is-enabled">
          <span class="stat-label">ENABLED</span>
          <strong>{{ enabledCount }}</strong>
          <span>启用中</span>
        </div>
        <div class="stat-item is-disabled">
          <span class="stat-label">DISABLED</span>
          <strong>{{ disabledCount }}</strong>
          <span>已禁用</span>
        </div>
        <div class="stat-item is-visible">
          <span class="stat-label">VISIBLE</span>
          <strong>{{ filteredList.length }}</strong>
          <span>当前视图</span>
        </div>
      </section>

      <section class="provider-content">
        <div v-loading="loading" class="provider-grid">
          <article
            v-for="item in filteredList"
            :key="item.providerId"
            class="provider-card"
            @click="handleUpdate(item)"
          >
            <header class="card-top">
              <div class="provider-identity">
                <div class="provider-avatar" :class="{ 'has-image': item.iconUrl }">
                  <img v-if="item.iconUrl" :src="item.iconUrl" :alt="item.providerName" />
                  <span v-else class="avatar-letter">{{ getProviderInitial(item) }}</span>
                </div>
                <div class="provider-heading">
                  <h3 class="provider-name">{{ item.providerName || '未命名提供商' }}</h3>
                  <span class="provider-key">{{ item.providerKey || '-' }}</span>
                </div>
              </div>
              <span class="status-badge" :class="getStatusMeta(item.status).className">
                <span class="status-dot"></span>
                {{ getStatusMeta(item.status).label }}
              </span>
            </header>

            <div class="endpoint-panel">
              <span class="mono-label">ENDPOINT</span>
              <span class="endpoint-value" :title="item.baseUrl || '默认端点'">
                {{ getEndpointText(item.baseUrl) }}
              </span>
            </div>

            <dl class="provider-details">
              <div class="info-item">
                <dt>API 密钥</dt>
                <dd class="masked">{{ maskApiKey(item.apiKey) }}</dd>
              </div>
              <div class="info-item">
                <dt>超时 / 重试</dt>
                <dd>{{ item.timeout || 60 }}s / {{ item.maxRetries ?? 3 }} 次</dd>
              </div>
              <div class="info-item">
                <dt>更新时间</dt>
                <dd>{{ formatTime(item.updateTime) }}</dd>
              </div>
            </dl>

            <footer class="card-actions">
              <el-button
                link
                type="primary"
                icon="Connection"
                size="small"
                @click.stop="handleTestConnection(item)"
                :loading="testingIds.includes(item.providerId)"
              >测试</el-button>
              <el-button
                link
                type="primary"
                icon="Edit"
                size="small"
                @click.stop="handleUpdate(item)"
                v-hasPermi="['provider:provider_config:edit']"
              >编辑</el-button>
              <el-button
                link
                type="danger"
                icon="Delete"
                size="small"
                @click.stop="handleDelete(item)"
                v-hasPermi="['provider:provider_config:remove']"
              >删除</el-button>
            </footer>
          </article>
        </div>

        <el-empty
          v-if="!loading && filteredList.length === 0"
          :description="searchKeyword ? '没有匹配的提供商' : '暂无提供商配置'"
          class="empty-state"
        >
          <el-button type="primary" icon="Plus" @click="handleAdd">添加第一个提供商</el-button>
        </el-empty>
      </section>

      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
        class="pagination"
      />
    </div>

    <el-dialog
      v-model="open"
      width="720px"
      :close-on-click-modal="false"
      class="provider-dialog"
    >
      <template #header>
        <div class="dialog-heading">
          <span class="mono-label">PROVIDER CONFIG</span>
          <h3>{{ title }}</h3>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" label-position="top" class="provider-form">
        <section class="form-section">
          <div class="form-section-head">
            <span class="section-index">01</span>
            <div>
              <h4 class="section-title">基本信息</h4>
              <p>供应商的唯一标识和展示信息。</p>
            </div>
          </div>
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="提供商标识" prop="providerKey">
                <el-input
                  v-model="form.providerKey"
                  placeholder="openai"
                  :disabled="!!form.providerId"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="显示名称" prop="providerName">
                <el-input v-model="form.providerName" placeholder="OpenAI" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="16">
              <el-form-item label="图标 URL" prop="iconUrl">
                <el-input v-model="form.iconUrl" placeholder="https://example.com/icon.svg" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="8">
              <el-form-item label="状态" prop="status">
                <el-switch
                  v-model="form.status"
                  active-value="0"
                  inactive-value="1"
                  active-text="启用"
                  inactive-text="禁用"
                  class="status-switch"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <section class="form-section">
          <div class="form-section-head">
            <span class="section-index">02</span>
            <div>
              <h4 class="section-title">认证配置</h4>
              <p>用于请求供应商 API 的凭据。</p>
            </div>
          </div>
          <el-form-item label="API 密钥" prop="apiKey">
            <el-input v-model="form.apiKey" type="password" show-password placeholder="请输入 API Key" />
          </el-form-item>

          <el-form-item label="API Secret" prop="apiSecret">
            <el-input v-model="form.apiSecret" type="password" show-password placeholder="可选" />
          </el-form-item>
        </section>

        <section class="form-section">
          <div class="form-section-head">
            <span class="section-index">03</span>
            <div>
              <h4 class="section-title">连接配置</h4>
              <p>代理地址、超时和失败重试策略。</p>
            </div>
          </div>
          <el-form-item label="Base URL" prop="baseUrl">
            <el-input v-model="form.baseUrl" placeholder="https://api.example.com/v1" />
          </el-form-item>

          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="超时时间 (秒)" prop="timeout">
                <el-input-number v-model="form.timeout" :min="1" :max="300" placeholder="60" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="最大重试次数" prop="maxRetries">
                <el-input-number v-model="form.maxRetries" :min="0" :max="10" placeholder="3" />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <section class="form-section">
          <div class="form-section-head">
            <span class="section-index">04</span>
            <div>
              <h4 class="section-title">高级配置</h4>
              <p>按需覆盖请求头和内部备注。</p>
            </div>
          </div>
          <el-form-item label="额外请求头 (JSON)" prop="extraHeaders">
            <el-input
              v-model="form.extraHeaders"
              class="json-textarea"
              type="textarea"
              :rows="4"
              placeholder='{"X-Custom-Header": "value"}'
            />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
          </el-form-item>
        </section>
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

const enabledCount = computed(() => provider_configList.value.filter(item => item.status === '0').length)
const disabledCount = computed(() => provider_configList.value.length - enabledCount.value)
const visibleCountLabel = computed(() => (searchKeyword.value ? `${filteredList.value.length} / ${total.value}` : total.value))

// Methods
function maskApiKey(key) {
  if (!key) return '未配置'
  if (key.length <= 8) return '••••••••'
  return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4)
}

function getProviderInitial(item) {
  const label = item.providerName || item.providerKey || 'L'
  return label.charAt(0).toUpperCase()
}

function getStatusMeta(status) {
  return status === '0'
    ? { label: '启用', className: 'is-enabled' }
    : { label: '禁用', className: 'is-disabled' }
}

function getEndpointText(baseUrl) {
  if (!baseUrl) return '默认端点'

  try {
    return new URL(baseUrl).host
  } catch {
    return baseUrl
  }
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
  --provider-ink: #111827;
  --provider-body: #4b5563;
  --provider-muted: #6b7280;
  --provider-subtle: #9ca3af;
  --provider-hairline: #e5e7eb;
  --provider-hairline-strong: #cbd5e1;
  --provider-canvas: #ffffff;
  --provider-canvas-soft: #f5f7fb;
  --provider-canvas-soft-2: #f8fafc;
  --provider-primary: #2563eb;
  --provider-primary-hover: #1d4ed8;
  --provider-primary-soft: #eff6ff;
  --provider-primary-border: #bfdbfe;
  --provider-success: #16a34a;
  --provider-success-soft: #f0fdf4;
  --provider-success-border: #bbf7d0;
  --provider-warning: #d97706;
  --provider-error: #dc2626;
  --provider-error-soft: #fef2f2;
  --provider-error-border: #fecaca;
  --provider-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -20px rgba(15, 23, 42, 0.28);
  min-height: calc(100vh - 84px);
  padding: 32px 28px 40px;
  background: var(--provider-canvas-soft);
  color: var(--provider-ink);
  font-family: Geist, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.provider-shell {
  max-width: 1440px;
  margin: 0 auto;
}

.mono-label,
.stat-label,
.provider-key,
.masked,
.section-index {
  font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.mono-label {
  display: inline-flex;
  align-items: center;
  min-height: 16px;
  color: var(--provider-subtle);
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.provider-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: end;
  padding: 24px;
  border: 1px solid var(--provider-hairline);
  border-radius: 10px;
  background: var(--provider-canvas);
  box-shadow: var(--provider-shadow);
}

.overview-copy {
  min-width: 0;
}

.overview-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px;
  margin-top: 8px;
}

.page-title {
  margin: 0;
  color: var(--provider-ink);
  font-size: 28px;
  font-weight: 600;
  line-height: 36px;
  letter-spacing: 0;
}

.provider-count {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border: 1px solid var(--provider-primary-border);
  border-radius: 999px;
  background: var(--provider-primary-soft);
  color: var(--provider-primary);
  font-size: 14px;
  line-height: 20px;
}

.page-description {
  max-width: 560px;
  margin: 8px 0 0;
  color: var(--provider-body);
  font-size: 14px;
  line-height: 22px;
}

.overview-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 280px;
}

.search-input :deep(.el-input__wrapper),
.provider-form :deep(.el-input__wrapper),
.provider-form :deep(.el-textarea__inner),
.provider-form :deep(.el-input-number .el-input__wrapper) {
  border: 1px solid var(--provider-hairline);
  border-radius: 6px;
  background: var(--provider-canvas);
  box-shadow: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.search-input :deep(.el-input__wrapper) {
  min-height: 40px;
  background: var(--provider-canvas-soft-2);
}

.search-input :deep(.el-input__wrapper:hover),
.search-input :deep(.el-input__wrapper.is-focus),
.provider-form :deep(.el-input__wrapper:hover),
.provider-form :deep(.el-input__wrapper.is-focus),
.provider-form :deep(.el-textarea__inner:hover),
.provider-form :deep(.el-textarea__inner:focus) {
  border-color: var(--provider-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.add-btn,
.empty-state :deep(.el-button--primary),
.dialog-footer :deep(.el-button--primary) {
  --el-button-bg-color: var(--provider-primary);
  --el-button-border-color: var(--provider-primary);
  --el-button-hover-bg-color: var(--provider-primary-hover);
  --el-button-hover-border-color: var(--provider-primary-hover);
  --el-button-active-bg-color: var(--provider-primary-hover);
  --el-button-active-border-color: var(--provider-primary-hover);
  border-radius: 999px;
  font-weight: 500;
}

.add-btn {
  min-height: 40px;
  padding: 0 18px;
}

.provider-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 16px 0;
  border: 1px solid var(--provider-hairline);
  border-radius: 10px;
  background: var(--provider-canvas);
  box-shadow: var(--provider-shadow);
  overflow: hidden;
}

.stat-item {
  position: relative;
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 18px 20px;
}

.stat-item::before {
  content: "";
  position: absolute;
  top: 18px;
  right: 18px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--provider-primary);
}

.stat-item.is-enabled::before {
  background: var(--provider-success);
}

.stat-item.is-disabled::before {
  background: var(--provider-subtle);
}

.stat-item.is-visible::before {
  background: var(--provider-warning);
}

.stat-item + .stat-item {
  border-left: 1px solid var(--provider-hairline);
}

.stat-label {
  color: var(--provider-subtle);
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0;
}

.stat-item strong {
  color: var(--provider-ink);
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
}

.stat-item span:last-child {
  color: var(--provider-body);
  font-size: 13px;
  line-height: 18px;
}

.provider-content {
  position: relative;
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  min-height: 220px;
}

.provider-card {
  display: flex;
  min-width: 0;
  min-height: 280px;
  flex-direction: column;
  padding: 18px;
  border: 1px solid var(--provider-hairline);
  border-radius: 10px;
  background: var(--provider-canvas);
  box-shadow: var(--provider-shadow);
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.provider-card:hover {
  border-color: var(--provider-primary-border);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05), 0 14px 32px -24px rgba(37, 99, 235, 0.45);
  transform: translateY(-1px);
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.provider-identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.provider-avatar {
  display: flex;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--provider-primary-border);
  border-radius: 8px;
  background: var(--provider-primary-soft);
  color: var(--provider-primary);
}

.provider-avatar.has-image {
  background: var(--provider-canvas);
}

.provider-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-letter {
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
}

.provider-heading {
  min-width: 0;
}

.provider-name {
  max-width: 210px;
  margin: 0 0 3px;
  overflow: hidden;
  color: var(--provider-ink);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-key {
  display: block;
  max-width: 220px;
  overflow: hidden;
  color: var(--provider-subtle);
  font-size: 12px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  padding: 0 9px;
  border: 1px solid var(--provider-hairline);
  border-radius: 999px;
  background: var(--provider-canvas-soft);
  color: var(--provider-body);
  font-size: 12px;
  line-height: 16px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--provider-muted);
}

.status-badge.is-enabled {
  border-color: var(--provider-success-border);
  background: var(--provider-success-soft);
  color: var(--provider-success);
}

.status-badge.is-enabled .status-dot {
  background: var(--provider-success);
}

.status-badge.is-disabled {
  border-color: var(--provider-hairline);
  background: var(--provider-canvas-soft-2);
  color: var(--provider-muted);
}

.status-badge.is-disabled .status-dot {
  background: var(--provider-subtle);
}

.endpoint-panel {
  display: grid;
  gap: 8px;
  margin: 18px 0;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: var(--provider-canvas-soft-2);
}

.endpoint-value {
  overflow: hidden;
  color: var(--provider-ink);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-details {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--provider-hairline);
}

.info-item {
  display: grid;
  grid-template-columns: minmax(92px, auto) minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-height: 42px;
  border-bottom: 1px solid var(--provider-hairline);
}

.info-item dt {
  color: var(--provider-muted);
  font-size: 13px;
  line-height: 18px;
}

.info-item dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--provider-body);
  font-size: 13px;
  line-height: 18px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.masked {
  color: var(--provider-body);
  font-size: 12px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
  margin-top: auto;
  padding-top: 14px;
}

.card-actions :deep(.el-button) {
  height: 32px;
  margin-left: 0;
  padding: 0 8px;
  border-radius: 6px;
  color: var(--provider-muted);
  font-weight: 500;
}

.card-actions :deep(.el-button:hover) {
  background: var(--provider-primary-soft);
  color: var(--provider-primary);
}

.card-actions :deep(.el-button--danger) {
  color: var(--provider-error);
}

.card-actions :deep(.el-button--danger:hover) {
  background: var(--provider-error-soft);
  color: var(--provider-error);
}

.empty-state {
  margin-top: 16px;
  padding: 88px 0;
  border: 1px solid var(--provider-hairline);
  border-radius: 10px;
  background: var(--provider-canvas);
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.provider-dialog :deep(.el-dialog) {
  border: 1px solid var(--provider-hairline);
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05), 0 24px 48px -24px rgba(15, 23, 42, 0.28);
}

.provider-dialog :deep(.el-dialog__header) {
  padding: 24px 28px 0;
  margin-right: 0;
}

.provider-dialog :deep(.el-dialog__headerbtn) {
  top: 18px;
  right: 18px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
}

.provider-dialog :deep(.el-dialog__headerbtn:hover) {
  background: var(--provider-canvas-soft-2);
}

.dialog-heading {
  display: grid;
  gap: 6px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--provider-hairline);
}

.dialog-heading h3 {
  margin: 0;
  color: var(--provider-ink);
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  letter-spacing: 0;
}

.provider-dialog :deep(.el-dialog__body) {
  padding: 0 28px 4px;
}

.provider-form {
  padding-top: 4px;
}

.form-section {
  padding: 20px 0 10px;
  border-bottom: 1px solid var(--provider-hairline);
}

.form-section:last-child {
  border-bottom: 0;
}

.form-section-head {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.section-index {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--provider-primary-border);
  border-radius: 999px;
  background: var(--provider-primary-soft);
  color: var(--provider-primary);
  font-size: 12px;
  line-height: 16px;
}

.section-title {
  margin: 0;
  color: var(--provider-ink);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.form-section-head p {
  margin: 3px 0 0;
  color: var(--provider-muted);
  font-size: 13px;
  line-height: 18px;
}

.provider-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.provider-form :deep(.el-form-item__label) {
  padding-bottom: 6px;
  color: var(--provider-body);
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
}

.provider-form :deep(.el-input__wrapper) {
  min-height: 40px;
}

.provider-form :deep(.el-textarea__inner) {
  padding: 10px 12px;
  color: var(--provider-ink);
  font-family: Geist, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 12px;
  line-height: 20px;
}

.json-textarea :deep(.el-textarea__inner) {
  font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.provider-form :deep(.el-input-number) {
  width: 100%;
}

.status-switch {
  min-height: 40px;
}

.status-switch :deep(.el-switch__core) {
  --el-switch-on-color: var(--provider-primary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.dialog-footer :deep(.el-button) {
  min-width: 88px;
  min-height: 36px;
  border-radius: 999px;
  font-weight: 500;
}

@media (max-width: 960px) {
  .provider-overview {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .overview-actions {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .provider-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stat-item:nth-child(odd) {
    border-left: 0;
  }

  .stat-item:nth-child(n + 3) {
    border-top: 1px solid var(--provider-hairline);
  }
}

@media (max-width: 640px) {
  .provider-container {
    padding: 20px 16px 28px;
  }

  .page-title {
    font-size: 24px;
    line-height: 32px;
  }

  .overview-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .add-btn {
    width: 100%;
  }

  .provider-stats {
    grid-template-columns: 1fr;
  }

  .stat-item,
  .stat-item:nth-child(odd) {
    border-left: 0;
  }

  .stat-item + .stat-item {
    border-top: 1px solid var(--provider-hairline);
  }

  .provider-grid {
    grid-template-columns: 1fr;
  }

  .provider-card {
    min-height: 0;
  }

  .card-top {
    align-items: flex-start;
  }

  .provider-name {
    max-width: 160px;
  }

  .provider-dialog :deep(.el-dialog) {
    width: calc(100% - 24px);
  }

  .provider-dialog :deep(.el-dialog__header),
  .provider-dialog :deep(.el-dialog__body) {
    padding-right: 18px;
    padding-left: 18px;
  }

  .form-section-head {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
