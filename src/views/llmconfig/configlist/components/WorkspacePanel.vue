<template>
  <div class="workspace-panel" :class="{ 'has-preview': !!previewFile }">
    <!-- File Tree Section -->
    <div class="workspace-tree-section" v-show="!previewFile">
      <!-- Header -->
      <div class="workspace-header">
        <div class="workspace-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span>工作区文件</span>
        </div>
        <div class="workspace-actions">
          <button class="ws-icon-btn" @click="triggerUploadInput" title="上传文件" :disabled="uploading">
            <div v-if="uploading" class="ws-spinner small"></div>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </button>
          <input
            ref="uploadFileInputRef"
            type="file"
            multiple
            style="display: none"
            @change="handleUploadFiles"
          />
          <button class="ws-icon-btn" @click="showCreateFileDialog" title="新建文件">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          </button>
          <button class="ws-icon-btn" @click="showCreateFolderDialog" title="新建文件夹">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
          </button>
          <button class="ws-icon-btn" @click="refreshFiles" title="刷新" :disabled="loading">
            <svg :class="{ spinning: loading }" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          <button class="ws-icon-btn close-btn" @click="$emit('close')" title="关闭">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- File Tree -->
      <div class="workspace-body">
        <div v-if="!threadId" class="workspace-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>请先选择一个对话</span>
        </div>

        <div v-else-if="loading && fileTree.length === 0" class="workspace-loading">
          <div class="ws-spinner"></div>
          <span>加载中...</span>
        </div>

        <div v-else-if="fileTree.length === 0" class="workspace-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span>暂无文件</span>
        </div>

        <template v-else>
          <!-- Column Header Bar -->
          <div class="ws-column-header">
            <div class="ws-col ws-col-name" :class="{ sorted: sortKey === 'name' }" @click="toggleSort('name')">
              <span>名称</span>
              <svg v-if="sortKey === 'name'" class="ws-sort-arrow" :class="{ desc: sortOrder === 'desc' }" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="ws-col ws-col-size" :class="{ sorted: sortKey === 'size' }" @click="toggleSort('size')">
              <span>大小</span>
              <svg v-if="sortKey === 'size'" class="ws-sort-arrow" :class="{ desc: sortOrder === 'desc' }" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="ws-col ws-col-time" :class="{ sorted: sortKey === 'modifiedTime' }" @click="toggleSort('modifiedTime')">
              <span>修改时间</span>
              <svg v-if="sortKey === 'modifiedTime'" class="ws-sort-arrow" :class="{ desc: sortOrder === 'desc' }" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="ws-col ws-col-type" :class="{ sorted: sortKey === 'type' }" @click="toggleSort('type')">
              <span>类型</span>
              <svg v-if="sortKey === 'type'" class="ws-sort-arrow" :class="{ desc: sortOrder === 'desc' }" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <!-- File List -->
          <div class="file-tree">
            <div
              v-for="node in sortedFileTree"
              :key="node.path"
              class="tree-node-wrap"
            >
              <tree-node
                :node="node"
                :depth="0"
                :selected-path="selectedPath"
                :sort-key="sortKey"
                @select="handleSelectFile"
                @delete="handleDeleteNode"
                @toggle="handleToggleFolder"
                @preview="openPreview"
                @download="handleDownloadTreeFile"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- File Preview Section -->
    <div v-if="previewFile" class="workspace-preview-section" :class="{ fullscreen: previewFullscreen }">
      <div class="preview-header">
        <button class="preview-back-btn" @click="closePreview" title="返回文件列表">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <div class="preview-file-info">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="preview-filename">{{ previewFile.name }}</span>
          <span v-if="previewFile.size != null" class="preview-filesize">{{ formatFileSize(previewFile.size) }}</span>
        </div>
        <div class="preview-actions">
          <button class="preview-action-btn" @click="downloadFile" title="下载">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button class="preview-action-btn" @click="previewFullscreen = !previewFullscreen" :title="previewFullscreen ? '退出全屏' : '全屏'">
            <svg v-if="!previewFullscreen" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          </button>
          <button class="preview-action-btn close-btn" @click="closePreview" title="关闭预览">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div class="preview-body">
        <div v-if="previewLoading" class="preview-loading">
          <div class="ws-spinner"></div>
          <span>加载中...</span>
        </div>
        <!-- HTML -->
        <iframe v-else-if="previewType === 'html'" :srcdoc="previewContent" class="preview-iframe" sandbox="allow-scripts allow-same-origin"></iframe>
        <!-- Markdown -->
        <div v-else-if="previewType === 'markdown'" class="preview-markdown chat-markdown-body" v-html="renderedMarkdown"></div>
        <!-- Code -->
        <div v-else-if="previewType === 'code'" class="preview-code">
          <pre><code ref="previewCodeRef" :class="'language-' + previewLang">{{ previewContent }}</code></pre>
        </div>
        <!-- Image -->
        <div v-else-if="previewType === 'image'" class="preview-image">
          <img :src="previewImageUrl" :alt="previewFile.name" />
        </div>
        <!-- JSON -->
        <div v-else-if="previewType === 'json'" class="preview-code">
          <pre><code ref="previewCodeRef" class="language-json">{{ previewContentFormatted }}</code></pre>
        </div>
        <!-- Text -->
        <div v-else-if="previewType === 'text'" class="preview-text">
          <pre>{{ previewContent }}</pre>
        </div>
        <!-- Binary / Unknown -->
        <div v-else class="preview-binary">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span>二进制文件，请下载查看</span>
          <button class="preview-download-btn" @click="downloadFile">下载文件</button>
        </div>
      </div>
    </div>

    <!-- Create File Dialog -->
    <el-dialog v-model="createFileVisible" title="新建文件" width="420px" append-to-body>
      <el-form :model="createFileForm" :rules="createFileRules" ref="createFileRef" label-width="70px">
        <el-form-item label="文件路径" prop="path">
          <el-input v-model="createFileForm.path" placeholder="例如: scripts/hello.py" />
        </el-form-item>
        <el-form-item label="文件内容" prop="content">
          <el-input v-model="createFileForm.content" type="textarea" :rows="6" placeholder="输入文件内容（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createFileVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateFile" :loading="createFileLoading">创建</el-button>
      </template>
    </el-dialog>

    <!-- Create Folder Dialog -->
    <el-dialog v-model="createFolderVisible" title="新建文件夹" width="420px" append-to-body>
      <el-form :model="createFolderForm" :rules="createFolderRules" ref="createFolderRef" label-width="80px">
        <el-form-item label="文件夹路径" prop="path">
          <el-input v-model="createFolderForm.path" placeholder="例如: output/reports" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createFolderVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateFolder" :loading="createFolderLoading">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, defineComponent, h } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import hljs from 'highlight.js'
