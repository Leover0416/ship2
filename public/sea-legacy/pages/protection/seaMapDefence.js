layui.config({
    base: '/module/', //静态资源所在路径
}).extend({
    //  myfleet:'js/myFleet',
}).use(['element', 'common', 'admin', 'form', 'table', 'laydate', 'util', 'laytpl'], function () {
    var $ = layui.$;
    var form = layui.form;
    var table = layui.table;
    var laydate = layui.laydate;
    var admin = layui.admin;
    var laytpl = layui.laytpl;
    var config = layui.common;
    var util = layui.util;
    var currentPoly = {};
    var shipTypeTemp = ''
    var shoreSendSafeMsg = false;
    //只显示我的船队开关
    var onlyShowMyfleet = false;
    //只显示我关注船舶开关
    var onlyShowMyCareShip = false;
    //只显示自有基站接收的消息
    var onlyShowOurStation = true;
    var longitude1 = '';
    var latitude1 = '';
    var longitude2 = '';
    var latitude2 = '';
    var oneShoreSendMessage;
    // 地图
    var map;
    var screenShot = ''

    // tile图层
    var tileLayer;
    // 临界缩放比例
    var limitZoom = 9;
    // 测距Control
    var measureControl = new L.control.polylineMeasure;
    // 轨迹回放control
    var trackplaybackControl;
    // 中心点Marker
    var centerPosition = new L.marker([0, 0], {
        icon: L.icon({
            iconUrl: '../../assets/images/location.png',
            iconSize: [16, 24],
            iconAnchor: [8, 12]
        }), interactive: true, draggable: true
    });

    // 热力图图层
    var heatmapLayer = null;

    // 船舶点图层
    var shipPointLayer = new L.layerGroup();
    // 船舶图层
    var shipLayer = new L.layerGroup();
    // 岸站图层
    var stationLayer = new L.layerGroup();
    // 助航设备图层
    var atonLayer = new L.layerGroup();
    // 船舶名称图层
    var shipNameLayer = new L.layerGroup();
    // 岸站名称图层
    var stationNameLayer = new L.layerGroup();
    // 助航设备图层
    var atonNameLayer = new L.layerGroup();
    // 网位仪点图层
    var fishingNetPointLayer = new L.layerGroup();
    // 网位仪图层
    var fishingNetLayer = new L.layerGroup();

    // 船舶详细弹出框
    var shipDetailLayer;
    // 被选船舶框图层
    var selectedShipLayer = new L.layerGroup();
    // 岸站详细弹出框
    var stationDetailLayer;
    // 助航设备详细弹出框
    var atonDetailLayer;
    // 网位仪详细弹出框
    var fishingNetDetailLayer;
    // 轨迹回放弹出层
    var trackListLayer;
    // 设置中心点弹出层
    var setCenterLayer;
    // 图例弹出层
    var legendLayer;
    // 选择区域坐标弹出层
    var rectangleMeasureLayer;
    // 船舶详细弹出层
    var targetLayer;
    // 显示元素船舶类型
    var layerControlLayer_shipType = 'AB';
    // 仅显示渔船 2022/7/12 lxy
    var onlyFishShip = false;
    // 显示元素船舶显示
    var layerControlLayer_shipTimeShow = 0;
    // 选择船舶MMSI;
    var selectedShipMMSI;
    // 船舶总数
    var shipCount = 0;
    // 船舶数据
    var shipData = [];

    // 岸站数据
    var stationData = [];
    var stationCount = 0;
    // 助航设备总数
    var atonCount = 0;
    // 网位仪总数
    var netCount = 0;
    // 助航设备数据
    var atonData = [];
    // 网位仪数据
    var fishingNetData = [];
    // 热力图数据
    var heatData = {
        max: 50,
        data: [{lat: 38.6408, lng: 118.7728, count: 3}, {lat: 38.75, lng: 118, count: 1}, {
            lat: 38.6333,
            lng: 118.75,
            count: 1
        }, {lat: 38.15, lng: 118.4667, count: 1}]
    };
    // 电子航标
    var virtualSet = {
        "0": "2",
        "1": "2",
        "3": "3",
        "4": "5",
        "5": "2",
        "6": "2",
        "7": "2",
        "8": "2",
        "9": "6",
        "10": "7"
        ,
        "11": "8",
        "12": "9",
        "13": "10",
        "14": "11",
        "15": "10",
        "16": "11",
        "17": "12",
        "18": "13",
        "19": "14",
        "20": "6"
        ,
        "21": "7",
        "22": "8",
        "23": "9",
        "24": "10",
        "25": "11",
        "26": "10",
        "27": "11",
        "28": "12",
        "29": "13",
        "30": "14"
        ,
        "31": "3"
    };
    // 实体航标
    var reallSet = {
        "0": "0", "1": "0", "3": "0", "4": "0", "5": "1", "6": "1", "7": "1", "8": "1", "9": "1", "10": "1"
        , "11": "1", "12": "1", "13": "1", "14": "1", "15": "1", "16": "1", "17": "1", "18": "1", "19": "1", "20": "2"
        , "21": "2", "22": "2", "23": "2", "24": "2", "25": "2", "26": "2", "27": "2", "28": "2", "29": "2", "30": "2"
        , "31": "2"
    };
    // 航标类型
    var atonType = {
        0: "默认值，未定义航标类型",
        1: "参考点",
        2: "雷康",
        3: "近海固定建筑物，如石油平台、风力发电场",
        4: "应急沉船示位标",
        5: "全向灯桩",
        6: "扇形光弧灯桩",
        7: "前引导灯桩",
        8: "后引导灯桩",
        9: "灯桩和立标（北方位）",
        10: "灯桩和立标（东方位）",
        11: "灯桩和立标（南方位）",
        12: "灯桩和立标（西方位）",
        13: "灯桩和立标（左侧标）",
        14: "灯桩和立标（右侧标）",
        15: "灯桩和立标（推荐航道左侧标）",
        16: "灯桩和立标（推荐航道右侧标）",
        17: "灯桩和立标（孤立危险物标志）",
        18: "灯桩和立标（安全水域标志）",
        19: "灯桩和立标（专用标志）",
        20: "北方位标",
        21: "东方位标",
        22: "南方位标",
        23: "西方位标",
        24: "左侧标",
        25: "右侧标",
        26: "推荐航道左侧标",
        27: "推荐航道右侧标",
        28: "孤立危险物标志",
        29: "安全水域标志",
        30: "专用标志",
        31: "灯船/LANBY/钻探平台",
    };
    // 国旗
    var Flags = {
        '201': 'ALB',
        '202': 'AND',
        '203': 'AUT',
        '204': 'AZS',
        '205': 'BEL',
        '206': 'BLR',
        '207': 'BGR',
        '208': 'VAT',
        '209': 'CYP',
        '210': 'CYP',
        '211': 'DEU',
        '212': 'CYP',
        '213': 'GEO',
        '214': 'MDA',
        '215': 'MLT',
        '216': 'ARM',
        '218': 'DEU',
        '219': 'DNK',
        '220': 'DNK',
        '224': 'ESP',
        '225': 'ESP',
        '226': 'FRA',
        '227': 'FRA',
        '228': 'FRA',
        '230': 'FIN',
        '231': 'FRO',
        '232': 'GBR',
        '233': 'GBR',
        '234': 'GBR',
        '235': 'GBR',
        '236': 'GIB',
        '237': 'GRC',
        '238': 'HRV',
        '239': 'GRC',
        '240': 'GRC',
        '242': 'MAR',
        '243': 'HUN',
        '244': 'NLD',
        '245': 'NLD',
        '246': 'NLD',
        '247': 'ITA',
        '248': 'MLT',
        '249': 'MLT',
        '250': 'IRL',
        '251': 'ISL',
        '252': 'LIE',
        '253': 'LUX',
        '254': 'MCO',
        '255': 'MDR',
        '256': 'MLT',
        '257': 'NOR',
        '258': 'NOR',
        '259': 'NOR',
        '261': 'POL',
        '262': 'MNE',
        '263': 'PRT',
        '264': 'ROU',
        '265': 'SWE',
        '266': 'SWE',
        '267': 'SVK',
        '268': 'SMR',
        '269': 'SWZ',
        '270': 'CZE',
        '271': 'TUR',
        '272': 'UKR',
        '273': 'RUS',
        '274': 'MKD',
        '275': 'LVA',
        '276': 'EST',
        '277': 'LTU',
        '278': 'SVN',
        '279': 'SRB',
        '301': 'AIA',
        '303': 'USA',
        '304': 'ATG',
        '305': 'ATG',
        '306': 'ANT',
        '307': 'ABW',
        '308': 'BHS',
        '309': 'BHS',
        '310': 'BMU',
        '311': 'BHS',
        '312': 'BLZ',
        '314': 'BRB',
        '316': 'CAN',
        '319': 'CYM',
        '321': 'CRI',
        '323': 'CUB',
        '325': 'DOM',
        '327': 'DOM',
        '329': 'GLP',
        '330': 'GRD',
        '331': 'GRL',
        '332': 'GTM',
        '334': 'HND',
        '336': 'HTI',
        '338': 'USA',
        '339': 'JAM',
        '341': 'KNA',
        '343': 'LCA',
        '345': 'MEX',
        '347': 'MTQ',
        '348': 'MSR',
        '350': 'NIC',
        '351': 'PAN',
        '352': 'PAN',
        '353': 'PAN',
        '354': 'PAN',
        '358': 'PRI',
        '359': 'SLV',
        '361': 'SPM',
        '362': 'TTO',
        '364': 'TCA',
        '366': 'USA',
        '367': 'USA',
        '368': 'USA',
        '369': 'USA',
        '371': 'PAN',
        '372': 'PAN',
        '375': 'VCT',
        '376': 'VCT',
        '377': 'VCT',
        '378': 'VGB',
        '379': 'VGB',
        '401': 'AFG',
        '403': 'SAU',
        '405': 'BGD',
        '408': 'BHR',
        '410': 'BTN',
        '412': 'CHN',
        '413': 'CHN',
        '414': 'CHN',
        //'416': 'TWN',//台湾省
        '416': 'undefined',//台湾省
        '417': 'LKA',
        '419': 'IND',
        '422': 'IRN',
        '423': 'AZE',
        '425': 'IRQ',
        '428': 'ISR',
        '431': 'JPN',
        '432': 'JPN',
        '434': 'TKM',
        '436': 'KAZ',
        '437': 'UZB',
        '438': 'JOR',
        '440': 'KOR',
        '441': 'KOR',
        '443': 'PSE',
        '445': 'PRK',
        '447': 'KWT',
        '450': 'LBN',
        '451': 'KGZ',
        '453': 'MAC',
        '455': 'MDV',
        '457': 'MNG',
        '459': 'NPL',
        '461': 'OMN',
        '463': 'PAK',
        '466': 'QAT',
        '468': 'SYR',
        '470': 'ARE',
        '473': 'YEM',
        '475': 'YEM',
        '477': 'HKG',
        '478': 'BIH',
        '501': 'ADL',
        '503': 'AUS',
        '506': 'MMR',
        '508': 'BRN',
        '510': 'FSM',
        '511': 'PLW',
        '512': 'NZL',
        '514': 'KHM',
        '515': 'KHM',
        '516': 'CXR',
        '518': 'COK',
        '520': 'FJI',
        '523': 'CCK',
        '525': 'IDN',
        '529': 'KIR',
        '531': 'LAO',
        '533': 'MYS',
        '536': 'MNP',
        '538': 'MHL',
        '540': 'NCL',
        '542': 'NIU',
        '544': 'NRU',
        '546': 'PYF',
        '548': 'PHL',
        '553': 'PNG',
        '555': 'PCN',
        '557': 'SLB',
        '559': 'ASM',
        '561': 'WSM',
        '563': 'SGP',
        '564': 'SGP',
        '565': 'SGP',
        '567': 'THA',
        '570': 'TON',
        '572': 'TUV',
        '574': 'VNM',
        '576': 'VUT',
        '578': 'WLF',
        '601': 'ZAF',
        '603': 'AGO',
        '605': 'DZA',
        '607': 'ATF',
        '608': 'ASL',
        '609': 'BDI',
        '610': 'BEN',
        '611': 'BWA',
        '612': 'CAF',
        '613': 'CMR',
        '615': 'COG',
        '616': 'COM',
        '617': 'CPV',
        '618': 'ATF',
        '619': 'CIV',
        '621': 'DJI',
        '622': 'EGY',
        '624': 'ETH',
        '625': 'ERI',
        '626': 'GAB',
        '627': 'GHA',
        '629': 'GMB',
        '630': 'GNB',
        '631': 'GNQ',
        '632': 'GIN',
        '633': 'BFA',
        '634': 'KEN',
        '635': 'ATF',
        '636': 'LBR',
        '637': 'LBR',
        '642': 'LBY',
        '644': 'LSO',
        '645': 'MUS',
        '647': 'MDG',
        '649': 'MLI',
        '650': 'MOZ',
        '654': 'MRT',
        '655': 'MWI',
        '656': 'NER',
        '657': 'NGA',
        '659': 'NAM',
        '660': 'REU',
        '661': 'RWA',
        '662': 'SDN',
        '663': 'SEN',
        '664': 'SYC',
        '665': 'SHN',
        '666': 'SOM',
        '667': 'SLE',
        '668': 'STP',
        '669': 'SWZ',
        '670': 'TCD',
        '671': 'TGO',
        '672': 'TUN',
        '674': 'TZA',
        '675': 'UGA',
        '676': 'COG',
        '677': 'TZA',
        '678': 'ZMB',
        '679': 'ZWE',
        '701': 'ARG',
        '710': 'BRA',
        '720': 'BOL',
        '725': 'CHL',
        '730': 'COL',
        '735': 'ECU',
        '740': 'FLK',
        '745': 'GIN',
        '750': 'GUY',
        '755': 'PRY',
        '760': 'PER',
        '765': 'SUR',
        '770': 'URY',
        '775': 'VEN'
    }
    // 历史船舶总数
    var historyShipCount = 0;
    // 历史船舶数据
    var historyShipData = [{
        "msgId": 1,
        "mmsi": "20220101",
        "typeOfShip": "A",
        "ename": "ship1",
        "lng": 23.91,
        "lat": 64.87,
        "speed": 2.06,
        "course": 125.12,
        "heading": 125.12,
        "radius": 4.11,
        "gpsRefPos1": 66.27,
        "gpsRefPos2": 66.27,
        "gpsRefPos3": 64.64,
        "gpsRefPos4": 64.64
    }];
    // 历史岸站总数
    var historyStationCount = 0;
    // 历史岸站数据
    var historyStationData = [{
        "stationId": "262001",
        "name": "station01",
        "lng": 18.62,
        "lat": 56.95,
        "info": "这是第一个岸站"
    }];
    // 历史助航设备总数
    var historyAtonCount = 0;
    // 历史助航设备数据
    var historyAtonData = [{
        "mmsi": "262001",
        "name": "aton01",
        "lng": 18.52,
        "lat": 57.35,
        "virtual": '1',
        "type": '8',
        "info": "这是第一个助航设备"
    }];
    // 实时轨迹
    var trackplayback;
    // 全部轨迹
    var trackplaybackcomplate;
    // 历史轨迹数据
    var trackplaybackdata = [];
    // 页面上显示轨迹回放的所有船舶
    var trackplaybackShips = [];
    // 轨迹回放目标船舶
    var targetShipMMSI_playbackTrack;

    // 地图当前缩放级别
    var mapCurrentLevel;
    // 岸站列表排序
    var stationTableSortName = 'stationId'
    var stationTableSortDesc = 'asc'
    // 船舶列表排序
    var shipTableSortName = 'mmsi'
    var shipTableSortDesc = 'asc'
    // 助航设备列表排序
    var atonTableSortName = 'mmsi'
    var atonTableSortDesc = 'asc'

    // 网位仪列表排序
    var netTableSortName = 'mmsi'
    var netTableSortDesc = 'asc'

    // 右侧导航栏点击时弹出层
    var navigationBoxLayer;

    var showTabBtn = false;
    // 岸站历史数据显示Flag
    var stationHistoryFlag = false;
    // 岸站历史的岸站MMSI
    var stationHistoryMMSI;
    // 岸站历史的开始时间
    var stationHistoryStartTime;
    // 岸站历史的结束时间
    var stationHistoryEndTime;

    // 选择区域西北坐标
    var northWestPoint = "00000000000,0000";
    // 选择区域东北坐标
    var northEastPoint = "00000000000,0000";
    // 选择区域东南坐标
    var southEastPoint = "00000000000,0000";
    // 选择区域西南坐标
    var southWestPoint = "00000000000,0000";

    // 形状选择flag
    var roundFlage = true;
    var rectangular = true;
    var fanFlage = true;
    var brokenLine = true;
    var polygonFlage = true;
    var textFlage = true;
    var moveFlag = false;
    var roundFlageShip = true;
    var rectangularShip = true;
    var fanFlageShip = true;
    var brokenLineShip = true;
    var polygonFlageShip = true;
    var textFlageShip = true;
    // 形状区域对应
    var subAreas = [];
    // 航路点经纬度1-16
    var Dlongitude1, Dlatitude1, Dlongitude2, Dlatitude2, Dlongitude3, Dlatitude3, Dlongitude4, Dlatitude4, Dlongitude5,
        Dlatitude5, Dlongitude6, Dlatitude6,
        Dlongitude7, Dlatitude7, Dlongitude8, Dlatitude8, Dlongitude9, Dlatitude9, Dlongitude10, Dlatitude10,
        Dlongitude11, Dlatitude11, Dlongitude12, Dlatitude12,
        Dlongitude13, Dlatitude13, Dlongitude14, Dlatitude14, Dlongitude15, Dlatitude15, Dlongitude16, Dlatitude16;

    //VDE海图更新文件内容和名称
    var fileContentText1 = "";
    var fileContentName1 = "";
    var fileContentText2 = "";
    var fileContentName2 = "";

    // 基站列表
    var stationList = [];
    var stationDisconnect = false;

    var targetShipExportTableLayerIndex;

    //fss
    // laydate.render({
    //     elem: '#warningTime',
    //     type: 'datetime',
    //     format: 'yyyy/MM/dd HH:mm:ss',
    //     range: true
    // });

    laydate.render({
        elem: '#warningTime',
        type: 'datetime',
        // value: daySart+" - "+dayEnd ,
        format: 'yyyy/MM/dd HH:mm:ss',
        range: true,
        done:function(date){
            this.value = date;
            this.elem.val(date);
        }
    });



    // 消息发送区域选择
    var rectangleMeasure = {
        startPoint: null,
        endPoint: null,
        rectangle: null,
        tips: null,
        layer: L.layerGroup(),
        color: "#0D82D7",
        addRectangle: function () {
            rectangleMeasure.destory();
            var bounds = [];
            bounds.push(rectangleMeasure.startPoint);
            bounds.push(rectangleMeasure.endPoint);
            rectangleMeasure.rectangle = L.rectangle(bounds, {color: rectangleMeasure.color, weight: 1});
            rectangleMeasure.rectangle.addTo(rectangleMeasure.layer);

            northWestPoint = rectangleMeasure.rectangle.getBounds().getNorthWest().toString();
            northEastPoint = rectangleMeasure.rectangle.getBounds().getNorthEast().toString();
            southEastPoint = rectangleMeasure.rectangle.getBounds().getSouthEast().toString();
            southWestPoint = rectangleMeasure.rectangle.getBounds().getSouthWest().toString();
            addrectangleMeasureLayer();

            rectangleMeasure.layer.addTo(map);
        },
        mousedown: function (e) {
            rectangleMeasure.rectangle = null;
            rectangleMeasure.tips = null;
            map.dragging.disable();
            rectangleMeasure.startPoint = e.latlng;
            map.on('mousemove', rectangleMeasure.mousemove)
        },
        mousemove: function (e) {
            moveFlag = true;
            rectangleMeasure.endPoint = e.latlng;
            rectangleMeasure.addRectangle();
            map.off('mousedown ', rectangleMeasure.mousedown).on('mouseup', rectangleMeasure.mouseup);
        },
        mouseup: function (e) {
            if (!moveFlag) {
                return
            }
            map.dragging.enable();
            document.getElementById('map').style.cursor = '';
            map.off('mousemove', rectangleMeasure.mousemove).off('mouseup', rectangleMeasure.mouseup).off('mousedown', rectangleMeasure.mousedown);
        },
        destory: function () {
            if (rectangleMeasure.rectangle)
                rectangleMeasure.layer.removeLayer(rectangleMeasure.rectangle);
        }
    }

    $("#sendSafeMsgControl").show();
    $("#targetShipSendMessage").show();
    $("#control").show();
    $("#playbackTrack").hide();
    shoreSendSafeMsg = true;

    var shipInterval;
    var stationInterval;
    var atonInterval;
    var fishingNetInterval;
    var intervalId;
    var stationPopup;
    var targetShipMMSIPlaybackTrackListFlag = false

    var mapType = '海图';
    admin.req('api-user/seaMap/getSeaMapSetting', {}, function (res) {
        var level = 7;
        var latitude = 35;
        var longitude = 127;
        if (res != undefined&&res.id!=undefined) {
            $('#seaMapId').val(res.id);
            level = res.level == undefined?level:res.level ==""?level:res.level;
            latitude = res.latitude == undefined?latitude:res.latitude ==""?latitude:res.latitude;
            longitude = res.longitude == undefined?longitude:res.longitude ==""?longitude:res.longitude;
            mapType = res.mapType == undefined?mapType:res.mapType ==""?mapType:res.mapType;
            // $("input[name='layerControlLayer_shipTimeShow']").prop("checked", res.shipTimeShow == 0 ? true : false);
            if (res.shipType != "") {
                if (res.shipType == "AB") {
                    $("input[name='layerControlLayer_shipType'][value='A']").prop("checked", true);
                    $("input[name='layerControlLayer_shipType'][value='B']").prop("checked", true);
                } else if (res.shipType == "A"){
                    $("input[name='layerControlLayer_shipType'][value='A']").prop("checked", true);
                    $("input[name='layerControlLayer_shipType'][value='B']").prop("checked", false);
                }else {
                    $("input[name='layerControlLayer_shipType'][value='A']").prop("checked", false);
                    $("input[name='layerControlLayer_shipType'][value='B']").prop("checked", true);
                }
            }else {
                $("input[name='layerControlLayer_shipType'][value='A']").prop("checked", false);
                $("input[name='layerControlLayer_shipType'][value='B']").prop("checked", false);
            }
            $("input[name='layerControlLayer_shipName']").prop("checked", res.shipName=="true"?true:false);
            $("input[name='layerControlLayer_stationShow']").prop("checked", res.stationShow=="true"?true:false);
            $("input[name='layerControlLayer_stationName']").prop("checked", res.stationName=="true"?true:false);
            $("input[name='layerControlLayer_atonShow']").prop("checked", res.atonShow=="true"?true:false);
            $("input[name='layerControlLayer_atonName']").prop("checked", res.atonName=="true"?true:false);
            $("input[name='layerControlLayer_fishingNetShow']").prop("checked", res.fishingNetShow=="true"?true:false);
            // $("input[name='layerControlLayer_fishingAreas']").prop("checked", res.fishingAreas=="true"?true:false);
            layerControlLayer_shipType = res.shipType;
            onlyFishShip = res.fishingShip=="true"?true:false;
            form.render();
        }

        //限制拖拽区域
        var corner1 =  L.latLng(32.5097, 119.9492); //设置左上角经纬度
        var corner2 = L.latLng(30.9769, 122.0062);	//设置右下点经纬度
        var bounds = L.latLngBounds(corner1, corner2); //构建视图限制范围

        // 初始化地图中心点和缩放级别
        map = L.map('map',
            {
                center: [latitude, longitude],
                zoom: level,
                zoomControl: false,
                editable: true,
                maxZoom: 16,
                minZoom: 1,
                // maxBounds: bounds
            });
        //  mapCurrentLevel = res.level;
        mapCurrentLevel = level;
        // 初始化地图
        initMap();

        getWarningArea(map, admin);

        // 初始化Layui
        initLayui();
        initWatchForElectronicFence();
        // 获取船舶数据
        getShipData();
        // 十秒定时刷新船舶数据
        shipInterval = window.setInterval(getShipData, 60000);
        // 五分钟定时刷新岸站数据
        stationInterval = window.setInterval(getStationData, 60000);
        // 一分钟定时刷新航标数据
        atonInterval = window.setInterval(getAtonData, 60000);
        // 一分钟定时刷新网位仪数据
        // fishingNetInterval = window.setInterval(getFishingNetData, 60000);

    }, 'POST');





    function initMap() {
        // //渔业协定水域
        // if ($('input[name="layerControlLayer_fishingAreas"]').prop('checked') == true) {
        //     showFishingAreas(map);
        // }
        // tileLayer = L.tileLayer.wms(config.seamap_server);

        if(config.seamap_server!=undefined&&config.seamap_server.indexOf("bigemap")>-1){
            tileLayer = L.tileLayer.wms(config.seamap_server);
        } else{
            var normalMapm = L.tileLayer.chinaProvider("TianDiTu.Normal.Map", {
                maxZoom: 22,
                minZoom: 1
            })
            var normalMapa = L.tileLayer.chinaProvider("TianDiTu.Normal.Annotion", {
                maxZoom: 22,
                minZoom: 1
            });

            tileLayer = L.layerGroup([normalMapm, normalMapa])
        }
        map.addLayer(tileLayer);
        // tileLayer = mapChangeInit(mapType, map, tileLayer, config.seamap_server, function (res, _tileLayer) {
        //     tileLayer = _tileLayer;
        //     saveUserCenter('map', res);
        // });

        // 鼠标当前经纬度显示
        L.control.mousePosition({
            position: 'bottomleft',
            separator: '<br>',
        }).addTo(map);

        // 比例尺
        L.control.scale({
            maxWidth: 150, nautic: true, metric: false, imperial: false, position: 'bottomleft'
        }).addTo(map);
// 缩放控制
        L.control.zoom({
            position: 'bottomright',
            zoomInTitle: '放大',
            zoomOutTitle: '缩小'
        }).addTo(map);
        // 地图有改变
        map.on('moveend', function () {
            // //渔业协定水域
            // if ($('input[name="layerControlLayer_fishingAreas"]').prop('checked') == true) {
            //     showFishingAreas(map);
            // }

            // 地图当前缩放级别
            mapCurrentLevel = map.getZoom();
            // if ($(".map_layer0")[0].innerText == "海图") {
            //     if (mapCurrentLevel >= limitZoom) {
            //         tileLayer.setParams({CSVALUE: '100000,5,20,10,1,2,1,500000,100000,200000,1'}, false);
            //     } else if (mapCurrentLevel < limitZoom) {
            //         tileLayer.setParams({CSVALUE: '100000,5,20,10,2,1,1,500000,100000,200000,1'}, false);
            //     }
            // }

            $('#setCenter_level').val(mapCurrentLevel);
            // 获取船舶数据
            getShipData();
            // 获取岸站数据
            getStationData();
            // 获取航标数据
            getAtonData();
            // 获取网位仪数据
            //getFishingNetData();
            // 名称显示选项是否可用
            nameShowOptionSet();
            // 渔船显示选项是否可用 2022/7/12 lxy
            fishShipOptionSet();

            if (stationHistoryFlag) {
                if (mapCurrentLevel > limitZoom) {
                    drawShip(historyShipData);
                } else {
                    drawPoint(historyShipData);
                }
            }

        })

        // 名称显示选项是否可用
        nameShowOptionSet();

        // 获取船舶数据
        getShipData();

        // 岸站数据
        getStationData();
        // 航标数据
        getAtonData();
        // 获取网位仪数据
        //getFishingNetData();
        // 中心点拖拽
        centerPosition.on('dragend', function (event) {
            var position = centerPosition.getLatLng();
            $('#setCenter_lat').val(position.lat.toFixed(4));
            $('#setCenter_lng').val(position.lng.toFixed(4));
        })

        // 编辑矩形
        map.on('editable:editing', function (e) {
            northWestPoint = e.layer.getBounds().getNorthWest().toString();
            northEastPoint = e.layer.getBounds().getNorthEast().toString();
            southEastPoint = e.layer.getBounds().getSouthEast().toString();
            southWestPoint = e.layer.getBounds().getSouthWest().toString();
            addrectangleMeasureLayer();
        });
        // getElectronicFence(map, admin, table, config, form)
    }

    function initLayui() {
        // 日期选择
        laydate.render({
            elem: '#trackPlayEndTime'
            , type: 'datetime'
        });
        laydate.render({
            elem: '#trackPlayStartTime'
            , type: 'datetime'
        });
        laydate.render({
            elem: '#trackShipPlayStartTime'
            , type: 'datetime'
        });
        laydate.render({
            elem: '#trackShipPlayEndTime'
            , type: 'datetime'
        });
        laydate.render({
            elem: '#trackShipPlayStartTimeForTrackExport'
            , type: 'datetime'
        });
        laydate.render({
            elem: '#trackShipPlayEndTimeForTrackExport'
            , type: 'datetime'
        });
        laydate.render({
            elem: '#stationHistory_startTime'
            , type: 'datetime'
        });
        laydate.render({
            elem: '#stationHistory_endTime'
            , type: 'datetime'
        });
        laydate.render({
            elem: '#electronicFenceStartValidTime'
            , type: 'datetime'
        });
        laydate.render({
            elem: '#electronicFenceEndValidTime'
            , type: 'datetime'
        });

        // 检索输入框内容改变触发
        $("#saerchMMSIorName").bind("input propertychange", function (event) {
            if (num != 0) {
                num = 0;
            } else {
                intervalId = setInterval(saerchInterval, 50);
            }
        });

        var num = 0;

        function saerchInterval() {
            num++;
            if (num == 20) {
                num = 0;
                clearInterval(intervalId);
                getAutoCompleteData();
            }
        }

        function trackInterval() {
            num++;
            if (num == 20) {
                num = 0;
                clearInterval(intervalId);
                getPlaybackTrackAutoCompleteData();
            }
        }

        // 轨迹回放检索输入框内容改变触发
        $("#targetShipMMSI_playbackTrack").bind("input propertychange", function (event) {
            if (num != 0) {
                num = 0;
            } else {
                intervalId = setInterval(trackInterval, 50);
            }
        });

        // 右下角导航菜单栏tips
        $('#centerPositionSet').hover(function () {
            layer.tips('中心点设置', this, {tips: [2], time: 1000});
        })
        $('#measureDistance').hover(function () {
            layer.tips('测距', this, {tips: [2], time: 1000});
        })
        $('#legend').hover(function () {
            layer.tips('图例', this, {tips: [2], time: 1000});
        })
        $('#saerchMMSIorName').focus(function () {
            getAutoCompleteData();
        })
        $('#targetShipMMSI_playbackTrack').focus(function () {
            getPlaybackTrackAutoCompleteData();
        })
        $('#saerchMMSIorName').blur(function () {
            setTimeout(function () {
                $("#autoComplete").css("display", "none")
            }, 500);
        })
        $('#targetShipMMSI_playbackTrack').blur(function () {
            setTimeout(function () {
                $("#targetShipMMSI_autoComplete").css("display", "none")
            }, 500);
        })

        // 监听页面检索框检索船舶/岸站
        form.on('submit(searchMMSI)', function (data) {
            var val = $("#saerchMMSIorName").val().toUpperCase();
            // 文本框值为空时，隐藏模糊查询框并且返回
            if (val == '') {
                $("#autoComplete").css("display", "none");
                return;
            } else {
                for (var i in shipData) {
                    if (shipData[i].mmsi == val || shipData[i].ename == val) {
                        autoCompleteClick(shipData[i].mmsi, "SHIP");
                        return;
                    }
                }
                for (var i in stationData) {
                    if (stationData[i].mmsi === val || stationData[i].name === val) {
                        autoCompleteClick(val, "STATION");
                        return;
                    }
                }
                for (var i in atonData) {
                    if (atonData[i].mmsi == val || atonData[i].name == val) {
                        autoCompleteClick(val, "ATON");
                        return;
                    }
                }
                for (var i in fishingNetData) {
                    if (fishingNetData[i].mmsi == val||fishingNetData[i].name == val) {
                        autoCompleteClick(val, "NET");
                        return;
                    }
                }
                return layer.msg("未找到该信息！", {icon: 2, time: config.msgTime});
            }
        });

        // 监听显示左侧列表
        form.on('submit(showAllList)', function (data) {
            if (showTabBtn == false) {
                showAllList();
            } else {
                hideAllList();
            }

        });

        $('#tableHide').click(function () {
            hideAllList();
        });
        // 监听右上导航栏按钮
        form.on('submit(navigationBoxLayer)', function (data) {
            var arr = ['fleetShipLayerIndex', 'fleetLayerIndex', 'fleetSendMessageIndex', 'shipTimeLayerIndex', 'fleetInfoDetailIndex', 'electronicFenceLayerIndex', 'markerTableLayer'];
            rejectLayer(arr);
            if (data.elem.id == 'sendSafeMsgControl2') {
                oneShoreSendMessage = true;
            } else {
                oneShoreSendMessage = false;
            }
            data = data.elem.name;
            navigationBoxClick(data);
        });

        //这个没用了
        // 船舶显示切换
        // form.on('radio(layerControlLayer_shipShow)', function (data) {
        //     if (data.value == 'true') {
        //         // if (mapCurrentLevel > limitZoom) {
        //         //     getShipData();
        //         // } else {
        //         //     getShipData();
        //         // }
        //         getShipData();
        //         nameShowOptionSet();
        //         $('#layerControlLayer_shipTypeA').removeAttr("disabled", "disabled");
        //         $('#layerControlLayer_shipTypeB').removeAttr("disabled", "disabled");
        //         // $('#layerControlLayer_shipTypeAB').removeAttr("disabled", "disabled");
        //         $('#layerControlLayer_shipShowTime').removeAttr("disabled", "disabled");
        //         $('#layerControlLayer_shipShowAll').removeAttr("disabled", "disabled");
        //         form.render('checkbox');
        //     } else if (data.value == 'false') {
        //         // 其他图层关闭
        //         var arr = ['shipLayer', 'shipPointLayer', 'shipNameLayer', 'shipDetailLayer', 'selectedShipLayer'];
        //         rejectLayer(arr);
        //         $('#layerControlLayer_shipTypeA').attr("disabled", "disabled");
        //         $('#layerControlLayer_shipTypeB').attr("disabled", "disabled");
        //         // $('#layerControlLayer_shipTypeAB').attr("disabled", "disabled");
        //         $('#layerControlLayer_shipShowTime').attr("disabled", "disabled");
        //         $('#layerControlLayer_shipShowAll').attr("disabled", "disabled");
        //         // $('#layerControlLayer_shipNameShow').attr("disabled", "disabled");
        //         // $('#layerControlLayer_shipNameNotShow').attr("disabled", "disabled");
        //         $("input[name='layerControlLayer_shipName']").attr("disabled", "disabled");
        //         form.render('checkbox');
        //     }
        //     saveUserCenter('layer');
        // });
        // 船舶显示切换 实时 全部
        form.on('switch(layerControlLayer_shipTimeShow)', function (data) {
            layerControlLayer_shipTimeShow = $("input[name='layerControlLayer_shipTimeShow']").prop("checked") ? 0 : 1;
            getShipData();
            saveUserCenter('layer');
        });

        // 船舶类型切换
        form.on('switch(layerControlLayer_shipType)', function (data) {
            if ($("input[name='layerControlLayer_shipType']:checked").length) {
                if ($("input[name='layerControlLayer_shipType']:checked").length == 2) {
                    layerControlLayer_shipType = 'AB'
                } else {
                    layerControlLayer_shipType = $("input[name='layerControlLayer_shipType']:checked").val();
                }
                getShipData();
                nameShowOptionSet();
                $('#layerControlLayer_shipShowTime').removeAttr("disabled", "disabled");
                $('#layerControlLayer_shipShowAll').removeAttr("disabled", "disabled");
                if (mapCurrentLevel > limitZoom) {
                    $("input[name='layerControlLayer_shipName']").removeAttr("disabled", "disabled");
                }else{
                    $("input[name='layerControlLayer_shipName']").attr("disabled", "disabled");
                }
                // 渔船显示选项是否可用 2022/7/12 lxy
                $("input[name='layerControlLayer_fishShip']").removeAttr("disabled", "disabled");
                form.render('checkbox');
            } else {
                layerControlLayer_shipType = ''
                // 其他图层关闭
                var arr = ['shipLayer', 'shipPointLayer', 'shipNameLayer', 'shipDetailLayer', 'selectedShipLayer'];
                rejectLayer(arr);
                $('#layerControlLayer_shipShowTime').attr("disabled", "disabled");
                $('#layerControlLayer_shipShowAll').attr("disabled", "disabled");
                $("input[name='layerControlLayer_shipName']").attr("disabled", "disabled");
                // 渔船显示选项是否可用 2022/7/12 lxy
                $("input[name='layerControlLayer_fishShip']").attr("disabled", "disabled");
                form.render('checkbox');
            }

            saveUserCenter('layer');
        });


        form.on('switch(layerControlLayer_shipName)', function (data) {
            if (data.elem.checked == true) {
                drawShipName();
            } else if (data.elem.checked == false) {
                var arr = ['shipNameLayer'];
                rejectLayer(arr);
            }
            saveUserCenter('layer');
        });
        // 渔船选项 2022/7/12 lxy
        form.on('switch(layerControlLayer_fishShip)', function (data) {
            console.log(data.elem.checked);
            if (data.elem.checked == true) {
                onlyFishShip = true;
                getShipData();
            } else if (data.elem.checked == false) {
                var arr = ['shipLayer', 'shipPointLayer', 'shipNameLayer', 'shipDetailLayer', 'selectedShipLayer'];
                rejectLayer(arr);
                onlyFishShip = false;
                getShipData();
            }
            saveUserCenter('layer');
        });

        // 岸站显示切换
        form.on('switch(layerControlLayer_stationShow)', function (data) {
            if (data.elem.checked == true) {
                drawStation(stationData);
                // 海图页面显示岸站名称
                if ($('input[name="layerControlLayer_stationName"]').prop('checked') == true) {
                    drawStationName()
                }
                $('#layerControlLayer_stationName_id').removeAttr("disabled");
                form.render('checkbox');
            } else if (data.elem.checked == false) {
                // 其他图层关闭
                var arr = ['stationLayer', 'stationNameLayer', 'stationDetailLayer'];
                rejectLayer(arr);
                $('#layerControlLayer_stationName_id').attr("disabled", "disabled");
                form.render('checkbox');
            }
            saveUserCenter('layer');
        });


        // 岸站名称切换
        form.on('switch(layerControlLayer_stationName)', function (data) {
            if (data.elem.checked == true) {
                drawStationName();
            } else if (data.elem.checked == false) {
                var arr = ['stationNameLayer'];
                rejectLayer(arr);
            }
            saveUserCenter('layer');
        });


        // 助航设备显示切换
        form.on('switch(layerControlLayer_atonShow)', function (data) {
            if (data.elem.checked == true) {
                drawAton(atonData);
                if ($('input[name="layerControlLayer_atonName"]').prop('checked') == true) {
                    drawAtonName()
                }
                $('#layerControlLayer_atonName_id').removeAttr("disabled");
                form.render('checkbox')
            } else if (data.elem.checked == false) {
                // 其他图层关闭
                var arr = ['atonLayer', 'atonNameLayer', 'atonDetailLayer'];
                rejectLayer(arr);
                $('#layerControlLayer_atonName_id').attr("disabled", "disabled");
                form.render('checkbox');
            }
            saveUserCenter('layer');
        });


        // 助航设备名称切换
        form.on('switch(layerControlLayer_atonName)', function (data) {
            if (data.elem.checked == true) {
                drawAtonName();
            } else if (data.elem.checked == false) {
                var arr = ['atonNameLayer'];
                rejectLayer(arr);
            }
            saveUserCenter('layer');
        });


        // // 网位仪显示切换
        // form.on('switch(layerControlLayer_fishingNetShow)', function (data) {
        //     if (data.elem.checked == true) {
        //         getFishingNetData();
        //     } else if (data.elem.checked == false) {
        //         var arr = ['fishingNetLayer', 'fishingNetPointLayer', 'fishingNetDetailLayer'];
        //         rejectLayer(arr);
        //     }
        //     saveUserCenter('layer');
        // });

        // 渔业协定水域显示切换
        form.on('switch(layerControlLayer_fishingAreas)', function (data) {
            if (data.elem.checked == true) {
                showFishingAreas(map);
            } else if (data.elem.checked == false) {
                closeArea(map)
            }
            saveUserCenter('layer');
        });
        //    form.on('radio(layerControlLayer_fishingAreas)', function (data) {
        //        if (data.value == 'true') {
        //            showFishingAreas(map);
        //        } else if (data.value == 'false') {
        //            closeArea(map)
        //        }
        //        saveUserCenter('layer');
        //    });

        // 监听详细画面内按钮
        form.on('submit(showTargetLayer)', function (data) {
            data = data.elem.name;
            showTargetLayer(data);
        });

        // 监听轨迹回放
        form.on('submit(shipTrackPlayBack)', function (data) {
            console.log(data)
            data = data.elem.name;

            shipTrackPlayBack(data, '');
        });

        form.on('submit(shipTrackPlayBackForTrackExport)', function (data) {
            data = data.elem.name;
            // shipTrackPlayBackForTrackExport('customShip', '');
            shipTrackPlayBack('customShip', '');

        });

        // 监听删除指定船的轨迹
        form.on('submit(closeTrackList)', function (data) {
            var mmsi = data.elem.id;
            closeTrackList(mmsi);
        });

        // 监听测距按钮
        form.on('submit(measureDistance)', function (data) {
            if ($("#measureDistance")[0].style.color == "") {
                // $("#measureDistance")[0].style.color = "#ffb300"
                measure();
            } else {
                // 其他图层关闭
                var arr = ['setCenterLayer', 'measureLayer', 'legendLayer'];
                rejectLayer(arr);
            }

        });

        // 监听设置中心点按钮
        form.on('submit(centerPositionSet)', function (data) {
            if ($("#centerPositionSet")[0].style.color == "") {
                // $("#centerPositionSet")[0].style.color = "#ffb300"
                setCenterPosition();
            } else {
                // 其他图层关闭
                var arr = ['setCenterLayer', 'measureLayer', 'legendLayer'];
                rejectLayer(arr);
            }
        });

        // 提交中心点设置
        form.on('submit(setCenter)', function (data) {
            var field = data.field;
            if (!checkutils.from90To90Int(field.setCenter_lat)) {
                layer.alert('纬度范围必须在-90~90之间！', {icon: 2});
                return false;
            }
            if (!checkutils.from180To180Int(field.setCenter_lng)) {
                layer.alert('经度范围必须在-180~180之间！', {icon: 2});
                return false;
            }
            saveUserCenter('center');
        });

        // 显示图例
        form.on('submit(legend)', function (data) {
            if ($("#legend")[0].style.color == "") {
                // $("#legend")[0].style.color = "#ffb300"
                showLegend();
            } else {
                // 其他图层关闭
                var arr = ['setCenterLayer', 'measureLayer', 'legendLayer', 'markerTableLayer', 'heatmapLayer', 'navigationBoxLayer', 'targetLayer', 'trackplaybackControl',  'owmStationLayer', 'electronicHistoryLayer',  'electronicAlertLayer',  'electronicFenceLayerCustomIndex', 'virtualAtoNLayerIndex'];
                rejectLayer(arr);
            }
        });


        // 岸站历史查询
        form.on('submit(stationHistory)', function (data) {
            searchStationHistory();
        });

        // 显示岸站历史列表
        form.on('submit(showAllHistoryList)', function (data) {
            showAllHistoryList();
        });

        // 隐藏岸站历史列表
        form.on('submit(hideAllHistoryList)', function (data) {
            hideAllHistoryList();
        });

        // 返回实时海图
        form.on('submit(backToRealTime)', function (data) {
            backToRealTime();
        });

        // 监听选择区域
        form.on('submit(drawArea)', function (data) {
            drawArea();
        });

        // 监听选择区域保存
        form.on('submit(rectangleMeasureSave)', function (data) {
            rectangleMeasureSave();
        });

        // 监听选择区域编辑
        form.on('submit(rectangleMeasureEdit)', function (data) {
            rectangleMeasureEdit();
        });

        //关闭选择的矩形
        form.on('submit(clearRectangleMeasure)', function (data) {
            clearRectangleMeasure();
        });
        //添加船队
        form.on('submit(addFleetInfo)', function (data) {
            fleetInfo()
        })
        //添加船队 保存
        form.on('submit(saveFleetInfo)', function (data) {
            saveFleetInfo(data)
        })
        // 船队详细信息
        form.on('submit(FleetInfoDetail)', function (data) {
            fleetInfoDetail(data)
        })

        form.on('submit(saveFleetShipInfo)', function (data) {
            saveFleetShipInfo(data)
        })
        // 添加关注船舶 保存
        form.on('submit(saveCareShip)', function (data) {
            saveCareShip(data)
            // saveFleetShipInfo(data)
        })
        //添加关注船舶
        form.on('submit(addCareShipInfo)', function (data) {
            addCareShipInfo(data)
        })
        //监听添加圆形区域矩形区域等
        $("#targetAddArea").click(function () {
            showAddAreaLayer("targetAddArea");
        })
        //监听删除圆形区域矩形区域等
        // form.on('submit(deleteAreaLayer)', function (data) {
        //     data = data.elem.name;
        //     deleteAreaLayer(data);
        // });
        $(document).on("click", "#targetDeleteArea", function () {
            deleteAreaLayer(this.name);
        })

        // form.on('submit(getFile)', function (data) {
        //     getFile();
        // });

        //监听添加圆形区域矩形区域等(点船发送信息时)
        $("#targetAddShip").click(function () {
            showAddShip("targetAddShip", "addShipDiv");
        })
        //监听添加圆形区域矩形区域等(点船发送信息时)
        $("#targetAddShip1").click(function () {
            showAddShip("targetAddShip", "addShipDiv1");
        })

        //监听删除圆形区域矩形区域等(点船发送信息时)
        $(document).on("click", "#targetDeleteShip", function () {
            deleteShipLayer(this.name);
        })
        // 单击选择区域显示设置
        $("#clickAIS").click(function () {
            $("#sendSafeMsgControlLayer_addArea").hide();
            $("#sendSafeMsgControlLayer_saveArea").hide();
        })
        //广播ASM消息
        $("#clickASM").click(function () {
            if (!oneShoreSendMessage) {
                if ($("#sendSafeMsgControlLayer_saveArea")[0].children.length == 0) {
                    $("#sendSafeMsgControlLayer_addArea").show();
                }
                $("#sendSafeMsgControlLayer_saveArea").show();
            }
            //清除区域通告子区域
            subAreas = [];
            $("#addDiv").html("");
            roundFlage = true;
        })
        $("#clickVDE").click(function () {
            $("#sendSafeMsgControlLayer_addArea").hide();
            $("#sendSafeMsgControlLayer_saveArea").hide();
        })
        //船舶ASM消息
        $("#shipASM").click(function () {
            //清除区域通告子区域
            subAreas = [];
            $("#addShipDiv").html("");
            roundFlageShip = true;
        })
        //船队ASM消息
        $("#fleetASM").click(function () {
            //清除区域通告子区域
            subAreas = [];
            $("#addShipDiv1").html("");
            roundFlageShip = true;
        })

        // 热力图按钮
        form.on('submit(heatControl)', function (data) {
            data = data.elem.name;
            selectColorChange(data);
            drawHeatLayer();
        });



        form.on('select(servicesAvailability)', function (data) {
            if (data.value == 0) {
                for (var i = 1; i <= 22; i++) {
                    $('input[name=typeOfServicesAvailable' + i + ']').prop("checked", false);
                    $('input[name=typeOfServicesAvailable' + i + ']').attr("disabled", true);
                }
            } else {
                for (var i = 1; i <= 22; i++) {
                    $('input[name=typeOfServicesAvailable' + i + ']').attr("disabled", false);
                }
            }
            form.render();
        });

        form.on('submit(overlapStationChoose)', function (data) {
            var chooseMmsi = data.elem.name;
            showStationDetail(chooseMmsi);
            stationPopup.remove();
        });

        // 修改用户信息
        form.on('submit(saveUserInfo)', function () {
            var param = {
                id: config.getUser().id,
                username: $('#username').val(),
                mobile: $('#mobile').val(),
                nickname: $('#nickname').val(),
                sex: $('#userInfo_userSex input[name="sex"]:checked').val()
            }
            admin.req('api-user/users/saveOrUpdate', JSON.stringify(param), function (data) {
                if (data.resp_code === 0) {
                    layer.msg(data.resp_msg, {icon: 1, time: config.msgTime});
                    var arr = ['navigationBoxLayer', 'electronicFenceLayerIndex'];
                    rejectLayer(arr);
                    document.getElementById("userInfo").children[0].style.color = ""
                    var user = config.getUser();
                    user.nickname = data.datas.nickname;
                    user.mobile = data.datas.mobile;
                    user.sex = data.datas.sex;
                    config.putUser(user);
                } else {
                    layer.msg(data.resp_msg, {icon: 2, time: config.msgTime});
                }
            }, "POST");
        });

        // 用户修改密码
        form.on('submit(saveUserPassword)', function () {
            var param = {
                id: config.getUser().id,
                oldPassword: $('#oldPassword').val(),
                newPassword: $('#newPassword').val(),
                rePassword: $('#rePassword').val(),
            }
            admin.req('api-user/users/password', JSON.stringify(param), function (data) {
                if (data.resp_code == 0) {
                    layer.msg(data.resp_msg, {icon: 1, time: config.msgTime}, function () {
                        config.removeToken();
                        window.open('/login.html', "_self");
                    });
                } else {
                    layer.msg(data.resp_msg, {icon: 2, time: config.msgTime});
                }
            }, 'PUT');
        });

        // 电子航标列表
        $(document).on("click", "#virtualAtoNControl", function () {
            // 其他图层关闭
            var arr = ['heatmapLayer', 'targetLayer', 'trackplaybackControl',  'owmStationLayer','electronicFenceLayerIndex'];
            rejectLayer(arr);
            ownShoreList(map,admin,table,config,form);
        })
        // 保存电子航标
        form.on('submit(saveVirtualAton)', function (data) {
            saveVirtualAton(data);
            return false;
        })
        // 选择电子航标经纬度
        $(document).on("click", "#chooseVirtualAtonLonLat", function () {
            chooseVirtualAtonLonLat();
        })




        $("#electronicFenceControl").click(function () {
            var arr = ['electronicHistoryLayer', 'electronicAlertLayer', 'heatmapLayer',
                'navigationBoxLayer', 'targetLayer', 'trackplaybackControl',  'owmStationLayer', 'virtualAtoNLayerIndex'];
            rejectLayer(arr);
            if(window.electronicFenceLayerCustomIndex) {
                layer.close(window.electronicFenceLayerCustomIndex)
                window.electronicFenceLayerCustomIndex = ""
                return;
            }
            openElectronicFenceTable(map, admin, table, config, form, laytpl)
        })

        $("#eFencehistory").click(function () {
            var arr = ['electronicFenceLayerCustomIndex', 'electronicAlertLayer', 'heatmapLayer',
                'navigationBoxLayer', 'targetLayer', 'trackplaybackControl',  'owmStationLayer', 'virtualAtoNLayerIndex'];
            rejectLayer(arr);
            if(window.electronicHistoryLayer) {
                layer.close(window.electronicHistoryLayer)
                window.electronicHistoryLayer = ""
                return;
            }
            efenceHistory(map, admin, table, config, form, laytpl)
        })

        $("#eFenceAlert").click(function () {
            var arr = ['electronicFenceLayerCustomIndex', 'electronicHistoryLayer', 'heatmapLayer',
                'navigationBoxLayer', 'targetLayer', 'trackplaybackControl',  'owmStationLayer', 'virtualAtoNLayerIndex'];
            rejectLayer(arr);
            if(window.electronicAlertLayer) {
                layer.close(window.electronicAlertLayer)
                window.electronicAlertLayer = ""
                return;
            }
            eFenceAlert(map, admin, table, config, form, laytpl)
        })

        // 添加电子围栏
        $(".addElectronicFenceInfo").click(function () {

            electronicFenceInfoDetail()
        })


        var downNone1 = document.getElementById("down-none1");
        downNone1.removeChild(downNone1.getElementsByTagName('i')[0]);
        var downNone2 = document.getElementById("down-none2");
        downNone2.removeChild(downNone2.getElementsByTagName('i')[0]);
        // 用户退出信息
        form.on('submit(userExit)', function () {
            layer.confirm('确定退出登录？', function () {
                config.removeToken();
                window.open('/login.html', "_self");
            });
        });

        // 轨迹回放列表点击
        form.on('submit(targetShipMMSI_playbackTrack_list)', function (data) {
            if(!targetShipMMSIPlaybackTrackListFlag) {
                var mmsi = data.elem.id.slice(0,data.elem.id.indexOf('_'));
                // trackDetailInfo(mmsi)
                currentTrackTime = {
                    start: $(data.elem).attr('data-start'),
                    end: $(data.elem).attr('data-end'),
                    mmsi: data.elem.id.slice(0, data.elem.id.indexOf('_'))
                }
                if(targetShipExportTableLayerIndex) {
                    layer.close(targetShipExportTableLayerIndex)
                    targetShipExportTableLayerIndex = null
                }
                setTimeout(function () {
                    drawTrack('selectShipTrack',false,null,mmsi)
                }, 201)
            }

        });





    }

    //获取实时船舶数据
    function getShipData() {
        var data = {
            area: {
                northeast: {
                    lat: map.getBounds()._northEast.lat,
                    lng: map.getBounds()._northEast.lng
                },
                southwest: {
                    lat: map.getBounds()._southWest.lat,
                    lng: map.getBounds()._southWest.lng
                }
            },
            mmsi: "",
            shipType: layerControlLayer_shipType == 'AB' ? '' : layerControlLayer_shipType==''?'C':layerControlLayer_shipType,
            shipTimeShow: layerControlLayer_shipTimeShow,
            // 渔船是否可用 2022/7/12 lxy
            onlyFishShip: onlyFishShip
        };
        admin.reqNoLoad('shipDynamicStatic-api/getShipInfo', JSON.stringify(data), function (res) {
            // 船舶数据更新
            shipData = res.ships;
            shipCount = res.cnt;
            if ($("#allList_left_middle ul li")[0].className == "layui-this") {
                var str = '【显示范围】' + shipCount + '艘';
                $('#dataCount').html(str);
            }
            if (heatmapLayer == null
                && !stationHistoryFlag && trackListLayer == null) {
                // 页面显示船舶
                if (mapCurrentLevel > limitZoom) {
                    drawShip(shipData);
                    // 海图页面显示选择船舶框
                    if (selectedShipMMSI != null && selectedShipMMSI != '') {
                        var flag = false;
                        $.each(shipData, function (infoIndex, info) {
                            if (info.mmsi == selectedShipMMSI || info.ename == selectedShipMMSI) {
                                selectedShipShow(info.lat, info.lng, info.heading, info.course, info.gpsRefPos1, info.gpsRefPos2, info.gpsRefPos3, info.gpsRefPos4);
                                flag = true;
                                return false;
                            }
                        })
                        if (!flag) {
                            // 其他图层关闭
                            var arr = ['shipDetailLayer', 'selectedShipLayer', 'targetLayer'];
                            rejectLayer(arr);
                        }
                    }
                    ;
                    // 海图页面显示船舶名称
                    if ($('input[name="layerControlLayer_shipName"]').prop('checked') == true) {
                        drawShipName()
                    }

                } else {
                    drawPoint(shipData);
                }
                if ($("#allList_left").css("display") == "block") {
                    table.reload('shipList', {
                        data: shipData,
                        initSort: {
                            field: shipTableSortName
                            , type: shipTableSortDesc
                        }
                    });
                }
            }
        }, 'POST');
    }

    // 画船
    function drawShip(data) {
        // 其他图层关闭
        var arr = ['shipLayer', 'shipPointLayer'];
        rejectLayer(arr);
        if (trackplaybackControl != null && trackplaybackControl.trackPlayBack.clock != null) {
            return false;
        }
        var ship;
        $.each(data, function (infoIndex, info) {
            var shipColor = "#000000"

            if (info.typeOfShip == "A") {
                shipColor = "#0000ff"
            } else if (info.typeOfShip == "B") {
                shipColor = "#ffbb00"
            }

            var fillOpacityOp = 1
            if (info.radarType == 2) {
                fillOpacityOp = 0
            }

            ship = L.trackSymbol(L.latLng(info.lat, info.lng), {
                fill: true,
                stroke: true,
                speed: info.speed,
                course: info.course * Math.PI / 180.0,
                heading: info.heading * Math.PI / 180.0,
                leaderTime: 30,
                rot: info.radius,
                gpsRefPos: [info.gpsRefPos1, info.gpsRefPos2, info.gpsRefPos3, info.gpsRefPos4],
                recvTime: info.recvTime,
                radius: info.radius,
                fillColor: shipColor,
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: fillOpacityOp,
                fillRule: "nonzero",
                radarType: info.radarType
            });
            var name = info.ename == null ? "" : info.ename;
            //  ship.bindTooltip("船名： " + name + "</br>MMSI：" + info.mmsi + "</br>船速： " + info.speed).openTooltip();
            ship.bindTooltip("船名： " + name + "</br>MMSI：" + info.mmsi + "</br>船速： " + info.speed + "", {
                className: "shiptip"
            }).openTooltip();
            ship.on("click", function () {
                if(info.radarType!=2){
                    selectedShipMMSI = info.mmsi;
                    showShipDetail(info.mmsi);
                }else {
                    selectedShipMMSI = info.ename;
                    showRadarTtDetail(info.ename);
                }
            });
            ship.addTo(shipLayer);
        });
        map.addLayer(shipLayer);
    }

    // 画点
    function drawPoint(data) {
        // 其他图层移除
        var arr = ['shipLayer', 'shipPointLayer', 'selectedShipLayer', 'shipNameLayer', 'shipDetailLayer', 'targetLayer'];
        rejectLayer(arr);
        if (trackplaybackControl != null && trackplaybackControl.trackPlayBack.clock != null) {
            return false;
        }
        var point;
        $.each(data, function (infoIndex, info) {
            var shipColor = "#000000"
            if (info.typeOfShip == "A") {
                shipColor = "#0000ff"
            } else if (info.typeOfShip == "B") {
                shipColor = "#ffbb00"
            }
            point = L.circle([info.lat, info.lng], {
                color: shipColor,
                fillColor: shipColor,
                radius: 60,
                fillOpacity: 1
            }).addTo(map)
            point.addTo(shipPointLayer);
        })
        map.addLayer(shipPointLayer);
    }

    // 获取实时岸站数据
    function getStationData() {
        var data = {
            area: {
                northeast: {
                    lat: map.getBounds()._northEast.lat,
                    lng: map.getBounds()._northEast.lng
                },
                southwest: {
                    lat: map.getBounds()._southWest.lat,
                    lng: map.getBounds()._southWest.lng
                }
            },
        };
        admin.reqNoLoad('baseStation-api/getStationInfo', JSON.stringify(data), function (res) {
            // 岸站数据
            stationData = res.data;
            stationCount = res.cnt;
            if ($("#allList_left_middle ul li")[1].className == "layui-this") {
                var str = '【显示范围】' + stationCount + '个';
                $('#dataCount').html(str);
            }
            // 清空实时基站列表
            stationList = [];
            stationDisconnect = false;
            if (heatmapLayer == null  && !stationHistoryFlag && ($('input[name="layerControlLayer_stationShow"]').prop('checked') == true)){
                // if (heatmapLayer == null  && !stationHistoryFlag) {
                // 海图页面显示岸站
                drawStation(stationData);
                // 海图页面显示岸站名称
                if ($('input[name="layerControlLayer_stationName"]').prop('checked') == true) {
                    drawStationName()
                }
            }

        }, 'POST');
    }

    // 海图页面显示岸站
    function drawStation(data) {
        // 图层移除
        var arr = ['stationLayer'];
        rejectLayer(arr);
        var station;
        var size = (mapCurrentLevel + 1) * 4
        $.each(data, function (infoIndex, info) {
            var iconUrl = "../../assets/images/disconnect_0.png";
            // var iconUrl = "../../assets/images/normal_0.png";
            if (info.status == 0) {
                var eptStatus = 0;
                for (var i in info.eptStatus) {
                    if (info.eptStatus[i].level > eptStatus) {
                        eptStatus = info.eptStatus[i].level;
                    }
                }
                if (eptStatus == 1) {
                    iconUrl = "../../assets/images/warning_0.png";
                } else if (eptStatus == 2) {
                    iconUrl = "../../assets/images/normal_0.png";
                } else {
                    iconUrl = "../../assets/images/normal_" + info.ownFlg + ".png";
                }
            } else if (info.status == 1) {
                iconUrl = "../../assets/images/disconnect_0.png";
            } else if (info.status == 2) {
                iconUrl = "../../assets/images/error_" + info.ownFlg + ".png";
            } else {
                var eptStatus = 0;
                for (var i in info.eptStatus) {
                    if (info.eptStatus[i].level > eptStatus) {
                        eptStatus = info.eptStatus[i].level;
                    }
                }
                if (eptStatus == 1) {
                    iconUrl = "../../assets/images/warning_" + info.ownFlg + ".png";
                } else if (eptStatus == 2) {
                    iconUrl = "../../assets/images/error_" + info.ownFlg + ".png";
                } else {
                    iconUrl = "../../assets/images/normal_" + info.ownFlg + ".png";
                }
            }
            var stationImg = L.icon({
                iconUrl: iconUrl,
                iconSize: [size, size]
            });
            station = new L.marker([info.latitude, info.longitude], {
                icon: stationImg,
                zIndexOffset: info.status == 1 ? 0 : info.ownFlg == 0 ? 9999 : 10,
                attribution: info.mmsi
            });
            // 断开基站点击逻辑修改
            var mmsi = info.mmsi;
            var stationBean = {};
            stationBean.mmsi = mmsi;
            stationBean.status = info.status;
            stationBean.latitude = info.latitude;
            stationBean.longitude = info.longitude;
            stationBean.ownFlg = info.ownFlg;
            stationList.push(stationBean);
            station.on("click", function (e) {
                var overlapStationCount = 0;
                var overlapStation = [];
                var layer = stationLayer.getLayers();
                for (var i = 0; i < layer.length; i++) {
                    if ((layer[i]._icon._leaflet_pos.x - size / 2 < e.layerPoint.x)
                        && (e.layerPoint.x < layer[i]._icon._leaflet_pos.x + size / 2)
                        && (layer[i]._icon._leaflet_pos.y - size / 2 < e.layerPoint.y)
                        && (e.layerPoint.y < layer[i]._icon._leaflet_pos.y + size / 2)) {
                        overlapStation.push(layer[i].options.attribution)
                        overlapStationCount++;
                    }
                }
                if (overlapStationCount > 1) {
                    var tooltipStr = "<dl class=\"\" style=\"background-color: #fff0!important;border: 0px solid #000 !important;padding-top:0px;padding-bottom:0px;left: -15px;top: 40px\">";
                    for (var i = 0; i < overlapStation.length; i++) {
                        var str = "<dd>\n" +
                            "<button class=\"layui-btn layui-btn-sm \" name=\"" + overlapStation[i] + "\"\n" +
                            "style=\"height: 30px;width: 100px;line-height:30px;background-color: rgba(66,66,66,1)!important;\" lay-submit lay-filter=\"overlapStationChoose\"><i\n" +
                            "class=\"layui-icon \" style=\"font-size: 10px;\">\n" + overlapStation[i] +
                            "</i></button>\n" +
                            "</dd>"
                        tooltipStr += str;
                    }
                    tooltipStr += "</dl>"
                    stationPopup = L.popup({closeButton: false, offset: L.point(0, -size / 2)})
                        .setLatLng(e.latlng)
                        .setContent(tooltipStr)
                        .openOn(map);
                } else {
                    showStationDetail(mmsi);
                }
            })
            station.addTo(stationLayer);
        });
        map.addLayer(stationLayer);
        if ($("#allList_left").css("display") == "block") {

            table.reload('stationList', {
                data: stationData,

                initSort: {
                    field: stationTableSortName
                    , type: stationTableSortDesc
                }
            });

        }
    }

    // 获取实时航标数据
    function getAtonData() {
        var data = {
            area: {
                northeast: {
                    lat: map.getBounds()._northEast.lat,
                    lng: map.getBounds()._northEast.lng
                },
                southwest: {
                    lat: map.getBounds()._southWest.lat,
                    lng: map.getBounds()._southWest.lng
                }
            },
        };
        admin.reqNoLoad('navAids-api/getNavAidsInfo', JSON.stringify(data), function (res) {
            atonData = res.data;
            atonCount = res.cnt;
            if ($("#allList_left_middle ul li")[2].className == "layui-this") {
                var str = '【显示范围】' + atonCount + '个';
                $('#dataCount').html(str);
            }
            if (heatmapLayer == null && !stationHistoryFlag && ($('input[name="layerControlLayer_atonShow"]').prop('checked') == true)) {
                // if (heatmapLayer == null && !stationHistoryFlag) {
                // 海图页面显示航标
                drawAton(atonData);
                // 海图页面显示航标名称
                if ($('input[name="layerControlLayer_atonName"]').prop('checked') == true) {
                    drawAtonName()
                }
            }

        }, 'POST');
        if ($("#allList_left").css("display") == "block") {
            table.reload('atonList', {
                data: atonData,

                initSort: {
                    field: atonTableSortName
                    , type: atonTableSortDesc
                }
            });
        }
    }

    // 海图页面显示航标
    function drawAton(data) {
        // 其他图层移除
        var arr = ['atonLayer'];
        rejectLayer(arr);
        var aton;
        var size = (mapCurrentLevel + 1) * 2
        var iconUrl;
        $.each(data, function (infoIndex, info) {
            if (info.virtual == '1') {
                num = virtualSet[info.type];
                if (!num) {
                    num = 2
                }
                iconUrl = '../../assets/images//aton_virtual_' + num + '.png'
            } else {
                num = reallSet[info.type];
                if (!num) {
                    num = 0
                }
                iconUrl = '../../assets/images//aton_real_' + num + '.png'
            }
            var atonImg = L.icon({
                iconUrl: iconUrl,
                iconSize: [size, size]
            });
            aton = new L.marker([info.lat, info.lng], {icon: atonImg});
            aton.on("click", function () {
                showAtonDetail(info.mmsi);
            })
            aton.addTo(atonLayer);
        });
        map.addLayer(atonLayer);
    }

    // 显示船舶详情
    function showShipDetail(targetmmsi) {

        // 其他图层关闭
        var arr = ['stationDetailLayer', 'atonDetailLayer', 'heatmapLayer', 'targetLayer',  'owmStationLayer', 'fishingNetDetailLayer'];
        rejectLayer(arr);
        // 隐藏左侧列表
        hideAllList();
        // 国旗
        var country = targetmmsi.substring(0, 3);
        var data = {
            mmsi: targetmmsi,
            stationId: stationHistoryMMSI,
            startTime: stationHistoryStartTime,
            endTime: stationHistoryEndTime,
        };
        admin.reqNoLoad('shipDynamicStatic-api/getShipDetail', JSON.stringify(data), function (res) {
            if (res.datas.lat == null || res.datas.lng == null) {
                layer.msg("该船舶不在监控范围！", {icon: 2, time: config.msgTime});
                return;
            }
            map.flyTo([res.datas.lat, res.datas.lng], mapCurrentLevel > limitZoom ? mapCurrentLevel : limitZoom + 1);
            selectedShipShow(res.datas.lat, res.datas.lng, res.datas.heading, res.datas.course, res.datas.gpsRefPos1, res.datas.gpsRefPos2, res.datas.gpsRefPos3, res.datas.gpsRefPos4);
            $("#ship_MMSI").val(res.datas.mmsi);
            $("#shore_MMSI").val(res.datas.smmsi);
            $("#typeOfShip").val(res.datas.typeOfShip);
            var heading = res.datas.heading + '度';
            if (res.datas.heading == 511) {
                heading = "-";
            }
            $("#ship_heading").val(heading);
            //FSS
            if (res.datas.cname != null) {
                $("#ship_name").val(res.datas.cname)
            } else {
                $("#ship_name").val(res.datas.ename);
            }

            $("#ship_call_sign").val(res.datas.callSign);
            $("#ship_IMO").val(res.datas.imoNumber);
            var course = res.datas.course + '度';
            if (res.datas.course >= 360) {
                course = "-";
            }
            $("#ship_course").val(course);
            shipTypeTemp = res.datas.shipType
            $("#ship_type").val(getShipType(res.datas.shipType));
            var speed = res.datas.speed + '节';
            if (res.datas.speed == 102.3) {
                speed = "-";
            }
            $("#ship_speed").val(speed);
            $("#ship_navigation_status").val(getShipStatus(res.datas.status));
            var Lat = res.datas.lat;
            var du = Math.floor(Lat);
            var fen = Math.floor((Lat - du) * 60);
            var miao = Math.floor(((Lat - du) * 60 - fen) * 60);
            var lat = du + '°' + fen + '′' + miao + '″';
            $("#ship_lat").val(Number(res.datas.lat).toFixed(6) > 90 ? "-" : lat);
            $("#ship_length_width").val((res.datas.gpsRefPos1 + res.datas.gpsRefPos2) + "/" + (res.datas.gpsRefPos3 + res.datas.gpsRefPos4));
            var Lng = res.datas.lng;
            var LngDu = Math.floor(Lng);
            var LngFen = Math.floor((Lng - LngDu) * 60);
            var LngMiao = Math.floor(((Lng - LngDu) * 60 - LngFen) * 60);
            var lng = LngDu + '°' + LngFen + '′' + LngMiao + '″';
            $("#ship_lng").val(Number(res.datas.lng).toFixed(6) > 180 ? "-" : lng);
            $("#ship_data_source").val(res.datas.radarType == 0 ? "AIS（" + res.datas.smmsi + "）": res.datas.radarType == 1 ? "融合（" + res.datas.smmsi + "/" + res.datas.radarId + "）": "雷达（" +  res.datas.radarId + "）");
            $("#ship_destination").val(res.datas.destination);
            $("#receiveTime").val(layui.util.toDateString(new Date(res.datas.recvTime), "yyyy-MM-dd HH:mm:ss"));

            if (res.datas.etaMonth == undefined || res.datas.etaMonth == 0 || res.datas.etaMonth == null || res.datas.etaMonth == "") {
                $("#ship_eta").val("");
            } else {
                if (res.datas.etaMonth < 10) {
                    res.datas.etaMonth = '0' + res.datas.etaMonth;
                }
                if (res.datas.etaDay < 10) {
                    res.datas.etaDay = '0' + res.datas.etaDay;
                }
                if (res.datas.etaMinute < 10) {
                    res.datas.etaMinute = '0' + res.datas.etaMinute;
                }
                if (res.datas.etaHour < 10) {
                    res.datas.etaHour = '0' + res.datas.etaHour;
                }
                var year = new Date().getUTCFullYear()
                if ((new Date().getMonth() + 1) < res.datas.etaMonth) {
                    year += 1;
                }
                $("#ship_eta").val(year + "-" + res.datas.etaMonth + "-" + res.datas.etaDay + " " + res.datas.etaHour + ":" + res.datas.etaMinute + ":00");
            }
            //  $("#ship_distance").val(res.datas.distance == null?"":res.datas.distance + '海里');

            if (stationHistoryFlag) {
                $("#shipDetailButton").css('display', 'none');
            } else {
                $("#shipDetailButton").css('display', 'block');
            }

            if (res.datas.radarType == 2) {
                $("#shipDetailButton").css('display', 'none');
            } else {
                $("#shipDetailButton").css('display', 'block');
            }
            var title = '';
            if (Flags[country] != null) {
                title += '<span id="shipCountryFlag" style="float: left; height: 28px; width: 45px; background: url(../../assets/images/apiresource-flags/' + Flags[country] + '.png); background-repeat: no-repeat; margin: 3px; line-height: 20px;"></span>';
            }
            title += '<span>船舶详情</span>'
            if (shipDetailLayer == null) {
                shipDetailLayer = layer.open({
                    type: 1
                    ,
                    // offset: 'lt'
                    offset: ['-20px', '0']
                    ,
                    id: 'shipDetail_id'
                    ,
                    title: title
                    ,
                    content: $("#shipDetailLayer")
                    ,
                    btn: ''
                    ,
                    shade: 0
                    ,
                    skin: 'layui-layer-lan shipDetail_id'
                    ,
                    area: ['600px']
                    ,
                    resize: false
                    ,
                    cancel: function () {
                        var arr = ['shipDetailLayer', 'selectedShipLayer', 'targetLayer'];
                        rejectLayer(arr);
                    }
                    ,
                    success: function (layero, index) {
                        layer.style(index, {
                            marginLeft: 5,
                            marginTop: 110
                        })

                        sendArray = [];
                        sendData = [];
                    }
                    ,
                    zIndex: 10000
                });
            } else {
                layer.title(title, shipDetailLayer);
            }

            // if (!(shipTypeTemp == null || shipTypeTemp == '' || (shipTypeTemp >= 10 && shipTypeTemp <= 19) || shipTypeTemp == 30 || shipTypeTemp == 38
            //     || shipTypeTemp == 39 || (shipTypeTemp >= 90 && shipTypeTemp <= 99))) {
            //     $('.showTargetLayerForTrackExport').attr({"style": 'color: #747474'})
            // }
        }, 'POST');
    }
    // 显示船舶详情
    function showRadarTtDetail(ttName) {

        // 其他图层关闭
        var arr = ['stationDetailLayer', 'atonDetailLayer', 'heatmapLayer', 'targetLayer',  'owmStationLayer', 'fishingNetDetailLayer'];
        rejectLayer(arr);
        // 隐藏左侧列表
        hideAllList();
        // 国旗
        var country;
        var data = {
            mmsi: "",
            shipName:ttName,
            stationId: "",
            startTime: stationHistoryStartTime,
            endTime: stationHistoryEndTime,
        };
        admin.reqNoLoad('shipDynamicStatic-api/getRadarTtDetail', JSON.stringify(data), function (res) {
            if (res.datas.lat == null || res.datas.lng == null) {
                layer.msg("该船舶不在监控范围！", {icon: 2, time: config.msgTime});
                return;
            }
            map.flyTo([res.datas.lat, res.datas.lng], mapCurrentLevel > limitZoom ? mapCurrentLevel : limitZoom + 1);
            selectedShipShow(res.datas.lat, res.datas.lng, res.datas.heading, res.datas.course, res.datas.gpsRefPos1, res.datas.gpsRefPos2, res.datas.gpsRefPos3, res.datas.gpsRefPos4);
            $("#ship_MMSI").val("");
            $("#shore_MMSI").val("");
            $("#typeOfShip").val("");
            $("#ship_heading").val("-");
            $("#ship_name").val(res.datas.ename);
            $("#ship_call_sign").val("");
            $("#ship_IMO").val("");
            var course = res.datas.course + '度';
            if (res.datas.course >= 360) {
                course = "-";
            }
            $("#ship_course").val(course);
            $("#ship_type").val("");
            var speed = res.datas.speed + '节';
            if (res.datas.speed == 102.3) {
                speed = "-";
            }
            $("#ship_speed").val(speed);
            $("#ship_navigation_status").val(getShipStatus(res.datas.status));
            var Lat = res.datas.lat;
            var du = Math.floor(Lat);
            var fen = Math.floor((Lat - du) * 60);
            var miao = Math.floor(((Lat - du) * 60 - fen) * 60);
            var lat = du + '°' + fen + '′' + miao + '″';
            $("#ship_lat").val(Number(res.datas.lat).toFixed(6) > 90 ? "-" : lat);
            $("#ship_length_width").val((res.datas.gpsRefPos1 + res.datas.gpsRefPos2) + "/" + (res.datas.gpsRefPos3 + res.datas.gpsRefPos4));
            var Lng = res.datas.lng;
            var LngDu = Math.floor(Lng);
            var LngFen = Math.floor((Lng - LngDu) * 60);
            var LngMiao = Math.floor(((Lng - LngDu) * 60 - LngFen) * 60);
            var lng = LngDu + '°' + LngFen + '′' + LngMiao + '″';
            $("#ship_lng").val(Number(res.datas.lng).toFixed(6) > 180 ? "-" : lng);
            $("#ship_data_source").val(res.datas.radarType == 0 ? "AIS（" + res.datas.smmsi + "）": res.datas.radarType == 1 ? "融合（" + res.datas.smmsi + "/" + res.datas.radarId + "）": "雷达（" +  res.datas.radarId + "）");
            $("#ship_destination").val(res.datas.destination);
            $("#receiveTime").val(layui.util.toDateString(new Date(res.datas.recvTime), "yyyy-MM-dd HH:mm:ss"));

            if (res.datas.etaMonth == undefined || res.datas.etaMonth == 0 || res.datas.etaMonth == null || res.datas.etaMonth == "") {
                $("#ship_eta").val("");
            } else {
                if (res.datas.etaMonth < 10) {
                    res.datas.etaMonth = '0' + res.datas.etaMonth;
                }
                if (res.datas.etaDay < 10) {
                    res.datas.etaDay = '0' + res.datas.etaDay;
                }
                if (res.datas.etaMinute < 10) {
                    res.datas.etaMinute = '0' + res.datas.etaMinute;
                }
                if (res.datas.etaHour < 10) {
                    res.datas.etaHour = '0' + res.datas.etaHour;
                }
                var year = new Date().getUTCFullYear()
                if ((new Date().getMonth() + 1) < res.datas.etaMonth) {
                    year += 1;
                }
                $("#ship_eta").val(year + "-" + res.datas.etaMonth + "-" + res.datas.etaDay + " " + res.datas.etaHour + ":" + res.datas.etaMinute + ":00");
            }
            //  $("#ship_distance").val(res.datas.distance == null?"":res.datas.distance + '海里');

            if (stationHistoryFlag) {
                $("#shipDetailButton").css('display', 'none');
            } else {
                $("#shipDetailButton").css('display', 'block');
            }
            $("#quitMyFleet").hide();
            $("#joinMyFleet").hide();

            $("#cancleShip").hide();
            $("#careThisShip").hide();
            if (res.datas.radarType == 2) {
                $("#shipDetailButton").css('display', 'none');
            } else {
                $("#shipDetailButton").css('display', 'block');
            }
            var title = '';
            if (Flags[country] != null) {
                title += '<span id="shipCountryFlag" style="float: left; height: 28px; width: 45px; background: url(../../assets/images/apiresource-flags/' + Flags[country] + '.png); background-repeat: no-repeat; margin: 3px; line-height: 20px;"></span>';
            }
            title += '<span>船舶详情</span>'
            if (shipDetailLayer == null) {
                shipDetailLayer = layer.open({
                    type: 1
                    ,
                    // offset: 'lt'
                    offset: ['-20px', '0']
                    ,
                    id: 'shipDetail_id'
                    ,
                    title: title
                    ,
                    content: $("#shipDetailLayer")
                    ,
                    btn: ''
                    ,
                    shade: 0
                    ,
                    skin: 'layui-layer-lan shipDetail_id'
                    ,
                    area: ['600px']
                    ,
                    resize: false
                    ,
                    cancel: function () {
                        var arr = ['shipDetailLayer', 'selectedShipLayer', 'targetLayer'];
                        rejectLayer(arr);
                    }
                    ,
                    success: function (layero, index) {
                        layer.style(index, {
                            marginLeft: 5,
                            marginTop: 110
                        })

                        sendArray = [];
                        sendData = [];
                    }
                    ,
                    zIndex: 10000
                });
            } else {
                layer.title(title, shipDetailLayer);
            }

            // if (!(shipTypeTemp == null || shipTypeTemp == '' || (shipTypeTemp >= 10 && shipTypeTemp <= 19) || shipTypeTemp == 30 || shipTypeTemp == 38
            //     || shipTypeTemp == 39 || (shipTypeTemp >= 90 && shipTypeTemp <= 99))) {
            //     $('.showTargetLayerForTrackExport').attr({"style": 'color: #747474'})
            // }
        }, 'POST');
    }

    // //获取实时网位仪数据
    // function getFishingNetData() {
    //     var data = {
    //         northeast: {
    //             lat: map.getBounds()._northEast.lat,
    //             lng: map.getBounds()._northEast.lng
    //         },
    //         southwest: {
    //             lat: map.getBounds()._southWest.lat,
    //             lng: map.getBounds()._southWest.lng
    //         }
    //     };
    //     admin.reqNoLoad('shipDynamicStatic-api/getFishingNetInfo', JSON.stringify(data), function (res) {
    //
    //         netData = res.data;
    //         netCount = res.cnt;
    //         // 网位仪数据更新
    //         fishingNetData = res.fishingNets;
    //
    //         if (heatmapLayer == null &&
    //             !stationHistoryFlag && trackListLayer == null) {
    //             // 页面显示网位仪
    //             if (mapCurrentLevel > limitZoom) {
    //                 drawFishingNet(fishingNetData);
    //             } else {
    //                 drawFishingNetPoint(fishingNetData);
    //             }
    //         }
    //
    //     }, 'POST');
    //
    //     if ($("#allList_left").css("display") == "block") {
    //         table.reload('netList', {
    //             data: fishingNetData,
    //             initSort: {
    //                 field: netTableSortName
    //                 , type: netTableSortDesc
    //             }
    //         });
    //     }
    // }

    // 画网位仪
    // function drawFishingNet(data) {
    //     // 其他图层关闭
    //     var arr = ['fishingNetLayer', 'fishingNetPointLayer'];
    //     rejectLayer(arr);
    //     var fishingNet;
    //     var size = (mapCurrentLevel + 1) * 2
    //     var iconUrl = "../../assets/images/fishingNet.png";
    //     $.each(data, function (infoIndex, info) {
    //         var fishingNetImg = L.icon({
    //             iconUrl: iconUrl,
    //             iconSize: [size, size]
    //         });
    //         fishingNet = new L.marker([info.lat, info.lng], {icon: fishingNetImg});
    //         fishingNet.on("click", function () {
    //             showFishingNetDetail(info.mmsi);
    //         })
    //         fishingNet.addTo(fishingNetLayer);
    //     });
    //     map.addLayer(fishingNetLayer);
    // }
    //
    // // 画网位仪点
    // function drawFishingNetPoint(data) {
    //     // 其他图层移除
    //     var arr = ['fishingNetLayer', 'fishingNetPointLayer', 'fishingNetDetailLayer', 'targetLayer'];
    //     rejectLayer(arr);
    //     var point;
    //     var fishingNetColor = "#8a8a8a"
    //     $.each(data, function (infoIndex, info) {
    //         point = L.circle([info.lat, info.lng], {
    //             color: fishingNetColor,
    //             fillColor: fishingNetColor,
    //             radius: 60,
    //             fillOpacity: 1
    //         })
    //         point.addTo(fishingNetPointLayer);
    //     })
    //     map.addLayer(fishingNetPointLayer);
    // }
    // 船舶选择框图层
    function selectedShipShow(lat, lng, heading, course, gpsRefPos1, gpsRefPos2, gpsRefPos3, gpsRefPos4) {
        // 其他图层关闭
        var arr = ['selectedShipLayer'];
        rejectLayer(arr);
        var selectedShip = L.trackSymbol(L.latLng(lat, lng), {
            fill: false,
            stroke: true,
            heading: heading * Math.PI / 180.0,
            course: course * Math.PI / 180.0,
            type: 'target',
            gpsRefPos: [gpsRefPos1, gpsRefPos2, gpsRefPos3, gpsRefPos4],
            color: "#fd0404",
            weight: 1.5,
        });
        selectedShip.addTo(selectedShipLayer);
        map.addLayer(selectedShipLayer);
        drawShip(stationHistoryFlag ? historyShipData : shipData);
    }

    // 显示岸站详细
    function showStationDetail(targetmmsi) {
        // 其他图层关闭
        var arr = ['heatmapLayer', 'shipDetailLayer', 'selectedShipLayer', 'targetLayer', 'atonDetailLayer',  'owmStationLayer', 'fishingNetDetailLayer'];
        rejectLayer(arr);
        // 隐藏左侧列表
        hideAllList();
        var data = {
            mmsi: targetmmsi,
            stationId: stationHistoryMMSI,
            startTime: stationHistoryStartTime == '' || stationHistoryStartTime == undefined ? new Date().getTime() : stationHistoryStartTime,
            endTime: stationHistoryEndTime == '' || stationHistoryEndTime == undefined ? new Date().getTime() : stationHistoryEndTime,
        };
        // 断连得基站无需请求后台（断连无数据）
        var count = 0;
        if (stationList.length != 0) {
            for (var index in stationList) {
                if (targetmmsi == stationList[index].mmsi) {
                    if (stationList[index].status == 4 || stationList[index].status == 2) {
                        stationDisconnect = true;
                        // layer.msg("设备断开连接！");
                        // return;
                        count = index;

                    }
                }
            }
        }
        stationDisconnect = false;
        if (stationDisconnect) {
            map.flyTo([stationList[count].lat, stationList[count].lng], mapCurrentLevel);
            $("#station_MMSI2").val(stationList[count].mmsi);
            $("#station_lat2").val(Number(stationList[count].lat).toFixed(6));
            $("#station_lng2").val(Number(stationList[count].lng).toFixed(6));
            if (stationList[index].status == 4) {
                $("#station_own_flg2").val('是');
            } else {
                $("#station_own_flg2").val('否');
            }
            stationDetailLayer = layer.open({
                type: 1
                // , offset: 'lt'
                , offset: ['-20px', '0']
                , id: 'stationDetail_id'
                , title: '岸站详情'
                , content: $("#stationDetailLayer2")
                , btn: ''
                , shade: 0
                , skin: 'layui-layer-lan stationDetail_id'
                , area: ['500px']
                , resize: false
                , cancel: function () {
                    $("#station_MMSI").val('');
                    var arr = ['stationDetailLayer'];
                    rejectLayer(arr);
                }
                , success: function (layero, index) {
                    layer.style(index, {
                        marginLeft: 5,
                        marginTop: 110
                    })
                }
                , zIndex: 10000
            });

        } else {
            admin.reqNoLoad('baseStation-api/getStationDetail', JSON.stringify(data), function (res) {
                //*******
                // admin.reqNoLoad('shipDynamicStatic-api/getShipInfo', JSON.stringify(data), function (res1) {
                // var maxDistance=Math.max(res1.datas.distance);
                if (res.datas == null || res.datas.lat == null || res.datas.lng == null) {
                    layer.msg("web接口返回值异常，经纬度为空！", {icon: 2, time: config.msgTime});
                    return;
                }
                map.flyTo([res.datas.lat / 600000, res.datas.lng / 600000], mapCurrentLevel);
                var ownFlg = res.datas.ownFlg == 0 ? '是' : '不是';
                var lat = (Number(res.datas.lat) / 600000).toFixed(6) > 90 ? "-" : (Number(res.datas.lat) / 600000).toFixed(6);
                var lng = (Number(res.datas.lng) / 600000).toFixed(6) > 180 ? "-" : (Number(res.datas.lng) / 600000).toFixed(6);
                var slot = res.datas.slot == null ? '' : res.datas.slot;
                var station_aerial_status = "";
                res.datas.connectNum == null ? res.datas.connectNum = 0 : res.datas.connectNum = res.datas.connectNum;
                res.datas.distance == null ? res.datas.distance = 0 : res.datas.distance = res.datas.distance;
                switch (res.datas.aerialStatus) {
                    case 0:
                        station_aerial_status = "正常";
                        break;
                    case 1:
                        station_aerial_status = "开路";
                        break;
                    case 2:
                        station_aerial_status = "短路";
                        break;
                    case 3:
                        station_aerial_status = "保留";
                        break;
                }

                var stationDetailhtml = "<div id='stationDetailLayer' class='layui-form' >" +
                    "<table class='layui-table no-hover-table' lay-skin='nob'>" +
                    "<tbody>" +
                    "<tr>" +
                    "<td >MMSI：</td>" +
                    "<td><input style='border: 0px;' id='station_MMSI' value='" + res.datas.mmsi + "'readonly /></td>" +
                    "<td >名称：</td>" +
                    "<td><input style='border: 0px;' id='station_name' value='" + res.datas.name + "' readonly></td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td >最远作用距离：</td>" +
                    "<td><input style='border: 0px; id='station_distance' value='" + Math.floor(res.datas.distance) + "海里' readonly></td>" +
                    "<td >纬度：</td>" +
                    "<td><input style='border: 0px;' id='station_lat' value='" + lat + "' readonly /></td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td >连接船舶数量：</td>" +
                    "<td><input style='border: 0px;' id='station_conect_ships' value='" + res.datas.connectNum + "' readonly></td>" +
                    "<td >经度：</td>" +
                    "<td><input style='border: 0px;' id='station_lng' value='" + lng + "' readonly></td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td >是否自有岸站：</td>" +
                    "<td><input style='border: 0px;' id='station_own_flg' value='" + ownFlg + "' readonly></td>" +
                    // "<td >天线：</td>" +
                    // "<td><input style='border: 0px;' id='station_aerial_status' value='" + station_aerial_status + "' readonly></td>" +
                    "</tr>" +
                    "<!--<tr>-->" +
                    "<!--<td style='width:150px'>设备温度：</td>-->" +
                    "<!--<td><input style='border: 0px;outline:none;width:90px' id='station_device_temperature' readonly>-->" +
                    "<!--</td>-->" +
                    "<!--<td style='width:110px'>供电电压：</td>-->" +
                    "<!--<td><input style='border: 0px;outline:none;width:90px' id='station_service_voltage' readonly></td>-->" +
                    "<!--</tr>-->" +
                    // "<tr>" +
                    // "<td >时隙占用数：</td>" +
                    // "<td><input style='border: 0px;' id='station_slot' value='" + slot + "' readonly></td>" +
                    // "<td></td>" +
                    // "<td></td>" +
                    // "</tr>" +
                    "</tbody>" +
                    "</table>" +
                    "<div id='stationDetailSend' style='text-align: center;margin-top:10px;'>"
                // if (shoreSendSafeMsg == false) {
                //     stationDetailhtml += "<button class='layui-btn layui-btn-normal' style='width: 100px;display: none' id='sendSafeMsgControl2' name='sendSafeMsgControl' lay-submit lay-filter='navigationBoxLayer'>发送消息</button>";
                // } else {
                //     stationDetailhtml += "<button class='layui-btn layui-btn-normal' style='width: 100px;' id='sendSafeMsgControl2' name='sendSafeMsgControl' lay-submit lay-filter='navigationBoxLayer'>发送消息</button>";
                // }
                stationDetailhtml += "</div></div>";

                var stationDetailhtml2 = "<div id='stationDetailLayer2' class='layui-form' >" +
                    "<table class='layui-table no-hover-table' lay-skin='nob'>" +
                    "<tbody>" +
                    "<tr>" +
                    "<td >MMSI：</td>" +
                    "<td><input style='border: 0px;' id='station_MMSI2' value='" + res.datas.mmsi + "' readonly></input></td>" +
                    "<td >经度：</td>" +
                    "<td><input style='border: 0px;' id='station_lng2' value='" + lat + "' readonly></td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td >纬度：</td>" +
                    "<td><input style='border: 0px;' id='station_lat2' value='" + lng + "' readonly /></td>" +
                    "<td >是否自有岸站：</td>" +
                    "<td><input style='border: 0px;' id='station_own_flg2' value='" + ownFlg + "' readonly></td>" +
                    "</tr>" +
                    "</tbody>" +
                    "</table>" +
                    "</div>"

                if (stationHistoryFlag) {
                    if (res.datas.ownFlg == 0) {
                        if (stationDetailLayer == null) {
                            stationFunction(stationDetailhtml);
                        } else {
                            $("#stationDetail_id").html(stationDetailhtml)
                        }
                        $("#stationDetail_id").css("height", "220px");
                    } else {
                        if (stationDetailLayer == null) {
                            stationFunction(stationDetailhtml2);
                        } else {
                            $("#stationDetail_id").html(stationDetailhtml2)
                        }
                        $("#stationDetail_id").css("height", "100px");
                    }
                    $("#stationDetailSend").css('display', 'none');
                } else {
                    if (res.datas.ownFlg == 0) {
                        $("#stationDetailSend").css("display", "block");
                        if (stationDetailLayer == null) {
                            stationFunction(stationDetailhtml);

                        } else {
                            $("#stationDetail_id").html(stationDetailhtml)
                        }
                        $("#stationDetail_id").css("height", "200px");
                    } else {
                        if (stationDetailLayer == null) {
                            stationFunction(stationDetailhtml2);
                        } else {
                            $("#stationDetail_id").html(stationDetailhtml2)
                        }
                        $("#stationDetail_id").css("height", "100px");
                    }
                }
            }, 'POST');
            // }, 'POST');
        }
    }

    function stationFunction(id) {
        stationDetailLayer = layer.open({
            type: 1
            // , offset: 'lt'
            , offset: ['-20px', '0']
            , id: 'stationDetail_id'
            , title: '岸站详情'
            , content: id
            , btn: ''
            , shade: 0
            , skin: 'layui-layer-lan stationDetail_id'
            , area: ['500px']
            , resize: false
            , cancel: function () {
                $("#station_MMSI").val('');
                var arr = ['stationDetailLayer'];
                rejectLayer(arr);
            }
            , success: function (layero, index) {
                layer.style(index, {
                    marginLeft: 5,
                    marginTop: 110
                })
            }
            , zIndex: 10000
        });
    }

    // 显示航标详细
    function showAtonDetail(targetmmsi) {
        // 其他图层关闭
        var arr = ['heatmapLayer', 'shipDetailLayer', 'selectedShipLayer', 'targetLayer', 'stationDetailLayer',  'owmStationLayer', 'fishingNetDetailLayer'];
        rejectLayer(arr);
        // 隐藏左侧列表
        hideAllList();
        for (var i in atonData) {
            if (targetmmsi == atonData[i].mmsi) {
                map.flyTo([atonData[i].lat, atonData[i].lng], mapCurrentLevel);
                $("#aton_MMSI").val(atonData[i].mmsi);
                $("#aton_name").val(atonData[i].name);
                $("#aton_lat").val(Number(atonData[i].lat).toFixed(4) > 90 ? "-" : Number(atonData[i].lat).toFixed(4));
                $("#aton_lng").val(Number(atonData[i].lng).toFixed(4) > 180 ? "-" : Number(atonData[i].lng).toFixed(4));
                $("#aton_size").val(atonData[i].size);
                $("#aton_type").val(atonType[atonData[i].type]);
                $("#aton_virtual").val(atonData[i].virtual == 0 ? '实体航标' : '虚拟航标');

                if (atonDetailLayer == null) {
                    atonDetailLayer = layer.open({
                        type: 1
                        // , offset: 'lt'
                        , offset: ['-20px', '0']
                        , id: 'atonDetail_id'
                        , title: '航标详情'
                        , content: $("#atonDetailLayer")
                        , btn: ''
                        , shade: 0
                        , skin: 'layui-layer-lan atonDetail_id'
                        , area: ['650px']
                        , resize: false
                        , cancel: function () {
                            var arr = ['atonDetailLayer'];
                            rejectLayer(arr);
                        }
                        , success: function (layero, index) {
                            layer.style(index, {
                                marginLeft: 5,
                                marginTop: 110
                            })
                        }
                        , zIndex: 10000
                    });
                }
                break;
            }

        }
    }

    // 显示网位仪详细
    // function showFishingNetDetail(targetmmsi) {
    //     // 其他图层关闭
    //     var arr = ['heatmapLayer', 'shipDetailLayer', 'selectedShipLayer', 'targetLayer', 'stationDetailLayer',  'owmStationLayer', 'atonDetailLayer'];
    //     rejectLayer(arr);
    //     // 隐藏左侧列表
    //     hideAllList();
    //     for (var i in fishingNetData) {
    //         if (targetmmsi == fishingNetData[i].mmsi) {
    //             map.flyTo([fishingNetData[i].lat, fishingNetData[i].lng], mapCurrentLevel > limitZoom ? mapCurrentLevel : limitZoom + 1);
    //             $("#fishingNet_MMSI").val(fishingNetData[i].mmsi);
    //             $("#fishingNet_name").val(fishingNetData[i].ename);
    //             $("#fishingNet_lat").val(Number(fishingNetData[i].lat).toFixed(4) > 90 ? "-" : Number(fishingNetData[i].lat).toFixed(4));
    //             $("#fishingNet_lng").val(Number(fishingNetData[i].lng).toFixed(4) > 180 ? "-" : Number(fishingNetData[i].lng).toFixed(4));
    //             $("#fishingNet_recvTime").val(layui.util.toDateString(new Date(fishingNetData[i].recvTime), "yyyy-MM-dd HH:mm:ss"));
    //             if (fishingNetDetailLayer == null) {
    //                 fishingNetDetailLayer = layer.open({
    //                     type: 1
    //                     // , offset: 'lt'
    //                     , offset: ['-20px', '0']
    //                     , id: 'fishingNetDetail_id'
    //                     , title: '网位仪详情'
    //                     , content: $("#fishingNetDetailLayer")
    //                     , btn: ''
    //                     , shade: 0
    //                     , skin: 'layui-layer-lan'
    //                     , area: ['540px']
    //                     , resize: false
    //                     , cancel: function () {
    //                         var arr = ['fishingNetDetailLayer'];
    //                         rejectLayer(arr);
    //                     }
    //                     , success: function (layero, index) {
    //                         layer.style(index, {
    //                             marginLeft: 5,
    //                             marginTop: 110
    //                         })
    //                     }
    //                     , zIndex: 10000
    //                 });
    //             }
    //             break;
    //         }
    //
    //     }
    // }

    // 船舶名称
    function drawShipName() {
        // 其他图层关闭
        var arr = ['shipNameLayer'];
        rejectLayer(arr);
        if (trackplaybackControl != null && trackplaybackControl.trackPlayBack.clock != null) {
            return false;
        }
        $.each(shipData, function (infoIndex, info) {
            if (info.heading == 511 || info.heading == undefined || isNaN(info.heading)) {
                info.heading = info.course;
            } else {
                info.heading = info.heading;
            }
            ;
            var headingAngle = Math.PI / 2.0 - (info.heading * Math.PI / 180.0)
            var points;
            var result = [];
            if (mapCurrentLevel <= 14) {
                if (info.heading < 180) {
                    points = [0.75, 0];
                } else {
                    points = [-0.25, -0.3];
                }
                var totatePoints = rotateAllPoints(points, headingAngle)
                var symbolViewCenter = map.latLngToLayerPoint(L.latLng(info.lat, info.lng));
                for (var i = 0; i < totatePoints.length; i += 2) {
                    var x = symbolViewCenter.x + totatePoints[i + 0];
                    var y = symbolViewCenter.y - totatePoints[i + 1];
                    result.push(x);
                    result.push(y);
                }
            } else {
                if (info.heading < 90) {
                    points = [1, 0.5];
                } else if (info.heading >= 90 && info.heading < 180) {
                    points = [0.75, 1];
                } else if (info.heading >= 180 && info.heading < 270) {
                    points = [0, 1];
                } else {
                    points = [0.75, 0];
                }
                var size = [info.gpsRefPos1 + info.gpsRefPos2, info.gpsRefPos3 + info.gpsRefPos4];
                var offset = [-info.gpsRefPos2, -info.gpsRefPos4]
                for (var i = 0; i < points.length; i += 2) {
                    var pt = [
                        points[i + 0],
                        points[i + 1]
                    ];
                    pt = [pt[0] * size[0] + offset[0], pt[1] * size[1] + offset[1]];
                    pt = rotate(pt, headingAngle);
                    var pointLng = info.lng + ((pt[0] / 40075017) * 360) / Math.cos((Math.PI / 180) * info.lat)
                    var pointLat = info.lat + (pt[1] / 40075017) * 360;
                    var viewPoint = map.latLngToLayerPoint(L.latLng([pointLat, pointLng]));
                    result.push(viewPoint.x);
                    result.push(viewPoint.y);
                }
            }
            var lat = map.layerPointToLatLng([result[0], result[1]]).lat;
            var lng = map.layerPointToLatLng([result[0], result[1]]).lng;

            var num;
            var numSet = {
                "8": 0.005,
                "9": 0.005,
                "10": 0.005,
                "11": 0.005,
                "12": 0.0035,
                "13": 0.0025,
                "14": 0.0015,
                "15": 0.001,
                "16": 0.0007,
                "17": 0.0006,
                "18": 0.0004
            };
            num = numSet[mapCurrentLevel];
            if (!num) {
                num = 0.005
            }
            L.polyline([[lat + num, lng + num], [lat, lng]], {
                weight: 0.5,
                color: 'gray'
            }).addTo(shipNameLayer);
            var line = L.polyline([[lat + num, lng + num], [lat + num, lng + 0.1]], {
                weight: 0.5,
                color: 'gray',
                opacity: 0
            }).addTo(shipNameLayer);
            line.setText(info.ename, {
                repeat: false,
                offset: 0,
                attributes: {
                    fill: 'gray',
                    'font-weight': '0',
                    'font-size': '12'
                }
            });
        })
        map.addLayer(shipNameLayer);
    }

    // 岸站名称
    function drawStationName() {
        // 其他图层关闭
        var arr = ['stationNameLayer'];
        rejectLayer(arr);

        var num;
        var numSet = {
            "2": 1.5,
            "3": 1,
            "4": 0.8,
            "5": 0.45,
            "6": 0.2,
            "7": 0.15,
            "8": 0.09,
            "9": 0.05,
            "10": 0.02,
            "11": 0.01,
            "12": 0.006,
            "13": 0.003,
            "14": 0.002,
            "15": 0.001,
            "16": 0.0005,
            "17": 0.0003,
            "18": 0.0002
        };
        num = numSet[mapCurrentLevel];
        if (!num) {
            num = 0.005
        }
        $.each(stationData, function (infoIndex, info) {
            L.polyline([[parseFloat(info.latitude) + num, parseFloat(info.longitude) + num], [info.latitude, info.longitude]], {
                weight: 0.5,
                color: 'gray'
            }).addTo(stationNameLayer);
            var line = L.polyline([[parseFloat(info.latitude) + num, parseFloat(info.longitude) + num], [parseFloat(info.latitude) + num, parseFloat(info.longitude) + num * 100]], {
                weight: 0.5,
                color: 'gray',
                opacity: 0
            }).addTo(stationNameLayer);
            line.setText(info.name, {
                repeat: false,
                offset: 0,
                attributes: {
                    fill: 'gray',
                    'font-weight': '0',
                    'font-size': '12'
                }
            });
        })
        map.addLayer(stationNameLayer);
    }

    // 航标名称
    function drawAtonName() {
        // 其他图层关闭
        var arr = ['atonNameLayer'];
        rejectLayer(arr);

        var num;
        var numSet = {
            "2": 1.5,
            "3": 1,
            "4": 0.4,
            "5": 0.25,
            "6": 0.15,
            "7": 0.10,
            "8": 0.05,
            "9": 0.02,
            "10": 0.01,
            "11": 0.007,
            "12": 0.004,
            "13": 0.002,
            "14": 0.001,
            "15": 0.0005,
            "16": 0.0002,
            "17": 0.0001,
            "18": 0.00005
        };
        num = numSet[mapCurrentLevel];
        if (!num) {
            num = 0.005
        }
        $.each(atonData, function (infoIndex, info) {
            L.polyline([[parseFloat(info.lat) + num, parseFloat(info.lng) + num], [info.lat, info.lng]], {
                weight: 0.5,
                color: 'gray'
            }).addTo(atonNameLayer);
            var line = L.polyline([[parseFloat(info.lat) + num, parseFloat(info.lng) + num], [parseFloat(info.lat) + num, parseFloat(info.lng) + num * 100]], {
                weight: 0.5,
                color: 'gray',
                opacity: 0
            }).addTo(atonNameLayer);
            line.setText(info.name, {
                repeat: false,
                offset: 0,
                attributes: {
                    fill: 'gray',
                    'font-weight': '0',
                    'font-size': '12'
                }
            });
        })
        map.addLayer(atonNameLayer);
    }




//    搜索框搜索 判断名字是否为空
    var shipname=true;
    var stationname=true;
    var atonname=true;
    var fishingnetname=true;

    // 输入框检索时获得自动补齐数据
    function getAutoCompleteData() {
        var val = $("#saerchMMSIorName").val().toUpperCase();
        // 文本框值为空时，隐藏模糊查询框并且返回
        if (val == '') {
            $("#autoComplete").css("display", "none");
            return;
        }
        hideAllList();

        var ul = document.getElementById("autoComplete");
        ul.innerHTML = "";
        for (var i in shipData) {
            shipData[i].mmsi = shipData[i].mmsi + '';
            shipData[i].ename = shipData[i].ename==null?'':shipData[i].ename + '';
            if (shipData[i].mmsi.indexOf(val) > -1 || shipData[i].ename.indexOf(val) > -1) {
                if(shipData[i].ename==''){
                    shipname=false;
                }
                var ele = document.createElement('li');
                ele.innerHTML = "<li class = 'item' style='border: none;margin-left: 5px;' >" + shipData[i].ename + " | " + shipData[i].mmsi + "<span style='float: right;font-size: 10px;margin-right: 10px;'> 船舶</span></li > "
                ul.appendChild(ele);
            }
        }
        for (var i in stationData) {
            stationData[i].mmsi = stationData[i].mmsi + '';
            stationData[i].name = stationData[i].name + '';
            if (stationData[i].mmsi.indexOf(val) > -1||stationData[i].name.indexOf(val) > -1) {
                if(stationData[i].name==''){
                    stationname=false;
                }
                var ele = document.createElement('li');
                ele.innerHTML = "<li class = 'item' style='border: none;margin-left: 5px;'>" + stationData[i].name + " | " + stationData[i].mmsi + "<span style='float: right;font-size: 10px;margin-right: 10px'>岸站</span></li > "
                ul.appendChild(ele);
            }

        }
        for (var i in atonData) {
            atonData[i].mmsi = atonData[i].mmsi + '';
            atonData[i].name = atonData[i].name + '';
            if (atonData[i].mmsi.indexOf(val) > -1||atonData[i].name.indexOf(val) > -1) {
                if(atonData[i].name==''){
                    atonname=false;
                }
                var ele = document.createElement('li');
                var atonName = atonData[i].name;
                if (atonName.length > 20) {
                    ele.innerHTML = "<li class = 'item' style='border: none;margin-left: 5px'>" + atonData[i].name.substring(0, 20) + "..." + " | " + atonData[i].mmsi + "<span style='float: right;font-size: 10px;margin-right: 10px'>助航设备</span></li > "
                } else {
                    ele.innerHTML = "<li class = 'item' style='border: none;margin-left: 5px'>" + atonData[i].name + " | " + atonData[i].mmsi + "<span style='float: right;font-size: 10px;margin-right: 10px'>助航设备</span></li > "
                }
                ul.appendChild(ele);
            }
        }
        // for (var i in fishingNetData) {
        //     fishingNetData[i].mmsi = fishingNetData[i].mmsi + '';
        //     fishingNetData[i].ename = fishingNetData[i].ename + '';
        //     if (fishingNetData[i].mmsi.indexOf(val) > -1||fishingNetData[i].ename.indexOf(val) > -1) {
        //         if(fishingNetData[i].ename==''){
        //             fishingnetname=false;
        //         }
        //         var ele = document.createElement('li');
        //         var fishingNetName=fishingNetData[i].ename;
        //         if(fishingNetName.length>20){
        //             ele.innerHTML = "<li class = 'item' style='border: none;margin-left: 5px'>" + fishingNetData[i].ename.substring(0,20)+"..." +" | "+ fishingNetData[i].mmsi + "<span style='float: right;font-size: 10px;margin-right: 10px'>网位仪</span></li > "
        //         }else{
        //             ele.innerHTML = "<li class = 'item' style='border: none;margin-left: 5px'>" + fishingNetData[i].ename+" | "+ fishingNetData[i].mmsi + "<span style='float: right;font-size: 10px;margin-right: 10px'>网位仪</span></li > "
        //         }
        //         ul.appendChild(ele);
        //     }
        // }
        $("#autoComplete .item").click(function (data) {
            var type = "";
            var mmsi = "";
            if (this.innerText.indexOf("船舶") > -1) {
                type = "SHIP";
                // mmsi = this.innerText.replace("船舶", "");
                if(shipname==true){
                    mmsi = this.innerText.replace("船舶", "").split(" | ")[1];
                }else if(shipname==false){
                    mmsi = this.innerText.replace("船舶", "").split("| ")[1];
                }
            } else if (this.innerText.indexOf("岸站") > -1) {
                type = "STATION";
                if(stationname==true) {
                    mmsi = this.innerText.replace("岸站", "").split(" | ")[1];
                }else if(stationname==false){
                    mmsi = this.innerText.replace("岸站", "").split("| ")[1];
                }
            } else if (this.innerText.indexOf("助航设备") > -1) {
                type = "ATON";
                if(atonname=true){
                    mmsi = this.innerText.replace("助航设备", "").split(" | ")[1];
                }else if(atonname=false){
                    mmsi = this.innerText.replace("助航设备", "").split("| ")[1];
                }

            }else if (this.innerText.indexOf("网位仪") > -1) {
                type = "NET";
                if(fishingnetname=true){
                    mmsi = this.innerText.replace("网位仪", "").split(" | ")[1];
                }else if(fishingnetname=false){
                    mmsi = this.innerText.replace("网位仪", "").split("| ")[1];
                }
            }
            autoCompleteClick(mmsi, type);
        });
        $("#autoComplete").css("display", "block");
    }
    // 轨迹回放输入框检索时获得自动补齐数据
    function getPlaybackTrackAutoCompleteData() {
        return;
        var val = $("#targetShipMMSI_playbackTrack").val();
        // 文本框值为空时，隐藏模糊查询框并且返回
        if (val == '') {
            $("#targetShipMMSI_autoComplete").css("display", "none");
            return;
        }
        var data = {
            mmsi: val,
            type: 'SHIP',
            periodTime: 30 * 60
        };

        var ul = document.getElementById("targetShipMMSI_autoComplete");
        ul.innerHTML = "";
        admin.req('shipHistory-api/getShipHistoryInfo', JSON.stringify(data), function (res) {
            var resData = res.data.completeData;
            if (resData.length == 0) {
                $("#targetShipMMSI_autoComplete").css("display", "none");
            } else {
                for (var i = 0; i < resData.length; i++) {
                    var ele = document.createElement('li');
                    ele.innerHTML = "<li class = 'item'>" + resData[i] + "</li > "
                    ul.appendChild(ele);
                }
                $("#targetShipMMSI_autoComplete .item").click(function () {
                    $("#targetShipMMSI_playbackTrack").val(this.innerHTML.split(" | ")[0]);
                    $("#targetShipMMSI_autoComplete").css("display", "none");
                });
                $("#targetShipMMSI_autoComplete").css("display", "block");
            }
        }, 'POST');
    }

    // 模糊查询列表点击
    function autoCompleteClick(mmsi, searchType) {
        mmsi = mmsi.toString().replace("\n", "")
        if (searchType == 'SHIP') {
            showShipDetail(mmsi);
        } else if (searchType == 'STATION') {
            showStationDetail(mmsi);
        } else if (searchType == 'ATON') {
            showAtonDetail(mmsi);
        } else if (searchType == 'NET') {
            showFishingNetDetail(mmsi);
        }
        $("#saerchMMSIorName").val(mmsi);
        setTimeout(function () {
            $("#autoComplete").css("display", "none")
        }, 100);
    }



    // $('#lb').click(function () {
    //     showAllList();
    // });

    // 显示左侧列表
    function showAllList() {
        var arr = ['atonDetailLayer', 'heatmapLayer', 'shipDetailLayer', 'selectedShipLayer', 'targetLayer', 'stationDetailLayer',  'owmStationLayer'];
        rejectLayer(arr);

        showTabBtn = true;
        $("#allList_left").css("display", "block");
        // 船舶列表
        table.render({
            elem: '#shipList'
            , data: shipData
            , height: '600px'
            , size: 'sm'
            , cols: [[
                {field: 'mmsi', title: 'MMSI', sort: true, width: '22%'}
                , {field: 'ename', title: '船舶名称', sort: true, width: '23%'}
                , {field: 'distance', title: '距离岸站（海里）', sort: true, width: '30%'}
                , {
                    field: 'recvTime', title: '更新时间', sort: true, width: '25%', templet: function (d) {
                        return layui.util.toDateString(new Date(d.recvTime), "HH:mm:ss")
                    }
                }
            ]]
            , limit: 500
            , initSort: {
                field: shipTableSortName
                , type: shipTableSortDesc
            }
        });
        table.on('sort(shipList)', function (obj) {
            shipTableSortName = obj.field;
            shipTableSortDesc = obj.type;
        });
        table.on('row(shipList)', function (obj) {
            hideAllList();
            searchShip(obj.data.mmsi);
        });
        // 岸站列表
        table.render({
            elem: '#stationList'
            , data: stationData
            , height: '600px'
            , id: 'stationList'
            , size: 'sm'
            , cols: [[
                {field: 'mmsi', title: 'MMSI', sort: true, width: '25%'}
                , {field: 'name', title: '岸站名称', sort: true, width: '50%'}
                , {
                    field: 'updateTime', title: '更新时间', sort: true, width: '25%', templet: function (e) {
                        return layui.util.toDateString(e.updateTime, "HH:mm:ss")
                    }
                }
            ]]
            , limit: 100
            , initSort: {
                field: stationTableSortName
                , type: stationTableSortDesc
            }
        });
        table.on('sort(stationList)', function (obj) {
            stationTableSortName = obj.field;
            stationTableSortDesc = obj.type;
        });
        table.on('row(stationList)', function (obj) {
            hideAllList();
            searchStation(obj.data.mmsi);
        });
        // 航标列表
        table.render({
            elem: '#atonList'
            , data: atonData
            , height: '600px'
            , id: 'atonList'
            , size: 'sm'
            , cols: [[
                {field: 'mmsi', title: 'MMSI', sort: true, width: '25%'}
                , {field: 'name', title: '航标名称', sort: true, width: '50%'}
                , {
                    field: 'recvTime', title: '更新时间', sort: true, width: '25%', templet: function (d) {
                        return layui.util.toDateString(d.recvTime, "HH:mm:ss");
                    }
                }
            ]]
            , limit: 500
            , initSort: {
                field: atonTableSortName
                , type: atonTableSortDesc
            }
        });
        table.on('sort(atonList)', function (obj) {
            atonTableSortName = obj.field;
            atonTableSortDesc = obj.type;
        });
        table.on('row(atonList)', function (obj) {
            hideAllList();
            searchAton(obj.data.mmsi);
        });


        // 网位仪列表
        table.render({
            elem: '#netList'
            , data: fishingNetData
            , height: '600px'
            , id: 'netList'
            , size: 'sm'
            , cols: [[
                {field: 'mmsi', title: 'MMSI', sort: true, width: '25%'}
                , {field: 'ename', title: '网位仪名称', sort: true, width: '50%'}
                , {
                    field: 'recvTime', title: '更新时间', sort: true, width: '25%', templet: function (d) {
                        return layui.util.toDateString(d.recvTime, "HH:mm:ss");
                    }
                }
            ]]
            , limit: 500
            , initSort: {
                field: netTableSortName
                , type: netTableSortDesc
            }
        });
        table.on('sort(netList)', function (obj) {
            netTableSortName = obj.field;
            netTableSortDesc = obj.type;
        });
        table.on('row(netList)', function (obj) {
            hideAllList();
            searchNet(obj.data.mmsi);
        });

    }

    // 关闭左侧列表
    function hideAllList() {
        if (!stationHistoryFlag) {
            showTabBtn = false
            $("#allList_left").css("display", "none");
        }
    }

    // 右上导航栏弹出框
    function navigationBoxClick(str) {

        // 其他图层关闭
        var arr = ['markerTableLayer', 'heatmapLayer', 'navigationBoxLayer', 'targetLayer', 'trackplaybackControl',  'owmStationLayer', 'electronicFenceLayerIndex'];
        rejectLayer(arr);
        var offset;
        var area;
        var title;
        var close = '';
        selectColorChange(str);
        switch (str) {
            case "layerControl":
                title = "显示元素";
                offset = 'rt';
                area = ['306px'];
                close = function () {
                    document.getElementById("layerControl").children[0].style.color = ""
                }
                break;
            case "playbackTrackControl":
                title = "轨迹回放";
                offset = 'rt';
                area = ['400px'];
                close = function () {
                    if (trackplaybackControl != null && trackplaybackControl.trackPlayBack.clock != null) {
                        trackplaybackControl._close();
                    }
                    document.getElementById("playbackTrackControl").children[0].style.color = ""
                    $("#trackPlayStartTime").val('')
                    $("#trackPlayEndTime").val('')
                    $("#targetShipMMSI_playbackTrack").val('')
                };
                break;
            case "virtualAtoNControl":
                title = "虚拟航标";
                offset = 'rt';
                area = ['600px', '500px'];

                close = function () {
                    if (virtualAtoNEditLayerIndex != "") {
                        layer.close(virtualAtoNEditLayerIndex);
                    }
                    document.getElementById("virtualAtoNControl").children[0].style.color = ""
                };
                ownShoreList(map, admin, table, config, form);
                break;
            case "userInfo":
                title = "个人信息";
                offset = 'rt';
                area = ['400px'];
                close = function () {
                    document.getElementById("userInfo").children[0].style.color = ""
                };
                $("#username").val(config.getUser().username);
                $("#nickname").val(config.getUser().nickname);
                $("#mobile").val(config.getUser().mobile);
                $("input[name=sex][value=0]").attr("checked", config.getUser().sex == 0 ? true : false);
                $("input[name=sex][value=1]").attr("checked", config.getUser().sex == 1 ? true : false);
                form.render();
                break;
            case "userPassword":
                title = "修改密码";
                offset = 'rt';
                area = ['400px'];
                close = function () {
                    document.getElementById("userPassword").children[0].style.color = ""
                };
                break;


            default:
                break;
        }

        navigationBoxLayer = layer.open({
            type: 1
            , offset: offset
            , id: str + '_id'
            , title: title
            , content: $('#' + str + 'Layer')
            , btn: ''
            , shade: 0
            , skin: 'layui-layer-lan messageBoxSend'
            , area: area
            , resize: false
            , scrollbar: false
            , cancel: close
            , success: function (layero, index) {
                $("#clickAIS").click();
                $("#clickAISmessage").click();
                $("#sendSafeMsgControlLayer_addArea").hide();
                layer.style(index, {
                    marginLeft: -20,
                    marginTop: 110,
                })
                if ("markerControl" == str) {
                    showMarkerList(table, layer, form, config, admin, map);
                }

            }
        });

        return false;
    }

    // 通过MMSI搜船
    function searchShip(mmsi) {
        showShipDetail(mmsi);
    }

    // 通过MMSI搜岸站
    function searchStation(mmsi) {
        showStationDetail(mmsi);
    }

    // 通过MMSI搜航标
    function searchAton(mmsi) {
        showAtonDetail(mmsi);
    }

    // 通过MMSI搜网位仪
    function searchNet(mmsi) {
        showFishingNetDetail(mmsi);
    }

    // 热力图
    function drawHeatLayer() {
        if (heatmapLayer == null) {
            var cfg = {
                "radius": 0.05,
                "maxOpacity": 0.8,
                "scaleRadius": true,
                "useLocalExtrema": false,
                latField: 'lat',
                lngField: 'lng',
                valueField: 'count',
                blur: 1,
                gradient: {
                    // '.25': '#0000ff',
                    // '.35': '#0082ff',
                    // '.45': '#00ffff',
                    '.55': '#00ff00',
                    '.65': '#73ff00',
                    '.75': '#ffff00',
                    '.85': '#ff9600',
                    '.95': '#ff0000'
                }
            };
            heatmapLayer = new HeatmapOverlay(cfg);
            // 其他图层关闭
            var arr = ['markerTableLayer', 'shipPointLayer', 'shipLayer', 'shipNameLayer', 'stationLayer', 'stationNameLayer', 'atonLayer', 'atonNameLayer', 'navigationBoxLayer',
                'trackplaybackControl', 'shipDetailLayer', 'selectedShipLayer', 'targetLayer', 'stationDetailLayer', 'atonDetailLayer', 'setCenterLayer',
                'measureLayer', 'legendLayer',  'owmStationLayer', 'fishingNetDetailLayer', 'fishingNetLayer', 'fishingNetPointLayer',
                'electronicFenceLayerIndex'];
            rejectLayer(arr);

            map.setZoom(mapCurrentLevel);
            admin.reqNoLoad('shipDynamicStatic-api/getHeatMapInfo', JSON.stringify({}), function (res) {
                heatData = res;
                heatData.max = 5;
                heatmapLayer.setData(heatData);
                map.addLayer(heatmapLayer);
            }, 'POST');
        } else {
            map.removeLayer(heatmapLayer);
            heatmapLayer = null;
            getShipData();
            getStationData();
            getAtonData();
            getFishingNetData();
        }
    }


    // 左侧列表表格重载
    function tableReload() {
        table.reload('shipList', {
            data: shipData,
            initSort: {
                field: shipTableSortName
                , type: shipTableSortDesc
            }
        });
        table.reload('stationList', {
            data: stationData,
            initSort: {
                field: stationTableSortName
                , type: stationTableSortDesc
            }
        });
        table.reload('atonList', {
            data: atonData,
            initSort: {
                field: atonTableSortName
                , type: atonTableSortDesc
            }
        });
    }


    // 点击船舶详细弹出层
    function showTargetLayer(str) {
        // 其他图层关闭
        var arr = ['targetLayer', 'navigationBoxLayer', 'trackplaybackControl', 'electronicFenceLayerIndex'];
        rejectLayer(arr);
        var offset;
        var area;
        var title;
        var close = '';
        switch (str) {
            case "targetShipTrackPlayBack":
                title = "轨迹回放";
                offset = 'rt';
                area = ['400px'];
                close = function () {
                    if (trackplaybackControl != null && trackplaybackControl.trackPlayBack.clock != null) {
                        trackplaybackControl._close();
                    }
                };
                break;
            case "targetShipSendMessage":
                title = "消息播发";
                offset = 'rt';
                area = ['800px', '700px'];
                close = function () {

                };
                break;
            default:
                break;
        }

        targetLayer = layer.open({
            type: 1
            , offset: offset
            , id: str + '_id'
            , title: title
            , content: $('#' + str + 'Layer')
            , btn: ''
            , shade: 0
            , skin: title === "消息播发" ? 'layui-layer-lan messageReplyLayerId' : "layui-layer-lan targetPlay"
            , area: area
            , resize: false
            , cancel: close
            , success: function (layero, index) {
                $("#shipAIS").click();
                layer.style(index, {
                    marginLeft: -20,
                    marginTop: 70
                })
            }
        });

        return false;

    }



    // 船舶轨迹回放
    function shipTrackPlayBack(type) {
        $(".shipTrackPlayBackForTrackExportBtn").hide()
        $(".shipTrackPlayBackForTrackExportBtnFake").show()
        // 轨迹开始时间(时间戳)
        var startTime = "";
        // 轨迹结束时间(时间戳)
        var endTime = "";
        // 轨迹开始时间(yy-MM-dd)
        var startTimeYMD = "";
        // 轨迹结束时间(yy-MM-dd)
        var endTimeYMD = "";
        // 船舶名称
        var targetShipMMSI_name;
        targetShipMMSI_playbackTrack = "";

        if (type == 'targetShip') {
            targetShipMMSI_playbackTrack = $("#ship_MMSI").val();
            startTimeYMD = $("#trackShipPlayStartTime").val();
            endTimeYMD = $("#trackShipPlayEndTime").val();
        } else if (type == 'ship') {
            targetShipMMSI_playbackTrack = $("#targetShipMMSI_playbackTrack").val().split(" | ")[0];
            startTimeYMD = $("#trackPlayStartTime").val();
            endTimeYMD = $("#trackPlayEndTime").val();
        } else if (type == 'customShip') {
            targetShipMMSI_playbackTrack = $("#ship_MMSI").val();
            startTimeYMD = $("#trackShipPlayStartTimeForTrackExport").val();
            endTimeYMD = $("#trackShipPlayEndTimeForTrackExport").val();
        }

        if (targetShipMMSI_playbackTrack != null || targetShipMMSI_playbackTrack != '') {
            for (var i = 0; i < trackplaybackShips.length; i++) {
                if (trackplaybackShips[i][0].indexOf(targetShipMMSI_playbackTrack) != -1) {
                    alert("船舶轨迹已存在");
                    return false;
                }
                ;
            }
            ;
        }

        if (startTimeYMD != '') {
            startTime = new Date(startTimeYMD).getTime() / 1000;
        }
        if (endTimeYMD != '') {
            endTime = new Date(endTimeYMD).getTime() / 1000;
        }
        if (startTime != '' && endTime != '' && startTime >= endTime) {
            return layer.msg("轨迹开始时间应小于轨迹结束时间", {icon: 2, time: config.msgTime});
        }
        if (startTime != '' && startTime > new Date().getTime()) {
            return layer.msg("轨迹开始时间应小于当前时间", {icon: 2, time: config.msgTime});
        }
        if (endTime != '' && endTime > new Date().getTime()) {
            return layer.msg("轨迹结束时间应小于当前时间", {icon: 2, time: config.msgTime});
        }
        if (endTime-startTime>7*24*60*60) {
            return layer.msg("只能查询一周内数据", {icon: 2, time: config.msgTime});
        }
        var data = {
            "startTime": startTime,
            "endTime": endTime,
            "mmsi": targetShipMMSI_playbackTrack,
            "periodTime": 30 * 60
        };
        admin.req('shipHistory-api/getShipHistoryInfo', JSON.stringify(data), function (res) {
            if (res.data == null || res.data == '') {
                layer.msg("查询船舶不存在/船舶无轨迹", {icon: 2, time: config.msgTime});
                $(".shipTrackPlayBackForTrackExportBtn").show()
                $(".shipTrackPlayBackForTrackExportBtnFake").hide()
                return false;
            } else {
                trackplaybackShips.push([targetShipMMSI_playbackTrack, startTime, endTime]);
                targetShipMMSI_name = res.data[0].name == null || res.data[0].name == 'null' ? '' : res.data[0].name;

                if (startTimeYMD == "") {
                    //startTimeYMD = common.dateFormat(new Date(parseInt(res.data[0].time) * 1000), "yyyy-MM-dd hh:mm:ss");
                }

                if (endTimeYMD == "") {
                    //endTimeYMD = common.dateFormat(new Date(parseInt(res.data[res.datas.length - 1].time) * 1000), "yyyy-MM-dd hh:mm:ss");
                }

                document.getElementById("trackList").innerHTML += "<li id=" + targetShipMMSI_playbackTrack + "_trackList style='margin:20px;color: #DBD9D1'>" +
                    "<a  id=" + targetShipMMSI_playbackTrack + "_track style='color:white' data-start=" + new Date(startTimeYMD).getTime() + "  data-end=" + new Date(endTimeYMD).getTime() + "  lay-submit lay-filter='targetShipMMSI_playbackTrack_list' class='targetShipMMSI_playbackTrack_list'>"
                    + targetShipMMSI_name + "（" + targetShipMMSI_playbackTrack + "）</br>" + startTimeYMD + "—" + endTimeYMD
                    + "</a><a style='color:white'><i class='layui-icon layui-icon-close' id = " + targetShipMMSI_playbackTrack + " style='font-size: 15px;float: right;padding-left: 25px;' lay-submit lay-filter='closeTrackList'></i></a></li>";
                trackplaybackdata.push(res.data);

                $(".targetShipMMSI_playbackTrack_list").on("click", function (e) {
                    if(!targetShipMMSIPlaybackTrackListFlag) {
                        var mmsi = $(e.target).attr('id').slice(0, $(e.target).attr('id').indexOf('_'));
                        // trackDetailInfo(mmsi)
                        currentTrackTime = {
                            start: $(e.target).attr('data-start'),
                            end: $(e.target).attr('data-end'),
                            mmsi: mmsi
                        }
                        if (targetShipExportTableLayerIndex) {
                            layer.close(targetShipExportTableLayerIndex)
                            targetShipExportTableLayerIndex = null
                        }
                        setTimeout(function () {
                            drawTrack('selectShipTrack', false, null, mmsi)
                        }, 201)

                    }

                })

                drawTrack(type);

            }
        }, 'POST');
    };

    function shipTrackPlayBackForTrackExport(type) {
        $(".shipTrackPlayBackForTrackExportBtn").hide()
        $(".shipTrackPlayBackForTrackExportBtnFake").show()
        // 轨迹开始时间(时间戳)
        var startTime = "";
        // 轨迹结束时间(时间戳)
        var endTime = "";
        // 轨迹开始时间(yy-MM-dd)
        var startTimeYMD = "";
        // 轨迹结束时间(yy-MM-dd)
        var endTimeYMD = "";
        // 船舶名称
        var targetShipMMSI_name;
        targetShipMMSI_playbackTrack = "";

        if (type == 'targetShip') {
            targetShipMMSI_playbackTrack = $("#ship_MMSI").val();
            startTimeYMD = $("#trackShipPlayStartTimeForTrackExport").val();
            endTimeYMD = $("#trackShipPlayEndTimeForTrackExport").val();
        } else if (type == 'ship') {
            targetShipMMSI_playbackTrack = $("#targetShipMMSI_playbackTrack").val().split(" | ")[0];
            startTimeYMD = $("#trackPlayStartTime").val();
            endTimeYMD = $("#trackPlayEndTime").val();
        }

        if (targetShipMMSI_playbackTrack != null || targetShipMMSI_playbackTrack != '') {
            for (var i = 0; i < trackplaybackShips.length; i++) {
                if (trackplaybackShips[i][0].indexOf(targetShipMMSI_playbackTrack) != -1) {
                    alert("船舶轨迹已存在");
                    return false;
                }
                ;
            }
            ;
        }

        if (startTimeYMD != '') {
            startTime = new Date(startTimeYMD).getTime() / 1000;
        }
        if (endTimeYMD != '') {
            endTime = new Date(endTimeYMD).getTime() / 1000;
        }
        if (startTime != '' && endTime != '' && startTime >= endTime) {
            return layer.msg("轨迹开始时间应小于轨迹结束时间", {icon: 2, time: config.msgTime});
        }
        if (startTime != '' && startTime > new Date().getTime()) {
            return layer.msg("轨迹开始时间应小于当前时间", {icon: 2, time: config.msgTime});
        }
        if (endTime != '' && endTime > new Date().getTime()) {
            return layer.msg("轨迹结束时间应小于当前时间", {icon: 2, time: config.msgTime});
        }
        var data = {
            "startTime": startTime,
            "endTime": endTime,
            "mmsi": targetShipMMSI_playbackTrack,
            "periodTime": 30 * 60
        };
        admin.req('shipHistory-api/getShipHistoryInfo', JSON.stringify(data), function (res) {
            if (res.data == null || res.data == '') {
                layer.msg("查询船舶不存在/船舶无轨迹", {icon: 2, time: config.msgTime});
                $(".shipTrackPlayBackForTrackExportBtn").hide()
                $(".shipTrackPlayBackForTrackExportBtnFake").show()
                return false;
            } else {
                trackplaybackShips.push([targetShipMMSI_playbackTrack, startTime, endTime]);
                targetShipMMSI_name = res.data[0].name == null || res.data[0].name == 'null' ? '' : res.data[0].name;

                if (startTimeYMD == "") {
                    //startTimeYMD = common.dateFormat(new Date(parseInt(res.data[0].time) * 1000), "yyyy-MM-dd hh:mm:ss");
                }

                if (endTimeYMD == "") {
                    //endTimeYMD = common.dateFormat(new Date(parseInt(res.data[res.datas.length - 1].time) * 1000), "yyyy-MM-dd hh:mm:ss");
                }

                // document.getElementById("trackList").innerHTML += "<li id=" + targetShipMMSI_playbackTrack + "_trackList style='margin:20px;color: #DBD9D1'>"
                //     + targetShipMMSI_name + "（" + targetShipMMSI_playbackTrack + "）</br>" + startTimeYMD + "—" + endTimeYMD
                //     + "<i class='layui-icon layui-icon-close' id = " + targetShipMMSI_playbackTrack + " style='font-size: 15px;float: right;padding-left: 25px;' lay-submit lay-filter='closeTrackList'></i></li>";

                trackplaybackdata.push(res.data);
                layer.close(shipDetailLayer);
                shipDetailLayer = null;
                layer.open({
                    type: 1
                    , offset: 'lt'
                    , id: 'targetShipExportTableLayer_id'
                    // , title: '轨迹截面'
                    , title: '轨迹回放'
                    , content: $('#targetShipExportTableLayer')
                    , btn: ''
                    , shade: 0
                    , skin: "layui-layer-lan"
                    , area: ['550px', '540px']
                    , resize: false
                    , cancel: function (index) {
                        layer.close(index)
                        try {
                            if(trackplaybackControl && trackplaybackControl._close) {
                                trackplaybackControl._close()
                            }
                        } catch (e) {

                        }

                    }
                    , success: function (layero, index) {
                        $("#shipAIS").click();
                        layer.style(index, {
                            marginLeft: 20,
                            marginTop: 160
                        })

                        $('#targetShipExportTableLayer-value-MMSI').val($("#ship_MMSI").val())
                        $('#targetShipExportTableLayer-value-name').val($("#ship_name").val())
                        $('#targetShipExportTableLayer-value-IMO').val($("#ship_IMO").val())
                        $('#targetShipExportTableLayer-value-type').val($("#ship_type").val())
                        $('#targetShipExportTableLayer-value-huhao').val($("#ship_call_sign").val())
                        res.data.forEach(item => {
                            item.time = parseInt(item.time)
                            item.timeCustom = parseTime(item.time)
                        })

                        table.render({
                            elem: '#targetShipExportTableLayerTable'
                            , height: 312
                            , data: res.data
                            , limit: 100000
                            // , page: false
                            , cols: [[
                                {field: 'timeCustom', title: '时间'},
                                {field: 'lng', title: '经度'},
                                {field: 'lat', title: '纬度'},
                            ]]
                        });
                    }
                });

                drawTrack(type, true, 'bottomleft');
                // $('.leaflet-top').css({
                //     "display": 'none'
                // })
                setTimeout(() => {
                    saveTrackImg();
                    // $(".shipTrackPlayBackForTrackExportBtn").show()
                    // $(".shipTrackPlayBackForTrackExportBtnFake").hide()

                }, 800)

            }
        }, 'POST');
    }

    form.on('submit(shipTrackPlayBackForTrackExportBtn)', function (data) {
        $(".shipTrackPlayBackForTrackExportBtn").hide()
        $(".shipTrackPlayBackForTrackExportBtnFake").show()
        var xmlhttp = new XMLHttpRequest();
        var url = config.base_server + 'fishingPort60-api/getFishingPortExcel';
        // var url = '/fishingPort60-api/getFishingPortExcel';

        var content = JSON.stringify({
            // "endTime": !!$("#trackPlayEndTime").val() ? new Date($('#trackPlayEndTime').val()).getTime() / 1000 : new Date($('#trackShipPlayEndTimeForTrackExport').val()).getTime() / 1000,
            "endTime": Number(currentTrackTime.end) / 1000,
            "periodTime": 1800,
            // "startTime": !!$("#trackPlayStartTime").val() ?  new Date($('#trackPlayStartTime').val()).getTime() / 1000 : new Date($('#trackShipPlayStartTimeForTrackExport').val()).getTime() / 1000,
            "startTime": Number(currentTrackTime.start) / 1000,
            // "mmsi": !!$("#targetShipMMSI_playbackTrack").val() ? $("#targetShipMMSI_playbackTrack").val() : $('#targetShipExportTableLayer-value-MMSI').val(),
            "mmsi": currentTrackTime.mmsi,
            'base64': screenShot.split("data:image/png;base64,")[1]
        });
        xmlhttp.open("POST", url);
        xmlhttp.withCredentials = true;
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.setRequestHeader('Authorization', 'Bearer ' + config.getToken().access_token);
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
                $(".shipTrackPlayBackForTrackExportBtn").show()
                $(".shipTrackPlayBackForTrackExportBtnFake").hide()
            }
        }
    });

    $(document).on("click", "a[class='btn-start']", function () {
        if (trackplaybackdata[0].length == 1) {
            layer.msg("船舶轨迹只有一个点", {icon: 2, time: config.msgTime});
        }
    })
    $(document).on("click", "a[aria-label='replay']", function () {
        if (trackplaybackdata[0].length == 1) {
            layer.msg("船舶轨迹只有一个点", {icon: 2, time: config.msgTime});
        }
    })

    function drawTrack(type, flag, position, mmsi) {
        if (trackplaybackControl != null && trackplaybackControl.trackPlayBack.clock != null) {
            L.DomUtil.remove(trackplaybackControl._container);
            trackplayback.dispose();
            trackplayback.off('tick', trackplaybackControl._tickCallback, trackplaybackControl);
            trackplaybackcomplate.dispose();
        }
        for (var j = 0; j < trackplaybackdata.length; j++) {
            for (var i = 0; i < trackplaybackdata[j].length; i++) {
                trackplaybackdata[j][i].time = parseInt(trackplaybackdata[j][i].time)
            }
        }
        if (mmsi == undefined) {
            trackplayback = (L.trackplayback(trackplaybackdata, map, {
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

            trackplaybackcomplate = (L.trackplayback(trackplaybackdata, map, {
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
        } else {
            var selectShipTrackData;
            for (var i = 0; i < trackplaybackShips.length; i++) {
                if (trackplaybackShips[i][0].indexOf(mmsi) != -1) {
                    selectShipTrackData = trackplaybackdata[i];
                }
            }
            trackplayback = (L.trackplayback(selectShipTrackData, map, {
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

            trackplaybackcomplate = (L.trackplayback(selectShipTrackData, map, {
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
            targetShipExportTableLayerIndex = layer.open({
                type: 1
                , offset: 'lt'
                , id: 'targetShipExportTableLayer_id' + mmsi
                // , title: '轨迹截面'
                , title: '轨迹回放'
                , content: $('#targetShipExportTableLayer')
                , btn: ''
                , shade: 0
                , skin: "layui-layer-lan "
                , area: ['550px', '540px']
                , resize: false
                , cancel: function (index) {
                    layer.close(index)
                    drawTrack();

                }
                , success: function (layero, index) {
                    $("#shipAIS").click();
                    layer.style(index, {
                        marginLeft: 20,
                        marginTop: 70
                    })

                    admin.reqNoLoad('shipDynamicStatic-api/getShipDetail', JSON.stringify({
                        mmsi: mmsi
                    }), function (res) {
                        if (res.datas) {
                            $('#targetShipExportTableLayer-value-MMSI').val(res.datas.mmsi)
                            $('#targetShipExportTableLayer-value-name').val(res.datas.ename)
                            $('#targetShipExportTableLayer-value-IMO').val(res.datas.imoNumber)
                            $('#targetShipExportTableLayer-value-type').val(getShipType(res.datas.shipType))
                            $('#targetShipExportTableLayer-value-huhao').val(res.datas.callSign)
                        } else {
                            $('#targetShipExportTableLayer-value-MMSI').val($("#ship_MMSI").val())
                            $('#targetShipExportTableLayer-value-name').val($("#ship_name").val())
                            $('#targetShipExportTableLayer-value-IMO').val($("#ship_IMO").val())
                            $('#targetShipExportTableLayer-value-type').val($("#ship_type").val())
                            $('#targetShipExportTableLayer-value-huhao').val($("#ship_call_sign").val())
                        }
                    }, 'POST');


                    // selectShipTrackData.forEach(item => {
                    //     item.time = parseInt(item.time)
                    //     item.timeCustom = parseTime(item.time)
                    // })
                    //
                    // table.render({
                    //     elem: '#targetShipExportTableLayerTable'
                    //     , height: 312
                    //     , data: selectShipTrackData
                    //     , limit: 100000
                    //     // , page: false
                    //     , cols: [[
                    //         {field: 'timeCustom', title: '时间'},
                    //         {field: 'lng', title: '经度'},
                    //         {field: 'lat', title: '纬度'},
                    //     ]]
                    // });
                }
            });
            selectShipTrackData.forEach(item => {
                item.time = parseInt(item.time)
                item.timeCustom = parseTime(item.time)
            })

            table.render({
                elem: '#targetShipExportTableLayerTable'
                , height: 312
                , data: selectShipTrackData
                , limit: 100000
                // , page: false
                , cols: [[
                    {field: 'timeCustom', title: '时间'},
                    {
                        field: 'lng', title: '经度', templet: function (d) {
                            return changeDecimalBuZero(Number(String(d.lng).substring(0, String(d.lng).indexOf(".") + 5)), 4)
                        }
                    },
                    {
                        field: 'lat', title: '纬度', templet: function (d) {
                            return changeDecimalBuZero(Number(String(d.lat).substring(0, String(d.lat).indexOf(".") + 5)), 4)
                        }
                    },
                ]]
            });
        }

        trackplaybackControl = new L.trackplaybackcontrol(trackplayback, {position: position ? position : 'bottomleft'});

        trackplaybackControl.onRemove = function () {
            trackplayback.dispose();
            trackplayback.off('tick', this._tickCallback, this);
            trackplaybackcomplate.dispose();
        };

        displayLine((() => {
            let latlngs = []
            if (selectShipTrackData) {
                for (var i = 0; i < trackplaybackdata.length; i++) {
                    if (trackplaybackdata[i] == selectShipTrackData) {
                        trackplaybackdata[i].forEach(item => {
                            latlngs.push([item.lat, item.lng])
                        })
                    }
                }
                ;
            } else {
                trackplaybackdata[trackplaybackdata.length - 1].forEach(item => {
                    latlngs.push([item.lat, item.lng])
                })
            }

            return latlngs
        })(), 'blue', true)

        trackplaybackControl._close = function () {
            L.DomUtil.remove(this._container)
            if (this.onRemove) {
                this.onRemove(this._map)
            }
            document.getElementById("trackList").innerHTML = '';
            layer.close(trackListLayer);
            trackListLayer = null;
            trackplaybackShips = [];
            trackplaybackdata = [];
            getShipData();
            return this;
        };

        trackplaybackControl.addTo(map);

        trackplaybackcomplate.start();

        if (map.hasLayer(selectedShipLayer)) {
            map.removeLayer(selectedShipLayer);
            selectedShipLayer.clearLayers();
            selectedShipMMSI = null;
        }
        if (map.hasLayer(shipNameLayer)) {
            map.removeLayer(shipNameLayer);
            shipNameLayer.clearLayers();
        }
        if (!flag) {
            layer.close(shipDetailLayer);
            shipDetailLayer = null;
            drawShip(shipData);
            if (trackListLayer == null) {
                trackListLayer = layer.open({
                    type: 1
                    , offset: ['10%', '30%']
                    , id: 'trackList_id'
                    , title: '轨迹列表'
                    , content: $("#trackListLayer")
                    , btn: ''
                    , shade: 0
                    , resize: false
                    , skin: 'layui-layer-lan trail_layer trackList_id'
                    , area: 'auto'
                    , cancel: function () {
                        trackplaybackControl._close();
                    }
                    , success: function (layero, index) {

                    }
                });
            }
        }
        // setTimeout(() => {
        //     saveTrackImg();
        //     // $(".shipTrackPlayBackForTrackExportBtn").show()
        //     // $(".shipTrackPlayBackForTrackExportBtnFake").hide()
        //
        // }, 800)
    };

    function displayLine(latlngs, color = 'blue', focus = false) {
        currentPoly = L.polyline(latlngs, {color: color, polyType: 'Line'}).addTo(map)
        if (focus) focusPoly(currentPoly)
    }

    function focusPoly(polySt) {
        map.fitBounds(polySt.getBounds())
        currentPoly.remove()
        currentPoly = {}
    }


    function closeTrackList(mmsi) {
        document.getElementById("trackList").removeChild(document.getElementById(mmsi + "_trackList"));
        trackplayback.draw.remove();
        trackplaybackcomplate.draw.remove();
        for (var i = 0; i < trackplaybackShips.length; i++) {
            if (trackplaybackShips[i][0].indexOf(mmsi) != -1) {
                trackplaybackShips.splice(i, 1);
                trackplaybackdata.splice(i, 1);
            }
        }
        if (trackplaybackShips.length == 0) {
            map.removeControl(trackplaybackControl);
            document.getElementById("trackList").innerHTML = '';
            trackplaybackdata = [];
            layer.close(trackListLayer);
            trackListLayer = null;
            getShipData();
            return false;
        }
        drawTrack();
    };

    // 测距
    function measure() {

        // 其他图层关闭
        var arr = ['setCenterLayer', 'legendLayer', 'markerTableLayer', 'heatmapLayer', 'navigationBoxLayer', 'targetLayer',
            'trackplaybackControl',  'owmStationLayer', 'electronicHistoryLayer',
            'electronicAlertLayer',  'electronicFenceLayerCustomIndex', 'virtualAtoNLayerIndex'];
        rejectLayer(arr);
        hideAllList();
        measureControl =
            new L.control.polylineMeasure(
                {
                    position: 'bottomleft',
                    unit: 'nauticalmiles',
                    showBearings: false,
                    clearMeasurementsOnStop: false,
                    showClearControl: true,
                    showUnitControl: true,
                    clearControlTitle: '清空测距',
                    measureControlTitleOn: '开始测距',
                    measureControlTitleOff: '结束测距',
                    tooltipTextDraganddelete: '单击并拖动移动点<br>按Shift键并单击删除点',
                    tooltipTextResume: '<br>按Ctrl键并单击恢复线',
                    tooltipTextAdd: '按Ctrl键并单击添加点',
                    unitControlTitle: {
                        text: '改变单位',
                        metres: '米',
                        landmiles: '英里',
                        nauticalmiles: '海里'
                    },
                }
            ).addTo(map);
        measureControl._measureControl.click();
    }

    // 设置中心点
    function setCenterPosition() {

        // 其他图层关闭
        var arr = ['measureLayer', 'legendLayer'];
        rejectLayer(arr);

        $('#map').css('cursor', "url('../../assets/images/location.cur') 6 12,auto");
        map.on('click', function (e) {
            var pointLat = e.latlng.lat;
            var pointLng = e.latlng.lng;
            $('#setCenter_lat').val(pointLat.toFixed(2));
            $('#setCenter_lng').val(pointLng.toFixed(2));
            centerPosition.setLatLng([pointLat, pointLng])
            centerPosition.addTo(map);
            $('#map').css('cursor', "");
            map.off('click');
        })
        $('#setCenter_level').val(mapCurrentLevel);

        if (setCenterLayer == null) {
            setCenterLayer = layer.open({
                type: 1
                , offset: ['55%', '10%']
                , id: 'setCenter_id'
                , title: '中心点坐标'
                , content: $("#setCenterLayer")
                , btn: ''
                , shade: 0
                , resize: false
                , skin: 'layui-layer-lan'
                , area: 'auto'
                , cancel: function () {
                    $('#map').css('cursor', "");
                    $('#setCenter_lat').val("");
                    $('#setCenter_lng').val("");
                    $('#map').off('click');
                    centerPosition.remove();
                    setCenterLayer = null;
                    $("#centerPositionSet")[0].style.color = "";
                }
                , success: function (layero, index) {
                    // layer.style(index, {
                    //     marginLeft: 90% ,
                    //     marginTop: 600
                    // });
                    $('#setCenter_lat').val(map.getCenter().lat.toFixed(2));
                    $('#setCenter_lng').val(map.getCenter().lng.toFixed(2));
                }
            });
        }
    }


    // 保存用户设置中心点
    function saveUserCenter(str, res) {
        if (str == 'layer') {
            var data = {
                id: $('#seaMapId').val(),
                // shipShow: $("input[name='layerControlLayer_shipShow']:checked").val(),
                shipTimeShow: layerControlLayer_shipTimeShow,
                // shipTimeShow: $("input[name='layerControlLayer_shipTimeShow']:checked").val(),
                shipType: layerControlLayer_shipType,
                // 渔船是否可用 2022/7/12 lxy
                // onlyFishShip: onlyFishShip,
                // shipType: $("input[name='layerControlLayer_shipType']:checked").val(),
                // shipName: $("input[name='layerControlLayer_shipName']:checked").val(),
                shipName: $("input[name='layerControlLayer_shipName']").prop('checked'),
                // stationShow: $("input[name='layerControlLayer_stationShow']:checked").val(),
                stationShow: $("input[name='layerControlLayer_stationShow']").prop('checked'),
                // stationName: $("input[name='layerControlLayer_stationName']:checked").val(),
                stationName: $("input[name='layerControlLayer_stationName']").prop('checked'),
                // atonShow: $("input[name='layerControlLayer_atonShow']:checked").val(),
                atonShow: $("input[name='layerControlLayer_atonShow']").prop('checked'),
                // atonName: $("input[name='layerControlLayer_atonName']:checked").val(),
                atonName: $("input[name='layerControlLayer_atonName']").prop('checked'),
                // fishingNetShow: $("input[name='layerControlLayer_fishingNetShow']:checked").val(),
                fishingNetShow: $("input[name='layerControlLayer_fishingNetShow']").prop('checked'),
                // fishingAreas: $("input[name='layerControlLayer_fishingAreas']:checked").val(),
                // fishingAreas: $("input[name='layerControlLayer_fishingAreas']").prop('checked'),
                fishingShip: $("input[name='layerControlLayer_fishShip']").prop('checked'),
                //radarEcho: $("input[name='layerControlLayer_radarEcho']").prop('checked'),
            }
        } else if (str == 'center') {
            var data = {
                latitude: $('#setCenter_lat').val(),
                longitude: $('#setCenter_lng').val(),
                level: $('#setCenter_level').val(),
                id: $('#seaMapId').val(),
            }
        } else if (str == 'map') {
            var data = {
                mapType: res,
                id: $('#seaMapId').val(),
            }
        }

        admin.req('api-user/seaMap/setCenterPosition', JSON.stringify(data), function (res) {
            if (res.resp_code == 0) {
                $('#seaMapId').val(res.datas.id)
            }
            if (str == 'center') {
                layer.msg('设置中心点成功', {icon: 1, time: config.msgTime});
            } else if (str == 'layer') {
                //layer.msg('图层设置成功', {icon: 1, time: config.msgTime});
            }
            // 其他图层关闭
            var arr = ['setCenterLayer'];
            rejectLayer(arr);
        }, 'POST');
    }


    // 显示图例
    function showLegend() {
        // 其他图层关闭
        var arr = ['measureLayer', 'setCenterLayer'];
        rejectLayer(arr);

        if (legendLayer == null) {
            legendLayer = layer.open({
                type: 1
                , offset: ['10%', '2%']
                , id: 'legend_id'
                , title: ''
                , content: $("#legendLayer")
                , btn: ''
                , shade: 0
                , resize: false
                , skin: 'layui-layer-lan legend_id'
                , area: 'auto'
                , cancel: function () {
                    legendLayer = null;
                    $("#legend")[0].style.color = "";
                }
                , success: function (layero, index) {

                }
            });
        }
    }


    // 岸站历史查询
    function searchStationHistory() {
        var startTime = new Date($("#stationHistory_startTime").val()).getTime();
        var endTime = new Date($("#stationHistory_endTime").val()).getTime();

        if (startTime >= endTime) {
            return layer.msg("查询开始时间应小于查询结束时间", {icon: 2, time: config.msgTime});
        }
        if (startTime > new Date().getTime()) {
            return layer.msg("查询开始时间应小于当前时间", {icon: 2, time: config.msgTime});
        }
        if (endTime > new Date().getTime()) {
            return layer.msg("查询结束时间应小于当前时间", {icon: 2, time: config.msgTime});
        }

        clearInterval(shipInterval);
        clearInterval(stationInterval);
        clearInterval(atonInterval);
        clearInterval(fishingNetInterval);

        stationHistoryMMSI = $("#stationHistory_stationMMSI").val();
        stationHistoryStartTime = startTime;
        stationHistoryEndTime = endTime;

        var data = {
            mmsi: stationHistoryMMSI,
            startTime: stationHistoryStartTime,
            endTime: stationHistoryEndTime
        }

        stationHistoryFlag = true;

        // 其他图层关闭
        var arr = ['shipPointLayer', 'shipLayer', 'shipNameLayer', 'stationLayer', 'stationNameLayer', 'atonLayer', 'atonNameLayer', 'heatmapLayer', 'navigationBoxLayer', 'trackplaybackControl',
            'shipDetailLayer', 'selectedShipLayer', 'targetLayer', 'stationDetailLayer', 'atonDetailLayer', 'setCenterLayer', 'measureLayer', 'legendLayer', 'allList_left',
            'owmStationLayer', 'fishingNetDetailLayer', 'fishingNetLayer', 'fishingNetPointLayer', 'electronicFenceLayerIndex'];
        rejectLayer(arr);

        // 显示岸站历史时，检索框、左侧列表、右上导航栏、右下导航栏不显示
        $("#allList_left").css("display", "none");
        $("#navigation_box").css("display", "none");
        $("#subNavigation_box").css("display", "none");
        $("#search_box").css("display", "none");
        // 显示岸站历史时，历史左侧列表按钮显示
        $("#historyButton").css("display", "block");
        // 历史岸站mmsi和历史时间
        $("#historyInfo").html('岸站MMSI：' + stationHistoryMMSI + '&nbsp&nbsp</br>时间范围:' + $("#stationHistory_startTime").val() + '&nbsp——&nbsp' + $("#stationHistory_endTime").val());
        admin.req('seaMap/getHistoryStationsInfo', data, function (res) {
            historyShipData = res.datas.ship;
            historyStationData = res.datas.stations;
            historyAtonData = res.datas.AtoNs;
            historyShipCount = res.datas.ship.length;
            historyStationCount = res.datas.stations.length;
            historyAtonCount = res.datas.AtoNs.length;
            // 页面显示船舶
            if (mapCurrentLevel > limitZoom) {
                drawShip(historyShipData);
            } else {
                drawPoint(historyShipData);
            }

            drawStation(historyStationData);

            drawAton(historyAtonData);

        }, 'POST');
    }

    // 显示岸站历史列表
    function showAllHistoryList() {
        $("#allHistoryList_left").css("display", "block");
        // 船舶列表
        table.render({
            elem: '#shipHistoryList'
            , data: historyShipData
            , height: document.body.offsetHeight - 85
            , id: 'shipHistoryList'
            , size: 'sm'
            , cols: [[
                {field: 'mmsi', title: 'MMSI', sort: true, width: '25%'}
                , {field: 'ename', title: '船舶名称', sort: true, width: '34%'}
                , {field: 'distance', title: '距离岸站（海里）', sort: true, width: '20%'}
                , {
                    field: 'recvTime', title: '更新时间', sort: true, width: '21%', templet: function (d) {
                        return new Date(d.recvTime);
                    }
                }
            ]]
            , limit: 100000
            , initSort: {
                field: shipTableSortName
                , type: shipTableSortDesc
            }
        });
        table.on('sort(shipHistoryList)', function (obj) {
            shipTableSortName = obj.field;
            shipTableSortDesc = obj.type;
        });
        table.on('row(shipHistoryList)', function (obj) {
            hideAllHistoryList();
            searchShip(obj.data.mmsi);
        });
        var str = '【历史船舶总数】' + historyShipCount + '艘';
        $('#shipHistoryCount').html(str);

        // 岸站列表
        table.render({
            elem: '#stationHistoryList'
            , data: historyStationData
            , height: document.body.offsetHeight - 85
            , id: 'stationHistoryList'
            , size: 'sm'
            , cols: [[
                {field: 'mmsi', title: 'MMSI', sort: true, width: '30%'}
                , {field: 'name', title: '岸站名称', sort: true, width: '30%'}
                , {
                    field: 'recvTime', title: '更新时间', sort: true, width: '40%', templet: function (d) {
                        return new Date(d.recvTime);
                    }
                }
            ]]
            , limit: 100
            , initSort: {
                field: 'mmsi'
                , type: stationTableSortDesc
            }
        });
        table.on('sort(stationHistoryList)', function (obj) {
            stationTableSortName = obj.field;
            stationTableSortDesc = obj.type;
        });
        table.on('row(stationHistoryList)', function (obj) {
            hideAllHistoryList();
            searchStation(obj.data.mmsi);
        });
        var str = '【历史岸站总数】' + historyStationCount + '个';
        $('#stationHistoryCount').html(str);

        // 航标列表
        table.render({
            elem: '#atonHistoryList'
            , data: historyAtonData
            , height: document.body.offsetHeight - 85
            , id: 'atonHistoryList'
            , size: 'sm'
            , cols: [[
                {field: 'mmsi', title: 'MMSI', sort: true, width: '30%'}
                , {field: 'name', title: '航标名称', sort: true, width: '35%'}
                , {
                    field: 'recvTime', title: '更新时间', sort: true, width: '35%', templet: function (d) {
                        return new Date(d.recvTime);
                    }
                }
            ]]
            , limit: 100000
            , initSort: {
                field: atonTableSortName
                , type: atonTableSortDesc
            }
        });
        table.on('sort(atonHistoryList)', function (obj) {
            atonTableSortName = obj.field;
            atonTableSortDesc = obj.type;
        });
        table.on('row(atonHistoryList)', function (obj) {
            hideAllHistoryList();
            searchAton(obj.data.mmsi);
        });
        var str = '【历史航标总数】' + historyAtonCount + '个';
        $('#atonHistoryCount').html(str);
    }

    // 隐藏岸站历史列表
    function hideAllHistoryList() {
        $("#allHistoryList_left").css("display", "none");
    }

    // 返回实时海图
    function backToRealTime() {
        stationHistoryFlag = false;
        stationHistoryMMSI = '';
        stationHistoryStartTime = '';
        stationHistoryEndTime = '';


        // 其他图层关闭
        var arr = ['shipLayer', 'shipPointLayer', 'stationLayer', 'atonLayer', 'shipDetailLayer', 'selectedShipLayer', 'stationDetailLayer', 'atonDetailLayer', 'fishingNetDetailLayer', 'fishingNetLayer', 'fishingNetPointLayer'];
        rejectLayer(arr);

        // 添加船舶、岸站、航标
        getShipData();
        getStationData();
        getAtonData();
        getFishingNetData();

        // 十秒定时刷新船舶数据
        shipInterval = window.setInterval(getShipData, 20000);
        // 五分钟定时刷新岸站数据
        stationInterval = window.setInterval(getStationData, 60000);
        // 一分钟定时刷新航标数据
        atonInterval = window.setInterval(getAtonData, 60000);
        // 一分钟定时刷新网位仪数据
        // fishingNetInterval = window.setInterval(getFishingNetData, 60000);

        // 检索框、左侧列表、右上导航栏、右下导航栏显示
        $("#navigation_box").css("display", "block");
        $("#subNavigation_box").css("display", "block");
        $("#search_box").css("display", "block");
        // 历史左侧列表按钮隐藏
        $("#historyButton").css("display", "none");
    }


    // 画区域
    function drawArea() {
        if (!rectangleMeasure.layer.getLayers().length > 0) {
            layer.style(navigationBoxLayer, {display: "none"});
            layer.style(targetLayer, {display: "none"});
            document.getElementById('map').style.cursor = 'crosshair';
            northWestPoint = "00000000000,0000";
            northEastPoint = "00000000000,0000";
            southEastPoint = "00000000000,0000";
            southWestPoint = "00000000000,0000";
            addrectangleMeasureLayer();
            map.on('mousedown', rectangleMeasure.mousedown).on('mouseup', rectangleMeasure.mouseup);
        } else {
            return false;
        }
    }

    // 区域坐标显示
    function addrectangleMeasureLayer() {
        var $ = layui.jquery;
        var layer = layui.layer;
        // 西北经度
        var northWestCornerLongitude = parseFloat(northWestPoint.split(",")[1].substring(0, northWestPoint.split(",")[1].length - 1)).toFixed(2);
        // 西北纬度
        var northWestCornerLatitude = parseFloat(northWestPoint.split(",")[0].substring(7)).toFixed(2);
        // 东北角经度
        var northEastCornerLongitude = parseFloat(northEastPoint.split(",")[1].substring(0, northEastPoint.split(",")[1].length - 1)).toFixed(2);
        // 东北角纬度
        var northEastCornerLatitude = parseFloat(northEastPoint.split(",")[0].substring(7)).toFixed(2);
        // 东南角经度
        var southEastCornerLongitude = parseFloat(southEastPoint.split(",")[1].substring(0, southEastPoint.split(",")[1].length - 1)).toFixed(2);
        // 东南角纬度
        var southEastCornerLatitude = parseFloat(southEastPoint.split(",")[0].substring(7)).toFixed(2);
        // 西南角经度
        var southWestCornerLongitude = parseFloat(southWestPoint.split(",")[1].substring(0, southWestPoint.split(",")[1].length - 1)).toFixed(2);
        // 西南角纬度
        var southWestCornerLatitude = parseFloat(southWestPoint.split(",")[0].substring(7)).toFixed(2);

        longitude1 = northEastCornerLongitude
        latitude1 = northEastCornerLatitude
        longitude2 = southWestCornerLongitude
        latitude2 = southWestCornerLatitude

        $("#northWestPoint").val(northWestCornerLatitude + ", " + northWestCornerLongitude);
        $("#northEastPoint").val(northEastCornerLatitude + ", " + northEastCornerLongitude);
        $("#southEastPoint").val(southEastCornerLatitude + ", " + southEastCornerLongitude);
        $("#southWestPoint").val(southWestCornerLatitude + ", " + southWestCornerLongitude);

        if (rectangleMeasureLayer == null) {
            rectangleMeasureLayer = layer.open({
                type: 1
                , offset: ['10px', '25%']
                , id: 'rectangleMeasureLayer'
                , title: '坐标范围'
                , content: $("#rectangleMeasure")
                , btn: ''
                , shade: 0
                , skin: 'layui-layer-lan'
                , area: ['300px']
                , resize: false
                , cancel: function () {
                    if (rectangleMeasure.layer.getLayers().length > 0) {
                        rectangleMeasure.layer.removeLayer(rectangleMeasure.rectangle);
                        layer.style(navigationBoxLayer, {display: "block"});
                        layer.style(targetLayer, {display: "block"});
                        rectangleMeasureLayer = null;
                    }
                    $(".layui-layer").css("display", "block")
                }
                , zIndex: 10000
            });
        }
    }

    // 选择区域保存
    function rectangleMeasureSave() {
        layer.style(navigationBoxLayer, {display: "block"});
        layer.style(targetLayer, {display: "block"});
        layer.close(rectangleMeasureLayer);
        rectangleMeasureLayer = null;
        $("#sendSafeMsgControlLayer_addArea").css("display", "none");
        $("#sendSafeMsgControlLayer_saveArea").css("display", "block");
        // 西北经度
        var northWestCornerLongitude = parseFloat(northWestPoint.split(",")[1].substring(0, northWestPoint.split(",")[1].length - 1)).toFixed(2);
        // 西北纬度
        var northWestCornerLatitude = parseFloat(northWestPoint.split(",")[0].substring(7)).toFixed(2);
        // 东北角经度
        var northEastCornerLongitude = parseFloat(northEastPoint.split(",")[1].substring(0, northEastPoint.split(",")[1].length - 1)).toFixed(2);
        // 东北角纬度
        var northEastCornerLatitude = parseFloat(northEastPoint.split(",")[0].substring(7)).toFixed(2);
        // 东南角经度
        var southEastCornerLongitude = parseFloat(southEastPoint.split(",")[1].substring(0, southEastPoint.split(",")[1].length - 1)).toFixed(2);
        // 东南角纬度
        var southEastCornerLatitude = parseFloat(southEastPoint.split(",")[0].substring(7)).toFixed(2);
        // 西南角经度
        var southWestCornerLongitude = parseFloat(southWestPoint.split(",")[1].substring(0, southWestPoint.split(",")[1].length - 1)).toFixed(2);
        // 西南角纬度
        var southWestCornerLatitude = parseFloat(southWestPoint.split(",")[0].substring(7)).toFixed(2);


        document.getElementById("sendSafeMsgControlLayer_saveArea").innerHTML = "<label class='layui-form-label' style='padding: 1px 0px; width: 630px; font-size: 15px;text-align: left;margin-left: 10px'>已选区域:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NW:"
            + northWestCornerLatitude + "," + northWestCornerLongitude
            + ";&nbsp;&nbsp;&nbsp;&nbsp;NE:" + northEastCornerLatitude + "," + northEastCornerLongitude
            + ";&nbsp;&nbsp;&nbsp;&nbsp;SE:" + southEastCornerLatitude + "," + southEastCornerLongitude
            + ";&nbsp;&nbsp;&nbsp;&nbsp;SW:" + southWestCornerLatitude + "," + southWestCornerLongitude
            + "</label>"
            + "<button class='layui-btn layui-btn-normal' style='width: 65px;height: 22px;line-height: 22px;margin-left: 10px;margin-top: -5px' lay-submit lay-filter='clearRectangleMeasure'>取消</button>";
        rectangleMeasure.rectangle.disableEdit();
    }

    // 选择区域编辑
    function rectangleMeasureEdit() {
        layer.style(navigationBoxLayer, {display: "none"});
        layer.style(targetLayer, {display: "none"});
        rectangleMeasure.rectangle.enableEdit();
    }

    // 取消选择区域
    function clearRectangleMeasure() {
        if (rectangleMeasure.layer.getLayers().length > 0) {
            rectangleMeasure.layer.removeLayer(rectangleMeasure.rectangle);
            layer.close(rectangleMeasureLayer);
            rectangleMeasureLayer = null;
        }
        $("#sendSafeMsgControlLayer_saveArea").empty();
        $("#sendSafeMsgControlLayer_addArea").css("display", "block");
        $("#sendSafeMsgControlLayer_saveArea").css("display", "none");
    };

    // 名称显示选项是否可用
    function nameShowOptionSet() {
        if (mapCurrentLevel > limitZoom && layerControlLayer_shipType != '') {
            $("input[name='layerControlLayer_shipName']").removeAttr("disabled", "disabled");
            form.render('checkbox')
        } else {
            $("input[name='layerControlLayer_shipName']").attr("disabled", "disabled");
            form.render('checkbox')
        }
    }

    // 渔船显示选项是否可用 2022/7/12 lxy
    function fishShipOptionSet() {
        if (layerControlLayer_shipType != '') {
            $('#layerControlLayer_fishShip_id').removeAttr("disabled");
            form.render('checkbox')
        }
    }

    // function nameShowOptionSet() {
    //     if (mapCurrentLevel > limitZoom) {
    //         $('#layerControlLayer_shipNameShow').removeAttr("disabled");
    //         $('#layerControlLayer_shipNameNotShow').removeAttr("disabled");
    //         form.render('radio')
    //     } else {
    //         $('#layerControlLayer_shipNameShow').attr("disabled", "disabled");
    //         $('#layerControlLayer_shipNameNotShow').attr("disabled", "disabled");
    //         form.render('radio')
    //     }
    // }

    function rotateAllPoints(points, angle) {
        var result = [];
        for (var i = 0; i < points.length; i += 2) {
            var x = points[i + 0] * 24;
            var y = points[i + 1] * 24;
            var pt = rotate([x, y], angle);
            result.push(pt[0]);
            result.push(pt[1]);
        }
        return result;
    };

    function rotate(point, angle) {
        var x = point[0];
        var y = point[1];
        var si_z = Math.sin(angle);
        var co_z = Math.cos(angle);
        var newX = x * co_z - y * si_z;
        var newY = x * si_z + y * co_z;
        return [newX, newY];
    };

    // 右上导航栏点击变色
    function selectColorChange(data) {
        var id = document.getElementById(data).children[0] ? document.getElementById(data).children[0] : document.getElementById(data);
        if (id.style.color == "") {
            document.getElementById("electronicFenceControl").children[0].style.color = ""
            document.getElementById("eFencehistory").children[0].style.color = ""
            document.getElementById("eFenceAlert").children[0].style.color = ""
            document.getElementById("layerControl").children[0].style.color = ""
            document.getElementById("playbackTrackControl").children[0].style.color = ""
            // document.getElementById("sendSafeMsgControl").children[0].style.color = ""
            // document.getElementById("receiveMessageControl").children[0].style.color = ""
            // document.getElementById("myFleet") != null ? document.getElementById("myFleet").children[0].style.color = "" : ""
            //document.getElementById("careShip") != null ? document.getElementById("careShip").children[0].style.color = "" : ""
            // document.getElementById("heatControl") != null ? document.getElementById("heatControl").children[0].style.color = "" : ""
            //document.getElementById("stationCoverageControl") != null ? document.getElementById("stationCoverageControl").children[0].style.color = "" : ""
            document.getElementById("virtualAtoNControl").children[0].style.color = ""
            document.getElementById("userInfo").children[0].style.color = ""
            document.getElementById("userPassword").children[0].style.color = ""
            document.getElementById("userExit").children[0].style.color = ""
            //document.getElementById("markerControl").children[0].style.color = ""
            // id.style.color = "#FFB800";

            $(id).css("cssText", "color: #FFB800 !important;font-size: 15px;")
        } else {
            id.style.color = "";
        }
    }

    // 其他图层关闭
    function rejectLayer(arr) {

        if (arr.indexOf('markerTableLayer') > -1) {
            if (window.markerTableLayerIndex != "") {
                layer.close(window.markerTableLayerIndex);
                window.markerTableLayerIndex = "";
            }
        }
        if (arr.indexOf('fleetShipLayerIndex') > -1) {
            layer.close(fleetShipLayerIndex);
        }
        if (arr.indexOf('fleetLayerIndex') > -1) {
            layer.close(fleetLayerIndex);
        }
        if (arr.indexOf('fleetSendMessageIndex') > -1) {
            layer.close(fleetSendMessageIndex);
        }
        if (arr.indexOf('fleetShipLayerIndex') > -1) {
            layer.close(fleetShipLayerIndex);
        }
        if (arr.indexOf('shipTimeLayerIndex') > -1) {
            layer.close(shipTimeLayerIndex);
        }
        if (arr.indexOf('fleetInfoDetailIndex') > -1) {
            layer.close(fleetInfoDetailIndex);
        }
        if (arr.indexOf('fleetShipLayerIndex') > -1) {
            layer.close(fleetShipLayerIndex);
        }

        if(arr.indexOf('careShipLayerIndex') > -1) {
            layer.close(navigationBoxLayer);
        }

        // 船舶（点）
        if (arr.indexOf('shipPointLayer') > -1) {
            if (map.hasLayer(shipPointLayer)) {
                map.removeLayer(shipPointLayer);
                shipPointLayer.clearLayers();
            }
        }
        // 船舶（三角）
        if (arr.indexOf('shipLayer') > -1) {
            if (map.hasLayer(shipLayer)) {
                map.removeLayer(shipLayer);
                shipLayer.clearLayers();
            }
        }
        // 船舶名称
        if (arr.indexOf('shipNameLayer') > -1) {
            if (map.hasLayer(shipNameLayer)) {
                map.removeLayer(shipNameLayer);
                shipNameLayer.clearLayers();
            }
        }
        // 岸站
        if (arr.indexOf('stationLayer') > -1) {
            if (map.hasLayer(stationLayer)) {
                map.removeLayer(stationLayer);
                stationLayer.clearLayers();
            }
        }
        // 岸站名称
        if (arr.indexOf('stationNameLayer') > -1) {
            if (map.hasLayer(stationNameLayer)) {
                map.removeLayer(stationNameLayer);
                stationNameLayer.clearLayers();
            }
        }
        // 助航设备
        if (arr.indexOf('atonLayer') > -1) {
            if (map.hasLayer(atonLayer)) {
                map.removeLayer(atonLayer);
                atonLayer.clearLayers();
            }
        }
        // 助航设备名称
        if (arr.indexOf('atonNameLayer') > -1) {
            if (map.hasLayer(atonNameLayer)) {
                map.removeLayer(atonNameLayer);
                atonNameLayer.clearLayers();
            }
        }
        // // 网位仪（点）
        // if (arr.indexOf('fishingNetPointLayer') > -1) {
        //     if (map.hasLayer(fishingNetPointLayer)) {
        //         map.removeLayer(fishingNetPointLayer);
        //         fishingNetPointLayer.clearLayers();
        //     }
        // }
        // // 网位仪
        // if (arr.indexOf('fishingNetLayer') > -1) {
        //     if (map.hasLayer(fishingNetLayer)) {
        //         map.removeLayer(fishingNetLayer);
        //         fishingNetLayer.clearLayers();
        //     }
        // }

        // 热力图
        if (arr.indexOf('heatmapLayer') > -1) {
            if (heatmapLayer != null) {
                map.removeLayer(heatmapLayer);
                heatmapLayer = null;
                getShipData();
                getStationData();
                getAtonData();
                getFishingNetData();
                document.getElementById("heatControl").children[0].style.color = ""
            }
        }

        // 右上导航栏弹出层
        if (arr.indexOf('navigationBoxLayer') > -1) {
            layer.close(navigationBoxLayer);
        }
        // 轨迹回放
        if (arr.indexOf('trackplaybackControl') > -1) {
            if (trackplaybackControl != null && trackplaybackControl.trackPlayBack.clock != null) {
                trackplaybackControl._close();
            }
            if (trackListLayer != null) {
                layer.close(trackListLayer);
                trackListLayer = null;
            }
        }
        // 船舶详细
        if (arr.indexOf('shipDetailLayer') > -1) {
            layer.close(shipDetailLayer);
            shipDetailLayer = null;
            selectedShipMMSI = null;
        }
        // 船舶选择框
        if (arr.indexOf('selectedShipLayer') > -1) {
            if (map.hasLayer(selectedShipLayer)) {
                map.removeLayer(selectedShipLayer);
                selectedShipLayer.clearLayers();

            }
        }
        // 船舶详细按钮点击弹出层
        if (arr.indexOf('targetLayer') > -1) {
            layer.close(targetLayer);
            // clearRectangleMeasure();
        }

        // 岸站详细
        if (arr.indexOf('stationDetailLayer') > -1) {
            layer.close(stationDetailLayer);
            stationDetailLayer = null;
        }
        // 助航设备详细
        if (arr.indexOf('atonDetailLayer') > -1) {
            layer.close(atonDetailLayer);
            atonDetailLayer = null;
        }
        // // 网位仪详细
        // if (arr.indexOf('fishingNetDetailLayer') > -1) {
        //     layer.close(fishingNetDetailLayer);
        //     fishingNetDetailLayer = null;
        // }
        // 设置中心点
        if (arr.indexOf('setCenterLayer') > -1) {
            layer.close(setCenterLayer)
            setCenterLayer = null;
            $('#map').css('cursor', "");
            $('#setCenter_lat').val("");
            $('#setCenter_lng').val("");
            map.off('click');
            centerPosition.remove();
            $("#centerPositionSet")[0].style.color = ""
        }
        // 距离测量
        if (arr.indexOf('measureLayer') > -1) {
            measureControl._clearAllMeasurements();
            map.removeControl(measureControl);
            $("#measureDistance")[0].style.color = ""
        }
        // // 图例
        // if (arr.indexOf('legendLayer') > -1) {
        //     layer.close(legendLayer)
        //     legendLayer = null;
        //     $("#legend")[0].style.color = ""
        // }
        // 左侧列表
        if (arr.indexOf('allList_left') > -1) {
            $("#allList_left").css("display", "none");
            $("#search_box").css("display", "block");
        }
        // 左侧列表
        if (arr.indexOf('electronicFenceLayerIndex') > -1) {
            //closeElectronicFenceLayer("all");
        }

        if(arr.indexOf('virtualAtoNLayerIndex') > -1) {
            layer.close(window.virtualAtoNLayerIndex)
        }

        if(arr.indexOf('electronicAlertLayer') > -1) {
            layer.close(window.electronicAlertLayer)
            window.electronicAlertLayer = ''
        }

        if(arr.indexOf('electronicHistoryLayer') > -1) {
            layer.close(window.electronicHistoryLayer)
            window.electronicHistoryLayer = ''
        }

        if(arr.indexOf('electronicFenceLayerCustomIndex') > -1) {
            layer.close(window.electronicFenceLayerCustomIndex)
            window.electronicFenceLayerCustomIndex = ''
        }
    };

    // 获取船舶类型
    function getShipType(t) {
        var array = ["引航船舶",
            "搜救船舶",
            "拖轮",
            "港口补给船",
            "安装有防污染设施或设备的船舶",
            "执法船舶",
            "备用–当地船舶指配使用",
            "备用-当地船舶指配使用",
            "医疗运送船舶",
            "非武装冲突参与国的船舶和航空器",
            "捕捞",
            "拖船",
            "拖船且推带长度>200m或宽度>25m",
            "挖掘或水下作业",
            "潜水作业",
            "军事行动",
            "帆船",
            "游艇",
            "飞翼船",
            "高速船",
            "客轮",
            "货轮",
            "油轮",
            "其他类型的船舶"];

        if (t < 10 || t > 100) {
            return "";
        }
        if (t == 100) {
            return "集装箱船";
        }
        var num_10 = Math.floor(t / 10);
        var num_1 = t % 10;
        if (num_10 == 5) {
            return array[num_1];
        } else if (num_10 == 3) {
            if (num_1 >= 0 && num_1 <= 7) {
                return array[num_1 + 10];
            }
            return "";
        } else {
            switch (num_10) {
                case 2:
                    return array[18];
                case 4:
                    return array[19];
                case 6:
                    return array[20];
                case 7:
                    return array[21];
                case 8:
                    return array[22];
                case 9:
                    return array[23];
                default:
                    return "";
            }
        }
    }

    // 获取船舶状态
    function getShipStatus(t) {
        var array = ["发动机使用中",
            "锚泊",
            "未操纵",
            "有限适航性",
            "受船舶吃水限制",
            "系泊",
            "搁浅",
            "从事捕捞",
            "航行中",
            "",
            "",
            "机动船尾推作业",
            "机动船顶推或侧推作业",
            "留做将来用",
            "AIS-SART",
            "未规定"];
        if (t == null || t == undefined) {
            return "";
        }
        return array[t];
    }


    //广播式安全消息 添加
    function showAddAreaLayer(str) {

        // 互斥图层关闭
        var arr = ['heatmapLayer', 'rectangleMeasureLayer', 'targetLayer', 'trackplaybackControl', 'owmStationLayer'];
        rejectLayer(arr);


        var selectValue = "0";
        var offset;
        var area;
        var title;
        var close = '';
        $("#airPressureTendency").val("0");
        form.render('select');
        form.on('select(airPressureTendency)', function (e) {
            selectValue = e.value;
        });

        $("#targetShipMMSI_playbackTrack").val("");

        switch (str) {
            case "targetAddArea":
                title = "请选择";
                offset = 'auto';
                area = ['500px', '400px'];
                break;
            default:
                break;
        }

        commonLayer = layer.open({
            type: 1
            , offset: offset
            , id: str + '_id'
            , title: title
            , content: $('#' + str + 'Layer')
            , shade: 0
            , skin: 'demo-class'
            , area: area
            , resize: false
            , btn: ['确定', '取消']
            , yes: function (index, layero) {
                if (selectValue == 3 || selectValue == 4) {
                    if (!roundFlage) {
                        showDetail(index, selectValue);
                    } else {
                        layer.msg("子区域包含折线或者多边形时，先添加圆形域点信息", {icon: 2, time: config.msgTime})
                    }
                } else {
                    showDetail(index, selectValue);
                }
            }
            , btn2: function (index, layero) {
                layer.close(index);
            }
            //    ,success: function(layero, index){
            //     layer.form.render('select');
            //   }

        });
    }

    function showDetail(index, selectValue) {
        switch (selectValue) {
            case "0":
                if (roundFlage) {
                    // add by hejian 形状区域对应
                    subAreas.push({
                        areaShape: selectValue,
                        scaleFactor: '',
                        longitude: '',
                        latitude: '',
                        precision: '',
                        radius: ''
                    });
                    $("#addDiv").append(
                        '<div id="circularDomainPoint">' +
                        '<div style="margin-top: 10px;">' +
                        ' <label class="layui-form-label" style="width: 190px; text-align:right">圆形域点</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<a class="layui-btn layui-btn-normal" id="targetDeleteArea" name="circularDomainPoint" style="height: 38px; float:right； width: 100px;">删除</a>' +
                        '</div>' +
                        '</div>' +
                        // '<div style="margin-top: 10px;">' +
                        // ' <label class="layui-form-label" style="width: 190px; text-align:right">区域形状</label>' +
                        // '<div class="layui-input-block" style="margin-left: 220px;">' +
                        // '<input type="text" name="areaShape" placeholder="请输入" lay-verify="required" maxlength="3" autocomplete="off"' +
                        // 'class="layui-input">' +
                        // '</div>' +
                        // '</div>' +
                        '<input type="hidden" id="areaShape-0"  name="areaShape" value="0">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">比例因子</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text"  id="scaleFactor-0" name="scaleFactor" placeholder="请输入" lay-verify="" maxlength="2" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">经度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="longitude-0"   name="longitude" placeholder="请输入±180" lay-verify="from180To180Int" maxlength="25"autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">纬度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="latitude-0" name="latitude" placeholder="请输入±90" lay-verify="from90To90Int" maxlength="24"  autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">精度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="precision-0" name="precision" placeholder="请输入0~4" lay-verify="from0To4Int" maxlength="3" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">半径</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="radius-0" name="radius" placeholder="请输入1~4095" lay-verify="from1To4095Int" maxlength="12" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '</div>')
                }
                ;
                roundFlage = false;
                break;
            case "1":
                if (rectangular) {
                    // add by hejian 形状区域对应
                    subAreas.push({
                        areaShape: selectValue,
                        scaleFactor: '',
                        longitude: '',
                        latitude: '',
                        precision: '',
                        dimensionE: '',
                        dimensionN: '',
                        orientation: ''
                    });
                    $("#addDiv").append(
                        '<div id="rectangularDomain">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">矩形域点</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<a id="targetDeleteArea" name="rectangularDomain" class="layui-btn layui-btn-normal" style="height: 38px; float:right； width: 100px;">删除</a>' +
                        '</div>' +
                        '</div>' +
                        // '<div style="margin-top: 10px;">' +
                        // '<label class="layui-form-label" style="width: 190px; text-align:right">区域形状</label>' +
                        // '<div class="layui-input-block" style="margin-left: 220px;">' +
                        // '<input type="text" name="areaShape" placeholder="请输入" lay-verify="required" maxlength="3" autocomplete="off" class="layui-input">' +
                        // '</div>' +
                        // '</div>' +
                        '<input type="hidden" id="areaShape-1"  name="areaShape" value="1">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">比例因子</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text"  id="scaleFactor-1" name="scaleFactor" placeholder="请输入" lay-verify="" maxlength="2" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">经度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text"  id="longitude-1" name="longitude" placeholder="请输入±180" lay-verify="from180To180Int" maxlength="25"autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">纬度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="latitude-1" name="latitude" placeholder="请输入±90" lay-verify="from90To90Int" maxlength="24" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">精度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="precision-1" name="precision" placeholder="请输入0~4" lay-verify="from0To4Int" maxlength="3" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">dimensionE</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="dimensionE-1" name="dimensionE" placeholder="请输入1~255" lay-verify="from1To255Int" maxlength="8"autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">dimensionN</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="dimensionN-1" name="dimensionN" placeholder="请输入1~255000" lay-verify="from1To255000Int" maxlength="8" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">orientation</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="orientation-1" name="orientation" placeholder="请输入1~359" lay-verify="from1To359Int" maxlength="9" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '</div>'
                    )
                }
                ;
                rectangular = false;
                //$('#rectangularDomain').css("display", "block");
                break;
            case "2":
                // $('#fanDomain').css("display", "block");
                if (fanFlage) {
                    // add by hejian 形状区域对应
                    subAreas.push({
                        areaShape: selectValue,
                        scaleFactor: '',
                        longitude: '',
                        latitude: '',
                        precision: '',
                        radius: '',
                        leftBoundary: '',
                        rightBoundary: ''
                    });
                    $("#addDiv").append(
                        '<div id="fanDomain">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">扇形域点</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<a id="targetDeleteArea" name="fanDomain" class="layui-btn layui-btn-normal" style="height: 38px; float:right； width: 100px;">删除</a>' +
                        '</div>' +
                        '</div>' +
                        // '<div style="margin-top: 10px;">' +
                        // '<label class="layui-form-label" style="width: 190px; text-align:right">区域形状</label>' +
                        // '<div class="layui-input-block" style="margin-left: 220px;">' +
                        // '<input type="text" name="areaShape" placeholder="请输入" lay-verify="required" maxlength="3" autocomplete="off" class="layui-input">' +
                        // '</div>' +
                        // '</div>' +
                        '<input type="hidden" id="areaShape-2"  name="areaShape" value="2">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">比例因子</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="scaleFactor-2"name="scaleFactor" placeholder="请输入" lay-verify="" maxlength="2" autocomplete="off"class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">经度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="longitude-2" name="longitude" placeholder="请输入±180" lay-verify="from180To180Int" maxlength="25" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">纬度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="latitude-2" name="latitude" placeholder="请输入±90" lay-verify="from90To90Int" maxlength="24" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">精度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="precision-2" name="precision" placeholder="请输入0~4" lay-verify="from0To4Int" maxlength="3" autocomplete="off"class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">半径</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="radius-2" name="radius" placeholder="请输入1~4095" lay-verify="from1To4095Int" maxlength="12"' +
                        'autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">左边界</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="leftBoundary-2" name="leftBoundary" placeholder="请输入1~359" lay-verify="from1To359Int" maxlength="9" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">有边界</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="rightBoundary-2" name="rightBoundary" placeholder="请输入1~359" lay-verify="from1To359Int" maxlength="9" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '</div>'
                    )
                }
                ;
                fanFlage = false;
                break;
            case "3":
                // $('#linePoint').css("display", "block");

                if (brokenLine) {
                    // add by hejian 形状区域对应
                    subAreas.push({
                        areaShape: selectValue,
                        scaleFactor: '',
                        pointAngle1: '',
                        pointDistance1: '',
                        pointAngle2: '',
                        pointDistance2: '',
                        pointAngle3: '',
                        pointDistance3: '',
                        pointAngle4: '',
                        pointDistance4: ''
                    });
                    $("#addDiv").append(
                        '<div id="linePoint">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">折线域点</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<a id="targetDeleteArea" name="linePoint" class="layui-btn layui-btn-normal" style="height: 38px; float:right； width: 100px;">删除</a>' +
                        '</div>' +
                        '</div>' +
                        // '<div style="margin-top: 10px;">' +
                        // '<label class="layui-form-label" style="width: 190px; text-align:right">区域形状</label>' +
                        // '<div class="layui-input-block" style="margin-left: 220px;">' +
                        // '<input type="text" name="areaShape" placeholder="请输入" lay-verify="required" maxlength="3" autocomplete="off"class="layui-input">' +
                        // '</div>' +
                        // '</div>' +
                        '<input type="hidden" id="areaShape-3"  name="areaShape" value="3">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">比例因子</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="scaleFactor-3" name="scaleFactor" placeholder="请输入" lay-verify="" maxlength="2" autocomplete="off"class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置1的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle1-3" name="pointAngle1" placeholder="请输入0~719" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置1距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance1-3" name="pointDistance1" placeholder="请输入1~1023" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置2的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle2-3" name="pointAngle2" placeholder="请输入0~719" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置2距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance2-3" name="pointDistance2" placeholder="请输入1~1023" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置3的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle3-3" name="pointAngle3" placeholder="请输入0~719" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置3距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance3-3" name="pointDistance3" placeholder="请输入1~1023" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置4的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle4-3" name="pointAngle4" placeholder="请输入0~719" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置4距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance4-3" name="pointDistance4" placeholder="请输入1~1023" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '</div>'
                    )
                }
                brokenLine = false
                break;
            case "4":
                if (polygonFlage) {
                    // add by hejian 形状区域对应
                    subAreas.push({
                        areaShape: selectValue,
                        scaleFactor: '',
                        pointAngle1: '',
                        pointDistance1: '',
                        pointAngle2: '',
                        pointDistance2: '',
                        pointAngle3: '',
                        pointDistance3: '',
                        pointAngle4: '',
                        pointDistance4: ''
                    });
                    $("#addDiv").append(
                        '<div id="polygonDomain">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">多边形域点</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<a id="targetDeleteArea" name="polygonDomain"  class="layui-btn layui-btn-normal" style="height: 38px; float:right； width: 100px;">删除</a>' +
                        '</div>' +
                        '</div>' +
                        // '<div style="margin-top: 10px;">' +
                        // '<label class="layui-form-label" style="width: 190px; text-align:right">区域形状</label>' +
                        // '<div class="layui-input-block" style="margin-left: 220px;">' +
                        // '<input type="text" name="areaShape" placeholder="请输入" lay-verify="required" maxlength="3" autocomplete="off"class="layui-input">' +
                        // '</div>' +
                        // '</div>' +
                        '<input type="hidden" id="areaShape-4"  name="areaShape" value="4">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">比例因子</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="scaleFactor-4" name="scaleFactor" placeholder="请输入" lay-verify="" maxlength="2" autocomplete="off"class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置1的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle1-4" name="pointAngle1" placeholder="请输入0~719" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置1距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance1-4" name="pointDistance1" placeholder="请输入1~1023" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置2的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle2-4" name="pointAngle2" placeholder="请输入0~719" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置2距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance2-4" name="pointDistance2" placeholder="请输入1~1023" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置3的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle3-4" name="pointAngle3" placeholder="请输入0~719" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置3距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance3-4" name="pointDistance3" placeholder="请输入1~1023" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置4的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle4-4" name="pointAngle4" placeholder="请输入0~719" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置4距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance4-4" name="pointDistance4" placeholder="请输入1~1023" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '</div>'
                    )
                }
                polygonFlage = false;
                break;
            case "5":
                // $('#associatedText').css("display", "block");
                if (textFlage) {
                    // add by hejian 形状区域对应
                    subAreas.push({areaShape: selectValue, text: ''});
                    $("#addDiv").append(
                        '<div id="associatedText">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">关联文本</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<a id="targetDeleteArea" name="associatedText"  class="layui-btn layui-btn-normal" style="height: 38px; float:right； width: 100px;">删除</a>' +
                        '</div>' +
                        '</div>' +
                        // '<div style="margin-top: 10px;">' +
                        // '<label class="layui-form-label" style="width: 190px; text-align:right">区域形状</label>' +
                        // '<div class="layui-input-block" style="margin-left: 220px;">' +
                        // '<input type="text" name="areaShape" placeholder="请输入" lay-verify="required" maxlength="3" autocomplete="off" class="layui-input">' +
                        // '</div>' +
                        // '</div>' +
                        '<input type="hidden" id="areaShape-5"  name="areaShape" value="5">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">文本</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="text-5" name="text" placeholder="请输入" lay-verify="bitASCII" maxlength="84" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '</div>'
                    )
                }
                ;
                textFlage = false;
                break;
            default:
                break;
        }
        layer.close(index);

    }

    function deleteAreaLayer(str) {
        switch (str) {
            case "circularDomainPoint":
                deleteSubAreas("0");
                $("#" + str).remove();
                roundFlage = true;
                break;
            case 'rectangularDomain':
                deleteSubAreas("1");
                $("#" + str).remove();
                rectangular = true;
                break;
            case "fanDomain":
                deleteSubAreas("2");
                $("#" + str).remove();
                fanFlage = true;
                break;
            case 'linePoint':
                deleteSubAreas("3");
                $("#" + str).remove();
                brokenLine = true;
                break;
            case "polygonDomain":
                deleteSubAreas("4");
                $("#" + str).remove();
                polygonFlage = true;
                break;
            case 'associatedText':
                deleteSubAreas("5");
                $("#" + str).remove();
                textFlage = true;
                break;
        }

    }



    //广播式安全消息 添加(船)
    function showAddShip(str, id) {

        // 互斥图层关闭
        var arr = ['heatmapLayer', 'rectangleMeasureLayer', 'commonLayer', 'trackplaybackControl',  'owmStationLayer'];
        rejectLayer(arr);

        var selectValue = "0";
        var $ = layui.jquery;
        var layer = layui.layer;
        var offset;
        var area;
        var title;
        var close = '';
        var form = layui.form;
        $("#airPressureTendency").val("0");
        form.render('select');
        form.on('select(airPressureTendency)', function (e) {
            selectValue = e.value;
        });

        $("#targetShipMMSI_playbackTrack").val("");

        //layer.close(targetLayer);
        //layer.style(targetLayer,{display:"block"});

        switch (str) {
            case "targetAddShip":
                title = "请选择";
                offset = 'auto';
                area = ['500px', '400px'];
                break;
            default:
                break;
        }
        targetLayer = layer.open({
            type: 1
            , offset: offset
            , id: str + '_id'
            , title: title
            , content: $('#targetAddAreaLayer')
            , shade: 0
            , skin: 'demo-class'
            , area: area
            , resize: false
            , btn: ['确定', '取消']
            , yes: function (index, layero) {
                if (selectValue == 3 || selectValue == 4) {
                    if (!roundFlageShip) {
                        showDetailShip(index, selectValue, id);
                    } else {
                        layer.msg("子区域包含折线或者多边形时，先添加圆形域点信息")
                    }
                } else {
                    showDetailShip(index, selectValue, id);
                }
            }
            , btn2: function (index, layero) {
                layer.close(index);
            }
        });
    }

    function showDetailShip(index, selectValue, id) {
        switch (selectValue) {
            case "0":
                if (roundFlageShip) {

                    // add by hejian 形状区域对应
                    subAreas.push({
                        areaShape: selectValue,
                        scaleFactor: '',
                        longitude: '',
                        latitude: '',
                        precision: '',
                        radius: ''
                    });

                    $("#" + id).append(
                        '<div id="circularDomainPointShip">' +
                        '<div style="margin-top: 10px;">' +
                        ' <label class="layui-form-label" style="width: 190px; text-align:right">圆形域点</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<a id="targetDeleteShip" name="circularDomainPointShip" class="layui-btn layui-btn-normal" style="height: 38px; float:right； width: 100px;">删除</a>' +
                        '</div>' +
                        '</div>' +
                        // '<div style="margin-top: 10px;">' +
                        // ' <label class="layui-form-label" style="width: 190px; text-align:right">区域形状</label>' +
                        // '<div class="layui-input-block" style="margin-left: 220px;">' +
                        // '<input type="text" name="areaShape" placeholder="请输入" lay-verify="required" maxlength="3" autocomplete="off"' +
                        // 'class="layui-input">' +
                        // '</div>' +
                        // '</div>' +
                        '<input type="hidden" id="areaShape-0"  name="areaShape" value="0">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">比例因子</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="scaleFactor-0" name="scaleFactor" placeholder="请输入" lay-verify="" maxlength="2" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">经度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="longitude-0"  name="longitude" placeholder="请输入±180" lay-verify="from180To180Int" maxlength="25"autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">纬度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="latitude-0" name="latitude" placeholder="请输入±90" lay-verify="from90To90Int" maxlength="24"  autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">精度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="precision-0" name="precision" placeholder="请输入0~4" lay-verify="from0To4Int" maxlength="3" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">半径</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="radius-0" name="radius" placeholder="请输入1~4095" lay-verify="from1To4095Int" maxlength="12" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '</div>')
                }
                ;
                roundFlageShip = false;
                break;
            case "1":
                if (rectangularShip) {
                    // add by hejian 形状区域对应
                    subAreas.push({
                        areaShape: selectValue,
                        scaleFactor: '',
                        longitude: '',
                        latitude: '',
                        precision: '',
                        dimensionE: '',
                        dimensionN: '',
                        orientation: ''
                    });
                    $("#" + id).append(
                        '<div id="rectangularDomainShip">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">矩形域点</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<a id="targetDeleteShip" name="rectangularDomainShip"  class="layui-btn layui-btn-normal" style="height: 38px; float:right； width: 100px;">删除</a>' +
                        '</div>' +
                        '</div>' +
                        // '<div style="margin-top: 10px;">' +
                        // '<label class="layui-form-label" style="width: 190px; text-align:right">区域形状</label>' +
                        // '<div class="layui-input-block" style="margin-left: 220px;">' +
                        // '<input type="text" name="areaShape" placeholder="请输入" lay-verify="required" maxlength="3" autocomplete="off" class="layui-input">' +
                        // '</div>' +
                        // '</div>' +
                        '<input type="hidden" id="areaShape-1"  name="areaShape" value="1">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">比例因子</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text"  id="scaleFactor-1" name="scaleFactor" placeholder="请输入" lay-verify="" maxlength="2" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">经度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text"  id="longitude-1" name="longitude" placeholder="请输入±180" lay-verify="from180To180Int" maxlength="25"autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">纬度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="latitude-1"  name="latitude" placeholder="请输入±90" lay-verify="from90To90Int" maxlength="24" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">精度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="precision-1"  name="precision" placeholder="请输入0~4" lay-verify="from0To4Int" maxlength="3" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">dimensionE</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="dimensionE-1" name="dimensionE" placeholder="请输入1~255" lay-verify="from1To255Int" maxlength="8"autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">dimensionN</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="dimensionN-1" name="dimensionN" placeholder="请输入1~255000" lay-verify="from1To255000Int" maxlength="8" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">orientation</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="orientation-1" name="orientation" placeholder="请输入1~359" lay-verify="from1To359Int" maxlength="9" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '</div>'
                    )
                }
                ;
                rectangularShip = false;
                //$('#rectangularDomain').css("display", "block");
                break;
            case "2":
                // $('#fanDomain').css("display", "block");
                if (fanFlageShip) {
                    // add by hejian 形状区域对应
                    subAreas.push({
                        areaShape: selectValue,
                        scaleFactor: '',
                        longitude: '',
                        latitude: '',
                        precision: '',
                        radius: '',
                        leftBoundary: '',
                        rightBoundary: ''
                    });
                    $("#" + id).append(
                        '<div id="fanDomainShip">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">扇形域点</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<a id="targetDeleteShip" name="fanDomainShip"  class="layui-btn layui-btn-normal" style="height: 38px; float:right； width: 100px;">删除</a>' +
                        '</div>' +
                        '</div>' +
                        // '<div style="margin-top: 10px;">' +
                        // '<label class="layui-form-label" style="width: 190px; text-align:right">区域形状</label>' +
                        // '<div class="layui-input-block" style="margin-left: 220px;">' +
                        // '<input type="text" name="areaShape" placeholder="请输入" lay-verify="required" maxlength="3" autocomplete="off" class="layui-input">' +
                        // '</div>' +
                        // '</div>' +
                        '<input type="hidden" id="areaShape-2"  name="areaShape" value="2">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">比例因子</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text"  id="scaleFactor-2" name="scaleFactor" placeholder="请输入" lay-verify="" maxlength="2" autocomplete="off"class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">经度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text"  id="longitude-2" name="longitude" placeholder="请输入±180" lay-verify="from180To180Int" maxlength="25" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">纬度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="latitude-2" name="latitude" placeholder="请输入±90" lay-verify="from90To90Int" maxlength="24" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">精度</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="precision-2" name="precision" placeholder="请输入0~4" lay-verify="from0To4Int" maxlength="3" autocomplete="off"class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">半径</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="radius-2" name="radius" placeholder="请输入1~4095" lay-verify="from1To4095Int" maxlength="12"' +
                        'autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">左边界</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text"  id="leftBoundary-2" name="leftBoundary" placeholder="请输入1~359" lay-verify="from1To359Int" maxlength="9" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">有边界</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text"  id="rightBoundary-2"  name="rightBoundary" placeholder="请输入1~359" lay-verify="from1To359Int" maxlength="9" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '</div>'
                    )
                }
                ;
                fanFlageShip = false;
                break;
            case "3":
                // $('#linePoint').css("display", "block");
                if (brokenLineShip) {
                    // add by hejian 形状区域对应
                    subAreas.push({
                        areaShape: selectValue,
                        scaleFactor: '',
                        pointAngle1: '',
                        pointDistance1: '',
                        pointAngle2: '',
                        pointDistance2: '',
                        pointAngle3: '',
                        pointDistance3: '',
                        pointAngle4: '',
                        pointDistance4: ''
                    });
                    $("#" + id).append(
                        '<div id="linePointShip">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">折线域点</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<a id="targetDeleteShip" name="linePointShip"  class="layui-btn layui-btn-normal" style="height: 38px; float:right； width: 100px;">删除</a>' +
                        '</div>' +
                        '</div>' +
                        // '<div style="margin-top: 10px;">' +
                        // '<label class="layui-form-label" style="width: 190px; text-align:right">区域形状</label>' +
                        // '<div class="layui-input-block" style="margin-left: 220px;">' +
                        // '<input type="text" name="areaShape" placeholder="请输入" lay-verify="required" maxlength="3" autocomplete="off"class="layui-input">' +
                        // '</div>' +
                        // '</div>' +
                        '<input type="hidden" id="areaShape-3"  name="areaShape" value="3">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">比例因子</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text"  id="scaleFactor-3" name="scaleFactor" placeholder="请输入" lay-verify="" maxlength="2" autocomplete="off"class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置1的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle1-3" name="pointAngle1" placeholder="请输入" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置1距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance1-3" name="pointDistance1" placeholder="请输入" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置2的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle2-3" name="pointAngle2" placeholder="请输入" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置2距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance2-3" name="pointDistance2" placeholder="请输入" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置3的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle3-3" name="pointAngle3" placeholder="请输入" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置3距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance3-3" name="pointDistance3" placeholder="请输入" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置4的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle4-3" name="pointAngle4" placeholder="请输入" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置4距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance4-3" name="pointDistance4" placeholder="请输入" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '</div>'
                    )
                }
                brokenLineShip = false
                break;
            case "4":
                //$('#polygonDomain').css("display", "block");
                if (polygonFlageShip) {
                    // add by hejian 形状区域对应
                    subAreas.push({
                        areaShape: selectValue,
                        scaleFactor: '',
                        pointAngle1: '',
                        pointDistance1: '',
                        pointAngle2: '',
                        pointDistance2: '',
                        pointAngle3: '',
                        pointDistance3: '',
                        pointAngle4: '',
                        pointDistance4: ''
                    });
                    $("#" + id).append(
                        '<div id="polygonDomainShip">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">多边形域点</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<a id="targetDeleteShip" name="polygonDomainShip" class="layui-btn layui-btn-normal" style="height: 38px; float:right； width: 100px;">删除</a>' +
                        '</div>' +
                        '</div>' +
                        // '<div style="margin-top: 10px;">' +
                        // '<label class="layui-form-label" style="width: 190px; text-align:right">区域形状</label>' +
                        // '<div class="layui-input-block" style="margin-left: 220px;">' +
                        // '<input type="text" name="areaShape" placeholder="请输入" lay-verify="required" maxlength="3" autocomplete="off"class="layui-input">' +
                        // '</div>' +
                        // '</div>' +
                        '<input type="hidden" id="areaShape-4"  name="areaShape" value="4">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">比例因子</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="scaleFactor-4" name="scaleFactor" placeholder="请输入" lay-verify="" maxlength="2" autocomplete="off"class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置1的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle1-4"  name="pointAngle1" placeholder="请输入" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置1距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text"  id="pointDistance1-4" name="pointDistance1" placeholder="请输入" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置2的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle2-4"  name="pointAngle2" placeholder="请输入" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置2距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance2-4"  name="pointDistance2" placeholder="请输入" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置3的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle3-4"  name="pointAngle3" placeholder="请输入" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置3距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance3-4"  name="pointDistance3" placeholder="请输入" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置4的倾角</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointAngle4-4"  name="pointAngle4" placeholder="请输入" lay-verify="from0To719Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">位置4距离</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="pointDistance4-4"  name="pointDistance4" placeholder="请输入" lay-verify="from1To1023Int" maxlength="10" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '</div>'
                    )
                }
                polygonFlageShip = false;
                break;
            case "5":
                // $('#associatedText').css("display", "block");
                if (textFlageShip) {
                    // add by hejian 形状区域对应
                    subAreas.push({areaShape: selectValue, text: ''});
                    $("#" + id).append(
                        '<div id="associatedTextShip">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">关联文本</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<a id="targetDeleteShip" name="associatedTextShip" class="layui-btn layui-btn-normal" style="height: 38px; float:right； width: 100px;">删除</a>' +
                        '</div>' +
                        '</div>' +
                        // '<div style="margin-top: 10px;">' +
                        // '<label class="layui-form-label" style="width: 190px; text-align:right">区域形状</label>' +
                        // '<div class="layui-input-block" style="margin-left: 220px;">' +
                        // '<input type="text" name="areaShape" placeholder="请输入" lay-verify="required" maxlength="3" autocomplete="off" class="layui-input">' +
                        // '</div>' +
                        // '</div>' +
                        '<input type="hidden" id="areaShape-5"  name="areaShape" value="5">' +
                        '<div style="margin-top: 10px;">' +
                        '<label class="layui-form-label" style="width: 190px; text-align:right">文本</label>' +
                        '<div class="layui-input-block" style="margin-left: 220px;">' +
                        '<input type="text" id="text-5" name="text" placeholder="请输入" lay-verify="bitASCII" maxlength="84" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '</div>' +
                        '</div>'
                    )
                }
                ;
                textFlageShip = false;
                break;
            default:
                break;
        }

        layer.close(index);


    }

    var numberOfWaypoints = '';
    $("input[name='numberOfWaypoints']").blur(function () {
        var value = Number($(this).val());
        if (value != numberOfWaypoints) {
            if (value > 0 && value <= 16) {
                $("#waypoints").empty();
                var str = '';
                for (var i = 1; i <= value; i++) {
                    str += '<label class="layui-form-label" style="width: 70px; text-align:right">经度' + i + '</label>' +
                        '<div class="layui-input-block" style="width: 160px; margin-left: 10px; float: left">' +
                        '<input type="text" style="width: 160px;" name="longitude' + i + '" placeholder="请输入±180" lay-verify="from180To180Int" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '<label class="layui-form-label" style="width: 70px; text-align:right">纬度' + i + '</label>' +
                        '<div class="layui-input-block" style="width: 160px; margin-left: 10px;float: left">' +
                        '<input type="text" style="width: 160px;" name="latitude' + i + '" placeholder="请输入±90" lay-verify="from90To90Int" autocomplete="off" class="layui-input">' +
                        '</div>'
                }
                $("#waypoints").append(str);
                if (value < numberOfWaypoints) {
                    if (value == 1) {
                        Dlongitude2 = '';
                        Dlatitude2 = '';
                        Dlongitude3 = '';
                        Dlatitude3 = '';
                        Dlongitude4 = '';
                        Dlatitude4 = '';
                        Dlongitude5 = '';
                        Dlatitude5 = '';
                        Dlongitude6 = '';
                        Dlatitude6 = '';
                        Dlongitude7 = '';
                        Dlatitude7 = '';
                        Dlongitude8 = '';
                        Dlatitude8 = '';
                        Dlongitude9 = '';
                        Dlatitude9 = '';
                        Dlongitude10 = '';
                        Dlatitude10 = '';
                        Dlongitude11 = '';
                        Dlatitude11 = '';
                        Dlongitude12 = '';
                        Dlatitude12 = '';
                        Dlongitude13 = '';
                        Dlatitude13 = '';
                        Dlongitude14 = '';
                        Dlatitude14 = '';
                        Dlongitude15 = '';
                        Dlatitude15 = '';
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    } else if (value == 2) {
                        Dlongitude3 = '';
                        Dlatitude3 = '';
                        Dlongitude4 = '';
                        Dlatitude4 = '';
                        Dlongitude5 = '';
                        Dlatitude5 = '';
                        Dlongitude6 = '';
                        Dlatitude6 = '';
                        Dlongitude7 = '';
                        Dlatitude7 = '';
                        Dlongitude8 = '';
                        Dlatitude8 = '';
                        Dlongitude9 = '';
                        Dlatitude9 = '';
                        Dlongitude10 = '';
                        Dlatitude10 = '';
                        Dlongitude11 = '';
                        Dlatitude11 = '';
                        Dlongitude12 = '';
                        Dlatitude12 = '';
                        Dlongitude13 = '';
                        Dlatitude13 = '';
                        Dlongitude14 = '';
                        Dlatitude14 = '';
                        Dlongitude15 = '';
                        Dlatitude15 = '';
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    } else if (value == 3) {
                        Dlongitude4 = '';
                        Dlatitude4 = '';
                        Dlongitude5 = '';
                        Dlatitude5 = '';
                        Dlongitude6 = '';
                        Dlatitude6 = '';
                        Dlongitude7 = '';
                        Dlatitude7 = '';
                        Dlongitude8 = '';
                        Dlatitude8 = '';
                        Dlongitude9 = '';
                        Dlatitude9 = '';
                        Dlongitude10 = '';
                        Dlatitude10 = '';
                        Dlongitude11 = '';
                        Dlatitude11 = '';
                        Dlongitude12 = '';
                        Dlatitude12 = '';
                        Dlongitude13 = '';
                        Dlatitude13 = '';
                        Dlongitude14 = '';
                        Dlatitude14 = '';
                        Dlongitude15 = '';
                        Dlatitude15 = '';
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    } else if (value == 4) {
                        Dlongitude5 = '';
                        Dlatitude5 = '';
                        Dlongitude6 = '';
                        Dlatitude6 = '';
                        Dlongitude7 = '';
                        Dlatitude7 = '';
                        Dlongitude8 = '';
                        Dlatitude8 = '';
                        Dlongitude9 = '';
                        Dlatitude9 = '';
                        Dlongitude10 = '';
                        Dlatitude10 = '';
                        Dlongitude11 = '';
                        Dlatitude11 = '';
                        Dlongitude12 = '';
                        Dlatitude12 = '';
                        Dlongitude13 = '';
                        Dlatitude13 = '';
                        Dlongitude14 = '';
                        Dlatitude14 = '';
                        Dlongitude15 = '';
                        Dlatitude15 = '';
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    } else if (value == 5) {
                        Dlongitude6 = '';
                        Dlatitude6 = '';
                        Dlongitude7 = '';
                        Dlatitude7 = '';
                        Dlongitude8 = '';
                        Dlatitude8 = '';
                        Dlongitude9 = '';
                        Dlatitude9 = '';
                        Dlongitude10 = '';
                        Dlatitude10 = '';
                        Dlongitude11 = '';
                        Dlatitude11 = '';
                        Dlongitude12 = '';
                        Dlatitude12 = '';
                        Dlongitude13 = '';
                        Dlatitude13 = '';
                        Dlongitude14 = '';
                        Dlatitude14 = '';
                        Dlongitude15 = '';
                        Dlatitude15 = '';
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    } else if (value == 6) {
                        Dlongitude7 = '';
                        Dlatitude7 = '';
                        Dlongitude8 = '';
                        Dlatitude8 = '';
                        Dlongitude9 = '';
                        Dlatitude9 = '';
                        Dlongitude10 = '';
                        Dlatitude10 = '';
                        Dlongitude11 = '';
                        Dlatitude11 = '';
                        Dlongitude12 = '';
                        Dlatitude12 = '';
                        Dlongitude13 = '';
                        Dlatitude13 = '';
                        Dlongitude14 = '';
                        Dlatitude14 = '';
                        Dlongitude15 = '';
                        Dlatitude15 = '';
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    } else if (value == 7) {
                        Dlongitude8 = '';
                        Dlatitude8 = '';
                        Dlongitude9 = '';
                        Dlatitude9 = '';
                        Dlongitude10 = '';
                        Dlatitude10 = '';
                        Dlongitude11 = '';
                        Dlatitude11 = '';
                        Dlongitude12 = '';
                        Dlatitude12 = '';
                        Dlongitude13 = '';
                        Dlatitude13 = '';
                        Dlongitude14 = '';
                        Dlatitude14 = '';
                        Dlongitude15 = '';
                        Dlatitude15 = '';
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    } else if (value == 8) {
                        Dlongitude9 = '';
                        Dlatitude9 = '';
                        Dlongitude10 = '';
                        Dlatitude10 = '';
                        Dlongitude11 = '';
                        Dlatitude11 = '';
                        Dlongitude12 = '';
                        Dlatitude12 = '';
                        Dlongitude13 = '';
                        Dlatitude13 = '';
                        Dlongitude14 = '';
                        Dlatitude14 = '';
                        Dlongitude15 = '';
                        Dlatitude15 = '';
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    } else if (value == 9) {
                        Dlongitude10 = '';
                        Dlatitude10 = '';
                        Dlongitude11 = '';
                        Dlatitude11 = '';
                        Dlongitude12 = '';
                        Dlatitude12 = '';
                        Dlongitude13 = '';
                        Dlatitude13 = '';
                        Dlongitude14 = '';
                        Dlatitude14 = '';
                        Dlongitude15 = '';
                        Dlatitude15 = '';
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    } else if (value == 10) {
                        Dlongitude11 = '';
                        Dlatitude11 = '';
                        Dlongitude12 = '';
                        Dlatitude12 = '';
                        Dlongitude13 = '';
                        Dlatitude13 = '';
                        Dlongitude14 = '';
                        Dlatitude14 = '';
                        Dlongitude15 = '';
                        Dlatitude15 = '';
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    } else if (value == 11) {
                        Dlongitude12 = '';
                        Dlatitude12 = '';
                        Dlongitude13 = '';
                        Dlatitude13 = '';
                        Dlongitude14 = '';
                        Dlatitude14 = '';
                        Dlongitude15 = '';
                        Dlatitude15 = '';
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    } else if (value == 12) {
                        Dlongitude13 = '';
                        Dlatitude13 = '';
                        Dlongitude14 = '';
                        Dlatitude14 = '';
                        Dlongitude15 = '';
                        Dlatitude15 = '';
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    } else if (value == 13) {
                        Dlongitude14 = '';
                        Dlatitude14 = '';
                        Dlongitude15 = '';
                        Dlatitude15 = '';
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    } else if (value == 14) {
                        Dlongitude15 = '';
                        Dlatitude15 = '';
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    } else if (value == 15) {
                        Dlongitude16 = '';
                        Dlatitude16 = '';
                    }
                }

                numberOfWaypoints = value;
                $("input[name='longitude1']").val(Dlongitude1);
                $("input[name='longitude2']").val(Dlongitude2);
                $("input[name='longitude3']").val(Dlongitude3);
                $("input[name='longitude4']").val(Dlongitude4);
                $("input[name='longitude5']").val(Dlongitude5);
                $("input[name='longitude6']").val(Dlongitude6);
                $("input[name='longitude7']").val(Dlongitude7);
                $("input[name='longitude8']").val(Dlongitude8);
                $("input[name='longitude9']").val(Dlongitude9);
                $("input[name='longitude10']").val(Dlongitude10);
                $("input[name='longitude11']").val(Dlongitude11);
                $("input[name='longitude12']").val(Dlongitude12);
                $("input[name='longitude13']").val(Dlongitude13);
                $("input[name='longitude14']").val(Dlongitude14);
                $("input[name='longitude15']").val(Dlongitude15);
                $("input[name='longitude16']").val(Dlongitude16);
                $("input[name='latitude1']").val(Dlatitude1);
                $("input[name='latitude2']").val(Dlatitude2);
                $("input[name='latitude3']").val(Dlatitude3);
                $("input[name='latitude4']").val(Dlatitude4);
                $("input[name='latitude5']").val(Dlatitude5);
                $("input[name='latitude6']").val(Dlatitude6);
                $("input[name='latitude7']").val(Dlatitude7);
                $("input[name='latitude8']").val(Dlatitude8);
                $("input[name='latitude9']").val(Dlatitude9);
                $("input[name='latitude10']").val(Dlatitude10);
                $("input[name='latitude11']").val(Dlatitude11);
                $("input[name='latitude12']").val(Dlatitude12);
                $("input[name='latitude13']").val(Dlatitude13);
                $("input[name='latitude14']").val(Dlatitude14);
                $("input[name='latitude15']").val(Dlatitude15);
                $("input[name='latitude16']").val(Dlatitude16);
            } else {
                $(this).val(numberOfWaypoints);
                layer.msg('取值范围为1~16', {icon: 2, time: config.msgTime});
            }
        }
    })

    $(document).on('input propertychange', "input[name^='longitude'][name!='longitude']", function () {
        if ($(this)[0].name == 'longitude1') {
            Dlongitude1 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude2') {
            Dlongitude2 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude3') {
            Dlongitude3 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude4') {
            Dlongitude4 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude5') {
            Dlongitude5 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude6') {
            Dlongitude6 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude7') {
            Dlongitude7 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude8') {
            Dlongitude8 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude9') {
            Dlongitude9 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude10') {
            Dlongitude10 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude11') {
            Dlongitude11 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude12') {
            Dlongitude12 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude13') {
            Dlongitude13 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude14') {
            Dlongitude14 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude15') {
            Dlongitude15 = $(this)[0].value;
        } else if ($(this)[0].name == 'longitude16') {
            Dlongitude16 = $(this)[0].value;
        }
    })
    $(document).on('input propertychange', "input[name^='latitude'][name!='latitude']", function () {
        if ($(this)[0].name == 'latitude1') {
            Dlatitude1 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude2') {
            Dlatitude2 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude3') {
            Dlatitude3 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude4') {
            Dlatitude4 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude5') {
            Dlatitude5 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude6') {
            Dlatitude6 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude7') {
            Dlatitude7 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude8') {
            Dlatitude8 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude9') {
            Dlatitude9 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude10') {
            Dlatitude10 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude11') {
            Dlatitude11 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude12') {
            Dlatitude12 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude13') {
            Dlatitude13 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude14') {
            Dlatitude14 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude15') {
            Dlatitude15 = $(this)[0].value;
        } else if ($(this)[0].name == 'latitude16') {
            Dlatitude16 = $(this)[0].value;
        }
    })

    function deleteShipLayer(str) {
        switch (str) {
            case "circularDomainPointShip"://0:原型
                deleteSubAreas("0");
                $("#" + str).remove();
                roundFlageShip = true;
                break;
            case 'rectangularDomainShip'://1
                deleteSubAreas("1");
                $("#" + str).remove();
                rectangularShip = true;
                break;
            case "fanDomainShip"://2
                deleteSubAreas("2");
                $("#" + str).remove();
                fanFlageShip = true;
                break;
            case 'linePointShip'://3
                deleteSubAreas("3");
                $("#" + str).remove();
                brokenLineShip = true;
                break;
            case "polygonDomainShip"://4
                deleteSubAreas("4");
                $("#" + str).remove();
                polygonFlageShip = true;
                break;
            case 'associatedTextShip'://5
                deleteSubAreas("5");
                $("#" + str).remove();
                textFlageShip = true;
                break;
        }

    }

    function deleteSubAreas(areaShape) {
        for (let i in subAreas) {
            if (subAreas[i].areaShape == areaShape) {
                subAreas.splice(i, 1);
            }
        }
    }

    //消息广播
    function messageBroadcastSend(param) {
        clearInterval(shipInterval);
        clearInterval(stationInterval);
        clearInterval(atonInterval);
        clearInterval(fishingNetInterval);
        admin.req('messageBroadcast-api/messageBroadcast', JSON.stringify(param), function (res) {
            if (res.code == 0) {
                layer.msg("发送成功！", {icon: 1, time: config.msgTime});
                closeSendLayer();
            } else {
                layer.msg('发送失败！', {icon: 2, time: config.msgTime});
            }
            getShipData();
            getStationData();
            getAtonData();
            getFishingNetData();

            // 十秒定时刷新船舶数据
            shipInterval = window.setInterval(getShipData, 30000);
            // 五分钟定时刷新岸站数据
            stationInterval = window.setInterval(getStationData, 300000);
            // 一分钟定时刷新助航设备数据
            atonInterval = window.setInterval(getAtonData, 30000);
            // 一分钟定时刷新网位仪数据
            //fishingNetInterval = window.setInterval(getFishingNetData, 60000);
        }, 'POST');
    }

    //B.1水文气象数据广播
    form.on('submit(formDemo1)', function (data) {
        // if (!oneShoreSendMessage && (longitude1 == '' || latitude1 == '' || longitude2 == '' || latitude2 == '')) {
        //     layer.msg('请选择区域！', {icon: 2, time: config.msgTime});
        //     return;
        // }
        var shoreMmsi = $("#station_MMSI").val();
        messageData = {
            messageId: 8,//消息ID，默认 8
            forwardIndicator: 0,//转发指示符，默认0
            sourceMmsi: '',//源MMSI
            idle: 0,//空闲，默认0
            dac: 1,//DAC，默认1
            fi: 31,//FI，默认31
            longitude: data.field.longitude == '' ? 10860000 : Math.round(Number(data.field.longitude) * 600000),//经度
            latitude: data.field.latitude == '' ? 5460000 : Math.round(Number(data.field.latitude) * 600000),//纬度
            positionAccuracy: Number(data.field.positionAccuracy),//位置精度
            utcDay: data.field.utcDay == '' ? 0 : Number(data.field.utcDay),//实时时间UTC时间的日期(5bit)
            utcHour: data.field.utcHour == '' ? 24 : Number(data.field.utcHour),//实时时间UTC时间的小时(5bit)
            utcMinute: data.field.utcMinute == '' ? 60 : Number(data.field.utcMinute),//实时时间UTC时间的分钟(6bit)
            averageWindSpeed: data.field.averageWindSpeed == '' ? 127 : Number(data.field.averageWindSpeed),//平均风速(7bit)
            windGust: data.field.windGust == '' ? 127 : Number(data.field.windGust),//阵风(7bit)
            windDirection: data.field.windDirection == '' ? 360 : Number(data.field.windDirection),//风向(9bit)
            windGustDirection: data.field.windGustDirection == '' ? 360 : Number(data.field.windGustDirection),//阵风方向(9bit)
            airTemperature: data.field.airTemperature == '' ? -1024 : Number(data.field.airTemperature),//气温(11bit)
            relativeHumidity: data.field.relativeHumidity == '' ? 101 : Number(data.field.relativeHumidity),//相对湿度(7bit)
            dewPoint: data.field.dewPoint == '' ? 501 : Number(data.field.dewPoint),//露点(10bit)
            airPressure: data.field.airPressure == '' ? 511 : Number(data.field.airPressure),//气压(9bit)
            airPressureTendency: Number(data.field.airPressureTendency),//气压趋势(2bit)
            horizontalVisibility: data.field.horizontalVisibility == '' ? 127 : Number(data.field.horizontalVisibility),//水平能见度(8bit)
            waterLevel: data.field.waterLevel == '' ? 4001 : Number(data.field.waterLevel),//水位（含潮汐）(12bit)
            waterLevelTrend: Number(data.field.waterLevelTrend),//水位趋势(2bit)
            surfaceCurrentSpeed: data.field.surfaceCurrentSpeed == '' ? 255 : Number(data.field.surfaceCurrentSpeed),//表面流速（含潮汐）(8bit)
            surfaceCurrentDirection: data.field.surfaceCurrentDirection == '' ? 360 : Number(data.field.surfaceCurrentDirection),//表面流速方向(9bit)
            currentSpeed2: data.field.currentSpeed2 == '' ? 255 : Number(data.field.currentSpeed2),//流速#2(8bit)
            currentDirection2: data.field.currentDirection2 == '' ? 360 : Number(data.field.currentDirection2),//流速方向#2(9bit)
            currentMeasuringLevel2: data.field.currentMeasuringLevel2 == '' ? 31 : Number(data.field.currentMeasuringLevel2),//测流深度#2(5bit)
            currentSpeed3: data.field.currentSpeed3 == '' ? 255 : Number(data.field.currentSpeed3),//流速#3(8bit)
            currentDirection3: data.field.currentDirection3 == '' ? 360 : Number(data.field.currentDirection3),//流速方向#3(9bit)
            currentMeasuringLevel3: data.field.currentMeasuringLevel3 == '' ? 31 : Number(data.field.currentMeasuringLevel3),//测流深度#3(5bit)
            significantWaveHeight: data.field.significantWaveHeight == '' ? 255 : Number(data.field.significantWaveHeight),//标识波高(8bit)
            wavePeriod: data.field.wavePeriod == '' ? 63 : Number(data.field.wavePeriod),//波浪周期(6bit)
            waveDirection: data.field.waveDirection == '' ? 360 : Number(data.field.waveDirection),//波浪方向(9bit)
            swellHeight: data.field.swellHeight == '' ? 251 : Number(data.field.swellHeight),//大浪高度(8bit)
            swellPeriod: data.field.swellHeight == '' ? 63 : Number(data.field.swellPeriod),//大浪周期(6bit)
            swellDirection: data.field.waveDirection == '' ? 360 : Number(data.field.swellDirection),//大浪方向(9bit)
            seaState: Number(data.field.seaState),//海况(4bit)
            waterTemperature: data.field.waterTemperature == '' ? 501 : Number(data.field.waterTemperature),//水温(10bit)
            precipitation: Number(data.field.precipitation),//降水量（级别）(3bit)
            salinity: data.field.salinity == '' ? 510 : Number(data.field.salinity),//盐份(9bit)
            ice: Number(data.field.ice), //结冰(2bit)

        };

        contentData = {
            messageId: 0,
            encodeMethod: '',
            channel: '',
            asmIdentifier: '',
            targetMMSI: '',//目的mmsi
            longitude1: Math.round(Number(longitude1) * 600000),//东北角经度
            latitude1: Math.round(Number(latitude1) * 600000),//东北角纬度
            longitude2: Math.round(Number(longitude2) * 600000),//西南角经度
            latitude2: Math.round(Number(latitude2) * 600000),//西南角纬度
            groupId: '',
            data: '',
            messageInfo: messageData,
            messageInfoType: 1,
        }
        var params = {};
        params.shoreMmsi = shoreMmsi;
        params.messageType = 2;
        params.interfaceName = 2;
        params.data = JSON.stringify(contentData);
        //params.sendTime = common.dateFormat(new Date(), 'yyyyMMddhhmmss');
        params.messageInfoType = 1;
        //	params.userId = localStorage.getItem(common.userIdKey);
        if (!oneShoreSendMessage) {
            params.area = {
                northeast: {
                    lat: latitude1,
                    lng: longitude1
                },
                southwest: {
                    lat: latitude2,
                    lng: longitude2
                }
            }
        }
        messageBroadcastSend(params);
    })

    //B.8海上交通信号广播
    form.on('submit(formDemo8)', function (data) {
        // if (!oneShoreSendMessage && (longitude1 == '' || latitude1 == '' || longitude2 == '' || latitude2 == '')) {
        //     layer.msg('请选择区域！', {icon: 2, time: config.msgTime});
        //     return;
        // }
        var shoreMmsi = $("#station_MMSI").val();
        messageData = {
            messageId: 8,//消息ID，默认 8
            forwardIndicator: 0,//转发指示符，默认0
            sourceMmsi: '',//源MMSI
            idle: 0,//空闲，默认0
            dac: 1,//DAC，默认1
            fi: 19,//FI，默认19
            messageLinkageID: data.field.messageLinkageID == '' ? 0 : Number(data.field.messageLinkageID),//消息链接ID(10bit)
            nameOfSignalStation: data.field.nameOfSignalStation == '' ? "@@@@@@@@@@@@@@@@@@@@" : data.field.nameOfSignalStation,//信号站名称(120bit)
            positionOfStationLongitude: data.field.positionOfStationLongitude == '' ? 10860000 : Math.round(Number(data.field.positionOfStationLongitude) * 600000),//站点位置：经度(25bit)
            positionOfStationLatitude: data.field.positionOfStationLatitude == '' ? 5460000 : Math.round(Number(data.field.positionOfStationLatitude) * 600000),//站点位置：纬度(24bit)
            statusOfSignal: Number(data.field.statusOfSignal),//信号状态(2bit)
            signalInService: Number(data.field.signalInService),//在服务信号(5bit)
            utcHour: data.field.utcHour == '' ? 24 : Number(data.field.utcHour),//下一个信号切换UTC时间：小时(5bit)
            utcMinute: data.field.utcMinute == '' ? 60 : Number(data.field.utcMinute),//下一个信号切换UTC时间：分钟(6bit)
            expectedNextSignal: Number(data.field.expectedNextSignal),//预期的下一个信号(5bit)
        };
        contentData = {
            messageId: 0,
            encodeMethod: '',
            channel: '',
            asmIdentifier: '',
            targetMMSI: '',//目的mmsi
            longitude1: Math.round(Number(longitude1) * 600000),//东北角经度
            latitude1: Math.round(Number(latitude1) * 600000),//东北角纬度
            longitude2: Math.round(Number(longitude2) * 600000),//西南角经度
            latitude2: Math.round(Number(latitude2) * 600000),//西南角纬度
            groupId: '',
            data: '',
            messageInfo: messageData,
            messageInfoType: 8,
        }
        var params = {};
        params.shoreMmsi = shoreMmsi;
        params.messageType = 2;
        params.interfaceName = 2;
        params.data = JSON.stringify(contentData);
        // params.sendTime = common.dateFormat(new Date(), 'yyyyMMddhhmmss');
        params.messageInfoType = 8;
        //	params.userId = localStorage.getItem(common.userIdKey);
        if (!oneShoreSendMessage) {
            params.area = {
                northeast: {
                    lat: latitude1,
                    lng: longitude1
                },
                southwest: {
                    lat: latitude2,
                    lng: longitude2
                }
            }
        }
        messageBroadcastSend(params);
    })

    //B.11区域通告广播
    form.on('submit(formDemo11)', function (data) {
        // if (!oneShoreSendMessage && (longitude1 == '' || latitude1 == '' || longitude2 == '' || latitude2 == '')) {
        //     layer.msg('请选择区域！', {icon: 2, time: config.msgTime});
        //     return;
        // }
        if (data.field.noticeDescription == '127' && roundFlage && rectangular && fanFlage && brokenLine && polygonFlage && textFlage) {
            layer.msg('请添加域点信息！', {icon: 2, time: config.msgTime});
            return;
        }

        var shoreMmsi = $("#station_MMSI").val();
        if (brokenLine == false || polygonFlage == false) {
            if (roundFlage) {
                parent.layer.msg('子区域包含折线或者多边形时，请点击添加按钮添加圆形域点信息', {icon: 2, time: config.msgTime});
                return false;
            }
        }
        for (let i in subAreas) {
            for (let pro in subAreas[i]) {
                if ($("#" + pro + "-" + subAreas[i]['areaShape']).val() == '') {
                    if (pro == 'scaleFactor') {
                        subAreas[i][pro] = 1;
                    } else if (pro == 'longitude') {
                        subAreas[i][pro] = 10860000;
                    } else if (pro == 'latitude') {
                        subAreas[i][pro] = 5460000;
                    } else if (pro == 'precision') {
                        subAreas[i][pro] = 4;
                    } else if (pro == 'pointAngle1' || pro == 'pointAngle2' || pro == 'pointAngle3' || pro == 'pointAngle4') {
                        subAreas[i][pro] = 720;
                    } else {
                        subAreas[i][pro] = 0;
                    }
                } else {
                    subAreas[i][pro] = $("#" + pro + "-" + subAreas[i]['areaShape']).val();
                }
            }
            if (subAreas[i].areaShape == 0) {
                subAreas[i].dimensionE = null;
                subAreas[i].dimensionN = null;
                subAreas[i].orientation = null;
                subAreas[i].leftBoundary = null;
                subAreas[i].rightBoundary = null;
                subAreas[i].pointAngle1 = null;
                subAreas[i].pointDistance1 = null;
                subAreas[i].pointAngle2 = null;
                subAreas[i].pointDistance2 = null;
                subAreas[i].pointAngle3 = null;
                subAreas[i].pointDistance3 = null;
                subAreas[i].pointAngle4 = null;
                subAreas[i].pointDistance4 = null;
                subAreas[i].text = '';
            } else if (subAreas[i].areaShape == 1) {
                subAreas[i].radius = null;
                subAreas[i].leftBoundary = null;
                subAreas[i].rightBoundary = null;
                subAreas[i].pointAngle1 = null;
                subAreas[i].pointDistance1 = null;
                subAreas[i].pointAngle2 = null;
                subAreas[i].pointDistance2 = null;
                subAreas[i].pointAngle3 = null;
                subAreas[i].pointDistance3 = null;
                subAreas[i].pointAngle4 = null;
                subAreas[i].pointDistance4 = null;
                subAreas[i].text = '';
            } else if (subAreas[i].areaShape == 2) {
                subAreas[i].dimensionE = null;
                subAreas[i].dimensionN = null;
                subAreas[i].orientation = null;
                subAreas[i].pointAngle1 = null;
                subAreas[i].pointDistance1 = null;
                subAreas[i].pointAngle2 = null;
                subAreas[i].pointDistance2 = null;
                subAreas[i].pointAngle3 = null;
                subAreas[i].pointDistance3 = null;
                subAreas[i].pointAngle4 = null;
                subAreas[i].pointDistance4 = null;
                subAreas[i].text = '';
            } else if (subAreas[i].areaShape == 3) {
                subAreas[i].longitude = null;
                subAreas[i].latitude = null;
                subAreas[i].precision = null;
                subAreas[i].radius = null;
                subAreas[i].dimensionE = null;
                subAreas[i].dimensionN = null;
                subAreas[i].orientation = null;
                subAreas[i].leftBoundary = null;
                subAreas[i].rightBoundary = null;
                subAreas[i].text = '';
            } else if (subAreas[i].areaShape == 4) {
                subAreas[i].longitude = null;
                subAreas[i].latitude = null;
                subAreas[i].precision = null;
                subAreas[i].radius = null;
                subAreas[i].dimensionE = null;
                subAreas[i].dimensionN = null;
                subAreas[i].orientation = null;
                subAreas[i].leftBoundary = null;
                subAreas[i].rightBoundary = null;
                subAreas[i].text = '';
            } else if (subAreas[i].areaShape == 5) {
                subAreas[i].scaleFactor = null;
                subAreas[i].longitude = null;
                subAreas[i].latitude = null;
                subAreas[i].precision = null;
                subAreas[i].radius = null;
                subAreas[i].dimensionE = null;
                subAreas[i].dimensionN = null;
                subAreas[i].orientation = null;
                subAreas[i].leftBoundary = null;
                subAreas[i].rightBoundary = null;
                subAreas[i].pointAngle1 = null;
                subAreas[i].pointDistance1 = null;
                subAreas[i].pointAngle2 = null;
                subAreas[i].pointDistance2 = null;
                subAreas[i].pointAngle3 = null;
                subAreas[i].pointDistance3 = null;
                subAreas[i].pointAngle4 = null;
                subAreas[i].pointDistance4 = null;
            }
        }
        messageData = {
            messageId: 8,//消息id 默认8
            forwardIndicator: 0,//转发指示符，默认0
            sourceMmsi: '',//源MMSI
            idle: 0,//空闲，默认0
            dac: 1,//DAC，默认1
            fi: 22,//FI，默认22
            messageLinkageID: Number(data.field.messageLinkageID),//消息链接ID(10bit)
            noticeDescription: Number(data.field.noticeDescription),//公告说明(7bit)
            utcMonth: data.field.utcMonth == '' ? 0 : Number(data.field.utcMonth),//区域公告起始UTC时间：月(4bit)
            utcDay: data.field.utcDay == '' ? 0 : Number(data.field.utcDay),//区域公告起始UTC时间：日(5bit)
            utcHour: data.field.utcHour == '' ? 24 : Number(data.field.utcHour),//区域公告起始UTC时间：时(5bit)
            utcMinute: data.field.utcMinute == '' ? 60 : Number(data.field.utcMinute),//区域公告起始UTC时间：分(6bit)
            duration: data.field.duration == '' ? 262143 : Number(data.field.duration),//公告持续时间(18bit)
            subAreas: subAreas,
        };
        contentData = {
            messageId: 0,//消息ID，取值范围为0-3，分别对应广播消息、寻址消息、区域多播消息、组播消息。
            encodeMethod: '',
            channel: '',
            asmIdentifier: '',
            targetMMSI: '',//目的mmsi
            longitude1: Math.round(Number(longitude1) * 600000),//东北角经度
            latitude1: Math.round(Number(latitude1) * 600000),//东北角纬度
            longitude2: Math.round(Number(longitude2) * 600000),//西南角经度
            latitude2: Math.round(Number(latitude2) * 600000),//西南角纬度
            groupId: '',
            data: '',
            messageInfo: messageData,
            messageInfoType: 11,//报文内容对应类型
        }
        contentData.messageId = 0;
        var params = {};
        params.shoreMmsi = shoreMmsi;
        params.messageType = 2;
        params.interfaceName = 2;
        params.data = JSON.stringify(contentData);
        //params.sendTime = common.dateFormat(new Date(), 'yyyyMMddhhmmss');
        params.messageInfoType = 11;
        //params.userId = localStorage.getItem(common.userIdKey);
        if (!oneShoreSendMessage) {
            params.area = {
                northeast: {
                    lat: latitude1,
                    lng: longitude1
                },
                southwest: {
                    lat: latitude2,
                    lng: longitude2
                }
            }
        }
        messageBroadcastSend(params);
    })

    //B.11区域通告寻址
    form.on('submit(formDemo20)', function (data) {
        if (data.field.noticeDescription == '127' && roundFlageShip && rectangularShip && fanFlageShip && brokenLineShip && polygonFlageShip && textFlageShip) {
            layer.msg('请添加域点信息！', {icon: 2, time: config.msgTime});
            return;
        }
        if (brokenLineShip == false || polygonFlageShip == false) {
            if (roundFlageShip) {
                parent.layer.msg('子区域包含折线或者多边形时，请点击添加按钮添加圆形域点信息', {icon: 2, time: config.msgTime});
                return false;
            }
        }
        for (let i in subAreas) {
            for (let pro in subAreas[i]) {
                if ($("#" + pro + "-" + subAreas[i]['areaShape']).val() == '') {
                    if (pro == 'scaleFactor') {
                        subAreas[i][pro] = 1;
                    } else if (pro == 'longitude') {
                        subAreas[i][pro] = 10860000;
                    } else if (pro == 'latitude') {
                        subAreas[i][pro] = 5460000;
                    } else if (pro == 'precision') {
                        subAreas[i][pro] = 4;
                    } else if (pro == 'pointAngle1' || pro == 'pointAngle2' || pro == 'pointAngle3' || pro == 'pointAngle4') {
                        subAreas[i][pro] = 720;
                    } else {
                        subAreas[i][pro] = 0;
                    }
                } else {
                    subAreas[i][pro] = Number($("#" + pro + "-" + subAreas[i]['areaShape']).val());
                }
            }
            if (subAreas[i].areaShape == 0) {
                subAreas[i].dimensionE = null;
                subAreas[i].dimensionN = null;
                subAreas[i].orientation = null;
                subAreas[i].leftBoundary = null;
                subAreas[i].rightBoundary = null;
                subAreas[i].pointAngle1 = null;
                subAreas[i].pointDistance1 = null;
                subAreas[i].pointAngle2 = null;
                subAreas[i].pointDistance2 = null;
                subAreas[i].pointAngle3 = null;
                subAreas[i].pointDistance3 = null;
                subAreas[i].pointAngle4 = null;
                subAreas[i].pointDistance4 = null;
                subAreas[i].text = '';
            } else if (subAreas[i].areaShape == 1) {
                subAreas[i].radius = null;
                subAreas[i].leftBoundary = null;
                subAreas[i].rightBoundary = null;
                subAreas[i].pointAngle1 = null;
                subAreas[i].pointDistance1 = null;
                subAreas[i].pointAngle2 = null;
                subAreas[i].pointDistance2 = null;
                subAreas[i].pointAngle3 = null;
                subAreas[i].pointDistance3 = null;
                subAreas[i].pointAngle4 = null;
                subAreas[i].pointDistance4 = null;
                subAreas[i].text = '';
            } else if (subAreas[i].areaShape == 2) {
                subAreas[i].dimensionE = null;
                subAreas[i].dimensionN = null;
                subAreas[i].orientation = null;
                subAreas[i].pointAngle1 = null;
                subAreas[i].pointDistance1 = null;
                subAreas[i].pointAngle2 = null;
                subAreas[i].pointDistance2 = null;
                subAreas[i].pointAngle3 = null;
                subAreas[i].pointDistance3 = null;
                subAreas[i].pointAngle4 = null;
                subAreas[i].pointDistance4 = null;
                subAreas[i].text = '';
            } else if (subAreas[i].areaShape == 3) {
                subAreas[i].longitude = null;
                subAreas[i].latitude = null;
                subAreas[i].precision = null;
                subAreas[i].radius = null;
                subAreas[i].dimensionE = null;
                subAreas[i].dimensionN = null;
                subAreas[i].orientation = null;
                subAreas[i].leftBoundary = null;
                subAreas[i].rightBoundary = null;
                subAreas[i].text = '';
            } else if (subAreas[i].areaShape == 4) {
                subAreas[i].longitude = null;
                subAreas[i].latitude = null;
                subAreas[i].precision = null;
                subAreas[i].radius = null;
                subAreas[i].dimensionE = null;
                subAreas[i].dimensionN = null;
                subAreas[i].orientation = null;
                subAreas[i].leftBoundary = null;
                subAreas[i].rightBoundary = null;
                subAreas[i].text = '';
            } else if (subAreas[i].areaShape == 5) {
                subAreas[i].scaleFactor = null;
                subAreas[i].longitude = null;
                subAreas[i].latitude = null;
                subAreas[i].precision = null;
                subAreas[i].radius = null;
                subAreas[i].dimensionE = null;
                subAreas[i].dimensionN = null;
                subAreas[i].orientation = null;
                subAreas[i].leftBoundary = null;
                subAreas[i].rightBoundary = null;
                subAreas[i].pointAngle1 = null;
                subAreas[i].pointDistance1 = null;
                subAreas[i].pointAngle2 = null;
                subAreas[i].pointDistance2 = null;
                subAreas[i].pointAngle3 = null;
                subAreas[i].pointDistance3 = null;
                subAreas[i].pointAngle4 = null;
                subAreas[i].pointDistance4 = null;
            }
        }

        messageData = {
            messageId: 8,//消息id 默认8
            forwardIndicator: 0,//转发指示符，默认0
            sourceMmsi: 0,//源MMSI
            idle: 0,//空闲，默认0
            dac: 1,//DAC，默认1
            fi: 22,//FI，默认22
            messageLinkageID: Number(data.field.messageLinkageID),//消息链接ID(10bit)
            noticeDescription: Number(data.field.noticeDescription),//公告说明(7bit)
            utcMonth: data.field.utcMonth == '' ? 0 : Number(data.field.utcMonth),//区域公告起始UTC时间：月(4bit)
            utcDay: data.field.utcDay == '' ? 0 : Number(data.field.utcDay),//区域公告起始UTC时间：日(5bit)
            utcHour: data.field.utcHour == '' ? 24 : Number(data.field.utcHour),//区域公告起始UTC时间：时(5bit)
            utcMinute: data.field.utcMinute == '' ? 60 : Number(data.field.utcMinute),//区域公告起始UTC时间：分(6bit)
            duration: data.field.duration == '' ? 262143 : Number(data.field.duration),//公告持续时间(18bit)
            subAreas: subAreas,
        };
        contentData = {
            messageId: 0,//消息ID，取值范围为0-3，分别对应广播消息、寻址消息、区域多播消息、组播消息。
            encodeMethod: '',
            channel: '',
            asmIdentifier: '',
            targetMMSI: '',//目的mmsi
            longitude1: null,//东北角经度
            latitude1: null,//东北角纬度
            longitude2: null,//西南角经度
            latitude2: null,//西南角纬度
            groupId: '',
            data: '',
            messageInfo: messageData,
            messageInfoType: 11,//报文内容对应类型
        }
        var ship_MMSI = $("#ship_MMSI").val();
        contentData.targetMMSI = Number(ship_MMSI);
        contentData.messageId = 1;
        var params = {};
        params.shoreMmsi = $("#shore_MMSI").val();
        params.messageType = 2;
        params.interfaceName = 2;
        params.data = JSON.stringify(contentData);
        params.messageInfoType = 11;
        //接口路径
        messageBroadcastSend(params);
    })

    //B.13	航路信息广播
    form.on('submit(formDemo13)', function (data) {
        // if (!oneShoreSendMessage && (longitude1 == '' || latitude1 == '' || longitude2 == '' || latitude2 == '')) {
        //     layer.msg('请选择区域！', {icon: 2, time: config.msgTime});
        //     return;
        // }
        var shoreMmsi = $("#station_MMSI").val();
        messageData = {
            messageId: 8,//消息id 默认8
            forwardIndicator: 0,//转发指示符，默认0
            sourceMmsi: '',//源MMSI
            idle: 0,//空闲，默认0
            dac: 1,//DAC，默认1
            fi: 27,//FI，默认27
            messageLinkageID: Number(data.field.messageLinkageID),//消息链接ID(10bit)

            senderClassification: data.field.senderClassification == '' ? 0 : Number(data.field.senderClassification),//发送者分类(3bit)
            routeType: Number(data.field.routeType),//航线类型(5bit)
            utcMonth: data.field.utcMonth == '' ? 0 : Number(data.field.utcMonth),//开始时间日期的UTC月(4bit)
            utcDay: data.field.utcDay == '' ? 0 : Number(data.field.utcDay),//开始时间日期的UTC日(5bit)
            utcHour: data.field.utcHour == '' ? 24 : Number(data.field.utcHour),//开始时间日期的UTC时(5bit)
            utcMinute: data.field.utcMinute == '' ? 60 : Number(data.field.utcMinute),//开始时间日期的UTC分钟(6bit)
            duration: data.field.duration == '' ? 262143 : Number(data.field.duration),//持续时间(18bit)
            numberOfWaypoints: data.field.numberOfWaypoints == '' ? 0 : Number(data.field.numberOfWaypoints),//航路点数量(5bit)
            waypoints: [//航路点(n*55bit)
                // { latitude: Math.round(Number(data.field.latitude1)*600000), longitude: Math.round(Number(data.field.longitude1)*600000)}
                // { latitude: Math.round(Number(data.field.latitude2)*600000), longitude: Math.round(Number(data.field.longitude2)*600000) },
                // { latitude: Math.round(Number(data.field.latitude3)*600000), longitude: Math.round(Number(data.field.longitude3)*600000) },
                // { latitude: Math.round(Number(data.field.latitude4)*600000), longitude: Math.round(Number(data.field.longitude4)*600000) },
                // { latitude: Math.round(Number(data.field.latitude5)*600000), longitude: Math.round(Number(data.field.longitude5)*600000) },
                // { latitude: Math.round(Number(data.field.latitude6)*600000), longitude: Math.round(Number(data.field.longitude6)*600000) },
                // { latitude: Math.round(Number(data.field.latitude7)*600000), longitude: Math.round(Number(data.field.longitude7)*600000) },
                // { latitude: Math.round(Number(data.field.latitude8)*600000), longitude: Math.round(Number(data.field.longitude8)*600000) },
                // { latitude: Math.round(Number(data.field.latitude9)*600000), longitude: Math.round(Number(data.field.longitude9)*600000) },
                // { latitude: Math.round(Number(data.field.latitude10)*600000), longitude: Math.round(Number(data.field.longitude10)*600000) },
                // { latitude: Math.round(Number(data.field.latitude11)*600000), longitude: Math.round(Number(data.field.longitude11)*600000) },
                // { latitude: Math.round(Number(data.field.latitude12)*600000), longitude: Math.round(Number(data.field.longitude12)*600000) },
                // { latitude: Math.round(Number(data.field.latitude13)*600000), longitude: Math.round(Number(data.field.longitude13)*600000) },
                // { latitude: Math.round(Number(data.field.latitude14)*600000), longitude: Math.round(Number(data.field.longitude14)*600000) },
                // { latitude: Math.round(Number(data.field.latitude15)*600000), longitude: Math.round(Number(data.field.longitude15)*600000) },
                // { latitude: Math.round(Number(data.field.latitude16)*600000), longitude: Math.round(Number(data.field.longitude16)*600000) }
            ],
        };
        if (numberOfWaypoints != '' && numberOfWaypoints > 1) {
            for (var i = 1; i <= numberOfWaypoints; i++) {
                var wayLng = $("input[name='longitude" + i + "']").val() == '' ? 108600000 : Math.round(Number($("input[name='longitude" + i + "']").val()) * 600000);
                var wayLat = $("input[name='latitude" + i + "']").val() == '' ? 54600000 : Math.round(Number($("input[name='latitude" + i + "']").val()) * 600000);
                messageData.waypoints.push({latitude: wayLat, longitude: wayLng})
            }
        }
        contentData = {
            messageId: 0,//消息ID，取值范围为0-3，分别对应广播消息、寻址消息、区域多播消息、组播消息。
            encodeMethod: '',
            channel: '',
            asmIdentifier: '',
            targetMMSI: '',//目的mmsi
            longitude1: Math.round(Number(longitude1) * 600000),//东北角经度
            latitude1: Math.round(Number(latitude1) * 600000),//东北角纬度
            longitude2: Math.round(Number(longitude2) * 600000),//西南角经度
            latitude2: Math.round(Number(latitude2) * 600000),//西南角纬度
            groupId: '',
            data: '',
            messageInfo: messageData,
            messageInfoType: 13,//报文内容对应类型
        }
        contentData.messageId = 0;
        var params = {};
        params.shoreMmsi = shoreMmsi;
        params.messageType = 2;
        params.interfaceName = 2;
        params.data = JSON.stringify(contentData);
        params.messageInfoType = 13;
        if (!oneShoreSendMessage) {
            params.area = {
                northeast: {
                    lat: latitude1,
                    lng: longitude1
                },
                southwest: {
                    lat: latitude2,
                    lng: longitude2
                }
            }
        }
        //接口路径
        messageBroadcastSend(params);
    })

    //B.14	文本描述广播
    form.on('submit(formDemo14)', function (data) {
        // if (!oneShoreSendMessage && (longitude1 == '' || latitude1 == '' || longitude2 == '' || latitude2 == '')) {
        //     layer.msg('请选择区域！', {icon: 2, time: config.msgTime});
        //     return;
        // }
        var shoreMmsi = $("#station_MMSI").val();
        messageData = {
            messageId: 8,//消息id 默认8
            forwardIndicator: 0,//转发指示符，默认0
            sourceMmsi: '',//源MMSI
            idle: 0,//空闲，默认0
            dac: 1,//DAC，默认1
            fi: 29,//FI，默认29
            messageLinkageID: data.field.messageLinkageID == '' ? 0 : Number(data.field.messageLinkageID),//消息链接ID(10bit)
            textString: data.field.textString,//文本字符串(6~966bit)
        };
        contentData = {
            messageId: 0,//消息ID，取值范围为0-3，分别对应广播消息、寻址消息、区域多播消息、组播消息。
            encodeMethod: '',
            channel: '',
            asmIdentifier: '',
            targetMMSI: '',//目的mmsi
            longitude1: Math.round(Number(longitude1) * 600000),//东北角经度
            latitude1: Math.round(Number(latitude1) * 600000),//东北角纬度
            longitude2: Math.round(Number(longitude2) * 600000),//西南角经度
            latitude2: Math.round(Number(latitude2) * 600000),//西南角纬度
            groupId: '',
            data: '',
            messageInfo: messageData,
            messageInfoType: 14,//报文内容对应类型
        }
        contentData.messageId = 0;
        var params = {};
        params.shoreMmsi = shoreMmsi;
        params.messageType = 2;
        params.interfaceName = 2;
        params.data = JSON.stringify(contentData);
        params.messageInfoType = 14;
        if (!oneShoreSendMessage) {
            params.area = {
                northeast: {
                    lat: latitude1,
                    lng: longitude1
                },
                southwest: {
                    lat: latitude2,
                    lng: longitude2
                }
            }
        }
        //接口路径
        messageBroadcastSend(params);
    })

    //B.13	航路信息寻址
    form.on('submit(formDemo21)', function (data) {
        messageData = {
            messageId: 8,//消息id 默认8
            forwardIndicator: 0,//转发指示符，默认0
            sourceMmsi: 0,//源MMSI
            idle: 0,//空闲，默认0
            dac: 1,//DAC，默认1
            fi: 27,//FI，默认27
            messageLinkageID: Number(data.field.messageLinkageID),//消息链接ID(10bit)

            senderClassification: Number(data.field.senderClassification),//发送者分类(3bit)
            routeType: Number(data.field.routeType),//航线类型(5bit)
            utcMonth: Number(data.field.utcMonth),//开始时间日期的UTC月(4bit)
            utcDay: Number(data.field.utcDay),//开始时间日期的UTC日(5bit)
            utcHour: Number(data.field.utcHour),//开始时间日期的UTC时(5bit)
            utcMinute: Number(data.field.utcMinute),//开始时间日期的UTC分钟(6bit)
            duration: Number(data.field.duration),//持续时间(18bit)
            numberOfWaypoints: Number(data.field.numberOfWaypoints),//航路点数量(5bit)
            waypoints: [
                // { latitude: Math.round(Number(data.field.latitude1)*600000), longitude: Math.round(Number(data.field.longitude1)*600000) },//航路点(n*55bit)
                // { latitude: Math.round(Number(data.field.latitude2)*600000), longitude: Math.round(Number(data.field.longitude2)*600000) },
                // { latitude: Math.round(Number(data.field.latitude3)*600000), longitude: Math.round(Number(data.field.longitude3)*600000) },
                // { latitude: Math.round(Number(data.field.latitude4)*600000), longitude: Math.round(Number(data.field.longitude4)*600000) },
                // { latitude: Math.round(Number(data.field.latitude5)*600000), longitude: Math.round(Number(data.field.longitude5)*600000) },
                // { latitude: Math.round(Number(data.field.latitude6)*600000), longitude: Math.round(Number(data.field.longitude6)*600000) },
                // { latitude: Math.round(Number(data.field.latitude7)*600000), longitude: Math.round(Number(data.field.longitude7)*600000) },
                // { latitude: Math.round(Number(data.field.latitude8)*600000), longitude: Math.round(Number(data.field.longitude8)*600000) },
                // { latitude: Math.round(Number(data.field.latitude9)*600000), longitude: Math.round(Number(data.field.longitude9)*600000) },
                // { latitude: Math.round(Number(data.field.latitude10)*600000), longitude: Math.round(Number(data.field.longitude10)*600000) },
                // { latitude: Math.round(Number(data.field.latitude11)*600000), longitude: Math.round(Number(data.field.longitude11)*600000) },
                // { latitude: Math.round(Number(data.field.latitude12)*600000), longitude: Math.round(Number(data.field.longitude12)*600000) },
                // { latitude: Math.round(Number(data.field.latitude13)*600000), longitude: Math.round(Number(data.field.longitude13)*600000) },
                // { latitude: Math.round(Number(data.field.latitude14)*600000), longitude: Math.round(Number(data.field.longitude14)*600000) },
                // { latitude: Math.round(Number(data.field.latitude15)*600000), longitude: Math.round(Number(data.field.longitude15)*600000) },
                // { latitude: Math.round(Number(data.field.latitude16)*600000), longitude: Math.round(Number(data.field.longitude16)*600000) }
            ],
        };
        if (numberOfWaypoints != '' && numberOfWaypoints > 1) {
            for (var i = 1; i <= numberOfWaypoints; i++) {
                var wayLng = $("input[name='longitude" + i + "']") == '' ? 108600000 : Math.round(Number($("input[name='longitude" + i + "']")) * 600000);
                var wayLat = $("input[name='latitude" + i + "']") == '' ? 54600000 : Math.round(Number($("input[name='latitude" + i + "']")) * 600000);
                messageData.waypoints.push({latitude: wayLat, longitude: wayLng})
            }
        }
        contentData = {
            messageId: 0,//消息ID，取值范围为0-3，分别对应广播消息、寻址消息、区域多播消息、组播消息。
            encodeMethod: '',
            channel: '',
            asmIdentifier: '',
            targetMMSI: '',//目的mmsi
            longitude1: null,//东北角经度
            latitude1: null,//东北角纬度
            longitude2: null,//西南角经度
            latitude2: null,//西南角纬度
            groupId: '',
            data: '',
            messageInfo: messageData,
            messageInfoType: 13,//报文内容对应类型
        }
        var ship_MMSI = $("#ship_MMSI").val();
        contentData.targetMMSI = Number(ship_MMSI);
        contentData.messageId = 1;
        var params = {};
        params.shoreMmsi = $("#shore_MMSI").val();
        params.messageType = 2;
        params.interfaceName = 2;
        params.data = JSON.stringify(contentData);
        //	params.sendTime = common.dateFormat(new Date(), 'yyyyMMddhhmmss');
        params.messageInfoType = 13;
        //	params.userId = localStorage.getItem(common.userIdKey);
        //接口路径
        messageBroadcastSend(params);
    })

    //B.14	文本描述寻址
    form.on('submit(formDemo22)', function (data) {
        messageData = {
            messageId: 8,//消息id 默认8
            forwardIndicator: 0,//转发指示符，默认0
            sourceMmsi: 0,//源MMSI
            idle: 0,//空闲，默认0
            dac: 1,//DAC，默认1
            fi: 29,//FI，默认29
            messageLinkageID: data.field.messageLinkageID == '' ? 0 : Number(data.field.messageLinkageID),//消息链接ID(10bit)
            textString: Number(data.field.textString),//文本字符串(6~966bit)
        };
        contentData = {
            messageId: 0,//消息ID，取值范围为0-3，分别对应广播消息、寻址消息、区域多播消息、组播消息。
            encodeMethod: '',
            channel: '',
            asmIdentifier: '',
            targetMMSI: '',//目的mmsi
            longitude1: null,//东北角经度
            latitude1: null,//东北角纬度
            longitude2: null,//西南角经度
            latitude2: null,//西南角纬度
            groupId: '',
            data: '',
            messageInfo: messageData,
            messageInfoType: 14,//报文内容对应类型
        }
        var ship_MMSI = $("#ship_MMSI").val();
        contentData.targetMMSI = Number(ship_MMSI);
        contentData.messageId = 1;
        var params = {};
        params.shoreMmsi = $("#shore_MMSI").val();
        params.messageType = 2;
        params.interfaceName = 2;
        params.data = JSON.stringify(contentData);
        //	params.sendTime = common.dateFormat(new Date(), 'yyyyMMddhhmmss');
        params.messageInfoType = 14;
        ///	params.userId = localStorage.getItem(common.userIdKey);
        //接口路径
        messageBroadcastSend(params);
    })

    //B.3潮汐窗口寻址
    form.on('submit(formDemo3)', function (data) {
        if (data.field.utcMonth == '' &
            data.field.utcDay == '' &
            data.field.positionLongitude1 == '' &
            data.field.positionLatitude1 == '' &
            data.field.fromUtcHour1 == '' &
            data.field.fromUtcMinute1 == '' &
            data.field.toUtcHour1 == '' &
            data.field.toUtcMinute1 == '' &
            data.field.currentDirectionPredicted1 == '' &
            data.field.currentSpeedPredicted1 == '' &
            data.field.positionLongitude2 == '' &
            data.field.positionLatitude2 == '' &
            data.field.fromUtcHour2 == '' &
            data.field.fromUtcMinute2 == '' &
            data.field.currentDirectionPredicted2 == '' &
            data.field.currentSpeedPredicted2 == '' &
            data.field.positionLongitude3 == '' &
            data.field.positionLatitude3 == '' &
            data.field.fromUtcHour3 == '' &
            data.field.fromUtcMinute3 == '' &
            data.field.toUtcHour3 == '' &
            data.field.toUtcMinute3 == '' &
            data.field.currentDirectionPredicted3 == '' &
            data.field.currentSpeedPredicted3 == '' ||
            data.field.utcMonth == null &
            data.field.utcDay == null &
            data.field.positionLongitude1 == null &
            data.field.positionLatitude1 == null &
            data.field.fromUtcHour1 == null &
            data.field.fromUtcMinute1 == null &
            data.field.toUtcHour1 == null &
            data.field.toUtcMinute1 == null &
            data.field.currentDirectionPredicted1 == null &
            data.field.currentSpeedPredicted1 == null &
            data.field.positionLongitude2 == null &
            data.field.positionLatitude2 == null &
            data.field.fromUtcHour2 == null &
            data.field.fromUtcMinute2 == null &
            data.field.currentDirectionPredicted2 == null &
            data.field.currentSpeedPredicted2 == null &
            data.field.positionLongitude3 == null &
            data.field.positionLatitude3 == null &
            data.field.fromUtcHour3 == null &
            data.field.fromUtcMinute3 == null &
            data.field.toUtcHour3 == null &
            data.field.toUtcMinute3 == null &
            data.field.currentDirectionPredicted3 == null &
            data.field.currentSpeedPredicted3 == null
        ) {
            parent.layer.msg('部分数据不能为空', {icon: 2, time: config.msgTime});
            return false;
        }
        messageData = {
            messageId: 6,//消息id 默认6
            forwardIndicator: 0,//转发指示符，默认0
            sourceMmsi: 0,//源MMSI
            sequenceNumber: 0,//顺序号，默认0
            targetMmsi: 0,//目的MMSI
            retransmissionFlag: 0,//重传标志，默认0
            idle: 0,//空闲，默认0
            dac: 1,//DAC，默认1
            fi: 32,//FI，默认32
            utcMonth: data.field.utcMonth == '' ? 0 : Number(data.field.utcMonth),//时间戳：UTC月(4bit)
            utcDay: data.field.utcDay == '' ? 0 : Number(data.field.utcDay),//时间戳：UTC日(5bit)
            positionLongitude1: data.field.positionLongitude1 == '' ? 10860000 : Math.round(Number(data.field.positionLongitude1) * 600000),//位置#1经度(25bit)
            positionLatitude1: data.field.positionLatitude1 == '' ? 5460000 : Math.round(Number(data.field.positionLatitude1) * 600000),//位置#1维度(24bit)
            fromUtcHour1: data.field.fromUtcHour1 == '' ? 24 : Number(data.field.fromUtcHour1),//UTC起始小时(5bit)
            fromUtcMinute1: data.field.fromUtcMinute1 == '' ? 60 : Number(data.field.fromUtcMinute1),//UTC起始分钟(6bit)
            toUtcHour1: data.field.toUtcHour1 == '' ? 24 : Number(data.field.toUtcHour1),//UTC截至小时(5bit)
            toUtcMinute1: data.field.toUtcMinute1 == '' ? 60 : Number(data.field.toUtcMinute1),//UTC截至分钟(6bit)
            currentDirectionPredicted1: data.field.currentDirectionPredicted1 == '' ? 360 : Number(data.field.currentDirectionPredicted1),//流向预测#1(9bit)
            currentSpeedPredicted1: data.field.currentSpeedPredicted1 == '' ? 255 : Number(data.field.currentSpeedPredicted1),//流速预测#1(8bit)
            positionLongitude2: data.field.positionLongitude2 == '' ? 10860000 : Math.round(Number(data.field.positionLongitude2) * 600000),//位置#2经度(25bit)
            positionLatitude2: data.field.positionLatitude2 == '' ? 5460000 : Math.round(Number(data.field.positionLatitude2) * 600000),//位置#2维度(24bit)
            fromUtcHour2: data.field.fromUtcHour2 == '' ? 24 : Number(data.field.fromUtcHour2),//UTC起始小时(5bit)
            fromUtcMinute2: data.field.fromUtcMinute2 == '' ? 60 : Number(data.field.fromUtcMinute2),//UTC起始分钟(6bit)
            currentDirectionPredicted2: data.field.fromUtcHour2 == '' ? 24 : Number(data.field.currentDirectionPredicted2),//流向预测#2(9bit)
            currentSpeedPredicted2: data.field.fromUtcMinute2 == '' ? 60 : Number(data.field.currentSpeedPredicted2),//流速预测#2(8bit)
            positionLongitude3: data.field.positionLongitude3 == '' ? 10860000 : Math.round(Number(data.field.positionLongitude3) * 600000),//位置#3经度(25bit)
            positionLatitude3: data.field.positionLatitude3 == '' ? 5460000 : Math.round(Number(data.field.positionLatitude3) * 600000),//位置#3维度(24bit)
            fromUtcHour3: data.field.fromUtcHour3 == '' ? 24 : Number(data.field.fromUtcHour3),//UTC起始小时(5bit)
            fromUtcMinute3: data.field.fromUtcMinute3 == '' ? 60 : Number(data.field.fromUtcMinute3),//UTC起始分钟(6bit)
            toUtcHour3: data.field.fromUtcHour3 == '' ? 24 : Number(data.field.toUtcHour3),//UTC截至小时(5bit)
            toUtcMinute3: data.field.fromUtcMinute3 == '' ? 60 : Number(data.field.toUtcMinute3),//UTC截至分钟(6bit)
            currentDirectionPredicted3: data.field.currentDirectionPredicted3 == '' ? 360 : Number(data.field.currentDirectionPredicted3),//流向预测#3(9bit)
            currentSpeedPredicted3: data.field.currentSpeedPredicted3 == '' ? 255 : Number(data.field.currentSpeedPredicted3),//流速预测#3(8bit)
        };
        contentData = {
            messageId: 1,//消息ID，取值范围为0-3，分别对应广播消息、寻址消息、区域多播消息、组播消息。
            encodeMethod: '',
            channel: '',
            asmIdentifier: '',
            targetMMSI: '',//目的mmsi
            longitude1: null,//东北角经度
            latitude1: null,//东北角纬度
            longitude2: null,//西南角经度
            latitude2: null,//西南角纬度
            groupId: '',
            data: '',
            messageInfo: messageData,
            messageInfoType: 3,//报文内容对应类型
        }
        var ship_MMSI = $("#ship_MMSI").val();
        contentData.targetMMSI = Number(ship_MMSI);
        var params = {};
        params.shoreMmsi = $("#shore_MMSI").val();
        params.messageType = 2;
        params.interfaceName = 2;
        params.data = JSON.stringify(contentData);
        params.messageInfoType = 3;
        //接口路径

        messageBroadcastSend(params);
    })

    //B.7进港清理航道时间寻址
    form.on('submit(formDemo7)', function (data) {
        messageData = {
            messageId: 6,//消息id 默认6
            forwardIndicator: 0,//转发指示符，默认0
            sourceMmsi: 0,//源MMSI
            sequenceNumber: 0,//顺序号，默认0
            targetMmsi: 0,//目的MMSI
            retransmissionFlag: 0,//重传标志，默认0
            idle: 0,//空闲，默认0
            dac: 1,//DAC，默认1
            fi: 18,//FI，默认18
            messageLinkageID: data.field.messageLinkageID == '' ? 0 : Number(data.field.messageLinkageID),//消息链接ID(10bit)
            utcMonth: data.field.utcMonth == '' ? 0 : Number(data.field.utcMonth),//进港许可UTC时间：月(4bit)
            utcDay: data.field.utcDay == '' ? 0 : Number(data.field.utcDay),//进港许可UTC时间：日(5bit)
            utcHour: data.field.utcHour == '' ? 24 : Number(data.field.utcHour),//进港许可UTC时间：时(5bit)
            utcMinute: data.field.utcMinute == '' ? 60 : Number(data.field.utcMinute),//进港许可UTC时间：分(6bit)
            portName: data.field.portName == '' ? "@@@@@@@@@@@@@@@@@@@@" : Number(data.field.portName),//港口码头名称(120bit)
            destination: data.field.portName == '' ? "@@@@@" : Number(data.field.destination),//目的港口(30bit)
            longitude: data.field.longitude == '' ? 10860000 : Math.round(Number(data.field.longitude) * 600000),//经度(25bit)
            latitude: data.field.latitude == '' ? 5460000 : Math.round(Number(data.field.latitude) * 600000),//纬度(24bit)
        };
        contentData = {
            messageId: 1,//消息ID，取值范围为0-3，分别对应广播消息、寻址消息、区域多播消息、组播消息。
            encodeMethod: '',
            channel: '',
            asmIdentifier: '',
            targetMMSI: '',//目的mmsi
            longitude1: null,//东北角经度
            latitude1: null,//东北角纬度
            longitude2: null,//西南角经度
            latitude2: null,//西南角纬度
            groupId: '',
            data: '',
            messageInfo: messageData,
            messageInfoType: 7,//报文内容对应类型
        }
        var params = {};
        var ship_MMSI = $("#ship_MMSI").val();
        contentData.targetMMSI = Number(ship_MMSI);
        params.shoreMmsi = $("#shore_MMSI").val();
        params.messageType = 2;
        params.interfaceName = 2;
        params.data = JSON.stringify(contentData);
        //	params.sendTime = common.dateFormat(new Date(), 'yyyyMMddhhmmss');
        params.messageInfoType = 7;
        //	params.userId = localStorage.getItem(common.userIdKey);
        //接口路径
        messageBroadcastSend(params);
    })

    //B.9	泊位数据寻址
    form.on('submit(formDemo9)', function (data) {
        messageData = {
            messageId: 6,//消息id 默认6
            forwardIndicator: 0,//转发指示符，默认0
            sourceMmsi: 0,//源MMSI
            sequenceNumber: 0,//顺序号，默认0
            targetMmsi: 0,//目的MMSI
            retransmissionFlag: 0,//重传标志，默认0
            idle: 0,//空闲，默认0
            dac: 1,//DAC，默认1
            fi: 19,//FI，默认18
            messageLinkageID: Number(data.field.messageLinkageID),//消息链接ID(10bit)
            berthLength: data.field.berthLength == '' ? 0 : Number(data.field.berthLength),//泊位长度(9bit)
            waterDepthAtBerth: data.field.waterDepthAtBerth == '' ? 0 : Number(data.field.waterDepthAtBerth),//泊位水深(8bit)
            mooringPosition: Number(data.field.mooringPosition),//泊位位置(3bit)
            utcMonth: data.field.utcMonth == '' ? 0 : Number(data.field.utcMonth),//靠泊UTC时间：月(4bit)
            utcDay: data.field.utcDay == '' ? 0 : Number(data.field.utcDay),//靠泊UTC时间：日(5bit)
            utcHour: data.field.utcHour == '' ? 24 : Number(data.field.utcHour),//靠泊UTC时间：时(5bit)
            utcMinute: data.field.utcMinute == '' ? 60 : Number(data.field.utcMinute),//靠泊UTC时间：分(6bit)
            servicesAvailability: Number(data.field.servicesAvailability),//服务有效性(1bit)
            typeOfServicesAvailable: {
                typeOfServicesAvailable1: Number(data.field.typeOfServicesAvailable1),//可用服务类型(52bit)
                typeOfServicesAvailable2: Number(data.field.typeOfServicesAvailable2),
                typeOfServicesAvailable3: Number(data.field.typeOfServicesAvailable3),
                typeOfServicesAvailable4: Number(data.field.typeOfServicesAvailable4),
                typeOfServicesAvailable5: Number(data.field.typeOfServicesAvailable5),
                typeOfServicesAvailable6: Number(data.field.typeOfServicesAvailable6),
                typeOfServicesAvailable7: Number(data.field.typeOfServicesAvailable7),
                typeOfServicesAvailable8: Number(data.field.typeOfServicesAvailable8),
                typeOfServicesAvailable9: Number(data.field.typeOfServicesAvailable9),
                typeOfServicesAvailable10: Number(data.field.typeOfServicesAvailable10),
                typeOfServicesAvailable11: Number(data.field.typeOfServicesAvailable11),
                typeOfServicesAvailable12: Number(data.field.typeOfServicesAvailable12),
                typeOfServicesAvailable13: Number(data.field.typeOfServicesAvailable13),
                typeOfServicesAvailable14: Number(data.field.typeOfServicesAvailable14),
                typeOfServicesAvailable15: Number(data.field.typeOfServicesAvailable15),
                typeOfServicesAvailable16: Number(data.field.typeOfServicesAvailable16),
                typeOfServicesAvailable17: Number(data.field.typeOfServicesAvailable17),
                typeOfServicesAvailable18: Number(data.field.typeOfServicesAvailable18),
                typeOfServicesAvailable19: Number(data.field.typeOfServicesAvailable19),
                typeOfServicesAvailable20: Number(data.field.typeOfServicesAvailable20),
                typeOfServicesAvailable21: Number(data.field.typeOfServicesAvailable21),
                typeOfServicesAvailable22: Number(data.field.typeOfServicesAvailable22),
                typeOfServicesAvailable23: Number(data.field.typeOfServicesAvailable23),

            },
            nameOfBerth: Number(data.field.nameOfBerth),//泊位名称(120bit)
            centrePositionOfBerthLongitude: data.field.centrePositionOfBerthLongitude == '' ? 10860000 : Math.round(Number(data.field.centrePositionOfBerthLongitude) * 600000),//泊位中心位置信息：经度(25bit)
            centrePositionOfBerthLatitude: data.field.centrePositionOfBerthLatitude == '' ? 5460000 : Math.round(Number(data.field.centrePositionOfBerthLatitude) * 600000),//泊位中心位置信息：纬度(24bit)
        };
        contentData = {
            messageId: 1,//消息ID，取值范围为0-3，分别对应广播消息、寻址消息、区域多播消息、组播消息。
            encodeMethod: '',
            channel: '',
            asmIdentifier: '',
            targetMMSI: '',//目的mmsi
            longitude1: null,//东北角经度
            latitude1: null,//东北角纬度
            longitude2: null,//西南角经度
            latitude2: null,//西南角纬度
            groupId: '',
            data: '',
            messageInfo: messageData,
            messageInfoType: 9,//报文内容对应类型
        }
        var params = {};
        var ship_MMSI = $("#ship_MMSI").val();
        contentData.targetMMSI = Number(ship_MMSI);
        params.shoreMmsi = $("#shore_MMSI").val();
        params.messageType = 2;
        params.interfaceName = 2;
        params.data = JSON.stringify(contentData);
        //	params.sendTime = common.dateFormat(new Date(), 'yyyyMMddhhmmss');
        params.messageInfoType = 9;
        //	params.userId = localStorage.getItem(common.userIdKey);
        //接口路径
        messageBroadcastSend(params);
    })


    //AIS
    //文本寻址
    form.on('submit(sendMessage1)', function (data) {
        var dataText = $("#textMsg1").val();
        var ship_MMSI = $("#ship_MMSI").val();
        var channel = $("#channel1").val();
        contentData = {
            messageId: 12,
            channel: channel,
            targetMMSI: Number(ship_MMSI),
            data: dataText
        }
        var params = {};
        params.shoreMmsi = $("#shore_MMSI").val();
        params.messageType = 1;
        params.interfaceName = 1;
        params.data = JSON.stringify(contentData);
        //params.sendTime = common.dateFormat(new Date(), 'yyyyMMddhhmmss');
        //params.userId = localStorage.getItem(common.userIdKey);
        //接口路径
        messageBroadcastSend(params);
    })

    //AIS
    //二进制寻址
    form.on('submit(sendMessage2)', function (data) {
        var dataText = $("#textMsg2").val();
        var ship_MMSI = $("#ship_MMSI").val();
        var channel = $("#channel2").val();
        contentData = {
            messageId: 6,
            channel: channel,
            targetMMSI: Number(ship_MMSI),
            data: dataText
        }
        var params = {};
        params.shoreMmsi = $("#shore_MMSI").val();
        params.messageType = 1;
        params.interfaceName = 1;
        params.data = JSON.stringify(contentData);
        //接口路径
        messageBroadcastSend(params);
    })

    //AIS
    //文本广播
    form.on('submit(sendMessage3)', function (data) {
        var dataText = $("#textMsg3").val();
        var channel = $("#channel3").val();
        var shoreMmsi = $("#station_MMSI").val();
        contentData = {
            messageId: 14,
            channel: channel,
            targetMMSI: '',
            data: dataText
        }
        var params = {};
        params.shoreMmsi = shoreMmsi;
        params.messageType = 0;
        params.interfaceName = 0;
        params.data = JSON.stringify(contentData);
        //	params.sendTime = common.dateFormat(new Date(), 'yyyyMMddhhmmss');
        //	params.userId = localStorage.getItem(common.userIdKey);
        //接口路径
        messageBroadcastSend(params);
    })

    //AIS
    //二进制广播
    form.on('submit(sendMessage4)', function (data) {
        var dataText = $("#textMsg4").val();
        var channel = $("#channel4").val();
        var shoreMmsi = $("#station_MMSI").val();
        contentData = {
            messageId: 8,
            channel: channel,
            targetMMSI: '',
            data: dataText
        }
        var params = {};
        params.shoreMmsi = shoreMmsi;
        params.messageType = 0;
        params.interfaceName = 0;
        params.data = JSON.stringify(contentData);
        //接口路径
        messageBroadcastSend(params);
    })

    //VDE
    //测试报文广播
    form.on('submit(sendMessage5)', function (data) {
        var shoreMmsi = $("#station_MMSI").val();
        var dataText = $("#textMsg5").val();
        contentData = {
            // type: 0,
            type: 1,
            targetMMSI: '',
            channel: '',
            encodeMethod: '',
            bandwidth: '',
            data: dataText
        }
        var params = {};
        params.shoreMmsi = shoreMmsi;
        params.messageType = 3;
        params.interfaceName = 3;
        params.priority = '';
        params.data = JSON.stringify(contentData);
        //接口路径
        messageBroadcastSend(params);
    })

    //VDE
    //测试报文寻址
    form.on('submit(sendMessage6)', function (data) {
        var dataText = $("#textMsg6").val();
        var ship_MMSI = $("#ship_MMSI").val();
        var priority = $("#seaMapFile1").val();
        contentData = {
            type: 1,
            targetMMSI: Number(ship_MMSI),
            channel: '',
            encodeMethod: '',
            bandwidth: '',
            data: dataText
        }
        var params = {};
        params.shoreMmsi = $("#shore_MMSI").val();
        params.messageType = 3;
        params.priority = priority;
        params.data = JSON.stringify(contentData);
        //	params.sendTime = common.dateFormat(new Date(), 'yyyyMMddhhmmss');
        //	params.userId = localStorage.getItem(common.userIdKey);
        //接口路径
        messageBroadcastSend(params);
    })


    //点击导入按钮,使files触发点击事件,然后完成读取文件的操作
    $("#fileImport1").click(function () {
        $("#files1").click();
    })
    $("#fileImport2").click(function () {
        $("#files2").click();
    })
    // 获取选择文件信息
    upFile1 = function () {
        //获取读取我文件的File对象
        if (document.getElementById('files1').value === '') {
            layer.msg('请选择文件！', {icon: 5, time: config.msgTime});
            return false
        }
        var selectedFile = document.getElementById('files1').files[0];
        fileContentName1 = selectedFile.name;
        $("#fileName1").val(fileContentName1);
        var size = selectedFile.size;
        // console.log("文件名:" + fileContentName1 + "大小:" + size + "文件名长度:" + fileContentName1.length);
        var reader = new FileReader();
        reader.readAsBinaryString(selectedFile);
        reader.read

        reader.onload = function () {
            //当读取完成后回调这个函数,然后此时文件的内容存储到了result中,直接操作即可

            fileContentText1 = this.result;
            fileContentText1 = "0" + fileContentName1 + fileContentText1;

            fileContentText1 = utf8_to_b64(fileContentText1);

            // fileContentText1 = b64_to_utf8(fileContentText1);
            // fileContentText1 = base64ToArrayBuffer(fileContentText1);
        }
    }
    upFile2 = function () {
        //获取读取我文件的File对象
        if (document.getElementById('files2').value === '') {
            layer.msg('请选择文件！', {icon: 5, time: config.msgTime});
            return false
        }
        var selectedFile = document.getElementById('files2').files[0];
        fileContentName2 = selectedFile.name;
        $("#fileName2").val(fileContentName2);
        var size = selectedFile.size;
        // console.log("文件名:" + fileContentName2 + "大小:" + size);
        var reader = new FileReader();
        reader.readAsBinaryString(selectedFile)
        reader.onload = function () {
            //当读取完成后回调这个函数,然后此时文件的内容存储到了result中,直接操作即可
            //    console.log(this.result);
            fileContentText2 = this.result;
            fileContentText2 = "1" + fileContentText2;
            //   console.log(fileContentText2.length);
            fileContentText2 = utf8_to_b64(fileContentText2);
            //   console.log(fileContentText2.length);
            // fileContentText2 = b64_to_utf8(fileContentText1);
            // fileContentText2 = base64ToArrayBuffer(fileContentText1);
        }
    }

    // 编码
    function utf8_to_b64(str) {
        return window.btoa(unescape(encodeURIComponent(str)));
    }


    // 获取文件扩展名
    function getFileExtendingName(filename) {
        // 文件扩展名匹配正则
        var reg = /\.[^\.]+$/;
        var matches = reg.exec(filename);
        if (matches) {
            return matches[0];
        }
        return '';
    }

    // 补全文件名
    function fillFileName(num, length) {
        return ("0000000000000" + num).substr(-length);
    }

    form.on('submit(sendMessage7)', function (data) {
        var ship_MMSI = $("#ship_MMSI").val();
        var transmission = $("#transmission1").val();
        var encodeMethod = '';
        // 校验文件名称长度
        if (fileContentName1.length > 12) {
            layer.msg('文件名长度超出范围', {icon: 5, time: config.msgTime});
            return false
        }
        // 校验文件扩展名
        var fileExtendingName = getFileExtendingName(fileContentName1);
        if (fileExtendingName != ".7CB") {
            layer.msg('扩展名不符合规范', {icon: 5, time: config.msgTime});
            return false
        }
        // 编码方式：快速传输对应1=pi/4 QPSK  稳定传输对应5=16 QAM，带宽: 2=100 kHz
        if (transmission == '01') {
            encodeMethod = '1'
        } else {
            encodeMethod = '5'
        }
        // 文件名补位
        fileContentName1 = fillFileName(fileContentName1, 12);
        //文件内容去掉空格回车换行
        // fileContentText1 = fileContentText1.replace(/\ +/g,"");
        // fileContentText1 = fileContentText1.replace(/[\r\n]/g,"");
        var dataText = fileContentText1;


        // 重置文件名称和内容
        // fileContentText1="";
        // fileContentName1="";

        contentData = {
            type: 1,
            targetMMSI: Number(ship_MMSI),
            channel: '',
            encodeMethod: encodeMethod,
            bandwidth: '2',
            data: dataText
        }
        var params = {};
        params.shoreMmsi = $("#shore_MMSI").val();
        params.messageType = 3;
        // 优先级
        params.priority = "NewsBroadcastVDEFile";// 消息播发VDE海图更新和航线规划固定标识
        params.data = JSON.stringify(contentData);

        // console.log(params);
        //接口路径
        messageBroadcastSend(params);
        // 消息播发弹出层关闭
        // layer.close(targetLayer);
    })

    form.on('submit(sendMessage8)', function (data) {
        var ship_MMSI = $("#ship_MMSI").val();
        var transmission = $("#transmission2").val();
        var encodeMethod = '';
        // 校验文件名称长度
        // if(fileContentName2.length>12){
        //     parent.layer.msg('文件名长度超出范围', { icon: 5 });
        //     return false
        // }
        // 校验文件扩展名
        var fileExtendingName = getFileExtendingName(fileContentName2);
        if (fileExtendingName != ".rtz") {
            layer.msg('扩展名不符合规范', {icon: 5, time: config.msgTime});
            return false
        }
        // 编码方式：快速传输对应1=pi/4 QPSK  稳定传输对应5=16 QAM，带宽: 2=100 kHz
        if (transmission == '01') {
            encodeMethod = '1'
        } else {
            encodeMethod = '5'
        }
        //文件内容去掉空格回车换行
        // fileContentText2 = fileContentText2.replace(/\ +/g,"");
        // fileContentText2 = fileContentText2.replace(/[\r\n]/g,"");
        var dataText = fileContentText2;
        // 重置文件名称和内容
        // fileContentText2="";
        // fileContentName2="";

        contentData = {
            type: 1,
            targetMMSI: Number(ship_MMSI),
            channel: '',
            encodeMethod: encodeMethod,
            bandwidth: '2',
            data: dataText
        }
        var params = {};
        params.shoreMmsi = $("#shore_MMSI").val();
        params.messageType = 3;
        // 优先级
        params.priority = "NewsBroadcastVDEFile";// 消息播发VDE海图更新和航线规划固定标识
        params.data = JSON.stringify(contentData);
        //接口路径
        messageBroadcastSend(params);
        // 消息播发弹出层关闭

    })

    form.verify({
        psw: [/^[\S]{4,12}$/, '密码必须4到12位，且不能出现空格'],
        repsw: function (t) {
            if (t !== $('#userPasswordLayer input[name=newPassword]').val()) {
                return '两次密码输入不一致';
            }
        },
        password: function (s) {
            if (s == '') {
                return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.normalASCII(s)) {
                    return '密码由英文、数字、特殊符号（不包含空格）组成';
                }
            }
        },
        notNull: function (s) {
            if (s == '') {
                return '必填项不能为空';
            }
        },
        //1-1023
        from1To1023Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from1To1023Int(s)) {
                    return '取值范围为1~1023';
                }
            }
        },
        from1To1023Int2: function (s) {
            if (s == '') {
                return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from1To1023Int(s)) {
                    return '取值范围为1~1023';
                }
            }
        },
        //1-12
        from1To12Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from1To12Int(s)) {
                    return '取值范围为1~12';
                }
            }
        },
        //1-31
        from1To31Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from1To31Int(s)) {
                    return '取值范围为1~31';
                }
            }
        },
        //0-23
        from0To23Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To23Int(s)) {
                    return '取值范围为0~23';
                }
            }
        },
        //0-59
        from0To59Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To59Int(s)) {
                    return '取值范围为0~59';
                }
            }
        },
        //0-127
        from0To127Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To127Int(s)) {
                    return '取值范围为0~127';
                }
            }
        },
        from0To127Int2: function (s) {
            if (s == '') {
                return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To127Int(s)) {
                    return '取值范围为0~127';
                }
            }
        },
        //-180-+180
        from180To180Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from180To180Int(s)) {
                    return '取值范围为-180~180';
                }
            }
        },
        //-90-+90
        from90To90Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from90To90Int(s)) {
                    return '取值范围为-90~90';
                }
            }
        },
        //0-126
        from0To126Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To126Int(s)) {
                    return '取值范围为0~126';
                }
            }
        },
        //0-359
        from0To359Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To359Int(s)) {
                    return '取值范围为0~359';
                }
            }
        },
        //-60-+600
        from60To600Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from60To600Int(s)) {
                    return '取值范围为-60~600';
                }
            }
        },
        //0-100
        from0To100Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To100Int(s)) {
                    return '取值范围为0~100';
                }
            }
        },
        //-200-+500
        from200To500Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from200To500Int(s)) {
                    return '取值范围为-200~500';
                }
            }
        },
        //1-402
        from1To402Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from1To402Int(s)) {
                    return '取值范围为1~402';
                }
            }
        },
        //0-4000
        from0To4000Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To4000Int(s)) {
                    return '取值范围为0~4000';
                }
            }
        },
        //0-251
        from0To251Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To251Int(s)) {
                    return '取值范围为0~251';
                }
            }
        },
        //0-30
        from0To30Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To30Int(s)) {
                    return '取值范围为0~30';
                }
            }
        },
        //0-60
        from0To60Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To60Int(s)) {
                    return '取值范围为0~60';
                }
            }
        },
        //-100-+500
        from100To500Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from100To500Int(s)) {
                    return '取值范围为-100~500';
                }
            }
        },
        //0-501  511
        from0To511Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To511Int(s)) {
                    return '取值范围为0~511';
                }
            }
        },
        //1-511
        from1To511Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from1To511Int(s)) {
                    return '取值范围为1~511';
                }
            }
        },
        //1-255
        from1To255Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from1To255Int(s)) {
                    return '取值范围为1~255';
                }
            }
        },
        //0-4
        from0To4Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To4Int(s)) {
                    return '取值范围为0~4';
                }
            }
        },
        //1-4095
        from1To4095Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from1To4095Int(s)) {
                    return '取值范围为0~4095';
                }
            }
        },
        //1-255000
        from1To255000Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from1To255000Int(s)) {
                    return '取值范围为1~255000';
                }
            }
        },
        // 1-262142
        from0To262142Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To262142Int(s)) {
                    return '取值范围为1~262142';
                }
            }
        },
        //1-359
        from1To359Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from1To359Int(s)) {
                    return '取值范围为1~359';
                }
            }
        },
        //0-719
        from0To719Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To719Int(s)) {
                    return '取值范围为0~719';
                }
            }
        },
        //6比特ASCII
        bitASCII: function (s) {
            if (s == '') {
                return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.bitASCII(s)) {
                    return '请输入6比特ASCII字符';
                }
            }
        },
        bitASCII2: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.bitASCII(s)) {
                    return '请输入6比特ASCII字符';
                }
            }
        },
        normalASCII: function (s) {
            if (s == '') {
                return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.normalASCII(s)) {
                    return '请输入ASCII字符';
                }
            }
        },
        from1To16Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!(s >= 1 && s <= 16)) {
                    return '取值范围为1~16';
                }
            }
        },
        //0-63
        from0To63Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.from0To63Int(s)) {
                    return '取值范围为0~63';
                }
            }
        },
        //1-80
        from1To80Int: function (s) {
            if (s == '') {
                // return '必填项不能为空';
            } else if (s.length > 0) {
                if (!(s >= 1 && s <= 80)) {
                    return '取值范围为1~80';
                }
            }
        },
    });

    function closeSendLayer() {
        if (rectangleMeasure.layer.getLayers().length > 0) {
            rectangleMeasure.layer.removeLayer(rectangleMeasure.rectangle);
        }
        layer.close(navigationBoxLayer);
        document.getElementById("sendSafeMsgControl").children[0].style.color = ""
        $("#sendSafeMsgControlLayer_saveArea").empty();
        $("#addDiv").empty();
        roundFlage = true;
        rectangular = true;
        fanFlage = true;
        brokenLine = true;
        polygonFlage = true;
        textFlage = true;
        roundFlageShip = true;
        rectangularShip = true;
        fanFlageShip = true;
        brokenLineShip = true;
        polygonFlageShip = true;
        textFlageShip = true;
        latitude1 = '';
        longitude1 = '';
        latitude2 = '';
        longitude2 = '';
        Dlongitude1 = '';
        Dlatitude1 = '';
        Dlongitude2 = '';
        Dlatitude2 = '';
        Dlongitude3 = '';
        Dlatitude3 = '';
        Dlongitude4 = '';
        Dlatitude4 = '';
        Dlongitude5 = '';
        Dlatitude5 = '';
        Dlongitude6 = '';
        Dlatitude6 = '';
        Dlongitude7 = '';
        Dlatitude7 = '';
        Dlongitude8 = '';
        Dlatitude8 = '';
        Dlongitude9 = '';
        Dlatitude9 = '';
        Dlongitude10 = '';
        Dlatitude10 = '';
        Dlongitude11 = '';
        Dlatitude11 = '';
        Dlongitude12 = '';
        Dlatitude12 = '';
        Dlongitude13 = '';
        Dlatitude13 = '';
        Dlongitude14 = '';
        Dlatitude14 = '';
        Dlongitude15 = '';
        Dlatitude15 = '';
        Dlongitude16 = '';
        Dlatitude16 = '';
        for (var i in $(".send-form")) {
            if (!isNaN(i)) {
                $(".send-form")[i].reset();
            }
        }
        layui.form.render();
    }

    // 工具条点击事件
    //我的船队
    var fleetLayerIndex = "";
    //船队船舶
    var fleetShipLayerIndex = "";
    //船队消息播发
    var fleetSendMessageIndex = "";
    //船队详细信息
    var fleetInfoDetailIndex = "";
    //航次列表
    var shipTimeLayerIndex = "";

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
    };


    laydate.render({
        elem: '#shipTimeDetail_arriveTime'
        , type: 'datetime'
    });
    laydate.render({
        elem: '#shipTimeDetail_startTime'
        , type: 'datetime'
    });

    $("#allList_left_middle ul li").on({
        click: function () {
            var str = '';
            if ($(this)[0].innerHTML == "船舶") {
                str = '【显示范围】' + shipCount + '艘';

            } else if ($(this)[0].innerHTML == "岸站") {
                str = '【显示范围】' + stationCount + '个';
            } else if ($(this)[0].innerHTML == "助航设备") {
                str = '【显示范围】' + atonCount + '个';
            }
            // else if($(this)[0].innerHTML=="网位仪"){
            //     str = '【显示范围】' + netCount + '个';
            // }
            $('#dataCount').html(str);
        }
    });
    $('#saerchMMSIorName').blur(function () {
        setTimeout(function () {
            $("#autoComplete").css("display", "none")
        }, 500);
    })

    // 保存电子航标配置
    form.on('submit(saveVirtualAton)', function (data) {
        admin.req('stationConfigure/setVirtualAtoN/saveOrUpdate', JSON.stringify(data.field), function (data) {
            if (data.resp_code == 0) {
                layer.close(virtualAtoNEditLayerIndex);
                layer.msg(data.resp_msg, {icon: 1, time: config.msgTime});
                table.reload('ownshore-table', {});
            } else {
                layer.msg(data.resp_msg, {icon: 2, time: config.msgTime});
            }
        }, "post");
        return false;
    });
    getShipsCount(admin)
    // window.setInterval(function () {
    //     getShipsCount(admin)
    // }, 5000);



    var saveTrackImg = function () {

        targetShipMMSIPlaybackTrackListFlag = true

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
            imageTimeout: 0
        }).then(canvas => {
            var img = Canvas2Image.convertToImage(canvas, canvas.width * 0.8, canvas.height * 0.8);
            screenShot = img
            $(".shipTrackPlayBackForTrackExportBtn").show()
            $(".shipTrackPlayBackForTrackExportBtnFake").hide()
            targetShipMMSIPlaybackTrackListFlag = false
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

    function openAlertGloble(dataObj) {
        let index = layer.open({
            type: 1
            , offset: [($(window).height() - 350)
                , ($(window).width() - 380)]
            , id: 'openAlertGloble_id'+ Math.ceil(Math.random()*10000)
            , title: "警告"
            // , content: $('#openAlertGloble')
            , content: `<div style="color: white; font-size: 15px; padding: 10px; line-height: 28px;">
        <div>MMSI: <span class="alert-mmsi">${dataObj.mmsi}</span></div>
        <div>时间: <span class="alert-time">${dataObj.time}</span></div>
        <div>位置：<span class="alert-lat">${Math.round((dataObj.latitude)*10000)/10000}</span> ，<span class="alert-lng">${Math.round((dataObj.longitude)*10000)/10000}</span> </div>
        <div>预警区域: <span class="alert-area">${dataObj.riskWarningArea}</span></div>
        <div>告警级别: <span class="alert-level">${dataObj.warningLevel}</span></div>
        <div style="text-align: center">
            <button class="layui-btn layui-btn-normal openAlertGlobleBtn" style="width: 100px;margin-top: 10px" >详情
            </button>
        </div>

    </div>`
            , btn: ''
            , shade: 0
            , skin: 'layui-layer-lan'
            , area: ['320px', '270px']
            , resize: false
            , scrollbar: false
        })
        $(".openAlertGlobleBtn").unbind("click");
        $(".openAlertGlobleBtn").click(function() {
            eFenceAlert(map, admin, table, config, form, laytpl)
        })

        setTimeout(() => {
            layer.close(index)
        }, 60000)
    }

    var heartCheck = {
        timeout: 5000, //重连时间
        timeoutObj: null,
        start: function(){
            this.timeoutObj = setTimeout(function(){
                getSocket() //这里重新创建 websocket 对象并赋值
            }, this.timeout)
        }
    }


    function getSocket () {
        var wsCustom = new WebSocket('ws://' + config.base_server.split('http://')[1] + `fishingPort60-websocket/websocket/sendMsg/${new Date().getTime()}`);
        // var wsCustom = new WebSocket(`ws://127.0.0.1:8610/websocket/sendMsg/${new Date().getTime()}`);
        wsCustom.onmessage = function (result) {
            if (!(result.data == '连接成功')) {
                var data = JSON.parse(result.data);
                var tempData = data;
                tempData.time = parseTime(data.time)
                tempData.lat = formatlat(formatlat(data.latitude))
                tempData.lng = formatlng(formatlng(data.longitude))
                openAlertGloble(tempData)
            }
        }

        wsCustom.onclose = function () {
            console.log('服务器已经断开');
            heartCheck.start();
        };
        wsCustom.onerror = function (err) {
            console.log("服务器报错：");
        };

        // 心跳 * 回应
        setInterval(function(){
            wsCustom.send('1');
        }, 1000 * 30);
    }

    getSocket()

    function formatDegree(value) {
        if (value != null && value != "") {
            ///<summary>将度转换成为度分秒</summary>
            value = Math.abs(value); //返回数的绝对值
            var v1 = Math.floor(value); //度   //对数进行下舍入
            var v2 = Math.floor(((value - v1) * 60) * 1000) / 1000; //分
            var v3 = Math.round(((value - v1) * 3600) % 60); //秒  //把数四舍五入为最接近的整数
            return v1 + "º" + v2;
        } else {
            return "º" + "";
        }
    }

    function formatlat(lat) {
        if (lat > 0) {
            return formatDegree(lat) + " N";
        } else {
            return formatDegree(Math.abs(lat)) + " S";
        }
    }

    function formatlng(lng) {
        if (lng > 0) {
            return formatDegree(lng) + " E";
        } else {
            return formatDegree(Math.abs(lng)) + " W";
        }
    }
    // openAlertGloble()

    function changeDecimalBuZero(number, bitNum) {
        var f_x = parseFloat(number);
        if (isNaN(f_x)) {
            return 0;
        }
        var s_x = number.toString();
        var pos_decimal = s_x.indexOf('.');
        if (pos_decimal < 0) {
            pos_decimal = s_x.length;
            s_x += '.';
        }
        while (s_x.length <= pos_decimal + bitNum) {
            s_x += '0';
        }
        return s_x;
    }



});


