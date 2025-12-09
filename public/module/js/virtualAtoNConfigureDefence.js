// 电子航标
var virtualAtoNLayerIndex = "";
// 电子航标详细
var virtualAtoNLayerDetailIndex = "";
// 基站电子航标数据
var stationVirtualData = [];
// 电子围栏坐标点
var virtualAtoNPosition = new L.marker([0, 0], {
    icon: L.icon({
        iconUrl: '../../assets/images/location.png',
        iconSize: [16, 24],
        iconAnchor: [8, 12]
    }), interactive: true, draggable: true
});
virtualAtoNPosition.on('dragend', function (event) {
    var position = virtualAtoNPosition.getLatLng();
    // var pointLat = position.lat+"";
    // var pointLng = position.lng+"";
    // var wd = changeToDFM(pointLat)
    // var jd = changeToDFM(pointLng)
    // $("#virtualAtonLatitude").val(wd[0] + "°" +  wd[1] + "′" + wd[2] + "″");
    // $("#virtualAtonLongitude").val(jd[0] + "°" +  jd[1] + "′" + jd[2] + "″");
    $("#virtualAtonLatitude").val(position.lat.toFixed(4));
    $("#virtualAtonLongitude").val(position.lng.toFixed(4));
})
var _admin;
var _table;
var _config;
var _map;
var _form;
function ownShoreList(map,admin,table,config,form) {
    _admin = admin;
    _table = table;
    _config = config;
    _map = map;
    _form = form;
    var ownShoreList = [];
    _admin.req('station-management/shoreInfoDb/shoreInfoList', "", function (res) {
        var data = res;
        _admin.req('station-management/shoreInfoDb/connectionStatusAll', "", function (res1) {
            var data1 = res1.datas;
            for (var index in data1) {
                if (data1[index].shoreMmsi != undefined && data1[index].shoreMmsi != "") {
                    if (data1[index].shoreStatus != null && data1[index].shoreStatus == "CONNECT") {
                        for (var i in data) {
                            if (data[i].id == data1[index].id) {
                                ownShoreList.push({"shoreMmsi": data1[index].shoreMmsi});
                            }
                        };
                    }
                }
            }
            _table.render({
                elem: '#ownshore-table',
                data: ownShoreList,
                cols: [[
                    {
                        field: 'shoreMmsi', title: '基站', event: 'collapse', align: 'left', width: '85%',
                        templet: function (d) {//展开折行
                            return '<div style="position: relative;\n' + 'padding: 0 10px 0 20px;">' + d.shoreMmsi + '<i style="left: 0px;" lay-tips="展开" class="layui-icon layui-colla-icon layui-icon-right"></i></div>'
                        }
                    },
                    {
                        fixed: 'right',
                        align: 'left',
                        toolbar: '#addVirtualAtoN-table-bar',
                        title: '',
                        width: '15%'
                    }
                ]]
            });
        }, "post");
    }, "post");

    virtualAtoNLayerIndex = layer.open({
        type: 1
        , offset: 'rt'
        , id: 'virtualAtoNControlLayer_id'
        , title: '电子航标'
        , content: $('#virtualAtoNControlLayer')
        , btn: ''
        , shade: 0
        , skin: 'layui-layer-lan messageBoxSend'
        , area:['600px', '500px']
        , resize: false
        , scrollbar: false
        , cancel: function () {
            closeVirtualAtoNLayer("all");
        }
        , success: function (layero, index) {
            layer.style(index, {
                marginLeft: -20,
                marginTop: 160,
            })
        }
    });


    _table.on('tool(ownshore-table)', function (obj) {
        var data = obj.data;
        var layEvent = obj.event;
        if (layEvent == 'collapse') {
            var trObj = layui.$(this).parent('tr'); //当前行
            var accordion = true //开启手风琴，那么在进行折叠操作时，始终只会展现当前展开的表格。
            var content = '<table class="layui-table" id="virtualAtoN-table" lay-filter="virtualAtoN-table" ></table>';//内容
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
                        url: _config.base_server + 'stationConfigure/setVirtualAtoN/findList',
                        method: 'POST',
                        headers: {'Authorization': 'Bearer ' + _config.getToken().access_token},
                        page: false,
                        limit: 100,
                        where: {shoreMmsi: data.shoreMmsi},
                        cellMinWidth: 80,
                        cols: [[
                            {field: 'id', title: 'id', hide: true},
                            {field: 'virtualAtonStation', title: '基站mmsi', hide: true},
                            {field: 'virtualAtonSequence', title: '序号', width: '12%'},
                            {
                                field: 'virtualAtonMmsi', title: 'MMSI', width: '20%', templet: function (d) {
                                    if (d.virtualAtonMmsi == null) {
                                        return "未设置"
                                    } else {
                                        return d.virtualAtonMmsi;
                                    }
                                }
                            },
                            {
                                field: 'virtualAtonName', title: '名称', width: '33%', templet: function (d) {
                                    if (d.virtualAtonName == null) {
                                        return "未设置"
                                    } else {
                                        return d.virtualAtonName;
                                    }
                                }
                            },
                            {field: 'virtualAtonChannel', title: '发送信道', hide: true},
                            {field: 'virtualAtonSendInterval', title: '发送间隔', hide: true},
                            {
                                field: 'virtualAtonValidIdentification',
                                title: '是否有效',
                                width: '20%',
                                templet: function (d) {
                                    if (d.virtualAtonValidIdentification == 0) {
                                        return "否"
                                    } else if (d.virtualAtonValidIdentification == 1) {
                                        return "是"
                                    } else {
                                        return ""
                                    }
                                }
                            },
                            {field: 'virtualAtonRepeatIndicator', title: '转发指示符', hide: true},
                            {field: 'virtualAtonPositionAccuracy', title: '位置准确度', hide: true},
                            {field: 'virtualAtonElectronicType', title: '电子定位装置的类型', hide: true},
                            {field: 'virtualAtonType', title: '助航设备类型', hide: true},
                            {field: 'virtualAtonOffpositionIndicator', title: '偏置位置指示符', hide: true},
                            {field: 'virtualAtonRaimFlag', title: 'RAIM标志', hide: true},
                            {field: 'virtualAtonAssignedModeFlag', title: '指配模式标志', hide: true},
                            {field: 'virtualAtonLongitude', title: '经度', hide: true},
                            {field: 'virtualAtonLatitude', title: '纬度', hide: true},
                            {field: 'virtualAtonDimension', title: '尺寸/位置参考点', hide: true},
                            {field: 'virtualAtonTimeStamp', title: '时戳', hide: true},
                            {
                                fixed: 'right',
                                align: 'left',
                                toolbar: '#virtualAtoN-table-bar',
                                title: '操作',
                                width: '15%'
                            }
                        ]],
                        done: function(res, curr, count){
                            stationVirtualData = res.data;
                        }
                    });
                }
            });
        } else if (layEvent == 'addVirtualAtoNInfo') {
            var data = obj.data;
            editVirtualAtoNInfo(data);
        }
    });

    _table.on('tool(virtualAtoN-table)', function (obj) {
        var data = obj.data;
        var layEvent = obj.event;
        if (layEvent == 'editVirtualAtoNInfo') {
            editVirtualAtoNInfo(data);
        } else if (layEvent == 'delVirtualAtoNInfo') {
            if (data.id == null || data.id == "") {
                layer.msg("该电子航标不存在，无法删除", {time: 2000});
                return false;
            }
            layer.confirm('确定删除此电子航标吗？', function (i) {
                layer.close(i);

                _admin.req('stationConfigure/setVirtualAtoN/delVirtualAtoNInfo', JSON.stringify(data), function (data) {
                    if (data.resp_code == 0) {
                        layer.msg(data.resp_msg, {icon: 1, time: _config.msgTime});
                        table.reload('ownshore-table', {});
                    } else {
                        layer.msg(data.resp_msg, {icon: 2, time: _config.msgTime});
                    }
                }, 'delete');
            });
        }
    })
}

