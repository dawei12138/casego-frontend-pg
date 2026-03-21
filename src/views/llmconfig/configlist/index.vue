<template>
  <div class="ai-chat-container">
    <!-- Left Sidebar -->
    <aside class="chat-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <button class="sidebar-toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? '展开侧栏' : '收起侧栏'">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <button class="new-chat-btn" @click="createNewChat" title="新对话">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span v-show="!sidebarCollapsed">新对话</span>
        </button>
      </div>
      <div class="conversation-list" v-show="!sidebarCollapsed">
        <div v-if="conversations.length === 0" class="empty-hint">暂无对话记录</div>
        <div
          v-for="conv in sortedConversations"
          :key="conv.threadId"
          class="conversation-item"
          :class="{ active: currentConversationId === conv.threadId }"
          @click="switchConversation(conv.threadId)"
        >
          <svg class="conv-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="conv-title">{{ conv.title || '新对话' }}</span>
          <button class="conv-delete-btn" @click.stop="deleteConversation(conv.threadId)" title="删除对话">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Chat Area -->
    <main class="chat-main" :class="{ 'workspace-open': workspacePanelVisible }">

      <!-- Messages Area -->
      <div class="chat-messages" ref="messagesRef" @scroll="handleMessagesScroll" @click="handleMessagesClick">
        <!-- Welcome Screen -->
        <div v-if="currentMessages.length === 0 && !historyLoading" class="welcome-screen">
          <div class="welcome-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
            </svg>
          </div>
          <h2 class="welcome-title">CaseGo AI</h2>
          <p class="welcome-subtitle">有什么我可以帮助你的吗？</p>
        </div>

        <!-- Loading Indicator -->
        <div v-else-if="historyLoading && currentMessages.length === 0" class="history-loading">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>

        <!-- Messages -->
        <div v-else-if="currentMessages.length > 0" class="messages-inner">
          <!-- Load More Button -->
          <div v-if="historyHasMore" class="load-more-wrap">
            <button class="load-more-btn" @click="loadMoreHistory" :disabled="historyLoading">
              <template v-if="historyLoading">
                <div class="loading-spinner small"></div>
                加载中...
              </template>
              <template v-else>
                加载更早的消息
              </template>
            </button>
          </div>

          <div
            v-for="msg in currentMessages"
            :key="msg.id"
            :data-message-id="msg.id"
            class="message-row"
            :class="[msg.role]"
          >
            <!-- User Message -->
            <template v-if="msg.role === 'user'">
              <div class="user-content-col">
                <!-- Attachment Cards -->
                <div v-if="msg.attachments && msg.attachments.length" class="user-attachment-cards">
                  <template v-for="att in msg.attachments" :key="att.storedName">
                    <!-- Image attachment: render as image -->
                    <div v-if="att.fileType === 'image'" class="user-attachment-image">
                      <img
                        v-if="attachmentImageCache[att.storedName]"
                        :src="attachmentImageCache[att.storedName]"
                        :alt="att.filename"
                        class="att-image-render"
                        @click="openImageLightbox(attachmentImageCache[att.storedName], att.filename)"
                      />
                      <div v-else class="att-image-placeholder">
                        <div class="loading-spinner small"></div>
                      </div>
                      <span class="att-image-name">{{ att.filename }}</span>
                    </div>
                    <!-- Text/other attachment: file card -->
                    <div v-else class="user-attachment-card">
                      <svg class="att-card-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      <span class="att-card-name" :title="att.filename">{{ att.filename }}</span>
                      <span class="att-card-size">{{ formatFileSize(att.size) }}</span>
                    </div>
                  </template>
                </div>
                <div v-if="msg.content" class="user-bubble">{{ msg.content }}</div>
              </div>
              <div class="user-avatar-col">
                <img v-if="userAvatar" :src="userAvatar" class="avatar-img user" alt="avatar" />
                <span v-else class="avatar-circle user">U</span>
              </div>
            </template>

            <!-- Assistant Message -->
            <template v-else-if="msg.role === 'assistant'">
              <div class="ai-avatar-col">
                <span class="avatar-circle ai"><img :src="AiAvatarIcon" class="ai-avatar-svg" alt="AI" /></span>
              </div>
              <div class="ai-body">
                <!-- Thinking Block - Streaming Mode (2-line scroll preview) -->
                <div v-if="msg.thinkingContent && msg.loading" class="thinking-stream-block">
                  <div class="thinking-stream-fade"></div>
                  <div class="thinking-stream-scroll" :ref="el => { if (el) thinkingScrollRefs[msg.id] = el }">
                    <div class="thinking-stream-text">{{ msg.thinkingContent }}</div>
                  </div>
                  <span class="thinking-stream-badge">
                    <svg class="tool-spinner" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    思考中
                  </span>
                </div>
                <!-- Thinking Block - Completed Mode (collapsed summary) -->
                <div v-if="msg.thinkingContent && !msg.loading" class="thinking-block">
                  <div class="thinking-header" @click="msg.thinkingExpanded = !msg.thinkingExpanded">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <span>思考过程</span>
                    <svg class="thinking-chevron" :class="{ expanded: msg.thinkingExpanded }" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="msg.thinkingExpanded" class="thinking-content">{{ msg.thinkingContent }}</div>
                </div>
                <!-- Tool Calls - Streaming Mode -->
                <div v-if="msg.loading && getRegularToolCalls(msg).length" class="tool-group">
                  <div class="tool-group-header" @click="msg.toolCallsExpanded = !msg.toolCallsExpanded">
                    <svg class="tool-spinner" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    <span class="tool-group-text">{{ getToolGroupSummary(msg) }}</span>
                    <svg class="tool-expand-chevron" :class="{ expanded: msg.toolCallsExpanded }" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <!-- Collapsed: 2-line scroll preview -->
                  <div v-if="!msg.toolCallsExpanded" class="tool-stream-preview">
                    <div class="tool-stream-fade"></div>
                    <div class="tool-stream-scroll">
                      <div v-for="(tc, idx) in getRegularToolCalls(msg)" :key="idx" class="tool-stream-item" :class="{ active: tc.loading }">
                        <svg v-if="tc.loading" class="tool-spinner" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span class="tool-stream-name">{{ tc.tool }}</span>
                        <span v-if="tc.args && tc.loading" class="tool-stream-args">{{ formatToolArgs(tc.args) }}</span>
                        <span v-if="tc.result" class="tool-stream-result-text">→ {{ getFirstLine(tc.result) }}</span>
                      </div>
                    </div>
                  </div>
                  <!-- Expanded: full tool cards -->
                  <div v-if="msg.toolCallsExpanded" class="tool-group-body">
                    <div v-for="(tc, idx) in getRegularToolCalls(msg)" :key="idx" class="tool-card">
                      <div class="tool-card-header" @click="(tc.result || tc.args) && (tc.expanded = !tc.expanded)" :class="{ clickable: tc.result || tc.args }">
                        <svg v-if="tc.loading" class="tool-spinner" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span class="tool-name">{{ tc.tool }}</span>
                        <span v-if="tc.args" class="tool-args-inline">{{ formatToolArgs(tc.args) }}</span>
                        <svg v-if="tc.result || tc.args" class="tool-expand-chevron" :class="{ expanded: tc.expanded }" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                      <div v-if="tc.args && tc.expanded" class="tool-args-detail">
                        <div class="tool-args-label">入参</div>
                        <pre class="tool-args-content">{{ JSON.stringify(tc.args, null, 2) }}</pre>
                      </div>
                      <div v-if="tc.result" class="tool-result" :class="{ collapsed: !tc.expanded }">{{ tc.result }}</div>
                    </div>
                  </div>
                </div>
                <!-- Tool Calls - Completed Mode (grouped summary, excluding write_todos) -->
                <div v-if="!msg.loading && getRegularToolCalls(msg).length" class="tool-group">
                  <div class="tool-group-header" @click="msg.toolCallsExpanded = !msg.toolCallsExpanded">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span class="tool-group-text">{{ getToolGroupSummary(msg) }}</span>
                    <svg class="tool-expand-chevron" :class="{ expanded: msg.toolCallsExpanded }" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="msg.toolCallsExpanded" class="tool-group-body">
                    <div v-for="(tc, idx) in getRegularToolCalls(msg)" :key="idx" class="tool-card">
                      <div class="tool-card-header" @click="(tc.result || tc.args) && (tc.expanded = !tc.expanded)" :class="{ clickable: tc.result || tc.args }">
                        <svg v-if="tc.loading" class="tool-spinner" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span class="tool-name">{{ tc.tool }}</span>
                        <span v-if="tc.args" class="tool-args-inline">{{ formatToolArgs(tc.args) }}</span>
                        <svg v-if="tc.result || tc.args" class="tool-expand-chevron" :class="{ expanded: tc.expanded }" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                      <div v-if="tc.args && tc.expanded" class="tool-args-detail">
                        <div class="tool-args-label">入参</div>
                        <pre class="tool-args-content">{{ JSON.stringify(tc.args, null, 2) }}</pre>
                      </div>
                      <div v-if="tc.result" class="tool-result" :class="{ collapsed: !tc.expanded }">{{ tc.result }}</div>
                    </div>
                  </div>
                </div>
                <!-- Content -->
                <div
                  v-if="msg.content"
                  class="ai-content chat-markdown-body"
                  v-html="renderMarkdown(msg.content)"
                ></div>
                <!-- Message Footer: Copy + Timestamp -->
                <div v-if="msg.content && !msg.loading" class="ai-msg-footer">
                  <button class="ai-msg-copy-btn" @click="copyMessageContent(msg)" :title="msg._copied ? '已复制' : '复制'">
                    <svg v-if="!msg._copied" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                  <span v-if="msg.timestamp" class="ai-msg-timestamp">{{ formatMsgTime(msg.timestamp) }}</span>
                </div>
                <!-- Error Block -->
                <div v-if="msg.errorMessage" class="sse-error-block">
                  <div class="sse-error-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  <div class="sse-error-body">
                    <div class="sse-error-title">请求失败，请切换模型</div>
                    <div class="sse-error-message">{{ msg.errorMessage }}</div>
                  </div>
                </div>
                <!-- Typing Indicator -->
                <div v-if="msg.loading && !msg.content && !(msg.toolCalls && msg.toolCalls.length)" class="typing-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </template>

            <!-- Interrupt Approval -->
            <template v-else-if="msg.role === 'interrupt'">
              <div class="ai-avatar-col">
                <span class="avatar-circle ai"><img :src="AiAvatarIcon" class="ai-avatar-svg" alt="AI" /></span>
              </div>
              <div class="ai-body">
                <div class="interrupt-approval-block">
                  <div class="interrupt-header">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#faad14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span>需要您的审批</span>
                  </div>

                  <div class="interrupt-actions">
                    <div
                      v-for="(action, idx) in msg.actions"
                      :key="idx"
                      class="interrupt-action-card"
                      :class="getRiskLevelClass(action.riskLevel)"
                    >
                      <div class="action-header">
                        <span class="action-name">{{ action.name }}</span>
                        <el-tag :type="action.riskLevel === 'high' ? 'danger' : action.riskLevel === 'medium' ? 'warning' : 'success'" size="small">
                          {{ getRiskLevelText(action.riskLevel) }}
                        </el-tag>
                      </div>
                      <div class="action-description">{{ action.description }}</div>

                      <!-- 参数展示/编辑 -->
                      <div class="action-args">
                        <div class="args-label">参数：</div>
                        <template v-if="action.decision === 'edit'">
                          <el-input
                            v-model="action.editedArgsText"
                            type="textarea"
                            :rows="4"
                            placeholder="请输入 JSON 格式的参数"
                            class="args-editor"
                          />
                        </template>
                        <template v-else>
                          <pre class="args-content">{{ JSON.stringify(action.args, null, 2) }}</pre>
                        </template>
                      </div>

                      <!-- 决策选择 -->
                      <div class="action-decision">
                        <el-radio-group v-model="action.decision" @change="handleDecisionChange(action)">
                          <el-radio label="approve">批准</el-radio>
                          <el-radio label="edit">编辑后批准</el-radio>
                          <el-radio label="reject">拒绝</el-radio>
                        </el-radio-group>
                      </div>
                    </div>
                  </div>

                  <div class="interrupt-footer">
                    <el-button size="default" @click="cancelApproval(msg)">取消</el-button>
                    <el-button
                      type="primary"
                      size="default"
                      @click="submitApproval(msg)"
                      :disabled="!canSubmitApproval(msg)"
                      :loading="msg.submitting"
                    >
                      提交审批
                    </el-button>
                  </div>
                </div>
              </div>
            </template>

            <!-- Ask User (AI 提问) -->
            <template v-else-if="msg.role === 'ask_user'">
              <div class="ai-avatar-col">
                <span class="avatar-circle ai"><img :src="AiAvatarIcon" class="ai-avatar-svg" alt="AI" /></span>
              </div>
              <div class="ai-body">
                <div class="ask-user-block">
                  <!-- Tab 导航 -->
                  <div v-if="msg.questions.length > 1" class="ask-tabs">
                    <button
                      class="ask-tabs-arrow"
                      :disabled="(msg.activeIdx || 0) === 0"
                      @click="msg.activeIdx = (msg.activeIdx || 0) - 1"
                    ><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
                    <div class="ask-tabs-track">
                      <button
                        v-for="(q, qIdx) in msg.questions"
                        :key="qIdx"
                        class="ask-tabs-pill"
                        :class="{ active: (msg.activeIdx || 0) === qIdx, done: getQuestionAnswer(q) }"
                        @click="msg.activeIdx = qIdx"
                      >{{ q.header || ('Q' + (qIdx + 1)) }}</button>
                    </div>
                    <button
                      class="ask-tabs-arrow"
                      :disabled="(msg.activeIdx || 0) >= msg.questions.length - 1"
                      @click="msg.activeIdx = (msg.activeIdx || 0) + 1"
                    ><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
                  </div>

                  <!-- 当前问题 -->
                  <div class="ask-q" v-if="msg.questions[msg.activeIdx || 0]">
                    <div class="ask-q-text">{{ msg.questions[msg.activeIdx || 0].question }}</div>

                    <div v-if="msg.questions[msg.activeIdx || 0].options && msg.questions[msg.activeIdx || 0].options.length" class="ask-q-options">
                      <!-- 单选 -->
                      <template v-if="!msg.questions[msg.activeIdx || 0].multi_select">
                        <button
                          v-for="(opt, oIdx) in msg.questions[msg.activeIdx || 0].options"
                          :key="oIdx"
                          class="ask-chip"
                          :class="{ selected: msg.questions[msg.activeIdx || 0].selectedOption === opt.label }"
                          :disabled="msg.processed"
                          @click="msg.questions[msg.activeIdx || 0].selectedOption = msg.questions[msg.activeIdx || 0].selectedOption === opt.label ? null : opt.label"
                        >{{ opt.label }}</button>
                        <button
                          class="ask-chip ask-chip-other"
                          :class="{ selected: msg.questions[msg.activeIdx || 0].selectedOption === '__custom__' }"
                          :disabled="msg.processed"
                          @click="msg.questions[msg.activeIdx || 0].selectedOption = msg.questions[msg.activeIdx || 0].selectedOption === '__custom__' ? null : '__custom__'"
                        >其他…</button>
                      </template>
                      <!-- 多选 -->
                      <template v-else>
                        <button
                          v-for="(opt, oIdx) in msg.questions[msg.activeIdx || 0].options"
                          :key="oIdx"
                          class="ask-chip"
                          :class="{ selected: msg.questions[msg.activeIdx || 0].selectedOptions?.includes(opt.label) }"
                          :disabled="msg.processed"
                          @click="toggleMultiOption(msg.questions[msg.activeIdx || 0], opt.label)"
                        >{{ opt.label }}</button>
                        <button
                          class="ask-chip ask-chip-other"
                          :class="{ selected: msg.questions[msg.activeIdx || 0].selectedOptions?.includes('__custom__') }"
                          :disabled="msg.processed"
                          @click="toggleMultiOption(msg.questions[msg.activeIdx || 0], '__custom__')"
                        >其他…</button>
                      </template>
                    </div>

                    <!-- 选中选项的描述 -->
                    <div v-if="getSelectedDesc(msg.questions[msg.activeIdx || 0])" class="ask-q-desc">
                      {{ getSelectedDesc(msg.questions[msg.activeIdx || 0]) }}
                    </div>

                    <!-- 自定义输入 -->
                    <div v-if="showCustomInput(msg.questions[msg.activeIdx || 0])" class="ask-custom-wrap">
                      <input
                        class="ask-custom-input"
                        v-model="msg.questions[msg.activeIdx || 0].customText"
                        placeholder="请输入你的回答…"
                        :disabled="msg.processed"
                      />
                    </div>

                    <!-- 无选项: 自由输入 -->
                    <div v-if="!(msg.questions[msg.activeIdx || 0].options && msg.questions[msg.activeIdx || 0].options.length)" class="ask-custom-wrap">
                      <input
                        class="ask-custom-input"
                        v-model="msg.questions[msg.activeIdx || 0].customText"
                        placeholder="请输入你的回答…"
                        :disabled="msg.processed"
                      />
                    </div>

                    <!-- 历史: 自定义回答 -->
                    <div v-if="msg.processed && msg.questions[msg.activeIdx || 0].answeredText && !isAnswerInOptions(msg.questions[msg.activeIdx || 0])" class="ask-answered-hint">
                      {{ msg.questions[msg.activeIdx || 0].answeredText }}
                    </div>
                  </div>

                  <!-- 操作栏 -->
                  <div class="ask-actions" v-if="!msg.processed">
                    <button class="ask-btn-skip" @click="skipAskUser(msg)">跳过</button>
                    <button
                      class="ask-btn-submit"
                      @click="submitAnswer(msg)"
                      :disabled="!canSubmitAnswer(msg) || msg.submitting"
                    >{{ msg.submitting ? '提交中…' : '提交' }}</button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Floating Todo Bar (between messages and input, header takes own space) -->
      <div v-if="mergedTodos.length" class="todo-float-bar">
        <div class="todo-float-bar-inner">
          <!-- Expanded dropdown (floats upward over messages) -->
          <div v-if="todoFloatExpanded" class="floating-todo-dropdown">
            <div v-for="(todo, idx) in mergedTodos" :key="idx" class="floating-todo-item" :class="'todo-' + todo.status">
              <svg v-if="todo.status === 'completed'" class="todo-icon todo-icon-done" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <svg v-else-if="todo.status === 'in_progress'" class="todo-icon todo-icon-progress" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <svg v-else class="todo-icon todo-icon-pending" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
              <span class="floating-todo-text">{{ todo.content }}</span>
            </div>
          </div>
          <!-- Header bar (always visible, one line) -->
          <div class="floating-todo-header" :class="{ expanded: todoFloatExpanded }" @click="todoFloatExpanded = !todoFloatExpanded">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <span class="floating-todo-title">任务清单</span>
            <span class="floating-todo-stats">{{ latestTodoStats }}</span>
            <span v-if="!todoFloatExpanded && currentInProgressTodo" class="floating-todo-active-hint">
              <svg class="tool-spinner" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              {{ currentInProgressTodo }}
            </span>
            <svg class="floating-todo-chevron" :class="{ expanded: todoFloatExpanded }" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <div class="input-area-inner">
          <div class="input-box">
            <!-- Pending Attachments Preview -->
            <div v-if="pendingAttachments.length" class="attachment-preview-strip">
              <div
                v-for="(att, idx) in pendingAttachments"
                :key="att.storedName"
                class="attachment-preview-chip"
              >
                <img
                  v-if="att.fileType === 'image' && attachmentLocalPreviews[idx]"
                  :src="attachmentLocalPreviews[idx]"
                  :alt="att.filename"
                  class="att-preview-thumb"
                />
                <svg v-else class="att-preview-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <span class="att-preview-name" :title="att.filename">{{ att.filename }}</span>
                <span class="att-preview-size">{{ formatFileSize(att.size) }}</span>
                <button class="att-preview-remove" @click="removeAttachment(idx)" title="移除">&times;</button>
              </div>
            </div>
            <textarea
              ref="inputRef"
              v-model="inputMessage"
              :placeholder="isStreaming ? 'AI 正在回复中...' : hasActiveAskUser ? '请先回答 AI 的问题...' : '输入消息，Enter 发送，Shift+Enter 换行'"
              @keydown="handleKeydown"
              @input="autoResize"
              rows="3"
              :disabled="isStreaming || hasActiveAskUser"
            ></textarea>
            <div class="input-footer">
              <div class="input-footer-left">
                <button
                  class="attach-btn"
                  @click="triggerAttachmentInput"
                  :disabled="attachmentUploading || pendingAttachments.length >= ATTACHMENT_MAX_COUNT"
                  :title="pendingAttachments.length >= ATTACHMENT_MAX_COUNT ? '最多5个附件' : '添加附件'"
                >
                  <svg v-if="!attachmentUploading" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <div v-else class="loading-spinner small"></div>
                </button>
                <input
                  ref="attachmentFileInputRef"
                  type="file"
                  multiple
                  :accept="ATTACHMENT_ALL_EXTS.join(',')"
                  style="display: none"
                  @change="handleAttachmentSelect"
                />
                <button
                  class="thinking-pill"
                  :class="{ active: enableThinking }"
                  @click="enableThinking = !enableThinking"
                  title="深度思考模式"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="12" r="10"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span>深度思考</span>
                </button>
                <button
                  class="thinking-pill web-search-pill"
                  :class="{ active: enableWebSearch }"
                  @click="enableWebSearch = !enableWebSearch"
                  title="联网搜索"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <span>联网搜索</span>
                </button>
                <el-popover
                  v-model:visible="mcpPopoverVisible"
                  placement="top-start"
                  :width="280"
                  trigger="click"
                  popper-style="padding: 12px;"
                  @show="fetchMcpConfigs"
                >
                  <template #reference>
                    <button
                      class="thinking-pill mcp-tool-pill"
                      :class="{ active: selectedMcpConfigIds.length > 0 }"
                      title="MCP 工具"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                      <span>MCP工具</span>
                      <span v-if="selectedMcpConfigIds.length > 0" class="mcp-badge">{{ selectedMcpConfigIds.length }}</span>
                    </button>
                  </template>
                  <div class="mcp-popover">
                    <div class="mcp-popover-title">选择 MCP 工具</div>
                    <div v-if="mcpLoading" class="mcp-popover-loading">
                      <div class="loading-spinner small"></div>
                      <span>加载中...</span>
                    </div>
                    <div v-else-if="mcpConfigList.length === 0" class="mcp-popover-empty">暂无可用的 MCP 工具</div>
                    <div v-else class="mcp-popover-list">
                      <label
                        v-for="item in mcpConfigList"
                        :key="item.configId"
                        class="mcp-popover-item"
                      >
                        <el-checkbox
                          :model-value="selectedMcpConfigIds.includes(item.configId)"
                          @change="(val) => toggleMcpConfig(item.configId, val)"
                        />
                        <span class="mcp-item-name">{{ item.serverName }}</span>
                      </label>
                    </div>
                    <div v-if="mcpConfigList.length > 0" class="mcp-popover-footer">
                      <button class="mcp-clear-btn" @click="selectedMcpConfigIds = []">清除选择</button>
                    </div>
                  </div>
                </el-popover>
              </div>
              <div class="input-actions">
                <button
                  class="workspace-toggle-btn"
                  :class="{ active: workspacePanelVisible }"
                  @click="workspacePanelVisible = !workspacePanelVisible"
                  title="工作区文件"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  <span>工作区</span>
                </button>
                <el-popover
                  v-model:visible="modelPopoverVisible"
                  placement="top-end"
                  :width="340"
                  trigger="click"
                  popper-style="padding: 12px;"
                >
                  <template #reference>
                    <button class="model-selector-pill">
                      <span class="provider-icon" :style="{ background: currentProviderInfo.color || '#6b7280' }">{{ currentProviderInfo.abbr || '?' }}</span>
                      <span class="model-name-text">{{ selectedModel }}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                  </template>
                  <div class="model-popover">
                    <div class="model-popover-section">
                      <div class="model-popover-label">提供商</div>
                      <div class="model-popover-providers">
                        <button
                          v-for="p in providerOptions"
                          :key="p.key"
                          class="provider-chip"
                          :class="{ active: selectedProvider === p.key }"
                          @click="selectProvider(p.key)"
                        >
                          <span class="provider-chip-icon" :style="{ background: p.color }">{{ p.abbr }}</span>
                          <span>{{ p.label }}</span>
                        </button>
                      </div>
                    </div>
                    <div class="model-popover-section">
                      <div class="model-popover-label">模型</div>
                      <div class="model-popover-models">
                        <button
                          v-for="m in modelOptions"
                          :key="m"
                          class="model-chip"
                          :class="{ active: selectedModel === m }"
                          @click="selectModel(m)"
                        >{{ m }}</button>
                      </div>
                    </div>
                  </div>
                </el-popover>
                <button
                  v-if="isStreaming"
                  class="input-action-btn stop-session"
                  @click="stopSession"
                  title="终止会话"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </button>
                <button
                  v-if="!isStreaming"
                  class="input-action-btn send"
                  :class="{ disabled: !inputMessage.trim() && !pendingAttachments.length }"
                  :disabled="!inputMessage.trim() && !pendingAttachments.length"
                  @click="sendMessage"
                  title="发送消息"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Workspace Float Panel (popover above button) -->
      <transition name="workspace-pop">
        <div v-show="workspacePanelVisible" class="workspace-float-panel">
          <WorkspacePanel :thread-id="currentConversationId" @close="workspacePanelVisible = false" />
        </div>
      </transition>

      <!-- Image Lightbox -->
      <Teleport to="body">
        <div v-if="lightboxVisible" class="att-lightbox-overlay" @click="closeLightbox">
          <img :src="lightboxUrl" :alt="lightboxAlt" class="att-lightbox-image" @click.stop />
          <button class="att-lightbox-close" @click="closeLightbox">&times;</button>
        </div>
      </Teleport>
    </main>
  </div>
