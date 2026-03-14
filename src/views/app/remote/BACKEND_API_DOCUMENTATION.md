# Android/iOS 设备远程控制后端 API 文档

本文档详细说明了设备远程控制功能所需的所有后端接口支持，包括 WebSocket 连接、HTTP API 以及消息格式规范。

## 目录

1. [概述](#概述)
2. [HTTP API 接口](#http-api-接口)
3. [WebSocket 连接](#websocket-连接)
4. [消息格式规范](#消息格式规范)
5. [功能模块详解](#功能模块详解)

---

## 概述

### 系统架构

```
┌─────────────────┐     HTTP/WS      ┌─────────────────┐      ADB/WDA     ┌─────────────────┐
│   Web Frontend  │ ◄───────────────►│   Agent Server  │ ◄───────────────►│  Mobile Device  │
└─────────────────┘                  └─────────────────┘                  └─────────────────┘
```

### 技术要求

- WebSocket 支持
- H.264 视频流编码（Scrcpy 模式）
- JPEG 图片流（Minicap 模式）
- ADB 命令执行
- UIAutomator2 控件检测
- POCO SDK 游戏引擎支持

---

## HTTP API 接口

### 1. 设备管理

#### 1.1 获取设备详情

```
GET /app/devices/{deviceId}
```

**响应示例：**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 1,
    "udId": "ABCD1234567890",
    "name": "Pixel 6",
    "model": "Pixel 6",
    "nickName": "测试设备1",
    "platform": 1,
    "version": "13",
    "size": "1080x2400",
    "cpu": "arm64-v8a",
    "manufacturer": "Google",
    "status": "ONLINE",
    "agentId": 1,
    "isHm": 0,
    "level": 85,
    "temperature": 320,
    "voltage": 4200,
    "imgUrl": ""
  }
}
```

**字段说明：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 设备主键 ID |
| udId | string | 设备唯一标识符 |
| name | string | 设备名称 |
| model | string | 设备型号 |
| nickName | string | 用户自定义昵称 |
| platform | int | 平台：1=Android, 2=iOS |
| version | string | 系统版本 |
| size | string | 屏幕分辨率 |
| cpu | string | CPU 架构 |
| manufacturer | string | 制造商 |
| status | string | 状态：ONLINE/DEBUGGING/TESTING/OFFLINE/ERROR |
| agentId | int | 所属 Agent ID |
| isHm | int | 是否鸿蒙：0=否, 1=是 |
| level | int | 电池电量 (0-100) |
| temperature | int | 温度 (单位：0.1℃，如 320 表示 32.0℃) |
| voltage | int | 电压 (单位：mV) |
| imgUrl | string | 设备图片 URL |

#### 1.2 获取 Agent 详情

```
GET /app/agents/{agentId}
```

**响应示例：**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 1,
    "name": "Agent-01",
    "host": "192.168.1.100",
    "port": 7912,
    "secretKey": "abc123xyz"
  }
}
```

**字段说明：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | Agent 主键 ID |
| name | string | Agent 名称 |
| host | string | Agent 服务器 IP 地址 |
| port | int | Agent 服务端口 |
| secretKey | string | 安全密钥，用于 WebSocket 连接验证 |

### 2. 文件上传

#### 2.1 通用文件上传

```
POST /folder/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 上传的文件 |
| type | string | 是 | 文件类型：packageFiles/imageFiles/keepFiles |

**响应示例：**
```json
{
  "code": 200,
  "msg": "success",
  "data": "http://server/files/xxx.apk"
}
```

---

## WebSocket 连接

### 连接端点

前端需要建立 3 个 WebSocket 连接：

| 连接名称 | URL 格式 | 用途 |
|----------|----------|------|
| 主控制连接 | `ws://{host}:{port}/websockets/android/{secretKey}/{udId}/{token}` | 设备控制、状态同步 |
| 屏幕连接 | `ws://{host}:{port}/websockets/android/screen/{secretKey}/{udId}/{token}` | 视频流传输 |
| 终端连接 | `ws://{host}:{port}/websockets/android/terminal/{secretKey}/{udId}/{token}` | Shell 命令、Logcat |

**URL 参数说明：**
| 参数 | 说明 |
|------|------|
| host | Agent 服务器 IP |
| port | Agent 服务端口 |
| secretKey | Agent 安全密钥 |
| udId | 设备唯一标识符 |
| token | 用户认证 Token（从 localStorage 获取） |

---

## 消息格式规范

所有消息均使用 JSON 格式，基本结构如下：

```json
{
  "type": "消息类型",
  "detail": "具体内容或操作",
  ...其他字段
}
```

### 1. 主控制 WebSocket 消息

#### 1.1 前端发送消息

##### 触摸操作

```json
{
  "type": "touch",
  "detail": "down 500 800\n"
}
```

```json
{
  "type": "touch",
  "detail": "move 500 900\n"
}
```

```json
{
  "type": "touch",
  "detail": "up\n"
}
```

##### 按键事件

```json
{
  "type": "keyEvent",
  "detail": 3
}
```

**常用按键码：**
| 按键码 | 说明 |
|--------|------|
| 3 | Home 键 |
| 4 | 返回键 |
| 24 | 音量+ |
| 25 | 音量- |
| 26 | 电源键 |
| 27 | 相机键 |
| 64 | 浏览器 |
| 82 | 菜单键 |
| 164 | 静音 |
| 187 | 多任务键 |
| 220 | 亮度- |
| 221 | 亮度+ |

##### 文本输入

```json
{
  "type": "text",
  "detail": "要输入的文字"
}
```

**特殊文本命令：**
| 命令 | 说明 |
|------|------|
| CODE_AC_BACK | 删除一个字符 |
| CODE_AC_ENTER | 回车键 |
| CODE_AC_CLEAN | 清空文本 |

##### 键盘控制

```json
{
  "type": "startKeyboard"
}
```

```json
{
  "type": "stopKeyboard"
}
```

##### 剪贴板操作

```json
{
  "type": "setPasteboard",
  "detail": "要复制的文本内容"
}
```

```json
{
  "type": "getPasteboard"
}
```

##### 调试操作

```json
{
  "type": "debug",
  "detail": "tap",
  "point": "500,800"
}
```

```json
{
  "type": "debug",
  "detail": "swipe",
  "pointA": "500,800",
  "pointB": "500,1200"
}
```

```json
{
  "type": "debug",
  "detail": "longPress",
  "point": "500,800"
}
```

##### UIAutomator2 操作

```json
{
  "type": "debug",
  "detail": "openDriver"
}
```

```json
{
  "type": "debug",
  "detail": "closeDriver"
}
```

```json
{
  "type": "debug",
  "detail": "tree",
  "isMulti": false,
  "isIgnore": true,
  "isVisible": false
}
```

##### POCO 控件获取

```json
{
  "type": "debug",
  "detail": "poco",
  "engine": "UNITY_3D",
  "port": "5001"
}
```

**支持的游戏引擎：**
| engine | 默认端口 | 说明 |
|--------|----------|------|
| UNITY_3D | 5001 | Unity3D 引擎 |
| UE4 | 5001 | 虚幻4引擎 |
| COCOS_2DX_JS | 5003 | Cocos2d-x JS |
| COCOS_2DX_LUA | 15004 | Cocos2d-x Lua |
| COCOS_CREATOR | 5003 | Cocos Creator |
| EGRET | 5003 | 白鹭引擎 |

##### 应用管理

```json
{
  "type": "debug",
  "detail": "openApp",
  "pkg": "com.example.app"
}
```

```json
{
  "type": "debug",
  "detail": "killApp",
  "pkg": "com.example.app"
}
```

```json
{
  "type": "uninstallApp",
  "detail": "com.example.app"
}
```

```json
{
  "type": "debug",
  "detail": "install",
  "apk": "http://server/files/app.apk"
}
```

##### 文件操作

```json
{
  "type": "pushFile",
  "file": "http://server/files/test.txt",
  "path": "/sdcard/"
}
```

```json
{
  "type": "pullFile",
  "path": "/sdcard/test.txt"
}
```

##### 扫码

```json
{
  "type": "scan",
  "url": "http://server/files/qrcode.png"
}
```

##### 抓包代理

```json
{
  "type": "proxy"
}
```

```json
{
  "type": "installCert"
}
```

```json
{
  "type": "clearProxy"
}
```

##### 电池模拟

```json
{
  "type": "battery",
  "detail": 0
}
```

**detail 值说明：**
| 值 | 说明 |
|----|------|
| 0 | 模拟断电 |
| 1 | 重置电池 |

##### 查找设备

```json
{
  "type": "find"
}
```

##### 性能监控

```json
{
  "type": "startPerfmon",
  "bundleId": "com.example.app"
}
```

```json
{
  "type": "stopPerfmon"
}
```

##### WebView 调试

```json
{
  "type": "forwardView"
}
```

#### 1.2 后端返回消息

##### 错误消息

```json
{
  "msg": "error"
}
```

##### 驱动初始化结果

```json
{
  "msg": "openDriver",
  "status": "success"
}
```

##### 控件树数据

```json
{
  "msg": "tree",
  "detail": [...],
  "activity": "com.example.MainActivity"
}
```

**控件数据结构：**
```json
{
  "id": 1,
  "label": "<android.widget.TextView>",
  "detail": {
    "class": "android.widget.TextView",
    "resource-id": "com.example:id/text_view",
    "text": "Hello",
    "content-desc": "",
    "package": "com.example",
    "bounds": "[0,0][1080,100]",
    "bStart": "0,0",
    "bEnd": "1080,100",
    "xpath": "//android.widget.FrameLayout/android.widget.TextView"
  },
  "children": [...]
}
```

##### 控件获取失败

```json
{
  "msg": "treeFail"
}
```

##### POCO 数据

```json
{
  "msg": "poco",
  "result": "{\"result\": {...}}"
}
```

**POCO 数据结构：**
```json
{
  "name": "NodeName",
  "payload": {
    "name": "NodeName",
    "type": "Button",
    "text": "Click Me",
    "pos": [0.5, 0.5],
    "size": [0.2, 0.1],
    "xpath": "/Root/NodeName"
  },
  "children": [...]
}
```

##### 剪贴板内容

```json
{
  "msg": "paste",
  "detail": "剪贴板文本内容"
}
```

##### 安装结果

```json
{
  "msg": "installFinish",
  "status": "success"
}
```

##### 卸载结果

```json
{
  "msg": "uninstallFinish",
  "detail": "success"
}
```

##### 远程 ADB 状态

```json
{
  "msg": "sas",
  "isEnable": true,
  "port": 5555
}
```

##### 文件推送结果

```json
{
  "msg": "pushResult",
  "status": "success"
}
```

##### 文件拉取结果

```json
{
  "msg": "pullResult",
  "status": "success",
  "url": "http://server/files/downloaded.txt"
}
```

##### 代理结果

```json
{
  "msg": "proxyResult",
  "webPort": 8080,
  "port": 8888
}
```

##### WebView 列表

```json
{
  "msg": "forwardView",
  "detail": [
    {
      "package": "com.example.browser",
      "version": "Chrome/91.0",
      "port": 9222,
      "children": [
        {
          "id": "1",
          "title": "Example Page",
          "url": "https://example.com"
        }
      ]
    }
  ]
}
```

##### 性能数据

```json
{
  "msg": "perfDetail",
  "detail": {
    "process": {
      "cpuInfo": 25.5,
      "memInfo": 128000,
      "fpsInfo": 60
    }
  }
}
```

### 2. 屏幕 WebSocket 消息

#### 2.1 前端发送消息

##### 切换投屏模式

```json
{
  "type": "switch",
  "detail": "scrcpy"
}
```

**detail 值：**
| 值 | 说明 |
|----|------|
| scrcpy | Scrcpy 模式（H.264 视频流） |
| minicap | Minicap 模式（JPEG 图片流） |

##### 调整画质

```json
{
  "type": "pic",
  "detail": "high"
}
```

**detail 值：**
| 值 | 说明 |
|----|------|
| low | 低画质 |
| middle | 中画质 |
| high | 高画质 |
| fixed | 修复黑屏（仅 Minicap 模式） |

#### 2.2 后端返回消息

##### 屏幕尺寸

```json
{
  "msg": "size",
  "width": 1080,
  "height": 2400
}
```

##### 屏幕旋转

```json
{
  "msg": "rotation",
  "value": 0
}
```

**value 值：**
| 值 | 说明 |
|----|------|
| 0 | 竖屏正向 |
| 90 | 横屏（顺时针90度） |
| 180 | 竖屏倒置 |
| 270 | 横屏（逆时针90度） |

##### 画质切换完成

```json
{
  "msg": "picFinish"
}
```

##### 不支持提示

```json
{
  "msg": "support",
  "text": "当前设备不支持此功能"
}
```

##### 二进制数据

- **Scrcpy 模式**：返回 H.264 编码的视频帧（ArrayBuffer）
- **Minicap 模式**：返回 JPEG 图片数据（ArrayBuffer）

### 3. 终端 WebSocket 消息

#### 3.1 前端发送消息

##### 获取应用列表

```json
{
  "type": "appList"
}
```

##### 执行 Shell 命令

```json
{
  "type": "command",
  "detail": "ls -la /sdcard/"
}
```

##### 停止命令

```json
{
  "type": "stopCmd"
}
```

##### 启动 Logcat

```json
{
  "type": "logcat",
  "level": "E",
  "filter": "MyApp"
}
```

**level 值：**
| 值 | 说明 |
|----|------|
| V | VERBOSE |
| D | DEBUG |
| I | INFO |
| W | WARN |
| E | ERROR |
| F | FATAL |

##### 停止 Logcat

```json
{
  "type": "stopLogcat"
}
```

#### 3.2 后端返回消息

##### 终端连接成功

```json
{
  "msg": "terminal",
  "user": "shell"
}
```

##### 命令输出

```json
{
  "msg": "terResp",
  "detail": "命令输出内容"
}
```

##### 命令执行完成

```json
{
  "msg": "terDone"
}
```

##### Logcat 连接成功

```json
{
  "msg": "logcat"
}
```

##### Logcat 输出

```json
{
  "msg": "logcatResp",
  "detail": "05-01 12:00:00.000  1234  5678 E MyApp: Error message"
}
```

##### 应用列表项

```json
{
  "msg": "appListDetail",
  "detail": {
    "appName": "应用名称",
    "packageName": "com.example.app",
    "versionName": "1.0.0",
    "appIcon": "base64编码的图标"
  }
}
```

---

## 功能模块详解

### 1. 屏幕投屏

#### Scrcpy 模式（推荐）

- 使用 Scrcpy 工具进行屏幕捕获
- H.264 编码的视频流
- 前端使用 JMuxer 解码播放
- 支持 60fps 流畅显示
- 延迟低，画质好

**后端要求：**
- 需要在 Agent 端运行 Scrcpy server
- WebSocket 传输 H.264 NAL 单元

#### Minicap 模式

- 使用 Minicap 工具进行屏幕捕获
- JPEG 图片流
- 前端直接在 Canvas 上绘制
- 兼容性更好，支持更多设备

**后端要求：**
- 需要在 Agent 端运行 Minicap server
- WebSocket 传输 JPEG 图片数据

### 2. 触摸控制

#### 原生触摸模式

通过 Scrcpy 的触摸注入功能实现：
- `down x y` - 触摸按下
- `move x y` - 触摸移动
- `up` - 触摸抬起

#### 兼容触摸模式（修复触摸）

通过 ADB 命令实现：
- `adb shell input tap x y` - 点击
- `adb shell input swipe x1 y1 x2 y2` - 滑动
- `adb shell input swipe x y x y 1000` - 长按

### 3. UIAutomator2 控件检测

**初始化流程：**
1. 前端发送 `openDriver` 请求
2. 后端启动 UIAutomator2 server
3. 后端返回 `openDriver` 成功消息
4. 前端可以开始获取控件树

**控件数据格式：**
- 树形结构，每个节点包含控件属性
- 支持 resource-id、text、content-desc 等定位方式
- 提供 xpath 路径和 bounds 坐标

### 4. POCO 游戏控件检测

**支持的游戏引擎：**
- Unity3D
- Unreal Engine 4
- Cocos2d-x (JS/Lua)
- Cocos Creator
- Egret (白鹭)

**工作原理：**
1. 游戏内集成 POCO SDK
2. SDK 在指定端口开放服务
3. Agent 通过端口转发连接
4. 获取游戏内控件层级结构

### 5. WebView 调试

**工作流程：**
1. 前端发送 `forwardView` 请求
2. 后端检测设备上运行的 WebView
3. 返回 WebView 列表（包含 Chrome DevTools 端口）
4. 前端通过 iframe 嵌入 Chrome DevTools

**WebView 调试 WebSocket：**
```
ws://{host}:{port}/websockets/webView/{secretKey}/{webViewPort}/{pageId}
```

### 6. 性能监控

**监控指标：**
| 指标 | 单位 | 说明 |
|------|------|------|
| cpuInfo | % | CPU 使用率 |
| memInfo | KB | 内存使用量 |
| fpsInfo | fps | 帧率 |

**数据采集方式：**
- CPU：通过 `/proc/stat` 和 `/proc/{pid}/stat` 计算
- 内存：通过 `dumpsys meminfo {package}` 获取
- FPS：通过 `dumpsys gfxinfo {package}` 获取

### 7. 抓包代理

**工作流程：**
1. Agent 启动代理服务器（如 mitmproxy）
2. 设置设备 WiFi 代理指向 Agent
3. 返回代理端口和 Web 界面端口
4. 前端通过 iframe 展示抓包界面

**证书安装：**
- Android 7.0+ 需要 ROOT 或修改系统证书
- 或者使用应用信任用户证书

---

## 错误处理

### 连接错误

当 WebSocket 连接失败或异常断开时：
```json
{
  "msg": "error"
}
```

前端应该：
1. 显示错误提示
2. 关闭所有 WebSocket 连接
3. 提示用户重新连接或返回设备列表

### 设备状态检查

在建立连接前，应检查设备状态：
- `ONLINE` - 可以连接
- `DEBUGGING` - 已有人在使用
- `TESTING` - 正在执行自动化测试
- `OFFLINE/ERROR` - 设备不可用

---

## 安全建议

1. **Token 验证**：所有 WebSocket 连接都需要携带有效的用户 Token
2. **SecretKey 验证**：Agent 应验证 SecretKey 的有效性
3. **权限控制**：根据用户角色限制可执行的操作
4. **操作审计**：记录用户的远程控制操作日志
5. **超时处理**：空闲超时自动断开连接
6. **设备锁定**：同一设备只允许一个用户远程控制

---

## 附录：完整消息类型索引

### 主控制 WebSocket - 前端发送

| type | 说明 |
|------|------|
| touch | 触摸操作 |
| keyEvent | 按键事件 |
| text | 文本输入 |
| startKeyboard | 启动键盘 |
| stopKeyboard | 停止键盘 |
| setPasteboard | 设置剪贴板 |
| getPasteboard | 获取剪贴板 |
| debug | 调试操作（子类型通过 detail 区分） |
| uninstallApp | 卸载应用 |
| pushFile | 推送文件 |
| pullFile | 拉取文件 |
| scan | 扫码 |
| proxy | 启动代理 |
| installCert | 安装证书 |
| clearProxy | 清除代理 |
| battery | 电池模拟 |
| find | 查找设备 |
| startPerfmon | 开始性能监控 |
| stopPerfmon | 停止性能监控 |
| forwardView | 获取 WebView |

### 主控制 WebSocket - 后端返回

| msg | 说明 |
|-----|------|
| error | 错误 |
| openDriver | 驱动初始化结果 |
| tree | 控件树数据 |
| treeFail | 控件获取失败 |
| poco | POCO 数据 |
| paste | 剪贴板内容 |
| installFinish | 安装结果 |
| uninstallFinish | 卸载结果 |
| sas | 远程 ADB 状态 |
| pushResult | 推送结果 |
| pullResult | 拉取结果 |
| proxyResult | 代理结果 |
| forwardView | WebView 列表 |
| perfDetail | 性能数据 |

### 屏幕 WebSocket - 前端发送

| type | 说明 |
|------|------|
| switch | 切换投屏模式 |
| pic | 调整画质 |

### 屏幕 WebSocket - 后端返回

| msg | 说明 |
|-----|------|
| size | 屏幕尺寸 |
| rotation | 屏幕旋转 |
| picFinish | 画质切换完成 |
| support | 不支持提示 |
| error | 错误 |
| (binary) | 视频/图片数据 |

### 终端 WebSocket - 前端发送

| type | 说明 |
|------|------|
| appList | 获取应用列表 |
| command | 执行命令 |
| stopCmd | 停止命令 |
| logcat | 启动 Logcat |
| stopLogcat | 停止 Logcat |

### 终端 WebSocket - 后端返回

| msg | 说明 |
|-----|------|
| terminal | 终端连接成功 |
| terResp | 命令输出 |
| terDone | 命令完成 |
| logcat | Logcat 连接成功 |
| logcatResp | Logcat 输出 |
| appListDetail | 应用列表项 |
| error | 错误 |
