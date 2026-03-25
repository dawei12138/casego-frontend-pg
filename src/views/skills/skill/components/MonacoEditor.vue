<template>
  <div ref="containerRef" class="monaco-editor-wrap" />
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}

const props = defineProps({
  modelValue: { type: String, default: '' },
  language: { type: String, default: 'plaintext' },
  theme: { type: String, default: 'vs-dark' },
  readOnly: { type: Boolean, default: false },
  filePath: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref()
const editor = shallowRef(null)
let ignoreChange = false

const EXT_LANG_MAP = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  json: 'json', jsonc: 'json',
  md: 'markdown', mdx: 'markdown',
  yaml: 'yaml', yml: 'yaml',
  xml: 'xml', svg: 'xml',
  html: 'html', htm: 'html',
  css: 'css', scss: 'scss', less: 'less',
  py: 'python',
  sh: 'shell', bash: 'shell', zsh: 'shell',
  sql: 'sql',
  java: 'java',
  go: 'go',
  rs: 'rust',
  rb: 'ruby',
  php: 'php',
  c: 'c', h: 'c',
  cpp: 'cpp', cxx: 'cpp', hpp: 'cpp',
  txt: 'plaintext', log: 'plaintext',
  dockerfile: 'dockerfile',
  ini: 'ini', conf: 'ini', cfg: 'ini',
  toml: 'plaintext'
}

const detectLanguage = (filePath) => {
  if (!filePath) return props.language
  const name = filePath.split('/').pop().toLowerCase()
  if (name === 'dockerfile') return 'dockerfile'
  if (name === 'makefile') return 'plaintext'
  const ext = name.includes('.') ? name.split('.').pop() : ''
  return EXT_LANG_MAP[ext] || props.language
}

onMounted(() => {
  const lang = detectLanguage(props.filePath)
  editor.value = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: lang,
    theme: props.theme,
    readOnly: props.readOnly,
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 13,
    lineNumbers: 'on',
    folding: true,
    bracketPairColorization: { enabled: true },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    tabSize: 2,
    renderWhitespace: 'selection',
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    padding: { top: 12 }
  })

  editor.value.onDidChangeModelContent(() => {
    if (ignoreChange) return
    emit('update:modelValue', editor.value.getValue())
  })
})

watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  if (editor.value.getValue() === val) return
  ignoreChange = true
  editor.value.setValue(val || '')
  ignoreChange = false
})

watch(() => props.filePath, (val) => {
  if (!editor.value) return
  const lang = detectLanguage(val)
  const model = editor.value.getModel()
  if (model) {
    monaco.editor.setModelLanguage(model, lang)
  }
})

watch(() => props.theme, (val) => {
  monaco.editor.setTheme(val)
})

watch(() => props.readOnly, (val) => {
  if (editor.value) {
    editor.value.updateOptions({ readOnly: val })
  }
})

onBeforeUnmount(() => {
  editor.value?.dispose()
  editor.value = null
})
</script>

<style scoped>
.monaco-editor-wrap {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 0 0 8px 0;
}
</style>
