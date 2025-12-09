// 电子围栏
var electronicFenceLayerIndex = "";
// 电子围栏详细
var electronicFenceLayerDetailIndex = "";
// 电子围栏矩形图层
var electronicFencePolygonLayer = new L.layerGroup();
// 电子围栏数据
var electronicFenceData;

var _admin;
var _table;
var _config;
var _map;
var _form;


function getElectronicFence(map,admin,table,config,form) {
    _admin = admin;
    _table = table;
    _config = config;
    _map = map;
    _form = form;
    _admin.req('api-user/seaMap/getElectronicFenceList', {}, function (data) {
        electronicFenceData = data;
        for(var i=0;i<electronicFenceData.length;i++) {
            var points = electronicFenceData[i].points.split(",");
            var polygonPoints = [];
            for (var j=0;j<points.length;j++) {
                polygonPoints.push([points[j],points[j+1]]);
                j++;
            }
           L.polygon(polygonPoints, {color: "#ff7800", weight: 1}).addTo(electronicFencePolygonLayer);
        }
        electronicFencePolygonLayer.addTo(_map)
    }, 'POST');
}

function electronicFenceList () {
    document.getElementById("layerControl").children[0].style.color = ""
    document.getElementById("playbackTrackControl").children[0].style.color = ""
    document.getElementById("sendSafeMsgControl").children[0].style.color = ""
    document.getElementById("myFleet") != null ? document.getElementById("myFleet").children[0].style.color = "" : ""
    document.getElementById("careShip") != null ? document.getElementById("careShip").children[0].style.color = "" : ""
    document.getElementById("heatControl") != null ? document.getElementById("heatControl").children[0].style.color = "" : ""
    document.getElementById("virtualAtoNControl").children[0].style.color = ""
    document.getElementById("userInfo").children[0].style.color = ""
    document.getElementById("userPassword").children[0].style.color = ""
    document.getElementById("userExit").children[0].style.color = ""
    _table.render({
        elem: '#electronicFence-table',
        data: electronicFenceData,
        page: false,
        cols: [[
            {field: 'name', title: '预警名称', align: 'left',},
            {fixed: 'right', align: 'left', toolbar: '#electronicFence-table-bar', title: '操作'},
        ]]
    });
    // 电子围栏 工具条点击事件
    _table.on('tool(electronicFence-table)', function (obj) {
        var data = obj.data;
        var layEvent = obj.event;
        if (layEvent === 'delElectronicFenceInfo') {
            layer.confirm('确定删除此预警区域吗？', function (i) {
                layer.close(i);
                layer.load(2);
                _admin.req('api-user/seaMap/delElectronicFence/' + obj.data.id, {}, function (data) {
                    if (data.resp_code == 0) {
                        layer.msg(data.resp_msg, {icon: 1, time: _config.msgTime});
                        refreshTable();
                    } else {
                        layer.msg(data.resp_msg, {icon: 2, time: _config.msgTime});
                    }
                }, 'delete');
            });
        } else if (layEvent === 'electronicFenceInfoDetail') {
            document.getElementById("electronicFencePointsList").innerHTML = "";
            electronicFenceInfoDetail(data)
        }
    });


    electronicFenceLayerIndex = layer.open({
        type: 1
        , offset: [70,1498]
        , id: 'electronicFenceLayer_id'
        , title: "预警列表"
        , content: $('#electronicFenceLayer')
        , btn: ''
        , shade: 0
        , skin: 'layui-layer-lan'
        , area: ['400px', '500px']
        , resize: false
        , scrollbar: false
        , cancel: function () {
            closeElectronicFenceLayer("all");
        }
        , success: function (layero, index) {

        }
    });
}

