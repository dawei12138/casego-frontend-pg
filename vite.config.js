import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import http from 'http'
import createVitePlugins from './vite/plugins'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())
  const { VITE_APP_ENV } = env
  return {
    // 部署生产环境和开发环境下的URL。
    // 默认情况下，vite 会假设你的应用是被部署在一个域名的根路径上
    // 例如 https://www.ruoyi.vip/。如果应用被部署在一个子路径上，你就需要用这个选项指定这个子路径。例如，如果你的应用被部署在 https://www.ruoyi.vip/admin/，则设置 baseUrl 为 /admin/。
    base: VITE_APP_ENV === 'production' ? '/' : '/',
    plugins: createVitePlugins(env, command === 'build').concat([
      // 添加 CommonJS 支持插件，解决 json-editor-vue3 的导入问题
      viteCommonjs()
    ]),
    resolve: {
      // https://cn.vitejs.dev/config/#resolve-alias
      alias: {
        // 设置路径
        '~': path.resolve(__dirname, './'),
        // 设置别名
        '@': path.resolve(__dirname, './src')
      },
      // https://cn.vitejs.dev/config/#resolve-extensions
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },
    // 简化的依赖预构建配置
    optimizeDeps: {
      include: ['json-editor-vue3']
    },
    // vite 相关配置
    server: {
      port: 80,
      host: true,
      open: true,
      proxy: {
        // https://cn.vitejs.dev/config/#server-proxy
        '/openapi.json': {
          target: 'http://127.0.0.1:9099',
          changeOrigin: true
        },
        '/static': {
          target: 'http://127.0.0.1:9099',
          changeOrigin: true
        },
        '/dev-api': {
          target: 'http://127.0.0.1:9099',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/dev-api/, ''),
          ws: true,
          // 禁用 Keep-Alive，解决 Windows 上连接挂起问题
          agent: new http.Agent({ keepAlive: false }),
          configure: (proxy, options) => {
            // 添加请求错误处理
            proxy.on('error', (err, req, res) => {
              console.error('❌ 代理错误:', req.url, err.message)
              // 尝试返回错误响应而不是让连接挂起
              if (res && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ code: 502, msg: '代理连接失败，请检查后端服务' }))
              }
            })

            // 为流式接口设置不缓冲
            proxy.on('proxyReq', (proxyReq, req, res) => {
              if (req.url && req.url.includes('/workflow/workflow/exec')) {
                proxyReq.setHeader('X-Accel-Buffering', 'no')
              }
            })

            proxy.on('proxyRes', (proxyRes, req, res) => {
              // 为流式接口禁用缓冲
              if (req.url && req.url.includes('/workflow/workflow/exec')) {
                res.setHeader('X-Accel-Buffering', 'no')
                res.setHeader('Cache-Control', 'no-cache')
                res.setHeader('Connection', 'keep-alive')
              }
            })
          }
        }
      }
    },
    // 简化构建配置
    build: {
      rollupOptions: {
        output: {
          // 手动分块，将 json-editor-vue3 单独打包
          manualChunks: {
            'json-editor': ['json-editor-vue3']
          }
        }
      }
    },
    //fix:error:stdin>:7356:1: warning: "@charset" must be the first rule in the file
    css: {
      postcss: {
        plugins: [
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset: (atRule) => {
                if (atRule.name === 'charset') {
                  atRule.remove();
                }
              }
            }
          }
        ]
      }
    },
    // 添加定义配置，支持一些全局变量（如果需要的话）
    define: {
      // 在开发环境中可能需要的全局定义
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_OPTIONS_API__: true
    }
  }
})