import { wsService } from '@/utils/websocket'
import {
  listWorkspaceFiles,
  createWorkspaceFile,
  deleteWorkspaceFile,
  createWorkspaceFolder,
  deleteWorkspaceFolder,
  readWorkspaceFile,
  downloadWorkspaceFile
} from '@/api/chat/workspace'
import { uploadChatAttachments } from '@/api/chat/agent'

// ===================== Props / Emits =====================

const props = defineProps({
  threadId: { type: String, default: null }
})

const emit = defineEmits(['close'])

// ===================== File Type Maps =====================

const CODE_EXTENSIONS = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  c: 'c', cpp: 'cpp', cs: 'csharp', php: 'php', swift: 'swift',
  kt: 'kotlin', scala: 'scala', sh: 'bash', bash: 'bash', zsh: 'bash',
  sql: 'sql', r: 'r', lua: 'lua', perl: 'perl', dart: 'dart',
  yml: 'yaml', yaml: 'yaml', toml: 'ini', ini: 'ini',
  xml: 'xml', svg: 'xml', vue: 'xml', jsx: 'javascript',
  css: 'css', scss: 'scss', less: 'less', sass: 'scss',
  dockerfile: 'dockerfile', makefile: 'makefile',
  graphql: 'graphql', proto: 'protobuf'
}

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ico', 'svg'])

