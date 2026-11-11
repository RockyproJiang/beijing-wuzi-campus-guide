<template>
  <div class="a-login">
    <form class="a-login-card" @submit.prevent="submit">
      <div class="a-login-brand">
        <div class="a-login-icon"><i class="fa-solid fa-graduation-cap"></i></div>
        <h1>校园指南 · 管理后台</h1>
        <p>ADMIN CONSOLE</p>
      </div>

      <div v-if="error" class="a-login-error">{{ error }}</div>

      <div class="a-grid" style="gap:13px;">
        <label class="a-field">
          <span class="a-label">管理员账号</span>
          <input
            v-model="form.username"
            class="a-input"
            type="text"
            autocomplete="username"
            placeholder="请输入账号"
            autofocus
          />
        </label>
        <label class="a-field">
          <span class="a-label">密码</span>
          <input
            v-model="form.password"
            class="a-input"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
          />
        </label>
      </div>

      <button class="a-btn a-btn-primary" type="submit" style="width:100%;margin-top:18px;padding:11px;" :disabled="loading">
        <i class="fa-solid fa-right-to-bracket"></i>
        {{ loading ? '正在登录…' : '进入后台' }}
      </button>

      <div class="a-login-foot">
        <i class="fa-solid fa-shield-halved"></i>
        仅限管理员使用，所有修改会记录操作日志
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { api } from './api.js'

const emit = defineEmits(['success'])
const form = reactive({ username: 'admin', password: '' })
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (!form.username.trim() || !form.password) {
    error.value = '请输入账号和密码'
    return
  }
  loading.value = true
  try {
    const result = await api('/login', { method: 'POST', body: form })
    emit('success', result.admin)
  } catch (e) {
    error.value = e.message || '登录失败'
    form.password = ''
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.a-login-foot {
  margin-top: 18px;
  text-align: center;
  font-size: 10.5px;
  color: var(--a-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.a-login-foot i { color: var(--a-primary-light); }
.a-login-card .a-input { padding: 10px 12px; font-size: 13px; }
</style>
