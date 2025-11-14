const { createApp, ref, onMounted, toRaw } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;

const { ipcRenderer } = require('electron');

const App = {
    setup() {
        // 响应式数据
        const configForm = ref({
            seatCode: '001',
            apiKey: ''
        });

        const loading = ref(false);
        const passwordVisible = ref(false);

        // 生命周期
        onMounted(async () => {
            await loadConfig();
        });

        // 方法
        const loadConfig = async () => {
            try {
                const config = await ipcRenderer.invoke('get-config');
                configForm.value = { ...config };
                ElMessage.success('配置加载完成');
            } catch (error) {
                ElMessage.error('配置加载失败: ' + error.message);
            }
        };

        const saveConfig = async () => {
            if (!configForm.value.seatCode || !configForm.value.apiKey) {
                ElMessage.error('请填写完整的配置信息');
                return;
            }

            try {
                await ipcRenderer.invoke('save-config', toRaw(configForm.value));
                ElMessage.success('配置保存成功!');
            } catch (error) {
                ElMessage.error('配置保存失败: ' + error.message);
            }
        };

        const testConnection = async () => {
            if (!configForm.value.seatCode || !configForm.value.apiKey) {
                ElMessage.error('请先填写座位号和API密钥');
                return;
            }

            loading.value = true;

            try {
                const result = await ipcRenderer.invoke('test-connection', toRaw(configForm.value));

                if (result.status === 200) {
                    ElMessage.success('连接测试成功! 服务器响应正常。');
                } else {
                    ElMessage.error(`连接测试失败: ${result.message}`);
                }
            } catch (error) {
                ElMessage.error('连接测试失败: ' + error.message);
            } finally {
                loading.value = false;
            }
        };

        const togglePasswordVisibility = () => {
            passwordVisible.value = !passwordVisible.value;
        };

        return {
            // 数据
            configForm,
            loading,
            passwordVisible,

            // 方法
            saveConfig,
            testConnection,
            togglePasswordVisibility
        };
    },

    template: `
    <div id="app" class="app-container">

      <!-- 主内容区 -->
      <el-main class="app-main">
        <div class="main-content">


            <div class="config-form">
              <el-form :model="configForm" label-width="100px">
                <el-form-item label="座位号:">
                  <el-input 
                    v-model="configForm.seatCode" 
                    placeholder="例如: 001"
                    clearable
                    style="width: 300px;"
                  >
                    <template #prefix>
                      <el-icon><Chair /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                
                <el-form-item label="API密钥:">
                  <el-input 
                    v-model="configForm.apiKey" 
                    :type="passwordVisible ? 'text' : 'password'"
                    placeholder="输入API密钥"
                    style="width: 400px;"
                  >
                    <template #prefix>
                      <el-icon><Key /></el-icon>
                    </template>
                    <template #suffix>
                      <el-icon 
                        class="password-toggle"
                        @click="togglePasswordVisibility"
                      >
                        <View v-if="passwordVisible" />
                        <Hide v-else />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item class="form-actions">
                  <el-button 
                    type="primary" 
                    :loading="loading"
                    @click="testConnection"
                    size="large"
                  >
                    <el-icon><Connection /></el-icon>
                    测试连接
                  </el-button>
                  <el-button 
                    type="success" 
                    @click="saveConfig"
                    size="large"
                  >
                    <el-icon><Check /></el-icon>
                    保存配置
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
        </div>
      </el-main>
    </div>
  `
};

// 创建并挂载应用
const app = createApp(App);

// 注册图标
const icons = [
    'Monitor', 'CircleCheck', 'Promotion', 'Setting', 'Chair', 'Key',
    'View', 'Hide', 'Connection', 'Check', 'InfoFilled', 'Clock'
];

icons.forEach(iconName => {
    app.component(iconName, ElementPlusIconsVue[iconName]);
});

// 使用 Element Plus
app.use(ElementPlus);

app.mount('#app');