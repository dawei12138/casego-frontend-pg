# CaseGo 前端项目文档

## 1. 项目简介

### 1.1 项目概述
CaseGo 是一个基于 Vue 3 + Element Plus 的现代化前端管理系统，专注于API测试管理和自动化测试平台。项目采用前后端分离架构，提供完整的API项目管理、测试用例管理、环境配置、数据管理等功能模块。

### 1.2 核心功能模块
- **API项目管理**：项目创建、配置、子模块管理
- **测试用例管理**：测试用例的增删改查、执行管理
- **环境配置**：多环境配置管理（开发、测试、生产）
- **数据管理**：测试数据、缓存数据、Cookie管理
- **接口配置**：Headers、参数、断言、前置后置处理
- **系统管理**：用户权限、角色管理、系统配置
- **监控中心**：系统监控、日志管理、在线用户

### 1.3 架构设计
- **前端框架**：Vue 3 + Composition API
- **UI组件库**：Element Plus + Ant Design Vue
- **状态管理**：Pinia
- **路由管理**：Vue Router 4
- **构建工具**：Vite
- **HTTP客户端**：Axios
- **权限控制**：基于角色的访问控制（RBAC）

## 2. 技术栈说明

### 2.1 核心框架
- **Vue 3.5**：采用最新的 Composition API，提供更好的类型推导和代码组织
- **Element Plus 2.10.5**：主要UI组件库，提供丰富的组件和主题定制
- **Ant Design Vue 4.1.1**：辅助UI组件库，补充特定功能组件

### 2.2 开发工具
- **Vite**：现代化构建工具，提供快速的开发体验
- **Pinia 2.1.7**：Vue 3 官方推荐的状态管理库
- **Vue Router 4.4.0**：官方路由管理器
- **Axios 1.11.0**：HTTP请求库，支持请求拦截和响应处理

### 2.3 辅助工具库
- **@vueuse/core**：Vue 组合式工具集
- **ECharts 5.5.1**：数据可视化图表库
- **js-cookie**：Cookie操作工具
- **file-saver**：文件下载工具
- **nprogress**：页面加载进度条
- **jsencrypt**：RSA加密工具

### 2.4 开发依赖
- **Less & Sass**：CSS预处理器
- **unplugin-auto-import**：自动导入插件
- **@vitejs/plugin-vue**：Vue单文件组件支持

## 3. 快速上手指南

### 3.1 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 3.2 项目启动步骤

#### 安装依赖
```bash
npm install
# 或
yarn install

npm install --registry=https://registry.npmmirror.com
```

#### 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

#### 构建生产版本
```bash
# 生产环境构建
npm run build:prod

# 预发布环境构建
npm run build:stage
```

#### 预览构建结果
```bash
npm run preview
```

### 3.3 目录结构说明

```
src/
├── api/                    # API接口定义
│   ├── login.js           # 登录相关接口
│   ├── menu.js            # 菜单接口
│   ├── api_project/       # API项目管理接口
│   ├── api_test_cases/    # 测试用例接口
│   └── system/            # 系统管理接口
├── assets/                # 静态资源
│   ├── icons/             # 图标文件
│   ├── images/            # 图片资源
│   └── styles/            # 全局样式
├── components/            # 公共组件
│   ├── Pagination/        # 分页组件
│   ├── RightToolbar/      # 表格工具栏
│   ├── FileUpload/        # 文件上传
│   └── Editor/            # 富文本编辑器
├── directive/             # 自定义指令
├── layout/                # 布局组件
│   ├── components/        # 布局子组件
│   └── index.vue          # 主布局
├── plugins/               # 插件配置
├── router/                # 路由配置
├── store/                 # 状态管理
│   └── modules/           # 状态模块
├── utils/                 # 工具函数
│   ├── request.js         # HTTP请求封装
│   ├── auth.js            # 认证工具
│   └── permission.js      # 权限工具
├── views/                 # 页面组件
│   ├── login.vue          # 登录页
│   ├── dashboard/         # 仪表盘
│   ├── api_project/       # API项目管理
│   ├── api_test_cases/    # 测试用例管理
│   └── system/            # 系统管理
├── App.vue                # 根组件
├── main.js                # 入口文件
└── permission.js          # 路由权限控制
```

### 3.4 开发规范

#### 代码风格
- 使用 2 空格缩进
- 组件名采用 PascalCase
- 文件名采用 kebab-case
- 常量使用 UPPER_SNAKE_CASE
- 变量和函数使用 camelCase

#### 组件开发规范
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup>
// 导入依赖
import { ref, reactive, computed, onMounted } from 'vue'

// 响应式数据
const loading = ref(false)
const formData = reactive({})

// 计算属性
const computedValue = computed(() => {
  // 计算逻辑
})

// 方法定义
const handleSubmit = () => {
  // 处理逻辑
}