const MARKDOWN_EXTENSIONS = new Set(['md', 'markdown', 'mdx'])

const TEXT_EXTENSIONS = new Set(['txt', 'log', 'csv', 'tsv', 'env', 'gitignore', 'dockerignore', 'editorconfig'])

// ===================== File Icon Colors =====================

const FILE_COLOR_MAP = {
  py: 'icon-python', pyw: 'icon-python',
  js: 'icon-js', jsx: 'icon-js', mjs: 'icon-js', cjs: 'icon-js',
  ts: 'icon-ts', tsx: 'icon-ts',
  html: 'icon-html', htm: 'icon-html',
  css: 'icon-css', scss: 'icon-css', less: 'icon-css', sass: 'icon-css',
  json: 'icon-json', jsonc: 'icon-json',
  md: 'icon-md', markdown: 'icon-md', mdx: 'icon-md',
  png: 'icon-image', jpg: 'icon-image', jpeg: 'icon-image', gif: 'icon-image', svg: 'icon-image', webp: 'icon-image', ico: 'icon-image',
  yml: 'icon-config', yaml: 'icon-config', toml: 'icon-config', ini: 'icon-config',
  sh: 'icon-shell', bash: 'icon-shell', zsh: 'icon-shell',
  vue: 'icon-vue',
  java: 'icon-java',
  go: 'icon-go',
  rs: 'icon-rust',
  rb: 'icon-ruby',
  php: 'icon-php',
  sql: 'icon-sql',
}

const getFileColorClass = (filename) => {
  if (!filename) return 'icon-default'
  const dotIdx = filename.lastIndexOf('.')
  if (dotIdx === -1) return 'icon-default'
  const ext = filename.slice(dotIdx + 1).toLowerCase()
  return FILE_COLOR_MAP[ext] || 'icon-default'
}

// ===================== Tree Node Component =====================

