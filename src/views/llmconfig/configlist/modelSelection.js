export const CHAT_MODEL_SELECTION_CACHE_KEY = 'casego:chat:model-selection'
export const DEFAULT_THINKING_LEVEL = 'xhigh'

const hasSelectableModels = provider => Array.isArray(provider?.models) && provider.models.length > 0

const pickProvider = (providers, providerKey) => {
  const exact = providers.find(item => item.key === providerKey && hasSelectableModels(item))
  return exact || providers.find(hasSelectableModels) || null
}

const pickModel = (provider, model) => {
  const models = provider?.models || []
  if (!models.length) return ''
  if (model && models.includes(model)) return model
  if (provider.defaultModel && models.includes(provider.defaultModel)) return provider.defaultModel
  return models[0]
}

const pickThinkingLevel = (levels, preferredLevel) => {
  if (!levels.length) return preferredLevel || DEFAULT_THINKING_LEVEL
  if (preferredLevel && levels.includes(preferredLevel)) return preferredLevel
  return levels.includes(DEFAULT_THINKING_LEVEL) ? DEFAULT_THINKING_LEVEL : levels[0]
}

export const shouldShowThinkingControl = ({ provider, model } = {}) => {
  const providerModels = Array.isArray(provider?.models) ? provider.models : []
  return Boolean(model || providerModels.length)
}

export const resolveModelSelection = ({
  providers,
  preference = {},
  current = {},
}) => {
  const normalizedProviders = Array.isArray(providers) ? providers : []
  const cachedPreference = preference && typeof preference === 'object' ? preference : {}
  const currentSelection = current && typeof current === 'object' ? current : {}
  const provider = pickProvider(
    normalizedProviders,
    cachedPreference.providerKey || currentSelection.providerKey,
  )

  if (!provider) {
    return {
      providerKey: '',
      model: '',
      enableThinking: false,
      thinkingLevel: cachedPreference.thinkingLevel || currentSelection.thinkingLevel || DEFAULT_THINKING_LEVEL,
    }
  }

  const model = pickModel(
    provider,
    provider.key === cachedPreference.providerKey ? cachedPreference.model : currentSelection.model,
  )
  const rawLevels = Array.isArray(provider.thinkingLevels) ? provider.thinkingLevels : []
  const models = provider.models || []
  const validPreference = provider.key === cachedPreference.providerKey && models.includes(cachedPreference.model)
  const validCurrent = provider.key === currentSelection.providerKey && models.includes(currentSelection.model)
  const source = validPreference ? cachedPreference : (validCurrent ? currentSelection : {})
  const thinkingLevel = pickThinkingLevel(rawLevels, source.thinkingLevel)

  return {
    providerKey: provider.key,
    model,
    enableThinking: Boolean(rawLevels.length),
    thinkingLevel,
  }
}
