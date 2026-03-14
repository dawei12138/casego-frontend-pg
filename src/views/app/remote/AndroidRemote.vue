<template>
  <div class="remote-container">
    <!-- 顶部状态栏 -->
    <div class="remote-header">
      <div class="header-left">
        <el-icon :size="20"><Cellphone /></el-icon>
        <span class="device-name">{{ device.nickName || device.model || '设备' }}</span>
        <el-tag :type="device.platform === 1 ? 'success' : 'primary'" size="small">
          {{ device.platform === 1 ? (device.isHm === 1 ? 'Harmony' : 'Android') : 'iOS' }}
          {{ device.version }}
        </el-tag>
        <el-popover placement="bottom" :width="300" trigger="hover">
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="设备名称">{{ device.name }}</el-descriptions-item>
            <el-descriptions-item label="型号">{{ device.model }}</el-descriptions-item>
            <el-descriptions-item label="设备ID">{{ device.udId }}</el-descriptions-item>
            <el-descriptions-item label="分辨率">{{ device.size }}</el-descriptions-item>
            <el-descriptions-item label="CPU">{{ device.cpu }}</el-descriptions-item>
            <el-descriptions-item label="制造商">{{ device.manufacturer }}</el-descriptions-item>
          </el-descriptions>
          <template #reference>
            <el-icon style="cursor: pointer; margin-left: 10px"><InfoFilled /></el-icon>
          </template>
        </el-popover>
      </div>
      <div class="header-right">
        <el-tag type="info" size="small">
          <el-icon><Timer /></el-icon>
          {{ formatTime(ticker) }}
        </el-tag>
        <el-tag v-if="idleTimeout > 0" :type="idleCount > idleTimeout * 30 ? 'warning' : 'success'" size="small">
          空闲: {{ idleCount }}s
        </el-tag>
        <el-button type="danger" size="small" @click="handleClose">
          <el-icon><Close /></el-icon>
          退出
        </el-button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="remote-content" @mouseup="handleResizeEnd" @mousemove="handleResizeMove">
      <!-- 左侧设备屏幕 -->
      <div class="screen-panel" :style="{ width: screenPanelWidth + '%' }">
        <el-card v-loading="loading" element-loading-text="正在连接设备..." class="screen-card">
          <template #header>
            <div class="screen-header">
              <span>设备屏幕</span>
              <div class="screen-controls">
                <!-- 投屏模式 -->
                <el-dropdown @command="changeScreenMode">
                  <el-button size="small" type="info" circle title="投屏模式">
                    <el-icon><VideoCamera /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="Scrcpy" :disabled="screenMode === 'Scrcpy'">
                        Scrcpy (推荐)
                      </el-dropdown-item>
                      <el-dropdown-item command="Minicap" :disabled="screenMode === 'Minicap'">
                        Minicap
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <!-- 画质 -->
                <el-dropdown @command="changePic">
                  <el-button size="small" type="info" circle title="画质">
                    <el-icon><View /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="low">低</el-dropdown-item>
                      <el-dropdown-item command="middle">中</el-dropdown-item>
                      <el-dropdown-item command="high">高</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <!-- 修复 -->
                <el-dropdown>
                  <el-button size="small" type="info" circle title="修复">
                    <el-icon><Tools /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="fixTouch">修复触摸</el-dropdown-item>
                      <el-dropdown-item @click="fixOri">修复方向</el-dropdown-item>
                      <el-dropdown-item @click="changePic('fixed')" :disabled="screenMode !== 'Minicap'">
                        修复黑屏
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <!-- 音频 -->
                <el-dropdown>
                  <el-button size="small" type="info" circle title="音频">
                    <el-icon><Service /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="playAudio" :disabled="isConnectAudio">
                        <el-icon><Bell /></el-icon> 开启音频
                      </el-dropdown-item>
                      <el-dropdown-item @click="destroyAudio" :disabled="!isConnectAudio">
                        <el-icon><MuteNotification /></el-icon> 关闭音频
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <!-- 截图 -->
                <el-button size="small" type="primary" circle @click="quickCap" title="截图">
                  <el-icon><Camera /></el-icon>
                </el-button>
                <!-- 查找设备 -->
                <el-button size="small" type="info" circle @click="searchDevice" title="查找设备">
                  <el-icon><Search /></el-icon>
                </el-button>
              </div>
            </div>
          </template>

          <div class="screen-wrapper">
            <!-- 隐藏输入框 -->
            <input
              ref="inputBox"
              v-model="inputValue"
              class="input-box"
              type="text"
              :style="inputBoxStyle"
              @input="changeInputHandle"
              @keyup.delete="deleteInputHandle"
              @keyup.enter="enterInputHandle"
            />

            <!-- Scrcpy视频模式 -->
            <video
              v-show="screenMode === 'Scrcpy'"
              id="scrcpy-video"
              class="screen-video"
              :style="canvasStyle"
              autoplay
              muted
              @mouseup="mouseup"
              @mousemove="mousemove"
              @mousedown="mousedown"
              @mouseleave="mouseleave"
            />

            <!-- Minicap图片模式 -->
            <canvas
              v-show="screenMode !== 'Scrcpy'"
              id="canvas"
              class="screen-canvas"
              :style="canvasStyle"
              @mouseup="mouseup"
              @mousemove="mousemove"
              @mousedown="mousedown"
              @mouseleave="mouseleave"
            />

            <!-- 音频播放器 -->
            <audio id="audio-player" hidden></audio>
          </div>

          <!-- 物理按键 -->
          <div class="physical-keys">
            <el-button-group>
              <el-button size="small" type="info" @click="pressKey(82)" title="菜单">
                <el-icon><Menu /></el-icon>
              </el-button>
              <el-button size="small" type="info" @click="pressKey(187)" title="多任务">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
              <el-button size="small" type="info" @click="pressKey(3)" title="Home">
                <el-icon><HomeFilled /></el-icon>
              </el-button>
              <el-button size="small" type="info" @click="pressKey(4)" title="返回">
                <el-icon><Back /></el-icon>
              </el-button>
            </el-button-group>
          </div>

          <!-- 侧边快捷按钮 -->
          <div class="side-buttons">
            <!-- 音量亮度 -->
            <el-dropdown placement="left">
              <el-button size="small" type="primary" circle>
                <el-icon><Operation /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <div style="padding: 10px; text-align: center">
                    <div style="margin-bottom: 8px">
                      <el-icon><Sunny /></el-icon> 亮度
                      <el-button-group style="margin-left: 10px">
                        <el-button size="small" @click="pressKey(220)"><el-icon><Minus /></el-icon></el-button>
                        <el-button size="small" @click="pressKey(221)"><el-icon><Plus /></el-icon></el-button>
                      </el-button-group>
                    </div>
                    <div>
                      <el-icon><Microphone /></el-icon> 音量
                      <el-button-group style="margin-left: 10px">
                        <el-button size="small" @click="pressKey(25)"><el-icon><Minus /></el-icon></el-button>
                        <el-button size="small" @click="pressKey(164)"><el-icon><MuteNotification /></el-icon></el-button>
                        <el-button size="small" @click="pressKey(24)"><el-icon><Plus /></el-icon></el-button>
                      </el-button-group>
                    </div>
                  </div>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <!-- 电池模拟 -->
            <el-dropdown placement="left">
              <el-button size="small" type="info" circle title="电池模拟">
                <el-icon><Connection /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="batteryDisconnect">模拟断电</el-dropdown-item>
                  <el-dropdown-item @click="batteryReset">重置电池</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <!-- 快捷操作 -->
            <el-button size="small" type="primary" circle @click="pressKey(5)" title="拨号">
              <el-icon><PhoneFilled /></el-icon>
            </el-button>
            <el-button size="small" type="primary" circle @click="pressKey(27)" title="拍照">
              <el-icon><Camera /></el-icon>
            </el-button>
            <el-button size="small" type="primary" circle @click="pressKey(64)" title="浏览器">
              <el-icon><Position /></el-icon>
            </el-button>
            <el-button size="small" type="primary" circle @click="pressKey(26)" title="锁屏/亮屏">
              <el-icon><SwitchButton /></el-icon>
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 分隔线 -->
      <div class="resize-line" @mousedown="handleResizeStart" />

      <!-- 右侧功能面板 -->
      <div class="function-panel" :style="{ width: (100 - screenPanelWidth) + '%' }">
        <el-tabs v-model="activeTab" type="border-card" stretch @tab-click="switchTabs">
          <!-- 控制面板 -->
          <el-tab-pane label="控制面板" name="main">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card>
                  <template #header><strong>文字输入</strong></template>
                  <el-alert title="点击设备屏幕后可直接使用键盘输入" type="info" show-icon :closable="false" />
                  <div style="text-align: center; margin-top: 12px">
                    <el-button size="small" type="primary" @click="sendText">清除文本</el-button>
                    <el-button size="small" type="primary" @click="startKeyboard">启动键盘</el-button>
                    <el-button size="small" type="primary" @click="stopKeyboard">停止键盘</el-button>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card>
                  <template #header><strong>远程ADB</strong></template>
                  <div v-if="remoteAdbUrl" style="margin: 20px 0">
                    <el-card :body-style="{ backgroundColor: '#303133', cursor: 'pointer' }" @click="copy('adb connect ' + remoteAdbUrl)">
                      <strong style="color: #f2f6fc">adb connect {{ remoteAdbUrl }}</strong>
                    </el-card>
                  </div>
                  <div v-else>
                    <el-card><strong>Agent未开启远程ADB</strong></el-card>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card>
                  <template #header><strong>UIAutomator2</strong></template>
                  <div style="text-align: center">
                    <el-button size="small" type="primary" :disabled="isDriverFinish" :loading="driverLoading" @click="openDriver">
                      初始化
                    </el-button>
                    <el-button size="small" type="danger" :disabled="!isDriverFinish" @click="closeDriver">
                      关闭
                    </el-button>
                    <div style="margin-top: 8px">
                      Status: <span :style="isDriverFinish ? 'color:#67C23A' : 'color:#606266'">
                        {{ isDriverFinish ? 'Connected' : 'Disconnected' }}
                      </span>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            <el-row :gutter="20" style="margin-top: 15px">
              <el-col :span="12">
                <el-card>
                  <template #header><strong>剪贴板</strong></template>
                  <el-input v-model="paste" :rows="5" clearable type="textarea" placeholder="输入要发送到设备的文本" />
                  <div style="text-align: center; margin-top: 15px">
                    <el-button size="small" type="primary" @click="setPasteboard(paste)">发送到设备</el-button>
                    <el-button size="small" type="primary" @click="getPasteboard">获取剪贴板</el-button>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card>
                  <template #header><strong>文件传输</strong></template>
                  <el-tabs type="border-card" stretch>
                    <el-tab-pane label="上传文件">
                      <el-upload v-loading="fileLoading" drag action="" :limit="1" :http-request="uploadFile">
                        <el-icon class="el-icon--upload"><Upload /></el-icon>
                        <div class="el-upload__text">拖拽文件到此处或<em>点击上传</em></div>
                      </el-upload>
                      <div style="display: flex; margin-top: 5px">
                        <el-input v-model="pushPath" size="small" placeholder="设备目标路径,如/sdcard/" />
                        <el-button style="margin-left: 5px" size="small" type="primary" :loading="pushLoading"
                          :disabled="!pushPath || !upLoadFilePath" @click="pushFile">Push</el-button>
                      </div>
                    </el-tab-pane>
                    <el-tab-pane label="下载文件">
                      <el-input v-model="pullPath" size="small" placeholder="设备文件路径" />
                      <el-button style="margin-top: 5px" size="small" type="primary" :loading="pullLoading"
                        :disabled="!pullPath" @click="pullFile">Pull</el-button>
                      <a v-if="pullResult" :href="pullResult" download target="_blank">
                        <el-button style="margin-top: 5px; margin-left: 10px" size="small" type="success">下载文件</el-button>
                      </a>
                    </el-tab-pane>
                    <el-tab-pane label="扫码">
                      <el-alert title="上传二维码图片，设备将自动扫描" type="info" show-icon :closable="false" />
                      <div style="text-align: center; margin-top: 10px">
                        <el-upload drag action="" :limit="1" :before-upload="beforeAvatarUpload" :http-request="uploadScan" list-type="picture">
                          <el-icon class="el-icon--upload"><Upload /></el-icon>
                          <div class="el-upload__text">上传二维码图片</div>
                        </el-upload>
                      </div>
                    </el-tab-pane>
                  </el-tabs>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>

          <!-- 应用管理 -->
          <el-tab-pane label="应用管理" name="apps">
            <el-tabs type="border-card" stretch>
              <el-tab-pane label="推送安装">
                <el-upload v-loading="uploadLoading" drag action="" :limit="1" :before-upload="beforeApkUpload" :http-request="uploadPackage">
                  <el-icon class="el-icon--upload"><Upload /></el-icon>
                  <div class="el-upload__text">拖拽APK文件到此处或<em>点击上传</em></div>
                  <template #tip><div class="el-upload__tip">仅支持 .apk 文件</div></template>
                </el-upload>
              </el-tab-pane>
              <el-tab-pane label="URL安装">
                <el-input v-model="uploadUrl" clearable size="small" placeholder="输入APK下载地址" />
                <div style="text-align: center; margin-top: 20px">
                  <el-button size="small" type="primary" :disabled="!uploadUrl" @click="install(uploadUrl)">开始安装</el-button>
                </div>
              </el-tab-pane>
            </el-tabs>
            <el-card shadow="hover" style="margin-top: 15px">
              <el-table :data="currAppListPageData" border>
                <el-table-column width="80" align="center">
                  <template #header>
                    <el-button size="small" @click="refreshAppList">刷新</el-button>
                  </template>
                  <template #default="scope">
                    <el-avatar shape="square" :size="40" :src="'data:image/png;base64,' + scope.row.appIcon" />
                  </template>
                </el-table-column>
                <el-table-column prop="appName" label="应用名" width="150" show-overflow-tooltip />
                <el-table-column prop="packageName" label="包名" show-overflow-tooltip>
                  <template #default="scope">
                    <span style="cursor: pointer" @click="copy(scope.row.packageName)">{{ scope.row.packageName }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="versionName" label="版本" width="100" />
                <el-table-column align="center" width="220">
                  <template #header>
                    <el-input v-model="filterAppText" size="small" placeholder="搜索应用" />
                  </template>
                  <template #default="scope">
                    <el-button size="small" type="primary" @click="openApp(scope.row.packageName)">打开</el-button>
                    <el-button size="small" type="warning" @click="killApp(scope.row.packageName)">关闭</el-button>
                    <el-button size="small" type="danger" @click="uninstallApp(scope.row.packageName)">卸载</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-pagination v-if="filterTableData.length > 7" style="margin-top: 10px"
                :current-page="currAppListPageIndex + 1" :page-size="7" :total="filterTableData.length"
                layout="prev, pager, next" @current-change="changeAppListPage" />
            </el-card>
          </el-tab-pane>

          <!-- 抓包代理 -->
          <el-tab-pane label="抓包代理" name="proxy">
            <el-button size="small" type="success" @click="startProxy">启动抓包</el-button>
            <el-button size="small" @click="installCert">安装证书</el-button>
            <el-button size="small" @click="clearProxy">取消代理</el-button>
            <strong v-if="proxyConnPort" style="color: #67c23a; float: right; margin-top: 5px">
              代理地址：{{ agent.host }}:{{ proxyConnPort }}
            </strong>
            <iframe v-if="proxyWebPort" allow="clipboard-read;clipboard-write"
              style="border:1px solid #C0C4CC; width: 100%; height: 500px; margin-top: 15px"
              :src="'http://' + agent.host + ':' + proxyWebPort" />
            <el-card v-else style="margin-top: 20px">
              <template #header><strong>使用说明</strong></template>
              <el-steps direction="vertical" :active="3">
                <el-step title="连接WiFi" status="process" description="确保设备已连接WiFi网络" />
                <el-step title="安装证书" status="process" description="点击安装证书按钮，在设备上安装HTTPS证书" />
                <el-step title="开始抓包" status="process" description="点击启动抓包按钮，开始捕获网络请求" />
              </el-steps>
            </el-card>
          </el-tab-pane>

          <!-- 截图 -->
          <el-tab-pane label="截图" name="screenCap">
            <el-button type="primary" size="small" @click="quickCap">
              <el-icon><Camera /></el-icon> 截图
            </el-button>
            <el-button type="danger" size="small" @click="removeScreen">
              <el-icon><Delete /></el-icon> 清空
            </el-button>
            <el-card v-if="screenUrls.length === 0" style="margin-top: 10px">
              <el-empty description="暂无截图" />
            </el-card>
            <el-row v-else :gutter="15" style="margin-top: 10px">
              <el-col v-for="(u, idx) in screenUrls" :key="idx" :span="4" style="margin-bottom: 15px">
                <el-card :body-style="{ padding: '10px' }">
                  <el-image :src="u" :preview-src-list="screenUrls" hide-on-click-modal fit="contain" />
                  <div style="text-align: center; margin-top: 5px">
                    <el-button type="primary" size="small" @click="downloadImg(u)">下载</el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>

          <!-- 终端 -->
          <el-tab-pane label="终端" name="terminal">
            <el-alert title="注意：部分命令可能导致设备异常，请谨慎使用" type="warning" show-icon :closable="false" style="margin-bottom: 10px" />
            <el-tabs type="border-card" stretch>
              <el-tab-pane label="Shell">
                <el-card :body-style="{ color: '#FFF', backgroundColor: '#303133', lineHeight: '1.5' }">
                  <el-scrollbar ref="terScroll" height="400px">
                    <div v-for="(c, i) in cmdOutPut" :key="i" style="white-space: pre-wrap" v-html="c" />
                  </el-scrollbar>
                  <div style="display: flex; margin-top: 10px">
                    <el-input v-model="cmdInput" size="small" placeholder="输入命令..." @keyup.enter="sendCmd">
                      <template #prepend>{{ cmdUser }}:/ $</template>
                    </el-input>
                    <el-button size="small" :disabled="!cmdInput || !cmdIsDone" style="margin-left: 5px" type="primary" @click="sendCmd">Send</el-button>
                    <el-button size="small" :disabled="cmdIsDone" style="margin-left: 5px" type="danger" @click="stopCmd">Stop</el-button>
                    <el-button size="small" style="margin-left: 5px" type="warning" @click="clearCmd">Clear</el-button>
                  </div>
                </el-card>
              </el-tab-pane>
              <el-tab-pane label="Logcat">
                <el-card :body-style="{ color: '#FFF', backgroundColor: '#303133', lineHeight: '1.5' }">
                  <div style="display: flex; margin-bottom: 10px">
                    <el-select v-model="logcatFilter.level" size="small" style="width: 120px">
                      <el-option label="VERBOSE" value="V" />
                      <el-option label="DEBUG" value="D" />
                      <el-option label="INFO" value="I" />
                      <el-option label="WARN" value="W" />
                      <el-option label="ERROR" value="E" />
                      <el-option label="FATAL" value="F" />
                    </el-select>
                    <el-input v-model="logcatFilter.filter" style="margin-left: 5px" size="small" placeholder="过滤关键词">
                      <template #prepend>| grep</template>
                    </el-input>
                    <el-button size="small" style="margin-left: 5px" type="primary" @click="sendLogcat">Start</el-button>
                    <el-button size="small" style="margin-left: 5px" type="warning" @click="stopLogcat">Stop</el-button>
                    <el-button size="small" style="margin-left: 5px" type="success" @click="saveLogcat">Save</el-button>
                    <el-button size="small" style="margin-left: 5px" type="danger" @click="clearLogcat">Clear</el-button>
                  </div>
                  <el-scrollbar ref="logcatScroll" height="400px">
                    <div v-for="(l, i) in logcatOutPut" :key="i" style="white-space: pre-wrap; font-size: 12px" v-html="l" />
                  </el-scrollbar>
                </el-card>
              </el-tab-pane>
            </el-tabs>
          </el-tab-pane>

          <!-- 控件检测 -->
          <el-tab-pane label="控件检测" name="ele">
            <el-tabs type="border-card" stretch>
              <el-tab-pane label="原生控件(UIAutomator)">
                <div v-show="isShowImg">
                  <div style="margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between">
                    <div>
                      <el-select v-model="isMultiWindows" size="small" style="width: 120px">
                        <el-option label="单窗口" :value="false" />
                        <el-option label="多窗口" :value="true" />
                      </el-select>
                      <el-select v-model="isVisible" size="small" style="margin-left: 10px; width: 120px">
                        <el-option label="隐藏不可见" :value="false" />
                        <el-option label="显示不可见" :value="true" />
                      </el-select>
                      <el-select v-model="isIgnore" size="small" style="margin-left: 10px; width: 140px">
                        <el-option label="忽略不重要控件" :value="true" />
                        <el-option label="显示不重要控件" :value="false" />
                      </el-select>
                      <el-button style="margin-left: 10px" type="primary" size="small"
                        :loading="elementLoading" :disabled="!isDriverFinish" @click="getElement">
                        <el-icon><Search /></el-icon> 获取控件
                      </el-button>
                    </div>
                    <span v-if="activity" style="color: #909399; font-size: 14px; cursor: pointer" @click="copy(activity)">
                      Activity：{{ activity }}
                    </span>
                  </div>
                  <el-row :gutter="10">
                    <el-col :span="7">
                      <el-card shadow="hover">
                        <div :style="'width: 100%;background-image: url(' + debugImgUrl + ');background-size: 100% 100%;'">
                          <canvas id="debugPic" @mousedown="touchstart" />
                        </div>
                      </el-card>
                    </el-col>
                    <el-col :span="9">
                      <el-card v-if="isShowTree" shadow="hover">
                        <el-input v-model="filterText" style="margin-bottom: 10px" size="small" placeholder="按class/resource-id过滤" />
                        <el-scrollbar height="500px">
                          <el-tree ref="tree" :indent="13" :filter-node-method="filterNode" :default-expanded-keys="currentId"
                            node-key="id" :highlight-current="true" :accordion="true" :data="elementData" @node-click="handleNodeClick">
                            <template #default="{ node, data }">
                              <span v-if="data.detail['resource-id']" style="font-size: 14px">
                                {{ node.label.substring(0, node.label.indexOf('>') + 1) }}
                                <span style="color: #f55781">resource-id</span>="{{ data.detail['resource-id'] }}"&gt;
                              </span>
                              <span v-else style="font-size: 14px">{{ node.label }}</span>
                            </template>
                          </el-tree>
                        </el-scrollbar>
                      </el-card>
                    </el-col>
                    <el-col :span="8">
                      <el-card v-if="isShowTree" shadow="hover">
                        <el-scrollbar height="500px">
                          <el-form v-if="elementDetail" label-position="left" label-width="100px">
                            <el-form-item label="class" @click="copy(elementDetail['class'])">
                              <span style="cursor: pointer">{{ elementDetail['class'] }}</span>
                            </el-form-item>
                            <el-form-item v-if="elementDetail['resource-id']" label="resource-id">
                              <span style="cursor: pointer" @click="copy(elementDetail['resource-id'])">
                                {{ elementDetail['resource-id'] }}
                              </span>
                            </el-form-item>
                            <el-form-item label="xpath推荐">
                              <el-table stripe border :data="findBestXpath(elementDetail)" :show-header="false" size="small">
                                <el-table-column>
                                  <template #default="scope">
                                    <span style="cursor: pointer" @click="copy(scope.row)">{{ scope.row }}</span>
                                  </template>
                                </el-table-column>
                              </el-table>
                            </el-form-item>
                            <el-form-item label="绝对路径">
                              <span style="cursor: pointer" @click="copy(elementDetail['xpath'])">{{ elementDetail['xpath'] }}</span>
                            </el-form-item>
                            <el-form-item label="text" @click="copy(elementDetail['text'])">
                              <span style="cursor: pointer">{{ elementDetail['text'] }}</span>
                            </el-form-item>
                            <el-form-item v-if="elementDetail['content-desc']" label="content-desc">
                              <span style="cursor: pointer" @click="copy(elementDetail['content-desc'])">
                                {{ elementDetail['content-desc'] }}
                              </span>
                            </el-form-item>
                            <el-form-item label="package" @click="copy(elementDetail['package'])">
                              <span style="cursor: pointer">{{ elementDetail['package'] }}</span>
                            </el-form-item>
                            <el-form-item label="中心坐标">
                              <span style="cursor: pointer" @click="copy(computedCenter(elementDetail.bStart, elementDetail.bEnd))">
                                {{ computedCenter(elementDetail.bStart, elementDetail.bEnd) }}
                              </span>
                            </el-form-item>
                            <el-form-item label="bounds">
                              <span>{{ elementDetail['bounds'] }}</span>
                            </el-form-item>
                          </el-form>
                        </el-scrollbar>
                      </el-card>
                    </el-col>
                  </el-row>
                </div>
                <el-card v-show="!isShowImg" style="height: 100%">
                  <el-result icon="info" title="提示" sub-title="请先初始化UIAutomator2，然后点击获取控件按钮">
                    <template #extra>
                      <el-button size="small" type="primary" :disabled="isDriverFinish" :loading="driverLoading" @click="openDriver">
                        初始化UIAutomator2
                      </el-button>
                      <el-button type="primary" size="small" :loading="elementLoading" :disabled="!isDriverFinish" @click="getElement">
                        <el-icon><Search /></el-icon> 获取控件
                      </el-button>
                    </template>
                  </el-result>
                </el-card>
              </el-tab-pane>
              <el-tab-pane label="游戏控件(POCO)">
                <div style="margin-bottom: 10px; display: flex">
                  <el-select v-model="selectPocoType" size="small" @change="switchPocoType" style="width: 150px">
                    <el-option v-for="item in pocoTypeList" :key="item.name" :value="item.value" :label="item.name" />
                  </el-select>
                  <el-input v-model="pocoPort" placeholder="端口" style="margin-left: 10px; width: 150px" size="small" />
                  <el-button style="margin-left: 10px" type="primary" :loading="pocoLoading" size="small"
                    :disabled="!selectPocoType || !isDriverFinish" @click="getPoco(selectPocoType)">获取POCO</el-button>
                </div>
                <el-card v-if="!isShowPocoImg" style="height: 100%">
                  <el-result icon="info" title="提示" sub-title="请先选择游戏引擎类型，然后点击获取POCO按钮" />
                </el-card>
                <el-row v-else :gutter="10">
                  <el-col :span="8">
                    <el-card shadow="hover">
                      <div :style="'width: 100%;background-image: url(' + pocoImgUrl + ');background-size: 100% 100%;'">
                        <canvas id="debugPocoPic" @mousedown="touchstartpoco" />
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="8">
                    <el-card shadow="hover">
                      <el-scrollbar height="500px">
                        <el-tree ref="pocoTree" :indent="13" :default-expanded-keys="currentPocoId" node-key="id"
                          :highlight-current="true" :accordion="true" :data="pocoData" @node-click="handlePocoClick">
                          <template #default="{ data }">
                            <span style="font-size: 14px">{{ data.name }}</span>
                          </template>
                        </el-tree>
                      </el-scrollbar>
                    </el-card>
                  </el-col>
                  <el-col :span="8">
                    <el-card shadow="hover">
                      <el-scrollbar height="500px">
                        <el-form v-if="pocoDetail" label-position="left" label-width="100px">
                          <el-form-item v-if="pocoDetail['name']" label="name" @click="copy(pocoDetail['name'])">
                            <span style="cursor: pointer">{{ pocoDetail['name'] }}</span>
                          </el-form-item>
                          <el-form-item label="POCO推荐">
                            <el-table stripe border :data="findBestPoco(pocoDetail)" :show-header="false" size="small">
                              <el-table-column>
                                <template #default="scope">
                                  <span style="cursor: pointer" @click="copy(scope.row)">{{ scope.row }}</span>
                                </template>
                              </el-table-column>
                            </el-table>
                          </el-form-item>
                          <el-form-item label="绝对路径">
                            <span style="cursor: pointer" @click="copy(pocoDetail['xpath'])">{{ pocoDetail['xpath'] }}</span>
                          </el-form-item>
                          <template v-for="key in Object.keys(pocoDetail)" :key="key">
                            <el-form-item v-if="key !== 'name' && key !== 'xpath'" :label="key" @click="copy(JSON.stringify(pocoDetail[key]))">
                              <span style="cursor: pointer">{{ pocoDetail[key] }}</span>
                            </el-form-item>
                          </template>
                        </el-form>
                      </el-scrollbar>
                    </el-card>
                  </el-col>
                </el-row>
              </el-tab-pane>
            </el-tabs>
          </el-tab-pane>

          <!-- WebView调试 -->
          <el-tab-pane label="WebView" name="webview">
            <div v-if="isWebView">
              <el-button :loading="webViewLoading" type="primary" size="small" @click="getWebViewForward">
                {{ webViewListDetail.length === 0 ? '获取WebView' : '刷新WebView' }}
              </el-button>
              <div v-if="webViewListDetail.length === 0">
                <el-result icon="info" title="提示" sub-title="请点击获取WebView按钮检测页面中的WebView" />
              </div>
              <div v-else>
                <el-card v-for="(web, idx) in webViewListDetail" :key="idx" style="margin-top: 15px">
                  <template #header>
                    <strong>{{ web.package }} ({{ web.version }})</strong>
                  </template>
                  <el-card v-for="(w, widx) in web.children" :key="widx" :body-style="{ padding: '15px' }" style="margin-top: 10px">
                    <div style="display: flex; align-items: center; justify-content: space-between">
                      <div>
                        <strong>{{ w.title || '无标题' }}</strong>
                        <div style="color: #909399">{{ w.url.substring(0, 50) }}{{ w.url.length > 50 ? '...' : '' }}</div>
                      </div>
                      <el-button type="primary" size="small" @click="tabWebView(web.port, w.id, w.title || '无标题')">
                        调试
                      </el-button>
                    </div>
                  </el-card>
                </el-card>
              </div>
            </div>
            <div v-else>
              <el-page-header @back="switchIsWebView">
                <template #title><span>返回</span></template>
                <template #content>正在调试：<strong>{{ webViewTitle }}</strong></template>
              </el-page-header>
              <iframe allow="clipboard-read;clipboard-write" style="border:1px solid #C0C4CC; width: 100%; height: 500px; margin-top: 15px"
                :src="iframeUrl" />
            </div>
          </el-tab-pane>

          <!-- 性能监控 -->
          <el-tab-pane label="性能监控" name="perfmon">
            <div style="margin-bottom: 15px">
              <el-select v-model="perfBundleId" style="width: 280px" filterable clearable size="small" placeholder="选择要监控的应用">
                <el-option v-for="a in appList" :key="a.packageName" :value="a.packageName" :label="a.appName">
                  <div style="display: flex; align-items: center">
                    <el-avatar style="margin-right: 10px" :size="30" :src="'data:image/png;base64,' + a.appIcon" shape="square" />
                    {{ a.appName }}
                    <span style="float: right; margin-left: 15px; color: #909399; font-size: 13px">{{ a.packageName }}</span>
                  </div>
                </el-option>
              </el-select>
              <el-button type="primary" size="small" style="margin-left: 10px" :loading="isPerfStart" @click="startPerfmon">
                <el-icon><View /></el-icon> 开始
              </el-button>
              <el-button type="warning" size="small" @click="stopPerfmon">
                <el-icon><VideoPause /></el-icon> 停止
              </el-button>
              <el-button type="danger" size="small" @click="clearPerfmon">
                <el-icon><Delete /></el-icon> 清空
              </el-button>
            </div>
            <el-row :gutter="15">
              <el-col :span="12">
                <el-card>
                  <template #header><strong>CPU使用率</strong></template>
                  <div ref="cpuChart" style="height: 200px" />
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card>
                  <template #header><strong>内存使用</strong></template>
                  <div ref="memChart" style="height: 200px" />
                </el-card>
              </el-col>
            </el-row>
            <el-row :gutter="15" style="margin-top: 15px">
              <el-col :span="12">
                <el-card>
                  <template #header><strong>FPS帧率</strong></template>
                  <div ref="fpsChart" style="height: 200px" />
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card>
                  <template #header><strong>网络流量</strong></template>
                  <div ref="networkChart" style="height: 200px" />
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Cellphone, Timer, Close, VideoCamera, Camera, Search, Menu, View, Tools, Service, Bell,
  CopyDocument, HomeFilled, Back, Sunny, Minus, Plus, Microphone, MuteNotification, SwitchButton,
  Delete, Operation, Connection, PhoneFilled, Position, InfoFilled, Upload
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getDeviceById } from '@/api/app/devices'
import { getAgents } from '@/api/app/agents'
import { getToken } from '@/utils/auth'
import Scrcpy from './Scrcpy'

