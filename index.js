'use strict'

const promisify = require('es6-promisify')
const fs = require('fs')
const scratchParser = require('scratch-parser')

const readFile = promisify(fs.readFile)
const parser = promisify(scratchParser)

readFile('./validated_project.sb2')
  .then(parser)
  .then(project => {
    console.log(project)
  })
  .catch(e => console.error('Error!', e))
