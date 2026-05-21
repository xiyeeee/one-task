'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import * as THREE from 'three'

const maxRipples = 8
const maxHoverRipples = 6

const vertexShaderSource = `
uniform float uTime;
uniform vec3 uRipples[8];
uniform vec3 uHoverRipples[6];

varying vec2 vUv;
varying float vHeight;
varying vec3 vWorldPosition;

float wave(vec2 position, vec2 origin, float age, float speed, float width) {
  float distanceToOrigin = distance(position, origin);
  float waveFront = age * speed;
  float ring = exp(-pow((distanceToOrigin - waveFront) / width, 2.0));
  float localFade = 1.0 - smoothstep(0.24, 0.42, distanceToOrigin);
  return ring * exp(-age * 1.15) * localFade;
}

void main() {
  vUv = uv;
  vec2 waterPosition = uv * 2.0 - 1.0;
  float height = 0.0;

  for (int i = 0; i < 8; i++) {
    float startTime = uRipples[i].z;
    float age = uTime - startTime;

    if (age > 0.0 && age < 3.2) {
      vec2 origin = uRipples[i].xy * 2.0 - 1.0;
      height += wave(waterPosition, origin, age, 0.42, 0.02) * 0.24;
      height += wave(waterPosition, origin, age, 0.32, 0.04) * 0.104;
      height -= exp(-pow(distance(waterPosition, origin) / 0.075, 2.0)) * exp(-age * 8.0) * 0.104;
    }
  }

  for (int i = 0; i < 6; i++) {
    float hoverStartTime = uHoverRipples[i].z;
    float hoverAge = uTime - hoverStartTime;

    if (hoverAge > 0.0 && hoverAge < 1.3) {
      vec2 hoverOrigin = uHoverRipples[i].xy * 2.0 - 1.0;
      height += wave(waterPosition, hoverOrigin, hoverAge, 0.22, 0.018) * 0.036;
      height += wave(waterPosition, hoverOrigin, hoverAge, 0.16, 0.028) * 0.016;
    }
  }

  height += sin((waterPosition.x * 4.8 + waterPosition.y * 2.4) + uTime * 0.62) * 0.19;
  height += sin((waterPosition.x * -3.6 + waterPosition.y * 4.2) - uTime * 0.5) * 0.144;
  height += sin((waterPosition.x * 9.0 - waterPosition.y * 4.8) + uTime * 0.82) * 0.052;
  vHeight = height;
  vec3 displacedPosition = vec3(position.xy, height);
  vWorldPosition = (modelMatrix * vec4(displacedPosition, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
`