</template>


<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark-dimmed.css'
import { getToken } from '@/utils/auth'
import request from '@/utils/request'
import { stopChatSession, uploadChatAttachments, fetchAttachmentBlob } from '@/api/chat/agent'
import { downloadWorkspaceFile } from '@/api/chat/workspace'
import { allMcpconfig } from '@/api/mcpconfig/mcpconfig'
import { ElMessage } from 'element-plus'
import WorkspacePanel from './components/WorkspacePanel.vue'
import useUserStore from '@/store/modules/user'
import AiAvatarIcon from '@/assets/icons/svg/AI头像.png'

// ===================== Constants =====================

const PROVIDER_MODELS = {
  anthropic: { label: 'Anthropic', abbr: 'A', color: '#d97757', models: ['claude-sonnet-4-5-20250929','claude-sonnet-4-6','claude-haiku-4-5-20251001', 'claude-3-5-haiku-20241022'] },
  deepseek: { label: 'DeepSeek', abbr: 'D', color: '#4d6bfe', models: ['deepseek-chat','deepseek-reasoner','deepseek-ai/DeepSeek-V3.2', 'deepseek-ai/DeepSeek-R1'] },
  //google: { label: 'Google', abbr: 'G', color: '#4285f4', models: ['gemini-2.5-flash', 'gemini-2.5-pro'] },
  //qwen: { label: '通义千问', abbr: '通', color: '#6236ff', models: ['qwen-max', 'qwen-plus', 'qwen-turbo'] },
  //zhipu: { label: '智谱', abbr: '智', color: '#3d5afe', models: ['glm-4-plus', 'glm-4-flash'] },
  //moonshot: { label: 'Moonshot', abbr: 'M', color: '#1a1a1a', models: ['moonshot-v1-8k', 'moonshot-v1-32k'] },
  //ollama: { label: 'Ollama', abbr: 'O', color: '#0f172a', models: ['llama3', 'qwen2'] },
  //azure_openai: { label: 'Azure OpenAI', abbr: 'Az', color: '#0078d4', models: ['gpt-4o', 'gpt-4o-mini'] },
  openai: { label: 'OpenAI', abbr: 'OA', color: '#10a37f', models: ['gpt-5.2-high','gpt-5.2','gpt-5.1-high','gpt-5.1', 'gpt-5'] },
  openai_gpt1: { label: 'GGB', abbr: 'OA', color: '#10a37f', models: ['gpt-5.4','gpt-5.4-high','gpt-5.2','gpt-5.1', 'gpt-5'] },
  openai_gpt2: { label: 'infiniteai', abbr: 'OA', color: '#10a37f', models: ['gpt-5.4','gpt-5.4-high','gpt-5.2','gpt-5.1', 'gpt-5'] },
  gpt3: { label: '薄荷', abbr: 'OA', color: '#10a37f', models: ['gpt-5.4','gpt-5.4-high','gpt-5.2','gpt-5.2-high','gpt-5.1','gpt-5.1-high', 'gpt-5','gpt-5-high'] },
  gpt4: { label: 'hotaruapi', abbr: 'OA', color: '#10a37f', models: ['gpt-5.4','gpt-5.4-high','gpt-5.2','gpt-5.2-high','gpt-5.1','gpt-5.1-high', 'gpt-5','gpt-5-high'] },
  openai_gpt5: { label: 'KFC', abbr: 'OA', color: '#10a37f', models: ['gpt-5.4','gpt-5.4-high','gpt-5.2','gpt-5.2-high','gpt-5.1','gpt-5.1-high', 'gpt-5','gpt-5-high'] },
  gpt6: { label: '哈基米', abbr: 'OA', color: '#10a37f', models: ['gpt-5.4','gpt-5.4-high','[满血A]gemini-3-pro-preview','[福利]gemini-3-flash-preview','[福利]gemini-3-flash-preview-thinking','gpt-5.2','gpt-5.2-high','gpt-5.1','gpt-5.1-high', 'gpt-5','gpt-5-high'] },
  gpt7: { label: '玩票', abbr: 'OA', color: '#10a37f', models: ['gpt-5.4','gpt-5.4-high','gpt-5.2-codex','gpt-5.3-codex','gemini-3.1-flash-lite-preview','gemini-3-flash','gpt-5.2','gpt-5.2-high','gpt-5.1','gpt-5.1-high', 'gpt-5','gpt-5-high'] },
  custom: { label: '自定义', abbr: 'C', color: '#6b7280', models: ['deepseek-ai/DeepSeek-V3.2'] },
  gemini: { label: 'gemini', abbr: 'Ge', color: '#1a73e8', models: ['gemini-3-flash-preview','gemini-3-pro-preview-bs','[福利]gemini-3-flash-preview','[福利]gemini-3-flash-preview-thinking', '[满血A]gemini-3-pro-preview-thinking-512'] },
}

