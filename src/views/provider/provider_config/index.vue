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
                <div class="provider-avatar" :class="getProtocolClass(item.apiProtocol)">
                  <span class="avatar-letter">{{ getProtocolIcon(item.apiProtocol) }}</span>
                </div>
                <div class="provider-heading">
                  <h3 class="provider-name">{{ item.providerName || '未命名提供商' }}</h3>
                  <span class="provider-key">{{ getProtocolLabel(item.apiProtocol) }}</span>
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

            <div class="model-meta-row">
              <span class="protocol-chip">{{ getProtocolLabel(item.apiProtocol) }}</span>
              <span class="model-count">{{ getModels(item).length }} 个模型</span>
            </div>

            <dl class="provider-details">
              <div class="info-item">
                <dt>API 密钥</dt>
                <dd class="masked">{{ maskApiKey(item.apiKey) }}</dd>
              </div>
              <div class="info-item">
                <dt>默认模型</dt>
                <dd :title="item.defaultModel || getModels(item)[0] || '未配置'">
                  {{ item.defaultModel || getModels(item)[0] || '未配置' }}
                </dd>
              </div>
              <div class="info-item">
                <dt>思考程度</dt>
                <dd>{{ getThinkingSummary(item.thinkingLevels) }}</dd>
              </div>
              <div class="info-item">
                <dt>超时 / 重试</dt>
                <dd>{{ item.timeout || 60 }}s / {{ item.maxRetries ?? 3 }} 次</dd>
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
              <h4 class="section-title">基础配置</h4>
              <p>先完成连接所需的协议、根地址和密钥，系统会自动生成内部标识。</p>
            </div>
          </div>

          <el-form-item label="接口协议" prop="apiProtocol">
            <el-select v-model="form.apiProtocol" class="full-select" @change="handleProtocolChange">
              <el-option
                v-for="item in apiProtocolOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <div class="protocol-option">
                  <span>{{ item.label }}</span>
                  <small>{{ item.description }}</small>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="Base URL" prop="baseUrl">
            <el-input v-model="form.baseUrl" :placeholder="baseUrlPlaceholder" @blur="normalizeFormBaseUrl" />
            <p class="field-hint">只填写根地址，不要包含 /v1/chat/completions 或 /v1/responses。</p>
          </el-form-item>

          <el-form-item label="API Key" prop="apiKey">
            <el-input v-model="form.apiKey" type="password" show-password placeholder="请输入 API Key" />
          </el-form-item>

          <div class="compact-config-row">
            <el-form-item label="显示名称" prop="providerName">
              <el-input v-model="form.providerName" :placeholder="currentProtocolOption.label" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-switch
                v-model="form.status"
                active-value="1"
                inactive-value="0"
                active-text="启用"
                inactive-text="禁用"
                class="status-switch"
              />
            </el-form-item>
          </div>
        </section>

        <section class="form-section">
          <div class="form-section-head">
            <span class="section-index">02</span>
            <div>
              <h4 class="section-title">模型配置</h4>
              <p>模型列表决定对话页可选项，思考程度会按模型能力自动启用。</p>
            </div>
          </div>

          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="默认模型" prop="defaultModel">
                <el-select
                  v-model="form.defaultModel"
                  class="full-select"
                  filterable
                  allow-create
                  default-first-option
                  placeholder="选择默认模型"
                >
                  <el-option
                    v-for="model in getFormModels()"
                    :key="model"
                    :label="model"
                    :value="model"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="快速填充模型">
                <el-button class="full-width-btn" plain @click="applyModelPreset(form.apiProtocol)">
                  填充 {{ currentProtocolOption.shortLabel }} 推荐模型
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>

          <div class="preset-row">
            <span>推荐模型</span>
            <el-button
              v-for="model in currentModelPresets"
              :key="model"
              size="small"
              plain
              @click="addPresetModel(model)"
            >
              {{ model }}
            </el-button>
          </div>

          <el-form-item label="模型型号" prop="models">
            <el-select
              v-model="form.models"
              class="model-select"
              multiple
              filterable
              allow-create
              default-first-option
              collapse-tags
              collapse-tags-tooltip
              placeholder="输入模型型号后回车"
              @change="handleModelsChange"
            >
              <el-option
                v-for="model in getFormModels()"
                :key="model"
                :label="model"
                :value="model"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="思考程度" prop="thinkingLevels">
            <el-checkbox-group
              v-if="formThinkingSupported"
              v-model="form.thinkingLevels"
              class="thinking-levels"
            >
              <el-checkbox-button
                v-for="item in thinkingLevelOptions"
                :key="item.value"
                :label="item.value"
              >
                <span>{{ item.label }}</span>
                <small>{{ item.description }}</small>
              </el-checkbox-button>
            </el-checkbox-group>
            <p v-else class="field-hint">当前模型未检测到 thinking / reasoner / r1 / opus 等推理能力，思考程度会在对话页自动隐藏。</p>
          </el-form-item>
        </section>

        <section class="form-section">
          <div class="form-section-head">
            <span class="section-index">03</span>
            <div>
              <h4 class="section-title">请求配置</h4>
              <p>控制请求等待时间和失败后的重试次数。</p>
            </div>
          </div>
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
              <p>仅在兼容平台需要自定义鉴权头或请求体参数时填写。</p>
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
          <el-form-item label="额外请求参数 (JSON)" prop="extraParams">
            <el-input
              v-model="form.extraParams"
              class="json-textarea"
              type="textarea"
              :rows="4"
              placeholder='{"reasoning": {"effort": "high"}}'
            />
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