const TreeNode = defineComponent({
  name: 'TreeNode',
  props: {
    node: { type: Object, required: true },
    depth: { type: Number, default: 0 },
    selectedPath: { type: String, default: null },
    sortKey: { type: String, default: 'modifiedTime' }
  },
  emits: ['select', 'delete', 'toggle', 'preview', 'download'],
  setup(props, { emit }) {
    const formatSize = (bytes) => {
      if (bytes == null) return '-'
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }
    const formatTime = (ts) => {
      if (!ts) return '-'
      try {
        const d = new Date(ts)
        if (isNaN(d.getTime())) return '-'
        const pad = (n) => String(n).padStart(2, '0')
        return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
      } catch { return '-' }
    }
    const getFileType = (node) => {
      if (node.type === 'directory') return '文件夹'
      if (node.mimeType) {
        const short = node.mimeType.split('/').pop()
        if (short === 'x-python' || short === 'python') return 'Python'
        if (short === 'javascript') return 'JavaScript'
        if (short === 'typescript') return 'TypeScript'
        if (short === 'json') return 'JSON'
        if (short === 'html') return 'HTML'
        if (short === 'css') return 'CSS'
        if (short === 'plain') return '文本'
        if (short === 'markdown') return 'Markdown'
        return short
      }
      const dotIdx = node.name.lastIndexOf('.')
      if (dotIdx === -1) return '文件'
      return node.name.slice(dotIdx + 1).toUpperCase()
    }
    return () => {
      const isDir = props.node.type === 'directory'
      const isSelected = props.selectedPath === props.node.path

      // Indent guides (clean indentation, no lines - Apple Finder style)
      const guides = []
      for (let i = 0; i < props.depth; i++) {
        guides.push(h('span', { class: 'tree-indent', key: `g${i}` }))
      }

      // Chevron
      const chevron = isDir
        ? h('span', {
            class: ['tree-chevron', props.node.expanded ? 'expanded' : '']
          }, [
            h('svg', {
              xmlns: 'http://www.w3.org/2000/svg', width: '12', height: '12', viewBox: '0 0 24 24',
              fill: 'none', stroke: 'currentColor', 'stroke-width': '2',
              'stroke-linecap': 'round', 'stroke-linejoin': 'round'
            }, [h('polyline', { points: '9 18 15 12 9 6' })])
          ])
        : h('span', { class: 'tree-chevron-placeholder' })

      // Icon with file type color
      const colorClass = isDir ? '' : getFileColorClass(props.node.name)
      const icon = isDir
        ? h('svg', {
            class: ['tree-icon', 'folder-icon', props.node.expanded ? 'folder-open' : ''],
            xmlns: 'http://www.w3.org/2000/svg', width: '15', height: '15', viewBox: '0 0 24 24',
            fill: 'none', stroke: 'currentColor', 'stroke-width': '2',
            'stroke-linecap': 'round', 'stroke-linejoin': 'round'
          }, [
            h('path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' })
          ])
        : h('svg', {
            class: ['tree-icon', 'file-icon', colorClass],
            xmlns: 'http://www.w3.org/2000/svg', width: '15', height: '15', viewBox: '0 0 24 24',
            fill: 'none', stroke: 'currentColor', 'stroke-width': '2',
            'stroke-linecap': 'round', 'stroke-linejoin': 'round'
          }, [
            h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
            h('polyline', { points: '14 2 14 8 20 8' })
          ])

      // Action buttons (shown on hover)
      const actionBtns = []

      if (!isDir) {
        // Preview button
        actionBtns.push(h('button', {
          class: 'tree-action-btn tree-preview-btn',
          title: '预览',
          onClick: (e) => { e.stopPropagation(); emit('preview', props.node) }
        }, [
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg', width: '13', height: '13', viewBox: '0 0 24 24',
            fill: 'none', stroke: 'currentColor', 'stroke-width': '2',
            'stroke-linecap': 'round', 'stroke-linejoin': 'round'
          }, [
            h('path', { d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }),
            h('circle', { cx: '12', cy: '12', r: '3' })
          ])
        ]))

        // Download button
        actionBtns.push(h('button', {
          class: 'tree-action-btn tree-download-btn',
          title: '下载',
          onClick: (e) => { e.stopPropagation(); emit('download', props.node) }
        }, [
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg', width: '13', height: '13', viewBox: '0 0 24 24',
            fill: 'none', stroke: 'currentColor', 'stroke-width': '2',
            'stroke-linecap': 'round', 'stroke-linejoin': 'round'
          }, [
            h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
            h('polyline', { points: '7 10 12 15 17 10' }),
            h('line', { x1: '12', y1: '15', x2: '12', y2: '3' })
          ])
        ]))
      }

      // Delete button
      actionBtns.push(h('button', {
        class: 'tree-action-btn tree-delete-btn',
        title: isDir ? '删除文件夹' : '删除文件',
        onClick: (e) => { e.stopPropagation(); emit('delete', props.node) }
      }, [
        h('svg', {
          xmlns: 'http://www.w3.org/2000/svg', width: '13', height: '13', viewBox: '0 0 24 24',
          fill: 'none', stroke: 'currentColor', 'stroke-width': '2',
          'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }, [
          h('polyline', { points: '3 6 5 6 21 6' }),
          h('path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' })
        ])
      ]))

      const actionsWrap = h('span', { class: 'tree-actions' }, actionBtns)

      // Metadata columns for files
      const metaCols = []
      if (!isDir) {
        metaCols.push(h('span', { class: 'tree-meta tree-meta-size' }, formatSize(props.node.size)))
        metaCols.push(h('span', { class: 'tree-meta tree-meta-time' }, formatTime(props.node.modifiedTime)))
        metaCols.push(h('span', { class: 'tree-meta tree-meta-type' }, getFileType(props.node)))
      } else {
        metaCols.push(h('span', { class: 'tree-meta tree-meta-size' }, '-'))
        metaCols.push(h('span', { class: 'tree-meta tree-meta-time' }, formatTime(props.node.modifiedTime)))
        metaCols.push(h('span', { class: 'tree-meta tree-meta-type' }, '文件夹'))
      }

      const nodeEl = h('div', {
        class: ['tree-node', { selected: isSelected, directory: isDir }],
        onClick: () => {
          if (isDir) emit('toggle', props.node)
          else emit('select', props.node)
        }
      }, [...guides, chevron, icon, h('span', { class: 'tree-name' }, props.node.name), ...metaCols, actionsWrap])

      const children = isDir && props.node.expanded && props.node.children?.length
        ? props.node.children.map(child =>
            h(TreeNode, {
              key: child.path,
              node: child,
              depth: props.depth + 1,
              selectedPath: props.selectedPath,
              sortKey: props.sortKey,
              onSelect: (n) => emit('select', n),
              onDelete: (n) => emit('delete', n),
              onToggle: (n) => emit('toggle', n),
              onPreview: (n) => emit('preview', n),
              onDownload: (n) => emit('download', n)
            })
          )
        : []

      return h('div', { class: 'tree-node-container' }, [nodeEl, ...children])
    }
  }
})

