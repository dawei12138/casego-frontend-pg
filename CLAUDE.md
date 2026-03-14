# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CaseGo is a Vue 3-based API testing and workflow management platform. It provides comprehensive functionality for API project management, test case creation and execution, workflow orchestration, and environment configuration.

**Key Technologies:**
- Vue 3.5 with Composition API (`<script setup>`)
- Element Plus 2.10.5 (primary UI framework)
- Ant Design Vue 4.1.1 (supplementary components)
- Pinia 2.1.7 (state management)
- Vue Router 4.4.0 (routing)
- Vite 5.3.2 (build tool)
- Axios 1.11.0 (HTTP client)

## Common Commands

### Development
```bash
npm run dev           # Start dev server (port 80)
npm install          # Install dependencies
```

### Building
```bash
npm run build:prod   # Production build
npm run build:stage  # Staging build
npm run preview      # Preview production build
```

### Development Server
- Default port: 80
- API proxy: `/dev-api` → `http://127.0.0.1:9099`
- Auto-opens browser on start

## Architecture Overview

### Core Structure

**API Test Management System:**
- Projects → Submodules → Test Cases → Assertions/Headers/Params/etc.
- Workflow orchestration with node-based execution
- Environment-based configuration management
- Real-time test execution with response validation

**Component Architecture:**
```
views/
├── api_test_cases/test_cases/    # Main test case editor
│   └── components/               # Modular UI components
│       ├── CaseExplorer.vue     # Tree-based navigation
│       ├── CaseEditor.vue       # Main editor interface
│       ├── RequestSection.vue   # HTTP request configuration
│       ├── ResponseSection.vue  # Response display
│       ├── Assertions.vue       # Test assertions
│       └── [Other specialized components]
│
├── api_workflow/                 # Workflow orchestration
│   └── components/
│       ├── WorkflowNodeTree.vue # Node hierarchy
│       ├── NodeConfigDetail.vue # Node configuration
│       └── MainWorkspace.vue    # Canvas workspace
│
└── api_project/                  # Project management
```

### State Management (Pinia)

Located in `src/store/modules/`:
- `user.js` - Authentication, roles, permissions
- `permission.js` - Dynamic route generation based on user roles
- `app.js` - UI state (sidebar, device, size)
- `settings.js` - Theme and layout settings
- `tagsView.js` - Tab navigation history
- `dict.js` - Dictionary/enum management

### Request Handling

**Request Interceptor** (`src/utils/request.js`):
- Auto-adds `Authorization: Bearer <token>` header
- Anti-repeat submission mechanism (configurable via `repeatSubmit` header)
- Timeout: 20 seconds
- Auto-handles 401 (re-login), 500 (error), 601 (warning)

**Anti-Repeat Submission:**
- Disabled by default in code (lines 59-65 commented out)
- If enabled: prevents identical POST/PUT requests within 1 second
- Uses session storage to track request signature

### Permission System

**Route-level:**
```javascript
// In router definition
{
  path: '/system/user',
  permissions: ['system:user:list']
}
```

**Component-level:**
```vue
<!-- Button permission directive -->
<el-button v-hasPermi="['system:user:add']">Add</el-button>
```

**Implementation:**
- `src/permission.js` - Route guard with dynamic route loading
- `src/directive/permission/hasPermi.js` - Permission directive
- White-listed routes: `/login`, `/register`

### API Organization

All API functions are in `src/api/` grouped by feature:
- `api_test_cases/test_cases.js` - Test case CRUD
- `api_workflow/` - Workflow management
- `api_project/project.js` - Project operations
- `api_environments/environments.js` - Environment configs
- `api_*/` - Specialized resources (headers, params, assertions, cookies, etc.)

**Standard pattern:**
```javascript
import request from '@/utils/request'

export function listTestCases(query) {
  return request({
    url: '/api/test-cases',
    method: 'get',
    params: query
  })
}
```

## Development Guidelines

### Mandatory Patterns

**1. Always use `<script setup>` with Composition API:**
```vue
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

const loading = ref(false)
const formData = reactive({ name: '' })
</script>
```

**2. Extract business logic to composables:**
Create reusable logic in `src/composables/` or colocated with views:
```javascript
// composables/useUserManagement.js
export function useUserManagement() {
  const loading = ref(false)
  const userList = ref([])

  const fetchUsers = async () => {
    if (loading.value) return // Prevent duplicate requests
    loading.value = true
    try {
      const data = await getUserList()
      userList.value = data
    } finally {
      loading.value = false
    }
  }

  return { loading, userList, fetchUsers }
}
```

**3. Prefer Element Plus components over custom HTML:**
- Use `<el-card>`, `<el-row>`, `<el-col>` instead of custom divs
- Use Element Plus form validation
- Leverage built-in components: `<Pagination>`, `<RightToolbar>`, `<DictTag>`

