import assert from 'node:assert/strict'

import {
  resolveModelSelection,
  shouldShowThinkingControl,
} from '../src/views/llmconfig/configlist/modelSelection.js'

const providers = [
  {
    key: 'openai',
    models: ['gpt-5', 'gpt-5-mini'],
    defaultModel: 'gpt-5',
    thinkingLevels: ['low', 'medium', 'high', 'xhigh'],
  },
  {
    key: 'deepseek',
    models: ['deepseek-chat', 'deepseek-r1'],
    defaultModel: 'deepseek-chat',
    thinkingLevels: ['low', 'high', 'xhigh', 'max'],
  },
]

const supportsThinking = model => String(model).includes('r1') || String(model).includes('gpt-5')

assert.deepEqual(
  resolveModelSelection({
    providers,
    preference: {
      providerKey: 'deepseek',
      model: 'deepseek-r1',
      enableThinking: false,
      thinkingLevel: 'xhigh',
    },
    modelSupportsThinking: supportsThinking,
  }),
  {
    providerKey: 'deepseek',
    model: 'deepseek-r1',
    enableThinking: true,
    thinkingLevel: 'xhigh',
  },
)

assert.equal(
  shouldShowThinkingControl({
    provider: {
      key: 'openai',
      models: ['gpt-4.1'],
      thinkingLevels: [],
    },
    model: 'gpt-4.1',
  }),
  true,
)

assert.equal(
  shouldShowThinkingControl({
    provider: {
      key: 'empty',
      models: [],
      thinkingLevels: [],
    },
    model: '',
  }),
  false,
)

assert.deepEqual(
  resolveModelSelection({
    providers,
    preference: {
      providerKey: 'deepseek',
      model: 'deepseek-r1',
      enableThinking: true,
      thinkingLevel: 'max',
    },
    modelSupportsThinking: supportsThinking,
  }),
  {
    providerKey: 'deepseek',
    model: 'deepseek-r1',
    enableThinking: true,
    thinkingLevel: 'max',
  },
)

assert.deepEqual(
  resolveModelSelection({
    providers,
    preference: {
      providerKey: 'deleted-provider',
      model: 'deleted-model',
      enableThinking: true,
      thinkingLevel: 'max',
    },
    modelSupportsThinking: supportsThinking,
  }),
  {
    providerKey: 'openai',
    model: 'gpt-5',
    enableThinking: true,
    thinkingLevel: 'xhigh',
  },
)

assert.deepEqual(
  resolveModelSelection({
    providers: [
      { key: 'empty', models: [], defaultModel: '', thinkingLevels: [] },
      ...providers,
    ],
    preference: {
      providerKey: 'empty',
      model: 'missing',
      enableThinking: false,
      thinkingLevel: 'low',
    },
    modelSupportsThinking: supportsThinking,
  }),
  {
    providerKey: 'openai',
    model: 'gpt-5',
    enableThinking: true,
    thinkingLevel: 'xhigh',
  },
)

assert.deepEqual(
  resolveModelSelection({
    providers: [
      {
        key: 'custom',
        models: ['deepseek-ai/DeepSeek-V4-Pro'],
        defaultModel: 'deepseek-ai/DeepSeek-V4-Pro',
        thinkingLevels: ['low', 'high', 'xhigh', 'max'],
      },
    ],
    preference: null,
    current: {},
    modelSupportsThinking: () => false,
  }),
  {
    providerKey: 'custom',
    model: 'deepseek-ai/DeepSeek-V4-Pro',
    enableThinking: true,
    thinkingLevel: 'xhigh',
  },
)