const route = useRoute()
const router = useRouter()

// ==================== 基础状态 ====================
const device = ref({})
const agent = ref({})
const loading = ref(true)

// ==================== 屏幕相关 ====================
const screenMode = ref(localStorage.getItem('screenMode') || 'Scrcpy')
const screenPanelWidth = ref(35)
const canvasStyle = ref({})
let scrcpyInstance = null
let websocket = null
let terminalWebsocket = null
let imgWidth = 0
let imgHeight = 0
let oldBlob = null
const directionStatus = ref(-1)

// ==================== 触摸相关 ====================
let isPress = false
let isFixTouch = false
let mouseMoveTime = 0
let touchWrapper = null
let loop = null
let time = 0
let isLongPress = false
let moveX = 0
let moveY = 0

// ==================== 输入相关 ====================
const inputBox = ref(null)
const inputValue = ref('')
const inputBoxStyle = ref({})
const paste = ref('')

// ==================== 功能面板 ====================
const activeTab = ref('main')
const screenUrls = ref([])

// ==================== 应用管理 ====================
const appList = ref([])
const filterAppText = ref('')
const appListPageData = ref([])
const currAppListPageIndex = ref(0)
const currAppListPageData = ref([])
const uploadUrl = ref('')
const uploadLoading = ref(false)

