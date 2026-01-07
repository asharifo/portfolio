import * as CANNON from 'cannon'
import * as THREE from 'three'

export default class Physics
{
  constructor({ scene, controls })
  {
    this.scene = scene
    this.controls = controls

    this.modelsContainer = new THREE.Object3D()

    this.setWorld()
    this.setFloor()
    this.setCar()

    this.controls.on('action', (name) =>
    {
      if(name === 'reset')
      {
        this.resetCar()
      }
    })
  }

  setWorld()
  {
    this.world = new CANNON.World()
    this.world.gravity.set(0, 0, -13)
    this.world.allowSleep = true
    this.world.defaultContactMaterial.friction = 0
    this.world.defaultContactMaterial.restitution = 0.2
  }

  setFloor()
  {
    this.floorBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane()
    })
    this.world.addBody(this.floorBody)

    const floorGeometry = new THREE.PlaneGeometry(200, 200, 1, 1)
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x222833 })
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
    floorMesh.rotation.set(0, 0, 0)
    this.modelsContainer.add(floorMesh)
  }

  setCar()
  {
    this.car = {
      steering: 0,
      accelerating: 0,
      options: {
        chassisWidth: 1.02,
        chassisHeight: 1.16,
        chassisDepth: 2.03,
        chassisOffset: new CANNON.Vec3(0, 0, 0.41),
        chassisMass: 40,
        wheelFrontOffsetDepth: 0.635,
        wheelBackOffsetDepth: -0.475,
        wheelOffsetWidth: 0.39,
        wheelRadius: 0.25,
        wheelHeight: 0.24,
        wheelSuspensionStiffness: 50,
        wheelSuspensionRestLength: 0.1,
        wheelFrictionSlip: 10,
        wheelDampingRelaxation: 1.8,
        wheelDampingCompression: 1.5,
        wheelMaxSuspensionForce: 100000,
        wheelRollInfluence: 0.01,
        wheelMaxSuspensionTravel: 0.3,
        wheelCustomSlidingRotationalSpeed: -30,
        wheelMass: 5,
        controlsSteeringSpeed: 0.015,
        controlsSteeringMax: Math.PI * 0.17,
        controlsAcceleratinMaxSpeed: 0.12,
        controlsAcceleratinMaxSpeedBoost: 0.24,
        controlsAcceleratingSpeed: 22,
        controlsAcceleratingSpeedBoost: 32,
        controlsBrakeStrength: 0.6
      }
    }

    this.createCar()
  }

  createCar()
  {
    const options = this.car.options
    this.car.chassisShape = new CANNON.Box(
      new CANNON.Vec3(options.chassisDepth * 0.5, options.chassisWidth * 0.5, options.chassisHeight * 0.5)
    )

    this.car.chassisBody = new CANNON.Body({ mass: options.chassisMass })
    this.car.chassisBody.allowSleep = false
    this.car.chassisBody.position.set(0, 0, 2)
    this.car.chassisBody.addShape(this.car.chassisShape, options.chassisOffset)
    this.car.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), -Math.PI * 0.5)
    this.world.addBody(this.car.chassisBody)

    this.car.vehicle = new CANNON.RaycastVehicle({
      chassisBody: this.car.chassisBody
    })

    this.car.wheelOptions = {
      radius: options.wheelRadius,
      suspensionStiffness: options.wheelSuspensionStiffness,
      suspensionRestLength: options.wheelSuspensionRestLength,
      frictionSlip: options.wheelFrictionSlip,
      dampingRelaxation: options.wheelDampingRelaxation,
      dampingCompression: options.wheelDampingCompression,
      maxSuspensionForce: options.wheelMaxSuspensionForce,
      rollInfluence: options.wheelRollInfluence,
      maxSuspensionTravel: options.wheelMaxSuspensionTravel,
      customSlidingRotationalSpeed: options.wheelCustomSlidingRotationalSpeed,
      useCustomSlidingRotationalSpeed: true,
      directionLocal: new CANNON.Vec3(0, 0, -1),
      axleLocal: new CANNON.Vec3(0, 1, 0),
      chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0)
    }

    const positions = [
      [options.wheelFrontOffsetDepth, options.wheelOffsetWidth],
      [options.wheelFrontOffsetDepth, -options.wheelOffsetWidth],
      [options.wheelBackOffsetDepth, options.wheelOffsetWidth],
      [options.wheelBackOffsetDepth, -options.wheelOffsetWidth]
    ]

    for(const [depth, width] of positions)
    {
      this.car.wheelOptions.chassisConnectionPointLocal.set(depth, width, 0)
      this.car.vehicle.addWheel(this.car.wheelOptions)
    }

    this.car.vehicle.addToWorld(this.world)

    this.car.wheelBodies = []
    for(const wheelInfo of this.car.vehicle.wheelInfos)
    {
      const shape = new CANNON.Cylinder(wheelInfo.radius, wheelInfo.radius, options.wheelHeight, 16)
      const body = new CANNON.Body({ mass: options.wheelMass })
      const quaternion = new CANNON.Quaternion()
      quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2)
      body.type = CANNON.Body.KINEMATIC
      body.addShape(shape, new CANNON.Vec3(), quaternion)
      this.car.wheelBodies.push(body)
    }

    const chassisGeometry = new THREE.BoxGeometry(options.chassisDepth, options.chassisWidth, options.chassisHeight)
    const chassisMaterial = new THREE.MeshStandardMaterial({ color: 0x6fe0ff })
    this.carMesh = new THREE.Mesh(chassisGeometry, chassisMaterial)
    this.modelsContainer.add(this.carMesh)

    const wheelGeometry = new THREE.CylinderGeometry(options.wheelRadius, options.wheelRadius, options.wheelHeight, 12)
    wheelGeometry.rotateZ(Math.PI / 2)
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1c1f25 })
    this.carWheelMeshes = []

    for(let i = 0; i < 4; i += 1)
    {
      const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial)
      this.carWheelMeshes.push(wheelMesh)
      this.modelsContainer.add(wheelMesh)
    }
  }

  resetCar()
  {
    this.car.chassisBody.position.set(0, 0, 2)
    this.car.chassisBody.velocity.set(0, 0, 0)
    this.car.chassisBody.angularVelocity.set(0, 0, 0)
    this.car.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), -Math.PI * 0.5)
  }

  updateControls(delta)
  {
    const options = this.car.options
    const steerStrength = delta * options.controlsSteeringSpeed

    if(this.controls.actions.right)
    {
      this.car.steering += steerStrength
    }
    else if(this.controls.actions.left)
    {
      this.car.steering -= steerStrength
    }
    else
    {
      if(Math.abs(this.car.steering) > steerStrength)
      {
        this.car.steering -= steerStrength * Math.sign(this.car.steering)
      }
      else
      {
        this.car.steering = 0
      }
    }

    if(Math.abs(this.car.steering) > options.controlsSteeringMax)
    {
      this.car.steering = Math.sign(this.car.steering) * options.controlsSteeringMax
    }

    const accelerationSpeed = this.controls.actions.boost
      ? options.controlsAcceleratingSpeedBoost
      : options.controlsAcceleratingSpeed
    const maxSpeed = this.controls.actions.boost
      ? options.controlsAcceleratinMaxSpeedBoost
      : options.controlsAcceleratinMaxSpeed
    const speed = this.car.chassisBody.velocity.length()

    if(this.controls.actions.up && speed < maxSpeed)
    {
      this.car.accelerating = accelerationSpeed
    }
    else if(this.controls.actions.down && speed < maxSpeed)
    {
      this.car.accelerating = -accelerationSpeed
    }
    else
    {
      this.car.accelerating = 0
    }

    this.car.vehicle.setSteeringValue(-this.car.steering, 0)
    this.car.vehicle.setSteeringValue(-this.car.steering, 1)
    this.car.vehicle.applyEngineForce(-this.car.accelerating, 2)
    this.car.vehicle.applyEngineForce(-this.car.accelerating, 3)

    const brakeStrength = this.controls.actions.brake ? options.controlsBrakeStrength : 0
    for(let i = 0; i < 4; i += 1)
    {
      this.car.vehicle.setBrake(brakeStrength, i)
    }
  }

  updateWheelMeshes()
  {
    const rightWheelRotation = new THREE.Quaternion()
    rightWheelRotation.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI)

    for(let i = 0; i < this.car.vehicle.wheelInfos.length; i += 1)
    {
      this.car.vehicle.updateWheelTransform(i)
      const transform = this.car.vehicle.wheelInfos[i].worldTransform
      const wheelBody = this.car.wheelBodies[i]
      wheelBody.position.copy(transform.position)
      wheelBody.quaternion.copy(transform.quaternion)

      const wheelMesh = this.carWheelMeshes[i]
      wheelMesh.position.copy(wheelBody.position)
      wheelMesh.quaternion.copy(wheelBody.quaternion)

      if(i === 1 || i === 3)
      {
        wheelMesh.quaternion.multiply(rightWheelRotation)
      }
    }
  }

  update(delta)
  {
    this.updateControls(delta)
    this.world.step(1 / 60, delta, 3)

    this.carMesh.position.copy(this.car.chassisBody.position)
    this.carMesh.quaternion.copy(this.car.chassisBody.quaternion)
    this.carMesh.position.add(this.car.options.chassisOffset)

    this.updateWheelMeshes()
  }
}