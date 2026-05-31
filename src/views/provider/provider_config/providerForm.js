export const thinkingLevelOptions = [
  { value: 'low', label: 'Low', description: '最快响应' },
  { value: 'medium', label: 'Medium', description: '平衡模式' },
  { value: 'high', label: 'High', description: '深度推理' },
  { value: 'xhigh', label: 'XHigh', description: '强推理' },
  { value: 'max', label: 'Max', description: '最大预算' },
]

export const defaultThinkingLevels = thinkingLevelOptions.map(item => item.value)

const thinkingLevelSet = new Set(defaultThinkingLevels)

export function normalizeThinkingLevels(levels) {
  if (!levels) return []
  const values = Array.isArray(levels)
    ? levels
    : String(levels).replace(/\r/g, '\n').replace(/,/g, '\n').split('\n')

  return [...new Set(values.map(item => String(item).trim()).filter(item => thinkingLevelSet.has(item)))]
}

export function resolveThinkingLevels(levels) {
  const normalized = normalizeThinkingLevels(levels)
  return normalized.length ? normalized : [...defaultThinkingLevels]
}

export function protocolSupportsThinking(protocol) {
  return Boolean(String(protocol || '').trim())
}

export function buildProviderCopyPayload(source = {}, helpers = {}) {
  const {
    normalizeApiProtocol = protocol => protocol,
    normalizeBaseUrl = value => value,
    normalizeModelArray = models => (Array.isArray(models) ? models : []),
  } = helpers

  const apiProtocol = normalizeApiProtocol(source.apiProtocol, source.providerKey)
  const providerName = String(source.providerName || '未命名提供商').trim() || '未命名提供商'
  const payload = {
    ...source,
    providerId: null,
    providerKey: null,
    providerName: `${providerName} COPY`,
    apiProtocol,
    baseUrl: normalizeBaseUrl(source.baseUrl || ''),
    models: normalizeModelArray(source.models),
    thinkingLevels: protocolSupportsThinking(apiProtocol)
      ? resolveThinkingLevels(source.thinkingLevels)
      : [],
  }

  delete payload.apiSecret
  delete payload.apiVersion
  delete payload.iconUrl
  delete payload.createBy
  delete payload.createTime
  delete payload.updateBy
  delete payload.updateTime
  delete payload.delFlag

  return payload
}
