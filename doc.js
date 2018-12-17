"use strict";

const formidable = require('formidable')
const async = require('async')
const path = require('path')
const Fsutil = require('./FsUtils')
const fs = require('fs')

function mkdirRecursive(folder){
  if(Fsutil.isFile(folder)){
    mkdirRecursive(path.dirname(folder))
  }

  if(!Fsutil.exist(folder)){
    mkdirRecursive(path.dirname(folder))
    Fsutil.mkdir(folder)
  }
}


module.exports = {

  downloadAPI: (req,res,next)=>{
    try {
      let filePath = 'E://settings.txt'
      let fileName = 'settings.txt'

      if (!Fsutil.exist(filePath)) {
        return res.status(500).json({success:false,message:'Not Exist!'})
      }

      if (Fsutil.isDirectory(filePath)) {
        res.set({
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment;fileName=' + Fsutil.randomName() + '.zip'
        })
        Fsutil.downloadFolderZip(filePath, fileName, res)
      } else {
        let stats = Fsutil.stateSync(filePath)
        res.set({
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment;fileName=' + encodeURI(fileName),
          'Content-Length': stats.size
        })
        fs.createReadStream(filePath).pipe(res)
      }
    } catch (e) {
      res.status(500).json(e)
    }


  },
  uploadAPI:(req,res,next)=>{
    try {
      //创建上传表单
      var form = new formidable.IncomingForm();
      //设置编辑
      form.encoding = 'utf-8';
      //设置上传目录
      // form.uploadDir = curPath;
      form.uploadDir = 'F://file-test'
      //保留后缀(不可更改)
      form.keepExtensions = true;
      //能申请到的内存值,非文件大小
      // form.maxFieldsSize = docConfig.maxSize;
      // form.maxFileSize = 1 * 1024 * 1024;

      form.on('progress', (bytesReceived, bytesExpected) => {
        console.log(`${bytesExpected} => ${bytesReceived}`)
        //在这里判断接受到数据是否超过最大，超过截断接受流
      });

      form.parse(req, (err, fields, files) => {
        if (err) {
          console.log(err)
        }

        console.log('=====files======')
        console.dir(files)
        console.log('=====fields======')
        console.log(fields)

        if(!files.resource){
          return res.json(500).json({success:false,message:"无文件可上传"})
        }
        //源文件地址
        console.log(files.resource.path)



        let {path:filePath,name:fileName} = files.resource

        console.dir(files.resource)


        let uploadFileTarget = path.join(form.uploadDir,fileName)
        let uploadFolderTarget = path.dirname(uploadFileTarget)


        mkdirRecursive(uploadFolderTarget)

        // Fsutil.mkdir(path.dirname(filePath))

        Fsutil.rename(filePath,uploadFileTarget)

        res.status(200).json({success:true,message:'上传成功!'})
      })
    } catch (e) {
      console.log(e)
      res.status(500).json({success:false})
    }
  }
}

function mkdirEach(filePath){
  if(Fsutil.exist(filePath)){
    return;
  }
  if(Fsutil.isDirectory(filePath)){
    if(!Fsutil.exist(path.dir(filePath))){

    }
  }
  if(Fsutil.isFile(filePath)){
    mkdirEach(path.dirname(filePath))
  }
}
