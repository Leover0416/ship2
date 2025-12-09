// import '../../assets/libs/leaflet/leaflet.pm/leaflet.pm.min.js';
// import '../../assets/libs/leaflet/leaflet.pm/leaflet.pm.css';
$(document).ready(function () {

})
var _admin;
var _table;
var _config;
var _map;
var _form;
var _laytpl;
var electronicFenceLayerIndex = "";
var electronicFenceLayerDetailIndex = "";
var electronicHistoryLayer = ""
var eFenceTimelineLayer = ""
var electronicAlertLayer = ""
var currentPoly = "";
var drawCallback;
var eFenceEditingFlag = false;
var coord = [];
var mediumAlertPoly;
var lowAlertPoly;
var currentRowData = {};
var shipTypeForStopDraw = 'Polygon';
var _currentEventId;
var _timelineData;
var _snapshotImg;

function formDisableCustom () {
    $("#electronicFenceName").attr("disabled", "disabled")
    $(".drawType").attr("disabled", true)
    $("#shapeRadius").attr("disabled", "disabled")
    $("#meduimAlert").attr("disabled", "disabled")
    $("#lowAlert").attr("disabled", "disabled")
    $(".efence-coord").attr("disabled", "disabled");
    $(".eFenceAddPoint").hide()
    $(".eFenceReducePoint").css({
        visibility: 'hidden!important'
    })

    if($(".eFenceReducePoint").length) {
        for(var i = 3; i < $(".eFenceReducePoint").length; i++) {
            $(".eFenceReducePoint").eq(i).hide()
        }
    }

}

function formEnabledCustom () {
    $("#electronicFenceName").removeAttr("disabled")
    $(".drawType").attr("disabled", false)
    $("#shapeRadius").removeAttr("disabled")
    $("#meduimAlert").removeAttr("disabled")
    $("#lowAlert").removeAttr("disabled")
    $(".efence-coord").removeAttr("disabled")


    $(".eFenceAddPoint").show()
    // $(".eFenceReducePoint").css({
    //     visibility: 'visible!important'
    // })
    if($(".eFenceReducePoint").length) {
        for(var i = 3; i < $(".eFenceReducePoint").length; i++) {
            $(".eFenceReducePoint").eq(i).show()
        }
    }

    layui.form.render()

}
function editInit() {
    if (currentRowData) {
        // formDisableCustom()
        _form.val('electronicFence-form', {electronicFenceId: currentRowData.fenceId})
        _form.val('electronicFence-form', {electronicFenceName: currentRowData.electronicFenceName})
        _form.val('electronicFence-form', {highAlertContent: currentRowData.highAlertContent})
        _form.val('electronicFence-form', {highAlertVHFContent: currentRowData.highAlertVHFContent})
        _form.val('electronicFence-form', {lowAlert: currentRowData.lowAlert})
        _form.val('electronicFence-form', {lowAlertContent: currentRowData.lowAlertContent})
        _form.val('electronicFence-form', {lowAlertVHFContent: currentRowData.lowAlertVHFContent})
        _form.val('electronicFence-form', {meduimAlert: currentRowData.meduimAlert})
        _form.val('electronicFence-form', {meduimAlertContent: currentRowData.meduimAlertContent})
        _form.val('electronicFence-form', {meduimAlertVHFContent: currentRowData.meduimAlertVHFContent})
        // $("#electronicFenceId").val(currentRowData.fenceId)
        // _form.val('electronicFence-form', {shapeType: currentRowData.shapeType})
        if (currentRowData.shapeType == 'Rectangle') {
            $('input[name="drawType"][value="Rectangle"]').prop('checked', 'checked');
        } else if (currentRowData.shapeType == 'Circle') {
            $('input[name="drawType"][value="Circle"]').prop('checked', 'checked');
        } else $('input[name="drawType"][value="Polygon"]').prop('checked', 'checked');
        _form.render('radio');
        shipTypeForStopDraw = currentRowData.shapeType
        if(currentRowData.shapeType == 'Circle') {
            currentPoly = L.circle([JSON.parse(currentRowData.circlePoint).lat, JSON.parse(currentRowData.circlePoint).lng], {color: 'rgb(238,0,46)', radius: NmiToM(currentRowData.circleRadius)}).addTo(_map)
            // enableEdit()

            getExpandCircle([currentPoly._latlng], currentPoly._mRadius, currentRowData.lowAlert, 'medium')
            getExpandCircle([currentPoly._latlng], currentPoly._mRadius, currentRowData.lowAlert + currentRowData.meduimAlert, 'low')
        } else {
            currentPoly = L.polygon(currentRowData.highPoints, {color: 'rgb(238,0,46)', polyType: 'Polygon'}).addTo(_map)
            // enableEdit()
            var arrTemp2 = []
            currentPoly._latlngs[0].forEach(item => {
                arrTemp2.push({latitude: item.lat, longitude: item.lng})
            })
            getMediumExpandPolygon(arrTemp2, currentRowData.lowAlert)
            getLowExpandPolygon(arrTemp2, currentRowData.lowAlert + currentRowData.meduimAlert)
        }

        watchCurrentPoly()
    }
}