const filterTableData = computed(() => {
  const list = appList.value.filter(data =>
    !filterAppText.value ||
    data.appName?.toLowerCase().includes(filterAppText.value.toLowerCase()) ||
    data.packageName?.toLowerCase().includes(filterAppText.value.toLowerCase())
  )
  transformPageable(list)
  return list
})

const transformPageable = (data) => {
  const pageSize = 7
  appListPageData.value = []
  let start = 0
  let end = pageSize
  while (end <= data.length) {
    appListPageData.value.push(data.slice(start, end))
    start = end
    end += pageSize
  }
  if (data.length % pageSize) {
    appListPageData.value.push(data.slice(start, data.length))
  }
  currAppListPageData.value = appListPageData.value[currAppListPageIndex.value] || []
}

const changeAppListPage = (pageNum) => {
  currAppListPageIndex.value = pageNum - 1
  currAppListPageData.value = appListPageData.value[currAppListPageIndex.value]
}

// ==================== 文件传输 ====================
const fileLoading = ref(false)
const upLoadFilePath = ref('')
const pushPath = ref('')
const pushLoading = ref(false)
const pullPath = ref('')
const pullLoading = ref(false)
const pullResult = ref('')

// ==================== 抓包代理 ====================
const proxyWebPort = ref(0)
const proxyConnPort = ref(0)

