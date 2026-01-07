import './style.css'
import * as THREE from 'three'
import Controls from './controls.js'
import Physics from './physics.js'

THREE.Object3D.DEFAULT_UP.set(0, 0, 1)

const canvas = document.getElementById('experience-canvas')

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0b0f1a)

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200)
camera.up.set(0, 0, 1)
camera.position.set(6, -10, 6)
camera.lookAt(0, 0, 1)
scene.add(camera)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9)
directionalLight.position.set(5, -6, 8)
scene.add(directionalLight)

const controls = new Controls()
const physics = new Physics({ scene, controls })

scene.add(physics.modelsContainer)

const resize = () =>
{
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

window.addEventListener('resize', resize)

let lastTime = performance.now()
const tick = () =>
{
  const now = performance.now()
  const delta = Math.min((now - lastTime) / 1000, 0.033)
  lastTime = now

  physics.update(delta)

  camera.position.lerp(
    new THREE.Vector3(
      physics.carMesh.position.x + 6,
      physics.carMesh.position.y - 10,
      physics.carMesh.position.z + 6
    ),
    0.08
  )
  camera.lookAt(physics.carMesh.position)

  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}

tick()