function openElectronicFenceTable(map, admin, table, config, form, laytpl) {
    _admin = admin;
    _table = table;
    _config = config;
    _map = map;
    _form = form;
    _laytpl = laytpl;

    _admin.reqNoLoad("fishingPort60-api/electricFence/show", '', function (res) {
        if (res.datas) {
            let arr = []
            res.datas.forEach(item => {
                arr.push({
                    fenceId: item.main.fenceId,
                    electronicFenceName: item.main.fenceName,
                    shapeType: (() => {
                        if (item.main.shapeType == 1) {
                            return 'Rectangle'
                        } else if (item.main.shapeType == 2) {
                            return 'Circle'
                        } else return 'Polygon'
                    })(),
                    highPoints: (() => {
                        var arrTemp = []
                        if(!item.main.fencePosition) {
                            arrTemp = []
                        } else {
                            JSON.parse(item.main.fencePosition).forEach(item => {
                                arrTemp.push([item.lat, item.lng])
                            })
                        }

                        // currentPoly = L.polygon(arrTemp, { color: 'rgb(238,0,46)', polyType: 'Polygon'}).addTo(_map)
                        return arrTemp
                    })(),
                    highAlertContent: item.highLevel.msgPattern,
                    highAlertVHFContent: item.highLevel.msgPattern2,
                    meduimAlert: item.main.middleMile,
                    meduimAlertContent: item.midLevel.msgPattern,
                    meduimAlertVHFContent: item.midLevel.msgPattern2,
                    lowAlert: item.main.lowMile,
                    lowAlertContent: item.lowLevel.msgPattern,
                    lowAlertVHFContent: item.lowLevel.msgPattern2,
                    circlePoint: item.main.circlePoint,
                    circleRadius: item.main.circleRadius,
                    circleRadius2: item.main.circleRadius2,
                    circleRadius3: item.main.circleRadius3,
                })
            })
            _table.render({
                elem: '#electronicFence-table',
                data: arr,
                limit: 100000,
                height: 350,
                page: false,
                cols: [[
                    {field: 'electronicFenceName', title: '预警名称', align: 'left', width: 227},
                    {fixed: 'right', align: 'left', toolbar: '#electronicFence-table-bar', title: '操作', width: 118},
                ]]
            });

            _table.on('tool(electronicFence-table)', function (obj) {
                if (currentPoly.options) return;
                var data = obj.data; //获得当前行数据
                switch (obj.event) {
                    case 'electronicFenceInfoDetail':
                        currentRowData = data
                        electronicFenceInfoDetail(editInit);
                        break;
                    case 'delElectronicFenceInfo':
                        _admin.reqNoLoad(``, '', function (res) {

                            if(res) {
                                _admin.reqNoLoad(`fishingPort60-api/electricFence/checkFence?id=${obj.data.fenceId}`, '', function (res) {
                                    var str = '确定删除此预警区域吗？'
                                    if(res.status == 1) {
                                        str = "此围栏已有未恢复的告警事件，是否删除？"
                                    }
                                    layer.confirm(str, function (i) {
                                        layer.close(i);
                                        _admin.reqNoLoad(`fishingPort60-api/electricFence/del/${obj.data.fenceId}`, '', function (res) {
                                            electronicFenceTableDataReload()
                                        }, 'DELETE', false, false)

                                    });
                                }, 'GET', false, false)
                            }
                        }, 'GET', false, false)



                        break;
                    default:
                        break;
                }

            })

        }

    }, 'GET', false, false)

    electronicFenceLayerIndex = layer.open({
        type: 1
        , offset: [70, 1498]
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
            _form.verify({
                bigThanZero: function(value){
                    if(value < 0)
                    {
                        return '请输入大于0的数字';
                    }
                }
            });
            // 监听保存风险预警
            form.on('submit(saveElectronicFenceInfo)', function (data) {
                var paramData = {
                    main: {},
                    list: []
                }
                paramData.main.fenceName = $("#electronicFenceName").val();
                paramData.main.shapeType = $('.drawType:checked').val() == "Polygon" ? 3 : $('.drawType:checked').val() == "Circle" ? 2 : 1;
                paramData.main.fencePosition = $('.drawType:checked').val() == "Circle" ? JSON.stringify([{
                    lat: currentPoly._latlng.lat, lng: currentPoly._latlng.lng
                }]) : JSON.stringify(currentPoly._latlngs[0]);
                paramData.main.fencePosition2 = $('.drawType:checked').val() == "Circle" ?  JSON.stringify([{
                    lat: mediumAlertPoly._latlng.lat, lng: mediumAlertPoly._latlng.lng
                }]) : JSON.stringify(mediumAlertPoly._latlngs[0]);
                paramData.main.fencePosition3 = $('.drawType:checked').val() == "Circle" ?  JSON.stringify([{
                    lat: lowAlertPoly._latlng.lat, lng: lowAlertPoly._latlng.lng
                }]) : JSON.stringify(lowAlertPoly._latlngs[0]);
                if($('.drawType:checked').val() == "Circle") {
                    paramData.main.circlePoint = JSON.stringify({
                        lat: currentPoly._latlng.lat, lng: currentPoly._latlng.lng
                    })

                    paramData.main.circleRadius = Number($("#shapeRadius").val())
                    paramData.main.circleRadius2 = Number($("#meduimAlert").val()) == 0 ? 0 : Number($("#meduimAlert").val()) + Number($("#shapeRadius").val())
                    paramData.main.circleRadius3 = Number($("#lowAlert").val()) == 0 ? 0 :Number($("#lowAlert").val()) + Number($("#meduimAlert").val())+ Number($("#shapeRadius").val())
                }
                paramData.main.middleMile = Number(data.field.meduimAlert);
                paramData.main.lowMile = Number(data.field.lowAlert);
                if(paramData.main.middleMile <= 0) {
                    paramData.main.fencePosition2 = "[]"
                }
                if(paramData.main.lowMile <= 0) {
                    paramData.main.fencePosition3 = "[]"
                }
                paramData.list.push({
                    alarmLevel: 1,
                    msgPattern: data.field.highAlertContent,
                    msgPattern2: data.field.highAlertVHFContent,
                })

                paramData.list.push({
                    alarmLevel: 2,
                    msgPattern: data.field.meduimAlertContent,
                    msgPattern2: data.field.meduimAlertVHFContent,
                })
                paramData.list.push({
                    alarmLevel: 3,
                    msgPattern: data.field.lowAlertContent,
                    msgPattern2: data.field.lowAlertVHFContent,
                })

                var id = Number(data.field.electronicFenceId);
                var url = "fishingPort60-api/electricFence/save"
                if (id) {
                    paramData.main.fenceId = id
                    url = "fishingPort60-api/electricFence/update"
                }

                _admin.reqNoLoad(url, JSON.stringify(paramData), function (res) {
                    clearAll();
                    layer.close(electronicFenceLayerDetailIndex);
                    electronicFenceLayerDetailIndex = null;
                    electronicFenceTableDataReload()
                }, 'POST', false, false)
            });
        }
    });
}

