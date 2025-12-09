layui.define(function (exports) {

    var config = {
        //prod
        base_server: 'http://192.168.100.11:9900/',
        cctv_ws_server:"ws://192.168.100.11:8020/ws/ccvt_channel?cameraId=",

        //test
        // base_server: 'http://192.168.101.42:8900/',
        // cctv_ws_server:"ws://192.168.101.42:7020/ws/ccvt_channel?cameraId=",

        //海图服务
        seamap_server:'http://59.46.138.121:85/map/',
        //雷达回波websocket
        // echo_ws_server:'ws://59.46.138.229:9900/',
        // cctv_ws_server:"ws://59.46.138.121:85/ws/ccvt_channel?cameraId=",

        tableName: 'easyweb',  // 存储表名
        clientId: 'webApp', // 应用id
        isolationVersion: '', // 隔离版本
        clientSecret: 'webApp', // 应用秘钥
        autoRender: false,  // 窗口大小改变后是否自动重新渲染表格，解决layui数据表格非响应式的问题，目前实现的还不是很好，暂时关闭该功能
        pageTabs: true,   // 是否开启多标签
        msgTime:2000, //layer.msg to统一时间2s
        // 获取缓存的token
        getToken: function () {
            var t = layui.data(config.tableName).token;
            if (t) {
                return JSON.parse(t);
            }
        },
        // 清除user
        removeToken: function () {
            layui.data(config.tableName, {
                key: 'token',
                remove: true
            });
        },
        // 缓存token
        putToken: function (token) {
            layui.data(config.tableName, {
                key: 'token',
                value: JSON.stringify(token)
            });
        },
        // 当前登录的用户
        getUser: function () {
            var u = layui.data(config.tableName).login_user;
            if (u) {
                return JSON.parse(u);
            }
        },
        // 缓存user
        putUser: function (user) {
            layui.data(config.tableName, {
                key: 'login_user',
                value: JSON.stringify(user)
            });
        }
    };
    exports('common', config);
});
