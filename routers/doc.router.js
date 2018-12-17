
const express =require("express")
let router = module.exports =  express.Router()

const docController = require('./../doc')

router.get('/download',docController.downloadAPI)
router.post('/upload',docController.uploadAPI)