function electronicFenceTableDataReload() {
    _admin.reqNoLoad("fishingPort60-api/electricFence/show", '', function (res) {
        if (res.datas) {
            let arr = []
            res.datas.forEach(item => {
                arr.push({
                    fenceId: item.main.fenceId,
                    electronicFenceName: item.main.fenceName,
                    shapeType: (() => {
                        if (item.main.shapeType == 1) {
                            return 'Rectangle'
                        } else if (item.main.shapeType == 2) {
                            return 'Circle'
                        } else return 'Polygon'
                    })(),
                    highPoints: (() => {
                        var arrTemp = []
                        JSON.parse(item.main.fencePosition).forEach(item => {
                            arrTemp.push([item.lat, item.lng])
                        })
                        // currentPoly = L.polygon(arrTemp, { color: 'rgb(238,0,46)', polyType: 'Polygon'}).addTo(_map)
                        return arrTemp
                    })(),
                    highAlertContent: item.highLevel.msgPattern,
                    highAlertVHFContent: item.highLevel.msgPattern2,
                    meduimAlert: item.main.middleMile,
                    meduimAlertContent: item.midLevel.msgPattern,
                    meduimAlertVHFContent: item.midLevel.msgPattern2,
                    lowAlert: item.main.lowMile,
                    lowAlertContent: item.lowLevel.msgPattern,
                    lowAlertVHFContent: item.lowLevel.msgPattern2,
                    circlePoint: item.main.circlePoint,
                    circleRadius: item.main.circleRadius,
                    circleRadius2: item.main.circleRadius2 + item.main.circleRadius,
                    circleRadius3: item.main.circleRadius3 + item.main.circleRadius2 + item.main.circleRadius,
                })
            })
            _table.reload('electronicFence-table', {
                data: arr
            })
        }

    }, 'GET', false, false)
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
    $("#electronicFenceName").val('')
    $("#shapeRadius").val('')
    $("#highAlertContent").val('')
    $("#highAlertVHFContent").val('')
    $("#meduimAlert").val(0)
    $("#meduimAlertContent").val('')
    $("#meduimAlertVHFContent").val('')
    $("#lowAlert").val(0)
    $("#lowAlertContent").val('')
    $("#lowAlertVHFContent").val('')
    $("#electronicFenceId").val('')
    // if (rectangleElectronicFence.layer.getLayers().length > 0) {
    //     rectangleElectronicFence.layer.removeLayer(rectangleElectronicFence.rectangle);
    //     // rectangleElectronicFence = null;
    // }
    clearAll()
    stopDraw()

}

function electronicFenceInfoDetail(func) {
    electronicFenceLayerDetailIndex = layer.open({
        type: 1
        , offset: ['7%', '55%']
        , id: 'electronicFenceLayerDetailLayer_id'
        , title: "预警信息"
        , content: $("#electronicFenceInfoDetailLayerCustom")
        , btn: ''
        , shade: 0
        , skin: 'layui-layer-lan'
        , area: ['400px', '600px']
        , resize: false
        , cancel: function () {
            closeElectronicFenceLayer("detail");
        },
        success: function() {
            if($('.drawType:checked').val() != 'Circle') $(".shapeRadius-container").hide()
        }
    });
    if (func) {
        formDisableCustom()
        func()
    } else {
        currentRowData = {}
        $("#electronicFenceName").val('')
        $("#shapeRadius").val('')
        $("#highAlertContent").val('')
        $("#highAlertVHFContent").val('')
        $("#meduimAlert").val(0)
        $("#meduimAlertContent").val('')
        $("#meduimAlertVHFContent").val('')
        $("#lowAlert").val(0)
        $("#lowAlertContent").val('')
        $("#lowAlertVHFContent").val('')
        $("#electronicFenceId").val('')
        formEnabledCustom()
        drawPoly()
    }
    _form.on("radio(drawType)", function (data) {
        if(data.value != 'Circle'){
            $(".shapeRadius-container").hide()
        } else {
            $(".shapeRadius-container").show()
        }
        clearAll()
        shipTypeForStopDraw = data.value
        drawPoly(data.value)
        hideAddAndReduce(data.value)
    });
    eFenceEditingFlag = true

}

function hideAddAndReduce(data) {
    if (data == 'Rectangle' || data == 'Circle') {
        $('.eFenceAddPoint').css({
            visibility: 'hidden'
        })
        $('.eFenceReducePoint').css({
            visibility: 'hidden'
        })
    } else {
        $('.eFenceAddPoint').css({
            visibility: 'visible'
        })
        $('.eFenceReducePoint').css({
            visibility: 'visible'
        })
    }
}

//画图
function drawPoly(type = 'Polygon', callback) {
    _map.pm.enableDraw(type, {
        snappable: true,
        sanpDistance: 20,
        tooltips: false,
        pathOptions: {
            color: 'rgb(238,0,46)',
            fillColor: 'rgb(238,0,46)',
        },
    })
    drawCallback = callback
}

function stopDraw() {
    _map.pm.disableDraw(shipTypeForStopDraw)
}

//图形绘制完成触发
function initWatchForElectronicFence() {
    _map.on('pm:create', e => {
        // e.layer.options.polyType = e.shape
        // e.layer.options.color = that.form.color
        currentPoly = e.layer
        //编辑模式拖动触法
        watchCurrentPoly()
        watchDrawFinish(currentPoly)

        if (eFenceEditingFlag) {
            enableEdit()
        }

        if (this.drawCallback) this.drawCallback(this.currentPoly._latlngs)
    })

    _map.on('pm:drawstart', ({workingLayer}) => {

        workingLayer.on('pm:vertexadded', (e) => {
            if (eFenceEditingFlag) {

                if (e.workingLayer._latlngs.length > coord.length) {
                    coord.push(e.latlng)
                } else {
                    coord[e.workingLayer._latlngs.length - 1] = e.latlng
                }
            }
        })


    })
}