// ==================== 终端 ====================
const cmdInput = ref('')
const cmdOutPut = ref([])
const cmdUser = ref('')
const cmdIsDone = ref(true)
const terScroll = ref(null)
const logcatOutPut = ref([])
const logcatScroll = ref(null)
const logcatFilter = ref({ level: 'E', filter: '' })

// ==================== 控件检测 ====================
const driverLoading = ref(false)
const isDriverFinish = ref(false)
const elementLoading = ref(false)
const isShowImg = ref(false)
const isShowTree = ref(false)
const debugImgUrl = ref('')
const elementData = ref([])
const elementDetail = ref(null)
const tree = ref(null)
const currentId = ref([])
const filterText = ref('')
const activity = ref('')
const isMultiWindows = ref(false)
const isIgnore = ref(true)
const isVisible = ref(false)

// POCO相关
const pocoLoading = ref(false)
const selectPocoType = ref('')
const pocoPort = ref('')
const isShowPocoImg = ref(false)
const pocoImgUrl = ref('')
const pocoData = ref([])
const pocoDetail = ref(null)
const pocoTree = ref(null)
const currentPocoId = ref([])
const pocoTypeList = ref([
  { name: 'Unity3d', value: 'UNITY_3D' },
  { name: 'UE4', value: 'UE4' },
  { name: 'Cocos2dx-js', value: 'COCOS_2DX_JS' },
  { name: 'Cocos2dx-lua', value: 'COCOS_2DX_LUA' },
  { name: 'Cocos-creator', value: 'COCOS_CREATOR' },
  { name: 'Egret', value: 'EGRET' }
])

