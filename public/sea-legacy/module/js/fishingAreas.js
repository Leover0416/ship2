// 渔业协定水域图层
var fishingGroupLayer = new L.layerGroup();

var areaNamelayer = new L.layerGroup();
var areaData = [
    {"name":"中韩渔业协定暂定水域","center":[35.50,123.13]},
    {"name":"中日渔业协定暂定水域","center":[29.28,125.63]},
    {"name":"中越渔业协定暂定水域","center":[19.50,107.12]},
    {"name":"中方过渡水域","center":[34.98,121.77]},
    {"name":"韩方过渡水域","center":[34.35,124.32]},
]
function initArea(sizeValue) {
    $.each(areaData, function (infoIndex, info) {
        // var polyline = L.polyline(info.point, {color: 'red'}).addTo(arealayer);
        var divIcon = new L.DivIcon({
            className: 'mydiv',
            html:'<span class="my-div-span" style="white-space:pre;background:rgba(251,250,250,0);color:#000;word-break:keep-all;font-size:'+sizeValue+';writing-mode:tb-rl">'+info.name+'</span>'
        });
        L.marker(info.center, {icon: divIcon}).addTo(areaNamelayer);
    })
}

//渔业协定水域
var fishingAreas = [
    {
        // text: '中韩渔业协定暂定水域',
        color: '#CB147F',
        zoom: [1, 18],
        img: 'url(../../assets/images/image.gif)',
        latlngs: [
            [37, 123.666666666667],
            [36.3730555555556, 123.181111111111],
            [35.5, 122.198333333333],
            [35.5, 122.031666666667],
            [34, 122.031666666667],
            [34, 122.198333333333],
            [33.3333333333333, 122.683333333333],
            [32.3333333333333, 123.75],
            [32.1833333333333, 123.825],
            [32.1833333333333, 125.416666666667],
            [33.3333333333333, 124.133333333333],
            [34, 124.008333333333],
            [35, 124.125],
            [35.5, 124.5],
            [36.75, 124.5],
            [37, 124.333333333333],
            [37, 123.666666666667]]
    },
    {
        text: '中日渔业协定暂定水域',
        color: '#CB147F',
        zoom: [1, 18],
        img: 'url(../../assets/images/image.gif)',
        latlngs: [[30.6666666666667, 124.168333333333],
            [30, 123.94],
            [29, 123.425],
            [28, 122.798333333333],
            [27, 121.956666666667],
            [27, 125.971666666667],
            [28, 127.251666666667],
            [29, 128.015],
            [30, 128.536666666667],
            [30.6666666666667, 128.435],
            [30.6666666666667, 124.168333333333]
        ]
    },
    {
        text: '中越渔业协定暂定水域',
        color: '#CB147F',
        zoom: [1, 18],
        img: 'url(../../assets/images/image.gif)',
        latlngs: [[17.3938888888889, 107.578611111111],
            [18.1555555555556, 108.338333333333],
            [18.7402777777778, 107.6975],
            [19.1358333333333, 107.6975],
            [19.7166666666667, 108.341666666667],
            [20, 108.708888888889],
            [20, 107.961666666667],
            [19.8761111111111, 107.961666666667],
            [19.8761111111111, 107.483333333333],
            [20, 107.483333333333],
            [20, 107.128055555556],
            [19.5519444444444, 106.621388888889],
            [18.6666666666667, 106.621388888889],
            [18.3161111111111, 106.885555555556],
            [18, 107.031944444444],
            [17.3938888888889, 107.578611111111]
        ]
    },
    {
        text: '中方过渡水域', color: '#7848FF', zoom: [1, 18], img: 'url(../../assets/images/menu.png)', latlngs: [
            [35.5, 121.916667],
            [35, 121.5],
            [34, 121.5],
            [33.333333, 122],
            [31.833333, 123],
            [31.833333, 124],
            [32.333333, 123.75],
            [33.333333, 122.683333],
            [34, 122.198333],
            [34, 122.031667],
            [35.5, 122.031667],
            [35.5, 121.916667]
        ]
    },
    {
        text: '韩方过渡水域', color: '#7848FF', zoom: [1, 18], img: 'url(../../assets/images/menu.png)', latlngs: [
            [35.5, 124.5],
            [35, 124.125],
            [34, 124.008333],
            [33.333333, 124.133333],
            [32.183333, 125.416667],
            [32.183333, 126.75],
            [32.666667, 127],
            [32.408333, 126.283333],
            [32.483333, 125.958333],
            [33.333333, 125.466667],
            [34, 124.583333],
            [34.416667, 124.55],
            [35.5, 124.8],
            [35.5, 124.5]
        ]
    }
];

function showFishingAreas(map) {

    // 画渔业协定区
    if (map.hasLayer(fishingGroupLayer)) {
        map.removeLayer(fishingGroupLayer);
        fishingGroupLayer.clearLayers();
    }
//******
    if (map.hasLayer(areaNamelayer)) {
        map.removeLayer(areaNamelayer);
        areaNamelayer.clearLayers();
    }

    var layers = [];
    for (var i = 0; i < fishingAreas.length; i++) {
        var area = fishingAreas[i];
        if (map.getZoom() >= area.zoom[0] && map.getZoom() <= area.zoom[1]) {
            var layer = L.polygon(area.latlngs, {fill: area.img, color: area.color, weight: 0}).addTo(map);
            if (map.getZoom() >= 8) {
                initArea('18px');
            }else if(map.getZoom() >= 6){
                initArea('6px');
            }
            // if (map.getZoom() >= 6) {
            //    // var qq= document.getElementById('aaa').style.fontSize = '20px';
            //     initArea('13px');
            //     // layer.setText(area.text, {
            //     //
            //     //     repeat: false,
            //     //     offset: -30,
            //     //     // center: true,//居中
            //     //     attributes: {
            //     //         fill: "#000",
            //     //         'font-weight': '100',
            //     //         'font-size': map.getZoom() * 2,
            //     //         'font-family': "微软雅黑",
            //     //         'letter-spacing': '8px',
            //     //     }
            //     // });
            // }
            layers.push(layer)
            // for (var j = 0; j < area.latlngs.length; j++) {
            //     bounds.push(area.latlngs[j]);
            // }
        }
    }

    if (layers.length > 0) {
        fishingGroupLayer = L.layerGroup(layers);
        map.addLayer(fishingGroupLayer);
        map.addLayer(areaNamelayer);
        // map.fitBounds(bounds);
    }
};
//图层关闭方法
function closeArea(map) {
    map.removeLayer(fishingGroupLayer);
    map.removeLayer(areaNamelayer);
}