function watchCurrentPoly() {
    // var tempArr = []
    // currentPoly._latlngs[0].forEach(item => {
    //     tempArr.push([item.lat, item.lng])
    // })
    //
    // tempArr.push([currentPoly._latlngs[0][0].lat, currentPoly._latlngs[0][0].lng])
    // calcPolygonExtra (_map, 1, 1, currentPoly._latlngs[0], 1)

    // // var poly = turf.polygon([tempArr]);
    // var scaledPoly = turf.transformScale(currentPoly.toGeoJSON(), 2, {
    //     // origin: 'center'
    // });

    // let tempCoordArr = [];
    // turf.coordAll(scaledPoly).forEach((item, index) => {
    //     if(index < turf.coordAll(scaledPoly).length - 1)
    //     tempCoordArr.push({
    //         longitude: item[0],
    //         latitude: item[1]
    //     })
    // })
    var shapeType = $('.drawType:checked').val();
    if (shapeType == 'Circle') {
        var tempArr = [];
        tempArr.push({latitude: currentPoly._latlng.lat, longitude: currentPoly._latlng.lng})
        $("#shapeRadius").val(mToNmi(currentPoly._mRadius))
        // var shapeRadius = mToNmi(currentPoly._mRadius)
        getExpandCircle([currentPoly._latlng], currentPoly._mRadius, Number($('#meduimAlert').val()), 'medium')
        getExpandCircle([currentPoly._latlng], currentPoly._mRadius, Number($('#lowAlert').val()) + Number($('#meduimAlert').val()), 'low')
        currentPoly.on('pm:edit', event => {
            if (eFenceEditingFlag) {
                coord = [event.target._latlng]
            }

            var tempArr2 = []
            coord.forEach(item => {
                tempArr2.push({latitude: item.lat, longitude: item.lng})
            })
            getExpandCircle([event.target._latlng], event.target._mRadius, Number($('#meduimAlert').val()), 'medium')
            getExpandCircle([event.target._latlng], event.target._mRadius, Number($('#lowAlert').val()) + Number($('#meduimAlert').val()), 'low')
            // data2Template()
            $("#shapeRadius").val(mToNmi(event.target._mRadius))
            renderTable()
            hideAddAndReduce($('.drawType:checked').val())
        })
        renderTable()
        hideAddAndReduce($('.drawType:checked').val())
    } else {
        var tempArr = []
        currentPoly._latlngs[0].forEach(item => {
            tempArr.push({latitude: item.lat, longitude: item.lng})
        })

        getMediumExpandPolygon(tempArr, Number($('#meduimAlert').val()))
        getLowExpandPolygon(tempArr, Number($('#lowAlert').val()) + Number($('#meduimAlert').val()))
        currentPoly.on('pm:edit', event => {
            if (eFenceEditingFlag) {
                var arr = []
                event.target._latlngs[0].forEach(item => {
                    arr.push(item)
                })
                coord = arr
            }

            var tempArr2 = []
            coord.forEach(item => {
                tempArr2.push({latitude: item.lat, longitude: item.lng})
            })
            getMediumExpandPolygon(tempArr2, Number($('#meduimAlert').val()))
            getLowExpandPolygon(tempArr2, Number($('#lowAlert').val()) + Number($('#meduimAlert').val()))
            // data2Template()
            renderTable()
            hideAddAndReduce($('.drawType:checked').val())
        })

        currentPoly.on('pm:snapdrag', (e) => {
            console.log(e.layer._latlngs[0])
        })
        renderTable()

        hideAddAndReduce($('.drawType:checked').val())
    }


}

function renderTable(data) {
    var tempData = data ? data : getPolyData(currentPoly)
    if($('.drawType:checked').val() == 'Circle') {
        tempData.latlng = [[currentPoly._latlng]]
    } else {
        tempData.latlng[0].forEach((item, index) => {
            item.index = index
        })
    }

    var gettpl = document.getElementById('eFenceTemplate').innerHTML;
    _laytpl(gettpl).render(tempData, function (html) {
        document.getElementById('eFenceView').innerHTML = html;
        if(currentRowData.fenceId) {
            formDisableCustom()
        } else {
            formEnabledCustom()
        }
    });
    $("[name='removeElectronicFencePoint']").click(function (e) {
        var temp = getPolyData(currentPoly)
        temp.latlng[0].splice(Number($(e.target).attr('index')), 1);
        renderTable(data)
        eFencePointChange()
    })
}

function distMediumChange() {
    if($('.drawType:checked').val() == 'Circle') {
        getExpandCircle([currentPoly._latlng], currentPoly._mRadius, Number($('#meduimAlert').val()), 'medium')
        getExpandCircle([currentPoly._latlng], currentPoly._mRadius, Number($('#lowAlert').val()) + Number($('#meduimAlert').val()), 'low')
    } else {
        var tempArr = []
        currentPoly._latlngs[0].forEach(item => {
            tempArr.push({latitude: item.lat, longitude: item.lng})
        })

        getMediumExpandPolygon(tempArr, Number($('#meduimAlert').val()))
        getLowExpandPolygon(tempArr, Number($('#lowAlert').val()) + Number($('#meduimAlert').val()))
    }

}

function distLowChange() {
    if($('.drawType:checked').val() == 'Circle') {
        getExpandCircle([currentPoly._latlng], currentPoly._mRadius, Number($('#lowAlert').val()) + Number($('#meduimAlert').val()), 'low')

    } else {
        var tempArr = []
        currentPoly._latlngs[0].forEach(item => {
            tempArr.push({latitude: item.lat, longitude: item.lng})
        })

        getLowExpandPolygon(tempArr, Number($('#lowAlert').val()) + Number($('#meduimAlert').val()))
    }

}

function addRow() {
    var tempData = getPolyData(currentPoly)
    tempData.latlng[0].push(tempData.latlng[0][tempData.latlng[0].length - 1])
    renderTable(tempData)
    eFencePointChange()
}

function getMediumExpandPolygon(data, dist) {
    _admin.reqNoLoad('fishingPort60-api/expansion', JSON.stringify({
        "points": data,
        "dist": NmiToM(dist)
    }), function (res) {
        var arr = []
        res.points.forEach(item => {
            arr.push([item.latitude, item.longitude])
        })
        if (mediumAlertPoly && mediumAlertPoly.options) {
            mediumAlertPoly.remove()
            mediumAlertPoly = {}
        }
        mediumAlertPoly = L.polygon(arr, {color: 'yellow', className: 'dashLines', polyType: 'Polygon'})
        mediumAlertPoly.addTo(_map)
    }, "POST", false, false)
}

