var _radar = {}
var _radar_admin;
var _radar_map;
var _radar_echoRangeLayer = new L.featureGroup();
var _radar_echoLayer = new L.featureGroup();
var _radar_interval = "";
var _echo_showType = false;
var _range_showType = false;

function getRadarEchoData() {
    var param = {}
    _radar_admin.reqNoLoad('radarDataService-api/getRadarEchoInfo', JSON.stringify(param), function (res) {
        if (res != undefined) {
            if (_echo_showType && res.echoData != undefined) {
                var echoData = res.echoData;
                cleanEchoLayer();
                for (var i in echoData) {
                    drawEcho(echoData[i])
                }
            }else {
                cleanEchoLayer();
            }
            if (_range_showType && res.rangeData) {
                var rangeData = res.rangeData;
                for (var i in rangeData) {
                    if ((_radar[rangeData[i].radarId] == undefined || _radar[rangeData[i].radarId] != rangeData[i].range) || !_radar_echoRangeLayer.hasLayer()) {
                        _radar[rangeData[i].radarId] = rangeData[i].range;
                        drawRange(rangeData[i])
                    }
                }
            }
        }
    }, "POST");
}

function drawRange(semiLastData) {
    cleanRangeLayer();
    L.circle([semiLastData.lat, semiLastData.lng], {
        radius: semiLastData.range,
        weight: 0,
        fillColor: '#979997',
        fillOpacity: 0.6
    }).addTo(_radar_echoRangeLayer);
    _radar_map.addLayer(_radar_echoRangeLayer);
    _radar_echoRangeLayer.bringToBack();
}

function drawEcho(semiData) {
    L.semiCircle([semiData.lat, semiData.lng], {
        radius: semiData.intRadius,
        radiusb: semiData.outerRadius,
        fill: true,
        color: '#63FF30',
        weight: 1,
        opacity: semiData.intensity / 255,
        fillOpacity: semiData.intensity / 255,
    }).setDirection(semiData.sectorAngleDatum, semiData.funAngle).addTo(_radar_echoLayer);
    _radar_map.addLayer(_radar_echoLayer);
    _radar_echoLayer.bringToBack();
}

function cleanEchoLayer() {
    if (_radar_echoLayer.getLayers().length > 0) {
        _radar_echoLayer.clearLayers();
    }
}

function cleanRangeLayer() {
    if (_radar_echoRangeLayer.getLayers().length > 0) {
        _radar_echoRangeLayer.clearLayers();
    }
}

function initRadarEcho(admin, map, radarEcho, radarRange) {
    _radar_admin = admin;
    _radar_map = map;
    _echo_showType = radarEcho;
    _range_showType = radarRange;

    if (_range_showType == false) {
        cleanRangeLayer();
    }
    if (_echo_showType == false) {
        cleanEchoLayer();
    }
    if (_echo_showType == true || _range_showType == true) {
        getRadarEchoData();
        setRadarEchoInterval();
    } else {
        if (_radar_interval != "") {
            clearInterval(_radar_interval);
        }
    }
}

function setRadarEchoInterval() {
    if (_radar_interval != "") {
        clearInterval(_radar_interval);
    }
    _radar_interval = window.setInterval(function () {
        getRadarEchoData();
    }, 5000)
}

// var interval="";
// function myInterval() {
//     if(interval!=""){
//         clearInterval(interval);
//     }
//     interval=window.setInterval(function () {
//         if(radarIds.length>0){
//             for(var i in radarIds){
//                 if(radars[radarIds[i]].length>0){
//                     //删图层
//                     if (echoLayer.getLayers().length > 0) {
//                         echoLayer.clearLayers();
//                     }
//                     if (echoRangeLayer.getLayers().length > 0) {
//                         echoRangeLayer.clearLayers();
//                     }
//                     if (map.hasLayer(echoLayer)) {
//                         map.removeLayer(echoLayer);
//                     }
//                     if (map.hasLayer(echoRangeLayer)) {
//                         map.removeLayer(echoRangeLayer);
//                     }
//                     drawRadarEcho(radars[radarIds[i]]);
//                     radars[radarIds[i]]=[];
//                 }
//
//             }
//         }
//     }, 5000);
// }
//
// var radars={};
// var radarIds=[];
// function initWebSocket () {
//     myInterval();
//     radars={};
//     radarIds=[]
//     var echoWebSocket = new WebSocket( config.echo_ws_server + `radarDataService-socket/websocket/echoMsg/${new Date().getTime()}`);
//     echoWebSocket.onmessage = function (result) {
//         if (!(result.data == '连接成功')) {
//             var data = JSON.parse(result.data);
//             if(radarIds.indexOf(data.radarId)==-1){
//                 radarIds.push(data.radarId)
//             }
//             if(radars[data.radarId]==undefined||radars[data.radarId].length==0){
//                 var d=[];
//                 d.push(data);
//                 radars[data.radarId]=d;
//                 radars[data.radarId+"Type"]=0;
//             }else {
//                 var d=radars[data.radarId];
//                 d.push(data);
//                 radars[data.radarId]=d;
//             }
//         }
//     };
//
//     echoWebSocket.onclose = function (e) {
//         console.log('服务器已经断开');
//         setTimeout(function(){
//
//             initWebSocket ();
//         }, 5000)
//
//     };
//     echoWebSocket.onerror = function (err) {
//         console.log("服务器报错：");
//     };
//
//     // 心跳 * 回应
//     setInterval(function(){
//         echoWebSocket.send('1');
//     }, 1000 * 30);
// }
// function drawRadarEcho(data){
//     var semiLastData = data[data.length - 1];
//     L.circle([semiLastData.lat, semiLastData.lng], {
//         radius: semiLastData.range,
//         weight: 0,
//         fillColor: '#979997',
//         fillOpacity: 0.6
//     }).addTo(echoRangeLayer);
//
//     for (var i = 0; i < data.length; i++) {
//         var semiData = data[i];
//         L.semiCircle([semiData.lat, semiData.lng], {
//             radius: semiData.intRadius,
//             radiusb: semiData.outerRadius,
//             fill: true,
//             color: '#63FF30',
//             weight: 1,
//             opacity: semiData.intensity / 255,
//             fillOpacity: semiData.intensity / 255,
//         }).setDirection(semiData.sectorAngleDatum, semiData.funAngle).addTo(echoLayer);
//     }
//     if ($('input[name="layerControlLayer_radarEcho"]').prop('checked') == true) {
//         map.addLayer(echoLayer);
//         map.addLayer(echoRangeLayer);
//         echoRangeLayer.bringToBack();
//         echoLayer.bringToFront();
//     }
// }
// // 回波webSocket
// initWebSocket()