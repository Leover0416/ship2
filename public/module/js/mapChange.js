//地图切换btn
var _map;
var _tileLayer;
var _url;

function mapChangeInit(mapType, map, tileLayer, url, callback) {
    var dt = '';
    dt += '<div style="position:absolute;width:100%;min-width:900px; bottom:0;right: 0"><div class="mapDiv_bg" style="width: 280px; opacity: 0;"></div>                                                                              '
    dt += '<div class="mapDiv mapDiv_hide">'
    if (mapType == undefined || mapType == "海图") {
        dt += '<a title="天地图" class="map_layer1" style="right: 10px; opacity: 0.5;"><img src="../../assets/images/tdt.png" alt="天地图"><b>天地图</b></a>'
        dt += '<a title="海图"  class="map_layer0" style="opacity: 1; right: 0px;"><img src="../../assets/images/ht.png" alt="海图"><b>海图</b></a>'
        dt += '<a title="卫星图"  class="map_layer2" style="opacity: 0.3; right: 20px;"><img src="../../assets/images/wxt.png" alt="卫星图"><b>卫星图</b></a>'
        var CSVALUEParam;
        if (map.getZoom() >= 9) {
            CSVALUEParam = '100000,5,20,10,1,2,1,500000,100000,200000,1';
        } else {
            CSVALUEParam = '100000,5,20,10,2,1,1,500000,100000,200000,1';
        }
        tileLayer = L.tileLayer.wms(url, {
                version: '1.3.0',
                layers: 'ENC',
                format: 'image/png',
                CSBOOL: parseInt('1000000000000010', 2).toString(16),
                CSVALUE: CSVALUEParam
            }
        );
    } else if (mapType == "天地图") {
        dt += '<a title="海图" class="map_layer1" style="right: 10px; opacity: 0.5;"><img src="../../assets/images/ht.png" alt="海图"><b>海图</b></a>'
        dt += '<a title="天地图"  class="map_layer0" style="opacity: 1; right: 0px;"><img src="../../assets/images/tdt.png" alt="天地图"><b>天地图</b></a>'
        dt += '<a title="卫星图"  class="map_layer2" style="opacity: 0.3; right: 20px;"><img src="../../assets/images/wxt.png" alt="卫星图"><b>卫星图</b></a>'
        var normalMapm = L.tileLayer.chinaProvider("TianDiTu.Normal.Map", {
            maxZoom: 22,
            minZoom: 1
        })
        var normalMapa = L.tileLayer.chinaProvider("TianDiTu.Normal.Annotion", {
            maxZoom: 22,
            minZoom: 1
        });

        tileLayer = L.layerGroup([normalMapm, normalMapa])
    } else if (mapType == "卫星图") {
        dt += '<a title="天地图" class="map_layer1" style="right: 10px; opacity: 0.5;"><img src="../../assets/images/tdt.png" alt="天地图"><b>天地图</b></a>'
        dt += '<a title="卫星图"  class="map_layer0" style="opacity: 1; right: 0px;"><img src="../../assets/images/wxt.png" alt="卫星图"><b>卫星图</b></a>'
        dt += '<a title="海图" class="map_layer2" style="right: 20px; opacity: 0.5;"><img src="../../assets/images/ht.png" alt="海图"><b>海图</b></a>'
        // //加载卫星地图
        var imgm = L.tileLayer.chinaProvider("TianDiTu.Satellite.Map", {}),
            imga = L.tileLayer.chinaProvider("TianDiTu.Satellite.Annotion", {});
        tileLayer = L.layerGroup([imgm, imga]);
    }
    dt += '</div></div>'
    $('body').append(dt);
    map.addLayer(tileLayer);
    _map = map;
    _tileLayer = tileLayer
    _url = url;
    $(".mapDiv a").click(function () {
        $(".mapDiv").removeClass("mapDiv_show").addClass("mapDiv_hide");
        $(".mapDiv a").removeClass("map_layer0 map_layer1 map_layer2");
        $(this).addClass("map_layer0");
        $($(this).siblings("a")[0]).addClass("map_layer1");
        $($(this).siblings("a")[1]).addClass("map_layer2");
        mapShowHide.mapsHide();
        _map.removeLayer(_tileLayer);
        if ($(this)[0].innerText == "海图") {
            if (map.getZoom() >= 9) {
                CSVALUEParam = '100000,5,20,10,1,2,1,500000,100000,200000,1';
            } else {
                CSVALUEParam = '100000,5,20,10,2,1,1,500000,100000,200000,1';
            }
            _tileLayer = L.tileLayer.wms(_url, {
                    version: '1.3.0',
                    layers: 'ENC',
                    format: 'image/png',
                    CSBOOL: parseInt('1000000000000010', 2).toString(16),
                    CSVALUE: CSVALUEParam
                }
            );
        } else if ($(this)[0].innerText == "天地图") {
            var normalMapm = L.tileLayer.chinaProvider("TianDiTu.Normal.Map", {
                maxZoom: 22,
                minZoom: 1
            })
            var normalMapa = L.tileLayer.chinaProvider("TianDiTu.Normal.Annotion", {
                maxZoom: 22,
                minZoom: 1
            });
            _tileLayer = L.layerGroup([normalMapm, normalMapa])
        } else if ($(this)[0].innerText == "卫星图") {
            _map.removeLayer(_tileLayer);
            // //加载卫星地图
            var imgm = L.tileLayer.chinaProvider("TianDiTu.Satellite.Map", {}),
                imga = L.tileLayer.chinaProvider("TianDiTu.Satellite.Annotion", {});
            _tileLayer = L.layerGroup([imgm, imga]);
        }
        _tileLayer.addTo(_map);
        callback($(this)[0].innerText,_tileLayer);
    })

    if ($(document).width() < 1200 && (
        navigator.userAgent.match(/Mobi/i) ||
        navigator.userAgent.match(/Android/i) ||
        navigator.userAgent.match(/iPhone/i)
    )) {
        $(document).click(function (e) {
            mapShowHide.mathPagexy();
            if (isOpen) {
                mapShowHide.closeMaptabs(e);
            } else {
                mapShowHide.openMaptabs(e);
            }
        })
    } else {
        $(document).mousemove(function (e) {
            mapShowHide.mathPagexy();
            if (isOpen) {
                mapShowHide.closeMaptabs(e);
            } else {
                mapShowHide.openMaptabs(e);
            }
        })
    }

    return tileLayer;
}