// 生命周期
onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
/* 组件样式 */
</style>
```

#### API接口规范
```javascript
// api/example.js
import request from '@/utils/request'

// 查询列表
export function listExample(query) {
  return request({
    url: '/example/list',
    method: 'get',
    params: query
  })
}

// 新增数据
export function addExample(data) {
  return request({
    url: '/example',
    method: 'post',
    data: data
  })
}
```

### 3.5 常见功能实现

#### 表格页面开发
1. 创建API接口文件
2. 实现查询、新增、修改、删除方法
3. 使用 `<el-table>` 组件展示数据
4. 集成分页组件 `<pagination>`
5. 添加搜索表单和操作按钮

#### 表单页面开发
1. 使用 `<el-form>` 组件
2. 配置表单验证规则
3. 实现表单提交和重置
4. 处理表单数据回显

#### 权限控制
```vue
<!-- 按钮权限控制 -->
<el-button v-hasPermi="['system:user:add']">新增</el-button>

<!-- 页面权限在路由中配置 -->
{
  path: '/system/user',
  component: () => import('@/views/system/user/index'),
  meta: {
    title: '用户管理',
    permissions: ['system:user:list']
  }
}
```

## 4. 开发技巧

### 4.1 项目特有最佳实践

#### 状态管理
- 使用 Pinia 进行状态管理，模块化组织
- 持久化重要状态（用户信息、权限等）
- 避免在组件中直接修改 store 状态

#### 组件封装
- 公共组件放在 `components` 目录
- 业务组件放在对应的 `views` 目录下
- 组件支持 `v-model` 双向绑定
- 提供完整的 props 类型定义

#### 样式管理
- 使用 scoped 样式避免污染
- 全局样式放在 `assets/styles` 目录
- 支持主题切换和暗黑模式

### 4.2 需要特别注意的技术点

#### 请求拦截处理
- 自动添加 Authorization 头
- 防重复提交机制
- 统一错误处理和提示
- 请求和响应日志记录

#### 路由权限控制
- 基于角色的动态路由生成
- 页面级权限控制
- 按钮级权限控制
- 白名单路由配置

#### 环境配置管理
```javascript
// .env.development
VITE_APP_TITLE = CaseGo
VITE_APP_ENV = 'development'
VITE_APP_BASE_API = '/dev-api'

// .env.production
VITE_APP_TITLE = CaseGo
VITE_APP_ENV = 'production'
VITE_APP_BASE_API = '/prod-api'
```

### 4.3 调试和问题排查

#### 开发工具
- 使用 Vue DevTools 调试组件状态
- 浏览器开发者工具查看网络请求
- 使用 console.log 进行调试（生产环境会自动移除）

#### 常见问题排查
1. **接口请求失败**
   - 检查代理配置是否正确
   - 确认后端服务是否启动
   - 查看请求头和参数是否正确

2. **权限问题**
   - 检查用户角色和权限配置
   - 确认路由权限配置
   - 查看 token 是否有效

3. **样式问题**
   - 检查 CSS 作用域
   - 确认主题变量是否正确
   - 查看元素层级关系

### 4.4 与后端API交互规范

#### 请求格式
```javascript
// GET 请求
const response = await request({
  url: '/api/users',
  method: 'get',
  params: { page: 1, size: 10 }
})

// POST 请求
const response = await request({
  url: '/api/users',
  method: 'post',
  data: { name: 'John', email: 'john@example.com' }
})
```

#### 响应格式
```javascript
// 成功响应
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    // 响应数据
  }
}

// 错误响应
{
  "code": 500,
  "msg": "操作失败",
  "data": null
}
```

#### 分页数据格式
```javascript
{
  "code": 200,
  "msg": "查询成功",
  "rows": [
    // 数据列表
  ],
  "total": 100
}
```

#### 文件上传
```javascript
const formData = new FormData()
formData.append('file', file)

const response = await request({
  url: '/api/upload',
  method: 'post',
  data: formData,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})
```

### 4.5 性能优化建议

1. **代码分割**：使用动态导入实现路由懒加载
2. **组件缓存**：合理使用 `<keep-alive>` 缓存组件
3. **图片优化**：使用 WebP 格式，实现懒加载
4. **请求优化**：避免重复请求，实现请求缓存
5. **打包优化**：配置 Vite 打包优化选项

## 5. 部署说明

### 5.1 构建配置
```javascript
// vite.config.js
export default defineConfig({
  base: '/', // 部署路径
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser'
  }
})
```

### 5.2 Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend-server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 总结

本文档涵盖了 CaseGo 前端项目的核心内容，包括项目架构、技术栈、开发规范和最佳实践。通过遵循本文档的指导，前端实习生可以快速上手项目开发，并保持代码的一致性和质量。

如有疑问或需要补充内容，请及时与项目负责人沟通。