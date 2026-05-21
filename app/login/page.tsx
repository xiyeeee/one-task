'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Eye, EyeOff } from 'lucide-react'
import { LoginStage } from './_components/login-stage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

type AuthMode = 'login' | 'register'

const authCopy = {
  login: {
    description: '登录 One Task，继续处理今天最重要的一件事。',
    submit: '登录',
    loading: '正在登录...',
    switchText: '还没有账号？',
    switchAction: '立即注册',
  },
  register: {
    description: '用一个干净的工作台，开始管理你的下一项任务。',
    submit: '注册',
    loading: '正在注册...',
    switchText: '已经有账号？',
    switchAction: '返回登录',
  },
}

export default function LoginPage() {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const copy = authCopy[mode]

  const validateForm = () => {
    if (!email.trim()) {
      return '请输入邮箱'
    }

    if (!password) {
      return '请输入密码'
    }

    if (password.length < 6) {
      return '密码至少需要 6 位'
    }

    return ''
  }

  const handleAuth = async () => {
    const validationMessage = validateForm()

    if (validationMessage) {
      setMessage('')
      setErrorMessage(validationMessage)
      return
    }

    setLoading(true)
    setMessage('')
    setErrorMessage('')

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({
            email,
            password,
          })
        : await supabase.auth.signUp({
            email,
            password,
          })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    if (mode === 'register') {
      setMode('login')
      setPassword('')
      setMessage('注册成功，请登录')
      setLoading(false)
      return
    }

    router.push('/')
    setLoading(false)
  }

  const handleModeChange = () => {
    setMode((currentMode) => (currentMode === 'login' ? 'register' : 'login'))
    setMessage('')
    setErrorMessage('')
  }

  return (
    <LoginStage mobileDescription={copy.description}>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          void handleAuth()
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <div className="relative">
            <Input
              id="password"
              className="pr-12"
              type={showPassword ? 'text' : 'password'}
              placeholder="至少 6 位密码"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
            />
            <Button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" />
              ) : (
                <Eye aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {errorMessage ? (
            <motion.p
              key="error"
              className="rounded-xl border border-neutral-300 bg-white/[0.72] px-4 py-3 text-sm text-neutral-800"
              role="alert"
              initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {errorMessage}
            </motion.p>
          ) : null}

          {message ? (
            <motion.p
              key="message"
              className="rounded-xl border border-neutral-200 bg-white/[0.72] px-4 py-3 text-sm text-neutral-600 shadow-sm"
              aria-live="polite"
              initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {message}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? copy.loading : copy.submit}
          </Button>
        </motion.div>
      </form>

      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-neutral-500">
        <span>{copy.switchText}</span>
        <Button
          className="h-auto px-0 py-0 font-medium"
          variant="link"
          size="sm"
          type="button"
          onClick={handleModeChange}
          disabled={loading}
        >
          {copy.switchAction}
        </Button>
      </div>
    </LoginStage>
  )
}
