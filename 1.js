
const {exec,spawn,execSync,execFile} =  require('child_process')
const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')


// execFile('F:\\Rcp Test\\win32-sanlogic-rcp\\sanrcpclient.exe 192.168.20.50:10001?192.168.3.100@5900')
let ePath= "D:\\win32-sanlogic-rcp\\sanrcpclient.exe 192.168.20.50:10001?192.168.3.100@5900"
// let ePath = 'node F:\\Rcp-Test\\1.js'
let result =  spawn('F:\\Rcp Test\\win32-sanlogic-rcp\\sanrcpclient.exe',['192.168.20.50:10001?192.168.3.100@5900'])
// console.log(result)

let re1 = path.join(__dirname,'1.js')
console.log(re1)

let re2 = path.win32.join(__dirname,'1.js')
console.log(re2)

// execFile(re2)



// fse.ensureDir('C:\\\\Program Files\\\\2.0.0-beta5').then(result=>{
//   console.log(result)
// }).catch(err=>{
//   console.log(err)
// })