'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, useReducedMotion } from 'motion/react'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { LoginStage } from './_components/login-stage'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

type AuthMode = 'login' | 'register'

type AuthFormValues = {
  email: string
  password: string
  confirmPassword?: string
}

const createAuthSchema = (mode: AuthMode) =>
  z
    .object({
      email: z.string().trim().min(1, '请输入邮箱').email('请输入有效邮箱'),
      password: z.string().min(1, '请输入密码').min(6, '密码至少需要 6 位'),
      confirmPassword: z.string().optional(),
    })
    .superRefine((values, context) => {
      if (mode !== 'register') {
        return
      }

      if (!values.confirmPassword) {
        context.addIssue({
          code: 'custom',
          message: '请再次输入密码',
          path: ['confirmPassword'],
        })
        return
      }

      if (values.password !== values.confirmPassword) {
        context.addIssue({
          code: 'custom',
          message: '两次输入的密码不一致',
          path: ['confirmPassword'],
        })
      }
    })

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

const getAuthErrorMessage = (mode: AuthMode, message?: string) => {
  const normalizedMessage = message?.toLowerCase() ?? ''

  if (
    normalizedMessage.includes('invalid login credentials') ||
    normalizedMessage.includes('invalid credentials')
  ) {
    return '邮箱或密码不正确'
  }

  if (normalizedMessage.includes('already registered')) {
    return '这个邮箱已经注册过了'
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return '请先完成邮箱验证'
  }

  return mode === 'login' ? '登录失败，请稍后再试' : '注册失败，请稍后再试'
}

export default function LoginPage() {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const authSchema = useMemo(() => createAuthSchema(mode), [mode])
  const form = useForm<AuthFormValues>({
    defaultValues: {
      confirmPassword: '',
      email: '',
      password: '',
    },
    resolver: zodResolver(authSchema),
    shouldUnregister: true,
  })
  const { control, handleSubmit, reset } = form

  const copy = authCopy[mode]

  const handleAuth = async ({ email, password }: AuthFormValues) => {
    setLoading(true)

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
      toast.error(getAuthErrorMessage(mode, error.message))
      setLoading(false)
      return
    }

    if (mode === 'register') {
      setMode('login')
      reset({ confirmPassword: '', email, password: '' })
      toast.success('注册成功，请登录')
      setLoading(false)
      return
    }

    router.push('/home')
    setLoading(false)
  }

  const handleModeChange = () => {
    setMode((currentMode) => (currentMode === 'login' ? 'register' : 'login'))
    reset(
      { ...form.getValues(), confirmPassword: '' },
      { keepErrors: false, keepValues: true },
    )
  }

  return (
    <LoginStage mobileDescription={copy.description}>
      <Form {...form}>
        <form
          className="space-y-6"
          noValidate
          onSubmit={handleSubmit(handleAuth)}
        >
          <FormField
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>邮箱</FormLabel>
                <FormControl>
                  <Input
                    className={
                      fieldState.error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : undefined
                    }
                    placeholder="请输入"
                    type="email"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>密码</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      className={
                        fieldState.error
                          ? 'border-red-300 pr-12 focus:border-red-500 focus:ring-red-500/10'
                          : 'pr-12'
                      }
                      type={showPassword ? 'text' : 'password'}
                      placeholder="请输入"
                      autoComplete={
                        mode === 'login' ? 'current-password' : 'new-password'
                      }
                      {...field}
                    />
                  </FormControl>
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
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === 'register' ? (
            <FormField
              control={control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>确认密码</FormLabel>
                  <FormControl>
                    <Input
                      className={
                        fieldState.error
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                          : undefined
                      }
                      type={showPassword ? 'text' : 'password'}
                      placeholder="请输入"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <motion.div
            whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
          >
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? copy.loading : copy.submit}
            </Button>
          </motion.div>
        </form>
      </Form>

      <div className="mt-10 flex items-center justify-center gap-2 text-sm text-neutral-500">
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