// ===================== Utilities =====================

const generateId = () => {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

// ===================== Markdown =====================

const markedRenderer = new marked.Renderer()
markedRenderer.code = ({ text, lang }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  try {
    const highlighted = hljs.highlight(text, { language }).value
    return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`
  } catch {
    return `<pre><code class="hljs">${text}</code></pre>`
  }
}
marked.use({ gfm: true, breaks: true, renderer: markedRenderer })

const renderMarkdown = (text) => {
  if (!text) return ''
  try {
    let html = marked.parse(text)
    // Post-process: detect image paths in <code> tags starting with /
    const threadId = currentConversationId.value
    if (threadId) {
      html = html.replace(WS_IMAGE_PATH_REGEX, (match, path) => {
        const cacheKey = `${threadId}:${path}`
        const cached = workspaceImageCache[cacheKey]
        if (cached && cached !== 'loading' && cached !== 'error') {
          return `<div class="ws-inline-image"><img src="${cached}" alt="${path}" class="ws-rendered-image" /></div>`
        } else if (cached === 'error') {
          return match
        } else {
          if (!cached) {
            workspaceImageCache[cacheKey] = 'loading'
            fetchWorkspaceImage(threadId, path, cacheKey)
          }
          return `<div class="ws-inline-image ws-inline-image-loading"><div class="loading-spinner small"></div><span>${path}</span></div>`
        }
      })
    }
    return html
  } catch {
    return text
  }
}

const fetchWorkspaceImage = async (threadId, path, cacheKey) => {
  try {
    const wsPath = path.startsWith('/') ? path.slice(1) : path
    const blob = await downloadWorkspaceFile(threadId, wsPath)
    workspaceImageCache[cacheKey] = URL.createObjectURL(blob)
  } catch {
    workspaceImageCache[cacheKey] = 'error'
  }
}

// ===================== SSE Error Parser =====================

const parseSSEError = (errorStr) => {
  if (!errorStr) return '未知错误'
  // Try to extract the nested message from error strings like:
  // "Error code: 400 - {'error': {'message': \"...\", ...}}"
  const msgMatch = errorStr.match(/'message':\s*['"](.*?)['"]/)
  if (msgMatch) return msgMatch[1]
  // Fallback: strip "Error code: XXX - " prefix
  const prefixMatch = errorStr.match(/^Error code:\s*\d+\s*-\s*(.+)/)
  if (prefixMatch) return prefixMatch[1]
  return errorStr
}

// ===================== Message Timestamp & Copy =====================

const formatMsgTime = (ts) => {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    if (isNaN(d.getTime())) return ''
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
    if (d.toDateString() === now.toDateString()) return time
    return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${time}`
  } catch { return '' }
}

const copyMessageContent = async (msg) => {
  if (!msg.content) return
  try {
    await navigator.clipboard.writeText(msg.content)
    msg._copied = true
    setTimeout(() => { msg._copied = false }, 2000)
  } catch {
    ElMessage.error('复制失败')
  }
}

// ===================== Tool Args Formatter =====================

const formatToolArgs = (args) => {
  if (!args || typeof args !== 'object') return ''
  const entries = Object.entries(args)
  if (entries.length === 0) return ''
  if (entries.length === 1) {
    const [key, val] = entries[0]
    const valStr = typeof val === 'string' ? val : JSON.stringify(val)
    const display = valStr.length > 60 ? valStr.slice(0, 57) + '...' : valStr
    return `${key}: ${display}`
  }
  return entries.map(([k]) => k).join(', ')
}

// ===================== Tool Result First Line =====================

const getFirstLine = (text) => {
  if (!text) return ''
  const line = text.split('\n').find(l => l.trim()) || ''
  return line.length > 80 ? line.slice(0, 77) + '...' : line
}

// ===================== Todo & Tool Group Helpers =====================

// 获取非 write_todos / ask_user_question 的工具调用
const getRegularToolCalls = (msg) => {
  if (!msg.toolCalls || !msg.toolCalls.length) return []
  return msg.toolCalls.filter(tc => tc.tool !== 'write_todos' && tc.tool !== 'ask_user_question')
}

// ===================== Ask User Helpers =====================

// 判断问题是否已回答
const getQuestionAnswer = (q) => {
  if (q.answeredText) return q.answeredText
  if (q.multi_select) {
    return q.selectedOptions && q.selectedOptions.length > 0
      ? q.selectedOptions.filter(s => s !== '__custom__').join(', ')
      : ''
  }
  if (q.selectedOption && q.selectedOption !== '__custom__') return q.selectedOption
  if (q.selectedOption === '__custom__' && q.customText) return q.customText
  return ''
}

// 判断答案是否在预设选项中
const isAnswerInOptions = (q) => {
  if (!q.answeredText || !q.options) return false
  return q.options.some(opt => opt.label === q.answeredText)
}

// 多选切换
const toggleMultiOption = (q, label) => {
  if (!q.selectedOptions) q.selectedOptions = []
  const idx = q.selectedOptions.indexOf(label)
  if (idx >= 0) q.selectedOptions.splice(idx, 1)
  else q.selectedOptions.push(label)
}

// 是否显示自定义输入框
const showCustomInput = (q) => {
  if (!q.options || !q.options.length) return false
  if (q.multi_select) return q.selectedOptions?.includes('__custom__')
  return q.selectedOption === '__custom__'
}

// 获取当前选中选项的描述
const getSelectedDesc = (q) => {
  if (!q || !q.options) return ''
  if (q.multi_select) {
    const descs = (q.selectedOptions || [])
      .filter(s => s !== '__custom__')
      .map(s => q.options.find(o => o.label === s))
      .filter(o => o && o.description)
      .map(o => o.description)
    return descs.join('；')
  }
  if (!q.selectedOption || q.selectedOption === '__custom__') return ''
  const opt = q.options.find(o => o.label === q.selectedOption)
  return opt?.description || ''
}

// 工具调用组摘要文本
const getToolGroupSummary = (msg) => {
  const tools = getRegularToolCalls(msg)
  const loadingCount = tools.filter(t => t.loading).length
  if (loadingCount > 0) {
    return `正在执行工具 (${tools.length - loadingCount}/${tools.length})`
  }
  const successCount = tools.filter(t => t.result !== null && t.result !== undefined).length
  return `${successCount} 个工具调用成功`
}

// 流式模式工具进度计数
const getToolStreamCounter = (msg) => {
  const tools = getRegularToolCalls(msg)
  const doneCount = tools.filter(t => !t.loading).length
  return `${doneCount}/${tools.length}`
}

// ===================== Store =====================

const userStore = useUserStore()
// 缓存用户头像为 blob URL，避免每条消息都重新请求服务器
const cachedUserAvatar = ref('')
const userAvatar = computed(() => cachedUserAvatar.value || userStore.avatar)

const cacheUserAvatar = async () => {
  const url = userStore.avatar
  if (!url) return
  try {
    const resp = await fetch(url)
    if (!resp.ok) return
    const blob = await resp.blob()
    cachedUserAvatar.value = URL.createObjectURL(blob)
  } catch {
    // 缓存失败时回退到原始 URL
  }
}

// ===================== State =====================

const sidebarCollapsed = ref(false)
const workspacePanelVisible = ref(false)
const selectedProvider = ref('openai')
const selectedModel = ref('gpt-5.2')
const modelPopoverVisible = ref(false)
const enableThinking = ref(false)
const enableWebSearch = ref(false)
const mcpPopoverVisible = ref(false)
const mcpConfigList = ref([])
const selectedMcpConfigIds = ref([])
const mcpLoading = ref(false)
const inputMessage = ref('')
const isStreaming = ref(false)
const conversations = ref([])
const currentConversationId = ref(null)
const historyLoading = ref(false)
const historyHasMore = ref(false)
const historyPage = ref(1)
const historyPageSize = 15
const todoFloatExpanded = ref(false)
const pendingAttachments = ref([])
const attachmentUploading = ref(false)
const attachmentFileInputRef = ref(null)
const attachmentLocalPreviews = ref([])

const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ATTACHMENT_MAX_COUNT = 5
const ATTACHMENT_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
const ATTACHMENT_TEXT_EXTS = ['.txt', '.json', '.csv', '.md', '.log', '.xml', '.yaml', '.yml']
const ATTACHMENT_ALL_EXTS = [...ATTACHMENT_IMAGE_EXTS, ...ATTACHMENT_TEXT_EXTS]

// Image blob URL cache: storedName -> blobUrl
const attachmentImageCache = reactive({})

// Workspace image cache for markdown-rendered images: "threadId:/path" -> blobUrl | 'loading' | 'error'
const workspaceImageCache = reactive({})
const WS_IMAGE_PATH_REGEX = /<code>(\/[^\s<>`]+\.(?:png|jpg|jpeg|gif|webp|bmp|svg))<\/code>/gi

// Image lightbox
const lightboxVisible = ref(false)
const lightboxUrl = ref('')
const lightboxAlt = ref('')
const openImageLightbox = (url, alt) => {
  lightboxUrl.value = url
  lightboxAlt.value = alt || ''
  lightboxVisible.value = true
}
const closeLightbox = () => {
  lightboxVisible.value = false
}

const handleMessagesClick = (e) => {
  const img = e.target.closest('.ws-rendered-image')
  if (img) {
    openImageLightbox(img.src, img.alt)
  }
}

let abortController = null
let highlightTimer = null

const messagesRef = ref(null)
const inputRef = ref(null)
const thinkingScrollRefs = reactive({})

// ===================== Computed =====================

const providerOptions = computed(() =>
  Object.entries(PROVIDER_MODELS).map(([key, val]) => ({ key, label: val.label, abbr: val.abbr, color: val.color }))
)

const modelOptions = computed(() => PROVIDER_MODELS[selectedProvider.value]?.models || [])

const currentProviderInfo = computed(() => PROVIDER_MODELS[selectedProvider.value] || {})

const selectProvider = (key) => {
  selectedProvider.value = key
}

const selectModel = (model) => {
  selectedModel.value = model
  modelPopoverVisible.value = false
}

const currentConversation = computed(() =>
  conversations.value.find(c => c.threadId === currentConversationId.value)
)

const currentMessages = computed(() => {
  const msgs = currentConversation.value?.messages || []
  return msgs.filter(msg => {
    if (msg.role !== 'assistant') return true
    // 过滤掉空的 assistant 消息（无内容、无工具调用、非加载中、无错误）
    if (msg.loading) return true
    if (msg.content) return true
    if (msg.thinkingContent) return true
    if (msg.errorMessage) return true
    if (msg.toolCalls && msg.toolCalls.length) return true
    return false
  })
})

const hasActiveAskUser = computed(() => {
  if (!currentConversation.value) return false
  return currentConversation.value.messages.some(
    m => m.role === 'ask_user' && !m.processed
  )
})

// ===================== Todo Float Panel Computed =====================

// Merged todos: take the latest write_todos result as the single source of truth
const mergedTodos = computed(() => {
  let latest = null
  for (const msg of currentMessages.value) {
    if (msg.role === 'assistant' && msg.todos && msg.todos.length) {
      latest = msg.todos
    }
  }
  return latest || []
})

// Stats text for header badge
const latestTodoStats = computed(() => {
  if (!mergedTodos.value.length) return ''
  const completed = mergedTodos.value.filter(t => t.status === 'completed').length
  return `${completed}/${mergedTodos.value.length}`
})

// Current in-progress task name (for collapsed inline hint)
const currentInProgressTodo = computed(() => {
  if (!mergedTodos.value.length) return ''
  const inProgress = mergedTodos.value.find(t => t.status === 'in_progress')
  if (!inProgress) return ''
  const text = inProgress.content
  return text.length > 20 ? text.slice(0, 18) + '...' : text
})

const sortedConversations = computed(() =>
  [...conversations.value].sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
)

// ===================== Methods =====================

const createNewChat = () => {
  if (isStreaming.value) stopStreaming()
  const conv = {
    threadId: generateId(),
    title: '',
    messages: [],
    createTime: new Date().toISOString(),
    isNew: true
  }
  conversations.value.unshift(conv)
  currentConversationId.value = conv.threadId
  historyHasMore.value = false
  historyPage.value = 1
  todoFloatExpanded.value = false
  nextTick(() => inputRef.value?.focus())
}

const switchConversation = async (threadId) => {
  if (threadId === currentConversationId.value) return
  if (isStreaming.value) stopStreaming()
  currentConversationId.value = threadId
  todoFloatExpanded.value = false

  const conv = currentConversation.value
  if (conv && !conv.isNew && conv.messages.length === 0) {
    // 加载历史消息
    historyPage.value = 1
    await loadChatHistory(threadId)
  }

  nextTick(() => {
    scrollToBottom(true)
    highlightCode()
  })
}

const deleteConversation = async (threadId) => {
  try {
    await request({
      url: `/chat/thread/${threadId}`,
      method: 'delete'
    })
    const idx = conversations.value.findIndex(c => c.threadId === threadId)
    if (idx === -1) return
    if (isStreaming.value && currentConversationId.value === threadId) stopStreaming()
    conversations.value.splice(idx, 1)
    if (currentConversationId.value === threadId) {
      currentConversationId.value = conversations.value[0]?.threadId || null
    }
  } catch (error) {
    console.error('删除对话失败:', error)
  }
}

// 转换接口返回的历史消息格式（turns 格式）
// 每个 turn 包含一次用户请求及其所有关联事件（tool_call / tool_result / content / thinking / interrupt）
const transformHistoryMessages = (turns, threadId) => {
  const result = []

  for (const turn of turns) {
    // 用户消息
    result.push({
      id: turn.requestId + '-user',
      role: 'user',
      content: turn.userMessage,
      attachments: turn.attachments || null
    })

    // 处理该轮的所有事件，构建 assistant 消息
    const assistantMsg = {
      id: turn.requestId + '-assistant',
      role: 'assistant',
      content: '',
      thinkingContent: '',
      thinkingExpanded: false,
      toolCalls: [],
      todos: [],
      toolCallsExpanded: false,
      loading: false,
      timestamp: null,
      _copied: false
    }

    let hasAssistantContent = false

    for (const event of (turn.events || [])) {
      if (event.type === 'content') {
        assistantMsg.content += event.content || ''
        if (event.timestamp) assistantMsg.timestamp = event.timestamp
        hasAssistantContent = true
      } else if (event.type === 'thinking') {
        assistantMsg.thinkingContent += event.content || ''
        assistantMsg.thinkingExpanded = false
        hasAssistantContent = true
      } else if (event.type === 'tool_call') {
        // ask_user_question 工具: 仅暂存 questions，不作为普通工具展示
        if (event.tool === 'ask_user_question') {
          assistantMsg._pendingAskUser = {
            callId: event.callId,
            questions: event.args?.questions || []
          }
          hasAssistantContent = true
        } else {
          assistantMsg.toolCalls.push({
            tool: event.tool,
            args: event.args || null,
            result: null,
            loading: false,
            callId: event.callId,
            expanded: false
          })
          // 提取 write_todos 的待办清单（保留最后一次状态）
          if (event.tool === 'write_todos' && event.args?.todos) {
            assistantMsg.todos = event.args.todos
          }
          hasAssistantContent = true
        }
      } else if (event.type === 'tool_result') {
        // ask_user_question 的结果: 转换为 ask_user 消息，展示问题和已选答案
        if (event.tool === 'ask_user_question') {
          // 先推出 assistantMsg（如果有内容）
          if (hasAssistantContent) {
            const { _pendingAskUser, ...cleanMsg } = assistantMsg
            result.push({ ...cleanMsg })
            assistantMsg.content = ''
            assistantMsg.thinkingContent = ''
            assistantMsg.toolCalls = []
            assistantMsg._pendingAskUser = null
          }

          // 解析用户的回答
          let answersMap = {}
          try {
            answersMap = event.result ? JSON.parse(event.result) : {}
          } catch { answersMap = {} }

          const questions = (event.args?.questions || assistantMsg._pendingAskUser?.questions || [])
          result.push({
            id: turn.requestId + '-ask_user-' + (event.callId || ''),
            role: 'ask_user',
            threadId: threadId,
            requestId: event.callId,
            activeIdx: 0,
            questions: questions.map(q => {
              const answer = answersMap[q.question] || ''
              const isInOptions = q.options?.some(opt => opt.label === answer)
              return {
                ...q,
                selectedOption: isInOptions ? answer : (answer ? '__custom__' : null),
                selectedOptions: [],
                customText: isInOptions ? '' : answer,
                answeredText: answer
              }
            }),
            submitting: false,
            processed: true
          })
          hasAssistantContent = false
        } else {
          // 通过 callId 匹配已有的 tool_call
          const tc = event.callId
            ? assistantMsg.toolCalls.find(t => t.callId === event.callId)
            : assistantMsg.toolCalls.find(t => t.tool === event.tool && !t.result)
          if (tc) {
            tc.result = event.result
            tc.args = event.args || tc.args
          } else {
            assistantMsg.toolCalls.push({
              tool: event.tool,
              args: event.args || null,
              result: event.result,
              loading: false,
              callId: event.callId,
              expanded: false
            })
          }
          // 提取 write_todos 的待办清单（保留最后一次状态）
          if (event.tool === 'write_todos' && event.args?.todos) {
            assistantMsg.todos = event.args.todos
          }
          hasAssistantContent = true
        }
      } else if (event.type === 'interrupt') {
        // 历史中的审批消息
        if (hasAssistantContent) {
          result.push({ ...assistantMsg })
          assistantMsg.content = ''
          assistantMsg.thinkingContent = ''
          assistantMsg.toolCalls = []
        }
        result.push({
          id: turn.requestId + '-interrupt',
          role: 'interrupt',
          threadId: threadId,
          actions: (event.actions || []).map(action => ({
            ...action,
            decision: null,
            editedArgsText: JSON.stringify(action.args, null, 2)
          })),
          submitting: false,
          processed: true
        })
        hasAssistantContent = false
      } else if (event.type === 'ask_user') {
        // 历史中的 AI 提问消息
        if (hasAssistantContent) {
          result.push({ ...assistantMsg })
          assistantMsg.content = ''
          assistantMsg.thinkingContent = ''
          assistantMsg.toolCalls = []
        }
        result.push({
          id: turn.requestId + '-ask_user',
          role: 'ask_user',
          threadId: threadId,
          requestId: event.request_id,
          activeIdx: 0,
          questions: (event.questions || []).map(q => ({
            ...q,
            selectedOption: null,
            selectedOptions: [],
            customText: ''
          })),
          submitting: false,
          processed: true
        })
        hasAssistantContent = false
      } else if (event.type === 'error') {
        assistantMsg.errorMessage = parseSSEError(event.error)
        hasAssistantContent = true
      }
    }

    // 处理未匹配 tool_result 的 ask_user_question tool_call
    // 当 turn 的最后一个事件是 ask_user_question 的 tool_call 且没有对应的 tool_result 时,
    // _pendingAskUser 仍然挂在 assistantMsg 上，需要将其作为未处理的 ask_user 消息渲染
    if (assistantMsg._pendingAskUser) {
      // 先推出 assistantMsg（去掉 _pendingAskUser 临时字段）
      if (hasAssistantContent) {
        const { _pendingAskUser, ...cleanMsg } = assistantMsg
        result.push({ ...cleanMsg })
        hasAssistantContent = false
      }
      // 创建未处理的 ask_user 消息
      const pending = assistantMsg._pendingAskUser
      result.push({
        id: turn.requestId + '-ask_user-' + (pending.callId || ''),
        role: 'ask_user',
        threadId: threadId,
        requestId: pending.callId,
        activeIdx: 0,
        questions: (pending.questions || []).map(q => ({
          ...q,
          selectedOption: null,
          selectedOptions: [],
          customText: '',
          answeredText: ''
        })),
        submitting: false,
        processed: false
      })
    } else if (hasAssistantContent) {
      result.push(assistantMsg)
    }
  }

  return result
}

// 加载聊天历史
const loadChatHistory = async (threadId, prepend = false) => {
  if (historyLoading.value) return

  historyLoading.value = true
  try {
    const res = await request({
      url: '/chat/agent/history',
      method: 'get',
      params: {
        thread_id: threadId,
        page: historyPage.value,
        page_size: historyPageSize
      }
    })

    if (res.data) {
      // API 返回的 turns 按时间倒序排列，需要反转为正序显示
      const turns = [...(res.data.turns || [])].reverse()
      const transformedMessages = transformHistoryMessages(turns, threadId)
      const conv = conversations.value.find(c => c.threadId === threadId)

      if (conv) {
        if (prepend) {
          // 加载更多历史消息，需要插入到前面
          conv.messages.unshift(...transformedMessages)
        } else {
          // 首次加载
          conv.messages = transformedMessages
        }
        // Load image attachments from history
        loadAttachmentImagesForMessages(transformedMessages)
      }

      historyHasMore.value = res.data.hasMore
    }
  } catch (error) {
    console.error('加载聊天历史失败:', error)
  } finally {
    historyLoading.value = false
  }
}

// 加载更多历史消息
const loadMoreHistory = async () => {
  if (!historyHasMore.value || historyLoading.value || !currentConversationId.value) return

  const el = messagesRef.value
  const prevScrollHeight = el?.scrollHeight || 0

  historyPage.value++
  await loadChatHistory(currentConversationId.value, true)

  // 保持滚动位置
  nextTick(() => {
    if (el) {
      const newScrollHeight = el.scrollHeight
      el.scrollTop = newScrollHeight - prevScrollHeight
    }
    highlightCode()
  })
}

// ===================== Attachment Handling =====================

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const triggerAttachmentInput = () => {
  attachmentFileInputRef.value?.click()
}

const removeAttachment = (index) => {
  if (attachmentLocalPreviews.value[index]) {
    URL.revokeObjectURL(attachmentLocalPreviews.value[index])
  }
  pendingAttachments.value.splice(index, 1)
  attachmentLocalPreviews.value.splice(index, 1)
}

const clearAllAttachments = () => {
  attachmentLocalPreviews.value.forEach(url => url && URL.revokeObjectURL(url))
  pendingAttachments.value = []
  attachmentLocalPreviews.value = []
}

const handleAttachmentSelect = async (event) => {
  const input = event.target
  const files = Array.from(input.files || [])
  input.value = '' // reset

  if (!files.length) return

  // Ensure we have a thread
  if (!currentConversationId.value) createNewChat()
  if (!currentConversationId.value) return

  const remaining = ATTACHMENT_MAX_COUNT - pendingAttachments.value.length
  if (remaining <= 0) {
    ElMessage.warning(`最多只能添加 ${ATTACHMENT_MAX_COUNT} 个附件`)
    return
  }
  const filesToUpload = files.slice(0, remaining)
  if (files.length > remaining) {
    ElMessage.warning(`已选择 ${files.length} 个文件，仅上传前 ${remaining} 个`)
  }

  // Client-side validation
  const validFiles = []
  for (const file of filesToUpload) {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
    if (!ATTACHMENT_ALL_EXTS.includes(ext)) {
      ElMessage.error(`不支持的文件类型: ${file.name}`)
      continue
    }
    if (file.size > ATTACHMENT_MAX_SIZE) {
      ElMessage.error(`文件过大（超过10MB）: ${file.name}`)
      continue
    }
    validFiles.push(file)
  }
  if (!validFiles.length) return

  attachmentUploading.value = true
  try {
    const res = await uploadChatAttachments(currentConversationId.value, validFiles)
    const data = res.data || res
    const attachments = data.attachments || []
    const failed = data.failed || []

    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i]
      pendingAttachments.value.push(att)
      if (att.fileType === 'image') {
        const matchFile = validFiles.find(f => f.name === att.filename)
        attachmentLocalPreviews.value.push(matchFile ? URL.createObjectURL(matchFile) : '')
      } else {
        attachmentLocalPreviews.value.push('')
      }
    }

    for (const fail of failed) {
      ElMessage.error(`${fail.filename}: ${fail.error}`)
    }
  } catch (err) {
    ElMessage.error(err.message || '附件上传失败')
  } finally {
    attachmentUploading.value = false
  }
}

// Load a single image attachment into cache
const loadAttachmentImage = async (att) => {
  if (!att || att.fileType !== 'image' || !att.storedName) return
  if (attachmentImageCache[att.storedName]) return // already cached
  try {
    attachmentImageCache[att.storedName] = '' // mark as loading
    const blobUrl = await fetchAttachmentBlob(currentConversationId.value, att.storedName)
    attachmentImageCache[att.storedName] = blobUrl
  } catch {
    delete attachmentImageCache[att.storedName]
  }
}

// Scan messages and load all image attachments not yet cached
const loadAttachmentImagesForMessages = (messages) => {
  for (const msg of messages) {
    if (msg.role === 'user' && msg.attachments) {
      for (const att of msg.attachments) {
        if (att.fileType === 'image' && !attachmentImageCache[att.storedName]) {
          loadAttachmentImage(att)
        }
      }
    }
  }
}

// ===================== MCP Config =====================

const fetchMcpConfigs = async () => {
  if (mcpLoading.value) return
  mcpLoading.value = true
  try {
    const res = await allMcpconfig()
    mcpConfigList.value = res.data || []
  } catch (e) {
    console.error('Failed to fetch MCP configs:', e)
    mcpConfigList.value = []
  } finally {
    mcpLoading.value = false
  }
}

const toggleMcpConfig = (configId, checked) => {
  if (checked) {
    if (!selectedMcpConfigIds.value.includes(configId)) {
      selectedMcpConfigIds.value.push(configId)
    }
  } else {
    selectedMcpConfigIds.value = selectedMcpConfigIds.value.filter(id => id !== configId)
  }
}

// ===================== Send Message =====================

const sendMessage = async () => {
  const text = inputMessage.value.trim()
  const hasAttachments = pendingAttachments.value.length > 0
  if ((!text && !hasAttachments) || isStreaming.value) return

  if (!currentConversationId.value) createNewChat()

  const conv = currentConversation.value
  if (!conv) return

  // Snapshot attachments before clearing
  const attachments = hasAttachments ? [...pendingAttachments.value] : undefined

  // Save local image preview URLs to cache before clearing
  if (hasAttachments) {
    for (let i = 0; i < pendingAttachments.value.length; i++) {
      const att = pendingAttachments.value[i]
      if (att.fileType === 'image' && attachmentLocalPreviews.value[i]) {
        attachmentImageCache[att.storedName] = attachmentLocalPreviews.value[i]
      }
    }
  }

  inputMessage.value = ''
  // Clear without revoking URLs that were transferred to cache
  pendingAttachments.value = []
  attachmentLocalPreviews.value = []
  nextTick(() => {
    if (inputRef.value) inputRef.value.style.height = 'auto'
  })

  // User message (with optional attachments)
  conv.messages.push({ id: generateId(), role: 'user', content: text, attachments: attachments || null })

  // Auto title
  if (!conv.title) {
    const titleText = text || (attachments ? `[${attachments[0].filename}]` : '新对话')
    conv.title = titleText.length > 24 ? titleText.slice(0, 24) + '...' : titleText
  }

  // Assistant placeholder
  conv.messages.push({
    id: generateId(),
    role: 'assistant',
    content: '',
    thinkingContent: '',
    thinkingExpanded: false,
    toolCalls: [],
    todos: [],
    toolCallsExpanded: false,
    errorMessage: '',
    loading: true,
    timestamp: null,
    _copied: false
  })
  conv.updatedAt = Date.now()
  scrollToBottom(true)

  const assistantMsg = conv.messages[conv.messages.length - 1]
  isStreaming.value = true
  abortController = new AbortController()

  try {
    const baseURL = import.meta.env.VITE_APP_BASE_API
    const response = await fetch(`${baseURL}/chat/agent/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify({
        providerKey: selectedProvider.value,
        model: selectedModel.value,
        threadId: conv.threadId,
        message: text,
        attachments: attachments,
        enableThinking: enableThinking.value,
        enableWebSearch: enableWebSearch.value,
        ...(selectedMcpConfigIds.value.length > 0 ? { mcpConfigIds: selectedMcpConfigIds.value } : {})
      }),
      signal: abortController.signal
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ''

      let updated = false
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const data = trimmed.slice(trimmed.indexOf(':') + 1).trim()
        if (data === '[DONE]') {
          assistantMsg.loading = false
          break
        }

        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'content') {
            assistantMsg.content += parsed.content
            if (parsed.timestamp) assistantMsg.timestamp = parsed.timestamp
            updated = true
          } else if (parsed.type === 'thinking') {
            assistantMsg.thinkingContent += parsed.content
            nextTick(() => scrollThinkingToBottom(assistantMsg.id))
            updated = true
          } else if (parsed.type === 'tool_call') {
            if (parsed.tool === 'ask_user_question') {
              // ask_user_question 的 tool_call 不作为普通工具展示，跳过
              updated = true
            } else {
              assistantMsg.toolCalls.push({ tool: parsed.tool, args: parsed.args || null, result: null, loading: true, callId: parsed.call_id || null, expanded: false })
              // 提取 write_todos 的待办清单
              if (parsed.tool === 'write_todos' && parsed.args?.todos) {
                assistantMsg.todos = parsed.args.todos
              }
              updated = true
            }
          } else if (parsed.type === 'tool_result') {
            if (parsed.tool === 'ask_user_question') {
              // ask_user_question 的 tool_result 不作为普通工具展示，跳过
              updated = true
            } else {
              // 优先通过 call_id 匹配，回退到 tool name + loading 状态匹配
              let tc = null
              if (parsed.call_id) {
                tc = assistantMsg.toolCalls.find(t => t.callId === parsed.call_id)
              }
              if (!tc) {
                tc = assistantMsg.toolCalls.find(t => t.tool === parsed.tool && t.loading)
              }
              if (tc) {
                tc.result = parsed.result
                tc.args = parsed.args || tc.args
                tc.loading = false
              } else {
                assistantMsg.toolCalls.push({ tool: parsed.tool, args: parsed.args || null, result: parsed.result, loading: false, callId: parsed.call_id || null, expanded: false })
              }
              // 提取 write_todos 的待办清单
              if (parsed.tool === 'write_todos' && parsed.args?.todos) {
                assistantMsg.todos = parsed.args.todos
              }
              updated = true
            }
          } else if (parsed.type === 'interrupt') {
            // 人机交互审批 - 添加到消息流中
            assistantMsg.loading = false
            const interruptMsg = {
              id: generateId(),
              role: 'interrupt',
              threadId: conv.threadId,
              actions: parsed.actions.map(action => ({
                ...action,
                decision: null, // 'approve' | 'edit' | 'reject'
                editedArgsText: JSON.stringify(action.args, null, 2)
              })),
              submitting: false
            }
            conv.messages.push(interruptMsg)
            isStreaming.value = false
            scrollToBottom(true)
            return // 停止当前流
          } else if (parsed.type === 'ask_user') {
            // AI 提问 - 暂停流，等待用户回答
            assistantMsg.loading = false
            const askUserMsg = {
              id: generateId(),
              role: 'ask_user',
              threadId: conv.threadId,
              requestId: parsed.request_id,
              activeIdx: 0,
              questions: parsed.questions.map(q => ({
                ...q,
                selectedOption: null,
                selectedOptions: [],
                customText: ''
              })),
              submitting: false,
              processed: false
            }
            conv.messages.push(askUserMsg)
            isStreaming.value = false
            scrollToBottom(true)
            return
          } else if (parsed.type === 'error') {
            assistantMsg.errorMessage = parseSSEError(parsed.error)
            assistantMsg.loading = false
            updated = true
          }
        } catch {
          // Skip malformed JSON lines
        }
      }

      if (updated) {
        scrollToBottom()
        debouncedHighlight()
      }
    }

    assistantMsg.loading = false
  } catch (error) {
    if (error.name === 'AbortError') {
      if (!assistantMsg.content) assistantMsg.content = '(已停止生成)'
    } else {
      console.error('Chat SSE error:', error)
      assistantMsg.content += `\n\n> 请求失败: ${error.message}`
    }
    assistantMsg.loading = false
  } finally {
    isStreaming.value = false
    abortController = null
    highlightCode()
  }
}