// ==================== WebView ====================
const webViewLoading = ref(false)
const webViewListDetail = ref([])
const isWebView = ref(true)
const iframeUrl = ref('')
const webViewTitle = ref('')

// ==================== 性能监控 ====================
const perfBundleId = ref('')
const isPerfStart = ref(false)
const cpuChart = ref(null)
const memChart = ref(null)
const fpsChart = ref(null)
const networkChart = ref(null)
let cpuChartInstance = null
let memChartInstance = null
let fpsChartInstance = null
let networkChartInstance = null
const perfData = ref({ cpu: [], mem: [], fps: [], network: [] })

// ==================== 音频 ====================
const isConnectAudio = ref(false)
let audioPlayer = null

// ==================== 远程ADB ====================
const remoteAdbUrl = ref('')

// ==================== 计时器 ====================
const ticker = ref(0)
const idleCount = ref(0)
const idleTimeout = ref(0)
const remoteTimeout = ref(0)
let tickerInterval = null
let activeTime = 0

// ==================== 工具函数 ====================
const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const copy = async (value) => {
  try {
    await navigator.clipboard.writeText(value)
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

const computedCenter = (b1, b2) => {
  if (!b1 || !b2) return ''
  const x1 = parseInt(b1.substring(0, b1.indexOf(',')))
  const y1 = parseInt(b1.substring(b1.indexOf(',') + 1))
  const x2 = parseInt(b2.substring(0, b2.indexOf(',')))
  const y2 = parseInt(b2.substring(b2.indexOf(',') + 1))
  return `${Math.floor((x1 + x2) / 2)},${Math.floor((y1 + y2) / 2)}`
}

// ==================== 初始化 ====================
const initDevice = async () => {
  const deviceId = route.params.deviceId
  if (!deviceId) {
    ElMessage.error('设备ID不存在')
    router.go(-1)
    return
  }

  try {
    const resp = await getDeviceById(deviceId)
    if (resp.code === 200 && resp.data) {
      device.value = resp.data
      if (device.value.status !== 'ONLINE') {
        ElMessage.error('设备不在线')
        router.go(-1)
        return
      }
      const agentResp = await getAgents(device.value.agentId)
      if (agentResp.code === 200 && agentResp.data) {
        agent.value = agentResp.data
        openSocket()
      } else {
        ElMessage.error('获取Agent信息失败')
        loading.value = false
      }
    } else {
      ElMessage.error('获取设备信息失败')
      router.go(-1)
    }
  } catch (error) {
    console.error('初始化设备失败:', error)
    ElMessage.error('初始化设备失败')
    router.go(-1)
  }
}

// ==================== WebSocket连接 ====================
const openSocket = () => {
  const { host, port, secretKey } = agent.value
  const { udId } = device.value
  const token = getToken() || ''

  console.log('WebSocket连接参数:', {
    host,
    port,
    secretKey,
    udId,
    token: token ? '***' + token.slice(-6) : '(空)',
    controlUrl: `ws://${host}:${port}/websockets/android/${secretKey}/${udId}/${token ? '***' : '(无token)'}`
  })

  // 主控制WebSocket
  const wsUrl = `ws://${host}:${port}/websockets/android/${secretKey}/${udId}/${token}`
  websocket = new WebSocket(wsUrl)
  websocket.onmessage = websocketOnmessage
  websocket.onclose = () => console.log('Control WebSocket closed')
  websocket.onerror = (e) => {
    console.error('Control WebSocket error:', e)
    ElMessage.error('连接失败')
  }

  // 屏幕WebSocket
  const screenUrl = `ws://${host}:${port}/websockets/android/screen/${secretKey}/${udId}/${token}`
  scrcpyInstance = new Scrcpy({
    socketURL: screenUrl,
    node: 'scrcpy-video',
    excuteMode: screenMode.value,
    onmessage: screenWebsocketOnmessage,
    onopen: () => {
      loading.value = false
      touchWrapper = screenMode.value === 'Scrcpy'
        ? document.getElementById('scrcpy-video')
        : document.getElementById('canvas')
    }
  })

  // 终端WebSocket
  const terminalUrl = `ws://${host}:${port}/websockets/android/terminal/${secretKey}/${udId}/${token}`
  terminalWebsocket = new WebSocket(terminalUrl)
  terminalWebsocket.onmessage = terminalWebsocketOnmessage
  terminalWebsocket.onclose = () => console.log('Terminal WebSocket closed')

  driverLoading.value = true
}

// ==================== WebSocket消息处理 ====================
const websocketOnmessage = (message) => {
  try {
    const data = JSON.parse(message.data)
    switch (data.msg) {
      case 'perfDetail':
        handlePerfData(data.detail)
        break
      case 'poco':
        pocoLoading.value = false
        if (data.result) {
          ElMessage.success('获取POCO成功')
          setPocoData(JSON.parse(data.result).result)
        } else {
          ElMessage.error('获取POCO失败')
        }
        break
      case 'proxyResult':
        proxyWebPort.value = data.webPort
        proxyConnPort.value = data.port
        break
      case 'pullResult':
        pullLoading.value = false
        if (data.status === 'success') {
          ElMessage.success('文件拉取成功')
          pullResult.value = data.url
        } else {
          ElMessage.error('文件拉取失败')
        }
        break
      case 'paste':
        paste.value = data.detail || ''
        ElMessage.success('已获取剪贴板内容')
        break
      case 'pushResult':
        pushLoading.value = false
        ElMessage[data.status === 'success' ? 'success' : 'error'](data.status === 'success' ? '文件推送成功' : '文件推送失败')
        break
      case 'sas':
        if (data.isEnable && data.port > 0) {
          remoteAdbUrl.value = `${agent.value.host}:${data.port}`
        }
        break
      case 'tree':
        ElMessage.success('获取控件成功')
        currentId.value = [1]
        elementData.value = data.detail
        isShowTree.value = true
        elementLoading.value = false
        activity.value = data.activity || ''
        break
      case 'treeFail':
        ElMessage.error('获取控件失败')
        elementLoading.value = false
        break
      case 'installFinish':
        ElMessage[data.status === 'success' ? 'success' : 'error'](data.status === 'success' ? '安装成功' : '安装失败')
        break
      case 'uninstallFinish':
        ElMessage[data.detail === 'success' ? 'success' : 'error'](data.detail === 'success' ? '卸载成功' : '卸载失败')
        break
      case 'openDriver':
        driverLoading.value = false
        if (data.status === 'success') {
          isDriverFinish.value = true
          ElMessage.success('UIAutomator2初始化成功')
        } else {
          ElMessage.error('UIAutomator2初始化失败')
        }
        break
      case 'forwardView':
        webViewLoading.value = false
        ElMessage.success('获取WebView成功')
        webViewListDetail.value = data.detail || []
        break
      case 'error':
        ElMessage.error('系统异常')
        close()
        break
    }
  } catch (e) {
    // 忽略解析错误
  }
}

const screenWebsocketOnmessage = (message) => {
  if (typeof message.data === 'object') {
    oldBlob = message.data
    const blob = new Blob([message.data], { type: 'image/jpeg' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    const canvas = document.getElementById('canvas')
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      img.onload = function() {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)
      }
      img.src = url
    }
  } else {
    try {
      const data = JSON.parse(message.data)
      switch (data.msg) {
        case 'rotation':
          if (directionStatus.value !== -1) {
            loading.value = true
            ElMessage.success('屏幕旋转，正在调整...')
          }
          directionStatus.value = data.value
          if (screenMode.value === 'Scrcpy' && scrcpyInstance?.jmuxer) {
            scrcpyInstance.jmuxer.reset()
          }
          setTimeout(() => { loading.value = false }, 1000)
          break
        case 'support':
          ElMessage.error(data.text)
          loading.value = false
          break
        case 'size':
          imgWidth = data.width
          imgHeight = data.height
          loading.value = false
          break
        case 'picFinish':
          loading.value = false
          break
        case 'error':
          ElMessage.error('系统异常')
          close()
          break
      }
    } catch (e) {
      // 忽略解析错误
    }
  }
}

const terminalWebsocketOnmessage = (message) => {
  try {
    const data = JSON.parse(message.data)
    switch (data.msg) {
      case 'appListDetail':
        appList.value.push(data.detail)
        break
      case 'terminal':
        cmdUser.value = data.user || ''
        cmdOutPut.value.push('已连接到终端')
        break
      case 'terResp':
        cmdOutPut.value.push(data.detail)
        nextTick(() => {
          if (terScroll.value?.wrapRef) {
            terScroll.value.setScrollTop(terScroll.value.wrapRef.scrollHeight)
          }
        })
        break
      case 'terDone':
        cmdIsDone.value = true
        break
      case 'logcat':
        logcatOutPut.value.push('Logcat已连接')
        break
      case 'logcatResp':
        const formatted = data.detail
          .replace(/ I /g, "<span style='color: #0d84ff'> I </span>")
          .replace(/ D /g, "<span style='color: #67c23a'> D </span>")
          .replace(/ W /g, "<span style='color: #E6A23C'> W </span>")
          .replace(/ E /g, "<span style='color: #F56C6C'> E </span>")
          .replace(/ F /g, "<span style='color: #F56C6C'> F </span>")
        logcatOutPut.value.push(formatted)
        nextTick(() => {
          if (logcatScroll.value?.wrapRef) {
            logcatScroll.value.setScrollTop(logcatScroll.value.wrapRef.scrollHeight)
          }
        })
        break
      case 'error':
        ElMessage.error('系统异常')
        close()
        break
    }
  } catch (e) {
    // 忽略解析错误
  }
}

// ==================== 触摸操作 ====================
const getCurLocation = (event) => {
  const canvas = touchWrapper
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  let x, y
  if (directionStatus.value !== 0 && directionStatus.value !== 180) {
    const _x = parseInt((event.clientY - rect.top) * (imgWidth / canvas.clientHeight))
    const _y = parseInt((event.clientX - rect.left) * (imgHeight / canvas.clientWidth))
    x = directionStatus.value === 90 ? imgWidth - _x : _x - imgWidth * 3
    y = directionStatus.value === 90 ? _y : -_y
  } else {
    const _x = parseInt((event.clientX - rect.left) * (imgWidth / canvas.clientWidth))
    x = directionStatus.value === 180 ? imgWidth - _x : _x
    const _y = parseInt((event.clientY - rect.top) * (imgHeight / canvas.clientHeight))
    y = directionStatus.value === 180 ? imgHeight - _y : _y
  }
  inputBoxStyle.value = { left: `${event.clientX - rect.left}px`, top: `${event.clientY - rect.top}px` }
  return { x, y }
}

const getCurLocationForAdb = (event) => {
  const canvas = touchWrapper
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  let x, y
  if (directionStatus.value !== 0 && directionStatus.value !== 180) {
    x = parseInt((event.clientX - rect.left) * (imgHeight / canvas.clientWidth))
    y = parseInt((event.clientY - rect.top) * (imgWidth / canvas.clientHeight))
  } else {
    const _x = parseInt((event.clientX - rect.left) * (imgWidth / canvas.clientWidth))
    x = directionStatus.value === 180 ? imgWidth - _x : _x
    const _y = parseInt((event.clientY - rect.top) * (imgHeight / canvas.clientHeight))
    y = directionStatus.value === 180 ? imgHeight - _y : _y
  }
  return { x, y }
}

const mousedown = (event) => {
  if (!isFixTouch) {
    const { x, y } = getCurLocation(event)
    isPress = true
    sendWs({ type: 'touch', detail: `down ${x} ${y}\n` })
  } else {
    const { x, y } = getCurLocationForAdb(event)
    moveX = x
    moveY = y
    clearInterval(loop)
    loop = setInterval(() => {
      time += 500
      if (time >= 1000 && !isLongPress) {
        sendWs({ type: 'debug', detail: 'longPress', point: `${moveX},${moveY}` })
        isLongPress = true
      }
    }, 500)
  }
}

const mousemove = (event) => {
  if (!isFixTouch && isPress) {
    if (mouseMoveTime < 1) {
      mouseMoveTime++
    } else {
      const { x, y } = getCurLocation(event)
      sendWs({ type: 'touch', detail: `move ${x} ${y}\n` })
      mouseMoveTime = 0
    }
  }
}

const mouseup = (event) => {
  if (!isFixTouch) {
    if (isPress) {
      isPress = false
      sendWs({ type: 'touch', detail: 'up\n' })
      inputBox.value?.focus()
    }
  } else {
    clearInterval(loop)
    time = 0
    const { x, y } = getCurLocationForAdb(event)
    if (moveX === x && moveY === y) {
      if (!isLongPress) {
        sendWs({ type: 'debug', detail: 'tap', point: `${x},${y}` })
        inputBox.value?.focus()
      }
    } else {
      sendWs({ type: 'debug', detail: 'swipe', pointA: `${moveX},${moveY}`, pointB: `${x},${y}` })
      inputBox.value?.focus()
    }
    isLongPress = false
  }
}

const mouseleave = () => {
  if (isFixTouch) {
    clearInterval(loop)
    isLongPress = false
  } else if (isPress) {
    isPress = false
    sendWs({ type: 'touch', detail: 'up\n' })
  }
}

// ==================== 发送WebSocket消息 ====================
const sendWs = (data) => {
  if (websocket?.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(data))
  }
}

const sendTerminalWs = (data) => {
  if (terminalWebsocket?.readyState === WebSocket.OPEN) {
    terminalWebsocket.send(JSON.stringify(data))
  }
}

const sendScreenWs = (data) => {
  if (scrcpyInstance?.websocket?.readyState === WebSocket.OPEN) {
    scrcpyInstance.websocket.send(JSON.stringify(data))
  }
}

// ==================== 按键操作 ====================
const pressKey = (keyNum) => sendWs({ type: 'keyEvent', detail: keyNum })

// ==================== 输入操作 ====================
const changeInputHandle = () => {
  if (inputValue.value) {
    sendWs({ type: 'text', detail: inputValue.value })
    inputValue.value = ''
  }
}
const deleteInputHandle = () => sendWs({ type: 'text', detail: 'CODE_AC_BACK' })
const enterInputHandle = () => sendWs({ type: 'text', detail: 'CODE_AC_ENTER' })
const sendText = () => sendWs({ type: 'text', detail: 'CODE_AC_CLEAN' })
const startKeyboard = () => sendWs({ type: 'startKeyboard' })
const stopKeyboard = () => sendWs({ type: 'stopKeyboard' })

// ==================== 剪贴板 ====================
const setPasteboard = (text) => {
  sendWs({ type: 'setPasteboard', detail: text })
  ElMessage.success('已发送到设备')
}
const getPasteboard = () => sendWs({ type: 'getPasteboard' })

// ==================== 截图 ====================
const getVideoScreenshot = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const video = document.getElementById('scrcpy-video')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0)
  return canvas.toDataURL('image/png', 1)
}

