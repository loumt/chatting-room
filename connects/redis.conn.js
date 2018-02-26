const redis = require('redis');
const config = require('./../config/redis.config');
const EventEmitter = require('events').EventEmitter
const CRASH_SERVER = false;

let clientHandler = null;

class RedisClient extends EventEmitter{
    constructor(resolve,reject){
        super();
        this.resolve =resolve;
        this.reject = reject;

        this.config = config;
        this.success = false;
        this.initClient(config);
    }

    getServerInfo(){
        return `Redis Server:[${this.config.host}:${this.config.port}]`
    }

    initClient(config){
        this.client = redis.createClient(config);
        this.client.on('connect',this.connectFun.bind(this));
        this.client.on('error',this.errorFun.bind(this));
        this.client.on('reconnecting',this.reconnectFun.bind(this));
    }

    connectFun(){
        this.client.quit();
        this.resolve({server:`Redis[${this.getServerInfo()}]`,status:true})
    }

    errorFun(){
        console.log(`Redis Connection Timeout! ${this.getServerInfo()}`);
    }

    reconnectFun(){
        this.reject(new Error(`Redis Connect Error ! Server : [${this.getServerInfo()}]`));
    }

    static createValidate(){
        return new Promise((resolve,reject)=>{
            new RedisClient(resolve,reject);
        })
    }
}

// Promise.all([
//     RedisClient.createValidate()
// ]).then((result) => {
//     console.dir(result);
// }).catch((error) => {
//     console.log(`Server Error : ${error.message}`);
// })

module.exports = RedisClient;