const stopStreaming = () => {
  if (abortController) abortController.abort()
}

// 终止会话
const stopSession = async () => {
  if (!currentConversationId.value) return

  try {
    await stopChatSession(currentConversationId.value)

    // 停止当前流式请求
    if (abortController) {
      abortController.abort()
    }

    isStreaming.value = false

    // 在消息中添加终止提示
    const conv = currentConversation.value
    if (conv && conv.messages.length > 0) {
      const lastMsg = conv.messages[conv.messages.length - 1]
      if (lastMsg.role === 'assistant' && lastMsg.loading) {
        lastMsg.loading = false
        if (!lastMsg.content) {
          lastMsg.content = '(会话已终止)'
        } else {
          lastMsg.content += '\n\n> 会话已终止'
        }
      }
    }

    ElMessage.success('会话已终止')
  } catch (error) {
    console.error('终止会话失败:', error)
    ElMessage.error('终止会话失败')
  }
}

// 处理决策变化
const handleDecisionChange = (action) => {
  // 当切换到 edit 模式时，初始化编辑文本
  if (action.decision === 'edit' && !action.editedArgsText) {
    action.editedArgsText = JSON.stringify(action.args, null, 2)
  }
}

// 检查是否可以提交审批
const canSubmitApproval = (msg) => {
  return msg.actions.every(action => {
    if (!action.decision) return false
    if (action.decision === 'edit') {
      // 编辑模式需要验证 JSON 格式
      try {
        JSON.parse(action.editedArgsText)
        return true
      } catch {
        return false
      }
    }
    return true
  })
}

