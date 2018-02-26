module.exports = {
    host:'192.168.3.17',
    port:'6379',
    db:10,
    connect_timeout:20000,
    retry_strategy:{
        times_connected:10000,
        total_retry_time:3
    }
};