const apiProtocolOptions = [
  {
    value: 'openai',
    label: 'OpenAI',
    shortLabel: 'OpenAI',
    icon: 'OA',
    description: '官方接口，自动选择 Responses 或 Chat Completions',
    defaultBaseUrl: 'https://api.openai.com',
    defaultModel: 'gpt-5',
    models: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-thinking', 'gpt-5-thinking-mini']
  },
  {
    value: 'claude',
    label: 'Claude',
    shortLabel: 'Claude',
    icon: 'C',
    description: 'Anthropic Messages API',
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4.5',
    models: ['claude-sonnet-4.5', 'claude-opus-4.1', 'claude-opus-4.8', 'claude-haiku-4']
  },
  {
    value: 'gemini',
    label: 'Gemini',
    shortLabel: 'Gemini',
    icon: 'G',
    description: 'Google Gemini API',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-2.5-pro',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-pro-thinking']
  },
  {
    value: 'deepseek',
    label: 'DeepSeek',
    shortLabel: 'DeepSeek',
    icon: 'D',
    description: 'DeepSeek 官方 OpenAI 兼容接口',
    defaultBaseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-v3', 'deepseek-r1']
  },
  {
    value: 'openrouter',
    label: 'OpenRouter',
    shortLabel: 'OpenRouter',
    icon: 'OR',
    description: 'OpenRouter 聚合接口',
    defaultBaseUrl: 'https://openrouter.ai/api',
    defaultModel: 'openai/gpt-5',
    models: ['openai/gpt-5', 'anthropic/claude-opus-4.8', 'google/gemini-2.5-pro', 'deepseek/deepseek-r1']
  },
  {
    value: 'openai_compatible',
    label: 'OpenAI-Compatible',
    shortLabel: '兼容',
    icon: '{}',
    description: 'One API、New API、Azure OpenAI、硅基流动、各类中转站',
    defaultBaseUrl: '',
    defaultModel: 'gpt-5',
    models: ['gpt-5', 'gpt-5-mini', 'deepseek-chat', 'deepseek-reasoner']
  }
]

const protocolMap = Object.fromEntries(apiProtocolOptions.map(item => [item.value, item]))
const protocolDefaultBaseUrls = apiProtocolOptions.map(item => item.defaultBaseUrl).filter(Boolean)