// ===================== State - File Tree =====================

const loading = ref(false)
const fileTree = ref([])
const selectedPath = ref(null)
const sortKey = ref('modifiedTime')
const sortOrder = ref('asc') // asc = oldest first (newest at bottom), desc = newest first

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = key === 'modifiedTime' ? 'asc' : 'asc'
  }
}

const getFileExt = (name) => {
  if (!name) return ''
  const dotIdx = name.lastIndexOf('.')
  if (dotIdx === -1) return ''
  return name.slice(dotIdx + 1).toLowerCase()
}

const sortNodes = (nodes) => {
  const sorted = [...nodes]
  const dir = sortOrder.value === 'asc' ? 1 : -1
  sorted.sort((a, b) => {
    // Directories always first
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    let cmp = 0
    switch (sortKey.value) {
      case 'name':
        cmp = a.name.localeCompare(b.name)
        break
      case 'size':
        cmp = (a.size || 0) - (b.size || 0)
        break
      case 'modifiedTime':
        cmp = new Date(a.modifiedTime || 0).getTime() - new Date(b.modifiedTime || 0).getTime()
        break
      case 'type':
        cmp = getFileExt(a.name).localeCompare(getFileExt(b.name))
        break
      default:
        cmp = 0
    }
    return cmp * dir
  })
  // Recursively sort children
  return sorted.map(node => {
    if (node.type === 'directory' && node.children?.length) {
      return { ...node, children: sortNodes(node.children) }
    }
    return node
  })
}

const sortedFileTree = computed(() => sortNodes(fileTree.value))

// Create File
const createFileVisible = ref(false)
const createFileLoading = ref(false)
const createFileRef = ref(null)
const createFileForm = ref({ path: '', content: '' })
const createFileRules = {
  path: [{ required: true, message: '请输入文件路径', trigger: 'blur' }]
}

// Create Folder
const createFolderVisible = ref(false)
const createFolderLoading = ref(false)
const createFolderRef = ref(null)
const createFolderForm = ref({ path: '' })
const createFolderRules = {
  path: [{ required: true, message: '请输入文件夹路径', trigger: 'blur' }]
}

// Upload
const uploading = ref(false)
const uploadFileInputRef = ref(null)

const triggerUploadInput = () => {
  uploadFileInputRef.value?.click()
}