function editVirtualAtoNInfo(data) {
    var title = "";
    // 编辑
    if (data.virtualAtonMmsi != null) {
        title = "编辑电子航标";
        _form.val('virtualAtonDetail-form', data);
        virtualAtoNPosition.setLatLng([data.virtualAtonLatitude, data.virtualAtonLongitude])
        virtualAtoNPosition.addTo(_map);
        $("#virtualAtonSequence").attr("disabled", "disabled");
        $("#chooseVirtualAtonLonLat").hide();
    } else {
        // 添加
        title = "添加电子航标";
        $("#virtualAtonDetail-form")[0].reset();
        $("#virtualAtonStation").val(data.shoreMmsi);
        $("#virtualAtonId").val("");
        $("#virtualAtonSequence").removeAttr("disabled", "disabled");
        $("#chooseVirtualAtonLonLat").show();
        virtualAtoNPosition.remove();
    }
    _form.render();

    virtualAtoNLayerDetailIndex = layer.open({
        type: 1
        , offset: ['8%', '28%']
        , id: 'virtualAtoNEditLayerId'
        , title: title
        , content: $("#virtualAtoNEditLayer")
        , btn: ''
        , shade: 0
        , skin: 'layui-layer-lan'
        , area: ['755px', '570px']
        , resize: false
        , cancel: function () {
            closeVirtualAtoNLayer("detail");
        }
        , zIndex: 10000
    });
}