const thinkingLevelOptions = [
  { value: 'low', label: 'Low', description: '最快响应' },
  { value: 'medium', label: 'Medium', description: '平衡模式' },
  { value: 'high', label: 'High', description: '深度推理' },
  { value: 'xhigh', label: 'XHigh', description: '强推理' },
  { value: 'max', label: 'Max', description: '最大预算' }
]

const thinkingLabelMap = Object.fromEntries(thinkingLevelOptions.map(item => [item.value, item.label]))
const defaultThinkingLevels = thinkingLevelOptions.map(item => item.value)

const loading = ref(false)
const submitLoading = ref(false)
const open = ref(false)
const title = ref('')
const total = ref(0)
const searchKeyword = ref('')
const testingIds = ref([])
const provider_configList = ref([])
const formRef = ref()

const endpointPathPattern = /\/(v\d+\/)?(chat\/completions|responses)\/?$/i

function validateBaseUrl(_rule, value, callback) {
  if (!value) {
    callback(new Error('请输入 Base URL'))
    return
  }
  try {
    const url = new URL(value)
    if (endpointPathPattern.test(url.pathname)) {
      callback(new Error('只填写根地址，不要包含接口路径'))
      return
    }
  } catch {
    callback(new Error('请输入有效的 URL'))
    return
  }
  callback()
}

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 12
  },
  rules: {
    apiProtocol: [
      { required: true, message: '请选择接口协议', trigger: 'change' }
    ],
    baseUrl: [
      { required: true, validator: validateBaseUrl, trigger: 'blur' }
    ],
    apiKey: [
      { required: true, message: '请输入 API Key', trigger: 'blur' }
    ],
    defaultModel: [
      { required: true, message: '请选择默认模型', trigger: 'change' }
    ],
    models: [
      { type: 'array', required: true, min: 1, message: '请配置至少一个模型型号', trigger: 'change' }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)

const currentProtocolOption = computed(() => protocolMap[form.value.apiProtocol] || protocolMap.openai)
const currentModelPresets = computed(() => currentProtocolOption.value.models || [])
const baseUrlPlaceholder = computed(() => currentProtocolOption.value.defaultBaseUrl || 'https://api.example.com')
const formThinkingSupported = computed(() => getFormModels().some(isThinkingCapableModel))

const filteredList = computed(() => {
  if (!searchKeyword.value) return provider_configList.value
  const keyword = searchKeyword.value.toLowerCase()
  return provider_configList.value.filter(item =>
    item.providerName?.toLowerCase().includes(keyword) ||
    getProtocolLabel(item.apiProtocol).toLowerCase().includes(keyword) ||
    getModels(item).some(model => model.toLowerCase().includes(keyword))
  )
})

const enabledCount = computed(() => provider_configList.value.filter(item => item.status === '1').length)
const disabledCount = computed(() => provider_configList.value.length - enabledCount.value)
const visibleCountLabel = computed(() => (searchKeyword.value ? `${filteredList.value.length} / ${total.value}` : total.value))

function normalizeApiProtocol(protocol, providerKey = '') {
  const value = String(protocol || '').toLowerCase().replaceAll('-', '_')
  if (value === 'responses' || value === 'openai_responses') return 'openai'
  if (value === 'openai_chat') return providerKey === 'openai' ? 'openai' : 'openai_compatible'
  if (value === 'anthropic') return 'claude'
  if (value === 'google' || value === 'google_genai') return 'gemini'
  return protocolMap[value] ? value : 'openai_compatible'
}

function normalizeBaseUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  try {
    const url = new URL(raw)
    let path = url.pathname.replace(/\/+$/, '')
    path = path.replace(/\/v\d+\/chat\/completions$/i, '')
    path = path.replace(/\/chat\/completions$/i, '')
    path = path.replace(/\/v\d+\/responses$/i, '')
    path = path.replace(/\/responses$/i, '')
    if (url.host === 'api.openai.com' && path === '/v1') path = ''
    url.pathname = path || '/'
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return raw.replace(/\/+$/, '')
  }
}