// 提交审批决策
const submitApproval = async (interruptMsg) => {
  if (!canSubmitApproval(interruptMsg)) return

  interruptMsg.submitting = true

  // 构建决策列表
  const decisions = interruptMsg.actions.map(action => {
    const decision = {
      type: action.decision
    }
    if (action.decision === 'edit') {
      try {
        decision.editedAction = JSON.parse(action.editedArgsText)
      } catch (e) {
        console.error('JSON 解析失败:', e)
        return null
      }
    }
    return decision
  }).filter(d => d !== null)

  const conv = conversations.value.find(c => c.threadId === interruptMsg.threadId)
  if (!conv) {
    interruptMsg.submitting = false
    return
  }

  // 标记 interrupt 消息为已处理
  interruptMsg.processed = true

  // 添加一条 AI 消息占位符
  const assistantMsg = {
    id: generateId(),
    role: 'assistant',
    content: '',
    thinkingContent: '',
    thinkingExpanded: false,
    toolCalls: [],
    todos: [],
    toolCallsExpanded: false,
    errorMessage: '',
    loading: true,
    timestamp: null,
    _copied: false
  }
  conv.messages.push(assistantMsg)
  scrollToBottom(true)

  isStreaming.value = true
  abortController = new AbortController()

  try {
    const baseURL = import.meta.env.VITE_APP_BASE_API
    const response = await fetch(`${baseURL}/chat/agent/interrupt/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify({
        threadId: interruptMsg.threadId,
        decisions
      }),
      signal: abortController.signal
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ''

      let updated = false
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const data = trimmed.slice(trimmed.indexOf(':') + 1).trim()
        if (data === '[DONE]') {
          assistantMsg.loading = false
          break
        }

        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'content') {
            assistantMsg.content += parsed.content
            if (parsed.timestamp) assistantMsg.timestamp = parsed.timestamp
            updated = true
          } else if (parsed.type === 'thinking') {
            assistantMsg.thinkingContent += parsed.content
            nextTick(() => scrollThinkingToBottom(assistantMsg.id))
            updated = true
          } else if (parsed.type === 'tool_call') {
            if (parsed.tool === 'ask_user_question') {
              updated = true
            } else {
              assistantMsg.toolCalls.push({ tool: parsed.tool, args: parsed.args || null, result: null, loading: true, callId: parsed.call_id || null, expanded: false })
              if (parsed.tool === 'write_todos' && parsed.args?.todos) {
                assistantMsg.todos = parsed.args.todos
              }
              updated = true
            }
          } else if (parsed.type === 'tool_result') {
            if (parsed.tool === 'ask_user_question') {
              updated = true
            } else {
              let tc = null
              if (parsed.call_id) {
                tc = assistantMsg.toolCalls.find(t => t.callId === parsed.call_id)
              }
              if (!tc) {
                tc = assistantMsg.toolCalls.find(t => t.tool === parsed.tool && t.loading)
              }
              if (tc) {
                tc.result = parsed.result
                tc.args = parsed.args || tc.args
                tc.loading = false
              } else {
                assistantMsg.toolCalls.push({ tool: parsed.tool, args: parsed.args || null, result: parsed.result, loading: false, callId: parsed.call_id || null, expanded: false })
              }
              if (parsed.tool === 'write_todos' && parsed.args?.todos) {
                assistantMsg.todos = parsed.args.todos
              }
              updated = true
            }
          } else if (parsed.type === 'interrupt') {
            assistantMsg.loading = false
            const newInterruptMsg = {
              id: generateId(),
              role: 'interrupt',
              threadId: interruptMsg.threadId,
              actions: parsed.actions.map(action => ({
                ...action,
                decision: null,
                editedArgsText: JSON.stringify(action.args, null, 2)
              })),
              submitting: false
            }
            conv.messages.push(newInterruptMsg)
            isStreaming.value = false
            scrollToBottom(true)
            return
          } else if (parsed.type === 'ask_user') {
            assistantMsg.loading = false
            const newAskUserMsg = {
              id: generateId(),
              role: 'ask_user',
              threadId: interruptMsg.threadId,
              requestId: parsed.request_id,
              activeIdx: 0,
              questions: parsed.questions.map(q => ({
                ...q,
                selectedOption: null,
                selectedOptions: [],
                customText: ''
              })),
              submitting: false,
              processed: false
            }
            conv.messages.push(newAskUserMsg)
            isStreaming.value = false
            scrollToBottom(true)
            return
          } else if (parsed.type === 'error') {
            assistantMsg.errorMessage = parseSSEError(parsed.error)
            assistantMsg.loading = false
            updated = true
          }
        } catch {
          // Skip malformed JSON lines
        }
      }

      if (updated) {
        scrollToBottom()
        debouncedHighlight()
      }
    }

    assistantMsg.loading = false
  } catch (error) {
    if (error.name === 'AbortError') {
      if (!assistantMsg.content) assistantMsg.content = '(已停止生成)'
    } else {
      console.error('Resume SSE error:', error)
      assistantMsg.content += `\n\n> 请求失败: ${error.message}`
    }
    assistantMsg.loading = false
  } finally {
    interruptMsg.submitting = false
    isStreaming.value = false
    abortController = null
    highlightCode()
  }
}

// 取消审批
const cancelApproval = (interruptMsg) => {
  const conv = conversations.value.find(c => c.threadId === interruptMsg.threadId)
  if (conv) {
    // 标记为已处理
    interruptMsg.processed = true
    interruptMsg.cancelled = true
    // 添加取消提示
    conv.messages.push({
      id: generateId(),
      role: 'assistant',
      content: '(用户取消了操作审批)',
      loading: false
    })
  }
}

// ===================== Ask User Methods =====================

// 检查是否可以提交回答
const canSubmitAnswer = (msg) => {
  return msg.questions.every(q => {
    if (q.options && q.options.length) {
      if (q.multi_select) {
        if (!q.selectedOptions || q.selectedOptions.length === 0) return false
        if (q.selectedOptions.includes('__custom__') && !q.customText.trim()) return false
      } else {
        if (!q.selectedOption) return false
        if (q.selectedOption === '__custom__' && !q.customText.trim()) return false
      }
    } else {
      if (!q.customText || !q.customText.trim()) return false
    }
    return true
  })
}

// 提交 AI 提问的回答
const submitAnswer = async (askUserMsg) => {
  if (!canSubmitAnswer(askUserMsg)) return

  askUserMsg.submitting = true

  // 构建 answers map: { questionText: answer }
  const answers = {}
  for (const q of askUserMsg.questions) {
    if (q.options && q.options.length) {
      if (q.multi_select) {
        const selected = q.selectedOptions.filter(s => s !== '__custom__')
        if (q.selectedOptions.includes('__custom__') && q.customText.trim()) {
          selected.push(q.customText.trim())
        }
        answers[q.question] = selected.join(', ')
      } else {
        answers[q.question] = q.selectedOption === '__custom__'
          ? q.customText.trim()
          : q.selectedOption
      }
    } else {
      answers[q.question] = q.customText.trim()
    }
  }

  const conv = conversations.value.find(c => c.threadId === askUserMsg.threadId)
  if (!conv) {
    askUserMsg.submitting = false
    return
  }

  // 标记为已处理
  askUserMsg.processed = true

  // 添加 AI 消息占位符
  const assistantMsg = {
    id: generateId(),
    role: 'assistant',
    content: '',
    thinkingContent: '',
    thinkingExpanded: false,
    toolCalls: [],
    todos: [],
    toolCallsExpanded: false,
    errorMessage: '',
    loading: true,
    timestamp: null,
    _copied: false
  }
  conv.messages.push(assistantMsg)
  scrollToBottom(true)

  isStreaming.value = true
  abortController = new AbortController()

  try {
    const baseURL = import.meta.env.VITE_APP_BASE_API
    const response = await fetch(`${baseURL}/chat/agent/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify({
        providerKey: selectedProvider.value,
        model: selectedModel.value,
        threadId: askUserMsg.threadId,
        answers,
        enableThinking: enableThinking.value,
        enableWebSearch: enableWebSearch.value,
        ...(selectedMcpConfigIds.value.length > 0 ? { mcpConfigIds: selectedMcpConfigIds.value } : {})
      }),
      signal: abortController.signal
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ''

      let updated = false
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const data = trimmed.slice(trimmed.indexOf(':') + 1).trim()
        if (data === '[DONE]') {
          assistantMsg.loading = false
          break
        }

        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'content') {
            assistantMsg.content += parsed.content
            if (parsed.timestamp) assistantMsg.timestamp = parsed.timestamp
            updated = true
          } else if (parsed.type === 'thinking') {
            assistantMsg.thinkingContent += parsed.content
            nextTick(() => scrollThinkingToBottom(assistantMsg.id))
            updated = true
          } else if (parsed.type === 'tool_call') {
            if (parsed.tool === 'ask_user_question') {
              updated = true
            } else {
              assistantMsg.toolCalls.push({ tool: parsed.tool, args: parsed.args || null, result: null, loading: true, callId: parsed.call_id || null, expanded: false })
              if (parsed.tool === 'write_todos' && parsed.args?.todos) {
                assistantMsg.todos = parsed.args.todos
              }
              updated = true
            }
          } else if (parsed.type === 'tool_result') {
            if (parsed.tool === 'ask_user_question') {
              updated = true
            } else {
              let tc = null
              if (parsed.call_id) {
                tc = assistantMsg.toolCalls.find(t => t.callId === parsed.call_id)
              }
              if (!tc) {
                tc = assistantMsg.toolCalls.find(t => t.tool === parsed.tool && t.loading)
              }
              if (tc) {
                tc.result = parsed.result
                tc.args = parsed.args || tc.args
                tc.loading = false
              } else {
                assistantMsg.toolCalls.push({ tool: parsed.tool, args: parsed.args || null, result: parsed.result, loading: false, callId: parsed.call_id || null, expanded: false })
              }
              if (parsed.tool === 'write_todos' && parsed.args?.todos) {
                assistantMsg.todos = parsed.args.todos
              }
              updated = true
            }
          } else if (parsed.type === 'interrupt') {
            assistantMsg.loading = false
            const newInterruptMsg = {
              id: generateId(),
              role: 'interrupt',
              threadId: askUserMsg.threadId,
              actions: parsed.actions.map(action => ({
                ...action,
                decision: null,
                editedArgsText: JSON.stringify(action.args, null, 2)
              })),
              submitting: false
            }
            conv.messages.push(newInterruptMsg)
            isStreaming.value = false
            scrollToBottom(true)
            return
          } else if (parsed.type === 'ask_user') {
            // 递归提问
            assistantMsg.loading = false
            const newAskUserMsg = {
              id: generateId(),
              role: 'ask_user',
              threadId: askUserMsg.threadId,
              requestId: parsed.request_id,
              activeIdx: 0,
              questions: parsed.questions.map(q => ({
                ...q,
                selectedOption: null,
                selectedOptions: [],
                customText: ''
              })),
              submitting: false,
              processed: false
            }
            conv.messages.push(newAskUserMsg)
            isStreaming.value = false
            scrollToBottom(true)
            return
          } else if (parsed.type === 'error') {
            assistantMsg.errorMessage = parseSSEError(parsed.error)
            assistantMsg.loading = false
            updated = true
          }
        } catch {
          // Skip malformed JSON lines
        }
      }

      if (updated) {
        scrollToBottom()
        debouncedHighlight()
      }
    }

    assistantMsg.loading = false
  } catch (error) {
    if (error.name === 'AbortError') {
      if (!assistantMsg.content) assistantMsg.content = '(已停止生成)'
    } else {
      console.error('Answer SSE error:', error)
      assistantMsg.content += `\n\n> 请求失败: ${error.message}`
    }
    assistantMsg.loading = false
  } finally {
    askUserMsg.submitting = false
    isStreaming.value = false
    abortController = null
    highlightCode()
  }
}