const quickCap = () => {
  let imageUrl
  if (oldBlob) {
    const blob = new Blob([oldBlob], { type: 'image/jpeg' })
    imageUrl = URL.createObjectURL(blob)
  } else {
    imageUrl = getVideoScreenshot()
  }
  screenUrls.value.push(imageUrl)
  ElMessage.success('截图成功')
}

const removeScreen = () => { screenUrls.value = [] }

const downloadImg = (url) => {
  const link = document.createElement('a')
  link.href = url
  link.download = `screenshot_${Date.now()}.jpg`
  link.click()
}

// ==================== 屏幕设置 ====================
const changeScreenMode = (mode) => {
  loading.value = true
  screenMode.value = mode
  scrcpyInstance?.switchMode(mode)
  oldBlob = null
  touchWrapper = mode === 'Scrcpy' ? document.getElementById('scrcpy-video') : document.getElementById('canvas')
  localStorage.setItem('screenMode', mode)
  setTimeout(() => { loading.value = false }, 1000)
}

const changePic = (type) => {
  loading.value = true
  sendScreenWs({ type: 'pic', detail: type })
}

const fixTouch = () => {
  ElMessage.success('触摸修复模式已' + (isFixTouch ? '关闭' : '开启'))
  isFixTouch = !isFixTouch
}

const fixOri = () => {
  ElMessage.success('方向修复成功')
  directionStatus.value = directionStatus.value === 0 || directionStatus.value === 180 ? 90 : 0
}

// ==================== 电池模拟 ====================
const batteryDisconnect = () => sendWs({ type: 'battery', detail: 0 })
const batteryReset = () => sendWs({ type: 'battery', detail: 1 })

// ==================== 搜索设备 ====================
const searchDevice = () => {
  sendWs({ type: 'find' })
  ElMessage.success('设备正在闪烁')
}

// ==================== 应用管理 ====================
const refreshAppList = () => {
  appList.value = []
  currAppListPageIndex.value = 0
  ElMessage.success('正在获取应用列表...')
  sendTerminalWs({ type: 'appList' })
}

const openApp = (pkg) => sendWs({ type: 'debug', detail: 'openApp', pkg })
const killApp = (pkg) => {
  sendWs({ type: 'debug', detail: 'killApp', pkg })
  ElMessage.success('已发送关闭命令')
}
const uninstallApp = (pkg) => {
  ElMessage.success('开始卸载...')
  sendWs({ type: 'uninstallApp', detail: pkg })
}

const install = (apk) => {
  if (apk) {
    sendWs({ type: 'debug', detail: 'install', apk })
    ElMessage.success('开始安装...')
  }
}

const beforeApkUpload = (file) => {
  if (!file.name.endsWith('.apk')) {
    ElMessage.error('仅支持 .apk 文件')
    return false
  }
  return true
}

const uploadPackage = async (content) => {
  uploadLoading.value = true
  const formData = new FormData()
  formData.append('file', content.file)
  formData.append('type', 'packageFiles')
  try {
    const resp = await fetch('/dev-api/folder/upload', {
      method: 'POST',
      body: formData,
      headers: { 'Authorization': 'Bearer ' + getToken() }
    }).then(r => r.json())
    uploadLoading.value = false
    if (resp.code === 200) {
      install(resp.data || resp.url)
    }
  } catch (e) {
    uploadLoading.value = false
    ElMessage.error('上传失败')
  }
}

// ==================== 文件传输 ====================
const uploadFile = async (content) => {
  fileLoading.value = true
  const formData = new FormData()
  formData.append('file', content.file)
  formData.append('type', 'packageFiles')
  try {
    const resp = await fetch('/dev-api/folder/upload', {
      method: 'POST',
      body: formData,
      headers: { 'Authorization': 'Bearer ' + getToken() }
    }).then(r => r.json())
    fileLoading.value = false
    if (resp.code === 200) {
      upLoadFilePath.value = resp.data || resp.url
      ElMessage.success('文件上传成功')
    }
  } catch (e) {
    fileLoading.value = false
    ElMessage.error('上传失败')
  }
}

