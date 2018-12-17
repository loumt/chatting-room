
const request = require('request')

const url = 'http://192.168.3.203/job/chatting-room/build?token=chatting'
const url2 = 'http://192.168.3.203/buildWithParameters?token=chatting'

const TOKEN_NAME= 'chatting'

// request.get(url2,(err,res,body)=>{
//   console.dir(err)
//   console.dir(res.statusCode)
//   console.dir(body)
// })

console.log('=============')


const e = 'C:\\Windows\\System32\\notepad.exe'
const e2 = '/usr/bin/firefox'
const path = require('path')

console.log(path.posix.basename(e))

console.dir(path)

console.log(path.win32.normalize(e2))
console.log(path.posix.normalize(e2))

