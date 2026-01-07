export default class Controls
{
  constructor()
  {
    this.actions = {
      up: false,
      right: false,
      down: false,
      left: false,
      brake: false,
      boost: false
    }

    this.listeners = {}
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)

    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }

  on(eventName, callback)
  {
    if(!this.listeners[eventName])
    {
      this.listeners[eventName] = new Set()
    }

    this.listeners[eventName].add(callback)
  }

  emit(eventName, payload)
  {
    if(!this.listeners[eventName])
    {
      return
    }

    for(const callback of this.listeners[eventName])
    {
      callback(payload)
    }
  }

  handleKeyDown(event)
  {
    switch(event.code)
    {
      case 'ArrowUp':
      case 'KeyW':
        this.actions.up = true
        break
      case 'ArrowRight':
      case 'KeyD':
        this.actions.right = true
        break
      case 'ArrowDown':
      case 'KeyS':
        this.actions.down = true
        break
      case 'ArrowLeft':
      case 'KeyA':
        this.actions.left = true
        break
      case 'Space':
        this.actions.brake = true
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.actions.boost = true
        break
      default:
        break
    }
  }

  handleKeyUp(event)
  {
    switch(event.code)
    {
      case 'ArrowUp':
      case 'KeyW':
        this.actions.up = false
        break
      case 'ArrowRight':
      case 'KeyD':
        this.actions.right = false
        break
      case 'ArrowDown':
      case 'KeyS':
        this.actions.down = false
        break
      case 'ArrowLeft':
      case 'KeyA':
        this.actions.left = false
        break
      case 'Space':
        this.actions.brake = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.actions.boost = false
        break
      case 'KeyR':
        this.emit('action', 'reset')
        break
      default:
        break
    }
  }
}