function getLowExpandPolygon(data, dist) {
    _admin.reqNoLoad('fishingPort60-api/expansion', JSON.stringify({
        "points": data,
        "dist": NmiToM(dist)
    }), function (res) {
        var arr = []
        res.points.forEach(item => {
            arr.push([item.latitude, item.longitude])
        })
        if (lowAlertPoly && lowAlertPoly.options) {
            lowAlertPoly.remove()
            lowAlertPoly = {}
        }
        lowAlertPoly = L.polygon(arr, {color: 'blue', className: 'dashLines-green', polyType: 'Polygon'})
        lowAlertPoly.addTo(_map)
    }, "POST", false, false)
}


function getExpandCircle(data, radius, dist, type) {
    if(type == "medium") {
        if (mediumAlertPoly && mediumAlertPoly.options) {
            mediumAlertPoly.remove()
            mediumAlertPoly = {}
        }
        mediumAlertPoly = L.circle(data[0], {
            radius:  radius + NmiToM(dist)
            , className: 'dashLines'
            , color:  'yellow'
        }).addTo(_map);
    } else {
        if (lowAlertPoly && lowAlertPoly.options) {
            lowAlertPoly.remove()
            lowAlertPoly = {}
        }
        lowAlertPoly = L.circle(data[0], {
            radius:  radius + NmiToM(dist)
            , className: 'dashLines-green'
            , color: 'blue'

        }).addTo(_map);
    }

}

function eFencePointChange() {
    var arrTemp = []
    if($('.drawType:checked').val() == 'Circle') {

        var lat = Number($(".efence-coord").eq(0).val());
        var lng = Number($(".efence-coord").eq(1).val());
        clearCurrentPoly()
        currentPoly = L.circle([lat, lng], {color: 'rgb(238,0,46)', radius: NmiToM($("#shapeRadius").val())}).addTo(_map)
        enableEdit()
        getExpandCircle([{
            lat: lat,
            lng: lng
        }], Number(NmiToM($("#shapeRadius").val())), Number($('#lowAlert').val()), 'medium')

        getExpandCircle([{
            lat: lat,
            lng: lng
        }], Number(NmiToM($("#shapeRadius").val())), Number($('#lowAlert').val()) + Number($('#meduimAlert').val()), 'low')
        // watchCurrentPoly()

        currentPoly.on('pm:edit', event => {
            if (eFenceEditingFlag) {
                coord = [event.target._latlng]
            }

            var tempArr2 = []
            coord.forEach(item => {
                tempArr2.push({latitude: item.lat, longitude: item.lng})
            })
            getExpandCircle([event.target._latlng], event.target._mRadius, Number($('#meduimAlert').val()), 'medium')
            getExpandCircle([event.target._latlng], event.target._mRadius, Number($('#lowAlert').val()) + Number($('#meduimAlert').val()), 'low')
            // data2Template()
            $("#shapeRadius").val(mToNmi(event.target._mRadius))

            renderTable()
            hideAddAndReduce($('.drawType:checked').val())
        })

    } else {
        for (var i = 0; i < $(".efence-coord").length; i += 2) {
            arrTemp.push([Number($(".efence-coord")[i].value), Number($(".efence-coord")[i + 1].value)])
        };
        clearCurrentPoly()
        currentPoly = L.polygon(arrTemp, {color: 'rgb(238,0,46)', polyType: 'Polygon'}).addTo(_map)
        enableEdit()
        var arrTemp2 = []
        currentPoly._latlngs[0].forEach(item => {
            arrTemp2.push({latitude: item.lat, longitude: item.lng})
        })
        getMediumExpandPolygon(arrTemp2, $('#meduimAlert').val() ? Number($('#meduimAlert').val()) : 0)
        getLowExpandPolygon(arrTemp2, $('#lowAlert').val() ? Number($('#lowAlert').val()) : 0)
        watchCurrentPoly()
    }

}

function data2Template() {
    var tempData = getPolyData(currentPoly)
    for (var i = 0; i < tempData.latlng[0].length; i++) {
        $(".efence-coord")[(i * i)].value = tempData.latlng[0][i].lat
        $(".efence-coord")[(i * i) + 1].value = tempData.latlng[0][i].lng
    }
}


function clearCurrentPoly() {
    if (currentPoly.options) {
        currentPoly.remove()
        currentPoly = {}
    }
}

function clearAll() {
    if (currentPoly.options) {
        currentPoly.remove()
        mediumAlertPoly.remove()
        lowAlertPoly.remove()
        currentPoly = {}
        mediumAlertPoly = {}
        lowAlertPoly = {}

        var gettpl = document.getElementById('eFenceTemplate').innerHTML;
        _laytpl(gettpl).render({
            latlng: [[]]
        }, function (html) {
            document.getElementById('eFenceView').innerHTML = html;
        });
    }
}

function watchDrawFinish(poly) {
    if (eFenceEditingFlag) {
        if($('.drawType:checked').val() == 'Circle') {
            coord = [poly._latlng]
        } else {
            var arr = []
            poly._latlngs[0].forEach(item => {
                arr.push(item)
            })
            coord = arr;
        }
    }
    getPolyData(poly)
    // if (drawFinish) that.drawFinish(that.getPolyData(poly))
    console.log(getPolyData(poly))
}

function getPolyData(poly) {
    var type = $('.drawType:checked').val();
    if (type == 'Circle') {
        if (poly) return poly._latlng
    } else {
        var result = {}
        if (poly) {
            result.latlng = poly._latlngs
        }
        return result
    }

}


function enableEdit() {
    if (currentPoly.options) {
        currentPoly.setStyle({
            color: currentPoly.options.color,
            fillColor: currentPoly.options.color,
            fillOpacity: 0.4
        })
        currentPoly.pm.enable({
            allowSelfIntersection: true,
            pathOptions: {
                color: 'rgb(238,0,46)',
                fillColor: 'rgb(238,0,46)',
            },
        })
    }
}

function getDpi() {
    var dpi
    if (window.screen.deviceXDPI !== undefined) {
        dpi = window.screen.deviceXDPI
        // arrDPI[1] = window.screen.deviceYDPI
    } else {
        let tmpNode = document.createElement('DIV')
        tmpNode.style.cssText = 'width:1mm;position:absolute;left:0px;top:0px;z-index:99;visibility:hidden'
        document.body.appendChild(tmpNode)
        dpi = parseInt(tmpNode.offsetWidth, 0)
        // arrDPI[1] = parseInt(tmpNode.offsetHeight, 0)
        tmpNode.parentNode.removeChild(tmpNode)
    }
    return dpi
}