const pushFile = () => {
  pushLoading.value = true
  sendWs({ type: 'pushFile', file: upLoadFilePath.value, path: pushPath.value })
}

const pullFile = () => {
  pullResult.value = ''
  pullLoading.value = true
  sendWs({ type: 'pullFile', path: pullPath.value })
}

const beforeAvatarUpload = (file) => {
  if (file.name.endsWith('.jpg') || file.name.endsWith('.png')) return true
  ElMessage.error('仅支持 jpg/png 格式')
  return false
}

const uploadScan = async (content) => {
  const formData = new FormData()
  formData.append('file', content.file)
  formData.append('type', 'imageFiles')
  try {
    const resp = await fetch('/dev-api/folder/upload', {
      method: 'POST',
      body: formData,
      headers: { 'Authorization': 'Bearer ' + getToken() }
    }).then(r => r.json())
    if (resp.code === 200) {
      ElMessage.success('图片上传成功')
      sendWs({ type: 'scan', url: resp.data || resp.url })
    }
  } catch (e) {
    ElMessage.error('上传失败')
  }
}

// ==================== 抓包代理 ====================
const startProxy = () => sendWs({ type: 'proxy' })
const installCert = () => sendWs({ type: 'installCert' })
const clearProxy = () => {
  ElMessage.success('代理已取消')
  sendWs({ type: 'clearProxy' })
}

// ==================== 终端 ====================
const sendCmd = () => {
  if (cmdInput.value && cmdIsDone.value) {
    cmdIsDone.value = false
    cmdOutPut.value.push(`<span style='color: #409EFF'>${cmdUser.value}</span>:/ $ ${cmdInput.value}`)
    sendTerminalWs({ type: 'command', detail: cmdInput.value })
    cmdInput.value = ''
  }
}
const clearCmd = () => { cmdOutPut.value = [] }
const stopCmd = () => {
  cmdIsDone.value = true
  sendTerminalWs({ type: 'stopCmd' })
}

