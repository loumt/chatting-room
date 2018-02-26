const mysql = require('mysql');
const config = require('./../config/mysql.config');
const path = require('path');
const fs = require('fs');

const validateTables = false;


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
                console.log(data.toString());


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