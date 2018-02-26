const amqp = require('amqp');
const config = require('./../config/mq.config');
const EventEmitter = require('events').EventEmitter;

class MQClient extends EventEmitter {
    constructor(resolve, reject) {
        super();
        //for promise
        this.resolve = resolve;
        this.reject = reject;

        this.config = config;
        this.initMQ(config);
    }

    initMQ(config) {
        this.client = amqp.createConnection(config, {reconnect: true});
        this.client.on('error', this.errorFun.bind(this));
        this.client.on('connect', this.connectFun.bind(this));
    }

    getServerInfo() {
        return `RabbitMq Server:[${config.host}:${config.port}]`
    }

    errorFun(err) {
        this.reject(new Error(`Unconnect ${this.getServerInfo()}`));
    }

    connectFun() {
        this.client.disconnect()
        this.resolve({server:`RabbitMQ[${this.getServerInfo()}]`,status:true});
    }

    //base on promise
    static createValidate() {
        return new Promise((resolve,reject)=>{
            new MQClient(resolve, reject)
        });
    }
}

// MQTask.then(function(){
//      console.log('success');
//  }).catch(function(){
//     console.log('error');
//  })

// Promise.all([
//     MQClient.createValidate()
// ]).then((result) => {
//     console.dir(result);
// }).catch((error) => {
//     console.log(`Server Error : ${error.message}`);
// })

module.exports = MQClient;