var fs = require('fs')
var path = require('path')
var util = require('util')
var archiver = require('archiver')

class FsUtil {
  /**
   * 是否存在
   * @param f
   * @returns {boolean}
   */
  static exist(f) {
    return fs.existsSync(f)
  }

  static randomName() {
    return new Date().getTime()
  }

  /**
   * 是否是文件
   * @param f
   * @returns {boolean}
   */
  static isFile(f) {
    return FsUtil.exist(f) && fs.statSync(f).isFile()
  }

  /**
   * 是否是文件夹
   * @param f
   * @returns {boolean}
   */
  static isDirectory(f) {
    return FsUtil.exist(f) && fs.statSync(f).isDirectory()
  }

  /**
   * 创建目录
   * @param f
   * @param permission
   */
  static mkdir(f, permission) {
    if (util.isArray(f)) {
      f.forEach(function (item) {
        FsUtil.mkdir(item, permission)
      })
    } else {
      if (!FsUtil.exist(f)) {
        fs.mkdirSync(f)
      }
    }
  }

  /**
   * 删除文件或文件夹
   * @param f
   */
  static delete(f) {
    if (util.isArray(f)) {
      f.forEach(function (item) {
        FsUtil.delete(item)
      })
    } else {
      if (FsUtil.exist(f)) {
        if (FsUtil.isDirectory(f)) {
          fs.rmdirSync(f)
        } else {
          fs.unlinkSync(f)
        }
      }
    }
  }

  /**
   * 获取文件状态
   * @param f 文件名
   * @param callback
   */
  static stateSync(f) {
    return fs.statSync(f)
  }

  /**
   * 列出目录下的文件和文件夹
   */
  static list(dir, options, fullView) {
    var result = []
    options = options || {}
    options.sync = true
    FsUtil.each(dir, function (item) {
      if (fullView) {
        result.push(item)
      } else {
        result.push(item.name)
      }
    }, options)
    return result
  }

  static each(dir, callback, options, onComplete) {
    options = options || {}
    dir = dir.replace(/(\/+)$/, '')

    var sync = options.sync != undefined ? options.sync : true
    var excludeFile = options.excludeFile
    var excludeDirectory = options.excludeDirectory
    var matchFunction = options.matchFunction
    var breakFunction = options.breakFunction
    var preventRecursiveFunction = options.preventRecursiveFunction
    var recursive = true
    var checkCount = 0
    var p, i, l

    var onFinished = function () {
      if (checkCount <= 0 && onComplete) {
        onComplete()
      }
    }

    if (options.recursive === false) {
      recursive = false
    }

    if (!FsUtil.isDirectory(dir)) {
      onFinished()
      return []
    }

    var handleItem = function (filename) {
      var name = dir + path.sep + filename
      var isDir = FsUtil.isDirectory(name)
      var stat = FsUtil.stateSync(name)
      //大小
      var info = {
        directory: isDir,
        path: name,
        filename: filename,
        birthTime: stat.birthtime,
        modifyTime: stat.mtime,
        size: stat.size
      }

      if (isDir) {
        if (recursive) {
          if (!preventRecursiveFunction || !preventRecursiveFunction(info)) {
            checkCount++
            FsUtil.each(name, callback, options, function () {
              checkCount--
              onFinished()
            })
          }
        }

        if (!excludeDirectory) {
          if (!matchFunction || (matchFunction && matchFunction(info))) {
            callback(info)
          }
        }
      } else if (FsUtil.isFile(name)) {
        if (!excludeFile) {
          if (!matchFunction || (matchFunction && matchFunction(info))) {
            callback(info)
          }
        }
      }
      checkCount--
      onFinished()
    }
    if (sync) {
      p = fs.readdirSync(dir)
      p.forEach(handleItem)
      checkCount = 0
      onFinished()
    } else {
      fs.readdir(dir, function (e, arr) {
        if (e) {
          onFinished()
        } else {
          checkCount = arr.length
          onFinished()
          arr.forEach(function (item) {
            handleItem(item)
          })

        }
      })
    }
  }