const handleUploadFiles = async (event) => {
  const input = event.target
  const files = Array.from(input.files || [])
  input.value = ''
  if (!files.length || !props.threadId) return

  uploading.value = true
  try {
    const res = await uploadChatAttachments(props.threadId, files)
    const data = res.data || res
    const attachments = data.attachments || []
    const failed = data.failed || []

    if (attachments.length) {
      ElMessage.success(`成功上传 ${attachments.length} 个文件`)
    }
    for (const fail of failed) {
      ElMessage.error(`${fail.filename}: ${fail.error}`)
    }
    await refreshFiles()
  } catch (e) {
    ElMessage.error(e.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

// ===================== State - Preview =====================

const previewFile = ref(null)
const previewContent = ref(null)
const previewLoading = ref(false)
const previewFullscreen = ref(false)
const previewCodeRef = ref(null)

// ===================== Preview Computed =====================

const getFileExtension = (filename) => {
  if (!filename) return ''
  const dotIdx = filename.lastIndexOf('.')
  if (dotIdx === -1) return ''
  return filename.slice(dotIdx + 1).toLowerCase()
}

const previewType = computed(() => {
  if (!previewFile.value) return 'unknown'
  const ext = getFileExtension(previewFile.value.name)
  if (ext === 'html' || ext === 'htm') return 'html'
  if (MARKDOWN_EXTENSIONS.has(ext)) return 'markdown'
  if (ext === 'json') return 'json'
  if (IMAGE_EXTENSIONS.has(ext)) return 'image'
  if (CODE_EXTENSIONS[ext]) return 'code'
  if (TEXT_EXTENSIONS.has(ext)) return 'text'
  // Fallback: check if content looks like text
  if (previewContent.value !== null && typeof previewContent.value === 'string') return 'text'
  return 'unknown'
})

const previewLang = computed(() => {
  if (!previewFile.value) return 'plaintext'
  const ext = getFileExtension(previewFile.value.name)
  return CODE_EXTENSIONS[ext] || 'plaintext'
})

const previewImageUrl = ref('')

const renderedMarkdown = computed(() => {
  if (!previewContent.value) return ''
  try {
    return marked.parse(previewContent.value)
  } catch {
    return previewContent.value
  }
})

const previewContentFormatted = computed(() => {
  if (!previewContent.value) return ''
  try {
    return JSON.stringify(JSON.parse(previewContent.value), null, 2)
  } catch {
    return previewContent.value
  }
})

// ===================== File Tree Building =====================

const buildFileTree = (files) => {
  const root = []
  const dirMap = new Map()

  const sorted = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  for (const item of sorted) {
    if (item.type === 'directory') {
      dirMap.set(item.path, {
        ...item,
        size: item.size || null,
        mimeType: item.mimeType || null,
        createdTime: item.createdTime || null,
        modifiedTime: item.modifiedTime || null,
        children: [],
        expanded: true
      })
    }
  }

  for (const item of sorted) {
    const pathParts = item.path.split('/')
    const node = item.type === 'directory'
      ? dirMap.get(item.path)
      : {
          ...item,
          size: item.size || null,
          mimeType: item.mimeType || null,
          createdTime: item.createdTime || null,
          modifiedTime: item.modifiedTime || null
        }

    if (pathParts.length === 1) {
      root.push(node)
    } else {
      const parentPath = pathParts.slice(0, -1).join('/')
      const parent = dirMap.get(parentPath)
      if (parent) {
        parent.children.push(node)
      } else {
        root.push(node)
      }
    }
  }

  return root
}

// ===================== Methods - File Tree =====================

const refreshFiles = async () => {
  if (!props.threadId || loading.value) return
  loading.value = true
  try {
    const res = await listWorkspaceFiles(props.threadId)
    if (res.data?.files) {
      fileTree.value = buildFileTree(res.data.files)
    } else {
      fileTree.value = []
    }
  } catch (e) {
    console.error('加载文件列表失败:', e)
    fileTree.value = []
  } finally {
    loading.value = false
  }
}

const handleSelectFile = (node) => {
  if (node.type !== 'file') return
  selectedPath.value = node.path
  openPreview(node)
}

const handleToggleFolder = (node) => {
  node.expanded = !node.expanded
}

const handleDeleteNode = async (node) => {
  const isDir = node.type === 'directory'
  const typeText = isDir ? '文件夹' : '文件'

  try {
    await ElMessageBox.confirm(
      `确定要删除${typeText} "${node.path}" 吗？${isDir ? '这将递归删除所有子文件和子目录。' : ''}`,
      `删除${typeText}`,
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )

    const data = { threadId: props.threadId, path: node.path }
    if (isDir) {
      await deleteWorkspaceFolder(data)
    } else {
      await deleteWorkspaceFile(data)
    }

    ElMessage.success(`${typeText}已删除`)
    if (selectedPath.value === node.path) {
      selectedPath.value = null
      previewFile.value = null
    }
    await refreshFiles()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(`删除${typeText}失败:`, e)
    }
  }
}

const showCreateFileDialog = () => {
  createFileForm.value = { path: '', content: '' }
  createFileVisible.value = true
}

const showCreateFolderDialog = () => {
  createFolderForm.value = { path: '' }
  createFolderVisible.value = true
}

const handleCreateFile = async () => {
  if (createFileLoading.value) return
  try {
    await createFileRef.value.validate()
  } catch { return }

  createFileLoading.value = true
  try {
    await createWorkspaceFile({
      threadId: props.threadId,
      path: createFileForm.value.path,
      content: createFileForm.value.content || ''
    })
    ElMessage.success('文件创建成功')
    createFileVisible.value = false
    await refreshFiles()
  } catch (e) {
    console.error('创建文件失败:', e)
  } finally {
    createFileLoading.value = false
  }
}

const handleCreateFolder = async () => {
  if (createFolderLoading.value) return
  try {
    await createFolderRef.value.validate()
  } catch { return }

  createFolderLoading.value = true
  try {
    await createWorkspaceFolder({
      threadId: props.threadId,
      path: createFolderForm.value.path
    })
    ElMessage.success('文件夹创建成功')
    createFolderVisible.value = false
    await refreshFiles()
  } catch (e) {
    console.error('创建文件夹失败:', e)
  } finally {
    createFolderLoading.value = false
  }
}

// ===================== Methods - Preview =====================

const formatFileSize = (bytes) => {
  if (bytes == null) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const openPreview = async (node) => {
  if (node.type !== 'file') return
  selectedPath.value = node.path
  previewFile.value = node
  previewContent.value = null
  previewFullscreen.value = false

  // Revoke previous blob URL
  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value)
    previewImageUrl.value = ''
  }

  const ext = getFileExtension(node.name)

  // Images: load via auth'd request as blob URL
  if (IMAGE_EXTENSIONS.has(ext)) {
    previewLoading.value = true
    try {
      const blob = await downloadWorkspaceFile(props.threadId, node.path)
      previewImageUrl.value = URL.createObjectURL(blob)
    } catch (e) {
      console.error('加载图片失败:', e)
      previewImageUrl.value = ''
    } finally {
      previewLoading.value = false
    }
    return
  }

  previewLoading.value = true
  try {
    const res = await readWorkspaceFile(props.threadId, node.path)
    previewContent.value = res.data?.content ?? res.data ?? ''
  } catch (e) {
    console.error('读取文件失败:', e)
    previewContent.value = null
  } finally {
    previewLoading.value = false
    nextTick(() => highlightPreviewCode())
  }
}

const closePreview = () => {
  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value)
    previewImageUrl.value = ''
  }
  previewFile.value = null
  previewContent.value = null
  previewFullscreen.value = false
}

