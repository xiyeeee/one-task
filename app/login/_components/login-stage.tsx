'use client'

import { type ReactNode, useEffect, useRef } from 'react'
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
      height += wave(waterPosition, origin, age, 0.42, 0.02) * 0.12;
      height += wave(waterPosition, origin, age, 0.32, 0.04) * 0.052;
      height -= exp(-pow(distance(waterPosition, origin) / 0.075, 2.0)) * exp(-age * 8.0) * 0.052;
    }
  }

  for (int i = 0; i < 6; i++) {
    float hoverStartTime = uHoverRipples[i].z;
    float hoverAge = uTime - hoverStartTime;

    if (hoverAge > 0.0 && hoverAge < 1.3) {
      vec2 hoverOrigin = uHoverRipples[i].xy * 2.0 - 1.0;
      height += wave(waterPosition, hoverOrigin, hoverAge, 0.22, 0.018) * 0.018;
      height += wave(waterPosition, hoverOrigin, hoverAge, 0.16, 0.028) * 0.008;
    }
  }

  height += sin((waterPosition.x * 4.8 + waterPosition.y * 2.4) + uTime * 0.62) * 0.095;
  height += sin((waterPosition.x * -3.6 + waterPosition.y * 4.2) - uTime * 0.5) * 0.072;
  height += sin((waterPosition.x * 9.0 - waterPosition.y * 4.8) + uTime * 0.82) * 0.026;
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
  vec3 normal = normalize(vec3(-dFdx(vHeight) * 36.0, -dFdy(vHeight) * 36.0, 1.0));
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
  float highlight = ripple * 0.28 + ambient * 0.032 + centerGlow * 0.026 + diagonalLight * 0.085 + vHeight * 0.52 + shimmer * 0.046 + lambert * 0.07 + fresnel * 0.32 + specular * 0.42 + softSpecular * 0.07 + horizonBand * 0.03;
  float pit = depression * 0.055;

  vec3 deepGlass = vec3(0.006, 0.007, 0.009);
  vec3 smokeGlass = vec3(0.055, 0.065, 0.072);
  vec3 silver = vec3(0.92, 0.94, 0.95);
  vec3 color = mix(deepGlass, smokeGlass, centerGlow * 0.34 + refraction * 0.05);
  color += silver * highlight;
  color += vec3(0.08, 0.1, 0.11) * fresnel * 0.28;
  color -= vec3(pit);
  color = clamp(color, 0.0, 1.0);

  float vignette = smoothstep(1.35, 0.18, length(position));
  color *= 0.34 + vignette * 0.86;

  gl_FragColor = vec4(color, 1.0);
}
`

function WaterRippleBackground({
  shouldReduceMotion,
}: {
  shouldReduceMotion: boolean | null
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    })
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      10
    )
    const rippleData = Array.from(
      { length: maxRipples },
      () => new THREE.Vector3(-10, -10, -1000)
    )
    const hoverRippleData = Array.from(
      { length: maxHoverRipples },
      () => new THREE.Vector3(-10, -10, -1000)
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

    camera.position.set(0.22, -1.65, 2.55)
    camera.lookAt(0, 0.12, 0)
    mesh.rotation.x = -Math.PI * 0.26
    mesh.rotation.z = Math.PI * 0.035
    mesh.position.set(0.02, -0.18, 0)
    mesh.scale.set(1.35, 1.08, 1)
    scene.add(mesh)

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
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
          ripple?.startTime ?? -1000
        )
      }

      for (let index = 0; index < maxHoverRipples; index += 1) {
        const ripple = hoverRipples[index]
        hoverRippleData[index].set(
          ripple?.x ?? -10,
          ripple?.y ?? -10,
          ripple?.startTime ?? -1000
        )
      }

      renderer.render(scene, camera)

      if (!shouldReduceMotion) {
        animationFrame = window.requestAnimationFrame(render)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', createHoverRipple)
    animationFrame = window.requestAnimationFrame(render)

    return () => {
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
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[44vh] w-full"
      aria-hidden="true"
    />
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 px-4 py-8 text-neutral-950 sm:px-6">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-x-0 top-0 h-[64vh] bg-[radial-gradient(circle_at_28%_16%,rgba(255,255,255,0.12),transparent_28%),linear-gradient(180deg,#050505_0%,#090909_58%,#121212_100%)]" />
        <div className="absolute inset-x-[-12%] top-[18vh] h-52 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent blur-3xl" />
        <div className="absolute inset-x-0 top-[56vh] h-40 bg-gradient-to-b from-transparent via-white/[0.08] to-transparent blur-2xl" />
        <div className="absolute inset-x-0 top-[61vh] h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_52%,rgba(0,0,0,0.78)_100%)]" />
      </div>
      <WaterRippleBackground shouldReduceMotion={shouldReduceMotion} />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <motion.section
          className="grid w-full overflow-hidden rounded-[2rem] bg-transparent shadow-[0_28px_90px_rgba(0,0,0,0.46)] lg:grid-cols-[1fr_1.05fr]"
          initial={
            shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative hidden overflow-hidden bg-black p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.1),transparent_34%),radial-gradient(circle_at_88%_86%,rgba(255,255,255,0.08),transparent_30%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_42%,rgba(255,255,255,0.035))]" />
            <div className="relative max-w-sm">
              <div className="relative mb-10 inline-flex">
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
              <p className="mt-4 text-sm leading-6 text-white/52">
                用一个干净的工作台，开始管理你的下一项任务。
              </p>
            </div>
          </div>

          <div className="bg-white/[0.88] px-6 py-8 backdrop-blur-xl sm:px-10 sm:py-12">
            <div className="mx-auto w-full max-w-sm">
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
          </div>
        </motion.section>
      </div>
    </main>
  )
}