// 跳过 AI 提问
const skipAskUser = (askUserMsg) => {
  const conv = conversations.value.find(c => c.threadId === askUserMsg.threadId)
  if (conv) {
    askUserMsg.processed = true
    conv.messages.push({
      id: generateId(),
      role: 'assistant',
      content: '(用户跳过了问题)',
      loading: false
    })
  }
}

// 获取风险等级样式
const getRiskLevelClass = (level) => {
  const map = {
    high: 'risk-high',
    medium: 'risk-medium',
    low: 'risk-low'
  }
  return map[level] || 'risk-low'
}

// 获取风险等级文本
const getRiskLevelText = (level) => {
  const map = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  }
  return map[level] || '未知'
}

const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    sendMessage()
  }
}

const autoResize = () => {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.max(63, Math.min(el.scrollHeight, 200)) + 'px'
}

const scrollToBottom = (force = false) => {
  nextTick(() => {
    const el = messagesRef.value
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150
    if (force || nearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: force ? 'auto' : 'smooth' })
    }
  })
}

const scrollThinkingToBottom = (msgId) => {
  const el = thinkingScrollRefs[msgId]
  if (el) {
    el.scrollTop = el.scrollHeight
  }
}

// 监听消息区域滚动，滚动到顶部时自动加载更多
const handleMessagesScroll = () => {
  const el = messagesRef.value
  if (!el) return

  // 滚动到顶部附近时加载更多
  if (el.scrollTop < 100 && historyHasMore.value && !historyLoading.value) {
    loadMoreHistory()
  }
}

