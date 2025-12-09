// 航行警告图层
var warningGroupLayer = new L.layerGroup();

// 航行警告坐标
var warningAreas = [
    {
        text: '',
        color: '#ec0a0a',
        zoom: [1, 18],
        img: 'url(../../assets/images/image.gif)',
        latlngs: [
            [37.5664, 122.0622],
            [37.5752, 122.0750],
            [37.5750, 122.0809],
            [37.5653, 122.1173],
            [37.5629, 122.1153],
            // [37.5521, 122.1220],
            [37.5495, 122.1090],
            [37.5482, 122.1064],
            [37.5419, 122.1001],
            [37.5444, 122.0954],
            [37.5498, 122.0987],
            [37.5513, 122.0818],
            [37.5577, 122.0773],
            [37.5664, 122.0622],
        ]
    }
];

function showWarningArea(map) {

    if (map.hasLayer(warningGroupLayer)) {
        map.removeLayer(warningGroupLayer);
        warningGroupLayer.clearLayers();
    }

    var layers = [];
    for (var i = 0; i < warningAreas.length; i++) {
        var area = warningAreas[i];
        if (map.getZoom() >= area.zoom[0] && map.getZoom() <= area.zoom[1]) {
            var layer = L.polygon(area.latlngs, {fill: area.img, color: area.color, weight: 1}).addTo(map);
            layers.push(layer)
        }
    }

    if (layers.length > 0) {
        warningGroupLayer = L.layerGroup(layers);
        map.addLayer(warningGroupLayer);
    }
};

//图层关闭方法
function closeWarningArea(map) {
    map.removeLayer(warningGroupLayer);
    warningGroupLayer.clearLayers();
}


