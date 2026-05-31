import assert from 'node:assert/strict'

import {
  buildProviderCopyPayload,
  defaultThinkingLevels,
  normalizeThinkingLevels,
  protocolSupportsThinking,
  resolveThinkingLevels,
} from '../src/views/provider/provider_config/providerForm.js'

assert.deepEqual(defaultThinkingLevels, ['low', 'medium', 'high', 'xhigh', 'max'])

assert.deepEqual(resolveThinkingLevels(null), defaultThinkingLevels)
assert.deepEqual(resolveThinkingLevels([]), defaultThinkingLevels)
assert.deepEqual(resolveThinkingLevels(['xhigh']), ['xhigh'])

assert.deepEqual(
  normalizeThinkingLevels(['low', 'bad', 'xhigh', 'low', 'max']),
  ['low', 'xhigh', 'max'],
)

assert.equal(protocolSupportsThinking('openai_chat'), true)
assert.equal(protocolSupportsThinking('responses'), true)
assert.equal(protocolSupportsThinking(''), false)

const copied = buildProviderCopyPayload({
  providerId: 12,
  providerKey: 'existing-key',
  providerName: 'OpenAI Chat',
  apiProtocol: 'openai_chat',
  baseUrl: 'https://api.openai.com/v1/chat/completions',
  apiKey: 'sk-test',
  apiSecret: 'deprecated',
  apiVersion: 'deprecated',
  iconUrl: 'https://example.com/icon.png',
  models: ['gpt-4.1'],
  defaultModel: 'gpt-4.1',
  thinkingLevels: [],
  extraHeaders: { 'X-Test': '1' },
  extraParams: { seed: 1 },
  createBy: 'admin',
  createTime: '2026-05-31T00:00:00',
  updateBy: 'admin',
  updateTime: '2026-05-31T00:00:00',
  delFlag: '0',
}, {
  normalizeApiProtocol: protocol => protocol,
  normalizeBaseUrl: value => value.replace('/v1/chat/completions', ''),
  normalizeModelArray: models => models,
})

assert.equal(copied.providerId, null)
assert.equal(copied.providerKey, null)
assert.equal(copied.providerName, 'OpenAI Chat COPY')
assert.equal(copied.baseUrl, 'https://api.openai.com')
assert.deepEqual(copied.thinkingLevels, defaultThinkingLevels)
assert.deepEqual(copied.models, ['gpt-4.1'])
assert.equal('apiSecret' in copied, false)
assert.equal('apiVersion' in copied, false)
assert.equal('iconUrl' in copied, false)
assert.equal('createTime' in copied, false)
assert.equal('updateTime' in copied, false)