function calcPolygonExtra(map, zoom, scale, paths, extra) {
    zoom = _map.getZoom()
    scale = 1 / 40075016.686 * Math.abs(Math.cos(map.getCenter().lat / 180 * Math.PI)) / Math.pow(2, map.getZoom() + 8);
    const norm = (x, y) => Math.sqrt((x * x) + (y * y))

    const len = paths.length
    // 获取实际1m对应像素是多少
    const extraPixel = (extra / scale) * getDpi() * 1000
    let polygon = []
    for (let i = 0; i < len; i++) {
        const point = map.latLngToLayerPoint(paths[i], zoom) // P 点
        const point1 = map.latLngToLayerPoint(paths[i === 0 ? len - 1 : i - 1], zoom) // P1 点
        const point2 = map.latLngToLayerPoint(paths[i === len - 1 ? 0 : i + 1], zoom) // P2 点

        // 向量PP1
        const vectorX1 = point1.x - point.x // 向量PP1 横坐标
        const vectorY1 = point1.y - point.y // 向量PP1 纵坐标
        const n1 = norm(vectorX1, vectorY1) // 向量的平方根 为了对向量PP1做单位化
        let vectorUnitX1 = vectorX1 / n1 // 向量单位化 横坐标
        let vectorUnitY1 = vectorY1 / n1 // 向量单位化 纵坐标

        // 向量PP2
        const vectorX2 = point2.x - point.x // 向量PP2 横坐标
        const vectorY2 = point2.y - point.y // 向量PP2 纵坐标
        const n2 = norm(vectorX2, vectorY2) // 向量的平方根 为了对向量PP1做单位化
        let vectorUnitX2 = vectorX2 / n2 // 向量单位化 横坐标
        let vectorUnitY2 = vectorY2 / n2 // 向量单位化 纵坐标

        // PQ距离
        const vectorLen = -extraPixel / Math.sqrt((1 - ((vectorUnitX1 * vectorUnitX2) + (vectorUnitY1 * vectorUnitY2))) / 2)

        // 根据向量的叉乘积来判断角是凹角还是凸角
        if (((vectorX1 * vectorY2) + (-1 * vectorY1 * vectorX2)) < 0) {
            vectorUnitX2 *= -1
            vectorUnitY2 *= -1
            vectorUnitX1 *= -1
            vectorUnitY1 *= -1
        }

        // PQ的方向
        const vectorX = vectorUnitX1 + vectorUnitX2
        const vectorY = vectorUnitY1 + vectorUnitY2
        const n = vectorLen / norm(vectorX, vectorY)
        const vectorUnitX = vectorX * n
        const vectorUnitY = vectorY * n

        const polygonX = vectorUnitX + point.x
        const polygonY = vectorUnitY + point.y;
        const polygonLngLat = map.layerPointToLatLng(map.latLngToLayerPoint(polygonX, polygonY), zoom)

        polygon[i] = [polygonLngLat.getLng(), polygonLngLat.getLat()]
    }

    return polygon
}

function efenceHistory(map, admin, table, config, form, laytpl) {
    _admin = admin;
    _table = table;
    _config = config;
    _map = map;
    _form = form;
    _laytpl = laytpl;

    _admin.reqNoLoad("fishingPort60-api/electricFence/event/show", '', function (res) {
        if (res.datas) {
            res.datas.forEach(item => {
                item.eventTime = parseTime(item.eventTime)
                item.finishTime = parseTime(item.finishTime)
            })
            _table.render({
                elem: '#electronicHistory-table',
                data: res.datas,
                limit: 100000,
                page: false,
                cols: [[
                    {field: 'shipName', title: '名称', align: 'left', width: 100},
                    {field: 'mmsi', title: 'MMSI', align: 'left', width: 150},
                    {field: 'eventTime', title: '开始时间', align: 'left', width: 200},
                    {field: 'finishTime', title: '结束时间', align: 'left', width: 200},
                    {field: 'fenceName', title: '预警区域名称', align: 'left', width: 150},
                    {align: 'left', toolbar: '#eFenceHistoryToolbar', title: '操作', width: 90},
                ]]
            });

            _table.on('tool(electronicHistory-table)', function (obj) {
                var data = obj.data;
                var layEvent = obj.event;
                if (layEvent === 'eFenceHistoryToolbarDetail') {
                    _currentEventId = data.eventId
                    _currentMmsi = data.mmsi
                    // _currentEventTime = new Date(data.eventTime).getTime()
                    // _currentFinishTime = new Date(data.finishTime).getTime()
                    // _currentMmsi = 305245000
                    // _currentEventTime = 1658419200000
                    // _currentFinishTime = 1658472973000
                    $(".timelineExport").hide()
                    $(".timelineExportDisable").show()
                    _admin.reqNoLoad(`fishingPort60-api/electricFence/msg/show?eventId=${data.eventId}`, '', function (res) {
                        if (res.datas) {
                            _timelineData = res.datas
                            var gettpl = document.getElementById('timelineForHistory').innerHTML;
                            _laytpl(gettpl).render(res.datas, function (html) {
                                document.getElementById('timelineView').innerHTML = html;
                            });
                            // $(".timelineExport").show()
                            // $(".timelineExportDisable").hide()
                            if (_currentEventId) {
                                _currentEventTime = new Date(_timelineData[0].time).getTime()
                                _currentFinishTime = new Date(_timelineData[_timelineData.length - 1].time).getTime();
                                $(".timelineExport").hide()
                                $(".timelineExportDisable").show()
                                trackSnapshot(_currentMmsi, _currentEventTime, _currentFinishTime)
                            }
                        }
                    }, 'GET', false, false)
                    eFenceTimelineLayer = layer.open({
                        type: 1
                        , offset: [70, 376]
                        , id: 'electronicTimelineLayer_id'
                        , title: "时间轴"
                        , content: $('#electronicTimelineLayer')
                        , btn: ''
                        , shade: 0
                        , skin: 'layui-layer-lan'
                        , area: ['400px', '500px']
                        , resize: false
                        , scrollbar: false
                        , cancel: function () {
                            layer.close(eFenceTimelineLayer);
                            _currentEventId = "";
                            if(_trackplaybackControl && _trackplaybackControl._close) _trackplaybackControl._close()

                        }
                        , success: function (layero, index) {
                            $(".timelineExport").hide()
                            $(".timelineExportDisable").show()
                            $('.timelineExport').unbind('click')
                            $('.timelineExport').click(function () {
                                _exportExcel()
                            })

                        }
                    });


                }
            })

            electronicHistoryLayer = layer.open({
                type: 1
                , offset: [70, 800]
                , id: 'electronicHistoryLayer_id'
                , title: "船舶事件列表"
                , content: $('#electronicHistoryLayer')
                , btn: ''
                , shade: 0
                , skin: 'layui-layer-lan'
                , area: ['915px', '500px']
                , resize: false
                , scrollbar: false
                , cancel: function () {
                    layer.close(electronicHistoryLayer);
                }
                , success: function (layero, index) {

                }
            });
        }

    }, 'GET', false, false)


}