const fragmentShaderSource = `
precision highp float;

uniform float uTime;
uniform vec3 uRipples[8];
uniform vec3 uHoverRipples[6];

varying vec2 vUv;
varying float vHeight;
varying vec3 vWorldPosition;

float wave(vec2 position, vec2 origin, float age, float speed, float width) {
  float distanceToOrigin = distance(position, origin);
  float waveFront = age * speed;
  float ring = exp(-pow((distanceToOrigin - waveFront) / width, 2.0));
  float localFade = 1.0 - smoothstep(0.24, 0.42, distanceToOrigin);
  return ring * exp(-age * 1.15) * localFade;
}

void main() {
  vec2 uv = vUv;
  vec2 position = uv * 2.0 - 1.0;

  float ripple = 0.0;
  float depression = 0.0;

  for (int i = 0; i < 8; i++) {
    float startTime = uRipples[i].z;
    float age = uTime - startTime;

    if (age > 0.0 && age < 3.2) {
      vec2 origin = uRipples[i].xy * 2.0 - 1.0;

      ripple += wave(position, origin, age, 0.42, 0.02);
      ripple += wave(position, origin, age, 0.32, 0.04) * 0.42;
      depression += exp(-pow(distance(position, origin) / 0.075, 2.0)) * exp(-age * 8.0);
    }
  }

  for (int i = 0; i < 6; i++) {
    float hoverStartTime = uHoverRipples[i].z;
    float hoverAge = uTime - hoverStartTime;

    if (hoverAge > 0.0 && hoverAge < 1.3) {
      vec2 hoverOrigin = uHoverRipples[i].xy * 2.0 - 1.0;
      ripple += wave(position, hoverOrigin, hoverAge, 0.22, 0.018) * 0.18;
      ripple += wave(position, hoverOrigin, hoverAge, 0.16, 0.028) * 0.1;
    }
  }

  float ambient =
    sin((position.x * 2.4 + position.y * 1.2) * 2.2 + uTime * 0.24) * 0.5 +
    sin((position.x * -1.8 + position.y * 2.8) * 1.6 - uTime * 0.18) * 0.5;

  float centerGlow = 1.0 - smoothstep(0.05, 1.32, length(position));
  float diagonalLight = smoothstep(-0.55, 0.55, position.x - position.y) * (1.0 - smoothstep(0.35, 1.35, length(position)));
  vec3 normal = normalize(vec3(-dFdx(vHeight) * 46.0, -dFdy(vHeight) * 46.0, 1.0));
  vec3 lightDirection = normalize(vec3(-0.35, 0.55, 0.95));
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float lambert = max(dot(normal, lightDirection), 0.0);
  float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 1.65);
  float specular = pow(max(dot(reflect(-lightDirection, normal), viewDirection), 0.0), 54.0);
  float softSpecular = pow(max(dot(reflect(-lightDirection, normal), viewDirection), 0.0), 10.0);
  float causticA = pow(abs(sin((position.x * 10.0 + position.y * 5.8) + vHeight * 42.0 + uTime * 0.72)), 14.0);
  float causticB = pow(abs(sin((position.x * -7.4 + position.y * 9.2) - vHeight * 34.0 - uTime * 0.48)), 16.0);
  float shimmerMask = smoothstep(-0.55, 0.9, position.y) * (1.0 - smoothstep(1.0, 1.5, length(position)));
  float shimmer = (causticA * 0.6 + causticB * 0.4) * shimmerMask;
  float horizonBand = exp(-pow((position.y - 0.08) / 0.22, 2.0));
  float refraction = sin((position.x + vHeight * 5.0) * 8.0 + uTime * 0.32) * 0.5 + 0.5;
  float highlight = ripple * 0.36 + ambient * 0.032 + centerGlow * 0.026 + diagonalLight * 0.1 + vHeight * 0.7 + shimmer * 0.06 + lambert * 0.085 + fresnel * 0.36 + specular * 0.5 + softSpecular * 0.085 + horizonBand * 0.03;
  float pit = depression * 0.09;

  vec3 deepGlass = vec3(0.002, 0.0025, 0.003);
  vec3 smokeGlass = vec3(0.03, 0.034, 0.038);
  vec3 silver = vec3(0.86, 0.88, 0.88);
  vec3 color = mix(deepGlass, smokeGlass, centerGlow * 0.34 + refraction * 0.05);
  color += silver * highlight * 0.72;
  color += vec3(0.08, 0.09, 0.1) * fresnel * 0.18;
  color -= vec3(pit);
  color = clamp(color, 0.0, 1.0);

  float vignette = smoothstep(1.35, 0.18, length(position));
  color *= 0.2 + vignette * 0.72;

  gl_FragColor = vec4(color, 1.0);
}
`

