import { defineStore } from 'pinia'

export const useProjectStore = defineStore('project', {
  state: () => ({
    projectId: localStorage.getItem('projectId') || '' // 统一使用字符串类型
  }),
  actions: {
    setProjectId(id) {
      const idStr = String(id) // 确保存储字符串类型
      this.projectId = idStr
      localStorage.setItem('projectId', idStr)
    },
    clearProjectId() {
      this.projectId = ''
      localStorage.removeItem('projectId')
    }
  }
})