const triggerFileDownload = async (threadId, path, filename) => {
  try {
    const blob = await downloadWorkspaceFile(threadId, path)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('下载文件失败:', e)
    ElMessage.error('下载文件失败')
  }
}

const downloadFile = () => {
  if (!previewFile.value || !props.threadId) return
  triggerFileDownload(props.threadId, previewFile.value.path, previewFile.value.name)
}

const handleDownloadTreeFile = (node) => {
  if (!props.threadId) return
  triggerFileDownload(props.threadId, node.path, node.name)
}

const highlightPreviewCode = () => {
  if (previewCodeRef.value) {
    hljs.highlightElement(previewCodeRef.value)
  }
}

// ===================== WebSocket =====================

const handleWsMessage = (data) => {
  if (data.type === 'workspace_changed' && data.threadId === props.threadId) {
    refreshFiles()
  }
}

// ===================== Watchers =====================

watch(() => props.threadId, (newId) => {
  selectedPath.value = null
  previewFile.value = null
  previewContent.value = null
  if (newId) {
    refreshFiles()
  } else {
    fileTree.value = []
  }
})

// ===================== Lifecycle =====================

onMounted(() => {
  wsService.on('message', handleWsMessage)
  if (props.threadId) {
    refreshFiles()
  }
})

onUnmounted(() => {
  wsService.off('message', handleWsMessage)
  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value)
  }
})
</script>

<style scoped>
@import './WorkspacePanel.css';
</style>
