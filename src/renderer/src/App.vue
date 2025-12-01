<template>
  <div class="app-container">
    <el-container class="layout-container">
      <!-- 顶部导航栏 -->
      <el-header class="app-header">
        <div class="header-content">
          <div class="header-left">
            <div class="logo">
              <i class="icon-monitor"></i>
              <span class="app-title">SystemMonitor Pro</span>
            </div>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Refresh" circle @click="refreshData" title="刷新数据"></el-button>
          </div>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="app-main">
        <div class="dashboard-container">
          <!-- 状态卡片区域 -->
          <div class="status-cards">
            <el-card class="status-card host-card" shadow="hover">
              <div class="card-content">
                <div class="card-icon">
                  <i class="icon-server"></i>
                </div>
                <div class="card-info">
                  <h3>主机名称</h3>
                  <p>{{ systemInfo.hostname || '未知' }}</p>
                </div>
              </div>
            </el-card>

            <el-card class="status-card ip-card" shadow="hover">
              <div class="card-content">
                <div class="card-icon">
                  <i class="icon-globe"></i>
                </div>
                <div class="card-info">
                  <h3>IP 地址</h3>
                  <p>{{ systemInfo.ip || '未知' }}</p>
                </div>
              </div>
            </el-card>

            <el-card class="status-card mac-card" shadow="hover">
              <div class="card-content">
                <div class="card-icon">
                  <i class="icon-cpu"></i>
                </div>
                <div class="card-info">
                  <h3>MAC 地址</h3>
                  <p class="mac-address">{{ systemInfo.mac || '未知' }}</p>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 配置和详细信息区域 -->
          <div class="content-area">
            <!--配置面板 -->
            <el-card class="config-panel" shadow="never">
              <template #header>
                <div class="panel-header">
                  <i class="icon-settings"></i>
                  <span>服务器配置</span>
                </div>
              </template>

              <el-form :model="wsConfig" label-width="120px" class="config-form" label-suffix=":">
                <el-form-item label="服务器地址">
                  <el-input v-model="wsConfig.serverUrl" placeholder="请输入服务器地址" size="large" clearable>

                  </el-input>
                </el-form-item>

                <el-form-item label="Api Key">
                  <el-input v-model="wsConfig.apiKey" size="large" clearable placeholder="请输入 Api Key" type="password"
                    show-password>
                    class="port-input"></el-input>
                </el-form-item>

                <el-form-item class="action-buttons">
                  <el-button type="primary" size="large" @click="saveConfig" class="save-btn" :icon="Edit">
                    保存配置
                  </el-button>
                  <el-button size="large" @click="healthCheck" type="success" class="restart-btn" :icon="Check">
                    测试连接
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Check, Edit } from '@element-plus/icons-vue'

// 类型定义
interface SystemInfo {
  hostname: string
  ip: string
  mac: string
}

interface WSConfig {
  serverUrl: string
  apiKey: string
}

// 响应式数据
const wsConfig = ref<WSConfig>({ serverUrl: '', apiKey: '' })
const systemInfo = ref<SystemInfo>({ hostname: '', ip: '', mac: '' })

// 刷新数据
const refreshData = async () => {
  await loadInitialData()
  ElMessage.success('数据刷新成功')
}

// 保存配置
const saveConfig = async () => {
  try {
    const result = await window.api.saveConfig({ serverUrl: wsConfig.value.serverUrl, apiKey: wsConfig.value.apiKey })
    if (result.status) ElMessage.success('配置保存成功')
    else ElMessage.error(`配置保存失败: ${result.message}`)
  } catch (error) {
    ElMessage.error('保存配置失败')
  }
}

// 重启 WebSocket
const healthCheck = async () => {
  try {
    const result = await window.api.healthCheck({ serverUrl: wsConfig.value.serverUrl, apiKey: wsConfig.value.apiKey })
    if (result.status) {
      ElMessage.success('连接测试成功')
    } else {
      ElMessage.error(`${result.message}`)
    }
  } catch (error) {
    ElMessage.error(`连接测试失败: ${error}`)
  }
}

// 加载初始数据
const loadInitialData = async () => {
  try {
    const result = await window.api.loadConfig()
    if (result.status) {
      wsConfig.value = result.data.serverConfig
      systemInfo.value = result.data.systemInfo
    } else {
      ElMessage.error(`加载数据失败: ${result.message}`)
    }
  } catch (error) {
    ElMessage.error(`加载数据失败: ${error}`)
    console.error('加载数据失败:', error)
  }
}

// 组件挂载
onMounted(() => {
  loadInitialData()
})
</script>

<style scoped>
.app-container {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.layout-container {
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.app-header {
  background: linear-gradient(90deg, #409EFF 0%, #67C23A 100%);
  padding: 0 24px;
  border-bottom: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.header-left .logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

.icon-monitor {
  font-size: 24px;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-tag {
  font-weight: 500;
  padding: 8px 16px;
}

.app-main {
  padding: 24px;
  background: #f5f7fa;
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 状态卡片样式 */
.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.status-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
}

.status-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.host-card .card-icon {
  background: linear-gradient(135deg, #FF6B6B, #EE5A52);
}

.ip-card .card-icon {
  background: linear-gradient(135deg, #4ECDC4, #44A08D);
}

.mac-card .card-icon {
  background: linear-gradient(135deg, #45B7D1, #96C93D);
}

.card-info h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.card-info p {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.mac-address {
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

/* 内容区域 */
.content-area {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.config-panel {
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

:deep(.config-panel .el-card__header) {
  background: linear-gradient(90deg, #fafbfc, #f0f2f5);
  border-bottom: 1px solid #e4e7ed;
  padding: 16px 20px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.panel-header i {
  color: #409EFF;
}

.config-form {
  padding: 8px;
}

:deep(.config-form .el-form-item) {
  margin-bottom: 24px;
}

:deep(.config-form .el-input__wrapper) {
  border-radius: 8px;
}

:deep(.config-form .el-input-group__prepend) {
  background: #f5f7fa;
  border-right: 1px solid #dcdfe6;
  padding: 0 12px;
  margin-right: 5px;
  border-radius: 10px;
}

.port-input {
  width: 100%;
}

.action-buttons {
  margin-top: 32px;
}

.save-btn,
.restart-btn {
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 500;
}


/* 图标样式 */
.icon-monitor:before {
  content: "🖥️";
}

.icon-server:before {
  content: "🔗";
}

.icon-globe:before {
  content: "🌐";
}

.icon-cpu:before {
  content: "💻";
}

.icon-settings:before {
  content: "⚙️";
}

.icon-info:before {
  content: "ℹ️";
}

.icon-map-pin:before {
  content: "📍";
}

.icon-check:before {
  content: "✅";
}

.icon-close:before {
  content: "❌";
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-area {
    grid-template-columns: 1fr;
  }

  .status-cards {
    grid-template-columns: 1fr;
  }

  .app-header {
    padding: 0 16px;
  }

  .app-main {
    padding: 16px;
  }
}
</style>
