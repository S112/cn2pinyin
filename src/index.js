const py = require('./util')
const patch = require('./patch')

if (py.isSupported() && patch.shouldPatch(py._genToken)) {
  py.patchDict(patch)
}

module.exports = py