**4. Prevent duplicate requests:**
```javascript
const submitLoading = ref(false)

const handleSubmit = async () => {
  if (submitLoading.value) return
  submitLoading.value = true
  try {
    await submitData()
  } finally {
    submitLoading.value = false
  }
}
```

### Code Organization

**Naming conventions:**
- Components: PascalCase (e.g., `UserManagement.vue`)
- Files: kebab-case (e.g., `user-management.vue`)
- Variables/functions: camelCase (e.g., `userName`, `fetchUserList`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

**File structure:**
```vue
<template>
  <!-- Template content -->
</template>

<script setup>
// 1. Imports
import { ref, reactive } from 'vue'
import { useRoute } from 'vue-router'

// 2. Props/Emits
const props = defineProps({ userId: String })
const emit = defineEmits(['update', 'delete'])

// 3. Composables/Stores
const route = useRoute()

// 4. Reactive state
const loading = ref(false)
const formData = reactive({})

// 5. Computed
const isValid = computed(() => formData.name.length > 0)

// 6. Methods
const handleSubmit = async () => {
  // Logic
}

// 7. Lifecycle hooks
onMounted(() => {
  // Init
})
</script>

<style scoped>
/* Minimal custom styles */
</style>
```

### Common Patterns

**Table with pagination:**
```vue
<el-table :data="list" :loading="loading">
  <el-table-column prop="name" label="Name" />
</el-table>

<pagination
  v-model:page="queryParams.pageNum"
  v-model:limit="queryParams.pageSize"
  :total="total"
  @pagination="fetchList"
/>
```

**Form validation:**
```vue
<el-form ref="formRef" :model="form" :rules="rules">
  <el-form-item label="Name" prop="name">
    <el-input v-model="form.name" />
  </el-form-item>
</el-form>

<script setup>
const formRef = ref()
const rules = {
  name: [
    { required: true, message: 'Name required', trigger: 'blur' }
  ]
}

const submit = async () => {
  await formRef.value.validate()
  // Submit logic
}
</script>
```

## Key Feature Areas

### Test Case Management
- **Main Interface:** `src/views/api_test_cases/test_cases/index.vue`
- Three-panel layout: Explorer (left) → Editor (center) → Response (right)
- Supports: HTTP methods, headers, params, body, assertions, pre/post scripts
- Real-time execution with response visualization

### Workflow Orchestration
- **Main Interface:** `src/views/api_workflow/index.vue`
- Node-based execution flow with parent-child relationships
- Node types: tasks with configuration
- Execution tracking via `api_workflow_executions` and `api_worknode_executions`

### Environment Management
- Multiple environments per project (dev/test/prod)
- Environment variables for dynamic values
- Scoped to projects with inheritance

## Configuration Files

**Environment variables** (`.env.*`):
```bash
VITE_APP_TITLE=CaseGo
VITE_APP_ENV='development'
VITE_APP_BASE_API='/dev-api'
```

**Vite config** (`vite.config.js`):
- Alias: `@` → `src/`
- Server port: 80
- Proxy: `/dev-api` to backend
- CommonJS plugin for `json-editor-vue3` compatibility
- Manual chunks for optimized builds

**Route configuration** (`src/router/index.js`):
- `constantRoutes` - Public routes
- `dynamicRoutes` - Permission-based routes (added dynamically)
- Uses `createWebHistory()` mode

## Known Issues & Solutions

**Concurrent request blocking** (documented in README.md):
- Issue: Multiple simultaneous requests can get stuck in development proxy
- Solution: Already configured with timeout handling in proxy settings
- Backend runs on: `http://127.0.0.1:9099`

**Form create integration:**
- Uses `@form-create/element-ui` for dynamic forms
- Requires CommonJS plugin: `@originjs/vite-plugin-commonjs`
- Pre-configured in `vite.config.js`

## Development Tips

1. **Check permissions first:** When adding new features, ensure proper permission strings in route meta and directives
2. **Use existing components:** Leverage `src/components/` for common UI patterns (Pagination, RightToolbar, FileUpload, etc.)
3. **Dictionary management:** Use `useDict()` composable for enum/dictionary values
4. **Error handling:** Centralized in request interceptor; customize via error codes in `src/utils/errorCode.js`
5. **Dynamic routing:** Routes are generated based on user permissions after login - see `src/store/modules/permission.js`
6. **Avoid magic numbers:** Define constants for status codes, types, etc.

## Testing & Debugging

- **Vue DevTools:** Inspect component state and Pinia stores
- **Network tab:** Check proxy forwarding to `http://127.0.0.1:9099`
- **NProgress:** Page load indicator configured in `src/permission.js`
- **Error logging:** Check console for API errors (interceptor logs all errors)
