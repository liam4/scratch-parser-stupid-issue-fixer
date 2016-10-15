'use strict'

const promisify = require('es6-promisify')
const JSZip = require('jszip')
const fs = require('fs')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

function assignOne(x, y, k) {
  if (k in y) {
    x[k] = y[k]
  }
}

function createTarget() {
  return {
    objName: '',
    variables: [],
    lists: [],
    sounds: [],
    costumes: [],
    currentCostumeIndex: 0,
    scriptComments: []
  }
}

function createSprite() {
  return Object.assign(createTarget(), {
    scratchX: 0,
    scratchY: 0,
    scale: 1,
    direction: 90,
    rotationStyle: 'normal',
    isDraggable: false,
    indexInLibrary: 1,
    visible: true,
    spriteInfo: {}
  })
}

function createStage() {
  return Object.assign(createTarget(), {
    objName: 'Stage',
    penLayerMD5: '',
    tempoBPM: 60,
    videoAlpha: 0.5,
    children: []
  })
}

function createEmptyProject() {
  return Object.assign(createStage(), {
    info: {}
  })
}

function createWatcher() {
  return {
    target: '',
    cmd: '',
    param: '',
    color: 0,
    label: '',
    sliderMin: 0,
    sliderMax: 100,
    isDiscrete: true,
    x: 0,
    y: 0,
    visible: false
  }
}

function createListWatcher() {
  return {
    listName: '',
    contents: [],
    isPersistent: false,
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    visible: false
  }
}

function createVariable() {
  return {
    name: '',
    value: 0,
    isPersistent: false
  }
}

function validateList(newListWatcher, sourceTarget) {
  assignOne(newListWatcher, sourceTarget, 'listName')
  assignOne(newListWatcher, sourceTarget, 'contents')
  assignOne(newListWatcher, sourceTarget, 'isPersistent')
  assignOne(newListWatcher, sourceTarget, 'x')
  assignOne(newListWatcher, sourceTarget, 'y')
  assignOne(newListWatcher, sourceTarget, 'width')
  assignOne(newListWatcher, sourceTarget, 'height')
  assignOne(newListWatcher, sourceTarget, 'visible')
}

function validateTarget(newTarget, sourceTarget) {
  assignOne(newTarget, sourceTarget, 'currentCostumeIndex')
  assignOne(newTarget, sourceTarget, 'scripts')
  assignOne(newTarget, sourceTarget, 'scriptComments')

  // These could maybe check for missing properties..
  assignOne(newTarget, sourceTarget, 'sounds')
  assignOne(newTarget, sourceTarget, 'costumes')

  if ('variables' in sourceTarget) {
    for (let sourceVariable of sourceTarget.variables) {
      const newVariable = createVariable()

      assignOne(newVariable, sourceVariable, 'name')
      assignOne(newVariable, sourceVariable, 'value')
      assignOne(newVariable, sourceVariable, 'isPersistent')

      newTarget.variables.push(newVariable)
    }
  }

  // Lists are weird
  if ('lists' in sourceTarget) {
    for (let sourceList of sourceTarget.lists) {
      const newList = createListWatcher()

      validateList(newList, sourceList)

      newTarget.lists.push(newList)
    }
  }
}

function validate(file) {
  let zip
  return readFile(file)
    .then(data => {
      return JSZip.loadAsync(data)
    }).then(_zip => {
      zip = _zip

      return zip.file('project.json').async('string')
    }).then(projectString => {
      const sourceStage = JSON.parse(projectString)
      const newStage = createEmptyProject()

      validateTarget(newStage, sourceStage)
      assignOne(newStage, sourceStage, 'penLayerMD5')
      assignOne(newStage, sourceStage, 'tempoBPM')
      assignOne(newStage, sourceStage, 'videoAlpha')
      assignOne(newStage, sourceStage, 'info')

      for (let sourceTarget of sourceStage.children) {
        if ('objName' in sourceTarget) {
          const newSprite = createSprite()

          validateTarget(newSprite, sourceTarget)
          assignOne(newSprite, sourceTarget, 'objName')
          assignOne(newSprite, sourceTarget, 'scratchX')
          assignOne(newSprite, sourceTarget, 'scratchY')
          assignOne(newSprite, sourceTarget, 'scale')
          assignOne(newSprite, sourceTarget, 'direction')
          assignOne(newSprite, sourceTarget, 'rotationStyle')
          assignOne(newSprite, sourceTarget, 'isDraggable')
          assignOne(newSprite, sourceTarget, 'indexInLibrary')
          assignOne(newSprite, sourceTarget, 'visible')
          assignOne(newSprite, sourceTarget, 'spriteInfo')

          newStage.children.push(newSprite)
        } else if ('cmd' in sourceTarget) {
          const newWatcher = createWatcher()
          
          assignOne(newWatcher, sourceTarget, 'target')
          assignOne(newWatcher, sourceTarget, 'cmd')
          assignOne(newWatcher, sourceTarget, 'param')
          assignOne(newWatcher, sourceTarget, 'color')
          assignOne(newWatcher, sourceTarget, 'label')
          assignOne(newWatcher, sourceTarget, 'mode')
          assignOne(newWatcher, sourceTarget, 'sliderMin')
          assignOne(newWatcher, sourceTarget, 'sliderMax')
          assignOne(newWatcher, sourceTarget, 'isDiscrete')
          assignOne(newWatcher, sourceTarget, 'x')
          assignOne(newWatcher, sourceTarget, 'y')
          assignOne(newWatcher, sourceTarget, 'visible')

          newStage.children.push(newWatcher)
        } else if ('listName' in sourceTarget) {
          const newListWatcher = createListWatcher()

          validateList(newListWatcher, sourceTarget)

          newStage.children.push(newListWatcher)
        } else {
          console.warn('Unknown stage-child:', sourceTarget)
        }
      }

      return newStage
    })
    .then(newStage => {
      console.log(JSON.stringify(newStage, null, 2))
      zip.file('project.json', JSON.stringify(newStage, null, 2))
      return zip.generateAsync({
        type: 'nodebuffer'
      })
    })
    .then(buffer => {
      console.log(buffer)
      return writeFile('validated_' + file, buffer)
    })
}

validate('project.sb2')
  .catch(e => console.error(e))