function electronicFenceInfoDetail (data) {
    document.getElementById("electronicFencePointsList").innerHTML = "";
    var param = {};
    if (data != undefined) {
        $("#electronicFenceLayerDetailLayer_id").css("height", "383px");
        $("#drawElectronicFence").attr("hidden", true);
        $("#saveElectronicFenceInfo").attr("hidden", true);
        $('#electronicFenceName').attr("disabled", "disabled");
        $('#electronicFenceStartValidTime').attr("disabled", "disabled");
        $('#electronicFenceEndValidTime').attr("disabled", "disabled");
        param.electronicFenceId = data.id;
        param.electronicFenceName = data.name;
        param.electronicFenceStartValidTime = data.startValidTime;
        param.electronicFenceEndValidTime = data.endValidTime;
        var polygonPoints = [];
        var points = data.points.split(",");
        for (var j=0;j<points.length;j++) {
            polygonPoints.push([points[j],points[j+1]]);
            j++;
        }

        for (var i = 0;i<polygonPoints.length;i++) {
            var dfm1 = changeToDFM(polygonPoints[i][0]+"");
            var dfm2 = changeToDFM(polygonPoints[i][1]+"");
            var we = "E";
            if (dfm1 < 0) {
                we = "W"
            }
            var ns = "N";
            if (dfm2 < 0) {
                ns = "S"
            }
            document.getElementById("electronicFencePointsList").innerHTML += "<li style='margin:20px;color: #DBD9D1'>" + i + "："
                // + "<label class='layui-form-label'style='width:5px'>经度：</label>"
                + dfm1[0] + "°" +  dfm1[1] + "′" + dfm1[2] + "″" + ns
                + "&nbsp&nbsp&nbsp"
                + dfm2[0] + "°" +  dfm2[1] + "′" + dfm2[2] + "″" + we
                + "</li>";
        }
    } else {
        $("#electronicFenceLayerDetailLayer_id").css("height", "284px");
        $("#drawElectronicFence").attr("hidden", false);
        $("#saveElectronicFenceInfo").attr("hidden", false);
        $('#electronicFenceName').removeAttr("disabled");
        $('#electronicFenceStartValidTime').removeAttr("disabled");
        $('#electronicFenceEndValidTime').removeAttr("disabled");
        param.electronicFenceId = "";
        param.electronicFenceName = "";
        param.electronicFenceStartValidTime = "";
        param.electronicFenceEndValidTime = "";
    }
    _form.val('electronicFence-form', param);
    _form.render();
    electronicFenceLayerDetailIndex = layer.open({
        type: 1
        , offset: ['7%', '55%']
        , id: 'electronicFenceLayerDetailLayer_id'
        , title: "预警信息"
        , content: $("#electronicFenceInfoDetailLayer")
        , btn: ''
        , shade: 0
        , skin: 'layui-layer-lan'
        , area: ['400px']
        , resize: false
        , cancel: function () {
            closeElectronicFenceLayer("detail");
        }
    });
}

function addElectronicFenceInfo () {
    var param = {
        id:$("#electronicFenceId").val(),
        name:$("#electronicFenceName").val(),
        startValidTime:$("#electronicFenceStartValidTime").val(),
        endValidTime: $("#electronicFenceEndValidTime").val(),
        points: saveElectronicFenceData+"",
    }
    _admin.req('api-user/seaMap/saveElectronicFenceInfo', JSON.stringify(param), function (res) {
        if(res.resp_code==0){
            closeElectronicFenceLayer("detail");
            layer.msg("预警信息保存成功", {icon: 2, time: _config.msgTime});
            refreshTable();
        }
    }, 'POST');

}

// 选择区域西北坐标
var northWestPointElectronicFence = "00000000000,0000";
// 选择区域东北坐标
var northEastPointElectronicFence = "00000000000,0000";
// 选择区域东南坐标
var southEastPointElectronicFence = "00000000000,0000";
// 选择区域西南坐标
var southWestPointElectronicFence = "00000000000,0000";
// 电子围栏区域选择
var rectangleElectronicFence = {
    startPoint: null,
    endPoint: null,
    rectangle: null,
    tips: null,
    layer: L.layerGroup(),
    color: "#0D82D7",
    addRectangle: function () {
        rectangleElectronicFence.destory();
        var bounds = [];
        bounds.push(rectangleElectronicFence.startPoint);
        bounds.push(rectangleElectronicFence.endPoint);
        rectangleElectronicFence.rectangle = L.rectangle(bounds, {color: rectangleElectronicFence.color, weight: 1});
        rectangleElectronicFence.rectangle.addTo(rectangleElectronicFence.layer);

        northWestPointElectronicFence = rectangleElectronicFence.rectangle.getBounds().getNorthWest().toString();
        northEastPointElectronicFence = rectangleElectronicFence.rectangle.getBounds().getNorthEast().toString();
        southEastPointElectronicFence = rectangleElectronicFence.rectangle.getBounds().getSouthEast().toString();
        southWestPointElectronicFence = rectangleElectronicFence.rectangle.getBounds().getSouthWest().toString();
        addrectangleElectronicFenceLayer();

        rectangleElectronicFence.layer.addTo(_map);
    },
    mousedown: function (e) {
        rectangleElectronicFence.rectangle = null;
        rectangleElectronicFence.tips = null;
        _map.dragging.disable();
        rectangleElectronicFence.startPoint = e.latlng;
        _map.on('mousemove', rectangleElectronicFence.mousemove)
    },
    mousemove: function (e) {
        moveFlag = true;
        rectangleElectronicFence.endPoint = e.latlng;
        rectangleElectronicFence.addRectangle();
        _map.off('mousedown ', rectangleElectronicFence.mousedown).on('mouseup', rectangleElectronicFence.mouseup);
    },
    mouseup: function (e) {
        if (!moveFlag) {
            return
        }
        _map.dragging.enable();
        document.getElementById('map').style.cursor = '';
        _map.off('mousemove', rectangleElectronicFence.mousemove).off('mouseup', rectangleElectronicFence.mouseup).off('mousedown', rectangleElectronicFence.mousedown);
        $("#drawElectronicFence").attr("hidden", true);
        },
    destory: function () {
        if (rectangleElectronicFence.rectangle)
            rectangleElectronicFence.layer.removeLayer(rectangleElectronicFence.rectangle);
    }
}