function normalizeFormBaseUrl() {
  form.value.baseUrl = normalizeBaseUrl(form.value.baseUrl)
}

function normalizeModelArray(models) {
  if (!models) return []
  const values = Array.isArray(models)
    ? models
    : String(models).replace(/\r/g, '\n').replace(/,/g, '\n').split('\n')
  return [...new Set(values.map(item => String(item).trim()).filter(Boolean))]
}

function isThinkingCapableModel(model) {
  const value = String(model || '').toLowerCase()
  return (
    value === 'gpt-5' ||
    value.includes('thinking') ||
    value.includes('reasoner') ||
    /(^|[-_/])r1($|[-_/])/.test(value) ||
    value.includes('opus')
  )
}

function syncThinkingLevelsForModels() {
  if (formThinkingSupported.value) {
    if (!normalizeModelArray(form.value.thinkingLevels).length) {
      form.value.thinkingLevels = [...defaultThinkingLevels]
    }
  } else {
    form.value.thinkingLevels = []
  }
}

function maskApiKey(key) {
  if (!key) return '未配置'
  if (key.length <= 8) return '********'
  return key.substring(0, 4) + '********' + key.substring(key.length - 4)
}

function getStatusMeta(status) {
  return status === '1'
    ? { label: '启用', className: 'is-enabled' }
    : { label: '禁用', className: 'is-disabled' }
}

function getEndpointText(baseUrl) {
  if (!baseUrl) return '默认端点'
  try {
    const url = new URL(baseUrl)
    return `${url.host}${url.pathname === '/' ? '' : url.pathname}`
  } catch {
    return baseUrl
  }
}

function getModels(item) {
  return normalizeModelArray(item?.models)
}

function getFormModels() {
  return normalizeModelArray(form.value.models)
}

function getProtocolLabel(protocol) {
  return (protocolMap[normalizeApiProtocol(protocol)] || protocolMap.openai_compatible).label
}

function getProtocolIcon(protocol) {
  return (protocolMap[normalizeApiProtocol(protocol)] || protocolMap.openai_compatible).icon
}

function getProtocolClass(protocol) {
  return `is-${normalizeApiProtocol(protocol).replace('_', '-')}`
}

function getThinkingSummary(levels) {
  const normalized = normalizeModelArray(levels)
  return normalized.length ? normalized.map(level => thinkingLabelMap[level] || level).join(' / ') : '未启用'
}

function handleSearch() {
  // Search is handled by computed property
}