  /**
   * 遍历删除文件
   * @param path
   */
  static deleteall(path, delDir = true) {
    var files = []
    if (fs.existsSync(path)) {
      files = fs.readdirSync(path)
      files.forEach(function (file, index) {
        var curPath = path + '/' + file
        if (fs.statSync(curPath).isDirectory()) { // recurse
          fu.deleteall(curPath)
        } else { // delete file
          fs.unlinkSync(curPath)
        }
      })
      if (delDir) {
        fs.rmdirSync(path)
      }
    }
  }

  static isUnderDir(dir, filePath) {
    return path.normalize(dir) === path.normalize(path.dirname(filePath))
  }


  static recycleInRename(fileName) {
    return fileName + '-' + Date.now()
  }

  /**
   * 文件夹重名
   * @param folderName
   * @param filePath
   * @param index
   * @returns {*}
   */
  static abtainFolderName(folderName, filePath, index = 1) {
    let resultName = folderName + '(' + index + ')'
    if (FsUtil.exist(path.join(filePath, resultName))) {
      return FsUtil.abtainFolderName(folderName, filePath, ++index)
    } else {
      return resultName
    }
  }


  /**
   * 文件名重名
   * @param folderName
   * @param filePath
   * @param index
   * @returns {*}
   */
  static abtainFileName(fileName, filePath, index = 1) {
    let fileParts = fileName.split('.')
    let resultName = '';

    if (fileParts.length === 1) {
      resultName = fileParts[0] + '(' + index + ')'
    } else {
      fileParts.splice(fileParts.length - 2, 1, fileParts[fileParts.length - 2] + '(' + index + ')')
      resultName = fileParts.join('.')
    }

    if (FsUtil.exist(path.join(filePath, resultName))) {
      return FsUtil.abtainFileName(fileName, filePath, ++index)
    } else {
      return resultName
    }
  }


  /**
   * 文件的移动(多个)
   */
  static docMove(pathArr, target, callback) {
    if (!pathArr || pathArr.length == 0) {
      callback('文件路径不存在')
      return
    }
    pathArr.forEach((item) => {
      if (FsUtil.isDirectory(item)) {
        FsUtil.dirMove(item, target)
      } else {
        FsUtil.fileMove(item, target)
      }
    })

    callback(null, '移动完成')
  }

  /**
   * 文件的移动(从回收站移出)
   */
  static docMoveInRecoverAction(pathArr, target, callback) {
    if (!pathArr || pathArr.length == 0) {
      callback('文件路径不存在')
      return
    }

    let dirMove = function (originalPath, target) {
      let newName = path.join(target, FsUtil.splitRecycleRealFileName(path.basename(originalPath)))
      FsUtil.rename(originalPath, newName)
    }

    let fileMove = function (originalPath, target) {
      let base = path.basename(originalPath)
      FsUtil.move(originalPath, target, FsUtil.splitRecycleRealFileName(base))
    }

    pathArr.forEach((item) => {
      if (FsUtil.isDirectory(item)) {
        dirMove(item, target)
      } else {
        fileMove(item, target)
      }
    })

    callback(null, '移动完成')
  }

  /**
   * 文件的移动(移动至文件夹)
   */
  static docMoveInDelAction(pathArr, target, randomValue, callback) {
    if (!pathArr || pathArr.length == 0) {
      callback('文件路径不存在')
      return
    }

    let dirMove = function (originalPath, target) {
      let newName = path.join(target, path.basename(originalPath)) + '-' + randomValue
      FsUtil.rename(originalPath, newName)
    }

    let fileMove = function (originalPath, target) {
      let base = path.basename(originalPath)
      if (base.indexOf('.')) {
        let ext = path.extname(base)
        base = base.substring(0, base.lastIndexOf('.')) + '-' + randomValue + ext
      }
      FsUtil.move(originalPath, target, base)
    }

    pathArr.forEach((item) => {
      if (FsUtil.isDirectory(item)) {
        dirMove(item, target)
      } else {
        fileMove(item, target)
      }
    })

    callback(null, '移动完成')
  }

  static deleteall(path, delDir = true) {
    var files = []
    if (fs.existsSync(path)) {
      files = fs.readdirSync(path)
      files.forEach(function (file, index) {
        var curPath = path + '/' + file
        if (fs.statSync(curPath).isDirectory()) { // recurse
          FsUtil.deleteall(curPath)
        } else { // delete file
          fs.unlinkSync(curPath)
        }
      })
      if (delDir) {
        fs.rmdirSync(path)
      }
    }
  }

