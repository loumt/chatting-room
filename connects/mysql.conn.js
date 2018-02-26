const mysql = require('mysql');
const config = require('./../config/mysql.config');
const path = require('path');
const fs = require('fs');
const async = require('async');

const validateTables = true;


class MysqlClient {
    constructor(resolve, reject, version) {
        this.resolve = resolve;
        this.reject = reject;

        //cloudapp version
        this.version = version;
        this.config = config;
        this.success = false;
        this.initClient(config);

    }

    getServerInfo() {
        return `Mysql Server:[${this.config.host}:${this.config.port} ${this.config.database}]`
    }

    initClient(config) {
        this.client = mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.username,
            password: config.password,
            database: config.database
        });

        this.client.connect(function (err) {
            if (err) {
                this.reject(new Error(`Mysql Connect Error ! Server : [${this.getServerInfo()}]`));
            } else {
                if (validateTables) {
                    //validate tables
                    this.validateTable(this);
                } else {
                    //validate end and connection disconnect
                    this.client.end();
                    this.resolve({server: `Mysql[${this.getServerInfo()}]`, status: true})
                }
            }
        }.bind(this))
    }


    //validate table
    validateTable(_this) {
        let version = _this.version;
        let sqlValidate = path.join(__dirname, './../sql-versions', version + '.sql');

        if (!fs.existsSync(sqlValidate)) {
            //validate end and connection disconnect
            _this.client.end();
            _this.resolve({server: `Mysql[${_this.getServerInfo()}] without validate tables!`, status: true})
        } else {
            fs.readFile(sqlValidate, function (err, data) {
                if (err) {
                    console.log(`${sqlValidate} read error!`);
                }

                var tables = JSON.parse(data.toString());
                // console.dir(tables);

                if(!tables){
                    _this.resolve({server: `Mysql[${_this.getServerInfo()}] without validate tables!`, status: true})
                }

                let methods = [];
                let funTemplate = (client,sql)=>{
                    return function(callback){
                        console.log(sql);
                        client.query(sql,callback);
                    }
                }

                for(let tableName in tables){
                    let columns = tables[tableName];
                    let selectSql = `select ${columns.join(',')} from ${tableName}`;
                    // console.log(selectSql);

                    methods.push(funTemplate(_this.client,selectSql));
                }

                async.series(methods, function (err, result) {
                    if(err){
                        console.log(err);
                        _this.reject(new Error(`Mysql Connect Success !  But table error ! Server : [${_this.getServerInfo()}] Error:${err.code} | ${err.message}`));
                    }
                    _this.resolve({server: `Mysql[${_this.getServerInfo()}] with validate tables!`, status: true})
                });
            });
        }
    }


    static createValidate(version) {
        return new Promise((resolve, reject) => {
            new MysqlClient(resolve, reject, version);
        })
    }
}

module.exports = MysqlClient;