var isPlaying = false;
var isOpen = false;
var mapShowHide = {
    showX: 0, showY: 0, hideX: 0, hideY: 0,
    mathPagexy: function () {
        var _ = this;
        // var width = $("body").width();
        // var height = $("body").height();
        var width = $(window).width();
        var height = $(window).height();
        //功能需要
        _.showX = width - 443;
        _.showY = height - 80;
        _.hideX = width - 106;
        _.hideY = height - 70;
    },
    openMaptabs: function (e) {
        var _ = this;
        if (isPlaying) return;
        if (e.pageX > _.hideX && e.pageY > _.hideY) {
            isPlaying = true;
            _.mapsShow();
            setTimeout(function () {
                isPlaying = false
            }, 500);
        }
    },
    closeMaptabs: function (e) {
        var _ = this;
        if (isPlaying) return;
        if (e.pageX < _.showX || e.pageY < _.showY) {
            isPlaying = true;
            _.mapsHide();
            setTimeout(function () {
                isPlaying = false
            }, 500);
        }
    },
    mapsShow: function () {
        $(".mapDiv_bg").animate({opacity: 0.7, width: "280px"}, 300);
        $(".map_layer1").animate({right: "86px", opacity: 1}, 400);
        $(".map_layer2").animate({right: "172px", opacity: 1}, 400);
        $(".mapDiv").removeClass("mapDiv_hide").addClass("mapDiv_show");
        isOpen = true;
    },
    mapsHide: function () {
        $(".mapDiv_bg").animate({opacity: 0, width: "280px"}, 300);
        $(".map_layer0").animate({right: "0"}, 500);
        $(".map_layer1").animate({right: "10px", opacity: 0.5}, 400);
        $(".map_layer2").animate({right: "20px", opacity: 0.3}, 400);
        $(".mapDiv").removeClass("mapDiv_show").addClass("mapDiv_hide");
        isOpen = false;
    }
}