  /**
   * 文件夹移动
   * auth:loumt
   * @param originalPath
   * @param target
   */
  static dirMove(originalPath, target) {
    let newName = path.join(target, path.basename(originalPath))
    FsUtil.rename(originalPath, newName)
  }

  static delDirToRecycle(target, originalPath) {
    let base = path.basename(originalPath) + '-' + Date.now()
    return path.join(target, base)
  }

  /**
   * 文件移动
   * auth:loumt
   * @param originalPath {源路径}
   * @param target {目标路径}
   */
  static fileMove(originalPath, target) {
    FsUtil.move(originalPath, target, path.basename(originalPath))
  }

  static move(f, target, filter_or_newName) {
    var isValid = function (item) {
      if (FsUtil.isDirectory(item)) {
        return true
      }
      if (filter_or_newName) {
        if (util.isRegExp(filter_or_newName)) {
          return filter_or_newName.test(item)
        } else if (FsUtil.isFunction(filter_or_newName)) {
          return filter_or_newName(item)
        }
      }
      return true
    }
    if (util.isArray(f)) {
      f.forEach(function (item) {
        FsUtil.move(item, target)
      })
    } else {
      var name
      if (!isValid(f)) {
        return
      }
      if (filter_or_newName && FsUtil.isString(filter_or_newName)) {
        name = filter_or_newName
        filter_or_newName = null
      } else {
        name = path.basename(f)
      }
      var newName = path.normalize(target + path.sep + name)

      try {
        //如果是文件
        if (FsUtil.isFile(f)) {
          FsUtil.rename(f, newName)
        }
        //如果没有过滤参数
        if (!filter_or_newName) {
          return FsUtil.rename(f, target)
        }

        //可能有过滤，被过滤掉的文件不能被移动
        var deleteList = []
        FsUtil.each(f, function (item) {
          var dir, t
          if (item.directory) {
            dir = path.relative(f, item.name)
            t = path.normalize(target + path.sep + dir)
            FsUtil.mkdir(t)
            deleteList.push(item.name)
          } else {
            dir = path.dirname(path.relative(f, item.name))
            t = path.normalize(target + path.sep + dir)
            FsUtil.move(item.name, t, filter_or_newName)
          }
        }, {
          matchFunction: function (item) {
            return isValid(item.name)
          }
        })

        deleteList.forEach(function (item) {
          FsUtil.delete(item)
        })
        FsUtil.delete(f)

      } catch (err) {
        if (FsUtil.isFile(f)) {
          FsUtil.copy(f, target, filter_or_newName)
          FsUtil.delete(f)
        } else if (FsUtil.isDirectory(f)) {
          FsUtil.copy(f, target, filter_or_newName)
          FsUtil.delete(f)
        }
      }
    }
  }

  static isFunction(fn) {
    return Object.prototype.toString.call(fn) == '[object Function]'
  }

  static isString(fn) {
    return Object.prototype.toString.call(fn) == '[object String]'
  }