function saveVirtualAton (data) {
    // var exist = false;
    // if (data.field.id == null || data.field.id == "") {
    //     for(var i in stationVirtualData){
    //         if (stationVirtualData[i].virtualAtonStation == data.field.virtualAtonStation && stationVirtualData[i].virtualAtonSequence == data.field.virtualAtonSequence) {
    //             exist = true;
    //             layer.confirm('该序号电子航标已被占用,是否覆盖？', function (i) {
    //                 layer.close(i);
    //                 layer.load(2);
    //                 data.field.id = stationVirtualData[i].id;
    //             // }, function (i) {
    //             //     layer.close(i);
    //             //     return false;
    //             });
    //             // break;
    //         };
    //     }
    // }
    _admin.req('stationConfigure/setVirtualAtoN/saveOrUpdate', JSON.stringify(data.field), function (res) {
        if (res.resp_code == 0) {
            closeVirtualAtoNLayer("detail");
            layer.msg(res.resp_msg, {icon: 1, time: _config.msgTime});
            _table.reload('ownshore-table', {});
        } else {
            layer.confirm("该序号电子航标已被占用,是否覆盖？", function (i) {
                layer.close(i);
                layer.load(2);
                data.field.id = res.resp_msg;
                _admin.req('stationConfigure/setVirtualAtoN/saveOrUpdate', JSON.stringify(data.field), function (res) {
                    closeVirtualAtoNLayer("detail");
                    layer.msg(res.resp_msg, {icon: 1, time: _config.msgTime});
                    _table.reload('ownshore-table', {});
                }, "post");
            });
        }
    }, "post");
}

function chooseVirtualAtonLonLat() {
    $("#chooseVirtualAtonLonLat").hide();
    $('#map').css('cursor', "url('../../assets/images/location.cur') 8 12,auto");
    _map.on('click', function (e) {
        // var pointLat = e.latlng.lat+"";
        // var pointLng = e.latlng.lng+"";
        // var wd=changeToDFM(pointLat)
        // var jd=changeToDFM(pointLng)
        // $("#virtualAtonLatitude").val(wd[0] + "°" +  wd[1] + "′" + wd[2] + "″");
        // $("#virtualAtonLongitude").val(jd[0] + "°" +  jd[1] + "′" + jd[2] + "″");
        $("#virtualAtonLatitude").val((e.latlng.lat).toFixed(4));
        $("#virtualAtonLongitude").val((e.latlng.lng).toFixed(4));
        virtualAtoNPosition.setLatLng([e.latlng.lat, e.latlng.lng])
        virtualAtoNPosition.addTo(_map);
        $('#map').css('cursor', "");
        _map.off('click');
    })
}

