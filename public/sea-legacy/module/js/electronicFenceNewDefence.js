// import '../../assets/libs/leaflet/leaflet.pm/leaflet.pm.min.js';
// import '../../assets/libs/leaflet/leaflet.pm/leaflet.pm.css';
var _admin;
var _table;
var _config;
var _map;
var _form;
var _laytpl;
var electronicFenceLayerCustomIndex = "";
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
var _signedModeLayer;
var _eFenceAlertTable;
var _allRiskArea;
// 航行警告图层
var warningAreaLayer = new L.layerGroup();
var eventTemplate = {events: null, template: {}, choose: {}};
var data = {
    fenceName: "",
    eventType: "",
};

function formDisableCustom() {
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

    if ($(".eFenceReducePoint").length) {
        for (var i = 3; i < $(".eFenceReducePoint").length; i++) {
            $(".eFenceReducePoint").eq(i).hide()
        }
    }

}

function formEnabledCustom() {
    $("#electronicFenceName").removeAttr("disabled")
    $(".drawType").attr("disabled", false)
    $("#shapeRadius").removeAttr("disabled")
    $("#meduimAlert").removeAttr("disabled")
    $("#lowAlert").removeAttr("disabled")
    $(".efence-coord").removeAttr("disabled")
    $("#eventTypes").removeAttr("disabled");

    $(".eFenceAddPoint").show()
    // $(".eFenceReducePoint").css({
    //     visibility: 'visible!important'
    // })
    if ($(".eFenceReducePoint").length) {
        for (var i = 3; i < $(".eFenceReducePoint").length; i++) {
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
        _form.val('electronicFence-form', {eventType: currentRowData.eventType})

        // $("#electronicFenceId").val(currentRowData.fenceId)
        // _form.val('electronicFence-form', {shapeType: currentRowData.shapeType})
        if (currentRowData.shapeType == 'Rectangle') {
            $('input[name="drawType"][value="Rectangle"]').prop('checked', 'checked');
            $(".shapeRadius-container").hide()
        } else if (currentRowData.shapeType == 'Circle') {
            $(".shapeRadius-container").show()
            $('input[name="drawType"][value="Circle"]').prop('checked', 'checked');
        } else {
            $('input[name="drawType"][value="Polygon"]').prop('checked', 'checked');
            $(".shapeRadius-container").hide()
        }

        $("#eventTypes").val(currentRowData.eventType).attr("disabled", "disabled");
        _admin.reqNoLoad("fishingPort60-api/api/geoFence/queryFormsData?fenceId=" + currentRowData.fenceId, '', function (res) {
            console.log(res);
            formsEventTypeChange(currentRowData.eventType, res, true);
            $("#electronicFence-form dfm").dfm('setEditable', false);
        }, "GET", false, false);

        if (currentRowData.alertFlag == 1) {
            $('input[name="alertSwitch"]').prop('checked', 'checked');
        } else {
            $('input[name="alertSwitch"]').removeAttr('checked');
        }
        _form.render('select');
        _form.render('radio');


        shipTypeForStopDraw = currentRowData.shapeType
        if (currentRowData.shapeType == 'Circle') {
            currentPoly = L.circle([JSON.parse(currentRowData.circlePoint).lat, JSON.parse(currentRowData.circlePoint).lng], {
                color: 'rgb(238,0,46)',
                radius: NmiToM(currentRowData.circleRadius)
            }).addTo(_map)
            // enableEdit()

            getExpandCircle([currentPoly._latlng], currentPoly._mRadius, currentRowData.lowAlert, 'medium')
            getExpandCircle([currentPoly._latlng], currentPoly._mRadius, currentRowData.lowAlert + currentRowData.meduimAlert, 'low')
        } else {
            currentPoly = L.polygon(currentRowData.highPoints, {
                color: 'rgb(238,0,46)',
                polyType: 'Polygon'
            }).addTo(_map)
            // enableEdit()
            var arrTemp2 = []
            currentPoly._latlngs[0].forEach(item => {
                arrTemp2.push({latitude: item.lat, longitude: item.lng})
            })
            getMediumExpandPolygon(arrTemp2, currentRowData.lowAlert)
            getLowExpandPolygon(arrTemp2, currentRowData.lowAlert + currentRowData.meduimAlert)
            // _map.fitBounds(lowAlertPoly.getBounds())
        }
        distMediumChange()
        distLowChange()
        watchCurrentPoly()
    }
}

function openElectronicFenceTable(map, admin, table, config, form, laytpl, allRiskArea) {
    _admin = admin;
    _table = table;
    _config = config;
    _map = map;
    _form = form;
    _laytpl = laytpl;
    _allRiskArea = allRiskArea;
    initEventTemplate();
    _form.verify({
        bitASCIINew: function (s) {
            if (s.length > 0) {
                if (!checkutils.bitASCII(s)) {
                    return '请输入6比特ASCII字符';
                }
            }
        },
        tmpNm: function (s) {
            if (Number.parseFloat(s) <= 0) {
                return '请输入正确的海里';
            }
        },
        tmpSec: function (s) {
            if (Number.parseFloat(s) <= 0) {
                return '请输入正确分钟';
            }
        },
        tmpKnot: function (s) {
            if (Number.parseFloat(s) <= 0) {
                return '请输入正确航速';
            }
        }
    })
    data = {
        fenceName: "",
        eventType: "",
    };
    electronicFenceTable(data);
    //fss
    $('#electronicLayer-btn-search').click(function () {
        var fenceName = $('#electronicNameInput').val();
        var eventType = $('#eventTypeSelect').val();
        data = {
            fenceName: fenceName,
            eventType: eventType,
        };
        electronicFenceTable(data)
    });


    electronicFenceLayerCustomIndex = layer.open({
        type: 1
        , offset: "rt"
        , id: 'electronicFenceLayer_id'
        , title: "预警列表"
        , content: $('#electronicFenceLayer')
        , btn: ''
        , shade: 0
        , skin: 'layui-layer-lan'
        , area: ['645px', '520px']
        , resize: false
        , scrollbar: false
        , end: function () {
            $("#electronicFenceControl").removeClass("active")
            getAllWarningArea(map, admin, allRiskArea);
            electronicFenceLayerCustomIndex = null;
            if (electronicFenceLayerDetailIndex) {
                layer.close(electronicFenceLayerDetailIndex);
                electronicFenceLayerDetailIndex = null;
            }

        }
        , success: function (layero, index) {
            layer.style(index, {
                left: $(layero).offset().left - 20,
                top: 110,
            })
            _form.verify({
                bigThanZero: function (value) {
                    if (value < 0) {
                        return '请输入大于0的数字';
                    }
                }
            });
            // 监听保存风险预警
            form.on('submit(saveElectronicFenceInfo)', function (data) {
                var paramData = {
                    main: {},
                    list: [],
                    events: [],
                }
                if (!currentPoly || (currentPoly && !currentPoly.options)) {
                    layer.msg("预警点不能为空！", {icon: 2, time: _config.msgTime});
                    return;
                } else {
                    if ($('.drawType:checked').val() == "Circle" && !currentPoly._latlng.lat) {
                        layer.msg("预警点不能为空！", {icon: 2, time: _config.msgTime});
                        return;
                    } else if (($('.drawType:checked').val() == "Polygon" || $('.drawType:checked').val() == "Rectangle") && !currentPoly._latlngs.length) {
                        layer.msg("预警点不能为空！", {icon: 2, time: _config.msgTime});
                        return;
                    }
                }

                let checkFlag = true;
                let checkMsg = "";
                let tmpEvents = {};
                $(".dynamic-form-field").each(function (index, ele) {
                    let eventType = $(ele).attr("data-event-type");
                    let eventId = $(ele).attr("data-event-id");
                    let eventObj = tmpEvents[eventType];
                    if (!eventObj) {
                        eventObj = tmpEvents[eventType] = {
                            eventType: eventType,
                            level: 0,
                            formValues: [],
                            id: eventId
                        }
                    }

                    let dataKey = $(ele).attr("data-key");
                    let dataId = $(ele).attr("data-id");
                    let dataValue = $(ele).find(`[name=${dataKey}]`).val();
                    let formsData = {
                        id: dataId,
                        dataKey: dataKey,
                        dataValue: dataValue,
                        eventType: eventType,
                    };
                    eventObj.formValues.push(formsData)

                    if("FCW" == eventType){
                        if("TCPA" == dataKey){
                            if(Number.parseFloat(dataValue) > 30 || Number.parseFloat(dataValue) < 1){
                                checkMsg = "请输入正确分钟";
                                checkFlag = false;
                                return false;
                            }
                        }
                        if("highDCPA" == dataKey || "lowDCPA" == dataKey){
                            if(Number.parseFloat(dataValue) > 10 || Number.parseFloat(dataValue) < 1){
                                checkMsg = "请输入正确的海里";
                                checkFlag = false;
                                return false;
                            }
                        }
                    }
                });

                if(!checkFlag){
                    layer.msg(checkMsg, {icon: 2, time: _config.msgTime});
                    return;
                }

                paramData.events = Object.values(tmpEvents);
                paramData.main.eventType = $("#eventTypes").val();
                console.log(paramData)
                //todo
                paramData.main.fenceName = $("#electronicFenceName").val();
                paramData.main.alertFlag = $('.alertSwitch:checked').val() ? 1 : 0;
                paramData.main.shapeType = $('.drawType:checked').val() == "Polygon" ? 3 : $('.drawType:checked').val() == "Circle" ? 2 : 1;
                paramData.main.fencePosition = $('.drawType:checked').val() == "Circle" ? JSON.stringify([{
                    lat: currentPoly._latlng.lat, lng: currentPoly._latlng.lng
                }]) : JSON.stringify(currentPoly._latlngs[0]);
                paramData.main.fencePosition2 = $('.drawType:checked').val() == "Circle" ? JSON.stringify([{
                    lat: mediumAlertPoly._latlng.lat, lng: mediumAlertPoly._latlng.lng
                }]) : JSON.stringify(mediumAlertPoly._latlngs[0]);
                paramData.main.fencePosition3 = $('.drawType:checked').val() == "Circle" ? JSON.stringify([{
                    lat: lowAlertPoly._latlng.lat, lng: lowAlertPoly._latlng.lng
                }]) : JSON.stringify(lowAlertPoly._latlngs[0]);
                if ($('.drawType:checked').val() == "Circle") {
                    paramData.main.circlePoint = JSON.stringify({
                        lat: currentPoly._latlng.lat, lng: currentPoly._latlng.lng
                    })

                    paramData.main.circleRadius = Number($("#shapeRadius").val())
                    paramData.main.circleRadius2 = Number($("#meduimAlert").val()) == 0 ? 0 : Number($("#meduimAlert").val()) + Number($("#shapeRadius").val())
                    paramData.main.circleRadius3 = Number($("#lowAlert").val()) == 0 ? 0 : Number($("#lowAlert").val()) + Number($("#meduimAlert").val()) + Number($("#shapeRadius").val())
                }
                paramData.main.middleMile = Number(data.field.meduimAlert);
                paramData.main.lowMile = Number(data.field.lowAlert);
                if (paramData.main.middleMile <= 0) {
                    paramData.main.fencePosition2 = "[]"
                }
                if (paramData.main.lowMile <= 0) {
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
                } else {
                    let count = 0;
                    _admin.reqSync('fishingPort60-api/electricFence/queryNameCount', {fenceName: paramData.main.fenceName}, function (res) {
                        count = res.datas;
                    }, 'GET', false, false);
                    if (count > 0) {
                        layer.msg("预警名称重复", {icon: 2, time: 3000});
                        return;
                    }
                }
                _admin.reqNoLoad(url, JSON.stringify(paramData), function (res) {
                    clearAll();
                    layer.close(electronicFenceLayerDetailIndex);
                    electronicFenceLayerDetailIndex = null;
                    electronicFenceTableDataReload();
                    getWarningArea(_map, _admin, _allRiskArea);
                }, 'POST', false, false)

            });

            $(layero).find("input").val("");
            $(layero).find("select").val("");
        }
    });
}

function electronicFenceTable(data) {

    _admin.reqNoLoad("fishingPort60-api/electricFence/show", data, function (res) {
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
                        if (!item.main.fencePosition) {
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
                    alertFlag: item.main.alertFlag,
                    //fss
                    vhfFlag: item.main.vhfFlag,
                    lowAlert: item.main.lowMile,
                    lowAlertContent: item.lowLevel.msgPattern,
                    lowAlertVHFContent: item.lowLevel.msgPattern2,
                    circlePoint: item.main.circlePoint,
                    circleRadius: item.main.circleRadius,
                    circleRadius2: item.main.circleRadius2,
                    circleRadius3: item.main.circleRadius3,
                    eventType: item.main.eventType,
                })

            })
            _table.render({
                elem: '#electronicFence-table',
                data: arr,
                limit: 100000,
                height: 350,
                page: false,
                cols: [[
                    {title: "序号", type: "numbers", align: 'center'},
                    {field: 'electronicFenceName', title: '名称', align: 'left', width: 300},
                    {
                        title: '类型', align: 'left', field: 'eventType', width: 186, templet: function (d) {
                            return eventTemplate.events[d.eventType].eventName;
                        }
                    },
                    {title: '操作', align: 'left', toolbar: '#electronicFence-table-bar', width: 80},
                    // {fixed: 'right', align: 'left', toolbar: '#electronicFence-table-bar', title: '操作'},
                ]]
            });
            //fss 0116
            //切换
            _form.on('switch(vhfCheck)', function (obj) {
                var dataJson = {
                    main: {}
                }
                dataJson.main.fenceId = obj.value,
                    dataJson.main.vhfFlag = obj.elem.checked ? 1 : 0

                layer.confirm('确定切换VHF语音播报？', {
                    btn: ['确定', '取消'] //按钮
                }, function () {
                    _admin.reqNoLoad('fishingPort60-api/electricFence/update', JSON.stringify(dataJson), function (data) {
                        layer.closeAll('loading');
                        if (data.code == 200) {
                            layer.msg("切换成功");
                        } else {
                            layer.msg("切换失败");
                        }
                        electronicFenceTableDataReload()
                    }, "POST", false, false);
                }, function () {
                    electronicFenceTableDataReload()
                });

            });
            _table.on('tool(electronicFence-table)', function (obj) {
                if (currentPoly.options) return;
                var data = obj.data; //获得当前行数据
                switch (obj.event) {
                    case 'electronicFenceInfoDetail':
                        closeWarningAreaLayer()
                        currentRowData = data
                        electronicFenceInfoDetail(editInit);
                        break;
                    case 'delElectronicFenceInfo':
                        _admin.reqNoLoad(``, '', function (res) {

                            if (res) {
                                _admin.reqNoLoad(`fishingPort60-api/electricFence/checkFence?id=${obj.data.fenceId}`, '', function (res) {
                                    var str = '确定删除此预警区域吗？'
                                    if (res.status == 1) {
                                        str = "此区域已有未恢复的告警事件，是否删除？"
                                    }
                                    layer.confirm(str, function (i) {
                                        layer.close(i);
                                        _admin.reqNoLoad(`fishingPort60-api/electricFence/del/${obj.data.fenceId}`, '', function (res) {
                                            electronicFenceTableDataReload()
                                            getWarningArea(_map, _admin, _allRiskArea);
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

}

function electronicFenceTableDataReload() {
    _admin.reqNoLoad("fishingPort60-api/electricFence/show", data, function (res) {
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
                    alertFlag: item.main.alertFlag,
                    //fss
                    vhfFlag: item.main.vhfFlag,
                    lowAlert: item.main.lowMile,
                    lowAlertContent: item.lowLevel.msgPattern,
                    lowAlertVHFContent: item.lowLevel.msgPattern2,
                    circlePoint: item.main.circlePoint,
                    circleRadius: item.main.circleRadius,
                    circleRadius2: item.main.circleRadius2 + item.main.circleRadius,
                    circleRadius3: item.main.circleRadius3 + item.main.circleRadius2 + item.main.circleRadius,
                    eventType: item.main.eventType
                })
            })

            _table.reload('electronicFence-table', {
                data: arr
            })
        }

    }, 'GET')
}

function closeElectronicFenceLayer(str) {
    if (str != "detail") {
        if (electronicFenceLayerCustomIndex != null) {
            layer.close(electronicFenceLayerCustomIndex);
            electronicFenceLayerCustomIndex = null;
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
    $("#event_template .events").empty();
    eventTemplate.choose = {};
    formsEventTypeChange($("#eventTypes").val());
    typeof resetDropMenus === 'function' && resetDropMenus();
    electronicFenceLayerDetailIndex = layer.open({
        type: 1
        , offset: ['110px', '43%']
        , id: 'electronicFenceLayerDetailLayer_id'
        , title: "预警信息"
        , content: $("#electronicFenceInfoDetailLayerCustom")
        , btn: ''
        , shade: 0
        , skin: 'layui-layer-lan'
        , area: ['400px']
        , resize: false
        , end: function () {
            closeElectronicFenceLayer("detail");
            getAllWarningArea(_map, _admin, _allRiskArea);
            electronicFenceLayerDetailIndex = null;
            no_close_model = 0
        },
        success: function () {
            no_close_model = 1;
            if ($('.drawType:checked').val() != 'Circle') $(".shapeRadius-container").hide()
        }
    });
    if (func) {
        formDisableCustom();
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

        // $("input:radio[name=drawType][value=Polygon]").attr("checked", true);
        // $("input:radio[name=drawType][value=Rectangle]").attr("checked", false);
        // $("input:radio[name=drawType][value=Circle]").attr("checked", false);
        $("input:radio[name=drawType][value=Polygon]").click()
        // $('.drawType').val('Polygon')
        _form.render('radio')
        $(".shapeRadius-container").hide()
        clearAll()
        shipTypeForStopDraw = 'Polygon'
        drawPoly('Polygon')
        hideAddAndReduce('Polygon')

        drawPoly()
        var meduimAlert = Number($("#meduimAlert").val())
        if (!meduimAlert) {
            $("#meduimAlertContent").val("")
            $("#meduimAlertVHFContent").val("")
            $("#meduimAlertContent").attr("disabled", "disabled")
            $("#meduimAlertVHFContent").attr("disabled", "disabled")
        } else {
            $("#meduimAlertContent").removeAttr("disabled")
            $("#meduimAlertVHFContent").removeAttr("disabled")
        }
        var lowAlert = Number($("#lowAlert").val())
        if (!lowAlert) {
            $("#lowAlertContent").val("")
            $("#lowAlertVHFContent").val("")
            $("#lowAlertContent").attr("disabled", "disabled")
            $("#lowAlertVHFContent").attr("disabled", "disabled")
        } else {
            $("#lowAlertContent").removeAttr("disabled")
            $("#lowAlertVHFContent").removeAttr("disabled")

        }
    }
    _form.on("radio(drawType)", function (data) {
        if (data.value != 'Circle') {
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
    if ($('.drawType:checked').val() == 'Circle') {
        tempData.latlng = [[currentPoly._latlng]]
    } else {
        tempData.latlng[0].forEach((item, index) => {
            item.index = index
        })
    }

    var gettpl = document.getElementById('eFenceTemplate2').innerHTML;
    _laytpl(gettpl).render(tempData, function (html) {
        document.getElementById('eFenceView').innerHTML = html;
        $(".dfm").dfm();
        if (currentRowData.fenceId) {
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
    var meduimAlert = Number($("#meduimAlert").val())
    if (!meduimAlert) {
        $("#meduimAlertContent").val("")
        $("#meduimAlertVHFContent").val("")
        $("#meduimAlertContent").attr("disabled", "disabled")
        $("#meduimAlertVHFContent").attr("disabled", "disabled")
    } else {
        $("#meduimAlertContent").removeAttr("disabled")
        $("#meduimAlertVHFContent").removeAttr("disabled")
    }

    if ($('.drawType:checked').val() == 'Circle') {
        getExpandCircle([currentPoly._latlng], currentPoly._mRadius, Number($('#meduimAlert').val()), 'medium')
        getExpandCircle([currentPoly._latlng], currentPoly._mRadius, Number($('#lowAlert').val()) + Number($('#meduimAlert').val()), 'low')
    } else {
        var tempArr = []
        if (currentPoly && currentPoly.options) {
            currentPoly._latlngs[0].forEach(item => {
                tempArr.push({latitude: item.lat, longitude: item.lng})
            })
        }


        getMediumExpandPolygon(tempArr, Number($('#meduimAlert').val()))
        getLowExpandPolygon(tempArr, Number($('#lowAlert').val()) + Number($('#meduimAlert').val()))
    }


}

function distLowChange() {
    var lowAlert = Number($("#lowAlert").val())
    if (!lowAlert) {
        $("#lowAlertContent").val("")
        $("#lowAlertVHFContent").val("")
        $("#lowAlertContent").attr("disabled", "disabled")
        $("#lowAlertVHFContent").attr("disabled", "disabled")
    } else {
        $("#lowAlertContent").removeAttr("disabled")
        $("#lowAlertVHFContent").removeAttr("disabled")

    }
    if ($('.drawType:checked').val() == 'Circle') {
        getExpandCircle([currentPoly._latlng], currentPoly._mRadius, Number($('#lowAlert').val()) + Number($('#meduimAlert').val()), 'low')

    } else {
        var tempArr = []
        if (currentPoly && currentPoly.options) {
            currentPoly._latlngs[0].forEach(item => {
                tempArr.push({latitude: item.lat, longitude: item.lng})
            })
        }
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
    if (type == "medium") {
        if (mediumAlertPoly && mediumAlertPoly.options) {
            mediumAlertPoly.remove()
            mediumAlertPoly = {}
        }
        mediumAlertPoly = L.circle(data[0], {
            radius: radius + NmiToM(dist)
            , className: 'dashLines'
            , color: 'yellow'
        }).addTo(_map);
    } else {
        if (lowAlertPoly && lowAlertPoly.options) {
            lowAlertPoly.remove()
            lowAlertPoly = {}
        }
        lowAlertPoly = L.circle(data[0], {
            radius: radius + NmiToM(dist)
            , className: 'dashLines-green'
            , color: 'blue'

        }).addTo(_map);
    }

}

function eFencePointChange() {
    var arrTemp = []
    if ($('.drawType:checked').val() == 'Circle') {

        var lat = Number($(".lat").dfm().val());
        var lng = Number($(".lng").dfm().val());
        clearCurrentPoly()
        currentPoly = L.circle([lat, lng], {
            color: 'rgb(238,0,46)',
            radius: NmiToM($("#shapeRadius").val())
        }).addTo(_map)
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
        $(".point-list-item").each(function () {

            let lat = $(this).find(".lat").dfm().val();
            let lng = $(this).find(".lng").dfm().val();
            console.log(arrTemp)
            arrTemp.push([lat, lng]);

        });
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

        var gettpl = document.getElementById('eFenceTemplate2').innerHTML;
        _laytpl(gettpl).render({
            latlng: [[]]
        }, function (html) {
            document.getElementById('eFenceView').innerHTML = html;
            $(".dfm").dfm();
        });
    }
}

function watchDrawFinish(poly) {
    if (eFenceEditingFlag) {
        if ($('.drawType:checked').val() == 'Circle') {
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

    // _admin.reqNoLoad("fishingPort60-api/electricFence/event/show", '', function (res) {
    //     if (res.datas) {

    _table.render({
        elem: '#electronicHistory-table',
        // data: res.datas,
        limit: 10,
        url: _config.base_server + 'fishingPort60-api/electricFence/event/show',
        // url: 'http://127.0.0.1.193:8610/electricFence/event/show',
        headers: {Authorization: 'Bearer ' + _config.getToken().access_token},
        page: {
            layout: ['limit', 'count', 'prev', 'page', 'next', 'skip'] //自定义分页布局
            //,curr: 5 //设定初始在第 5 页
            , limit: 10 //一页显示多少条
            , limits: [5, 10]//每页条数的选择项
            , groups: 2 //只显示 2 个连续页码
            , first: "首页" //不显示首页
            , last: "尾页" //不显示尾页
        },
        response: {
            statusName: 'resp_code' //规定数据状态的字段名称，默认：code
            , statusCode: 0 //规定成功的状态码，默认：0
            , resp_msg: 'resp_msg' //规定状态信息的字段名称，默认：msg
            , countName: 'total' //规定数据总数的字段名称，默认：count
            , dataName: 'records' //规定数据列表的字段名称，默认：data
        },
        request: {
            pageName: 'current' //页码的参数名称，默认：page
            , limitName: 'size' //每页数据量的参数名，默认：limit
        },
        cols: [[
            {title: "序号", type: "numbers", align: 'center', width: 50},
            // {field: 'shipName', title: '名称', align: 'left', width: 100},
            {field: 'mmsi', title: 'MMSI', align: 'left', width: 150},
            {
                field: 'eventTime', title: '开始时间', align: 'left', width: 200, templet: (d) => {
                    return d.eventTime ? parseTime(new Date(d.eventTime)) : ""
                }
            },
            {
                field: 'finishTime', title: '结束时间', align: 'left', width: 200, templet: (d) => {
                    return d.finishTime ? parseTime(new Date(d.finishTime)) : ""
                }
            },
            {field: 'fenceName', title: '预警区域名称', align: 'left', width: 150},
            {align: 'left', toolbar: '#eFenceHistoryToolbar', title: '详情', width: 90},
        ]],
        done: function (res, curr, count) {
            res.records.forEach(item => {
                item.eventTime = parseTime(item.eventTime)
                item.finishTime = parseTime(item.finishTime)
            })

            _table.on('tool(electronicHistory-table)', function (obj) {
                var data = obj.data;
                var layEvent = obj.event;
                if (layEvent === 'eFenceHistoryToolbarDetail') {
                    if (_trackplaybackControl && _trackplaybackControl._close) _trackplaybackControl._close()
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
                        , offset: [155, 376]
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
                            if (_trackplaybackControl && _trackplaybackControl._close) _trackplaybackControl._close()
                            $('.leaflet-bottom').css({
                                "display": 'flex'
                            })
                        }
                        , success: function (layero, index) {
                            $(".timelineExport").hide()
                            $(".timelineExportDisable").show()
                            $('.timelineExport').unbind('click')
                            $('.timelineExport').click(function () {
                                $(".timelineExport").hide()
                                $(".timelineExportDisable").show()
                                _exportExcel()
                            })

                        }
                    });


                }
            })


        }
    });
    electronicHistoryLayer = layer.open({
        type: 1
        , offset: "rt"
        , id: 'electronicHistoryLayer_id'
        , title: "船舶事件列表"
        , content: $('#electronicHistoryLayer')
        , btn: ''
        , shade: 0
        , skin: 'layui-layer-lan'
        , area: ['915px', '520px']
        , resize: false
        , scrollbar: false
        , cancel: function () {
            document.getElementById("eFencehistory").children[0].style.color = ""
            layer.close(electronicHistoryLayer);
            electronicHistoryLayer = ""
        }
        , success: function (layero, index) {
            console.log(layero)
            layer.style(index, {
                left: $(layero).offset().left - 20,
                top: 110,
            });
        }
    });
//    console.log(electronicHistoryLayer);
    // }

    // }, 'GET', false, false)


}

function eFenceAlert(map, admin, table, config, form, laytpl,) {
    _admin = admin;
    _table = table;
    _config = config;
    _map = map;
    _form = form;
    _laytpl = laytpl;
    initEventTemplate();
    // _admin.reqNoLoad("fishingPort60-api/electricFence/alarm/show", '', function (res) {
    //fss
    $('#electronicName-btn-search').click(function () {
        var fenceName = $('#electronicName').val();
        var eventType = $('#selectEventType').val();
        var warningTime = $('#warningTime').val();
        var alertContent = $('#alertContent').val();
        var startTime = "";
        var endTime = "";
        var time = warningTime.trim().split("-");
        startTime = time[0];
        endTime = time[1];
        _table.reload('electronicAlert-table', {
            where: {
                fenceName: fenceName,
                startTime: startTime,
                endTime: endTime,
                eventType: eventType,
                alertContent: alertContent
            },
            page: {curr: 1}
        });
    })
    //fss
    _eFenceAlertTable = _table.render({
        elem: '#electronicAlert-table',
        // data: res.datas.datas,
        limit: 10,
        url: _config.base_server + 'fishingPort60-api/electricFence/alarm/show',
        // url: 'http://127.0.0.1:8610/electricFence/alarm/show',
        headers: {Authorization: 'Bearer ' + _config.getToken().access_token},
        page:
            {
                layout: ['limit', 'count', 'prev', 'page', 'next', 'skip'] //自定义分页布局
                //,curr: 5 //设定初始在第 5 页
                , limit: 10 //一页显示多少条
                , limits: [5, 10]//每页条数的选择项
                , groups: 2 //只显示 2 个连续页码
                , first: "首页" //不显示首页
                , last: "尾页" //不显示尾页
            },
        // response: {
        //     statusName: 'code' //规定数据状态的字段名称，默认：code
        //     , statusCode: 0 //规定成功的状态码，默认：0
        //     , resp_msg: 'resp_msg' //规定状态信息的字段名称，默认：msg
        //     , countName: 'total' //规定数据总数的字段名称，默认：count
        //     , dataName: 'records' //规定数据列表的字段名称，默认：data
        // },
        // request: {
        //     pageName: 'current' //页码的参数名称，默认：page
        //     , limitName: 'size' //每页数据量的参数名，默认：limit
        // },
        cols: [[
            {title: "序号", type: "numbers", align: 'center'},
            // {field: 'shipName', title: '名称', align: 'center', width: 100},
            {field: 'mmsi', title: 'MMSI', align: 'left', width: 110},
            {field: 'fenceName', title: '预警区域名称', align: 'left', width: 200},
            {
                title: '类型', align: 'left', field: 'eventType', width: 150, templet: function (d) {
                    return eventTemplate.events[d.eventType].eventName;
                }
            },
            {
                field: 'longitude', title: '经度', align: 'left', width: 90, templet: (d) => {
                    return Math.round((d.longitude) * 10000) / 10000
                }
            },
            {
                field: 'latitude', title: '纬度', align: 'left', width: 90, templet: (d) => {
                    return Math.round((d.latitude) * 10000) / 10000
                }
            },
            {
                field: 'alarmLevel', title: '告警级别', align: 'left', width: 100, templet: (d) => {
                    if (d.alarmLevel == 1) {
                        return "高"
                    } else if (d.alarmLevel == 2) {
                        return "中"
                    } else if (d.alarmLevel == 3) {
                        return "低"
                    }
                }
            },
            {
                field: 'alarmTime', title: '开始时间', align: 'left', width: 170, templet: (d) => {
                    return d.alarmTime ? parseTime(new Date(d.alarmTime)) : ""
                }
            },
            {
                field: 'resumeTime', title: '结束时间', align: 'left', width: 170, templet: (d) => {
                    return d.resumeTime ? parseTime(new Date(d.resumeTime)) : ""
                }
            },
            {
                field: 'alertContent', title: '预警内容', align: 'left', width: 200, templet: function (d) {
                    let str = d.alertContent == null ? "" : d.alertContent;
                    return `<label class="remarksDom">${str}</label>`
                }
            },
            {
                field: 'handleSuggestion', title: '确认内容', align: 'left', width: 200, templet: function (d) {
                    let str = d.handleSuggestion == null ? (d.comment || "") : d.handleSuggestion;

                    return `<label class="remarksDom">${str}</label>`
                }
            },
            {align: 'left', templet: '#eFenceHistoryToolbarForAlert', title: '操作', width: 80},
        ]],
        done: function (res, curr, count) {

            // layui.form.render()
            table = res.data;
            res.data.forEach(item => {
                item.alarmTime = parseTime(item.alarmTime)
                item.resumeTime = parseTime(item.resumeTime)
            })
            _table.on('tool(electronicAlert-table)', function (data) {
                if (data.event == "eFenceHistoryToolbarDetail1") {
                    $("#eFenceHistoryToolbarDetailCommentId").val(data.data.alarmId)
                    $("#eFenceHistoryToolbarDetailComment").val(data.data.handleSuggestion)
                    var layerCustom = layer.open({
                        type: 1
                        , offset: [155, 1286]
                        , id: 'eFenceHistoryToolbarDetail1Process_id'
                        , title: "确认告警"
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
                            _form.on('submit(eFenceHistoryToolbarDetailSave)', function (data) {
                                _admin.reqNoLoad('fishingPort60-api/electricFence/alarm/handle', JSON.stringify({
                                    handleSuggestion: data.field.eFenceHistoryToolbarDetailComment,
                                    alarmId: $("#eFenceHistoryToolbarDetailCommentId").val(),
                                }), function (result) {

                                    // _admin.reqNoLoad("fishingPort60-api/electricFence/alarm/show", '', function (result2) {
                                    //     result2.datas.datas.forEach(item => {
                                    //         item.alarmTime = parseTime(item.alarmTime)
                                    //         item.resumeTime = parseTime(item.resumeTime)
                                    //     })
                                    //     _table.reload('electronicAlert-table', {
                                    //         data: result2.datas.datas
                                    //     })
                                    // }, 'GET', false, false)
                                    layer.msg('处理成功', {icon: 1, time: _config.msgTime});
                                    _eFenceAlertTable.reload({
                                        url: _config.base_server + 'fishingPort60-api/electricFence/alarm/show',
                                    })
                                    layer.close(layerCustom);

                                }, 'POST', false, false)
                            })
                        }
                    });
                } else if (data.event == "eFenceHistoryToolbarDetail2") {
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
                    // _admin.reqNoLoad('fishingPort60-api/signedMode', JSON.stringify({
                    //     messageAsk: {
                    //         shipMmsi: data.data.mmsi
                    //     },
                    //     alarmId: data.data.alarmId,
                    // }), function (result) {
                    //     layer.open({
                    //         type: 1
                    //         , offset: [155, 410]
                    //         , id: 'buzhidaogansha_id'
                    //         , title: "船舶指配"
                    //         , content: $('#buzhidaogansha')
                    //         , btn: ''
                    //         , shade: 0
                    //         , skin: 'layui-layer-lan'
                    //         , area: ['650px', '350px']
                    //         , resize: false
                    //         , scrollbar: false
                    //         , cancel: function () {
                    //
                    //         }
                    //         , success: function (layero, index) {
                    //
                    //         }
                    //     });
                    // }, 'POST', false, false)
                    _signedModeLayer = layer.open({
                        type: 1
                        , offset: [155, 410]
                        , id: 'buzhidaogansha_id'
                        , title: "船舶指配"
                        , content: $('#buzhidaogansha')
                        , btn: ''
                        , shade: 0
                        , skin: 'layui-layer-lan'
                        , area: ['650px', '450px']
                        , resize: false
                        , scrollbar: false
                        , cancel: function () {

                        }
                        , success: function (layero, index) {

                        }
                    });
                }
            })
        }
    });

    //鼠标经过提示
    // 1.找到触发的事件对象（绑定全局）  2.事件处理程序
    $('body').on('mouseover', '.remarksDom', function () {
        var ovText = $(this).text();
        //内容超出长度显示弹层，否则无需弹层
        if (ovText.length < 16) {
            return;
        }
        var html = "<p style='word-wrap:break-word;width: 150px;'>" + ovText + "</p>";
        let tipsVal = layer.tips(html, this, {tips: [1, "rgb(58, 61, 73)"]});
        $(this).data("tipsVal", tipsVal);
    });
    //鼠标移出
    $('body').on('mouseout', '.remarksDom', function () {
        let tipsVal = $(this).data("tipsVal");
        if (tipsVal) {
            layer.close(tipsVal);
            $(this).removeData("tipsVal");
        }

    });

    // }, 'GET', false, false)
    electronicAlertLayer = layer.open({
        type: 1
        , offset: 'rt'
        , id: 'electronicAlertLayer_id'
        , title: "风险告警列表"
        , content: $('#electronicAlertLayer')
        , btn: ''
        , shade: 0
        , skin: 'layui-layer-lan'
        , area: ['1620px', '590px']
        , resize: false
        , scrollbar: false
        , end: function () {
            $("#eFenceAlert").removeClass("active")
            layer.close(electronicAlertLayer);
            electronicAlertLayer = ""
        }
        , success: function (layero, index) {
            layer.style(index, {
                left: $(layero).offset().left - 20,
                top: 110,
            })
            $(layero).find("input").val("");
            $(layero).find("select").val("");
        }
    });
    _form.on('submit(assignSave)', function (data) {
        var data = JSON.stringify({
            messageAsk: {
                shipMmsi: data.field.assignShipMMSI,
                channel: data.field.channel,
                slotIncrement: data.field.slotIncrement,
                slotStart: data.field.slotStart,
                slotOffset: data.field.slotOffset,
            },
            alarmId: data.field.assignAlarmId,
        })
        //调用指配接口
        _admin.reqNoLoad('fishingPort60-api/signedMode', data, function (result) {
            layer.msg('指配成功', {icon: 1, time: _config.msgTime});
            // _eFenceAlertTable.reload({
            //     url: _config.base_server + 'fishingPort60-api/electricFence/alarm/show',
            // })
            layer.close(_signedModeLayer)
        }, 'POST', false, false)
    });
}

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
                if (_trackplayback.tracks) {
                    _trackplayback.dispose();
                    _trackplayback.off('tick', this._tickCallback, this);
                    _trackplaybackcomplate.dispose();
                }

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
                    logging: false,
                    useCORS: true,
                    allowTaint: true,
                    // foreignObjectRendering: true
                    ignoreElements: (element) => {
                        if (element.id == "map" || element.id == "") {
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
                    $('.leaflet-bottom').css({
                        "display": 'flex'
                    })
                });
            }, 600)

        }
    }, 'POST');
}

function _exportExcel() {


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
            const fileName = parseTime(new Date()) + '-事件.xlsx'
            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            $(".timelineExport").show()
            $(".timelineExportDisable").hide()
        }
    }
}

function mToNmi(data) {
    return (data / 1852).toFixed(4)
}

function NmiToM(data) {
    return data * 1852
}

function electronicFenceAlertReload() {
    _admin.reqNoLoad("fishingPort60-api/electricFence/show", data, function (res) {
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


function getWarningArea(map, admin, allRiskArea) {
    _admin = admin;
    _map = map;
    closeWarningAreaLayer();
    admin.req('fishingPort60-api/electricFence/show', data, function (res) {
        for (var i = 0; i < res.datas.length; i++) {
            var electricFenceData = res.datas[i].main;
            var shapeType = electricFenceData.shapeType;
            var keyIndex = electricFenceData.eventType == "FCW" ? "fcw" : electricFenceData.eventType;
            var arrTemp = []
            var arrTemp2 = []
            var arrTemp3 = []
            var value = allRiskArea[keyIndex];
            if (keyIndex != value) {
                continue;
            }
            if (shapeType == 3 || shapeType == 1) {
                JSON.parse(electricFenceData.fencePosition).forEach(item => {
                    arrTemp.push([item.lat, item.lng]);
                })
                L.polygon(arrTemp, {color: 'rgb(238,0,46)', polyType: 'Polygon', pane: 'fencewarn'}).addTo(warningAreaLayer);

                if (electricFenceData.fencePosition2 == '[]') {
                    JSON.parse(electricFenceData.fencePosition).forEach(item => {
                        arrTemp2.push([item.lat, item.lng]);
                    })
                } else {
                    JSON.parse(electricFenceData.fencePosition2).forEach(item => {
                        arrTemp2.push([item.lat, item.lng]);
                    })
                }
                L.polygon(arrTemp2, {
                    color: 'yellow',
                    className: 'dashLines',
                    polyType: 'Polygon',
                    pane: 'fencewarn'
                }).addTo(warningAreaLayer);

                if (electricFenceData.fencePosition3 == '[]' && electricFenceData.fencePosition2 == '[]') {
                    JSON.parse(electricFenceData.fencePosition).forEach(item => {
                        arrTemp3.push([item.lat, item.lng]);
                    })
                } else if (electricFenceData.fencePosition3 == '[]') {
                    JSON.parse(electricFenceData.fencePosition2).forEach(item => {
                        arrTemp3.push([item.lat, item.lng]);
                    })
                } else {
                    JSON.parse(electricFenceData.fencePosition3).forEach(item => {
                        arrTemp3.push([item.lat, item.lng]);
                    })
                }
                L.polygon(arrTemp3, {
                    color: 'blue',
                    className: 'dashLines-green',
                    polyType: 'Polygon',
                    pane: 'fencewarn'
                }).addTo(warningAreaLayer);
            } else {
                var circlePoint = JSON.parse(electricFenceData.circlePoint);
                L.circle(circlePoint, {
                    color: 'rgb(238,0,46)',
                    radius: NmiToM(electricFenceData.circleRadius),
                    pane: 'fencewarn'
                }).addTo(warningAreaLayer)

                L.circle(circlePoint, {
                    color: 'yellow',
                    className: 'dashLines',
                    radius: NmiToM(electricFenceData.circleRadius2 == 0 ? electricFenceData.circleRadius : electricFenceData.circleRadius2),
                    pane: 'fencewarn'
                }).addTo(warningAreaLayer)

                L.circle(circlePoint, {
                    color: 'blue',
                    className: 'dashLines-green',
                    pane: 'fencewarn',
                    radius: NmiToM(electricFenceData.circleRadius3 == 0 && electricFenceData.circleRadius2 == 0 ? electricFenceData.circleRadius : electricFenceData.circleRadius3 == 0 ? electricFenceData.circleRadius2 : electricFenceData.circleRadius3)
                }).addTo(warningAreaLayer)
            }

        }
        warningAreaLayer.addTo(_map);
    }, 'GET');
}

function getAllWarningArea(map, admin, allRiskArea) {
    _admin = admin;
    _map = map;
    closeWarningAreaLayer();
    var data = {
        fenceName: "",
        eventType: "",
    };
    admin.req('fishingPort60-api/electricFence/show', data, function (res) {
        for (var i = 0; i < res.datas.length; i++) {
            var electricFenceData = res.datas[i].main;
            var shapeType = electricFenceData.shapeType;
            var keyIndex = electricFenceData.eventType == "FCW" ? "fcw" : electricFenceData.eventType;
            var arrTemp = []
            var arrTemp2 = []
            var arrTemp3 = []
            var value = allRiskArea[keyIndex];
            if (keyIndex != value) {
                continue;
            }
            if (shapeType == 3 || shapeType == 1) {
                JSON.parse(electricFenceData.fencePosition).forEach(item => {
                    arrTemp.push([item.lat, item.lng]);
                })
                L.polygon(arrTemp, {color: 'rgb(238,0,46)', polyType: 'Polygon', pane: 'fencewarn'}).addTo(warningAreaLayer);

                if (electricFenceData.fencePosition2 == '[]') {
                    JSON.parse(electricFenceData.fencePosition).forEach(item => {
                        arrTemp2.push([item.lat, item.lng]);
                    })
                } else {
                    JSON.parse(electricFenceData.fencePosition2).forEach(item => {
                        arrTemp2.push([item.lat, item.lng]);
                    })
                }
                L.polygon(arrTemp2, {
                    color: 'yellow',
                    className: 'dashLines',
                    polyType: 'Polygon',
                    pane: 'fencewarn'
                }).addTo(warningAreaLayer);

                if (electricFenceData.fencePosition3 == '[]' && electricFenceData.fencePosition2 == '[]') {
                    JSON.parse(electricFenceData.fencePosition).forEach(item => {
                        arrTemp3.push([item.lat, item.lng]);
                    })
                } else if (electricFenceData.fencePosition3 == '[]') {
                    JSON.parse(electricFenceData.fencePosition2).forEach(item => {
                        arrTemp3.push([item.lat, item.lng]);
                    })
                } else {
                    JSON.parse(electricFenceData.fencePosition3).forEach(item => {
                        arrTemp3.push([item.lat, item.lng]);
                    })
                }
                L.polygon(arrTemp3, {
                    color: 'blue',
                    className: 'dashLines-green',
                    polyType: 'Polygon',
                    pane: 'fencewarn'
                }).addTo(warningAreaLayer);
            } else {
                var circlePoint = JSON.parse(electricFenceData.circlePoint);
                L.circle(circlePoint, {
                    color: 'rgb(238,0,46)',
                    radius: NmiToM(electricFenceData.circleRadius),
                    pane: 'fencewarn'
                }).addTo(warningAreaLayer)

                L.circle(circlePoint, {
                    color: 'yellow',
                    className: 'dashLines',
                    radius: NmiToM(electricFenceData.circleRadius2 == 0 ? electricFenceData.circleRadius : electricFenceData.circleRadius2),
                    pane: 'fencewarn'
                }).addTo(warningAreaLayer)

                L.circle(circlePoint, {
                    color: 'blue',
                    className: 'dashLines-green',
                    pane: 'fencewarn',
                    radius: NmiToM(electricFenceData.circleRadius3 == 0 && electricFenceData.circleRadius2 == 0 ? electricFenceData.circleRadius : electricFenceData.circleRadius3 == 0 ? electricFenceData.circleRadius2 : electricFenceData.circleRadius3)
                }).addTo(warningAreaLayer)
            }

        }
        warningAreaLayer.addTo(_map);
    }, 'GET');
}


//图层关闭方法
function closeWarningAreaLayer() {
    _map.removeLayer(warningAreaLayer);
    warningAreaLayer.clearLayers();
}

function initElectronicFenceNewDefence(map, admin, form) {
    _admin = admin;
    _form = form;
    initEventTemplate();
}

function initEventTemplate() {
    if (eventTemplate.events == null)
        _admin.reqSync('fishingPort60-api/api/geoFence/getTemplate', {}, function (res) {
            eventTemplate.events = {};
            eventTemplate.template = {};
            res.events.forEach(function (item) {
                eventTemplate.events[item.eventType] = item;
                eventTemplate.template[item.eventType] = [];
            });
            res.template.forEach(function (item) {
                eventTemplate.template[item.eventType].push(item);
            });
            _form.on('select(eventTypes)', function (data) {
                formsEventTypeChange(data.value);
            });
            $("#eventTypes").empty()
            Object.values(eventTemplate.events).forEach(function (item) {
                $("#event_template #eventTypes").append(`<option value="${item.eventType}">${item.eventName}</option>`);
                $("#eventTypeSelect").append(`<option value="${item.eventType}">${item.eventName}</option>`);
                $("#selectEventType").append(`<option value="${item.eventType}">${item.eventName}</option>`);
            });
            layui.form.render()
        }, "GET", false, false);


}

function initFormsTemplateValue() {
    //currentRowData.height

}

/**动态表单,事件类型切换**/
function formsEventTypeChange(eventType = null, formsData = [], editing = false) {
    if (eventType == null) {
        return;
    }
    let event = eventTemplate.events[eventType];
    let template = eventTemplate.template[eventType];
    let formsDataMap = {};
    formsData.forEach(function (item) {
        formsDataMap[item.dataKey] = item;
    })
    formsTemplate(template, event, formsDataMap, editing);
}

function formsTemplate(templateArray, eventType, formsDataMap = {}, editing = false) {
    let targetDome = $("#event-forms");
    targetDome.empty();
    if (eventType.eventType === "enter") {
        $('.event-enter').show();
    } else {
        $(".event-enter").hide();

        function genRequireFilter(item) {

            let filter = [];
            if (isRequired(item))
                filter.push("required");
            if (item.dataFormVerify)
                filter.push(item.dataFormVerify)

            return filter.join("|");
        }

        function isReadonly(item) {
            return editing && (item.state & 0b001) == 0
        }

        function isRequired(item) {
            return item.state >> 2 & 0b001 == 1;
        }

        let template = {
            input: function (item, targetDom, formValue) {
                item.dataRules ? "onkeyup=\"value=value.replace(item.dataRules,'')\"" : "";
                let me = $(eval("`" + $("#tmp_input").text() + "`"));
                me.appendTo(targetDom)
                    .find("input").val(formValue[item.dataKey].dataValue)
                    .change(function () {
                        formValue[item.dataKey].dataValue = $(this).val();
                        change(formValue, item);
                    });
                return me;
            },
            checkbox: function (item, targetDom, formValue) {
                console.error("修改后结构后,没适配")
                var me = $(eval("`" + $("#tmp_checkbox").text() + "`"));
                item.dataRules.split(",").forEach(function (t) {
                    let arr = t.split("=");
                    let checked = arr[0] === item.defValue ? "checked" : "";
                    $(`<input type="checkbox" name="${item.dataKey}" value="${arr[0]}" title="${arr[1]}" ${checked} >`)
                        .appendTo(me.find(".layui-input-block"))
                });
                me.appendTo(targetDom);
                me.on("click", ".layui-unselect.layui-form-checkbox", function () {
                    let dataArray = [];
                    me.find(`[name=${item.dataKey}]:checked`).each(function (index, ele) {
                        dataArray.push($(ele).val())
                    });
                    formValue[item.dataKey].dataValue = dataArray.join(",");
                    change(formValue, item);
                });
                return me;
            },
            radio: function (item, targetDom, formValue) {
                console.error("修改后结构后,没适配")
                var me = $(eval("`" + $("#tmp_radio").text() + "`"));
                item.dataRules.split(",").forEach(function (t) {
                    let arr = t.split("=");
                    let checked = arr[0] === item.defValue ? "checked" : "";
                    me.find(".layui-input-block").append(`<input type="radio" name="${item.dataKey}" value="${arr[0]}" title="${arr[1]}" ${checked} >`);
                });
                me.on("click", ".layui-unselect.layui-form-radio",
                    function () {
                        formValue[item.dataKey] = me.find('input:radio:checked').val();
                        change(formValue, item);
                    });
                me.appendTo(targetDom);

                return me;
            },
            select: function (item, targetDom, formValue) {
                console.error("修改后结构后,没适配")
                let me = $(eval("`" + $("#tmp_select").text() + "`"));
                item.dataRules.split(",").forEach(function (item) {
                    let arr = item.split("=");
                    me.find("select").append(`<option value="${arr[0]}">${arr[1]}</option>`);
                });
                me.find("select").val(formValue[item.dataKey] || item.defValue)
                    .change(function () {
                        formValue[item.dataKey] = $(this).val();
                        change(formValue, item);
                    })
                    .val(item.defValue);
                me.appendTo(targetDom);
                return me;
            }
        }
        templateArray.sort(function (a, b) {
            return a.sort - b.sort;
        }).forEach(function (tmp) {
            let itemTarget;
            if (tmp.dataGroup) {
                itemTarget = targetDome.find(`.dynamic-form-group.dynamic-form-group-${tmp.dataGroup}`);
                if (itemTarget.length == 0) {
                    itemTarget = $(eval("`" + $("#tmp_data_group").text() + "`")).appendTo(targetDome);
                }
                itemTarget = itemTarget.find(".layui-field-box");
            } else {
                itemTarget = targetDome;
            }
            let currentData = formsDataMap[tmp.dataKey];
            if (typeof currentData == "undefined")
                formsDataMap[tmp.dataKey] = currentData = {
                    dataKey: tmp.dataKey,
                    dataValue: tmp.defValue,
                    eventType: eventType.eventType,
                    id: "",
                    version: 0
                };

            let tmpBox = $(eval("`" + $("#tmp_box").text() + "`")).appendTo(itemTarget);
            tmpBox.data("data-event-type", tmp);
            tmpBox.attr("x-modified", tmp.state & 0b001);
            tmpBox.attr("x-visibility", tmp.state >> 1 & 0b001);
            tmpBox.attr("x-required", tmp.state >> 2 & 0b001);

            let dom = template[tmp.dataType](tmp, tmpBox, formsDataMap);
            if ((tmp.state >> 1 & 0b1) !== 1)
                dom.hide();
        });

        function change(formValue, itemTemplate) {
            console.log(formValue, itemTemplate)
        }
    }
    _form.render()
}