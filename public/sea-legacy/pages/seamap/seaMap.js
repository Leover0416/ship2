layui.config({
    base: '/module/', //静态资源所在路径
}).extend({
    cctv: '{/}cctv/index',
}).use(['element', 'common', 'admin', 'form', 'table', 'laydate', 'cctv'], function () {
    var $ = layui.$;
    var form = layui.form;
    var table = layui.table;
    var laydate = layui.laydate;
    var admin = layui.admin;
    var config = layui.common;
    var laytpl = layui.laytpl;
    var currentPoly = {};
    var shipTypeTemp = ''
    var shoreSendSafeMsg = false;
    //只显示我的船队开关
    var onlyShowMyfleet = false;
    //只显示我关注船舶开关
    var onlyShowMyCareShip = false;
    var longitude1 = '';
    var latitude1 = '';
    var longitude2 = '';
    var latitude2 = '';
    var defaultLat;
    var defaultLng;
    // 地图
    var map;
    // tile图层
    var tileLayer;
    // 临界缩放比例
    var limitZoom = 10;
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
    // 基站覆盖度图层
    var stationCoverageLayer = null;


    // 船舶点图层
    var shipPointLayer = new L.layerGroup();
    // 船舶图层
    var shipLayer = new L.layerGroup();
    // 岸站图层
    var stationLayer = new L.layerGroup([], {"contentType": "station"});
    // 助航设备图层
    var atonLayer = new L.layerGroup();
    // 水文气象图层
    var hymeLayer = new L.layerGroup();
    // var hymeMiniDetailLayer =new L.layerGroup();
    // 船舶名称图层
    var shipNameLayer = new L.layerGroup();
    // 岸站名称图层
    var stationNameLayer = new L.layerGroup();
    // 碰撞图层
    var fcwLayer = new L.layerGroup();

    // 船舶详细弹出框
    var shipDetailLayer;
    // 被选船舶框图层
    var selectedShipLayer = new L.layerGroup();
    // 岸站详细弹出框
    var stationDetailLayer;
    // 水文气象详细弹出框
    var hymeDetailLayer;
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
    //fss0131
    var shipType = {
        layerControlLayer_shipType_30: 30,
        layerControlLayer_shipType_31: 31,
        layerControlLayer_shipType_35: 35,
        layerControlLayer_shipType_50: 50,
        layerControlLayer_shipType_51: 51,
        layerControlLayer_shipType_53: 53,
        layerControlLayer_shipType_55: 55,
        layerControlLayer_shipType_60: 60,
        layerControlLayer_shipType_70: 70,
        layerControlLayer_shipType_80: 80,
        layerControlLayer_shipType_00: "zz",
    };
    var navStatus = {
        layerControlLayer_navStatus_0: "0",
        layerControlLayer_navStatus_1: 1,
        layerControlLayer_navStatus_2: 2,
        layerControlLayer_navStatus_3: 3,
        layerControlLayer_navStatus_4: 4,
        layerControlLayer_navStatus_5: 5,
        layerControlLayer_navStatus_6: 6,
        layerControlLayer_navStatus_7: 7,
        layerControlLayer_navStatus_8: 8,
        layerControlLayer_navStatus_00: "zz",
    };
    var layerControlLayer_aisType = 'AB';
    //fss0131
    // 仅显示渔船 2022/7/12 lxy
    var onlyFishShip = false;
    // 是否显示雷达船 (显示0 不显示1)
    var isShowRadarShip = 0;
    // 显示元素船舶显示
    var layerControlLayer_shipTimeShow = 0;
    // 选择船舶MMSI;
    var selectedShipMMSI;

    // 船舶数据 筛选后
    var shipData = [];
    //船舶数据 全部
    var shipDataAll = [];
    // 岸站总数
    var shipCount = 0;
    // 岸站数据
    var stationData = [];
    var stationCount = 0;
    // 助航设备总数
    var atonCount = 0;
    // 网位仪总数
    var netCount = 0;

    //水文气象总数
    var hymeCount = 0;
    //水文气象信息数据
    var hymeData = [];
    //水文气象详细数据
    var hymeDetailData = [];
    //水文气象数据条数
    var hymeDetailCount = 0;
    var hymeDetailList = [];

    var cctv;

    //是否打开测距窗口
    var isDistancing = false;
    //是否打开设置中心点按钮
    var isPositionSetting = false;

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

    // 选择区域西北坐标
    var northWestPoint = "00000000000,0000";
    // 选择区域东北坐标
    var northEastPoint = "00000000000,0000";
    // 选择区域东南坐标
    var southEastPoint = "00000000000,0000";
    // 选择区域西南坐标
    var southWestPoint = "00000000000,0000";


    var moveFlag = false;

    // 基站列表
    var stationList = [];
    var stationDisconnect = false;

    var targetShipExportTableLayerIndex;

    var currentTrackTime = {}
    let TimeList = [];
    var DefaultTime;
    var hymeList = [];
    var targetShipMMSIPlaybackTrackListFlag = false
    //0313
    var allRiskArea = {
        enter: "enter",
        speed: "speed",
        navigationalStatus: "navigationalStatus",
        fcw: "fcw",
    };

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
    if (config.getUser() == undefined || config.getUser().roleCode == undefined) {
        window.open('/login.html', "_self")
    } else if (config.getUser().roleCode == "yanshi") {
        $("#sendSafeMsgControl").hide();
        $("#targetShipSendMessage").hide();
        $("#playbackTrack").hide();
        $("#control").show();
        shoreSendSafeMsg = true;

    } else {
        $("#sendSafeMsgControl").show();
        $("#targetShipSendMessage").show();
        $("#control").show();
        $("#playbackTrack").hide();

    }
    //是否刷新碰撞预警
    var fcwShipFlushIndex = false;
    var shipInterval;
    var cctvInterval;
    var stationInterval;
    var intervalId;
    var stationPopup;
    var hymeInterval;
    var mapType = '海图';
    admin.req('api-user/seaMap/getSeaMapSetting', {}, function (res) {
        var level = 7;
        var latitude = 35;
        var longitude = 127;
        if (res != undefined && res.id != undefined) {
            $('#seaMapId').val(res.id);
            level = res.level == undefined ? level : res.level == "" ? level : res.level;
            latitude = res.latitude == undefined ? latitude : res.latitude == "" ? latitude : res.latitude;
            defaultLat = latitude;
            longitude = res.longitude == undefined ? longitude : res.longitude == "" ? longitude : res.longitude;
            defaultLng = longitude;
            mapType = res.mapType == undefined ? mapType : res.mapType == "" ? mapType : res.mapType;
            $("input[name='layerControlLayer_shipTimeShow']").prop("checked", res.shipTimeShow == 0 ? true : false);
            // if (res.shipType != "") {
            //     if (res.shipType == "AB") {
            //         $("input[name='layerControlLayer_shipType'][value='A']").prop("checked", true);
            //         $("input[name='layerControlLayer_shipType'][value='B']").prop("checked", true);
            //     } else if (res.shipType == "A") {
            //         $("input[name='layerControlLayer_shipType'][value='A']").prop("checked", true);
            //         $("input[name='layerControlLayer_shipType'][value='B']").prop("checked", false);
            //     } else {
            //         $("input[name='layerControlLayer_shipType'][value='A']").prop("checked", false);
            //         $("input[name='layerControlLayer_shipType'][value='B']").prop("checked", true);
            //     }
            // } else {
            //     $("input[name='layerControlLayer_shipType'][value='A']").prop("checked", false);
            //     $("input[name='layerControlLayer_shipType'][value='B']").prop("checked", false);
            // }
            $("input[name='layerControlLayer_shipName']").prop("checked", res.shipName == "true" ? true : false);
            $("input[name='layerControlLayer_stationShow']").prop("checked", res.stationShow == "true" ? true : false);
            $("input[name='layerControlLayer_stationName']").prop("checked", res.stationName == "true" ? true : false);
            $("input[name='layerControlLayer_atonShow']").prop("checked", res.atonShow == "true" ? true : false);
            $("input[name='layerControlLayer_atonName']").prop("checked", res.atonName == "true" ? true : false);
            $("input[name='layerControlLayer_fishingNetShow']").prop("checked", res.fishingNetShow == "true" ? true : false);
            $("input[name='layerControlLayer_fishingAreas']").prop("checked", res.fishingAreas == "true" ? true : false);
            $("input[name='layerControlLayer_radarEcho']").prop("checked", res.radarEcho == "true" ? true : false);
            $("input[name='layerControlLayer_radarRange']").prop("checked", res.radarRange == "true" ? true : false);
            $("input[name='layerControlLayer_cctv']").prop("checked", localStorage.getItem("cctv-flag") === "true");
            $("input[name='layerControlLayer_fishShip']").prop("checked", res.fishingShip == "true" ? true : false);
            layerControlLayer_shipType = res.shipType;
            onlyFishShip = res.fishingShip == "true" ? true : false;
            $("input[name='layerControlLayer_hyme']").prop("checked", res.hymeShow == "true" ? true : false);

            layerControlLayer_aisType = res.aisType;
            if (res.aisType != "") {
                if (res.aisType == "AB") {
                    $("input[name='targetStatisticsLayer_aisType'][value='A']").prop("checked", true);
                    $("input[name='targetStatisticsLayer_aisType'][value='B']").prop("checked", true);
                    //全选按钮亮
                    $("#targetStatisticsLayer #ships_screen1 a").addClass('chose');
                    $("#targetStatisticsLayer .right_radius1").removeClass('chose');
                } else if (res.aisType == "A") {
                    $("input[name='targetStatisticsLayer_aisType'][value='A']").prop("checked", true);
                    $("input[name='targetStatisticsLayer_aisType'][value='B']").prop("checked", false);
                    //都不亮
                    $("#targetStatisticsLayer #ships_screen1 a").removeClass('chose');
                    $("#targetStatisticsLayer .right_radius1").removeClass('chose');
                } else {
                    $("input[name='targetStatisticsLayer_aisType'][value='A']").prop("checked", false);
                    $("input[name='targetStatisticsLayer_aisType'][value='B']").prop("checked", true);
                    //都不亮
                    $("#targetStatisticsLayer #ships_screen1 a").removeClass('chose');
                    $("#targetStatisticsLayer .right_radius1").removeClass('chose');
                }
            } else {
                $("input[name='targetStatisticsLayer_aisType'][value='A']").prop("checked", false);
                $("input[name='targetStatisticsLayer_aisType'][value='B']").prop("checked", false);
                //清空按钮亮
                $("#targetStatisticsLayer #ships_screen1 a").removeClass('chose');
                $("#targetStatisticsLayer .right_radius1").addClass('chose');
            }
            $("input[name='layerControlLayer_navStatus_0']").prop("checked", res.navStatus0 == "0" ? true : false);
            $("input[name='layerControlLayer_navStatus_1']").prop("checked", res.navStatus1 == "1" ? true : false);
            $("input[name='layerControlLayer_navStatus_2']").prop("checked", res.navStatus2 == "2" ? true : false);
            $("input[name='layerControlLayer_navStatus_3']").prop("checked", res.navStatus3 == "3" ? true : false);
            $("input[name='layerControlLayer_navStatus_4']").prop("checked", res.navStatus4 == "4" ? true : false);
            $("input[name='layerControlLayer_navStatus_5']").prop("checked", res.navStatus5 == "5" ? true : false);
            $("input[name='layerControlLayer_navStatus_6']").prop("checked", res.navStatus6 == "6" ? true : false);
            $("input[name='layerControlLayer_navStatus_7']").prop("checked", res.navStatus7 == "7" ? true : false);
            $("input[name='layerControlLayer_navStatus_8']").prop("checked", res.navStatus8 == "8" ? true : false);
            $("input[name='layerControlLayer_navStatus_00']").prop("checked", res.navStatus00 == "zz" ? true : false);
            $("input[name='targetStatisticsLayer_shipType_30']").prop("checked", res.shipType30 == "30" ? true : false);
            $("input[name='targetStatisticsLayer_shipType_31']").prop("checked", res.shipType31 == "31" ? true : false);
            $("input[name='targetStatisticsLayer_shipType_35']").prop("checked", res.shipType35 == "35" ? true : false);
            $("input[name='targetStatisticsLayer_shipType_50']").prop("checked", res.shipType50 == "50" ? true : false);
            $("input[name='targetStatisticsLayer_shipType_51']").prop("checked", res.shipType51 == "51" ? true : false);
            $("input[name='targetStatisticsLayer_shipType_53']").prop("checked", res.shipType53 == "53" ? true : false);
            $("input[name='targetStatisticsLayer_shipType_55']").prop("checked", res.shipType55 == "55" ? true : false);
            $("input[name='targetStatisticsLayer_shipType_60']").prop("checked", res.shipType60 == "60" ? true : false);
            $("input[name='targetStatisticsLayer_shipType_70']").prop("checked", res.shipType70 == "70" ? true : false);
            $("input[name='targetStatisticsLayer_shipType_80']").prop("checked", res.shipType80 == "80" ? true : false);
            $("input[name='targetStatisticsLayer_shipType_00']").prop("checked", res.shipType00 == "zz" ? true : false);
            $("input[name='layerControlLayer_riskArea']").prop("checked", res.enter == "enter" ? true : false);
            $("input[name='layerControlLayer_speedDeviation']").prop("checked", res.speed == "speed" ? true : false);
            $("input[name='layerControlLayer_abnormalAnchor']").prop("checked", res.navigationalStatus == "navigationalStatus" ? true : false);
            $("input[name='layerControlLayer_collision']").prop("checked", res.fcw == "fcw" ? true : false);
            $("input[name='layerControlLayer_collisionMonitor']").prop("checked", res.fcwMonitor == "fcwMonitor" ? true : false);
            //雷达目标开关
            $("input[name='layerControlLayer_radarTarget']").prop("checked", res.rttShow == "true" ? true : false);

            navStatus.layerControlLayer_navStatus_0 = res.navStatus0 == "0" ? "0" : false;
            navStatus.layerControlLayer_navStatus_1 = res.navStatus1 == "1" ? 1 : false;
            navStatus.layerControlLayer_navStatus_2 = res.navStatus2 == "2" ? 2 : false;
            navStatus.layerControlLayer_navStatus_3 = res.navStatus3 == "3" ? 3 : false;
            navStatus.layerControlLayer_navStatus_4 = res.navStatus4 == "4" ? 4 : false;
            navStatus.layerControlLayer_navStatus_5 = res.navStatus5 == "5" ? 5 : false;
            navStatus.layerControlLayer_navStatus_6 = res.navStatus6 == "6" ? 6 : false;
            navStatus.layerControlLayer_navStatus_7 = res.navStatus7 == "7" ? 7 : false;
            navStatus.layerControlLayer_navStatus_8 = res.navStatus8 == "8" ? 8 : false;
            navStatus.layerControlLayer_navStatus_00 = res.navStatus00 == "zz" ? "zz" : false;
            shipType.layerControlLayer_shipType_30 = res.shipType30 == "30" ? 30 : false;
            shipType.layerControlLayer_shipType_31 = res.shipType31 == "31" ? 31 : false;
            shipType.layerControlLayer_shipType_35 = res.shipType35 == "35" ? 35 : false;
            shipType.layerControlLayer_shipType_50 = res.shipType50 == "50" ? 50 : false;
            shipType.layerControlLayer_shipType_51 = res.shipType51 == "51" ? 51 : false;
            shipType.layerControlLayer_shipType_53 = res.shipType53 == "53" ? 53 : false;
            shipType.layerControlLayer_shipType_55 = res.shipType55 == "55" ? 55 : false;
            shipType.layerControlLayer_shipType_60 = res.shipType60 == "60" ? 60 : false;
            shipType.layerControlLayer_shipType_70 = res.shipType70 == "70" ? 70 : false;
            shipType.layerControlLayer_shipType_80 = res.shipType80 == "80" ? 80 : false;
            shipType.layerControlLayer_shipType_00 = res.shipType00 == "zz" ? "zz" : false;

            if (shipType.layerControlLayer_shipType_00 == false && shipType.layerControlLayer_shipType_30 == false &&
                shipType.layerControlLayer_shipType_31 == false && shipType.layerControlLayer_shipType_35 == false &&
                shipType.layerControlLayer_shipType_50 == false && shipType.layerControlLayer_shipType_51 == false &&
                shipType.layerControlLayer_shipType_53 == false && shipType.layerControlLayer_shipType_55 == false &&
                shipType.layerControlLayer_shipType_60 == false && shipType.layerControlLayer_shipType_70 == false &&
                shipType.layerControlLayer_shipType_80 == false && res.rttShow == "false") {
//清空按钮亮
                $("#targetStatisticsLayer #ships_screen2 a").removeClass('chose');
                $("#targetStatisticsLayer .right_radius2").addClass('chose');
            } else if (shipType.layerControlLayer_shipType_00 == "zz" && shipType.layerControlLayer_shipType_30 == 30 &&
                shipType.layerControlLayer_shipType_31 == 31 && shipType.layerControlLayer_shipType_35 == 35 &&
                shipType.layerControlLayer_shipType_50 == 50 && shipType.layerControlLayer_shipType_51 == 51 &&
                shipType.layerControlLayer_shipType_53 == 53 && shipType.layerControlLayer_shipType_55 == 55 &&
                shipType.layerControlLayer_shipType_60 == 60 && shipType.layerControlLayer_shipType_70 == 70 &&
                shipType.layerControlLayer_shipType_80 == 80 && res.rttShow == "true") {
                //全选按钮亮
                $("#targetStatisticsLayer #ships_screen2 a").addClass('chose');
                $("#targetStatisticsLayer .right_radius2").removeClass('chose');
            } else {
                //都不亮
                $("#targetStatisticsLayer #ships_screen2 a").removeClass('chose');
                $("#targetStatisticsLayer .right_radius2").removeClass('chose');
            }

            if (navStatus.layerControlLayer_navStatus_0 == false && navStatus.layerControlLayer_navStatus_1 == false &&
                navStatus.layerControlLayer_navStatus_2 == false && navStatus.layerControlLayer_navStatus_3 == false &&
                navStatus.layerControlLayer_navStatus_4 == false && navStatus.layerControlLayer_navStatus_5 == false &&
                navStatus.layerControlLayer_navStatus_6 == false && navStatus.layerControlLayer_navStatus_7 == false &&
                navStatus.layerControlLayer_navStatus_8 == false && navStatus.layerControlLayer_navStatus_00 == false) {
//清空按钮亮
                $("#targetStatisticsLayer #ships_screen3 a").removeClass('chose');
                $("#targetStatisticsLayer .right_radius3").addClass('chose');
            } else if (navStatus.layerControlLayer_navStatus_0 == "0" && navStatus.layerControlLayer_navStatus_1 == 1 &&
                navStatus.layerControlLayer_navStatus_2 == 2 && navStatus.layerControlLayer_navStatus_3 == 3 &&
                navStatus.layerControlLayer_navStatus_4 == 4 && navStatus.layerControlLayer_navStatus_5 == 5 &&
                navStatus.layerControlLayer_navStatus_6 == 6 && navStatus.layerControlLayer_navStatus_7 == 7 &&
                navStatus.layerControlLayer_navStatus_8 == 8 && navStatus.layerControlLayer_navStatus_00 == "zz") {
                //全选按钮亮
                $("#targetStatisticsLayer #ships_screen3 a").addClass('chose');
                $("#targetStatisticsLayer .right_radius3").removeClass('chose');
            } else {
                //都不亮
                $("#targetStatisticsLayer #ships_screen3 a").removeClass('chose');
                $("#targetStatisticsLayer .right_radius3").removeClass('chose');
            }
            allRiskArea.enter = res.enter == "enter" ? "enter" : "false",
                allRiskArea.speed = res.speed == "speed" ? "speed" : "false",
                allRiskArea.navigationalStatus = res.navigationalStatus == "navigationalStatus" ? "navigationalStatus" : "false",
                allRiskArea.fcw = res.fcw == "fcw" ? "fcw" : "false",
                allRiskArea.fcwMonitor = res.fcwMonitor == "fcwMonitor" ? "fcwMonitor" : "false"
            if (allRiskArea.fcwMonitor == "false") {
                fcwLayer.clearLayers();
                fcwShipFlushIndex = false;
            } else {
                fcwShipFlushIndex = true;
                // alertTable();
                // alertForm();
                getFcwShip();
            }
            form.render();
        }
        // 初始化地图中心点和缩放级别
        map = L.map('map',
            {
                center: [latitude, longitude],
                zoom: level,
                zoomControl: false,
                editable: true,
                maxZoom: 18,
                minZoom: 1
            });
        map.getPane('overlayPane').style.zIndex = 405;
        // 预警围栏
        map.createPane('fencewarn').style.zIndex = 404;
        // 船舶
        map.createPane('ship').style.zIndex = 405;

        //  mapCurrentLevel = res.level;
        mapCurrentLevel = level;
        // 初始化地图
        initMap()
        initElectronicFenceNewDefence(map, admin,form);
        getWarningArea(map, admin, allRiskArea);

        // 初始化Layui
        initLayui();
        initWatchForElectronicFence();
        // 获取船舶数据
        getShipData();

        //查询我关注船舶
        getMyCareShips();

        // cctv = new layui.cctv(map, isMarkerOverlay);
        // if ($("input[name='layerControlLayer_cctv']").prop("checked")) {
        //     cctv.enable(map);
        // }

        // 二十秒定时刷新船舶数据
        shipInterval = window.setInterval(getShipData, 20000);
        // 二十秒定时刷新视频数据
        cctvInterval = window.setInterval(getCctvData, 20000);
        // 五分钟定时刷新岸站数据
        stationInterval = window.setInterval(getStationData, 60000);
        // 定时刷新水文气象数据
        hymeInterval = window.setInterval(getDetailHymeDataNow, 30000);
    }, 'POST');

    function ToDegrees(val) {
        if(val != null && val != ''){
            ///<summary>将度转换成为度分秒</summary>
            val = Math.abs(val);  //返回数的绝对值
            var v1 = Math.floor(val);//度   //对数进行下舍入
            var v2 = Math.floor((val - v1) * 60);//分
            var v3 = Math.round((val - v1) * 3600 % 60);//秒  //把数四舍五入为最接近的整数
            return v1 + '°' + v2 + '′' + v3 + '″';
        }else{
            return '0°0′0″';
        }
    }

    function initMap() {
        tileLayer = mapChangeInit(mapType, map, tileLayer, config.seamap_server, function (res, _tileLayer) {
            tileLayer = _tileLayer;
            saveUserCenter('map', res);
        });

        // 鼠标当前经纬度显示
        L.control.mousePosition({
            position: 'bottomleft',
            separator: '  ',
            emptyString:ToDegrees(defaultLat)+'N'+' '+ToDegrees(defaultLng)+'E',
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

            // 地图当前缩放级别
            mapCurrentLevel = map.getZoom();
            if ($(".map_layer0")[0].innerText == "海图") {
                var CSVALUE = tileLayer.wmsParams.CSVALUE;
                if (mapCurrentLevel >= limitZoom) {
                    if(CSVALUE != '100000,5,20,10,1,2,1,500000,100000,200000,1') {
                        tileLayer.setParams({CSVALUE: '100000,5,20,10,1,2,1,500000,100000,200000,1'}, false);
                    }
                } else if (mapCurrentLevel < limitZoom) {
                    if(CSVALUE != '100000,5,20,10,2,1,1,500000,100000,200000,1') {
                        tileLayer.setParams({CSVALUE: '100000,5,20,10,2,1,1,500000,100000,200000,1'}, false);
                    }
                }
            }

            $('#setCenter_level').val(mapCurrentLevel);
            // 获取船舶数据
            getShipData();
            // 获取岸站数据
            getStationData();
            // 获取水文气象数据
            getHymeData();
            // 名称显示选项是否可用
            nameShowOptionSet();

            //碰撞列表
            // table.reload('collisionMonitor-table', {});
            //碰撞预警
            getFcwShip();

        })

        // 名称显示选项是否可用
        nameShowOptionSet();

        // 获取船舶数据
        getShipData();
        //碰撞列表
        // table.reload('collisionMonitor-table', {});
        //碰撞预警
        getFcwShip();

        // 获取水文气象数据
        getHymeData();
        // 岸站数据
        getStationData();

        //视频点位
        getCctvData('0');

        // 中心点拖拽
        centerPosition.on('dragend', function (event) {
            var position = centerPosition.getLatLng();
            $('#setCenter_lat').dfm().val(position.lat);
            $('#setCenter_lng').dfm().val(position.lng);
        })
    }

    function initLayui() {
        // 获取当前日期
        var currentDate = new Date();
        // 减去六个月
        currentDate.setMonth(currentDate.getMonth() - 6);
        // 格式化日期为YYYY-MM-DD
        var year = currentDate.getFullYear();
        var month = (currentDate.getMonth() + 1);
        var day = currentDate.getDate();
        var previousMonthDate = year + '-' + month + '-' + day;

        // 获取当前日期的23:59:59
        var endDate = new Date(currentDate.setHours(23, 59, 59));

        // 轨迹回放页面--日期选择
        laydate.render({
            elem: '#trackPlayStartTime'
            , type: 'datetime'
            , max: endDate  + 0
            , min : previousMonthDate + ' 00:00:00'
            ,isInitValue: false
            ,done: function (value, date) {
            }
            // 处理 "现在" 按钮的点击事件
            ,ready: function (date) {
                this.done("1900-01-01 00:00:00");
            }
        });
        laydate.render({
            elem: '#trackPlayEndTime'
            , type: 'datetime'
            , max: endDate  + 0
            , min : previousMonthDate + ' 00:00:00'
            ,isInitValue: false
            ,done: function (value, date) {
            }
            // 处理 "现在" 按钮的点击事件
            ,ready: function (date) {
                this.done("1900-01-01 00:00:00");
            },
        });

        // 船舶详情打开的轨迹回放页面--日期选择
        laydate.render({
            elem: '#trackShipPlayStartTime'
            , type: 'datetime'
            , max: endDate  + 0
            , min : previousMonthDate + ' 00:00:00'
            ,isInitValue: false
            ,done: function (value, date) {
            }
            // 处理 "现在" 按钮的点击事件
            ,ready: function (date) {
                this.done("1900-01-01 00:00:00");
            }
        });
        laydate.render({
            elem: '#trackShipPlayEndTime'
            , type: 'datetime'
            , max: endDate  + 0
            , min : previousMonthDate + ' 00:00:00'
            ,isInitValue: false
            ,done: function (value, date) {
            }
            // 处理 "现在" 按钮的点击事件
            ,ready: function (date) {
                this.done("1900-01-01 00:00:00");
            },
        });

        // laydate.render({
        //     elem: '#trackPlayEndTime'
        //     , type: 'datetime'
        //     , max: Date.now()
        // });
        // laydate.render({
        //     elem: '#trackPlayStartTime'
        //     , type: 'datetime'
        //     , max: Date.now()
        // });
        // laydate.render({
        //     elem: '#trackShipPlayStartTime'
        //     , type: 'datetime'
        // });
        // laydate.render({
        //     elem: '#trackShipPlayEndTime'
        //     , type: 'datetime',
        //     max: Date.now()
        // });


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

        $('#saerchMMSIorName').blur(function () {
            setTimeout(function () {
                $("#autoComplete").css("display", "none")
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
                for (var i in shipDataAll) {
                    if (shipDataAll[i].mmsi == val || shipDataAll[i].name == val) {
                        autoCompleteClick(val, "SHIP");
                        return;
                    }
                }
                for (var i in stationData) {
                    if (stationData[i].mmsi == val || stationData[i].name == val) {
                        autoCompleteClick(val, "STATION");
                        return;
                    }
                }
                for (var i in stationData) {
                    if (stationData[i].mmsi == val || stationData[i].name == val) {
                        autoCompleteClick(val, "tt");
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
            var arr = ['virtualAtoNLayerIndex', 'fleetShipLayerIndex', 'fleetLayerIndex', 'fleetSendMessageIndex', 'shipTimeLayerIndex', 'fleetInfoDetailIndex', 'electronicFenceLayerIndex', 'markerTableLayer'];
            rejectLayer(arr);
            data = data.elem.name;
            // $(this).parent().find(".active").removeClass("active");
            // $(this).addClass("active");
            navigationBoxClick(data);
        });


        //fss0131
        // ais类型切换
        form.on('switch(targetStatisticsLayer_aisType)', function (data) {
            if ($("input[name='targetStatisticsLayer_aisType']:checked").length) {
                if ($("input[name='targetStatisticsLayer_aisType']:checked").length == 2) {
                    layerControlLayer_aisType = 'AB'
                    //全选按钮亮
                    $("#targetStatisticsLayer #ships_screen1 a").addClass('chose');
                    $("#targetStatisticsLayer .right_radius1").removeClass('chose');
                } else {
                    layerControlLayer_aisType = $("input[name='targetStatisticsLayer_aisType']:checked").val();
                    //都不亮
                    $("#targetStatisticsLayer #ships_screen1 a").removeClass('chose');
                    $("#targetStatisticsLayer .right_radius1").removeClass('chose');
                }
            } else {
                layerControlLayer_aisType = ''
                //清空按钮亮
                $("#targetStatisticsLayer #ships_screen1 a").removeClass('chose');
                $("#targetStatisticsLayer .right_radius1").addClass('chose');
                // 其他图层关闭
                // var arr = ['shipLayer', 'shipPointLayer', 'shipNameLayer', 'shipDetailLayer', 'selectedShipLayer'];
                // rejectLayer(arr);
                // var str = '【显示范围】' + 0 + '艘';
                // $('#dataCount').html(str);
                // if ($("#allList_left").css("display") == "block") {
                //     table.reload('shipList', {
                //         data: [],
                //         initSort: {
                //             field: shipTableSortName
                //             , type: shipTableSortDesc
                //         }
                //     });
                // }
                // form.render('checkbox');
            }
            getShipData();
            form.render('checkbox');
            saveUserCenter('layer');
        });

        // 船舶类型切换
        form.on('switch(targetStatisticsLayer_shipType_30)', function (data) {
            shipType.layerControlLayer_shipType_30 = $("input[name='targetStatisticsLayer_shipType_30']:checked").val() == 30 ? "30" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(targetStatisticsLayer_shipType_31)', function (data) {
            shipType.layerControlLayer_shipType_31 = $("input[name='targetStatisticsLayer_shipType_31']:checked").val() == 31 ? "31" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(targetStatisticsLayer_shipType_35)', function (data) {
            shipType.layerControlLayer_shipType_35 = $("input[name='targetStatisticsLayer_shipType_35']:checked").val() == 35 ? "35" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(targetStatisticsLayer_shipType_50)', function (data) {
            shipType.layerControlLayer_shipType_50 = $("input[name='targetStatisticsLayer_shipType_50']:checked").val() == 50 ? "50" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(targetStatisticsLayer_shipType_51)', function (data) {
            shipType.layerControlLayer_shipType_51 = $("input[name='targetStatisticsLayer_shipType_51']:checked").val() == 51 ? "51" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(targetStatisticsLayer_shipType_53)', function (data) {
            shipType.layerControlLayer_shipType_53 = $("input[name='targetStatisticsLayer_shipType_53']:checked").val() == 53 ? "53" : false
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(targetStatisticsLayer_shipType_55)', function (data) {
            shipType.layerControlLayer_shipType_55 = $("input[name='targetStatisticsLayer_shipType_55']:checked").val() == 55 ? "55" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(targetStatisticsLayer_shipType_60)', function (data) {
            shipType.layerControlLayer_shipType_60 = $("input[name='targetStatisticsLayer_shipType_60']:checked").val() == 60 ? "60" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(targetStatisticsLayer_shipType_70)', function (data) {
            shipType.layerControlLayer_shipType_70 = $("input[name='targetStatisticsLayer_shipType_70']:checked").val() == 70 ? "70" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(targetStatisticsLayer_shipType_80)', function (data) {
            shipType.layerControlLayer_shipType_80 = $("input[name='targetStatisticsLayer_shipType_80']:checked").val() == 80 ? "80" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(targetStatisticsLayer_shipType_00)', function (data) {
            shipType.layerControlLayer_shipType_00 = $("input[name='targetStatisticsLayer_shipType_00']:checked").val() == "zz" ? "zz" : false;
            getShipData();
            saveUserCenter('layer');
        });
        // 船舶航行状态切换
        form.on('switch(layerControlLayer_navStatus_0)', function (data) {
            navStatus.layerControlLayer_navStatus_0 = $("input[name='layerControlLayer_navStatus_0']:checked").val() == "0" ? "0" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(layerControlLayer_navStatus_1)', function (data) {
            navStatus.layerControlLayer_navStatus_1 = $("input[name='layerControlLayer_navStatus_1']:checked").val() == 1 ? "1" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(layerControlLayer_navStatus_2)', function (data) {
            navStatus.layerControlLayer_navStatus_2 = $("input[name='layerControlLayer_navStatus_2']:checked").val() == 2 ? "2" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(layerControlLayer_navStatus_3)', function (data) {
            navStatus.layerControlLayer_navStatus_3 = $("input[name='layerControlLayer_navStatus_3']:checked").val() == 3 ? "3" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(layerControlLayer_navStatus_4)', function (data) {
            navStatus.layerControlLayer_navStatus_4 = $("input[name='layerControlLayer_navStatus_4']:checked").val() == 4 ? "4" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(layerControlLayer_navStatus_5)', function (data) {
            navStatus.layerControlLayer_navStatus_5 = $("input[name='layerControlLayer_navStatus_5']:checked").val() == 5 ? "5" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(layerControlLayer_navStatus_6)', function (data) {
            navStatus.layerControlLayer_navStatus_6 = $("input[name='layerControlLayer_navStatus_6']:checked").val() == 6 ? "6" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(layerControlLayer_navStatus_7)', function (data) {
            navStatus.layerControlLayer_navStatus_7 = $("input[name='layerControlLayer_navStatus_7']:checked").val() == 7 ? "7" : false
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(layerControlLayer_navStatus_8)', function (data) {
            navStatus.layerControlLayer_navStatus_8 = $("input[name='layerControlLayer_navStatus_8']:checked").val() == 8 ? "8" : false;
            getShipData();
            saveUserCenter('layer');
        });
        form.on('switch(layerControlLayer_navStatus_00)', function (data) {
            navStatus.layerControlLayer_navStatus_00 = $("input[name='layerControlLayer_navStatus_00']:checked").val() == "zz" ? "zz" : false;
            getShipData();
            saveUserCenter('layer');
        });
        //fss0131
        // 船舶名称切换
        form.on('switch(layerControlLayer_shipName)', function (data) {
            if (data.elem.checked == true) {
                drawShipName();
            } else if (data.elem.checked == false) {
                var arr = ['shipNameLayer'];
                rejectLayer(arr);
            }
            saveUserCenter('layer');
        });

        // 岸站显示切换
        form.on('switch(layerControlLayer_stationShow)', function (data) {
            if (data.elem.checked == true) {
                drawStation(stationData);
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


        // 风险预警区域
        form.on('switch(layerControlLayer_riskArea)', function (data) {
            allRiskArea.enter = $("input[name='layerControlLayer_riskArea']:checked").val();
            getWarningArea(map, admin, allRiskArea);
            saveUserCenter('layer');
        });
        // 速度偏离正常范围预警区域
        form.on('switch(layerControlLayer_speedDeviation)', function (data) {
            allRiskArea.speed = $("input[name='layerControlLayer_speedDeviation']:checked").val();
            getWarningArea(map, admin, allRiskArea);
            saveUserCenter('layer');
        });
        // 非正常抛锚预警区域
        form.on('switch(layerControlLayer_abnormalAnchor)', function (data) {
            allRiskArea.navigationalStatus = $("input[name='layerControlLayer_abnormalAnchor']:checked").val();
            getWarningArea(map, admin, allRiskArea);
            saveUserCenter('layer');
        });
        // 疑似碰撞预警区域
        form.on('switch(layerControlLayer_collision)', function (data) {
            allRiskArea.fcw = $("input[name='layerControlLayer_collision']:checked").val();
            getWarningArea(map, admin, allRiskArea);
            saveUserCenter('layer');
        });
        // 疑似碰撞监控展示
        form.on('switch(layerControlLayer_collisionMonitor)', function (data) {
            if (data.elem.checked == true) {
                // alertTable();
                // alertForm();
                fcwShipFlushIndex = true;
                getFcwShip();
                form.render('checkbox');
            } else if (data.elem.checked == false) {
                // 其他图层关闭
                var arr = ['fcwLayer'];
                fcwShipFlushIndex = false;
                rejectLayer(arr);
                form.render('checkbox');
            }
            saveUserCenter('layer');
        });
        // 水文气象显示切换
        form.on('switch(layerControlLayer_hyme)', function (data) {
            if (data.elem.checked == true) {
                // drawHyme(hymeData);
                // drawHymeMiniDetail(hymeData);
                // setInterval( drawHymeMiniDetail(hymeData),100000);
                $('#layerControlLayer_hyme_id').removeAttr("disabled");
                form.render('checkbox')
            } else if (data.elem.checked == false) {
                // 其他图层关闭
                var arr = ['hymeLayer', 'hymeDetailLayer'];
                rejectLayer(arr);
                form.render('checkbox');
            }
            saveUserCenter('layer');
        });

        // 监听详细画面内按钮
        form.on('submit(showTargetLayer)', function (data) {
            data = data.elem.name;
            showTargetLayer(data);
        });

        // 监听轨迹回放
        form.on('submit(shipTrackPlayBack)', function (data) {
            data = data.elem.name;
            shipTrackPlayBack(data, '');
        });


        // 监听删除指定船的轨迹
        form.on('submit(closeTrackList)', function (data) {
            var mmsi = data.elem.id;
            closeTrackList(mmsi);
        });

        // 监听测距按钮
        form.on('submit(measureDistance)', function (data) {
            if (no_close_model == 1) {
                layer.confirm('已编辑的内容还未保存，是否继续？', function (i) {
                    no_close_model = 0
                    setmeasureDistance()
                })
            }else{
                setmeasureDistance()
            }

            function setmeasureDistance() {
                layer.closeAll()
                var arr = ['electronicFenceLayerCustomIndex', 'virtualAtoNLayerIndex', 'virtualAtoNControl_id', 'electronicHistoryLayer', 'electronicAlertLayer', 'heatmapLayer',
                    'navigationBoxLayer', 'targetLayer', 'hymeSelect', 'hymeHistorySelect', 'trackplaybackControl', 'stationCoverageLayer', 'owmStationLayer', 'virtualAtoNLayerIndex'];
                rejectLayer(arr);

                if (!isDistancing) {
                    isDistancing = true;
                    isPositionSetting = false;
                    // $("#measureDistance")[0].style.color = "#ffb300"
                    no_close_model = 2;
                    measure();
                } else {
                    isDistancing = false;
                    no_close_model = 0;
                    // 其他图层关闭
                    var arr = ['setCenterLayer', 'measureLayer', 'legendLayer'];
                    rejectLayer(arr);
                }
            }
        });

        // 监听设置中心点按钮
        form.on('submit(centerPositionSet)', function (data) {
            if (!setCenterLayer && no_close_model == 1) {
                layer.confirm('已编辑的内容还未保存，是否继续？', function (i) {
                    no_close_model = 0
                    setmeasureDistance()
                })
            } else if (!setCenterLayer && no_close_model == 2) {
                layer.confirm('是否清空已编辑的内容？', function (i) {
                    no_close_model = 0
                    setmeasureDistance()
                })
            } else {
                setmeasureDistance()
            }

            function setmeasureDistance() {
                if (!isPositionSetting) {
                    layer.closeAll()
                    var arr = ['electronicFenceLayerCustomIndex', 'virtualAtoNLayerIndex', 'virtualAtoNControl_id', 'electronicHistoryLayer', 'electronicAlertLayer', 'heatmapLayer',
                        'navigationBoxLayer', 'targetLayer', 'hymeSelect', 'hymeHistorySelect', 'trackplaybackControl', 'stationCoverageLayer', 'owmStationLayer', 'virtualAtoNLayerIndex', 'measureLayer'];
                    rejectLayer(arr);

                    isPositionSetting = true;
                    isDistancing = false;
                    // $("#centerPositionSet")[0].style.color = "#ffb300"
                    setCenterPosition();
                } else {
                    isPositionSetting = false;
                    // 其他图层关闭
                    var arr = ['setCenterLayer', 'measureLayer', 'legendLayer'];
                    rejectLayer(arr);
                }
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
                var arr = ['setCenterLayer', 'measureLayer', 'legendLayer'];
                rejectLayer(arr);
            }
        });
        form.on('submit(overlapStationChoose)', function (data) {

            let currentDom = $(data.elem);
            if (currentDom.attr("parent-type") === "cctv") {
                var arr = ['cctvDetailLayer', 'radarDetailLayer', 'hymeInfoDetailLayer', 'stationDetailLayer', 'heatmapLayer', 'shipDetailLayer', 'selectedShipLayer', 'targetLayer', 'atonDetailLayer', 'stationCoverageLayer', 'owmStationLayer', 'fishingNetDetailLayer', 'cctvLayer', 'vhfDetailLayer'];
                // closeLayer(arr);
                // cctv.showCctv(data.elem.id);
                cctv.showVideoDialog(data.elem.name);
                // cctv.showHIK(data.elem.name);
            }else{
                var chooseMmsi = data.elem.name;
                showStationDetail(chooseMmsi);
                stationPopup.remove();
            }
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


        var downNone1 = document.getElementById("down-none1");
        downNone1.removeChild(downNone1.getElementsByTagName('i')[0]);

        // 用户退出信息
        form.on('submit(userExit)', function () {
            if (no_close_model == 1) {
                layer.confirm('已编辑的内容还未保存，是否继续？', function (i) {
                    no_close_model = 0
                    setmeasureDistance()
                })
            } else if (no_close_model == 2) {
                layer.confirm('是否清空已编辑的内容？', function (i) {
                    no_close_model = 0
                    setmeasureDistance()
                })
            } else {
                setmeasureDistance()
            }

            function setmeasureDistance() {
                layer.closeAll()
                var arr = ['electronicFenceLayerCustomIndex', 'virtualAtoNLayerIndex', 'virtualAtoNControl_id', 'electronicHistoryLayer', 'electronicAlertLayer', 'heatmapLayer',
                    'navigationBoxLayer', 'targetLayer', 'hymeSelect', 'hymeHistorySelect', 'trackplaybackControl', 'stationCoverageLayer', 'owmStationLayer', 'virtualAtoNLayerIndex', 'measureLayer'];
                rejectLayer(arr);

                layer.confirm('确定退出登录？', function () {
                    config.removeToken();
                    window.open('/login.html', "_self");
                });
            }
        });
        // $("#electronicFenceControl").click(function () {
        //     var arr = ['electronicHistoryLayer', 'electronicAlertLayer', 'heatmapLayer',
        //         'navigationBoxLayer', 'targetLayer', 'trackplaybackControl', 'owmStationLayer', 'virtualAtoNLayerIndex'];
        //     rejectLayer(arr);
        //     if (window.electronicFenceLayerCustomIndex) {
        //         layer.close(window.electronicFenceLayerCustomIndex)
        //         window.electronicFenceLayerCustomIndex = ""
        //         return;
        //     }
        //     openElectronicFenceTable(map, admin, table, config, form, laytpl)
        // })


        // $("#eFenceAlert").click(function () {
        //     var arr = ['electronicAlertLayer','virtualAtoNLayerIndex','virtualAtoNControl_id','electronicFenceLayerCustomIndex', 'electronicHistoryLayer', 'heatmapLayer',
        //         'navigationBoxLayer', 'targetLayer', 'trackplaybackControl', 'stationCoverageLayer', 'owmStationLayer', 'virtualAtoNLayerIndex'];
        //     rejectLayer(arr);
        //     if (window.electronicAlertLayer) {
        //         layer.close(window.electronicAlertLayer)
        //         window.electronicAlertLayer = ""
        //         return;
        //     }
        //     eFenceAlert(map, admin, table, config, form, laytpl)
        // })
    }

    var maxDateNumber = '';
    var minDateNumber = '';
    maxDate();
    minDate();
    laydate.render({
        elem: '#warningTime',
        type: 'datetime',
        format: 'yyyy/MM/dd HH:mm:ss',
        range: true,
        max: maxDateNumber,
        value: minDateNumber + " 00:00:00 - " + maxDateNumber + " 00:00:00",
        done: function (date) {
            this.value = date;
            this.elem.val(date);
        }
    });

    function maxDate() {
        var now = new Date();
        var month = (now.getMonth() + 1);
        var day = now.getDate();
        if ((now.getMonth() + 1) < 10) {
            month = "0" + (now.getMonth() + 1)
        }
        if (now.getDate() < 10) {
            day = "0" + now.getDate()
        }
        maxDateNumber = now.getFullYear() + "/" + month + "/" + day;
        return maxDateNumber;
    }

    function minDate() {
        var now = new Date()
        var year = now.getFullYear();
        var month = now.getMonth() + 1;
        var day = now.getDate();
        var nowMonthDay = new Date(year, month, 0).getDate(); // 当前月的总天数
        if (month - 1 <= 0) {
            if (day < 10) {
                day = "0" + now.getDate()
            }
            minDateNumber = year - 1 + "/" + 12 + "/" + day; // 如果是1月，年数往前推一年;
            return minDateNumber;
        }


        var lastMonthDay = new Date(year, parseInt(month) - 1, 0).getDate();
        if (lastMonthDay >= day) {
            if ((month - 1) < 10) {
                month = "0" + (month - 1);
            }
            if (day < 10) {
                day = "0" + day;
            }
            minDateNumber = year + "/" + month + "/" + day;
            return minDateNumber
        }
        if (day < nowMonthDay) {
            if ((month - 1) < 10) {
                month = "0" + (month - 1);
            }
            if ((lastMonthDay - (nowMonthDay - day)) < 10) {
                day = "0" + (lastMonthDay - (nowMonthDay - day));
            }
            minDateNumber = year + "/" + month + "/" + day;
            return minDateNumber;
        }// 1个月前所在月的总天数小于现在的天日期
        if ((month - 1) < 10) {
            month = "0" + (month - 1);
        }
        if (lastMonthDay < 10) {
            day = "0" + lastMonthDay;
        }
        minDateNumber = year + "/" + month + "/" + day
        return minDateNumber;
    }

    //fss0131
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
            aisType: layerControlLayer_aisType,
            shipType: shipType,
            navStatus: navStatus,
            shipTimeShow: layerControlLayer_shipTimeShow,
            isShowRadarShip: isShowRadarShip,
        };
        admin.reqNoLoad('shipDynamicStatic-api/getShipInfo', JSON.stringify(data), function (res) {
            // 船舶数据更新
            shipData = res.ships;
            shipCount = res.cnt;
            if ($("#allList_left_middle ul li")[0].className == "layui-this") {
                const arr = shipData.filter(e => e?.radarType != 2) || []
                var str = '【显示范围】' + arr.length + '艘';
                $('#dataCount').html(str);
                // 实时数据
                getShipsCount(admin);
            }
            if ($("#allList_left_middle ul li")[1].className == "layui-this") {
                const arr = shipData.filter(e => e?.radarType == 2) || []
                var str = '【显示范围】' + arr.length + '个';
                $('#dataCount').html(str);
            }
            if (heatmapLayer == null &&
                stationCoverageLayer == null
                // && ($("input[name='targetStatisticsLayer_aisType']:checked").length > 0)
                && trackListLayer == null) {
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
                        data: shipData.filter(e => e?.radarType != 2) || [],
                        initSort: {
                            field: shipTableSortName
                            , type: shipTableSortDesc
                        }
                    });
                    table.reload('radarTargetList', {
                        data: shipData.filter(e => e?.radarType == 2) || [],
                        initSort: {
                            field: shipTableSortName
                            , type: shipTableSortDesc
                        }
                    });
                }
            }
        }, 'POST');
    }

    var fcwShipList = {};

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
            let fcwModel;
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
            //我关注船舶
            if (myCareShips != undefined && myCareShips.indexOf(info.mmsi) > -1) {
                shipColor = "#b1fb06";
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
                    weight: 2,
                    opacity: 1,
                    fillOpacity: fillOpacityOp,
                    fillRule: "nonzero",
                    radarType: info.radarType,
                    pane: 'ship'
                });

                // var name = info.ename == null ? "" : info.ename;
                var name = info.cname != "" ? info.cname : info.ename == null ? "" : info.ename;
                ship.bindTooltip("船名： " + name + "</br>MMSI：" + info.mmsi + "</br>船速： " + info.speed + "", {
                    className: "shiptip"
                }).openTooltip();

                ship.on("click", function () {
                    if (info.radarType != 2) {
                        selectedShipMMSI = info.mmsi;
                        layer.close(shipDetailLayer)
                        shipDetailLayer = null;
                        showShipDetail(info.mmsi);
                    } else {
                        selectedShipMMSI = info.ename;
                        layer.close(shipDetailLayer)
                        shipDetailLayer = null;
                        showRadarTtDetail(info.ename);
                    }
                });
                ship.addTo(shipLayer);
            } else if (!onlyShowMyCareShip) {
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
                    weight: 2,
                    opacity: 1,
                    fillOpacity: fillOpacityOp,
                    fillRule: "nonzero",
                    radarType: info.radarType,
                    pane: 'ship'
                });

                // var name = info.ename == null ? "" : info.ename;
                // var name = info.cname != "" ? info.cname : info.ename == null ? "" : info.ename;
                let name = "";
                if (info.cname != null && info.cname != "") {
                    name = info.cname;
                } else if (info.ename != null) {
                    name = info.ename;
                }
                //  ship.bindTooltip("船名： " + name + "</br>MMSI：" + info.mmsi + "</br>船速： " + info.speed).openTooltip();
                ship.bindTooltip("船名： " + name + "</br>MMSI：" + info.mmsi + "</br>船速： " + info.speed + "", {
                    className: "shiptip"
                }).openTooltip();
                ship.on("click", function () {
                    if (info.radarType != 2) {
                        selectedShipMMSI = info.mmsi;
                        layer.close(shipDetailLayer)
                        shipDetailLayer = null;
                        showShipDetail(info.mmsi);
                    } else {
                        selectedShipMMSI = info.ename;
                        layer.close(shipDetailLayer)
                        shipDetailLayer = null;
                        showRadarTtDetail(info.ename);
                    }
                });
                ship.addTo(shipLayer);
            }
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
            if (myCareShips != undefined && myCareShips.indexOf(info.mmsi) > -1) {
                shipColor = "#b1fb06";
                var ship;
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
                    fillOpacity: 1,
                    fillRule: "nonzero",
                    radarType: info.radarType,
                    pane: 'ship'
                });
                // var name = info.ename == null ? "" : info.ename;
                var name = info.cname != "" ? info.cname : info.ename == null ? "" : info.ename;
                ship.bindTooltip("船名： " + name + "</br>MMSI：" + info.mmsi + "</br>船速： " + info.speed + "", {
                    className: "shiptip"
                }).openTooltip();
                ship.on("click", function () {
                    selectedShipMMSI = info.mmsi;
                    showShipDetail(info.mmsi);
                });
                ship.addTo(shipPointLayer);
            } else if (!onlyShowMyCareShip) {

                point = L.circle([info.lat, info.lng], {
                    color: shipColor,
                    fillColor: shipColor,
                    radius: 60,
                    fillOpacity: 1,
                    pane: 'ship'
                }).addTo(map)
                point.addTo(shipPointLayer);
            }
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
            if ($("#allList_left_middle ul li")[2].className == "layui-this") {
                var str = '【显示范围】' + stationCount + '个';
                $('#dataCount').html(str);
            }
            // 清空实时基站列表
            stationList = [];
            stationDisconnect = false;
            if (heatmapLayer == null && stationCoverageLayer == null && ($('input[name="layerControlLayer_stationShow"]').prop('checked') == true)) {
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
        var size
        if (map.getZoom() <= limitZoom) {
            size = 25;
        } else {
            size = 35;
        }
        $.each(data, function (infoIndex, info) {
            var iconUrl = "../../assets/images/disconnect_0.png";
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
            if (info.latitude != 0 && info.longitude != 0) {
                station = new L.marker([info.latitude, info.longitude], {
                    icon: stationImg,
                    zIndexOffset: info.status == 1 ? 0 : info.ownFlg == 0 ? 9999 : 10,
                    attribution: info.mmsi
                });
            }

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
                if (!isMarkerOverlay(e)) {
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

    function getTimeList() {
        TimeList = [];
        $("#selectTime").empty();
        // layui.form.render("select");
        $.ajax({
            url: config.base_server + 'hyme-api/getHymeTime',
            type: 'POST',
            success: function (res) {
                TimeList = res.data;
                for (var i = 0; i < res.data.length; i++) {
                    if (i == 0) {
                        $("#selectTime").append("<option value=\"" + TimeList[0] + "\" selected>" + getformatData(TimeList[0]) + "</option>");
                    } else {
                        $("#selectTime").append("<option value=\"" + TimeList[i] + "\">" + getformatData(TimeList[i]) + "</option>");
                    }
                }
                //重新渲染
                layui.form.render("select");
            }
        });
    }

    function getformatData(time) {
        var date = new Date(time);
        var Y = date.getFullYear() + "-";
        var M =
            (date.getMonth() + 1 < 10
                ? "0" + (date.getMonth() + 1)
                : date.getMonth() + 1) + "-";
        var D = (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + " ";
        var h = (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) + ":";
        var m = (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) + ":";
        var s = (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds());
        return M + D + h + m + s;
    }

    // 获取实时水文气象数据
    function getHymeData() {
        admin.reqNoLoad('hyme-api/getHymeInfo', '', function (res) {
            hymeData = res.data;
            hymeCount = res.cnt;
            hymeList = [];
            if (heatmapLayer == null && stationCoverageLayer == null && ($('input[name="layerControlLayer_hyme"]').prop('checked') == true)) {
                // 海图页面显示
                // drawHyme(hymeData);
                // drawHymeMiniDetail(hymeData);
            }
        }, 'POST')
    }

    function drawHyme(data) {
        // 图层移除
        var arr = ['hymeLayer'];
        rejectLayer(arr);
        var hyme;
        var popup;
        var size = (mapCurrentLevel + 1) * 4
        var iconUrl = '../../assets/images/selfHyme.png';
        var timestamp = 0;
        var datas = {
            timeStamp: timestamp
        };
        var hymeMiniDetailData = [];
        $.each(data, function (infoIndex, info) {
            var hymeImg = L.icon({
                iconUrl: iconUrl,
                iconSize: [size, size]
            });
            hyme = new L.marker([info.latitude, info.longitude], {icon: hymeImg})
            admin.reqNoLoad('hyme-api/getHymeMiniDetail', JSON.stringify(datas), function (zxz) {
                if (zxz.datas == null) {

                    var initdatas = {
                        waterDepth: "-- m",
                        airTemperature: "-- ℃",
                        waterTemperature: "-- ℃",
                        waterVelocity: "-- m/s",
                        windSpeed: "-- m/s",
                        airHumidity: "-- %",
                        atmoPressure: "-- kPa",
                        emptyHeightFloat: "-- m",
                        waterDepthFloat: "-- m",
                    }
                    hymeMiniDetailData = initdatas;
                } else {
                    hymeMiniDetailData = zxz.datas;

                    hymeMiniDetailData.emptyHeightFloat = hymeMiniDetailData.emptyHeightFloat ?? "-- m";
                    hymeMiniDetailData.waterDepthFloat = hymeMiniDetailData.waterDepthFloat ?? "-- m";
                    hymeMiniDetailData.windSpeed = hymeMiniDetailData.windSpeed ?? "-- m/s";
                    hymeMiniDetailData.airTemperature = hymeMiniDetailData.airTemperature ?? "-- ℃";
                    hymeMiniDetailData.airHumidity = hymeMiniDetailData.airHumidity ?? "-- %";
                    hymeMiniDetailData.atmoPressure = hymeMiniDetailData.atmoPressure ?? "-- kPa";
                }
                popup = L.popup({autoPan: false, closeButton: false, closeOnClick: false})
                    .setLatLng([info.latitude, info.longitude])
                    .setContent('<div style="width:100px;">\n' +
                        '\t<p style="margin: 4px 0 0 !important;font-weight:bold; font-size: 11px !important;">空高：\n' +
                        '\t\t<span style="font-size: 11px !important;font-weight:bold;">' + hymeMiniDetailData.emptyHeightFloat + '</span>\n' +
                        '\t</p>\n' +
                        '\t<p style="margin: 4px 0 0 !important;font-weight:bold; font-size: 11px !important;">水深：\n' +
                        '\t\t<span style="font-size: 11px !important;font-weight:bold;">' + hymeMiniDetailData.waterDepthFloat + '</span>\n' +
                        '\t</p>\n' +
                        // '\t<p style="margin: 4px 0 0 !important;font-weight:bold; font-size: 11px !important;">水深：\n' +
                        // '\t\t<span style="font-size: 11px !important;font-weight:bold;">' + hymeMiniDetailData.waterDepth + '</span>\n' +
                        // '\t</p>\n' +
                        // '\t<p style="margin: 4px 0 0 !important;font-weight:bold;font-size: 11px !important;"> 水温：\n' +
                        // '\t\t<span style="font-size: 11px !important;font-weight:bold;">' + hymeMiniDetailData.waterTemperature + '</span>\n' +
                        // '\t</p>\n' +
                        // '\t<p style="margin: 4px 0 0!important;font-weight:bold;font-size: 11px !important;"> 水速：\n' +
                        // '\t\t<span style="font-size: 11px !important;font-weight:bold;">' + hymeMiniDetailData.waterVelocity + '</span>\n' +
                        // '\t</p>\n' +
                        '\t<p style="margin: 4px 0 0!important;font-weight:bold;font-size: 11px !important;"> 风速：\n' +
                        '\t\t<span style="font-size: 11px !important;font-weight:bold;">' + hymeMiniDetailData.windSpeed + '</span>\n' +
                        '\t</p>\n' +
                        '\t<p style="margin: 4px 0 0!important;font-weight:bold;font-size: 11px !important;"> 温度：\n' +
                        '\t\t<span style="font-size: 11px !important;font-weight:bold;">' + hymeMiniDetailData.airTemperature + '</span>\n' +
                        '\t</p>\n' +
                        '\t<p style="margin: 4px 0 0!important;font-weight:bold;font-size: 11px !important;"> 湿度：\n' +
                        '\t\t<span style="font-size: 11px !important;font-weight:bold;">' + hymeMiniDetailData.airHumidity + '</span>\n' +
                        '\t</p>\n' +
                        '\t<p style="margin: 4px 0 0!important;font-weight:bold;font-size: 11px !important;"> 气压：\n' +
                        '\t\t<span style="font-size: 11px !important;font-weight:bold;">' + hymeMiniDetailData.atmoPressure + '</span>\n' +
                        '\t</p>\n' +
                        '</div>').addTo(hymeLayer).openPopup();
            }, 'POST');
            // hyme.on("click", function () {
            //     showHymeDetail();
            // })
            hyme.addTo(hymeLayer);
        });
        map.addLayer(hymeLayer);
    }

    // 显示船舶详情
    function showShipDetail(targetmmsi) {
        clearTimeout(showShipDetail.timeout)
        // 其他图层关闭
        var arr = ['stationDetailLayer', 'shipDetailLayer', 'atonDetailLayer', 'hymeDetailLayer', 'heatmapLayer', 'targetLayer', 'stationCoverageLayer', 'owmStationLayer', 'fishingNetDetailLayer'];
        rejectLayer(arr);
        // 隐藏左侧列表
        hideAllList();
        // 国旗
        var country = targetmmsi.substring(0, 3);
        var data = {
            mmsi: targetmmsi,
        };

        function updateInfo() {
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
                if (res.datas.cname != "") {
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

                let shipLengthWidth = '-';
                const len = res.datas.gpsRefPos1 + res.datas.gpsRefPos2;
                const wid = res.datas.gpsRefPos3 + res.datas.gpsRefPos4;
                if ((len && typeof len === 'number' && !isNaN(len)) && (wid && typeof wid === 'number' && !isNaN(wid))) {
                    shipLengthWidth = `${len >= 511 ? '511+' : len} / ${wid >= 63 ? '63+' : wid}`;
                }
                $("#ship_length_width").val(shipLengthWidth);
                // $("#ship_length_width").val((res.datas.gpsRefPos1 + res.datas.gpsRefPos2) + "/" + (res.datas.gpsRefPos3 + res.datas.gpsRefPos4));
                var Lng = res.datas.lng;
                var LngDu = Math.floor(Lng);
                var LngFen = Math.floor((Lng - LngDu) * 60);
                var LngMiao = Math.floor(((Lng - LngDu) * 60 - LngFen) * 60);
                var lng = LngDu + '°' + LngFen + '′' + LngMiao + '″';
                $("#ship_lng").val(Number(res.datas.lng).toFixed(6) > 180 ? "-" : lng);
                $("#ship_data_source").val(res.datas.radarType == 0 ? "AIS（" + res.datas.smmsi + "）" : res.datas.radarType == 1 ? "融合（" + res.datas.smmsi + "/" + res.datas.radarId + "）" : "雷达（" + res.datas.radarId + "）");
                $("#ship_destination").val(res.datas.destination);
                $("#receiveTime").val(layui.util.toDateString(new Date(res.datas.recvTime), "yyyy-MM-dd HH:mm:ss"));
                if (res.datas.radarType == 1) {
                    $("#thgt").show();
                    $("#ttHeight").val(res?.datas?.ttHeight != 0 ? res?.datas?.ttHeight + "米" : '-');
                } else {
                    $("#thgt").hide();
                }

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
                if (myCareShips != undefined && myCareShips.indexOf(targetmmsi) > -1) {
                    $("#cancleShip").show();
                    $("#careThisShip").hide();
                } else {
                    $("#cancleShip").hide();
                    $("#careThisShip").show();
                }
                if (res.datas.radarType == 2) {
                    $("#shipDetailButton").css('display', 'none');
                } else {
                    $("#shipDetailButton").css('display', 'flex');
                    if (config.getUser() == undefined || config.getUser().roleCode == undefined) {
                        window.open('/login.html', "_self")
                    } else if (config.getUser().roleCode == "yanshi") {
                        $("#targetShipExport").show();
                        $("#sendSafeMsgControl").hide();
                        $("#targetShipSendMessage").hide();
                        $("#playbackTrack").hide();
                        $("#control").show();
                        shoreSendSafeMsg = true;
                    } else if (config.getUser().roleCode == "visitor") {
                        $("#targetShipExport").show();
                        $("#sendSafeMsgControl").hide();
                        $("#targetShipSendMessage").hide();
                        $("#control").hide();
                        $("#playbackTrack").show();
                        shoreSendSafeMsg = false;
                    } else if (config.getUser().roleCode == "yanshiting") {
                        $("#targetShipExport").show();
                        $("#sendSafeMsgControl").show();
                        $("#targetShipSendMessage").hide();
                        $("#control").show();
                        $("#playbackTrack").show();
                    } else {
                        $("#sendSafeMsgControl").show();
                        $("#targetShipSendMessage").show();
                        $("#targetShipExport").show();
                        // $("#targetShipExport").css('display', 'block');
                        $("#control").show();
                        $("#playbackTrack").hide();
                        shoreSendSafeMsg = true;
                    }

                }
                var title = '';
                if (Flags[country] != null) {
                    title += '<span id="shipCountryFlag" style="float: left; height: 28px; width: 45px; background: url(../../assets/images/apiresource-flags/' + Flags[country] + '.png); background-repeat: no-repeat; margin: 3px; line-height: 20px;"></span>';
                }
                title += '<span>船舶详情</span>'
                if (shipDetailLayer == null) {
                    shipDetailLayer = layer.open({
                        type: 1,
                        offset: ['70px', '0'],
                        id: 'shipDetail_id',
                        title: title,
                        content: $("#shipDetailLayer"),
                        btn: '',
                        shade: 0,
                        skin: 'layui-layer-lan shipDetail_id',
                        area: ['600px'],
                        resize: false,
                        end: function () {
                            var arr = ['shipDetailLayer', 'selectedShipLayer', 'targetLayer'];
                            rejectLayer(arr);
                            shipDetailLayer = null;
                            selectedShipMMSI = null;
                            clearTimeout(showShipDetail.timeout)
                        },
                        success: function (layero, index) {
                            layer.style(index, {
                                marginLeft: 5,
                            })
                            selectedShipMMSI = targetmmsi;
                            sendArray = [];
                            sendData = [];

                        },
                        zIndex: 10000
                    });
                }
                // else {
                //     layer.title(title, shipDetailLayer);
                // }
                clearTimeout(showShipDetail.timeout)
                showShipDetail.timeout = setTimeout(updateInfo, 60000);
            }, 'POST');

        }

        updateInfo();
    }

    // 显示船舶详情
    function showRadarTtDetail(ttName) {
        // 其他图层关闭
        var arr = ['radarDetailLayer', 'stationDetailLayer', 'atonDetailLayer', 'heatmapLayer', 'targetLayer', 'stationCoverageLayer', 'owmStationLayer', 'fishingNetDetailLayer'];
        rejectLayer(arr);
        // 隐藏左侧列表
        hideAllList();
        // 国旗
        var country;
        var data = {
            mmsi: "",
            shipName: ttName,
            stationId: "",
        };
        admin.reqNoLoad('shipDynamicStatic-api/getRadarTtDetail', JSON.stringify(data), function (res) {
            if (res.datas.lat == null || res.datas.lng == null) {
                layer.msg("该船舶不在监控范围！", {icon: 2, time: config.msgTime});
                return;
            }
            map.flyTo([res.datas.lat, res.datas.lng], mapCurrentLevel > limitZoom ? mapCurrentLevel : limitZoom + 1);
            selectedShipShow(res.datas.lat, res.datas.lng, res.datas.heading, res.datas.course, res.datas.gpsRefPos1, res.datas.gpsRefPos2, res.datas.gpsRefPos3, res.datas.gpsRefPos4);
            $("#ship_MMSI").val(res.datas.ename);
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

            let shipLengthWidth = '-';
            const len = res.datas.gpsRefPos1 + res.datas.gpsRefPos2;
            const wid = res.datas.gpsRefPos3 + res.datas.gpsRefPos4;
            if ((len && typeof len === 'number' && !isNaN(len)) && (wid && typeof wid === 'number' && !isNaN(wid))) {
                shipLengthWidth = `${len >= 511 ? '511+' : len} / ${wid >= 63 ? '63+' : wid}`;
            }
            $("#ship_length_width").val(shipLengthWidth);
            // $("#ship_length_width").val((res.datas.gpsRefPos1 + res.datas.gpsRefPos2) + "/" + (res.datas.gpsRefPos3 + res.datas.gpsRefPos4));
            var Lng = res.datas.lng;
            var LngDu = Math.floor(Lng);
            var LngFen = Math.floor((Lng - LngDu) * 60);
            var LngMiao = Math.floor(((Lng - LngDu) * 60 - LngFen) * 60);
            var lng = LngDu + '°' + LngFen + '′' + LngMiao + '″';
            $("#ship_lng").val(Number(res.datas.lng).toFixed(6) > 180 ? "-" : lng);
            $("#ship_data_source").val(res.datas.radarType == 0 ? "AIS（" + res.datas.smmsi + "）" : res.datas.radarType == 1 ? "融合（" + res.datas.smmsi + "/" + res.datas.radarId + "）" : "雷达（" + res.datas.radarId + "）");
            $("#ship_destination").val(res.datas.destination);
            $("#receiveTime").val(layui.util.toDateString(new Date(res.datas.recvTime), "yyyy-MM-dd HH:mm:ss"));
            if (res.datas.radarType == 2) {
                $("#thgt").show();
                $("#ttHeight").val(res?.datas?.ttHeight != 0 ? res?.datas?.ttHeight + "米" : '-');
            } else {
                $("#thgt").hide();
            }
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

            $("#quitMyFleet").hide();
            $("#joinMyFleet").hide();

            $("#cancleShip").hide();
            $("#careThisShip").hide();
            if (res.datas.radarType == 2) {
                $("#shipDetailButton").css('display', 'none');
            } else {
                $("#shipDetailButton").css('display', 'flex');
                if (config.getUser() == undefined || config.getUser().roleCode == undefined) {
                    window.open('/login.html', "_self")
                } else if (config.getUser().roleCode == "yanshi") {
                    $("#targetShipExport").show();
                    $("#sendSafeMsgControl").hide();
                    $("#targetShipSendMessage").hide();
                    $("#playbackTrack").hide();
                    $("#control").show();
                    shoreSendSafeMsg = true;
                } else if (config.getUser().roleCode == "visitor") {
                    $("#targetShipExport").show();
                    $("#sendSafeMsgControl").hide();
                    $("#targetShipSendMessage").hide();
                    $("#control").hide();
                    $("#playbackTrack").show();
                    shoreSendSafeMsg = false;
                } else if (config.getUser().roleCode == "yanshiting") {
                    $("#targetShipExport").show();
                    $("#sendSafeMsgControl").show();
                    $("#targetShipSendMessage").hide();
                    $("#control").show();
                    $("#playbackTrack").show();
                } else {
                    $("#sendSafeMsgControl").show();
                    $("#targetShipSendMessage").show();
                    $("#targetShipExport").show();
                    // $("#targetShipExport").css('display', 'block');
                    $("#control").show();
                    $("#playbackTrack").hide();
                    shoreSendSafeMsg = true;
                }
            }

            var title = '';
            if (Flags[country] != null) {
                title += '<span id="shipCountryFlag" style="float: left; height: 28px; width: 45px; background: url(../../assets/images/apiresource-flags/' + Flags[country] + '.png); background-repeat: no-repeat; margin: 3px; line-height: 20px;"></span>';
            }
            title += '<span>船舶详情</span>'
            if (shipDetailLayer == null) {
                shipDetailLayer = layer.open({
                    type: 1,
                    offset: ['-20px', '0'],
                    id: 'shipDetail_id',
                    title: title,
                    content: $("#shipDetailLayer"),
                    btn: '',
                    shade: 0,
                    skin: 'layui-layer-lan',
                    area: ['600px'],
                    resize: false,
                    cancel: function () {
                        var arr = ['shipDetailLayer', 'selectedShipLayer', 'targetLayer'];
                        rejectLayer(arr);
                    },
                    success: function (layero, index) {
                        layer.style(index, {
                            marginLeft: 5,
                            marginTop: 110
                        })
                    },
                    zIndex: 10000
                });
            } else {
                layer.title(title, shipDetailLayer);
            }
        }, 'POST');
    }

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
        drawShip(shipData);
    }

    // 显示岸站详细
    function showStationDetail(targetmmsi) {
        // 其他图层关闭
        var arr = ['heatmapLayer', 'shipDetailLayer', 'selectedShipLayer', 'targetLayer', 'hymeDetailLayer', 'atonDetailLayer', 'stationCoverageLayer', 'owmStationLayer', 'fishingNetDetailLayer'];
        rejectLayer(arr);
        // 隐藏左侧列表
        hideAllList();
        var data = {
            mmsi: targetmmsi,
        };
        // 断连得基站无需请求后台（断连无数据）
        var count = 0;
        if (stationList.length != 0) {
            for (var index in stationList) {
                if (targetmmsi == stationList[index].mmsi) {
                    if (stationList[index].status == 4 || stationList[index].status == 2) {
                        stationDisconnect = true;
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
                if (res.datas == null || res.datas.lat == null || res.datas.lng == null) {
                    layer.msg("web接口返回值异常，经纬度为空！", {icon: 2, time: config.msgTime});
                    return;
                }
                if (res.datas.lat > 180) {
                    res.datas.lat = res.datas.lat / 600000;
                    res.datas.lng = res.datas.lng / 600000
                }
                map.flyTo([res.datas.lat, res.datas.lng], mapCurrentLevel);
                var ownFlg = res.datas.ownFlg == 0 ? '是' : '不是';
                var lat = (Number(res.datas.lat)).toFixed(4) > 90 ? "-" : (Number(res.datas.lat)).toFixed(4);
                var lng = (Number(res.datas.lng)).toFixed(4) > 180 ? "-" : (Number(res.datas.lng)).toFixed(4);
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
                    //res.datas.connectNum  @TODO 基站连船数量取的总船数
                    "<td><input style='border: 0px;' id='station_conect_ships' value='" + shipDataAll.length + "' readonly></td>" +
                    "<td >经度：</td>" +
                    "<td><input style='border: 0px;' id='station_lng' value='" + lng + "' readonly></td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td >是否自有岸站：</td>" +
                    "<td><input style='border: 0px;' id='station_own_flg' value='" + ownFlg + "' readonly></td>" +
                    "</tr>" +
                    "</tbody>" +
                    "</table>" +
                    "<div id='stationDetailSend' style='text-align: center;margin-top:10px;display: none'>"

                if (shoreSendSafeMsg == false) {
                    stationDetailhtml += "<button class='layui-btn layui-btn-normal' style='width: 100px;display: none' id='sendSafeMsgControl2' name='sendSafeMsgControl' lay-submit lay-filter='navigationBoxLayer'>发送消息</button>";
                } else {
                    stationDetailhtml += "<button class='layui-btn layui-btn-normal' style='width: 100px;' id='sendSafeMsgControl2' name='sendSafeMsgControl' lay-submit lay-filter='navigationBoxLayer'>发送消息</button>";
                }
                stationDetailhtml += "</div></div>";

                var stationDetailhtml2 = "<div id='stationDetailLayer2' class='layui-form' >" +
                    "<table class='layui-table no-hover-table' lay-skin='nob'>" +
                    "<tbody>" +
                    "<tr>" +
                    "<td >MMSI：</td>" +
                    "<td><input style='border: 0px;' id='station_MMSI2' value='" + res.datas.mmsi + "' readonly></input></td>" +
                    "<td >纬度：</td>" +
                    "<td><input style='border: 0px;' id='station_lng2' value='" + lat + "' readonly></td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td >经度：</td>" +
                    "<td><input style='border: 0px;' id='station_lat2' value='" + lng + "' readonly /></td>" +
                    "<td >是否自有岸站：</td>" +
                    "<td><input style='border: 0px;' id='station_own_flg2' value='" + ownFlg + "' readonly></td>" +
                    "</tr>" +
                    "</tbody>" +
                    "</table>" +
                    "</div>"

                if (res.datas.ownFlg == 0) {
                    $("#stationDetailSend").css("display", "block");
                    if (stationDetailLayer == null) {
                        stationFunction(stationDetailhtml);

                    } else {
                        $("#stationDetail_id").html(stationDetailhtml)
                    }
                    $("#stationDetail_id").css("height", "140px");
                } else {
                    if (stationDetailLayer == null) {
                        stationFunction(stationDetailhtml2);
                    } else {
                        $("#stationDetail_id").html(stationDetailhtml2)
                    }
                    $("#stationDetail_id").css("height", "80px");
                }
            }, 'POST');
        }
    }

    function stationFunction(id) {
        stationDetailLayer = layer.open({
            type: 1
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

    //显示水文气象数据
    function showHymeDetailNow() {
        // 其他图层关闭
        var arr = ['heatmapLayer', 'shipDetailLayer', 'selectedShipLayer', 'targetLayer', 'stationDetailLayer', 'atonDetailLayer', 'stationCoverageLayer', 'owmStationLayer', 'fishingNetDetailLayer'];
        rejectLayer(arr);
        // 隐藏左侧列表
        hideAllList();
        getDetailHymeDataNow();
    }

    //显示水文气象数据
    function showHymeDetail() {
        // 其他图层关闭
        var arr = ['heatmapLayer', 'shipDetailLayer', 'selectedShipLayer', 'targetLayer', 'stationDetailLayer', 'atonDetailLayer', 'stationCoverageLayer', 'owmStationLayer', 'fishingNetDetailLayer'];
        rejectLayer(arr);
        getTimeList();
        // 隐藏左侧列表
        hideAllList();
        showHymeDetailform();
    }

    function showHymeDetailform() {
        admin.req('hyme-api/getDefaultTime', '', function (res) {
            DefaultTime = res;
        }, 'GET')
        var timestamp = DefaultTime;
        var data = {
            timeStamp: timestamp
        };
        getDetailHymeData(data);
    }

    form.on('select(selectOnchange)', function (data) {
        var timestamp = data.value;
        var data = {
            timeStamp: timestamp
        };
        getDetailHymeData(data);
    });

    //水文气象实时数据查询
    function getDetailHymeDataNow() {
        admin.reqNoLoad('hyme-api/getHymeMiniDetail', {}, function (res) {
            let hymeDetailData= {};
            if (res.datas == null) {
                $("#atmoPressureNow").val("-- kPa");
                $("#airHumidityNow").val("-- %");
                $("#airTemperatureNow").val("-- ℃");
                $("#windSpeedNow").val("-- m/s");
                $("#waterDepthFloatNow").val("-- m");
                $("#emptyHeightFloatNow").val("-- m");
            } else {
                hymeDetailData = res.datas;
                $("#atmoPressureNow").val(hymeDetailData.atmoPressure ?? "-- kPa");
                $("#airHumidityNow").val(hymeDetailData.airHumidity ?? "-- %");
                $("#airTemperatureNow").val(hymeDetailData.airTemperature ?? "-- ℃");
                $("#windSpeedNow").val(hymeDetailData.windSpeed ?? "-- m/s");
                $("#waterDepthFloatNow").val(hymeDetailData.waterDepthFloat ?? "-- m");
                $("#emptyHeightFloatNow").val(hymeDetailData.emptyHeightFloat ?? "-- m");
            }
        }, 'POST');
    }

//水文气象历史数据查询
    function getDetailHymeData(data) {
        admin.reqNoLoad('hyme-api/getHymeDetail', JSON.stringify(data), function (res) {
            if (res.datas == null) {
                return;
            } else {
                hymeDetailData = res.datas;
                hymeDetailCount = res.cnt;
                hymeDetailList = [];
                for (var i in hymeData) {
                    // map.flyTo([hymeData[i].latitude, hymeData[i].longitude], mapCurrentLevel);
                    $("#waterDepth").val(hymeDetailData.waterDepth);
                    $("#waterTemperature").val(hymeDetailData.waterTemperature);
                    $("#waterVelocity").val(hymeDetailData.waterVelocity);
                    $("#windSpeed").val(hymeDetailData.windSpeed);
                    $("#airTemperature").val(hymeDetailData.airTemperature);
                    $("#airHumidity").val(hymeDetailData.airHumidity);
                    $("#atmoPressure").val(hymeDetailData.atmoPressure);

                    $("#emptyHeightFloat").val(hymeDetailData.emptyHeightFloat);
                    $("#waterDepthFloat").val(hymeDetailData.waterDepthFloat);
                    break;
                }
            }
        }, 'POST');
    }

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


    // 搜索框搜索 判断名字是否为空
    var shipname = true;
    var stationname = true;
    var atonname = true;
    var fishingnetname = true;

    // 输入框检索时获得自动补齐数据
    function getAutoCompleteData() {
        var val = $("#saerchMMSIorName").val().toUpperCase();
        // 文本框值为空时，隐藏模糊查询框并且返回
        if (val == '') {
            $("#autoComplete").css("display", "none");
            return;
        }
        hideAllList();
        var arr = ['stationDetailLayer'];
        rejectLayer(arr);
        var ul = document.getElementById("autoComplete");
        ul.innerHTML = "";
        for (var i in shipDataAll) {
            shipDataAll[i].mmsi = shipDataAll[i].mmsi + '';
            shipDataAll[i].ename = shipDataAll[i].ename + '';
            shipDataAll[i].cname = shipDataAll[i].cname + '';
            if (shipDataAll[i].mmsi.indexOf(val) > -1 || shipDataAll[i].ename.indexOf(val) > -1 || shipDataAll[i].cname.indexOf(val) > -1) {
                if (shipDataAll[i].ename == "null" || shipDataAll[i].cname == "null" || shipDataAll[i].ename == "" || shipDataAll[i].cname == "") {
                    shipname = false;
                }
                var ele = document.createElement('li');
                if (shipDataAll[i].cname != null && shipDataAll[i].cname != "null") {
                    ele.innerHTML = "<li class = 'item' style='border: none;margin-left: 5px;' >" + shipDataAll[i].cname + " | " + shipDataAll[i].mmsi + "<span style='float: right;font-size: 10px;margin-right: 10px;'> 船舶</span></li > "
                } else {
                    if (shipDataAll[i].ename == "null") {
                        ele.innerHTML = "<li class = 'item' style='border: none;margin-left: 5px;' >" + " | " + shipDataAll[i].mmsi + "<span style='float: right;font-size: 10px;margin-right: 10px;'> 船舶</span></li > "
                    } else {
                        ele.innerHTML = "<li class = 'item' style='border: none;margin-left: 5px;' >" + shipDataAll[i].ename + " | " + shipDataAll[i].mmsi + "<span style='float: right;font-size: 10px;margin-right: 10px;'> 船舶</span></li > "
                    }
                }
                ul.appendChild(ele);
            }
        }
        for (var i in stationData) {
            stationData[i].mmsi = stationData[i].mmsi + '';
            stationData[i].name = stationData[i].name + '';
            if (stationData[i].mmsi.indexOf(val) > -1 || stationData[i].name.indexOf(val) > -1) {
                if (stationData[i].name == '') {
                    stationname = false;
                }
                var ele = document.createElement('li');
                ele.innerHTML = "<li class = 'item' style='border: none;margin-left: 5px;'>" + stationData[i].name + " | " + stationData[i].mmsi + "<span style='float: right;font-size: 10px;margin-right: 10px'>岸站</span></li > "
                ul.appendChild(ele);
            }

        }

        $("#autoComplete .item").click(function (data) {
            var type = "";
            var mmsi = "";
            if (this.innerText.indexOf("船舶") > -1) {
                type = "SHIP";
                // mmsi = this.innerText.replace("船舶", "");
                if (shipname == true) {
                    mmsi = this.innerText.replaceAll("船舶", "").split(" | ")[1];
                } else if (shipname == false) {
                    mmsi = this.innerText.replaceAll("船舶", "").split("| ")[1];
                }
            } else if (this.innerText.indexOf("岸站") > -1) {
                type = "STATION";
                if (stationname == true) {
                    mmsi = this.innerText.replaceAll("岸站", "").split(" | ")[1];
                } else if (stationname == false) {
                    mmsi = this.innerText.replaceAll("岸站", "").split("| ")[1];
                }
            } else if (this.innerText.indexOf("雷达目标") > -1) {
                type = "tt";
                if (stationname == true) {
                    mmsi = this.innerText.replaceAll("雷达目标", "").split(" | ")[1];
                } else if (stationname == false) {
                    mmsi = this.innerText.replaceAll("雷达目标", "").split("| ")[1];
                }
            }
            autoCompleteClick(mmsi, type);
        });
        $("#autoComplete").css("display", "block");
    }


    // 模糊查询列表点击
    function autoCompleteClick(mmsi, searchType) {
        mmsi = mmsi.toString().replace("\n", "")
        if (searchType == 'SHIP') {
            showShipDetail(mmsi);
        } else if (searchType == 'STATION') {
            showStationDetail(mmsi);
        } else if (searchType == 'tt') {
            showRadarTtDetail(mmsi);
        }
        $("#saerchMMSIorName").val(mmsi);
        setTimeout(function () {
            $("#autoComplete").css("display", "none")
        }, 100);
    }

    // 显示左侧列表
    function showAllList() {
        var arr = ['atonDetailLayer', 'heatmapLayer', 'hymeDetailLayer', 'shipDetailLayer', 'selectedShipLayer', 'targetLayer', 'stationDetailLayer', 'stationCoverageLayer', 'owmStationLayer'];
        rejectLayer(arr);

        showTabBtn = true;
        $("#allList_left").css("display", "block");

        // 船舶列表
        table.render({
            elem: '#shipList'
            , data: shipData.filter(e => e?.radarType != 2) || []
            , height: '600px'
            , size: 'sm'
            , cols: [[
                {field: 'mmsi', title: 'MMSI', sort: true, width: '22%'}
                , {
                    field: 'ename', title: '船舶名称', sort: true, width: '23%', templet: function (d) {
                        if (d.cname != null && d.cname != "") {
                            return d.cname
                        } else if (d.ename == null) {
                            return ""
                        } else {
                            return d.ename
                        }
                        // return d.cname != null ? d.cname : d.ename == null ? "" : d.ename;
                    }
                }
                , {
                    field: 'distance', title: '距离岸站', sort: true, width: '30%', templet: function (d) {
                        return d.distance == null ? "" : d.distance + "海里";
                    }
                }
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


        // 雷达目标列表
        table.render({
            elem: '#radarTargetList'
            , data: shipData.filter(e => e?.radarType == 2) || []
            , height: '600px'
            , size: 'sm'
            , cols: [[
                {field: 'mmsi', title: 'MMSI', sort: true, width: '22%'}
                , {
                    field: 'ename', title: '目标名称', sort: true, width: '23%', templet: function (d) {
                        if (d.cname != null && d.cname != "") {
                            return d.cname
                        } else if (d.ename == null) {
                            return ""
                        } else {
                            return d.ename
                        }
                        // return d.cname != null ? d.cname : d.ename == null ? "" : d.ename;
                    }
                }
                , {
                    field: 'distance', title: '距离岸站', sort: true, width: '30%', templet: function (d) {
                        return d.distance == null ? "" : d.distance + "海里";
                    }
                }
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


        table.on('sort(radarTargetList)', function (obj) {
            stationTableSortName = obj.field;
            stationTableSortDesc = obj.type;
        });

        table.on('row(radarTargetList)', function (obj) {
            hideAllList();
            // searchShip(obj.data.mmsi);
            showRadarTtDetail(obj.data.ename);
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

    }

    // 关闭左侧列表
    function hideAllList() {
        showTabBtn = false
        $("#allList_left").css("display", "none");
    }

    function clearMenuClour(str){
        // $("#navigation_box #" + str + ".active").removeClass("active");
        // document.getElementById("targetStatistics").children[0].style.color = ""
        // document.getElementById("collision").children[0].style.color = ""
        // document.getElementById("hymeSelect").children[0].style.color = ""
        // document.getElementById("hymeHistorySelect").children[0].style.color = ""
        // document.getElementById("layerControl").children[0].style.color = ""
        // document.getElementById("playbackTrackControl").children[0].style.color = ""
        // document.getElementById("userInfo").children[0].style.color = ""
        // document.getElementById("userPassword").children[0].style.color = ""
    }

    // 右上导航栏弹出框
    function navigationBoxClick(str) {
        // 其他图层messageSendLayerId关闭
        var arr = ['markerTableLayer', 'heatmapLayer', 'navigationBoxLayer', 'targetLayer', 'trackplaybackControl', 'stationCoverageLayer', 'owmStationLayer', 'electronicFenceLayerIndex'];
        rejectLayer(arr);
        var offset = 'rt';
        var area;
        var title;
        var close = '';
        //selectColorChange(str);

        if (no_close_model == 1) {
            layer.confirm('已编辑的内容还未保存，是否继续？',{
                // 触发关闭事件的回调，不管是点击确认、取消还是右上角关闭按钮
                end: function() {
                    clearMenuClour(str);
                }
            }, function (i) {
                no_close_model = 0
                setmeasureDistance()
            }, function(){
                // $("#navigation_box #" + str + ".active").removeClass("active");
                // document.getElementById("targetStatistics").children[0].style.color = ""
                // document.getElementById("collision").children[0].style.color = ""
                // document.getElementById("hymeSelect").children[0].style.color = ""
                // document.getElementById("hymeHistorySelect").children[0].style.color = ""
                // document.getElementById("layerControl").children[0].style.color = ""
                // document.getElementById("playbackTrackControl").children[0].style.color = ""
                // document.getElementById("userInfo").children[0].style.color = ""
                // document.getElementById("userPassword").children[0].style.color = ""
            })
        } else if (no_close_model == 2) {
            layer.confirm('是否清空已编辑的内容？',{
                // 触发关闭事件的回调，不管是点击确认、取消还是右上角关闭按钮
                end: function() {
                    clearMenuClour(str);
                }
            }, function (i) {
                no_close_model = 0
                setmeasureDistance()
            }, function(){
                // $("#navigation_box #" + str + ".active").removeClass("active");
                // document.getElementById("targetStatistics").children[0].style.color = ""
                // document.getElementById("collision").children[0].style.color = ""
                // document.getElementById("hymeSelect").children[0].style.color = ""
                // document.getElementById("hymeHistorySelect").children[0].style.color = ""
                // document.getElementById("layerControl").children[0].style.color = ""
                // document.getElementById("playbackTrackControl").children[0].style.color = ""
                // document.getElementById("userInfo").children[0].style.color = ""
                // document.getElementById("userPassword").children[0].style.color = ""
            })
        } else {
            setmeasureDistance()
        }

        function setmeasureDistance() {
            layer.closeAll()
            var arr = ['electronicFenceLayerCustomIndex', 'virtualAtoNLayerIndex', 'virtualAtoNControl_id', 'electronicHistoryLayer', 'electronicAlertLayer', 'heatmapLayer',
                'navigationBoxLayer', 'targetLayer', 'hymeSelect', 'hymeHistorySelect', 'trackplaybackControl', 'stationCoverageLayer', 'owmStationLayer', 'virtualAtoNLayerIndex', 'measureLayer'];
            rejectLayer(arr);


            // clear();

            switch (str) {
                case "electronicFenceControl":
                    var arr = ['electronicFenceLayerCustomIndex', 'virtualAtoNLayerIndex', 'virtualAtoNControl_id', 'electronicHistoryLayer', 'electronicAlertLayer', 'heatmapLayer',
                        'navigationBoxLayer', 'targetLayer', 'hymeSelect', 'hymeHistorySelect', 'trackplaybackControl', 'stationCoverageLayer', 'owmStationLayer', 'virtualAtoNLayerIndex'];
                    rejectLayer(arr);
                    openElectronicFenceTable(map, admin, table, config, form, laytpl, allRiskArea);
                    return;
                //    fss 0129
                case "targetStatistics":
                    title = "目标筛选";
                    offset = 'rt';
                    area = ['306px'];
                    close = function () {
                        // document.getElementById("targetStatistics").children[0].style.color = ""
                    }
                    var arr = ['electronicFenceLayerCustomIndex', 'hymeSelect', 'hymeHistorySelect', 'virtualAtoNLayerIndex', 'virtualAtoNControl_id', 'electronicHistoryLayer', 'electronicAlertLayer', 'heatmapLayer',];
                    rejectLayer(arr);
                    break;
                case "collision":
                    title = "疑似碰撞";
                    offset = 'rt';
                    area = ['550px'];
                    close = function () {
                        document.getElementById("collision").children[0].style.color = ""
                        layer.close(navigationBoxLayer);
                    }
                    var arr = ['electronicFenceLayerCustomIndex', 'virtualAtoNLayerIndex', 'virtualAtoNControl_id', 'electronicHistoryLayer', 'electronicAlertLayer', 'heatmapLayer',];
                    rejectLayer(arr);
                    // alertForm();
                    // alertTable();
                    break;
                case "hymeSelect":
                    title = "水文气象实时查询";
                    offset = 'rt';
                    area = ['406px'];
                    showHymeDetailNow();
                    close = function () {
                        document.getElementById("hymeSelect").children[0].style.color = ""
                    }
                    var arr = ['electronicFenceLayerCustomIndex', 'virtualAtoNLayerIndex', 'virtualAtoNControl_id', 'electronicHistoryLayer', 'electronicAlertLayer', 'heatmapLayer',];
                    rejectLayer(arr);
                    break;
                case "hymeHistorySelect":
                    title = "水文气象历史查询";
                    offset = 'rt';
                    area = ['406px'];
                    showHymeDetail();
                    close = function () {
                        document.getElementById("hymeHistorySelect").children[0].style.color = ""
                    }
                    var arr = ['electronicFenceLayerCustomIndex', 'virtualAtoNLayerIndex', 'virtualAtoNControl_id', 'electronicHistoryLayer', 'electronicAlertLayer', 'heatmapLayer',];
                    rejectLayer(arr);
                    break;
                case "layerControl":
                    rejectLayer(['virtualAtoNLayerIndex', 'hymeSelect', 'hymeHistorySelect', 'virtualAtoNControl_id', 'electronicHistoryLayer', 'electronicAlertLayer', 'electronicFenceLayerCustomIndex', 'virtualAtoNLayerIndex'])
                    offset = 'rt';
                    area = ['306px'];
                    close = function () {
                        document.getElementById("layerControl").children[0].style.color = ""
                    }
                    break;
                case "careShip":
                    rejectLayer(['virtualAtoNLayerIndex', 'hymeSelect', 'hymeHistorySelect', 'virtualAtoNControl_id', 'electronicHistoryLayer', 'electronicAlertLayer', 'electronicFenceLayerCustomIndex', 'virtualAtoNLayerIndex'])
                    title = "重点关注";
                    offset = 'rt';
                    area = ['500px', '355px'];
                    close = function () {
                        if (careShipLayerIndex) {
                            layer.close(careShipLayerIndex);
                            careShipLayerIndex = null;
                        }
                    };
                    careShipFun();
                    break;

                case "playbackTrackControl":
                    rejectLayer(['virtualAtoNLayerIndex', 'hymeSelect', 'hymeHistorySelect', 'virtualAtoNControl_id', 'electronicHistoryLayer', 'electronicAlertLayer', 'electronicFenceLayerCustomIndex', 'virtualAtoNLayerIndex'])
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
                    // $("#userInfo_userSex input:radio[value='0']").prop('checked',config.getUser().sex == 1 ? true : false);
                    // $("#userInfo_userSex input:radio[value='1']").prop('checked',config.getUser().sex == 0 ? true : false);

                    $("input[name=sex][value=0]").prop("checked", config.getUser().sex == 0 ? true : false);
                    $("input[name=sex][value=1]").prop("checked", config.getUser().sex == 1 ? true : false);
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
                case "eFencehistory":
                    var arr = ['electronicHistoryLayer', 'virtualAtoNLayerIndex', 'virtualAtoNControl_id', 'electronicFenceLayerCustomIndex', 'electronicAlertLayer', 'heatmapLayer',
                        'navigationBoxLayer', 'targetLayer', 'hymeSelect', 'hymeHistorySelect', 'trackplaybackControl', 'stationCoverageLayer', 'owmStationLayer', 'virtualAtoNLayerIndex'];
                    rejectLayer(arr);
                    efenceHistory(map, admin, table, config, form, laytpl);
                    return;
                case "eFenceAlert":
                    var arr = ['electronicAlertLayer', 'virtualAtoNLayerIndex', 'virtualAtoNControl_id', 'electronicFenceLayerCustomIndex', 'electronicHistoryLayer', 'heatmapLayer',
                        'navigationBoxLayer', 'targetLayer', 'trackplaybackControl', 'stationCoverageLayer', 'owmStationLayer', 'virtualAtoNLayerIndex'];
                    rejectLayer(arr);
                    eFenceAlert(map, admin, table, config, form, laytpl);
                    return
            }
            navigationBoxLayer = layer.open({
                type: 1
                , offset: offset
                , id: str + '_id'
                , title: title
                , content: $('#' + str + 'Layer')
                , btn: ''
                , shade: 0
                , skin: 'layui-layer-lan ' + str
                , area: area
                , resize: false
                , scrollbar: false
                , end: function () {
                    // $("#navigation_box #" + str + ".active").removeClass("active");
                    close();
                }
                , success: function (layero, index) {
                    $("#clickAIS").click();
                    $("#clickAISmessage").click();
                    $("#sendSafeMsgControlLayer_addArea").hide();
                    table.reload('collisionMonitor-table', {});
                    layer.style(index, {
                        left: $(layero).offset().left - 20,
                        top: 110,
                    })
                    if ("markerControl" == str) {
                        showMarkerList(table, layer, form, config, admin, map);
                    }
                }
            });
        }


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
                    $("#trackShipPlayStartTime").val('')
                    $("#trackShipPlayEndTime").val('')
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
            , offset: 'rt'
            , id: str + '_id'
            , title: title
            , content: $('#' + str + 'Layer')
            , btn: ''
            , shade: 0
            , skin: title === "消息播发" ? 'layui-layer-lan messageSendLayerId' : "layui-layer-lan"
            , area: area
            , resize: false
            , cancel: close
            , success: function (layero, index) {
                layer.style(index, {
                    marginLeft: -20,
                    marginTop: 130
                })
                $("#shipAIS").click();
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
        if (startTime != '' && endTime != '' && startTime < endTime - 7 * 24 * 3600) {
            return layer.msg("轨迹查询时间范围应在七天内", {icon: 2, time: config.msgTime});
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

                document.getElementById("trackList").innerHTML += "<li id=" + targetShipMMSI_playbackTrack + "_trackList style='margin:20px;color: #DBD9D1'>" +
                    "<a  id=" + targetShipMMSI_playbackTrack + "_track style='color:white' data-start=" + new Date(startTimeYMD).getTime() + "  data-end=" + new Date(endTimeYMD).getTime() + "  lay-submit lay-filter='targetShipMMSI_playbackTrack_list' class='targetShipMMSI_playbackTrack_list'>"
                    + targetShipMMSI_name + "（" + targetShipMMSI_playbackTrack + "）</br>" + startTimeYMD + "—" + endTimeYMD
                    + "</a><a style='color:white'><i class='layui-icon layui-icon-close' id = " + targetShipMMSI_playbackTrack + " style='font-size: 15px;float: right;padding-left: 25px;' lay-submit lay-filter='closeTrackList'></i></a></li>";
                trackplaybackdata.push(res.data);

                $(".targetShipMMSI_playbackTrack_list").on("click", function (e) {
                    if (!targetShipMMSIPlaybackTrackListFlag) {
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
                , skin: "layui-layer-lan"
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
                    , offset: [110, 1100]
                    , id: 'trackList_id'
                    , title: '轨迹列表'
                    , content: $("#trackListLayer")
                    , btn: ''
                    , shade: 0
                    , resize: false
                    , skin: 'layui-layer-lan trackList_id'
                    , area: 'auto'
                    , cancel: function () {
                        trackplaybackControl._close();
                    }, success: function (layero, index) {
                        // layer.style(index, {
                        //     // marginLeft: -550,
                        //     marginTop: 110,
                        // })
                    }
                });
            }
        }
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
        var arr = ['setCenterLayer', 'legendLayer'];
        rejectLayer(arr);
        measureControl =
            new L.control.polylineMeasure(
                {
                    position: 'bottomright',
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
        measureControl._container.classList.add("measureDistanceCtrl");
        let flag = $("#measureDistance").offset();
        let mdc = $(measureControl._container);
        mdc.css({
            top: "auto",
            left: "auto",
            right: 10,
            bottom: 102,
            position: "fixed",
            opacity: 0,
        }).animate({
            right: 34,
            opacity: 1,
        }, 150)
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
            $('#setCenter_lat').dfm().val(pointLat);
            $('#setCenter_lng').dfm().val(pointLng);
            centerPosition.setLatLng([pointLat, pointLng])
            centerPosition.addTo(map);
            $('#map').css('cursor', "");
            map.off('click');
        })
        $('#setCenter_level').val(mapCurrentLevel);

        if (setCenterLayer == null) {
            setCenterLayer = layer.open({
                type: 1
                , offset: 'rb'
                , id: 'setCenter_id'
                , title: '中心点坐标'
                , content: $("#setCenterLayer")
                , btn: ''
                , shade: 0
                , resize: false
                , skin: 'layui-layer-lan setCenter_id'
                , area: 'auto'
                , cancel: function () {
                    no_close_model = 0
                    $('#map').css('cursor', "");
                    $('#setCenter_lat').dfm().val(0);
                    $('#setCenter_lng').dfm().val(0);
                    $('#map').off('click');
                    centerPosition.remove();
                    setCenterLayer = null;
                    isPositionSetting = false;
                    // $("#centerPositionSet")[0].style.color = "";
                }
                , end : function(){
                    no_close_model = 0
                    $('#map').css('cursor', "");
                    $('#setCenter_lat').dfm().val(0);
                    $('#setCenter_lng').dfm().val(0);
                    $('#map').off('click');
                    centerPosition.remove();
                    setCenterLayer = null;
                    isPositionSetting = false;
                }
                , success: function (layero, index) {
                    no_close_model = 1;
                    isPositionSetting = true;
                    $('#setCenter_lat').dfm().val(map.getCenter().lat);
                    $('#setCenter_lng').dfm().val(map.getCenter().lng);
                    let offset = layero.offset();
                    $("#" + layero[0].id).css({
                        left: offset.left - 45,
                        top: offset.top - 77,
                    });
                }
            });
        }
    }

    //AIS类型
    $("#targetStatisticsLayer #ships_screen1 a").click(function () {
        var _e = $(this);
        //清空
        if (_e.hasClass('right_radius1')) {
            $("#targetStatisticsLayer #ships_screen1 a").not(".unsel").removeClass('chose');
            $("#targetStatisticsLayer .allselected1 ").removeClass('chose');
            _e.addClass('chose');
            $("input[name='targetStatisticsLayer_aisType'][value='A']").prop("checked", false);
            $("input[name='targetStatisticsLayer_aisType'][value='B']").prop("checked", false);
            layerControlLayer_aisType = ''
            getShipData();
            drawShip(shipData);
            drawPoint(shipData);
            shipPointLayer.clearLayers();
            shipLayer.clearLayers();
            saveUserCenter('layer');
            form.render()
        }
        //全选
        if (_e.hasClass('allselected1')) {
            $("#targetStatisticsLayer #ships_screen1 a").addClass('chose');
            $("#targetStatisticsLayer .right_radius1").removeClass('chose');
            _e.addClass('chose');
            $("input[name='targetStatisticsLayer_aisType'][value='A']").prop('checked', true);
            $("input[name='targetStatisticsLayer_aisType'][value='B']").prop('checked', true);
            layerControlLayer_aisType = 'AB'
            getShipData();
            drawShip(shipData);
            drawPoint(shipData);
            saveUserCenter('layer');
            form.render();
        }

    })
    //船舶类型
    $("#targetStatisticsLayer #ships_screen2 a").click(function () {
        var _e = $(this);
        //清空
        if (_e.hasClass('right_radius2')) {
            $("#targetStatisticsLayer #ships_screen2 a").not(".unsel").removeClass('chose');
            $("#targetStatisticsLayer .allselected2 ").removeClass('chose');
            _e.addClass('chose');
            $("input[name='targetStatisticsLayer_shipType_30'][value='30']").prop("checked", false);
            $("input[name='targetStatisticsLayer_shipType_31'][value='31']").prop("checked", false);
            $("input[name='targetStatisticsLayer_shipType_35'][value='35']").prop("checked", false);
            $("input[name='targetStatisticsLayer_shipType_50'][value='50']").prop("checked", false);
            $("input[name='targetStatisticsLayer_shipType_51'][value='51']").prop("checked", false);
            $("input[name='targetStatisticsLayer_shipType_53'][value='53']").prop("checked", false);
            $("input[name='targetStatisticsLayer_shipType_55'][value='55']").prop("checked", false);
            $("input[name='targetStatisticsLayer_shipType_60'][value='60']").prop("checked", false);
            $("input[name='targetStatisticsLayer_shipType_70'][value='70']").prop("checked", false);
            $("input[name='targetStatisticsLayer_shipType_80'][value='80']").prop("checked", false);
            $("input[name='targetStatisticsLayer_shipType_00'][value='zz']").prop("checked", false);
            $("input[name='layerControlLayer_radarTarget']").prop("checked", false);
            isShowRadarShip = 1
            shipType = {
                layerControlLayer_shipType_30: false,
                layerControlLayer_shipType_31: false,
                layerControlLayer_shipType_35: false,
                layerControlLayer_shipType_50: false,
                layerControlLayer_shipType_51: false,
                layerControlLayer_shipType_53: false,
                layerControlLayer_shipType_55: false,
                layerControlLayer_shipType_60: false,
                layerControlLayer_shipType_70: false,
                layerControlLayer_shipType_80: false,
                layerControlLayer_shipType_00: false,
            };
            getShipData();
            saveUserCenter('layer');
            drawShip(shipData);
            drawPoint(shipData);
            form.render();
        }
        //全选
        if (_e.hasClass('allselected2')) {
            $("#targetStatisticsLayer #ships_screen2 a").addClass('chose');
            $("#targetStatisticsLayer .right_radius2").removeClass('chose');
            _e.addClass('chose');
            $("input[name='targetStatisticsLayer_shipType_30'][value='30']").prop("checked", true);
            $("input[name='targetStatisticsLayer_shipType_31'][value='31']").prop("checked", true);
            $("input[name='targetStatisticsLayer_shipType_35'][value='35']").prop("checked", true);
            $("input[name='targetStatisticsLayer_shipType_50'][value='50']").prop("checked", true);
            $("input[name='targetStatisticsLayer_shipType_51'][value='51']").prop("checked", true);
            $("input[name='targetStatisticsLayer_shipType_53'][value='53']").prop("checked", true);
            $("input[name='targetStatisticsLayer_shipType_55'][value='55']").prop("checked", true);
            $("input[name='targetStatisticsLayer_shipType_60'][value='60']").prop("checked", true);
            $("input[name='targetStatisticsLayer_shipType_70'][value='70']").prop("checked", true);
            $("input[name='targetStatisticsLayer_shipType_80'][value='80']").prop("checked", true);
            $("input[name='targetStatisticsLayer_shipType_00'][value='zz']").prop("checked", true);
            $("input[name='layerControlLayer_radarTarget']").prop("checked", true);
            isShowRadarShip = 0
            shipType = {
                layerControlLayer_shipType_30: 30,
                layerControlLayer_shipType_31: 31,
                layerControlLayer_shipType_35: 35,
                layerControlLayer_shipType_50: 50,
                layerControlLayer_shipType_51: 51,
                layerControlLayer_shipType_53: 53,
                layerControlLayer_shipType_55: 55,
                layerControlLayer_shipType_60: 60,
                layerControlLayer_shipType_70: 70,
                layerControlLayer_shipType_80: 80,
                layerControlLayer_shipType_00: "zz",
            };
            getShipData();
            drawShip(shipData);
            drawPoint(shipData);
            saveUserCenter('layer');
            form.render();
        }

    })
    //船舶航行状态
    $("#targetStatisticsLayer #ships_screen3 a").click(function () {
        var _e = $(this);
        //清空
        if (_e.hasClass('right_radius3')) {
            $("#targetStatisticsLayer #ships_screen3 a").not(".unsel").removeClass('chose');
            $("#targetStatisticsLayer .allselected3 ").removeClass('chose');
            _e.addClass('chose');
            $("input[name='layerControlLayer_navStatus_0'][value='0']").prop('checked', false);
            $("input[name='layerControlLayer_navStatus_1'][value='1']").prop('checked', false);
            $("input[name='layerControlLayer_navStatus_2'][value='2']").prop('checked', false);
            $("input[name='layerControlLayer_navStatus_3'][value='3']").prop('checked', false);
            $("input[name='layerControlLayer_navStatus_4'][value='4']").prop('checked', false);
            $("input[name='layerControlLayer_navStatus_5'][value='5']").prop('checked', false);
            $("input[name='layerControlLayer_navStatus_6'][value='6']").prop('checked', false);
            $("input[name='layerControlLayer_navStatus_7'][value='7']").prop('checked', false);
            $("input[name='layerControlLayer_navStatus_8'][value='8']").prop('checked', false);
            $("input[name='layerControlLayer_navStatus_00'][value='zz']").prop('checked', false);
            navStatus = {
                layerControlLayer_navStatus_0: false,
                layerControlLayer_navStatus_1: false,
                layerControlLayer_navStatus_2: false,
                layerControlLayer_navStatus_3: false,
                layerControlLayer_navStatus_4: false,
                layerControlLayer_navStatus_5: false,
                layerControlLayer_navStatus_6: false,
                layerControlLayer_navStatus_7: false,
                layerControlLayer_navStatus_8: false,
                layerControlLayer_navStatus_00: false,
            };
            getShipData();
            drawShip(shipData);
            drawPoint(shipData);
            saveUserCenter('layer');
            form.render();
        }
        //全选
        if (_e.hasClass('allselected3')) {
            $("#targetStatisticsLayer #ships_screen3 a").addClass('chose');
            $("#targetStatisticsLayer .right_radius3").removeClass('chose');
            _e.addClass('chose');
            $("input[name='layerControlLayer_navStatus_0'][value='0']").prop('checked', true);
            $("input[name='layerControlLayer_navStatus_1'][value='1']").prop('checked', true);
            $("input[name='layerControlLayer_navStatus_2'][value='2']").prop('checked', true);
            $("input[name='layerControlLayer_navStatus_3'][value='3']").prop('checked', true);
            $("input[name='layerControlLayer_navStatus_4'][value='4']").prop('checked', true);
            $("input[name='layerControlLayer_navStatus_5'][value='5']").prop('checked', true);
            $("input[name='layerControlLayer_navStatus_6'][value='6']").prop('checked', true);
            $("input[name='layerControlLayer_navStatus_7'][value='7']").prop('checked', true);
            $("input[name='layerControlLayer_navStatus_8'][value='8']").prop('checked', true);
            $("input[name='layerControlLayer_navStatus_00'][value='zz']").prop('checked', true);

            navStatus = {
                layerControlLayer_navStatus_0: "0",
                layerControlLayer_navStatus_1: 1,
                layerControlLayer_navStatus_2: 2,
                layerControlLayer_navStatus_3: 3,
                layerControlLayer_navStatus_4: 4,
                layerControlLayer_navStatus_5: 5,
                layerControlLayer_navStatus_6: 6,
                layerControlLayer_navStatus_7: 7,
                layerControlLayer_navStatus_8: 8,
                layerControlLayer_navStatus_00: "zz",
            };
            getShipData();
            drawShip(shipData);
            drawPoint(shipData);
            saveUserCenter('layer');
            form.render();
        }

    })

    // 保存用户设置中心点
    function saveUserCenter(str, res) {
        if (str == 'layer') {
            var data = {
                id: $('#seaMapId').val(),
                shipTimeShow: layerControlLayer_shipTimeShow,
                shipType: layerControlLayer_shipType,
                // 渔船是否可用 2022/7/12 lxy
                shipName: $("input[name='layerControlLayer_shipName']").prop('checked'),
                stationShow: $("input[name='layerControlLayer_stationShow']").prop('checked'),
                stationName: $("input[name='layerControlLayer_stationName']").prop('checked'),
                atonShow: $("input[name='layerControlLayer_atonShow']").prop('checked'),
                atonName: $("input[name='layerControlLayer_atonName']").prop('checked'),
                fishingNetShow: $("input[name='layerControlLayer_fishingNetShow']").prop('checked'),
                fishingAreas: $("input[name='layerControlLayer_fishingAreas']").prop('checked'),
                fishingShip: $("input[name='layerControlLayer_fishShip']").prop('checked'),
                hymeShow: $("input[name='layerControlLayer_hyme']").prop('checked'),
                radarEcho: $("input[name='layerControlLayer_radarEcho']").prop('checked'),
                radarRange: $("input[name='layerControlLayer_radarRange']").prop('checked'),
                rttShow: $("input[name='layerControlLayer_radarTarget']").prop('checked'),

                aisType: layerControlLayer_aisType,
                shipType30: $("input[name='targetStatisticsLayer_shipType_30']:checked").val() == 30 ? 30 : "false",
                shipType31: $("input[name='targetStatisticsLayer_shipType_31']:checked").val() == 31 ? 31 : "false",
                shipType35: $("input[name='targetStatisticsLayer_shipType_35']:checked").val() == 35 ? 35 : "false",
                shipType50: $("input[name='targetStatisticsLayer_shipType_50']:checked").val() == 50 ? 50 : "false",
                shipType51: $("input[name='targetStatisticsLayer_shipType_51']:checked").val() == 51 ? 51 : "false",
                shipType53: $("input[name='targetStatisticsLayer_shipType_53']:checked").val() == 53 ? 53 : "false",
                shipType55: $("input[name='targetStatisticsLayer_shipType_55']:checked").val() == 55 ? 55 : "false",
                shipType60: $("input[name='targetStatisticsLayer_shipType_60']:checked").val() == 60 ? 60 : "false",
                shipType70: $("input[name='targetStatisticsLayer_shipType_70']:checked").val() == 70 ? 70 : "false",
                shipType80: $("input[name='targetStatisticsLayer_shipType_80']:checked").val() == 80 ? 80 : "false",
                shipType00: $("input[name='targetStatisticsLayer_shipType_00']:checked").val() == "zz" ? "zz" : "false",

                navStatus0: $("input[name='layerControlLayer_navStatus_0']:checked").val() == "0" ? "0" : "false",
                navStatus1: $("input[name='layerControlLayer_navStatus_1']:checked").val() == 1 ? 1 : "false",
                navStatus2: $("input[name='layerControlLayer_navStatus_2']:checked").val() == 2 ? 2 : "false",
                navStatus3: $("input[name='layerControlLayer_navStatus_3']:checked").val() == 3 ? 3 : "false",
                navStatus4: $("input[name='layerControlLayer_navStatus_4']:checked").val() == 4 ? 4 : "false",
                navStatus5: $("input[name='layerControlLayer_navStatus_5']:checked").val() == 5 ? 5 : "false",
                navStatus6: $("input[name='layerControlLayer_navStatus_6']:checked").val() == 6 ? 6 : "false",
                navStatus7: $("input[name='layerControlLayer_navStatus_7']:checked").val() == 7 ? 7 : "false",
                navStatus8: $("input[name='layerControlLayer_navStatus_8']:checked").val() == 8 ? 8 : "false",
                navStatus00: $("input[name='layerControlLayer_navStatus_00']:checked").val() == "zz" ? "zz" : "false",

                enter: $("input[name='layerControlLayer_riskArea']:checked").val() == "enter" ? "enter" : "false",
                speed: $("input[name='layerControlLayer_speedDeviation']:checked").val() == "speed" ? "speed" : "false",
                navigationalStatus: $("input[name='layerControlLayer_abnormalAnchor']:checked").val() == "navigationalStatus" ? "navigationalStatus" : "false",
                fcw: $("input[name='layerControlLayer_collision']:checked").val() == "fcw" ? "fcw" : "false",
                fcwMonitor: $("input[name='layerControlLayer_collisionMonitor']:checked").val() == "fcwMonitor" ? "fcwMonitor" : "false",
            }
            if (shipType.layerControlLayer_shipType_00 == false && shipType.layerControlLayer_shipType_30 == false &&
                shipType.layerControlLayer_shipType_31 == false && shipType.layerControlLayer_shipType_35 == false &&
                shipType.layerControlLayer_shipType_50 == false && shipType.layerControlLayer_shipType_51 == false &&
                shipType.layerControlLayer_shipType_53 == false && shipType.layerControlLayer_shipType_55 == false &&
                shipType.layerControlLayer_shipType_60 == false && shipType.layerControlLayer_shipType_70 == false &&
                shipType.layerControlLayer_shipType_80 == false && isShowRadarShip == '1') {
//清空按钮亮
                $("#targetStatisticsLayer #ships_screen2 a").removeClass('chose');
                $("#targetStatisticsLayer .right_radius2").addClass('chose');
            } else if (shipType.layerControlLayer_shipType_00 == "zz" && shipType.layerControlLayer_shipType_30 == 30 &&
                shipType.layerControlLayer_shipType_31 == 31 && shipType.layerControlLayer_shipType_35 == 35 &&
                shipType.layerControlLayer_shipType_50 == 50 && shipType.layerControlLayer_shipType_51 == 51 &&
                shipType.layerControlLayer_shipType_53 == 53 && shipType.layerControlLayer_shipType_55 == 55 &&
                shipType.layerControlLayer_shipType_60 == 60 && shipType.layerControlLayer_shipType_70 == 70 &&
                shipType.layerControlLayer_shipType_80 == 80 && isShowRadarShip == '0') {
                //全选按钮亮
                $("#targetStatisticsLayer #ships_screen2 a").addClass('chose');
                $("#targetStatisticsLayer .right_radius2").removeClass('chose');
            } else {
                //都不亮
                $("#targetStatisticsLayer #ships_screen2 a").removeClass('chose');
                $("#targetStatisticsLayer .right_radius2").removeClass('chose');
            }

            if (navStatus.layerControlLayer_navStatus_0 == false && navStatus.layerControlLayer_navStatus_1 == false &&
                navStatus.layerControlLayer_navStatus_2 == false && navStatus.layerControlLayer_navStatus_3 == false &&
                navStatus.layerControlLayer_navStatus_4 == false && navStatus.layerControlLayer_navStatus_5 == false &&
                navStatus.layerControlLayer_navStatus_6 == false && navStatus.layerControlLayer_navStatus_7 == false &&
                navStatus.layerControlLayer_navStatus_8 == false && navStatus.layerControlLayer_navStatus_00 == false) {
//清空按钮亮
                $("#targetStatisticsLayer #ships_screen3 a").removeClass('chose');
                $("#targetStatisticsLayer .right_radius3").addClass('chose');
            } else if (navStatus.layerControlLayer_navStatus_0 + "" == 0 & navStatus.layerControlLayer_navStatus_1 == 1 &&
                navStatus.layerControlLayer_navStatus_2 == 2 && navStatus.layerControlLayer_navStatus_3 == 3 &&
                navStatus.layerControlLayer_navStatus_4 == 4 && navStatus.layerControlLayer_navStatus_5 == 5 &&
                navStatus.layerControlLayer_navStatus_6 == 6 && navStatus.layerControlLayer_navStatus_7 == 7 &&
                navStatus.layerControlLayer_navStatus_8 == 8 && navStatus.layerControlLayer_navStatus_00 == "zz") {
                //全选按钮亮
                $("#targetStatisticsLayer #ships_screen3 a").addClass('chose');
                $("#targetStatisticsLayer .right_radius3").removeClass('chose');
            } else {
                //都不亮
                $("#targetStatisticsLayer #ships_screen3 a").removeClass('chose');
                $("#targetStatisticsLayer .right_radius3").removeClass('chose');
            }
        } else if (str == 'center') {
            var data = {
                latitude: $('#setCenter_lat').dfm().val(),
                longitude: $('#setCenter_lng').dfm().val(),
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
                , title: '图例'
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
                , skin: 'layui-layer-lan rectangleMeasure'
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
        var id = document.getElementById(data).children[0];
        if (id.style.color == "") {
            document.getElementById("electronicFenceControl").children[0].style.color = ""
            document.getElementById("targetStatistics").children[0].style.color = ""
            document.getElementById("collision").children[0].style.color = ""
            document.getElementById("eFencehistory").children[0].style.color = ""
            document.getElementById("eFenceAlert").children[0].style.color = ""
            document.getElementById("playbackTrackControl").children[0].style.color = ""
            document.getElementById("userInfo").children[0].style.color = ""
            document.getElementById("userPassword").children[0].style.color = ""
            document.getElementById("hymeSelect").children[0].style.color = ""
            document.getElementById("hymeHistorySelect").children[0].style.color = ""
            document.getElementById("userExit").children[0].style.color = ""
            document.getElementById("layerControl").children[0].style.color = ""
            document.getElementById("careShip") != null ? document.getElementById("careShip").children[0].style.color = "" : ""
            id.style.color = "#FFB800";
        }
        // else {
        //     id.style.color = "";
        // }
    }

    // 其他图层关闭
    function rejectLayer(arr) {
        //********
        if (arr.indexOf('electronicFenceLayerCustomIndex') > -1) {
            layer.close(window.electronicFenceLayerCustomIndex)
        }
        if (arr.indexOf('virtualAtoNLayerIndex') > -1) {
            layer.close(virtualAtoNLayerIndex);
        }
        if (arr.indexOf('careShipLayerIndex') > -1) {
            layer.close(careShipLayerIndex);
        }
        if (arr.indexOf('electronicFenceLayerDetailIndex') > -1) {
            layer.close(electronicFenceLayerDetailIndex);
        }
        if (arr.indexOf('eFenceTimelineLayer') > -1) {
            layer.close(eFenceTimelineLayer);
        }
        if (arr.indexOf('layerCustom') > -1) {
            layer.close(layerCustom);
        }
        if (arr.indexOf('_signedModeLayer') > -1) {
            layer.close(_signedModeLayer);
        }
        if (arr.indexOf('virtualAtoNLayerDetailIndex') > -1) {
            layer.close(virtualAtoNLayerDetailIndex);
        }
        if (arr.indexOf('electronicAlertLayer') > -1) {
            layer.close(window.electronicAlertLayer)
            window.electronicAlertLayer = ''
        }

        if (arr.indexOf('electronicHistoryLayer') > -1) {
            layer.close(window.electronicHistoryLayer)
            window.electronicHistoryLayer = ''
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
        // 碰撞
        if (arr.indexOf('fcwLayer') > -1) {
            if (map.hasLayer(fcwLayer)) {
                map.removeLayer(fcwLayer);
                fcwLayer.clearLayers();
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
        // 水文气象
        if (arr.indexOf('hymeLayer') > -1) {
            if (map.hasLayer(hymeLayer)) {
                map.removeLayer(hymeLayer);
                hymeLayer.clearLayers();
                // document.getElementById("hymeHistorySelect").children[0].style.color = ""

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
        //水文气象详细
        if (arr.indexOf('hymeDetailLayer') > -1) {
            layer.close(hymeDetailLayer);
            hymeDetailLayer = null;
            // document.getElementById("hymeHistorySelect").children[0].style.color = ""

        }
        // 设置中心点
        if (arr.indexOf('setCenterLayer') > -1) {
            layer.close(setCenterLayer)
            setCenterLayer = null;
            $('#map').css('cursor', "");
            $('#setCenter_lat').dfm().val("");
            $('#setCenter_lng').dfm().val("");
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
        // 图例
        if (arr.indexOf('legendLayer') > -1) {
            layer.close(legendLayer)
            legendLayer = null;
            $("#legend")[0].style.color = ""
        }
        // 左侧列表
        if (arr.indexOf('allList_left') > -1) {
            $("#allList_leftallList_left").css("display", "none");
            $("#search_box").css("display", "block");
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

        normalASCII: function (s) {
            if (s == '') {
                return '必填项不能为空';
            } else if (s.length > 0) {
                if (!checkutils.normalASCII(s)) {
                    return '请输入ASCII字符';
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

    });

    $("#allList_left_middle ul li").on({
        click: function () {
            var str = '';
            if ($(this)[0].innerHTML == "船舶") {
                const numArr = shipData.filter(e => e?.radarType != 2) || [];
                str = '【显示范围】' + numArr.length + '艘';
            } else if ($(this)[0].innerHTML == "雷达目标") {
                const numArr = shipData.filter(e => e?.radarType == 2) || [];
                str = '【显示范围】' + numArr.length + '个';
            } else if ($(this)[0].innerHTML == "岸站") {
                str = '【显示范围】' + stationCount + '个';
            } else if ($(this)[0].innerHTML == "助航设备") {
                str = '【显示范围】' + atonCount + '个';
            } else if ($(this)[0].innerHTML == "网位仪") {
                str = '【显示范围】' + netCount + '个';
            }
            $('#dataCount').html(str);
        }
    });


    $('#saerchMMSIorName').blur(function () {
        setTimeout(function () {
            $("#autoComplete").css("display", "none")
        }, 500);
    })

    getShipsCount(admin)
    // window.setInterval(function () {
    //     getShipsCount(admin)
    // }, 5000);
    $(function () {
        var c = `<div class="search-center-wrapper">
                        <div class="data-wrapper">
                            <span class="data-title ship-icon">船舶</span>
                            <span class="data-view">0</span>
                        </div>
                        <div class="data-txt">实时数据</div>
                        <div class="data-wrapper">
                            <span class="data-title net-icon">报警数</span>
                            <span class="data-view">0</span>
                        </div>
                    </div>`
        // var c='<input  type="text" style="margin-left:5px;font-size: 16px;width: 155px;display: inline" readonly class="layui-input"  value="实时船舶:0艘">'
        // +'<input  type="text" style="font-size: 16px;width: 153px;display: inline" readonly class="layui-input"  value="网位仪:0个">';
        $("#allCount").html(c)
    })

    function getShipsCount(admin) {
        admin.reqNoLoad('shipDynamicStatic-api/getShipAndNetsondeCount', {}, function (data) {
            shipDataAll = data.shipData;
            if (data != undefined) {
                admin.reqNoLoad('fishingPort60-api/alarmCount', {}, function (data2) {
                    if (data2 != undefined) {
                        var c = `<div class="search-center-wrapper">
                                <div class="data-wrapper">
                                    <span class="data-title ship-icon">船舶</span>
                                    <span class="data-view">${data.shipCount ? data.shipCount : 0}</span>
                                </div>
                                <div class="data-txt">实时数据</div>
                                <div class="data-wrapper">
                                    <span class="data-title net-icon">报警数</span>
                                    <span class="data-view">${data2.alarmCount ? data2.alarmCount : 0}</span>
                                </div>
                            </div>`
                        // var c='<input  type="text" style="margin-left:5px;font-size: 16px;width: 155px;display: inline" readonly class="layui-input"  value="实时船舶:'+data.shipCount+'艘">'
                        //     +'<input  type="text" style="font-size: 16px;width: 153px;display: inline" readonly class="layui-input"  value="网位仪:'+data.netsondeCount+'个">';

                    }
                    $("#allCount").html(c)
                }, "POST");
            }

        }, "POST");
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

    window.isMarkerOverlay = isMarkerOverlay;

    /**
     * 判断标记是否重叠
     * */
    function isMarkerOverlay(e) {
        let layers = [];
        var size = (mapCurrentLevel + 1) * 2;
        map.eachLayer(function (l) {
            if (l.options.contentType === 'cctv' || l.options.contentType === 'station') {
                l.getLayers().forEach(function (item) {
                    if (item._icon && (item._icon._leaflet_pos.x - size / 2 < e.layerPoint.x)
                        && (e.layerPoint.x < item._icon._leaflet_pos.x + size / 2)
                        && (item._icon._leaflet_pos.y - size / 2 < e.layerPoint.y)
                        && (e.layerPoint.y < item._icon._leaflet_pos.y + size / 2)) {
                        item.options.parentType = l.options.contentType;
                        layers.push(item);
                    }
                });
            }
        });

        if (layers.length > 1) {
            let tooltipStr = ["<dl class=\"\" style=\"background-color: #fff0!important;border: 0px solid #000 !important;padding-top:0px;padding-bottom:0px;left: -15px;top: 40px\">"];
            layers.forEach(function (item) {
                tooltipStr.push(`<dd>
                                <button class="layui-btn layui-btn-sm" name="${item.options.attribution}" parent-type="${item.options.parentType}" style="padding:0 10px;text-align: left;height: 30px;width: 112px;line-height:30px;background-color: rgba(66,66,66,1)!important;" lay-submit lay-filter="overlapStationChoose">
                                    <img style='width: 18px;height:18px;' src='${item._icon.src}'>
                                    <i class="layui-icon " style="text-align: right;font-size: 10px;display: inline-block;width: 74px">${item.options.attribution}</i>
                                </button>
                            </dd>`);
            });
            tooltipStr.push("</dl>");
            stationPopup = L.popup({closeButton: false, offset: L.point(0, -size / 2)})
                .setLatLng(e.latlng)
                .setContent(tooltipStr.join(""))
                .openOn(map);
            return true;
        } else {
            return false;
        }
    }


    //重点船舶
    //添加关注船舶
    form.on('submit(addCareShipInfo)', function (data) {
        addCareShipInfo(data)
    })

    //关注船舶列表
    function careShipFun() {
        table.render({
            elem: '#careShip-table',
            url: config.base_server + 'fleet-api/queryCareShips',
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + config.getToken().access_token},
            page: false,
            cols: [[
                {field: 'careShipMmsi', title: '船舶MMSI', align: 'left', width: 101},
                {
                    field: 'recvTime', title: '更新时间', align: 'left', width: 160, templet: function (d) {
                        return d.recvTime ? layui.util.toDateString(new Date(d.recvTime), "yyyy-MM-dd HH:mm:ss") : "-"
                    }
                },
                {
                    field: 'monitorFlag',
                    title: '监控开关',
                    align: 'left',
                    toolbar: '#monitorCheck',
                    templet: '#change',
                    width: 90
                },

                {fixed: 'right', align: 'center', toolbar: '#careShip-table-bar', title: '操作', width: 120}
            ]]
        });
        // 关注船舶 工具条点击事件
        table.on('tool(careShip-table)', function (obj) {
            var data = obj.data;
            var targetMmsi = data.careShipMmsi;
            var layEvent = obj.event;
            if (layEvent === 'editCareShipInfo') {
                addCareShipInfo(data)
            } else if (layEvent === 'delCareShipInfo') { // 关注船舶信息删除
                layer.confirm('确定删除此重点船舶吗？', function (i) {
                    layer.close(i);
                    layer.load(2);
                    saveCareShipMonitorCheck(obj.data.id, false);
                    admin.req('fleet-api/delCareShips/' + obj.data.id, {}, function (data) {
                        if (data.resp_code == 0) {
                            layer.msg(data.resp_msg, {icon: 1, time: config.msgTime});
                            table.reload('careShip-table', {});
                            getMyCareShips();
                            getShipData();
                            //碰撞列表
                            // table.reload('collisionMonitor-table', {});
                            //碰撞预警
                            getFcwShip();

                            // showShipDetail(targetMmsi);
                        } else {
                            layer.msg(data.resp_msg, {icon: 2, time: config.msgTime});
                        }
                    }, 'delete');
                });
            } else if (layEvent === 'careShipInfoDetail') {// 关注船舶详细
                if (shipData.length > 0) {
                    for (var i in shipData) {
                        if (shipData[i].mmsi == data.careShipMmsi) {
                            showShipDetail(data.careShipMmsi);
                            return;
                        }
                    }
                }
                layer.msg('该船舶不在监控范围！', {icon: 2, time: config.msgTime});

            }
        });
    }

    var careShipLayerIndex = "";

    //关注船舶添加修改
    function addCareShipInfo(data) {
        var title = "添加重点关注船舶";
        var param = {};
        if (data.careShipMmsi != null) {
            param.id = data.id;
            param.remarkCare = data.remarkCare;
            param.careShipMmsi = data.careShipMmsi;
            title = "修改重点关注船舶";
        } else {
            param.id = "";
            param.remarkCare = "";
            param.careShipMmsi = "";
            param.monitorFlag = 0;
        }
        form.val('careShip-form', param);
        form.render();
        careShipLayerIndex = layer.open({
            type: 1
            , offset: ['110px', '50%']
            , id: 'careshipinfoLayer'
            , title: title
            , content: $("#careShipInfoLayer")
            , btn: ''
            , shade: 0
            , skin: 'layui-layer-lan'
            , area: ['400px', '375px']
            , resize: false
            , cancel: function () {
            },
            end: function () {
                careShipLayerIndex = "";
            }
        });
    }

//    监控开关flag
    var monitorCheckFlag = false;
    form.on('switch(monitorCheck)', function (obj) {
        layer.confirm('确定切换监控开关吗？', {
            btn: ['确定', '取消'], //按钮
            cancel: function () {
                table.reload('careShip-table', {});
            }
        }, function () {
            saveCareShipMonitorCheck(obj.value, obj.elem.checked);
        }, function () {
            table.reload('careShip-table', {});
        });

    });

    //保存我关注船舶监控开关
    function saveCareShipMonitorCheck(id, checked) {
        var param = {id: id, monitorFlag: checked ? 0 : 1};
        admin.req('fishingPort60-api/api/fcw/saveOrUpdateMonitorCheck', JSON.stringify(param), function (data) {
            if (data.resp_code == 0) {
                layer.msg(data.resp_msg, {icon: 1, time: config.msgTime});
            } else {
                layer.msg(data.resp_msg, {icon: 2, time: config.msgTime});
            }
            table.reload('careShip-table', {});
            // 获取关注船舶数据
            getMyCareShips();
            getShipData();
            //碰撞列表
            // table.reload('collisionMonitor-table', {});
            //碰撞预警
            getFcwShip()
        }, "post");
        return false;
    }

    //
    function apiRmoveWatchMmsi(mmsi) {
        admin.req('fishingPort60-api/api/fcw/removeMMSI?mmsi=' + mmsi, "", function (data) {
        }, "post");
    }


    // function alertTable() {
    table.render({
        elem: '#collisionMonitor-table',
        layout: ['refresh'],
        url: config.base_server + 'fishingPort60-api/api/fcw/queryFcwShipPages',
        method: 'GET',
        headers: {'Authorization': 'Bearer ' + config.getToken().access_token},
        page: false,
        cols: [[
            {field: 'ammsi', title: 'MMSI(重点)', align: 'left', width: '110'},
            {field: 'bmmsi', title: 'MMSI', align: 'left', width: '110'},
            {
                field: 'resTCPA', title: 'TCPA(分)', align: 'left', width: '110', templet: function (e) {
                    return (e.resTCPA / 60).toFixed(4)
                }
            },
            {
                field: 'resDCPA', title: 'DCPA(海里)', align: 'left', width: '110', templet: function (e) {
                    return (e.resDCPA).toFixed(4)
                }
            },
            {
                field: 'resDCPA', title: 'DCPA(公里)', align: 'left', width: '110', templet: function (e) {
                    return (e.resDCPA * 1.852).toFixed(4)
                }
            },
        ]]
    });
    // }

    var myCareShips = "";

    function getMyCareShips() {
        admin.reqSync('fleet-api/careShipsInfo/getMyCareShips', "", function (data) {
            if (data.code != 404 && data.code != 500) {
                myCareShips = data;
            }
        }, "get");
    }

    // 添加关注船舶 保存
    form.on('submit(saveCareShip)', function (data) {
        saveCareShip(data)
    })

    //保存我关注船舶信息
    function saveCareShip(data) {
        var param = {};
        if (data.field != null) {
            param.id = data.field.id;
            param.monitorFlag = 0;
            param.careShipMmsi = data.field.careShipMmsi
            param.remarkCare = data.field.remarkCare;
        } else {
            param.id = data.value;
            param.monitorFlag = data.elem.checked ? 0 : 1
        }
        admin.req('fleet-api/careShips/saveOrUpdate', JSON.stringify(param), function (data) {
            layer.close(careShipLayerIndex);
            if (data.resp_code == 0) {
                //保存成功默认监控开关flag为true
                monitorCheckFlag = true;
                $("#careThisShip").hide();
                $("#cancleShip").show();
                //碰撞列表
                //碰撞列表
                table.reload('collisionMonitor-table', {});
                //碰撞预警
                getFcwShip();

                table.reload('careShip-table', {});
                // 获取关注船舶数据
                getMyCareShips();
                getShipData();
                layer.msg(data.resp_msg, {icon: 1, time: config.msgTime});
            } else {
                layer.msg(data.resp_msg, {icon: 2, time: config.msgTime});
            }
        }, "post");

        return false;
    }

    var fcwDraw1;
    var fcwDraw2;
    var fcwDraw3;
    var fcwDraw4;

    function getFcwShip() {
        // if (fcwShipFlushIndex)
        //     admin.req('fishingPort60-api/api/fcw/queryFcwShip', '', function (data) {
        //         // data.forEach(function (item, ind, len) {
        //         //     fcwShipList[item.ammsi] = item;
        //         // })
        //         var arr = ['fcwLayer'];
        //         rejectLayer(arr);
        //         if (data != null) {
        //             $.each(data, function (index, items) {
        //                 if (fcwShipFlushIndex) {
        //
        //                     fcwDraw1 = L.polyline([[items.ashipLat, items.ashipLng], [items.apointLat, items.apointLng]], {
        //                         color: '#9e9e9e',
        //                         dashArray: [10, 10],
        //                         weight: 2
        //                     }).addTo(fcwLayer);
        //                     fcwDraw2 = L.polyline([[items.bshipLat, items.bshipLng], [items.bpointLat, items.bpointLng]], {
        //                         color: '#9e9e9e',
        //                         dashArray: [10, 10],
        //                         weight: 2
        //                     }).addTo(fcwLayer);
        //
        //                     if (items.level == 1) {
        //                         fcwDraw3 = L.polyline([[items.apointLat, items.apointLng], [items.bpointLat, items.bpointLng]], {
        //                             color: '#ff0300',
        //                             dashArray: [5, 5],
        //                             weight: 2
        //                         }).addTo(fcwLayer);
        //                         fcwDraw4 = L.circle([items.apointLat, items.apointLng], {
        //                             radius: items.highDCPA * 1852,
        //                             color: "#ff2600",
        //                             fill: false,
        //                             dashArray: [5, 5]
        //                         }).addTo(fcwLayer);
        //                     } else {
        //                         fcwDraw3 = L.polyline([[items.apointLat, items.apointLng], [items.bpointLat, items.bpointLng]], {
        //                             color: '#fffb00',
        //                             dashArray: [5, 5],
        //                             weight: 2
        //                         }).addTo(fcwLayer);
        //                         fcwDraw4 = L.circle([items.apointLat, items.apointLng], {
        //                             radius: items.lowDCPA * 1852,
        //                             color: "#fffb00",
        //                             fill: false,
        //                             dashArray: [5, 5]
        //                         }).addTo(fcwLayer);
        //                     }
        //                     map.addLayer(fcwLayer);
        //                 }
        //             });
        //         }
        //     }, "get");
    }

    // 添加电子围栏
    $(".addElectronicFenceInfo").click(function () {
        electronicFenceInfoDetail()
    })
    //点击船舶时 关注船舶
    form.on('submit(careThisShip)', function (data) {
        var title = "关注船舶";
        $("input[name=careShipMmsi]").val($("#ship_MMSI").val())
        $("input[name=careShipMmsi]").attr("readonly", "readonly");
        form.render();
        careShipLayerIndex = layer.open({
            type: 1
            , offset: ['16%', '33%']
            , id: 'CareShipInfoLayer'
            , title: title
            , content: $("#careShipInfoLayer")
            , btn: ''
            , shade: 0
            , skin: 'layui-layer-lan'
            // , area: ['400px', '450px']
            , area: ['400px', '375px']
            , resize: false
            , cancel: function () {
            }
            , end: function () {
                careShipInfoLayer = ""
                $("input[name=careShipMmsi]").removeAttr("readonly");
            }
            , zIndex: 10000
        });
    });
    //取消关注船舶
    form.on('submit(cancleShip)', function (data) {
        layer.confirm('确定取消关注船舶吗？', function (i) {
            layer.close(i);
            layer.load(2);
            apiRmoveWatchMmsi($("#ship_MMSI").val());
            admin.req('fleet-api/quitMyCareShip/' + $("#ship_MMSI").val(), {}, function (data) {
                if (data.resp_code == 0) {
                    layer.msg(data.resp_msg, {icon: 1, time: config.msgTime});
                    $("#cancleShip").hide();
                    $("#careThisShip").show();

                    table.reload('careShip-table', {});
                    // 获取关注船舶数据
                    getMyCareShips();
                    getShipData();

                    //碰撞列表
                    //碰撞列表
                    table.reload('collisionMonitor-table', {});
                    //碰撞预警
                    getFcwShip();

                } else {
                    layer.msg(data.resp_msg, {icon: 2, time: config.msgTime});
                }
            }, 'delete');
        });
    });

    var heartCheck = {
        timeout: 5000, //重连时间
        timeoutObj: null,
        start: function () {
            this.timeoutObj = setTimeout(function () {
                getSocket() //这里重新创建 websocket 对象并赋值
            }, this.timeout)
        }
    }
    getSocket.timoutId = 0;

    function getSocket() {
        var wsCustom = new WebSocket(config.base_server.replace('http://', 'ws://') + `fishingPort60-api/websocket/sendMsg/${Date.now()}`);
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

        function formatlng(lng) {
            if (lng > 0) {
                return formatDegree(lng) + " E";
            } else {
                return formatDegree(Math.abs(lng)) + " W";
            }
        }

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

        wsCustom.onclose = function () {
            console.log('服务器已经断开');
            heartCheck.start();
        };
        wsCustom.onerror = function (err) {
            console.log("服务器报错：");
        };
        clearInterval(getSocket.timoutId);
        // 心跳 * 回应
        getSocket.timoutId = setInterval(function () {
            wsCustom.send('1');
        }, 1000 * 30);
    }

    getSocket()

    function openAlertGloble(dataObj) {
        let index = layer.open({
            type: 1
            , offset: [($(window).height() - 350)
                , ($(window).width() - 380)]
            , id: 'openAlertGloble_id' + Math.ceil(Math.random() * 10000)
            , title: "警告"
            // , content: $('#openAlertGloble')
            , content: `<div style="color: white; font-size: 15px; padding: 10px; line-height: 28px;">
        <div>MMSI: <span class="alert-mmsi">${dataObj.mmsi}</span></div>
        <div>时间: <span class="alert-time">${dataObj.time}</span></div>
        <div>位置：<span class="alert-lat">${Math.round((dataObj.latitude) * 10000) / 10000}</span> ，<span class="alert-lng">${Math.round((dataObj.longitude) * 10000) / 10000}</span> </div>
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
        $(".openAlertGlobleBtn").click(function () {
            eFenceAlert(map, admin, table, config, form, laytpl)
        })

        setTimeout(() => {
            layer.close(index)
        }, 60000)
    }

    // 获取视频数据
    function getCctvData() {
        admin.reqNoLoad('cctv-maintain/cctvInfo/getCctvData', null, function (res) {
            cctvMap = res.datas;
            if(!cctv){
                cctv = new layui.cctv(map, isMarkerOverlay);
            }
            cctv.enable(map);
        }, "GET");
    }

    // 雷达目标显示切换
    form.on('switch(layerControlLayer_radarTarget)', function (data) {
        if (data.elem.checked == true) {
            isShowRadarShip = 0;
        } else if (data.elem.checked == false) {
            isShowRadarShip = 1;
        }
        // showLoading();
        getShipData();
        saveUserCenter('layer');
    });

});