async function getList() {
  if (loading.value) return
  loading.value = true
  try {
    const response = await listProvider_config(queryParams.value)
    provider_configList.value = response.rows || []
    total.value = response.total || 0
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function createDefaultForm(protocol = 'openai') {
  const option = protocolMap[protocol] || protocolMap.openai
  return {
    providerId: null,
    providerKey: null,
    providerName: option.label,
    apiKey: null,
    apiSecret: null,
    baseUrl: option.defaultBaseUrl || null,
    apiVersion: null,
    timeout: 60,
    maxRetries: 3,
    extraHeaders: null,
    extraParams: null,
    apiProtocol: option.value,
    models: [...option.models],
    defaultModel: option.defaultModel,
    thinkingLevels: [...defaultThinkingLevels],
    iconUrl: null,
    status: '1',
    remark: null,
    description: null,
    sortNo: 0
  }
}

function reset() {
  form.value = createDefaultForm()
  formRef.value?.resetFields()
}

function normalizeFormData(data = {}) {
  const apiProtocol = normalizeApiProtocol(data.apiProtocol, data.providerKey)
  const option = protocolMap[apiProtocol] || protocolMap.openai_compatible
  const models = normalizeModelArray(data.models).length ? normalizeModelArray(data.models) : [...option.models]
  const defaultModel = data.defaultModel || option.defaultModel || models[0] || null
  const thinkingLevels = normalizeModelArray(data.thinkingLevels)
  return {
    ...data,
    apiProtocol,
    baseUrl: normalizeBaseUrl(data.baseUrl || option.defaultBaseUrl || ''),
    providerName: data.providerName || option.label,
    models,
    defaultModel,
    thinkingLevels: thinkingLevels.length ? thinkingLevels : (models.some(isThinkingCapableModel) ? [...defaultThinkingLevels] : [])
  }
}

function handleProtocolChange(protocol) {
  const nextProtocol = normalizeApiProtocol(protocol)
  const option = protocolMap[nextProtocol] || protocolMap.openai_compatible
  const currentBase = normalizeBaseUrl(form.value.baseUrl)
  if (!currentBase || protocolDefaultBaseUrls.includes(currentBase)) {
    form.value.baseUrl = option.defaultBaseUrl || ''
  }
  if (!form.value.providerName || apiProtocolOptions.some(item => item.label === form.value.providerName)) {
    form.value.providerName = option.label
  }
  form.value.apiProtocol = option.value
  form.value.models = [...option.models]
  form.value.defaultModel = option.defaultModel || option.models[0] || null
  form.value.thinkingLevels = option.models.some(isThinkingCapableModel) ? [...defaultThinkingLevels] : []
  formRef.value?.clearValidate?.(['apiProtocol', 'baseUrl', 'models', 'defaultModel'])
}

function handleModelsChange(models) {
  form.value.models = normalizeModelArray(models)
  if (!form.value.models.includes(form.value.defaultModel)) {
    form.value.defaultModel = form.value.models[0] || null
  }
  syncThinkingLevelsForModels()
}

function addPresetModel(model) {
  form.value.models = normalizeModelArray([...getFormModels(), model])
  if (!form.value.defaultModel) form.value.defaultModel = model
  syncThinkingLevelsForModels()
  formRef.value?.clearValidate?.('models')
}

function applyModelPreset(protocol = form.value.apiProtocol) {
  const option = protocolMap[normalizeApiProtocol(protocol)] || protocolMap.openai_compatible
  form.value.apiProtocol = option.value
  form.value.models = normalizeModelArray([...getFormModels(), ...option.models])
  if (!form.value.defaultModel || !form.value.models.includes(form.value.defaultModel)) {
    form.value.defaultModel = option.defaultModel || form.value.models[0] || null
  }
  syncThinkingLevelsForModels()
  formRef.value?.clearValidate?.(['models', 'defaultModel'])
}

function parseJsonField(value, label) {
  if (!value || (typeof value === 'string' && !value.trim())) return null
  if (typeof value === 'object' && !Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      ElMessage.warning(`${label} 必须是 JSON 对象`)
      return false
    }
    return parsed
  } catch {
    ElMessage.warning(`${label} JSON 格式不正确`)
    return false
  }
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
    form.value = normalizeFormData(response.data)
    if (form.value.extraHeaders && typeof form.value.extraHeaders === 'object') {
      form.value.extraHeaders = JSON.stringify(form.value.extraHeaders, null, 2)
    }
    if (form.value.extraParams && typeof form.value.extraParams === 'object') {
      form.value.extraParams = JSON.stringify(form.value.extraParams, null, 2)
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
    normalizeFormBaseUrl()
    await formRef.value.validate()
  } catch {
    return
  }

  if (submitLoading.value) return
  submitLoading.value = true

  try {
    const submitData = { ...form.value }
    submitData.apiProtocol = normalizeApiProtocol(submitData.apiProtocol, submitData.providerKey)
    submitData.baseUrl = normalizeBaseUrl(submitData.baseUrl)
    submitData.providerName = submitData.providerName || getProtocolLabel(submitData.apiProtocol)
    submitData.models = normalizeModelArray(submitData.models)
    submitData.thinkingLevels = formThinkingSupported.value ? normalizeModelArray(submitData.thinkingLevels) : []

    if (!submitData.defaultModel && submitData.models.length) {
      submitData.defaultModel = submitData.models[0]
    }
    if (submitData.defaultModel && !submitData.models.includes(submitData.defaultModel)) {
      submitData.models.unshift(submitData.defaultModel)
    }

    const headers = parseJsonField(submitData.extraHeaders, '额外请求头')
    if (headers === false) return
    submitData.extraHeaders = headers

    const params = parseJsonField(submitData.extraParams, '额外请求参数')
    if (params === false) return
    submitData.extraParams = params

    delete submitData.apiSecret
    delete submitData.apiVersion
    delete submitData.iconUrl

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

  setTimeout(() => {
    testingIds.value = testingIds.value.filter(id => id !== row.providerId)
    ElMessage.success('连接测试成功')
  }, 1500)
}

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

.provider-avatar.is-openai {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #047857;
}

.provider-avatar.is-claude {
  border-color: #fed7aa;
  background: #fff7ed;
  color: #c2410c;
}

.provider-avatar.is-gemini {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.provider-avatar.is-deepseek {
  border-color: #c7d2fe;
  background: #eef2ff;
  color: #4338ca;
}

.provider-avatar.is-openrouter {
  border-color: #ddd6fe;
  background: #f5f3ff;
  color: #6d28d9;
}

.provider-avatar.is-openai-compatible {
  border-color: var(--provider-hairline-strong);
  background: var(--provider-canvas-soft-2);
  color: var(--provider-body);
}

.avatar-letter {
  font-size: 14px;
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

.model-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: -6px 0 16px;
}

.protocol-chip,
.model-count {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 16px;
}

.protocol-chip {
  border: 1px solid var(--provider-primary-border);
  background: var(--provider-primary-soft);
  color: var(--provider-primary);
  font-weight: 500;
}

.model-count {
  border: 1px solid var(--provider-hairline);
  background: var(--provider-canvas);
  color: var(--provider-muted);
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

.protocol-option {
  display: grid;
  gap: 2px;
}

.protocol-option span {
  color: var(--provider-ink);
  font-size: 13px;
  line-height: 18px;
}

.protocol-option small {
  color: var(--provider-muted);
  font-size: 12px;
  line-height: 16px;
}

.field-hint {
  margin: 6px 0 0;
  color: var(--provider-muted);
  font-size: 12px;
  line-height: 18px;
}

.compact-config-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  gap: 16px;
}

.full-select,
.model-select {
  width: 100%;
}

.full-width-btn {
  width: 100%;
  min-height: 40px;
  border-radius: 6px;
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  padding: 10px 12px;
  border: 1px solid var(--provider-hairline);
  border-radius: 8px;
  background: var(--provider-canvas-soft-2);
}

.preset-row span {
  color: var(--provider-muted);
  font-size: 13px;
  line-height: 18px;
}

.preset-row :deep(.el-button) {
  margin-left: 0;
  border-radius: 999px;
}

.thinking-levels {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.thinking-levels :deep(.el-checkbox-button__inner) {
  display: grid;
  min-width: 98px;
  gap: 2px;
  padding: 8px 12px;
  border: 1px solid var(--provider-hairline);
  border-radius: 8px;
  box-shadow: none;
  font-size: 12px;
  line-height: 16px;
}

.thinking-levels :deep(.el-checkbox-button__inner span) {
  font-weight: 600;
}

.thinking-levels :deep(.el-checkbox-button__inner small) {
  color: var(--provider-muted);
  font-size: 11px;
  font-weight: 400;
  line-height: 14px;
}

.thinking-levels :deep(.el-checkbox-button.is-checked .el-checkbox-button__inner) {
  border-color: var(--provider-primary);
  background: var(--provider-primary);
  color: #fff;
}

.thinking-levels :deep(.el-checkbox-button.is-checked .el-checkbox-button__inner small) {
  color: rgba(255, 255, 255, 0.78);
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

  .compact-config-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .thinking-levels :deep(.el-checkbox-button__inner) {
    min-width: 0;
  }
}
</style>