function closeVirtualAtoNLayer(str) {
    if (str != "detail") {
        if (virtualAtoNLayerIndex != null) {
            layer.close(virtualAtoNLayerIndex);
            virtualAtoNLayerIndex = null;
        }
    }
    if (virtualAtoNLayerDetailIndex != "") {
        layer.close(virtualAtoNLayerDetailIndex);
        virtualAtoNLayerDetailIndex = null;
        virtualAtoNPosition.remove();
        $("#chooseVirtualAtonLonLat").show();
    }

}

// 渲染表格
function collapseTable(options) {
    var trObj = options.elem;
    if (!trObj) return;
    var accordion = options.accordion,
        success = options.success,
        content = options.content || '';
    var tableView = trObj.parents('.layui-table-view'); //当前表格视图
    var id = tableView.attr('lay-id'); //当前表格标识
    var index = trObj.data('index'); //当前行索引
    var leftTr = tableView.find('.layui-table-fixed.layui-table-fixed-l tr[data-index="' + index + '"]'); //左侧当前固定行
    var rightTr = tableView.find('.layui-table-fixed.layui-table-fixed-r tr[data-index="' + index + '"]'); //右侧当前固定行
    var colspan = trObj.find('td').length; //获取合并长度
    var trObjChildren = trObj.next(); //展开行Dom
    var indexChildren = id + '-' + index + '-children'; //展开行索引
    var leftTrChildren = tableView.find('.layui-table-fixed.layui-table-fixed-l tr[data-index="' + indexChildren + '"]'); //左侧展开固定行
    var rightTrChildren = tableView.find('.layui-table-fixed.layui-table-fixed-r tr[data-index="' + indexChildren + '"]'); //右侧展开固定行
    var lw = leftTr.width() + 15; //左宽
    var rw = rightTr.width() + 15; //右宽
    //不存在就创建展开行
    if (trObjChildren.data('index') != indexChildren) {
        //装载HTML元素
        var tr = '<tr data-index="' + indexChildren + '"><td colspan="' + colspan + '"><div style="height: auto;overflow-x:hidden;padding-left:' + lw + 'px;padding-right:' + rw + 'px" class="layui-table-cell">' + content + '</div></td></tr>';
        trObjChildren = trObj.after(tr).next().hide(); //隐藏展开行
        var fixTr = '<tr data-index="' + indexChildren + '"></tr>';//固定行
        leftTrChildren = leftTr.after(fixTr).next().hide(); //左固定
        rightTrChildren = rightTr.after(fixTr).next().hide(); //右固定
    }
    //展开|折叠箭头图标
    trObj.find('td[lay-event="collapse"] i.layui-colla-icon').toggleClass("layui-icon-right layui-icon-down");
    //显示|隐藏展开行
    trObjChildren.toggle();
    //开启手风琴折叠和折叠箭头
    if (accordion) {
        trObj.siblings().find('td[lay-event="collapse"] i.layui-colla-icon').removeClass("layui-icon-down").addClass("layui-icon-right");
        trObjChildren.siblings('[data-index$="-children"]').hide(); //展开
        rightTrChildren.siblings('[data-index$="-children"]').hide(); //左固定
        leftTrChildren.siblings('[data-index$="-children"]').hide(); //右固定
    }
    success(trObjChildren, indexChildren); //回调函数
    heightChildren = trObjChildren.height(); //展开高度固定
    rightTrChildren.height(heightChildren + 115).toggle(); //左固定
    leftTrChildren.height(heightChildren + 115).toggle(); //右固定
}

//度转度分秒
function changeToDFM(du) {
    const arr1 = du.split(".");
    const d = arr1[0];
    let tp = "0." + arr1[1]
    tp = String(tp * 60); //这里进行了强制类型转换
    const arr2 = tp.split(".");
    const f = arr2[0];
    if(arr2.length==2){
        tp = "0." + arr2[1];
        tp = tp * 60;
    }else {
        tp ="0";
    }
    const m = parseInt(tp);
    var result=[];
    result.push(d);
    result.push(f);
    result.push(m);
    return result;
}