function drawElectronicFence() {

    if (!rectangleElectronicFence.layer.getLayers().length > 0) {
        document.getElementById('map').style.cursor = 'crosshair';
        northWestPoint = "00000000000,0000";
        northEastPoint = "00000000000,0000";
        southEastPoint = "00000000000,0000";
        southWestPoint = "00000000000,0000";
        _map.on('mousedown', rectangleElectronicFence.mousedown).on('mouseup', rectangleElectronicFence.mouseup);
    } else {
        return false;
    }
}

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

var saveElectronicFenceData;
function addrectangleElectronicFenceLayer() {
    document.getElementById("electronicFencePointsList").innerHTML = "";
    // 西北经度
    var northWestCornerLongitude = parseFloat(northWestPointElectronicFence.split(",")[1].substring(0, northWestPointElectronicFence.split(",")[1].length - 1)).toFixed(2);
    // 西北纬度
    var northWestCornerLatitude = parseFloat(northWestPointElectronicFence.split(",")[0].substring(7)).toFixed(2);
    // 东北角经度
    var northEastCornerLongitude = parseFloat(northEastPointElectronicFence.split(",")[1].substring(0, northEastPointElectronicFence.split(",")[1].length - 1)).toFixed(2);
    // 东北角纬度
    var northEastCornerLatitude = parseFloat(northEastPointElectronicFence.split(",")[0].substring(7)).toFixed(2);
    // 东南角经度
    var southEastCornerLongitude = parseFloat(southEastPointElectronicFence.split(",")[1].substring(0, southEastPointElectronicFence.split(",")[1].length - 1)).toFixed(2);
    // 东南角纬度
    var southEastCornerLatitude = parseFloat(southEastPointElectronicFence.split(",")[0].substring(7)).toFixed(2);
    // 西南角经度
    var southWestCornerLongitude = parseFloat(southWestPointElectronicFence.split(",")[1].substring(0, southWestPointElectronicFence.split(",")[1].length - 1)).toFixed(2);
    // 西南角纬度
    var southWestCornerLatitude = parseFloat(southWestPointElectronicFence.split(",")[0].substring(7)).toFixed(2);
    saveElectronicFenceData = [[northWestCornerLatitude,northWestCornerLongitude],
        [northEastCornerLatitude,northEastCornerLongitude],
        [southEastCornerLatitude,southEastCornerLongitude],
        [southWestCornerLatitude,southWestCornerLongitude]];
    $("#electronicFenceLayerDetailLayer_id").css("height", "430px");
    for (var i = 0;i<saveElectronicFenceData.length;i++) {
        var dfm1 = changeToDFM(saveElectronicFenceData[i][0] + "");
        var dfm2 = changeToDFM(saveElectronicFenceData[i][1] + "");
        var we = "E";
        if (dfm1 < 0) {
            we = "W"
        }
        var ns = "N";
        if (dfm2 < 0) {
            ns = "S"
        }
        document.getElementById("electronicFencePointsList").innerHTML += "<li style='margin:20px;color: #DBD9D1'>" + i + "："
            // + "<label class='layui-form-label'style='width:5px'>经度：</label>"
            + dfm1[0] + "°" + dfm1[1] + "′" + dfm1[2] + "″" + ns
            + "&nbsp&nbsp&nbsp"
            + dfm2[0] + "°" + dfm2[1] + "′" + dfm2[2] + "″" + we
            + "</li>";
    }
}

function refreshTable() {
    if (_map.hasLayer(electronicFencePolygonLayer)) {
        _map.removeLayer(electronicFencePolygonLayer);
        electronicFencePolygonLayer.clearLayers();
    }
    _admin.req('api-user/seaMap/getElectronicFenceList', {}, function (data) {
        electronicFenceData = data;
        for(var i=0;i<electronicFenceData.length;i++) {
            var points = electronicFenceData[i].points.split(",");
            var polygonPoints = [];
            for (var j=0;j<points.length;j++) {
                polygonPoints.push([points[j],points[j+1]]);
                j++;
            }
            L.polygon(polygonPoints, {color: "#ff7800", weight: 1}).addTo(electronicFencePolygonLayer);

        }
        electronicFencePolygonLayer.addTo(_map)
        _table.reload('electronicFence-table', {
            data: electronicFenceData});
    }, 'POST');
}

function closeElectronicFenceLayer(str) {
    if (str != "detail") {
        if (electronicFenceLayerIndex != null) {
            layer.close(electronicFenceLayerIndex);
            electronicFenceLayerIndex = null;
        }
    }
    if (electronicFenceLayerDetailIndex != "") {
        layer.close(electronicFenceLayerDetailIndex);
        electronicFenceLayerDetailIndex = null;
    }
    if (rectangleElectronicFence.layer.getLayers().length > 0) {
        rectangleElectronicFence.layer.removeLayer(rectangleElectronicFence.rectangle);
        // rectangleElectronicFence = null;
    }
    document.getElementById("electronicFencePointsList").innerHTML = "";
}