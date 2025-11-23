<template>
  <div class="main-container">
    <el-form ref="settingForm" label-position="left" :rules="rules" label-width="70px" label-suffix=":"
      :model="formData">
      <el-form-item label="座位号" prop="seatCode">
        <el-input v-model="formData.seatCode" placeholder="请确保已经维护座位在填入"></el-input>
      </el-form-item>
      <el-form-item label="apiKey" prop="apiKey">
        <el-input v-model="formData.apiKey" placeholder="由网站系统信息页面获取" type="password" show-password></el-input>
      </el-form-item>
      <el-form-item>
        <el-button round type="primary" icon="Link" :loading="linkLoading" @click="testConnection">测试链接</el-button>
        <el-button round type="success" icon="CircleCheckFilled" :loading="saveLoading"
          @click="saveConfig">保存配置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref, reactive, toRaw, useTemplateRef, onMounted } from 'vue'
const formData = reactive<{ seatCode: string | null, apiKey: string | null }>({ seatCode: null, apiKey: null })
const rules = reactive({
  seatCode: [
    { required: true, message: '请输入对应座位号', trigger: 'blur' }
  ],
  apiKey: [
    { required: true, message: '请输入apiKey', trigger: 'blur' }
  ]
})
const settingForm = useTemplateRef('settingForm')
const linkLoading = ref<boolean>(false)
const saveLoading = ref<boolean>(false)

const testConnection = async () => {
  const validate = await settingForm.value?.validate()
  if (!validate) return
  linkLoading.value = true

  const result = await window.api.testConnection(toRaw(formData))
  if (result.status) {
    ElMessage.success('测试成功')
  } else {
    ElMessage.error(result.message)
  }
  linkLoading.value = false
}

const saveConfig = async () => {
  const validate = await settingForm.value?.validate()
  if (!validate) return
  saveLoading.value = true

  const result = await window.api.saveConfig(toRaw(formData))
  if (result.status) {
    ElMessage.success('保存配置成功')
  } else {
    ElMessage.error(result.message)
  }
  saveLoading.value = false
}

const loadConfig = async () => {
  const result = await window.api.loadConfig()
  if (result.status) {
    Object.assign(formData, result.data)
  }
}

onMounted(() => {
  loadConfig()
})
</script>
<style scoped>
.main-container {
  margin: 15px;
}
</style>