const highlightCode = () => {
  nextTick(() => {
    const el = messagesRef.value
    if (!el) return
    el.querySelectorAll('pre code:not(.hljs)').forEach(block => {
      hljs.highlightElement(block)
    })
  })
}

const debouncedHighlight = () => {
  clearTimeout(highlightTimer)
  highlightTimer = setTimeout(highlightCode, 300)
}

const loadConversations = async () => {
  try {
    const res = await request({
      url: '/chat/thread/list',
      method: 'get'
    })
    if (res.rows && res.rows.length > 0) {
      conversations.value = res.rows.map(item => ({
        threadId: item.threadId,
        title: item.title,
        createTime: item.createTime,
        messages: [],
        isNew: false
      }))
      currentConversationId.value = res.rows[0].threadId
      // 加载第一个对话的历史消息
      await loadChatHistory(res.rows[0].threadId)
      nextTick(() => {
        scrollToBottom(true)
        highlightCode()
      })
    } else {
      conversations.value = []
    }
  } catch (error) {
    console.error('加载对话列表失败:', error)
    conversations.value = []
  }
}

// ===================== Watchers =====================

watch(selectedProvider, (val) => {
  const models = PROVIDER_MODELS[val]?.models || []
  if (models.length > 0 && !models.includes(selectedModel.value)) {
    selectedModel.value = models[0]
  }
})

// ===================== Lifecycle =====================

onMounted(() => {
  cacheUserAvatar()
  loadConversations()
})

onUnmounted(() => {
  if (abortController) abortController.abort()
  clearTimeout(highlightTimer)
  // 释放头像 blob URL
  if (cachedUserAvatar.value) {
    URL.revokeObjectURL(cachedUserAvatar.value)
  }
  // 释放 workspace 图片 blob URL
  Object.values(workspaceImageCache).forEach(url => {
    if (url && url !== 'loading' && url !== 'error') URL.revokeObjectURL(url)
  })
})
</script>

<style scoped src="./index.scoped.css"></style>

<!-- Unscoped styles for markdown v-html content -->
<style src="./index.css"></style>