function eFenceAlert(map, admin, table, config, form, laytpl) {
    _admin = admin;
    _table = table;
    _config = config;
    _map = map;
    _form = form;
    _laytpl = laytpl;
    _admin.reqNoLoad("fishingPort60-api/electricFence/alarm/show", '', function (res) {
        res.datas.datas.forEach(item => {
            item.alarmTime = parseTime(item.alarmTime)
            item.resumeTime = parseTime(item.resumeTime)
        })
        _table.render({
            elem: '#electronicAlert-table',
            data: res.datas.datas,
            limit: 100000,
            page: false,
            cols: [[
                // {field: 'shipName', title: '名称', align: 'center', width: 100},
                {field: 'mmsi', title: 'MMSI', align: 'center', width: 150},
                {field: 'longitude', title: '经度', align: 'center', width: 100},
                {field: 'latitude', title: '纬度', align: 'center', width: 100},
                {field: 'alarmTime', title: '开始时间', align: 'center', width: 200},
                {field: 'resumeTime', title: '结束时间', align: 'center', width: 200},
                {field: 'handleSuggestion', title: '确认内容', align: 'center', width: 300},
                {align: 'center', toolbar: '#eFenceHistoryToolbarForAlert', title: '操作', width: 150},
            ]]
        });
        _table.on('tool(electronicAlert-table)', function (data){
            if(data.event == "eFenceHistoryToolbarDetail1") {
                $("#eFenceHistoryToolbarDetailCommentId").val(data.data.alarmId)
                $("#eFenceHistoryToolbarDetailComment").val(data.data.handleSuggestion)
                var layerCustom = layer.open({
                    type: 1
                    , offset: [70, 410]
                    , id: 'eFenceHistoryToolbarDetail1Process_id'
                    , title: "风险警报处理"
                    , content: $('#eFenceHistoryToolbarDetail1Process')
                    , btn: ''
                    , shade: 0
                    , skin: 'layui-layer-lan'
                    , area: ['350px', '250px']
                    , resize: false
                    , scrollbar: false
                    , cancel: function () {
                        layer.close(layerCustom);
                    }
                    , success: function (layero, index) {
                        _form.on('submit(eFenceHistoryToolbarDetailSave)', function(data) {
                            _admin.reqNoLoad('fishingPort60-api/electricFence/alarm/handle', JSON.stringify({
                                handleSuggestion: data.field.eFenceHistoryToolbarDetailComment,
                                alarmId: $("#eFenceHistoryToolbarDetailCommentId").val(),
                            }), function (result) {

                                _admin.reqNoLoad("fishingPort60-api/electricFence/alarm/show", '', function(result2) {
                                    result2.datas.datas.forEach(item => {
                                        item.alarmTime = parseTime(item.alarmTime)
                                        item.resumeTime = parseTime(item.resumeTime)
                                    })
                                    _table.reload('electronicAlert-table', {
                                        data: result2.datas.datas
                                    })
                                }, 'GET', false, false)
                                layer.msg('处理成功', {icon: 1, time: _config.msgTime});
                                layer.close(layerCustom);

                            }, 'POST', false, false)
                        })
                    }
                });
            } else if(data.event == "eFenceHistoryToolbarDetail2") {
                _admin.reqNoLoad('fishingPort60-api/messageAsk', JSON.stringify({
                    messageAsk: {
                        shipMmsi: data.data.mmsi
                    },
                    alarmId: data.data.alarmId,
                }), function (result) {
                    layer.msg('问询成功', {icon: 1, time: _config.msgTime});
                }, 'POST', false, false)
            } else {
                $("#assignAlarmId").val(data.data.alarmId);
                $("#assignShipMMSI").val(data.data.mmsi);
                _admin.reqNoLoad('fishingPort60-api/signedMode', JSON.stringify({
                    messageAsk: {
                        shipMmsi: data.data.mmsi
                    },
                    alarmId: data.data.alarmId,
                }), function (result) {
                    layer.open({
                        type: 1
                        , offset: [70, 410]
                        , id: 'buzhidaogansha_id'
                        , title: "船舶指配"
                        , content: $('#buzhidaogansha')
                        , btn: ''
                        , shade: 0
                        , skin: 'layui-layer-lan'
                        , area: ['650px', '350px']
                        , resize: false
                        , scrollbar: false
                        , cancel: function () {

                        }
                        , success: function (layero, index) {

                        }
                    });
                }, 'POST', false, false)
            }
        })

    }, 'GET', false, false)
    electronicAlertLayer = layer.open({
        type: 1
        , offset: [70, 350]
        , id: 'electronicAlertLayer_id'
        , title: "风险告警列表"
        , content: $('#electronicAlertLayer')
        , btn: ''
        , shade: 0
        , skin: 'layui-layer-lan'
        , area: ['1220px', '500px']
        , resize: false
        , scrollbar: false
        , cancel: function () {
            layer.close(electronicAlertLayer);
        }
        , success: function (layero, index) {

        }
    });
    _form.on('submit(assignSave)', function (data) {
        var data=JSON.stringify({
            messageAsk: {
                shipMmsi: data.field.assignShipMMSI,
                channel:data.field.channel,
                slotIncrement:data.field.slotIncrement,
                slotStart:data.field.slotStart,
                slotOffset:data.field.slotOffset,
            },
            alarmId: data.field.assignAlarmId,
        })
        //调用指配接口
        console.log(data)
    });
}