function WaterRippleBackground({
  shouldReduceMotion,
}: {
  shouldReduceMotion: boolean | null
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      34,
      window.innerWidth / window.innerHeight,
      0.1,
      18,
    )
    const rippleData = Array.from(
      { length: maxRipples },
      () => new THREE.Vector3(-10, -10, -1000),
    )
    const hoverRippleData = Array.from(
      { length: maxHoverRipples },
      () => new THREE.Vector3(-10, -10, -1000),
    )
    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShaderSource,
      fragmentShader: fragmentShaderSource,
      uniforms: {
        uTime: { value: 0 },
        uRipples: { value: rippleData },
        uHoverRipples: { value: hoverRippleData },
      },
      extensions: {
        derivatives: true,
      },
      depthWrite: false,
      depthTest: false,
    })
    const geometry = new THREE.PlaneGeometry(10, 7, 220, 160)
    const mesh = new THREE.Mesh(geometry, material)
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const ripples: Array<{ x: number; y: number; startTime: number }> = []
    const hoverRipples: Array<{ x: number; y: number; startTime: number }> = []
    const startTime = performance.now()
    let lastHoverRippleTime = 0
    let animationFrame = 0
    let didRenderFirstFrame = false
    let isMounted = true

    camera.position.set(0, -4.35, 5.65)
    camera.lookAt(0, 0, 0)
    mesh.rotation.x = -Math.PI * 0.26
    mesh.rotation.z = 0
    mesh.position.set(0, -0.44, 0)
    mesh.scale.set(1.74, 1.18, 1)
    scene.add(mesh)

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5)
      const rect = canvas.getBoundingClientRect()

      renderer.setPixelRatio(pixelRatio)
      renderer.setSize(rect.width, rect.height, false)
      camera.aspect = rect.width / rect.height
      camera.updateProjectionMatrix()
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (shouldReduceMotion) {
        return
      }

      const rect = canvas.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      raycaster.setFromCamera(pointer, camera)

      const intersection = raycaster.intersectObject(mesh)[0]

      if (!intersection?.uv) {
        return
      }

      ripples.push({
        x: intersection.uv.x,
        y: intersection.uv.y,
        startTime: (performance.now() - startTime) / 1000,
      })

      if (ripples.length > maxRipples) {
        ripples.shift()
      }
    }

    const createHoverRipple = (event: PointerEvent) => {
      if (shouldReduceMotion) {
        return
      }

      const currentTime = (performance.now() - startTime) / 1000

      if (currentTime - lastHoverRippleTime < 0.12) {
        return
      }

      const rect = canvas.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      raycaster.setFromCamera(pointer, camera)

      const intersection = raycaster.intersectObject(mesh)[0]

      if (!intersection?.uv) {
        return
      }

      lastHoverRippleTime = currentTime
      hoverRipples.push({
        x: intersection.uv.x,
        y: intersection.uv.y,
        startTime: currentTime,
      })

      if (hoverRipples.length > maxHoverRipples) {
        hoverRipples.shift()
      }
    }

    const render = () => {
      const currentTime = shouldReduceMotion
        ? 0
        : (performance.now() - startTime) / 1000

      material.uniforms.uTime.value = currentTime

      for (let index = 0; index < maxRipples; index += 1) {
        const ripple = ripples[index]
        rippleData[index].set(
          ripple?.x ?? -10,
          ripple?.y ?? -10,
          ripple?.startTime ?? -1000,
        )
      }

      for (let index = 0; index < maxHoverRipples; index += 1) {
        const ripple = hoverRipples[index]
        hoverRippleData[index].set(
          ripple?.x ?? -10,
          ripple?.y ?? -10,
          ripple?.startTime ?? -1000,
        )
      }

      renderer.render(scene, camera)

      if (!didRenderFirstFrame) {
        didRenderFirstFrame = true

        if (isMounted) {
          setIsReady(true)
        }
      }

      if (!shouldReduceMotion) {
        animationFrame = window.requestAnimationFrame(render)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', createHoverRipple)
    render()

    return () => {
      isMounted = false
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', createHoverRipple)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [shouldReduceMotion])

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-[-4vh] z-0 h-[38vh] w-full"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full bg-transparent transition-opacity duration-300 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 18%, black 100%)',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 18%, black 100%)',
        }}
      />
    </div>
  )
}

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
    <main
      className="relative min-h-screen overflow-hidden bg-neutral-950 px-4 py-8 text-neutral-950 sm:px-6"
      style={{ backgroundColor: '#050505' }}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-x-0 top-0 h-[64vh]" />
        <div className="absolute inset-x-[-12%] top-[18vh] h-40 bg-gradient-to-r from-transparent via-white/[0.035] to-transparent blur-3xl" />
        <div className="absolute inset-x-0 top-[58vh] h-28 bg-gradient-to-b from-transparent via-white/[0.035] to-transparent blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.12)_52%,rgba(0,0,0,0.82)_100%)]" />
      </div>
      <WaterRippleBackground shouldReduceMotion={shouldReduceMotion} />

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
    </main>
  )
}
