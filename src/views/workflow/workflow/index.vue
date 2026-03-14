<template>
  <div class="json-editor-demo">
    <h2>JSON 编辑器示例</h2>
    
    <!-- 现在可以直接使用，不需要异步加载了 -->
    <json-editor-vue
      v-model="jsonData"
      :options="editorOptions"
      :currentMode="currentMode"
      @json-change="handleJsonChange"
      @json-save="handleJsonSave"
      @has-error="handleError"
      style="height: 400px; border: 1px solid #ccc;"
    />
    

  </div>
</template>

<script>
// 使用 CommonJS 插件后，可以直接导入，不会报错
import JsonEditorVue from 'json-editor-vue3'
import { ElMessage } from 'element-plus'

export default {
  name: 'JsonEditorDemo',
  components: {
    JsonEditorVue
  },
  data() {
    return {
      currentMode: 'tree',
      jsonData: {
        name: '示例数据',
        age: 25,
        email: 'example@test.com',
        hobbies: ['阅读', '编程', '音乐'],
        address: {
          province: '北京市',
          city: '北京市',
          district: '朝阳区'
        },
        isActive: true,
        config: {
          theme: 'light',
          language: 'zh-CN',
          autoSave: true
        }
      },
      editorOptions: {
        mode: 'tree',
        modes: ['tree', 'view', 'form', 'code', 'text'],
        search: true,
        history: true,
        navigationBar: true,
        statusBar: true,
        indentation: 2,
        escapeUnicode: false,
        sortObjectKeys: false,
        limitDragging: false,
        theme: 'ace/theme/github',
        schemaRefs: {},
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', title: '姓名' },
            age: { type: 'number', title: '年龄', minimum: 0, maximum: 150 },
            email: { type: 'string', format: 'email', title: '邮箱' },
            isActive: { type: 'boolean', title: '是否激活' }
          }
        }
      }
    }
  },
  methods: {
    handleJsonChange(value) {
      console.log('JSON 数据变化:', value)
      // 这里可以添加数据验证逻辑
    },
    
    handleJsonSave(value) {
      console.log('保存 JSON 数据:', value)
      ElMessage.success('数据保存成功！')
      
      // 这里可以调用 API 保存数据
      // this.saveToServer(value)
    },
    
    handleError(error) {
      console.error('JSON 编辑器错误:', error)
      ElMessage.error(`JSON 格式错误: ${error.message}`)
    },
    
    changeMode() {
      const modes = ['tree', 'view', 'form', 'code', 'text']
      const currentIndex = modes.indexOf(this.currentMode)
      const nextIndex = (currentIndex + 1) % modes.length
      this.currentMode = modes[nextIndex]
      
      // 更新编辑器选项
      this.editorOptions = {
        ...this.editorOptions,
        mode: this.currentMode
      }
    },
    
    resetData() {
      this.jsonData = {
        name: '重置后的数据',
        age: 30,
        email: 'reset@example.com',
        hobbies: ['新爱好'],
        address: {
          province: '上海市',
          city: '上海市',
          district: '浦东新区'
        },
        isActive: false
      }
      ElMessage.info('数据已重置')
    },
    
    addNewField() {
      this.jsonData = {
        ...this.jsonData,
        newField: `新字段_${Date.now()}`,
        timestamp: new Date().toISOString(),
        randomValue: Math.floor(Math.random() * 100)
      }
      ElMessage.success('已添加新字段')
    },
    
    // 模拟保存到服务器的方法
    async saveToServer(data) {
      try {
        // 这里替换为你的实际 API 调用
        // const response = await this.$http.post('/api/save-json', data)
        console.log('保存到服务器:', data)
        return Promise.resolve()
      } catch (error) {
        ElMessage.error('保存失败: ' + error.message)
        throw error
      }
    }
  }
}
</script>

<style scoped>

</style>