  static copy(f, target, filter_or_newName) {
    var isValid = function (item) {
      if (FsUtil.isDirectory(item)) {
        return true
      }
      if (filter_or_newName) {
        if (util.isRegExp(filter_or_newName)) {
          return filter_or_newName.test(item)
        } else if (FsUtil.isFunction(filter_or_newName)) {
          return filter_or_newName(item)
        }
      }
      return true
    }
    if (util.isArray(f)) {
      f.forEach(function (item) {
        FsUtil.copy(item, target)
      })
    } else {
      var name
      if (!isValid(f)) {
        return
      }
      if (filter_or_newName && FsUtil.isString(filter_or_newName)) {
        name = filter_or_newName
        filter_or_newName = null
      } else {
        name = path.basename(f)
      }

      var newName = path.normalize(target + path.sep + name)


      if (FsUtil.isFile(f)) {
        FsUtil.mkdir(path.dirname(newName))
        FsUtil.copyFile(f, newName)
      } else if (FsUtil.isDirectory(f)) {
        // let ta = path.normalize(target + path.sep + path.basename(f));
        // FsUtil.mkdir(ta)
        //
        // FsUtil.each(f, function (item) {
        //   console.dir(item);
        //   var dir, t
        //   if (!item.directory) {
        //     dir = path.dirname(path.relative(f, item.path))
        //     t = path.normalize(target + path.sep + dir)
        //     FsUtil.copy(item.path, t, filter_or_newName)
        //   }
        // })

        // let f_l = FsUtil.list(f, {sync: true, recursive: false}, true)
        // f_l.forEach(item => {
        //   if (item.directory) {
        //     let ta = path.normalize(target + path.sep + path.basename(item.path))
        //     FsUtil.mkdir(ta)
        //     FsUtil.copy(item.path, ta, filter_or_newName)
        //   } else {
        //     var dir, t
        //     dir = path.dirname(path.relative(f, item.path))
        //     t = path.normalize(target + path.sep + dir)
        //     FsUtil.copy(item.path, t, filter_or_newName)
        //   }
        // })

        let ta = path.normalize(target + path.sep + path.basename(f))
        FsUtil.mkdir(ta)

        let f_l = FsUtil.list(f, {sync: true, recursive: false}, true)
        f_l.forEach(item => {
          if (item.directory) {
            // let ta = path.normalize(target + path.sep + path.basename(item.path))
            // FsUtil.mkdir(ta)
            FsUtil.copy(item.path, ta, filter_or_newName)
          } else {
            // var dir, t
            // dir = path.dirname(path.relative(f, item.path))
            //
            //   console.log(dir)
            // t = path.normalize(target + path.sep + dir)
            FsUtil.copy(item.path, ta, filter_or_newName)
          }
        })


      }
    }
  }

  static copyFileWithStream(src, dst) {
    fs.createReadStream(src).pipe(fs.createWriteStream(dst))
  }

  static copyFile(src, dest) {
    var len = 64 * 1024
    var buff = new Buffer(len)
    var fdr = fs.openSync(src, 'r')
    var fdw = fs.openSync(dest, 'w')
    var bytesRead = 1
    var pos = 0
    while (bytesRead > 0) {
      bytesRead = fs.readSync(fdr, buff, 0, len, pos)
      fs.writeSync(fdw, buff, 0, bytesRead)
      pos += bytesRead
    }
    fs.closeSync(fdr)
    fs.closeSync(fdw)
  }

  static rename(name, newName) {
    FsUtil.mkdir(path.dirname(newName))
    fs.renameSync(name, newName)
  }


  static splitRecycleRealFileName(filename) {
    let fn = filename.substring(0, filename.lastIndexOf('-'))
    let fn2 = filename.substring(filename.lastIndexOf('-'), filename.length)
    if (path.extname(fn2)) {
      return fn + path.extname(fn2)
    } else {
      return fn
    }
  }

  static splitRecycleFileName(filename) {
    let fn = filename.substring(0, filename.lastIndexOf('-'))
    let e2 = filename.substring(filename.lastIndexOf('-') + 1, filename.length)
    let times = filename.substring(filename.lastIndexOf('-') + 1, filename.length)
    if (times.indexOf('.') !== -1) {
      times = times.substring(0, times.lastIndexOf('.'))
    }
    let ext2 = path.extname(e2)
    return {
      filename: fn + ext2,
      rmTime: times
    }
  }

  //文件路径格式化
  static formatter(path) {
    if (path.indexOf('\\') === -1) {
      return path
    } else {
      return path.split('\\').join('/')
    }
  }

  /**
   * 文件夹下载，流传递
   * @param p 路径
   * @param fileName 文件名
   * @param isDir 是否为文件夹
   * @param res
   */
  static downloadFolderZip(p, fileName, res) {
    try {
      var archive = archiver('zip', {
        zlib: {
          level: 9
        }
      })
      archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
          console.log('docZip Utils err.code=' + err.code)
        } else {
          console.log('文件夹下载出错' + err)
        }
      })
      archive.on('error', function (err) {
        console.log('文件夹下载出错' + err)
      })
      archive.pipe(res)
      archive.directory(p, fileName)
      archive.finalize()
    } catch (e) {
      console.log('压缩文件夹失败' + e)
      res.status(200).json({success: false, message: '下载失败'})
    }
  }

}

module.exports = FsUtil
