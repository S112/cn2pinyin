const DICT = require('../lib/dict')

const FIRST_PINYIN_UNIHAN = '\u963F' // 阿
const LAST_PINYIN_UNIHAN = '\u9FFF'

const LATIN = 'latin'
const PINYIN = 'pinyin'
const UNKNOWN = 'unknown'

let COLLATOR

function patchDict (patchers) {
  if (!patchers) return
  if (typeof patchers === 'function') {
    patchers = [patchers]
  }
  if (patchers.forEach) {
    patchers.forEach(p => {
      typeof p === 'function' && p(DICT)
    })
  }
}

function isSupported () { // 是否支持中文
  let flag = null

  if (typeof Intl === 'object' && Intl.Collator) {
    COLLATOR = new Intl.Collator(['zh-Hans-CN', 'zh-CN'])
    flag = Intl.Collator.supportedLocalesOf(['zh-CN']).length === 1
  } else {
    flag = false
  }
  return flag
}

function _genToken (ch) { // Access DICT here, give the chance to patch DICT.
  const UNIHANS = DICT.UNIHANS
  const PINYINS = DICT.PINYINS
  const EXCEPTIONS = DICT.EXCEPTIONS
  const token = {
    source: ch
  }

  // First check EXCEPTIONS map, then search with UNIHANS table.
  if (ch in EXCEPTIONS) {
    token.type = PINYIN
    token.target = EXCEPTIONS[ch]
    return token
  }

  let offset = -1
  let cmp
  if (ch.charCodeAt(0) < 256) { // 如果返回的unicode小于256，说明是拉丁字母
    token.type = LATIN
    token.target = ch
    return token
  } else {
    cmp = COLLATOR.compare(ch, FIRST_PINYIN_UNIHAN)
    if (cmp < 0) {
      token.type = UNKNOWN
      token.target = ch
      return token
    } else if (cmp === 0) {
      token.type = PINYIN
      offset = 0
    } else {
      cmp = COLLATOR.compare(ch, LAST_PINYIN_UNIHAN)
      if (cmp > 0) {
        token.type = UNKNOWN
        token.target = ch
        return token
      } else if (cmp === 0) {
        token.type = PINYIN
        offset = UNIHANS.length - 1
      }
    }
  }

  token.type = PINYIN
  if (offset < 0) {
    let begin = 0
    let end = UNIHANS.length - 1
    while (begin <= end) {
      offset = ~~((begin + end) / 2) // 折半法， ～～：取整
      let unihan = UNIHANS[offset]
      cmp = COLLATOR.compare(ch, unihan)

      if (cmp === 0) { // Catch it.
        break
      } else if (cmp > 0) { // Search after offset.
        begin = offset + 1
      } else { // Search before the offset.
        end = offset - 1
      }
    }
  }

  if (cmp < 0) {
    offset--
  }

  token.target = PINYINS[offset]
  if (!token.target) {
    token.type = UNKNOWN
    token.target = token.source
  }
  return token
}

function parse (str, pos) {
  if (typeof str !== 'string') {
    throw new Error('argument should be string.')
  }
  if (!isSupported()) {
    throw new Error('not support Intl or zh-CN language.')
  }

  let arr = str.split('').map(v => _genToken(v))
  if (pos) {
    return arr.find((v,idx) => idx == pos)
  } else {
    return arr
  }
}

function toPinyin (str, separator, lowerCase) {
  return parse(str).map(v => {
    if (lowerCase && v.type === PINYIN) {
      return v.target.toLowerCase()
    }
    return v.target
  }).join(separator || '')
}

function atomToPinyin (str, pos, lowerCase) {
  if (!pos) {
    return toPinyin(str)
  }

  let obj = parse(str, pos) || null
  if (obj && lowerCase && obj.type === PINYIN) {
    return obj.target.toLowerCase()
  }

  return obj && obj.target || ''
}

module.exports = {
  _genToken,
  isSupported,
  parse,
  patchDict,
  toPinyin,
  atomToPinyin
}