// Logcat
const sendLogcat = () => sendTerminalWs({ type: 'logcat', level: logcatFilter.value.level, filter: logcatFilter.value.filter })
const stopLogcat = () => sendTerminalWs({ type: 'stopLogcat' })
const clearLogcat = () => { logcatOutPut.value = [] }
const saveLogcat = () => {
  if (logcatOutPut.value.length) {
    const content = logcatOutPut.value.join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${device.value.model}_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.log`
    link.click()
    URL.revokeObjectURL(url)
  }
}

// ==================== UIAutomator2 ====================
const openDriver = () => {
  driverLoading.value = true
  sendWs({ type: 'debug', detail: 'openDriver' })
}

const closeDriver = () => {
  isDriverFinish.value = false
  sendWs({ type: 'debug', detail: 'closeDriver' })
  ElMessage.success('UIAutomator2已关闭')
}

// ==================== 控件检测 ====================
const setImgData = () => {
  let imageUrl
  if (oldBlob) {
    const blob = new Blob([oldBlob], { type: 'image/jpeg' })
    imageUrl = URL.createObjectURL(blob)
  } else {
    imageUrl = getVideoScreenshot()
  }
  debugImgUrl.value = imageUrl
  const canvas = document.getElementById('debugPic')
  const img = new Image()
  img.src = imageUrl
  img.onload = function() {
    if (canvas) {
      canvas.width = img.width
      canvas.height = img.height
    }
  }
  isShowImg.value = true
}

const getElement = () => {
  elementLoading.value = true
  setImgData()
  sendWs({ type: 'debug', detail: 'tree', isMulti: isMultiWindows.value, isIgnore: isIgnore.value, isVisible: isVisible.value })
}

const handleNodeClick = (data) => {
  if (data) {
    elementDetail.value = data.detail
    printElement(data)
  }
}

const printElement = (data) => {
  const canvas = document.getElementById('debugPic')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const eleStartX = parseInt(data.detail.bStart.substring(0, data.detail.bStart.indexOf(',')))
  const eleStartY = parseInt(data.detail.bStart.substring(data.detail.bStart.indexOf(',') + 1))
  const eleEndX = parseInt(data.detail.bEnd.substring(0, data.detail.bEnd.indexOf(',')))
  const eleEndY = parseInt(data.detail.bEnd.substring(data.detail.bEnd.indexOf(',') + 1))
  ctx.fillStyle = `rgba(${Math.random() * 255 | 0}, ${Math.random() * 255 | 0}, ${Math.random() * 255 | 0}, 0.6)`
  ctx.fillRect(
    eleStartX * (canvas.width / imgWidth),
    eleStartY * (canvas.height / imgHeight),
    (eleEndX - eleStartX) * (canvas.width / imgWidth),
    (eleEndY - eleStartY) * (canvas.height / imgHeight)
  )
}

const touchstart = async (event) => {
  const debugPic = document.getElementById('debugPic')
  if (!debugPic) return
  const rect = debugPic.getBoundingClientRect()
  const x = parseInt((event.clientX - rect.left) * (imgWidth / debugPic.clientWidth))
  const y = parseInt((event.clientY - rect.top) * (imgHeight / debugPic.clientHeight))
  await nextTick(() => {
    tree.value?.setCurrentKey(findMinSize(findElementByPoint(elementData.value, x, y)))
  })
  await handleNodeClick(tree.value?.getCurrentNode())
}

const findMinSize = (data) => {
  if (!data.length) return null
  let result = data[0]
  for (const item of data) {
    if (item.size < result.size) result = item
  }
  currentId.value = [result.ele.id]
  return result.ele.id
}

const findElementByPoint = (ele, x, y) => {
  const result = []
  for (const item of ele) {
    const eleStartX = parseInt(item.detail.bStart.substring(0, item.detail.bStart.indexOf(',')))
    const eleStartY = parseInt(item.detail.bStart.substring(item.detail.bStart.indexOf(',') + 1))
    const eleEndX = parseInt(item.detail.bEnd.substring(0, item.detail.bEnd.indexOf(',')))
    const eleEndY = parseInt(item.detail.bEnd.substring(item.detail.bEnd.indexOf(',') + 1))
    if (x >= eleStartX && x <= eleEndX && y >= eleStartY && y <= eleEndY) {
      result.push({ ele: item, size: (eleEndY - eleStartY) * (eleEndX - eleStartX) })
    }
    if (item.children) {
      result.push(...findElementByPoint(item.children, x, y))
    }
  }
  return result
}

const findBestXpath = (detail) => {
  if (!detail) return []
  const result = []
  if (detail['resource-id']) result.push(`//${detail.class}[@resource-id='${detail['resource-id']}']`)
  if (detail.text) {
    result.push(`//${detail.class}[@text='${detail.text}']`)
    result.push(`//${detail.class}[contains(@text,'${detail.text}')]`)
  }
  if (detail['content-desc']) {
    result.push(`//${detail.class}[@content-desc='${detail['content-desc']}']`)
  }
  return result
}

const filterNode = (value, data) => {
  if (!value) return true
  return data.label?.includes(value) || data.detail?.['resource-id']?.includes(value)
}

watch(filterText, (val) => { tree.value?.filter(val) })

// ==================== POCO ====================
const switchPocoType = (e) => {
  const portMap = {
    'UNITY_3D': '5001', 'UE4': '5001',
    'COCOS_2DX_JS': '5003', 'COCOS_CREATOR': '5003', 'EGRET': '5003',
    'COCOS_2DX_LUA': '15004', 'COCOS_2DX_C_PLUS_1': '18888'
  }
  pocoPort.value = portMap[e] || ''
}

const setPocoImgData = () => {
  let imageUrl
  if (oldBlob) {
    const blob = new Blob([oldBlob], { type: 'image/jpeg' })
    imageUrl = URL.createObjectURL(blob)
  } else {
    imageUrl = getVideoScreenshot()
  }
  pocoImgUrl.value = imageUrl
  const canvas = document.getElementById('debugPocoPic')
  const img = new Image()
  img.src = imageUrl
  img.onload = function() {
    if (canvas) {
      canvas.width = img.width
      canvas.height = img.height
    }
  }
  isShowPocoImg.value = true
}

const getPoco = (engine) => {
  setPocoImgData()
  pocoLoading.value = true
  sendWs({ type: 'debug', detail: 'poco', engine, port: pocoPort.value })
}

let pocoTreeId = 1
const setPocoTreeId = (data) => {
  for (const item of data) {
    item.id = pocoTreeId++
    if (item.children) setPocoTreeId(item.children)
  }
}

const transferPoco = (data, xpath) => {
  for (let i = 0; i < data.length; i++) {
    let tagCount = 0, siblingIndex = 0
    for (let j = 0; j < data.length; j++) {
      if (data[j].name === data[i].name) tagCount++
      if (i === j) siblingIndex = tagCount
    }
    const indexXpath = tagCount === 1 ? `${xpath}/${data[i].name}` : `${xpath}/${data[i].name}[${siblingIndex}]`
    data[i].payload.xpath = indexXpath
    if (data[i].payload.index === undefined && tagCount > 1) data[i].payload.index = siblingIndex
    if (data[i].children?.length) data[i].children = transferPoco(data[i].children, indexXpath)
  }
  return data
}

const setPocoData = (data) => {
  pocoTreeId = 1
  pocoData.value = transferPoco([data], '')
  setPocoTreeId(pocoData.value)
  currentPocoId.value = [1]
}

const handlePocoClick = (data) => {
  if (data) {
    pocoDetail.value = data.payload
    printPoco(data.payload)
  }
}

const printPoco = (data) => {
  const canvas = document.getElementById('debugPocoPic')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const eleStartX = data.pos[0] * imgWidth - (data.size[0] * imgWidth) / 2
  const eleStartY = data.pos[1] * imgHeight - (data.size[1] * imgHeight) / 2
  ctx.fillStyle = `rgba(${Math.random() * 255 | 0}, ${Math.random() * 255 | 0}, ${Math.random() * 255 | 0}, 0.6)`
  ctx.fillRect(
    eleStartX * (canvas.width / imgWidth),
    eleStartY * (canvas.height / imgHeight),
    data.size[0] * imgWidth * (canvas.width / imgWidth),
    data.size[1] * imgHeight * (canvas.height / imgHeight)
  )
}

const touchstartpoco = async (event) => {
  const debugPic = document.getElementById('debugPocoPic')
  if (!debugPic) return
  const rect = debugPic.getBoundingClientRect()
  const x = parseInt((event.clientX - rect.left) * (imgWidth / debugPic.clientWidth))
  const y = parseInt((event.clientY - rect.top) * (imgHeight / debugPic.clientHeight))
  await nextTick(() => {
    pocoTree.value?.setCurrentKey(findPocoMinSize(findPocoByPoint(pocoData.value, x, y)))
  })
  await handlePocoClick(pocoTree.value?.getCurrentNode())
}

const findPocoMinSize = (data) => {
  if (!data.length) return null
  let result = data[0]
  for (const item of data) {
    if (item.size < result.size) result = item
  }
  currentPocoId.value = [result.ele.id]
  return result.ele.id
}

const findPocoByPoint = (ele, x, y) => {
  const result = []
  for (const item of ele) {
    const eleStartX = item.payload.pos[0] * imgWidth - (item.payload.size[0] * imgWidth) / 2
    const eleStartY = item.payload.pos[1] * imgHeight - (item.payload.size[1] * imgHeight) / 2
    const eleEndX = item.payload.pos[0] * imgWidth + (item.payload.size[0] * imgWidth) / 2
    const eleEndY = item.payload.pos[1] * imgHeight + (item.payload.size[1] * imgHeight) / 2
    if (x >= eleStartX && x <= eleEndX && y >= eleStartY && y <= eleEndY) {
      result.push({ ele: item, size: (eleEndX - eleStartX) * (eleEndY - eleStartY) })
    }
    if (item.children) result.push(...findPocoByPoint(item.children, x, y))
  }
  return result
}

const findBestPoco = (detail) => {
  if (!detail) return []
  const result = []
  if (detail.text) result.push(`poco(text="${detail.text}")`)
  if (detail.name) result.push(`poco("${detail.name}")${detail.index ? `[${detail.index - 1}]` : ''}`)
  if (detail.name && detail.type) result.push(`poco(name="${detail.name}", type="${detail.type}")`)
  return result
}

// ==================== WebView ====================
const getWebViewForward = () => {
  webViewLoading.value = true
  sendWs({ type: 'forwardView' })
}

const tabWebView = (port, id, title) => {
  webViewTitle.value = title
  isWebView.value = false
  iframeUrl.value = `/chrome/devtools/inspector.html?ws=${agent.value.host}:${agent.value.port}/websockets/webView/${agent.value.secretKey}/${port}/${id}`
}

const switchIsWebView = () => { isWebView.value = true }

// ==================== 性能监控 ====================
const initPerfCharts = () => {
  if (cpuChart.value) {
    cpuChartInstance = echarts.init(cpuChart.value)
    cpuChartInstance.setOption({
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value', max: 100 },
      series: [{ type: 'line', data: [], smooth: true }]
    })
  }
  if (memChart.value) {
    memChartInstance = echarts.init(memChart.value)
    memChartInstance.setOption({
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [{ type: 'line', data: [], smooth: true }]
    })
  }
  if (fpsChart.value) {
    fpsChartInstance = echarts.init(fpsChart.value)
    fpsChartInstance.setOption({
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value', max: 60 },
      series: [{ type: 'line', data: [], smooth: true }]
    })
  }
  if (networkChart.value) {
    networkChartInstance = echarts.init(networkChart.value)
    networkChartInstance.setOption({
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [
        { name: '上传', type: 'line', data: [], smooth: true },
        { name: '下载', type: 'line', data: [], smooth: true }
      ]
    })
  }
}

const handlePerfData = (data) => {
  if (data.process?.cpuInfo) {
    perfData.value.cpu.push(data.process.cpuInfo)
    cpuChartInstance?.setOption({
      xAxis: { data: perfData.value.cpu.map((_, i) => i) },
      series: [{ data: perfData.value.cpu }]
    })
  }
  if (data.process?.memInfo) {
    perfData.value.mem.push(data.process.memInfo)
    memChartInstance?.setOption({
      xAxis: { data: perfData.value.mem.map((_, i) => i) },
      series: [{ data: perfData.value.mem }]
    })
  }
  if (data.process?.fpsInfo) {
    perfData.value.fps.push(data.process.fpsInfo)
    fpsChartInstance?.setOption({
      xAxis: { data: perfData.value.fps.map((_, i) => i) },
      series: [{ data: perfData.value.fps }]
    })
  }
}

const startPerfmon = () => {
  if (!perfBundleId.value) {
    ElMessage.warning('请选择要监控的应用')
    return
  }
  isPerfStart.value = true
  sendWs({ type: 'startPerfmon', bundleId: perfBundleId.value })
}

const stopPerfmon = () => {
  isPerfStart.value = false
  sendWs({ type: 'stopPerfmon' })
}

const clearPerfmon = () => {
  perfData.value = { cpu: [], mem: [], fps: [], network: [] }
  initPerfCharts()
}

// ==================== 音频 ====================
const playAudio = () => {
  if (audioPlayer) {
    ElMessage.warning('音频已连接')
    return
  }
  // TODO: 实现音频播放
  isConnectAudio.value = true
  ElMessage.success('音频已开启')
}

const destroyAudio = () => {
  isConnectAudio.value = false
  ElMessage.info('音频已关闭')
}

// ==================== Tab切换 ====================
const switchTabs = (e) => {
  if (e.props.name === 'apps' || e.props.name === 'perfmon') {
    if (!appList.value.length) refreshAppList()
  }
  if (e.props.name === 'webview') {
    if (!webViewListDetail.value.length) getWebViewForward()
  }
  if (e.props.name === 'perfmon') {
    nextTick(() => initPerfCharts())
  }
}

// ==================== 面板调整 ====================
let isResizing = false
const handleResizeStart = () => { isResizing = true }
const handleResizeMove = (e) => {
  if (isResizing) {
    const container = document.querySelector('.remote-content')
    if (container) {
      const rect = container.getBoundingClientRect()
      const percent = ((e.clientX - rect.left) / rect.width) * 100
      screenPanelWidth.value = Math.max(20, Math.min(70, percent))
    }
  }
}
const handleResizeEnd = () => { isResizing = false }

// ==================== 关闭 ====================
const handleClose = () => {
  ElMessageBox.confirm('确定要退出远程控制吗？', '确认退出', { type: 'warning' }).then(() => {
    close()
    window.close()
  }).catch(() => {})
}

const close = () => {
  scrcpyInstance?.close()
  scrcpyInstance = null
  websocket?.close()
  websocket = null
  terminalWebsocket?.close()
  terminalWebsocket = null
  if (tickerInterval) {
    clearInterval(tickerInterval)
    tickerInterval = null
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  initDevice()
  tickerInterval = setInterval(() => { ticker.value++ }, 1000)
  activeTime = Date.now()
  window.document.onmousedown = () => { idleCount.value = 0; activeTime = Date.now() }
  window.document.onmousemove = () => { idleCount.value = 0; activeTime = Date.now() }
})

onBeforeUnmount(() => {
  close()
})
</script>

<style scoped>
.remote-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.remote-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.device-name {
  font-weight: bold;
  font-size: 16px;
  color: #e6a23c;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.remote-content {
  flex: 1;
  display: flex;
  padding: 15px;
  overflow: hidden;
}

.screen-panel {
  transition: width 0.1s;
}

.screen-card {
  height: 100%;
  position: relative;
}

.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.screen-controls {
  display: flex;
  gap: 8px;
}

.screen-wrapper {
  position: relative;
  background: #303133;
  text-align: center;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.screen-video,
.screen-canvas {
  max-width: 100%;
  max-height: 60vh;
}

.input-box {
  position: absolute;
  border: none;
  background-color: transparent;
  outline: none;
  z-index: -1;
  width: 1px;
}

.physical-keys {
  text-align: center;
  margin-top: 15px;
}

.side-buttons {
  position: absolute;
  right: 5px;
  top: 60px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.resize-line {
  width: 6px;
  cursor: col-resize;
  background: #dcdfe6;
  margin: 0 5px;
  border-radius: 3px;
  transition: background 0.2s;
}

.resize-line:hover {
  background: #409eff;
}

.function-panel {
  flex: 1;
  overflow: auto;
  transition: width 0.1s;
}

#debugPic,
#debugPocoPic {
  width: 100%;
  height: auto;
}
</style>