$(".electronicFenceInfoDetail").click(function () {

})

function parseTime(time, cFormat) {
    if (arguments.length === 0) {
        return null
    }
    const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
    let date
    if (typeof time === 'undefined' || time === null || time === 'null') {
        return ''
    } else if (typeof time === 'object') {
        date = time
    } else {
        if ((typeof time === 'string') && (/^[0-9]+$/.test(time))) {
            time = parseInt(time)
        }
        if ((typeof time === 'number') && (time.toString().length === 10)) {
            time = time * 1000
        }
        date = new Date(time)
    }
    const formatObj = {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
        h: date.getHours(),
        i: date.getMinutes(),
        s: date.getSeconds(),
        a: date.getDay()
    }
    const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
        let value = formatObj[key]
        // Note: getDay() returns 0 on Sunday
        if (key === 'a') {
            return ['日', '一', '二', '三', '四', '五', '六'][value]
        }
        if (result.length > 0 && value < 10) {
            value = '0' + value
        }
        return value || 0
    })
    return time_str
}

// var _trackplaybackShips;
// var _targetShipMMSI_name;
var _trackplaybackcomplate;
var _trackplayback;
var _trackplaybackControl;

function trackSnapshot(mmsi, startTime, endTime) {
    var data = {
        "startTime": startTime / 1000,
        "endTime": endTime / 1000,
        "mmsi": mmsi,
        "periodTime": 30 * 60
    };
    _admin.req('shipHistory-api/getShipHistoryInfo', JSON.stringify(data), function (res) {
        if (res.data == null || res.data == '') {
            layer.msg("查询船舶不存在/船舶无轨迹", {icon: 2, time: _config.msgTime});
            $(".timelineExport").hide()
            $(".timelineExportDisable").show()
            return false;
        } else {
            var trackplaybackdata = [res.data];
            for (var j = 0; j < trackplaybackdata.length; j++) {
                for (var i = 0; i < trackplaybackdata[j].length; i++) {
                    trackplaybackdata[j][i].time = parseInt(trackplaybackdata[j][i].time)
                }
            }
            ;
            _trackplayback = (L.trackplayback(trackplaybackdata, _map, {
                    targetOptions: {
                        useImg: true,
                        imgUrl: '../../assets/images/ship.png',
                        width: 8,
                        height: 18,
                        color: '#00f',
                        fillColor: '#9FD12D'
                    }
                })
            );

            _trackplaybackcomplate = (L.trackplayback(trackplaybackdata, _map, {
                    targetOptions: {
                        useImg: true,
                        imgUrl: '../../assets/images/space.png',
                        width: 8,
                        height: 18,
                        color: '#00f',
                        fillColor: '#9FD12D'
                    },
                    clockOptions: {
                        speed: 65
                    },
                    trackLineOptions: {
                        isDraw: true
                    },
                    trackPointOptions: {
                        isDraw: true
                    }
                })
            );
            _trackplaybackControl = new L.trackplaybackcontrol(_trackplayback, {position: 'topleft'});

            _trackplaybackControl.onRemove = function () {
                _trackplayback.dispose();
                _trackplayback.off('tick', this._tickCallback, this);
                _trackplaybackcomplate.dispose();
            };

            var tempPoly = L.polyline((() => {
                let latlngs = [];
                trackplaybackdata[0].forEach(item => {
                    latlngs.push([item.lat, item.lng])
                })
                return latlngs
            })(), {color: 'blue', polyType: 'Line'}).addTo(_map)
            _map.fitBounds(tempPoly.getBounds())
            tempPoly.remove()
            tempPoly = {}
            _trackplaybackControl._close = function () {
                L.DomUtil.remove(this._container)
                if (this.onRemove) {
                    this.onRemove(this._map)
                }

                _trackplaybackShips = [];
                trackplaybackdata = [];
                return this;
            };
            _trackplaybackControl.addTo(_map);

            _trackplaybackcomplate.start();
            $('.leaflet-left').css({
                "display": 'none'
            })
            var snapshotImg = ''

            setTimeout(() => {
                // saveTrackImg();

                html2canvas(document.querySelector("#map"), {
                    logging:false,
                    useCORS:true,
                    allowTaint:true,
                    // foreignObjectRendering: true
                    ignoreElements:(element)=>{
                        if(element.id == "map" || element.id == ""){
                            return false;
                        } else {
                            return true
                        }
                    },
                }).then(canvas => {
                    var img = Canvas2Image.convertToImage(canvas, canvas.width * 0.8, canvas.height * 0.8);
                    _snapshotImg = img
                    $(".timelineExport").show()
                    $(".timelineExportDisable").hide()
                });
            }, 600)

        }
    }, 'POST');
}

function _exportExcel () {
    // $('.leaflet-bottom').css({
    //     "display": 'block'
    // })

    var xmlhttp = new XMLHttpRequest();
    var url = _config.base_server + 'fishingPort60-api/electricFence/excel';
    // var url = '/fishingPort60-api/getFishingPortExcel';
    var content = JSON.stringify({
        eventId: _currentEventId,
        'base64': _snapshotImg.split("data:image/png;base64,")[1]
    });
    xmlhttp.open("POST", url);
    xmlhttp.withCredentials = true;
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    xmlhttp.setRequestHeader('Authorization', 'Bearer ' + _config.getToken().access_token);
    xmlhttp.responseType = 'blob';
    xmlhttp.send(content);
    xmlhttp.onreadystatechange = function (oEvent) {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            const url = window.URL.createObjectURL(new Blob([oEvent.currentTarget.response], {
                type: 'application/octet-stream;charset=utf-8'
            }))
            const link = document.createElement('a')
            link.style.display = 'none'
            link.href = url
            const fileName = parseTime(new Date()) + '-轨迹.xlsx'
            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            $(".timelineExport").show()
            $(".timelineExportDisable").hide()
        }
    }
}

function mToNmi (data) {
    return (data / 1852).toFixed(4)
}

function NmiToM(data) {
    return data * 1852
}

