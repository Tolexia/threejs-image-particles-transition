import React, { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import particlesVertexShader from './shaders/particles/vertex.ts'
import particlesFragmentShader from './shaders/particles/fragment.ts'
import gsap from 'gsap'
import '../assets/Particlescene.css'

const Particlescene: React.FC = () => {

  return (
      <Canvas className='cnv'>
        <CameraAndControls />
        <Particles />
      </Canvas>
  )
}

const CameraAndControls: React.FC = () => {
    return (
      <>
        <PerspectiveCamera makeDefault position={[0, 0, 18]} fov={35} />
      </>
    )
  }

  
  const Particles: React.FC = () => {
    const particleSize  =  0.15
    const geometry = new THREE.PlaneGeometry(10, 10, 256, 256)
    geometry.deleteAttribute('normal')
    
    const materialRef = useRef<THREE.ShaderMaterial>(null)
  
    const { size, viewport } = useThree()
    const particlesRef = useRef(null)


    const clock = new THREE.Clock()

    useFrame(() => {
      if (materialRef.current) {
        const elapsedTime = clock.getElapsedTime()
        materialRef.current.uniforms.uTime.value = elapsedTime
      }
    })
  

    const indexTexture = useRef(0)

    const textures = [
      new THREE.TextureLoader().load('./tolexia_v2-nobg.png'),
      new THREE.TextureLoader().load('./webdeveloper_text.png'),
    //   new THREE.TextureLoader().load('./threejs.png'),
    ]

    const morphTextures = (init: boolean) => {
        if (materialRef.current) 
        {
            if(init) {
                gsap.fromTo(
                    materialRef.current.uniforms.uProgress,
                    { value: 0 },
                    { value: 1, duration: 3, ease: 'linear' }
                )
            }
            else{
                gsap.fromTo(
                    materialRef.current.uniforms.uProgress,
                    { value: 1 },
                    { 
                        value: 0, 
                        duration: 3, 
                        ease: 'linear', 
                        onComplete: () => {
                            if (materialRef.current) {
                                indexTexture.current = (indexTexture.current + 1) % textures.length
                                materialRef.current.uniforms.uPictureTexture.value = textures[indexTexture.current]
                                gsap.fromTo(
                                    materialRef.current.uniforms.uProgress,
                                    { value: 0 },
                                    { value: 1, duration: 3, ease: 'linear' }
                                )
                            }
                        }
                    }
                )
            }
        }
        return indexTexture.current
    }
    

    useEffect(() => {
        let interval = 0
        const timeout = setTimeout(() => {
            indexTexture.current = morphTextures(true)
            setTimeout(() => {
                morphTextures(false)
                interval = setInterval(() => {
                    indexTexture.current = morphTextures(false)
                }, 11000);
            }, 5000)
        }, 10)
        return () => {
            clearTimeout(timeout)
            clearInterval(interval)
        }
    }, [])

    const uniforms ={
        uResolution: { value: new THREE.Vector2(size.width * viewport.initialDpr,  size.height * viewport.initialDpr) },
        uPictureTexture: { value: textures[0] },
        uParticleSize: { value: particleSize },
        uProgress: { value: 0 },
        uTime: { value: 0 },
    }
    return (
      <points geometry={geometry} ref={particlesRef}>
        <shaderMaterial 
          ref={materialRef}
          vertexShader={particlesVertexShader}
          fragmentShader={particlesFragmentShader}
          uniforms={uniforms}
        />
      </points>
    )
  }


export default Particlescene