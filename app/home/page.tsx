'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WaterSceneLayout } from '@/app/_components/water-scene-layout'
import { supabase } from '@/lib/supabase'

const timelineItems = [
  '09:00',
  '11:00',
  '14:00',
  '17:00',
]

function SpinningCube() {
  return (
    <div className="timeline-cube" aria-hidden="true">
      <span className="timeline-cube-face timeline-cube-front" />
      <span className="timeline-cube-face timeline-cube-back" />
      <span className="timeline-cube-face timeline-cube-right" />
      <span className="timeline-cube-face timeline-cube-left" />
      <span className="timeline-cube-face timeline-cube-top" />
      <span className="timeline-cube-face timeline-cube-bottom" />
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/login')
        return
      }

      setIsCheckingSession(false)
    }

    void checkUser()
  }, [router])

  if (isCheckingSession) {
    return (
      <WaterSceneLayout>
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center text-sm text-white/60">
          正在进入工作台...
        </div>
      </WaterSceneLayout>
    )
  }

  return (
    <WaterSceneLayout>
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-12">
        <div className="text-center">
          <p className="mb-3 text-sm font-medium text-white/46">One Task</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            今天的时间轴
          </h1>
        </div>

        <div className="px-5 py-8 sm:px-8 sm:py-10">
          <div className="relative">
            <div className="grid grid-cols-4 gap-4">
              {timelineItems.map((item) => (
                <div
                  key={item}
                  className="relative flex flex-col items-center gap-4 text-center"
                >
                  <SpinningCube />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </WaterSceneLayout>
  )
}
