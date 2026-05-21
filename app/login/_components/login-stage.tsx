'use client'

import { type ReactNode, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { WaterSceneLayout } from '@/app/_components/water-scene-layout'

export function LoginStage({
  children,
  mobileDescription,
}: {
  children: ReactNode
  mobileDescription: string
}) {
  const shouldReduceMotion = useReducedMotion()
  const [isCardHovered, setIsCardHovered] = useState(false)
  const [isCardFocused, setIsCardFocused] = useState(false)
  const isAssembled = shouldReduceMotion || isCardHovered || isCardFocused

  return (
    <WaterSceneLayout>
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <motion.section
          className="relative grid w-full overflow-visible bg-transparent lg:grid-cols-[1fr_1.05fr]"
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsCardFocused(false)
            }
          }}
          onFocusCapture={() => setIsCardFocused(true)}
          onHoverEnd={() => setIsCardHovered(false)}
          onHoverStart={() => setIsCardHovered(true)}
          initial={
            shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 flex min-h-[320px] items-center justify-center lg:min-h-[420px]"
            animate={
              isAssembled
                ? { opacity: 0, scale: 0.92, y: -26 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.p
              className="bg-[linear-gradient(110deg,#ffffff_0%,#f4f4f4_38%,#ffffff_58%,#c7c7c7_100%)] bg-[length:220%_100%] bg-clip-text text-6xl font-semibold tracking-tight text-transparent drop-shadow-[0_0_26px_rgba(255,255,255,0.16)] sm:text-7xl"
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }
              }
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              One Task
            </motion.p>
          </motion.div>

          <motion.div
            className="relative hidden min-h-[420px] overflow-hidden rounded-l-[2rem] bg-black px-10 py-10 text-white shadow-[0_28px_90px_rgba(0,0,0,0.46)] lg:flex lg:flex-col lg:justify-start"
            animate={
              isAssembled
                ? { opacity: 1, x: 0, y: 0, rotate: 0 }
                : { opacity: 0, x: -28, y: 16, rotate: -2.4 }
            }
            transition={{
              type: 'spring',
              stiffness: 82,
              damping: 20,
              mass: 1.08,
              delay: isAssembled ? 0.28 : 0,
            }}
            style={{
              clipPath:
                'polygon(0 0, 100% 0, 96% 18%, 100% 36%, 95% 54%, 100% 72%, 96% 100%, 0 100%)',
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.1),transparent_34%),radial-gradient(circle_at_88%_86%,rgba(255,255,255,0.08),transparent_30%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_42%,rgba(255,255,255,0.035))]" />
            <div className="relative mt-2 max-w-sm">
              <div className="relative mb-14 inline-flex">
                <motion.div
                  className="absolute -inset-x-5 -inset-y-3 rounded-[2rem] blur-xl"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.16), rgba(255,255,255,0.02))',
                  }}
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : {
                          x: [-10, 10, -10],
                          opacity: [0.18, 0.38, 0.18],
                        }
                  }
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <motion.p
                  className="relative bg-[linear-gradient(110deg,#ffffff_0%,#a3a3a3_34%,#ffffff_52%,#737373_72%,#ffffff_100%)] bg-[length:220%_100%] bg-clip-text text-5xl font-semibold tracking-tight text-transparent"
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : {
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }
                  }
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  One Task
                </motion.p>
              </div>

              <div className="relative">
                <motion.div
                  className="absolute -inset-x-10 -inset-y-6 rounded-[2rem] bg-gradient-to-r from-transparent via-white/18 to-transparent blur-2xl"
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : {
                          x: [-18, 18, -18],
                          opacity: [0.18, 0.5, 0.18],
                        }
                  }
                  transition={{
                    duration: 5.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <p className="relative bg-[linear-gradient(110deg,#ffffff_0%,#d4d4d4_44%,#ffffff_58%,#a3a3a3_100%)] bg-clip-text text-4xl font-semibold leading-tight tracking-tight text-transparent">
                  把注意力留给真正重要的一件事。
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative z-10 min-h-[420px] overflow-hidden rounded-[2rem] bg-white/[0.96] px-6 py-7 shadow-[0_28px_90px_rgba(0,0,0,0.38)] sm:px-9 sm:py-9 lg:rounded-l-none lg:rounded-r-[2rem]"
            animate={
              isAssembled
                ? { opacity: 1, x: 0, y: 0, rotate: 0 }
                : { opacity: 0, x: 28, y: -16, rotate: 0 }
            }
            transition={{
              type: 'spring',
              stiffness: 78,
              damping: 21,
              mass: 1.12,
              delay: isAssembled ? 0.36 : 0,
            }}
            style={{
              clipPath:
                'polygon(4% 0, 100% 0, 100% 100%, 0 100%, 5% 78%, 0 60%, 4% 42%, 0 22%)',
            }}
          >
            <div className="mx-auto flex h-full w-full max-w-sm flex-col justify-center">
              <div className="mb-8 lg:hidden">
                <p className="mb-3 text-sm font-medium text-neutral-500">
                  One Task
                </p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mobileDescription}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      shouldReduceMotion ? undefined : { opacity: 0, y: -8 }
                    }
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  >
                    <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
                      One Task
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-neutral-500">
                      {mobileDescription}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {children}
            </div>
          </motion.div>
        </motion.section>
      </div>
    </WaterSceneLayout>
  )
}
