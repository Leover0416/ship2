layui.define(['element', 'common', 'admin', 'form', 'table', 'laydate', 'util'], function (exports) {
    var $ = layui.$;
    var form = layui.form;
    var table = layui.table;
    var laydate = layui.laydate;
    var admin = layui.admin;
    var config = layui.common;
    var util = layui.util;
    var myfleet = {
        //我的船队列表
        myfleetFun: function () {
            table.render({
                elem: '#fleet-table',
                url: config.base_server + 'fleet-api/fleetInfo/findPage',
                method: 'GET',
                headers: {'Authorization': 'Bearer ' + config.getToken().access_token},
                page: false,
                cols: [[
                    {
                        field: 'fleetName', title: '船队名称', event: 'collapse', align: 'left', width: '70%',
                        templet: function (d) {//展开折行
                            return '<div style="position: relative;\n' + 'padding: 0 10px 0 20px;">' + d.fleetName + '<i style="left: 0px;" lay-tips="展开" class="layui-icon layui-colla-icon layui-icon-right"></i></div>'
                        }
                    },

                    {fixed: 'right', align: 'left', toolbar: '#fleet-table-bar', title: '操作', width: '30%'}
                ]]
            });

            table.on('tool(fleet-table)', function (obj) {
                var data = obj.data;
                var layEvent = obj.event;
                // 船队信息修改
                if (layEvent === 'editFleetInfo') {
                    fleetInfo(data)
                } else if (layEvent === 'delFleetInfo') { // 船队信息删除
                    layer.confirm('确定删除此船队吗？', function (i) {
                        layer.close(i);
                        //layer.load(2);
                        admin.req('fleet-api/fleetInfo/'+obj.data.id, {}, function (data) {
                            if (data.resp_code == 0) {
                                layer.msg(data.resp_msg, {icon: 1, time: config.msgTime});
                                table.reload('fleet-table', {});
                            } else {
                                layer.msg(data.resp_msg, {icon: 2, time: config.msgTime});
                            }
                        }, 'delete');
                    });
                }else if (layEvent === 'sendMessage') { // 船队消息播发
                    $("#fleetMessageId").val(data.id)
                    fleetSendMessageIndex=layer.open({
                        type: 1
                        , offset: ['14%', '30%']
                        , id: 'fleetSendMessageLayer'
                        , title: "船队消息播发"
                        , content: $("#myFleetSendMessageLayer")
                        , btn: ''
                        , shade: 0
                        , skin: 'layui-layer-lan'
                        , area: ['800px','700px']
                        , resize: false
                        , cancel: function () {
                        }
                        ,end: function(){
                            fleetSendMessageLayer=""
                        }
                        , zIndex: 10000
                    });
                }else if (layEvent === 'collapse') {
                    //日志
                    var trObj = layui.$(this).parent('tr'); //当前行
                    var accordion = true //开启手风琴，那么在进行折叠操作时，始终只会展现当前展开的表格。
                    var content = '<table class="layui-table"  lay-filter="ship-table" ></table>';//内容
                    //表格行折叠方法
                    collapseTable({
                        elem: trObj,
                        accordion: accordion,
                        content: content,
                        success: function (trObjChildren, index) { //成功回调函数
                            //trObjChildren 展开tr层DOM
                            //index 当前层索引
                            trObjChildren.find('table').attr("id", index);
                            table.render({
                                elem: "#" + index,
                                url: config.base_server + 'fleet-api/queryShips',
                                method: 'GET',
                                headers: {'Authorization': 'Bearer ' + config.getToken().access_token},
                                page: false,
                                limit: 100,
                                where: {fleetId: data.id},
                                cellMinWidth: 80,
                                cols: [[
                                    {field: 'mmsi',  title: 'MMSI'},
                                    {field: 'shipName',  title: 'shipName'},
                                    {fixed: 'right', align: 'left', toolbar: '#ship-table-bar', title: '操作', width:'25%' }
                                    // {
                                    //
                                    // 	 title: '操作',
                                    // 	templet: function (d) {
                                    // 		return "";
                                    // 	}, title: '连接时间'
                                    // },
                                ]]
                            });
                        }
                    });
                }
                //添加船舶
                else if (layEvent === 'addFleetShipInfo'){
                    fleetShipInfo("",data.id)
                }
            });
        }



    }
    exports('myFleet', myfleet);
});