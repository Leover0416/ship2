var _layer;
var _form;
var _config;
var _admin;
var _table;
var _map;
var markerTableLayerIndex="";
var oldLineData=[];
var newLineData=[];
var allPoints=[];
var allLines=[];
var markerLayers=[];
var polylineLayers=[];
var latlngs=[];
var t = "";
var polyline="";
var tmpId="";
var tmpTitle="";
var mhtml="<div id='markerControlLayer' class='layui-form' style='height:460px;'>" +
    "<div class='layui-form-item' style='padding-top: 8px; margin-bottom: 0'>" +
    "<label class='layui-form-label' style='width:100px;'>类型：</label>" +
    "<div class='layui-input-block' style='margin: 0 100px;'>" +
    "<input type='radio' id='markerPoint' name='markerType' lay-filter='markerType'" +
    "   value='0' title='油井/风电' checked=''>" +
    "<input type='radio' id='markerLine' name='markerType' lay-filter='markerType'" +
    "   value='1' title='管道'>" +
    "</div>" +
    "</div>" +
    "<div style='margin-top: -25px'>" +
    "<a href='javascript:void(0)' class=' ' style='float:right;margin-right:5%;color: #DBD9D1' title='增加' onclick='addMarker()'><i class='layui-icon '  >&#xe654;</i> 新增</a>" +
    "</div>" +
    "<table class='layui-table' id='markerTable' lay-filter='markerTable' style='max-height: 50px;overflow-y: auto'></table>" +
    "</div>";

var pointhtml = '<form id="ShipMarkerEditBox" class="layui-form">';
pointhtml +='<p style="color: #fff;margin-left: 10px;height: 30px;margin-top: 10px"><label style="width: 50px">名称：</label><input type="hidden" id="markId" value=""/><input type="hidden" id="sort" value=""/><input  class="custom-input" id="title" name="title" placeholder="名称" style="width: 200px;    padding: 6px 3px;" type="text"  maxlength="255" lay-verify="required" required autocomplete="off"/></p>';
pointhtml +='<p style="color: #fff;margin-left: 10px;height: 30px;margin-top: 10px"><label style="width: 50px;margin-right: 5px;">类型：</label><input type="radio" id="markerPoint1" name="markerType1"  value="0" title="油井" checked=""> <input type="radio" id="markerPoint1" name="markerType1"  value="1" title="风电"></p>';
pointhtml +='<p style="color: #fff;margin-left: 10px;height: 30px;margin-top: 10px"><label style="width: 50px">纬度：</label><input class="custom-input dfm"  id="latd" type="text" style="width: 60px" name=""  check="纬度不能为空||/^[\\d-]+$/||纬度必须为整数||[0.0,89.9999]||纬度必须在[0,90)之间" onkeyup="Form.chk(this)" />°<input  class="custom-input dfm" id="latf" type="text" style="width: 60px"name=""  check="分不能为空||[0.0,59.9999]||分必须在[0,60)之间" onkeyup="Form.chk(this)" />‘<input  class="custom-input dfm" id="latm" type="text" style="width: 60px"name=""  check="分不能为空||[0.0,59.9999]||分必须在[0,60)之间" onkeyup="Form.chk(this)" />‘‘</p>' ;
pointhtml +='<p style="color: #fff;margin-left: 10px;height: 30px;margin-top: 10px"> <label style="width: 50px">经度：</label><input class="custom-input dfm" id="lngd" type="text" style="width: 60px" name="" check="经度不能为空||/^[\\d-]+$/||经度必须为整数||[0.0,179.9999]||经度必须在[0,180)之间" onkeyup="Form.chk(this)" />°<input  class="custom-input dfm" id="lngf" type="text" style="width: 60px"name="" check="分不能为空||[0.0,59.9999]||分必须在[0,60)之间||{z:2}" onkeyup="Form.chk(this)" />’<input  class="custom-input dfm" id="lngm" type="text" style="width: 60px"name=""  check="分不能为空||[0.0,59.9999]||分必须在[0,60)之间||{z:2}" onkeyup="Form.chk(this)" />‘‘</p>';
pointhtml +='<p style="color: #fff;margin-left: 55px;height: 30px;margin-top: 10px"><button type="button" class="layui-btn layui-btn-normal" onclick="saveMarker()" style="width: 100px;">保存</button><button type="button" class="layui-btn layui-btn-normal" style="width: 100px;" onclick="close1()">取消</button></p>';
pointhtml +='</form>';

var  linehtml ='<p style="color: #fff;margin-left: 10px;height: 30px;margin-top: 10px"><label style="width: 50px">名称：</label><input class="custom-input" id="title" name="title" placeholder="名称" style="width: 280px;    padding: 6px 3px;" type="text"  maxlength="255" lay-verify="required" required autocomplete="off"/></p>';
linehtml +='<table class="layui-table" id="markerLineTable" lay-filter="markerLineTable" style="max-height: 50px;overflow-y: auto"></table>';
linehtml +='<p style="color: #fff;margin-left: 95px;height: 30px;margin-top: 10px"><button type="button" class="layui-btn layui-btn-normal" onclick="saveLines()" style="width: 100px;">保存</button><button type="button" class="layui-btn layui-btn-normal" style="width: 100px;" onclick="close2()">取消</button></p>';

//初始化变量 事件绑定
function initMarker(map,config,admin,layer,form,table,layersIndex,callback) {
    _layer = layer;
    _form=form;
    _config=config;
    _admin=admin;
    _table=table;
    _map=map;
    getSeaMapMarker();
    _form.on('submit(markerTableLayer)', function (data) {
        callback(layersIndex);
        var title = "标记";
        var offset = 'rt';
        var area = ['500px'];
        var close = function () {
        };
        // if(markerTableLayerIndex!=""){
        //     _layer.close(markerTableLayerIndex);
        //     markerTableLayerIndex="";
        // }
        markerTableLayerIndex=_layer.open({
            type: 1
            , offset: offset
            , id: 'markerTable_id'
            , title: title
            , content: mhtml
            , btn: ''
            , shade: 0
            , skin: 'layui-layer-lan markerTableLayer'
            , area: area
            , resize: false
            , scrollbar: false
            , cancel: close
            , success: function (layero, index) {
                _layer.style(index, {
                    marginLeft: -20,
                    marginTop: 70,
                })
                _form.render();

                showMarkerList();
            },
            end:function (layero, index) {

            },
        })
    })
    _form.on('radio(markerType)', function (data) {
        var v= data.value;
        if(v==0){
            showMarkerList();
        }else {
            showMarkerLinesList();
        }
    });
    _table.on('tool(markerLineTable)', function (obj) {
        var data = obj.data;
        var layEvent = obj.event;
        if (layEvent === 'delLine') {
            newLineData.splice(arrayContains(newLineData,obj.data,1),1);
            latlngs.splice(arrayContains(latlngs,obj.data,0),1);
            for(var i=0;i< allLines.length;i++){
                if(allLines[i].title==data.title){
                    allLines.splice(i,1);
                    _map.removeLayer(polylineLayers[i]);
                    polylineLayers.splice(i,1);
                    break;
                }
            }
            tmpTitle=data.title;
            if(polyline!=""){
                _map.removeLayer(polyline);
            }
            polyline = L.polyline(latlngs, {color: '#3333ff'}).addTo(_map);
            tableRender(newLineData);
        }
    })
    _table.on('tool(markerTable)', function (obj) {
        var data = obj.data;
        var layEvent = obj.event;
        if (layEvent === 'delPoint') {
            for(var i=0;i<allPoints.length;i++){
                if(allPoints[i].title==data.title){
                    allPoints.splice(i,1);
                    _map.removeLayer(markerLayers[i]);
                    markerLayers.splice(i,1);
                    break;
                }
            }
            deletePoint(data.id);
        }else if(layEvent ==='delLines'){
            for(var i=0;i< allLines.length;i++){
                if(allLines[i].title==data.title){
                    allLines.splice(i,1);
                    _map.removeLayer(polylineLayers[i]);
                    polylineLayers.splice(i,1);
                    break;
                }
            }
        }

        deleteLines(data.title)
    })


}

function getSeaMapMarker() {
    _admin.req('api-user/seaMap/getSeaMapMarker', {}, function (res) {
        var points = res.points;
        var lines = res.lines;
        allPoints=res.points;
        allLines=res.lines;
        markerLayers=[];
        for (var i in points) {
            addMarkerPoint(points[i].lat, points[i].lng, points[i].title,points[i].type)
        }
        for (var i in lines) {
            addMarkerLine(lines[i].latlngs, lines[i].title)
        }
    }, "post")
}

//点标记
function addMarkerPoint(lat, lng, title,type) {
    var icon="";
    var iconSize="";
    if(type==0){
        icon="../../assets/images/yj.svg";
        iconSize=[20, 20];
    }else {
        icon="../../assets/images/fd.svg";
        iconSize=[50, 50];
    }

    // if(markerLayer!=""){
    //     _map.removeLayer(markerLayer);
    // }
    // if(markerTitleLayer!=""){
    //     _map.removeLayer(markerTitleLayer);
    // }

    var markerLayer=L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: icon,
            iconSize: iconSize,
            iconAnchor: [-5, -10]
        }),
        interactive: true,
        draggable: false,
        title:title
    }).addTo(_map);
    markerLayers.push(markerLayer)
    // markerTitleLayer=L.marker([lat, lng], {
    //     icon: new L.DivIcon({
    //         className: 'mydiv',
    //         iconAnchor: [-10, 10],
    //         html: '<span class="my-div-span" style="background:#000;color:#fff;word-break:keep-all;font-size:12px;margin-top:30px;">' + title + '</span>'
    //     })
    // }).addTo(_map);
}

//线标记
function addMarkerLine(latlngs, title) {
    var line = L.polyline(latlngs, {color: '#3333ff'}).addTo(_map);
    polylineLayers.push(line);
    //var polyline = L.polyline(latlngs, {color: '#3333ff'}).addTo(_map);
    // L.marker(latlngs[0], {
    //     icon: new L.DivIcon({
    //         className: 'mydiv',
    //         iconAnchor: [-10, 10],
    //         html: '<span class="my-div-span" style="background:#3333ff;color:#fff;word-break:keep-all;font-size:12px;margin-top:30px;">' + title + '</span>'
    //     })
    // }).addTo(_map);
}




//点列表
function showMarkerList() {
    // 船舶列表
    _table.render({
        elem: '#markerTable',
        url: _config.base_server + 'api-user/seaMap/pointsPage',
        method: 'GET',
        headers: {'Authorization': 'Bearer ' + _config.getToken().access_token},
        page: true,
        id: 'markerList'
        , size: 'sm'
        , cols: [[
            {field: 'title', title: '名称', width: '80%'},
            {
                field: '', title: '操作', width: '20%', templet: function (d) {
                    var t = '<a href="javascript:void(0)" style="padding-left:5px;color: #DBD9D1" onclick="editMarker(\''+d.id+'\',\''+d.title+'\',\''+d.type+'\',\''+d.lat+'\',\''+d.lng+'\',\''+d.sort+'\')"><i class="layui-icon "  >&#xe642;</i></a>';
                    t += '<a class=" " style="padding-left:5px;color: #DBD9D1" lay-event="delPoint"><i class="layui-icon "  >&#x1006;</i></a>';
                    return t
                }
            }
        ]],


    });

}
//线列表
function showMarkerLinesList() {
    _table.render({
        elem: '#markerTable',
        url: _config.base_server + 'api-user/seaMap/linesPage',
        method: 'GET',
        headers: {'Authorization': 'Bearer ' + _config.getToken().access_token},
        page: true,
        id: 'markerList'
        , size: 'sm'
        , cols: [[
            {field: 'title', title: '名称', width: '80%'},
            {
                field: '', title: '操作', width: '20%', templet: function (d) {
                    var t = '<a href="javascript:void(0)" style="padding-left:5px;color: #DBD9D1" onclick="editMarkerLine(\''+d.id+'\',\''+d.title+'\',\''+d.type+'\')"><i class="layui-icon "  >&#xe642;</i></a>';
                    t += '<a class=" " style="padding-left:5px;color: #DBD9D1" lay-event="delLines"><i class="layui-icon "  >&#x1006;</i></a>';
                    return t
                }
            }
        ]]

    });

}
//编辑单条线原数据
function showMarkerLine(title) {
    _admin.req('api-user/seaMap/lineList', JSON.stringify({title:title}), function (res) {
        oldLineData=res;
        newLineData=res;
        latlngs=[];
        for(var i in res){
            var ls=[]
            ls.push(parseFloat(res[i].lat));
            ls.push(parseFloat(res[i].lng));
            latlngs.push(ls)
        }
        tableRender(res)
    },'POST')
}
//新增点线标记
function addMarker() {
    var value= $("input[name='markerType']:checked ").val();
    if(value==0){
        t = _layer.open({
            type: 1
            , offset: 'rt'
            , id: 'mess'
            , title: "新增标记"
            , content: pointhtml
            , btn: ''
            , shade: 0
            , skin: 'layui-layer-lan mess'
            , area: ['300px', '300px']
            , resize: false
            , cancel: close1()
            , success: function (layero, index) {
                _form.render();
                layer.style(index, {
                    marginLeft: -550,
                    marginTop: 120
                });
                $('#map').css('cursor', "url('../../assets/images/location.cur') 6 12,auto");
                _map.on('click', function (e) {
                    var pointLat = e.latlng.lat+"";
                    var pointLng = e.latlng.lng+"";
                    var wd=changeToDFM(pointLat)
                    var jd=changeToDFM(pointLng)
                    $("#latd").val(wd[0]);
                    $("#latf").val(wd[1]);
                    $("#latm").val(wd[2]);
                    $("#lngd").val(jd[0]);
                    $("#lngf").val(jd[1]);
                    $("#lngm").val(jd[2]);
                    allPoints.push({lat:pointLat,lng:pointLng,title:$("#title").val(),type:$("input[name='markerType1']:checked ").val()})
                    addMarkerPoint(pointLat, pointLng,   $("#title").val(),$("input[name='markerType1']:checked ").val());
                    $('#map').css('cursor', "");
                    _map.off('click');
                })
            }
        });
    }else {
        t = _layer.open({
            type: 1
            , offset: 'rt'
            , id: 'mess1'
            , title: "新增标记"
            , content: linehtml
            , btn: ''
            , shade: 0
            , skin: 'layui-layer-lan'
            , area: ['400px', '400px']
            , resize: false
            , cancel: close1()
            , success: function (layero, index) {
                layer.style(index, {
                    marginLeft: -550,
                    marginTop: 120
                });
                newLineData=[];
                latlngs=[];
                $('#map').css('cursor', "url('../../assets/images/location.cur') 6 12,auto");
                _map.on('click', function (e) {
                    newLineData.push({lat:e.latlng.lat.toFixed(4)+"",lng:e.latlng.lng.toFixed(4)+""});
                    latlngs.push([e.latlng.lat.toFixed(4),e.latlng.lng.toFixed(4)]);
                    if(polyline!=""){
                        _map.removeLayer(polyline);
                    }
                    polyline = L.polyline(latlngs, {color: '#3333ff'}).addTo(_map);

                    //polyline._latlngs=[]
                    // console.log(polyline)
                    // if(newLineData.length>1){
                    //     //3.绘制图案
                    //     var pathPattern = L.polylineDecorator(latlngs, {
                    //         //添加模式
                    //         patterns: [
                    //
                    //             {
                    //                 //模式符号的偏移位置
                    //                 offset: '0%',
                    //                 //模式符号的重复间隔
                    //                 repeat: '2%',
                    //                 //符号实例
                    //                 symbol: L.Symbol.marker({
                    //                     //是否允许旋转
                    //                     rotate: true,
                    //                     //标记显示样式
                    //                     markerOptions: {
                    //                         //图标
                    //                         icon: L.icon({
                    //                             //图标地址
                    //                             iconUrl: '../../assets/images/gd.svg',
                    //                             //图标位置
                    //                             iconAnchor: [16, 16]
                    //                         })
                    //                     }
                    //                 })
                    //             }
                    //         ]
                    //     }).addTo(_map);
                    //
                    tableRender(newLineData);
                    //}
                    // $('#map').css('cursor', "");
                    // _map.off('click');
                })
            }
            ,end: function(layero, index){

            }
        });
    }

}
//点条线表格渲染
function tableRender(data) {
    _table.render({
        elem: '#markerLineTable',
        data:data,
        id: 'markerLineList'
        , size: 'sm'
        , cols: [[
            {type:'numbers',title: '序号',width: '8%'},
            {field: 'lat', title: '纬度', width: '40%',templet: function (d) {
                    var lat=changeToDFM(d.lat+'');
                    var html="<input class='custom-input dfm' value='"+lat[0]+"' style='width: 30px'/><span>°</span><input class='custom-input dfm' value='"+lat[1]+"' style='width: 30px'/><span>′</span><input class='custom-input dfm' value='"+lat[2]+"' style='width: 30px'/><span>′′</span>"
                    return html;
                }},
            {field: 'lng', title: '经度', width: '40%',templet: function (d) {
                    var lng=changeToDFM(d.lng+'');
                    var html="<input class='custom-input dfm' value='"+lng[0]+"' style='width: 30px'/><span>°</span><input class='custom-input dfm' value='"+lng[1]+"' style='width: 30px'/><span>′</span><input class='custom-input dfm' value='"+lng[2]+"' style='width: 30px'/><span>′′</span>"
                    return html;
                }},
            {
                field: '', title: '操作', width: '12%',templet: function (d) {
                    return '<a style="color: #DBD9D1" lay-event="delLine"><i class="layui-icon "  >&#x1006;</i></a>';
                }
            }
        ]]
    });
}
//编辑点
function editMarker(id ,title,type,lat,lng,sort) {
    t = _layer.open({
        type: 1
        , offset: 'rt'
        , id: 'mess'
        , title: "修改标记"
        , content: pointhtml
        , btn: ''
        , shade: 0
        , skin: 'layui-layer-lan mess'
        , area: ['300px', '300px']
        , resize: false
        , cancel: close1()
        , success: function (layero, index) {
            $("#markId").val(id);
            $("#sort").val(sort);
            $("#title").val(title);
            $("input[name='markerType1'][value=" + type + "]").prop("checked", true);
            var wd=changeToDFM(lat)
            var jd=changeToDFM(lng)
            $("#latd").val(wd[0]);
            $("#latf").val(wd[1]);
            $("#latm").val(wd[2]);
            $("#lngd").val(jd[0]);
            $("#lngf").val(jd[1]);
            $("#lngm").val(jd[2]);
            _form.render();
            layer.style(index, {
                marginLeft: -550,
                marginTop: 120
            });
        }
        ,end: function(layero, index){

        }
    });
}
//编辑线
function editMarkerLine(id ,title,type) {
    t = _layer.open({
        type: 1
        , offset: 'rt'
        , id: 'mess1'
        , title: "修改标记"
        , content: linehtml
        , btn: ''
        , shade: 0
        , skin: 'layui-layer-lan mess'
        , area: ['400px', '400px']
        , resize: false
        , cancel: close2()
        , success: function (layero, index) {
            layer.style(index, {
                marginLeft: -550,
                marginTop: 120
            });
            $("#title").val(title);
            showMarkerLine(title);
        }
        ,end: function(layero, index){

        }
    });
}
var centerPosition = new L.marker([0, 0], {
    icon: L.icon({
        iconUrl: '../../assets/images/yj.svg',
        iconSize: [16, 24],
        iconAnchor: [8, 12]
    }), interactive: true, draggable: true
});
var centerPosition1 = new L.marker([0, 0], {
    icon: L.icon({
        iconUrl: '../../assets/images/gd.svg',
        iconSize: [16, 24],
        iconAnchor: [8, 12]
    }), interactive: true, draggable: true
});
centerPosition.on('dragend', function (event) {
    var position = centerPosition.getLatLng();
    var wd=changeToDFM(position.lat+"");
    var jd=changeToDFM(position.lng+"");
    $("#latd").val(wd[0]);
    $("#latf").val(wd[1]);
    $("#latm").val(wd[2]);
    $("#lngd").val(jd[0]);
    $("#lngf").val(jd[1]);
    $("#lngm").val(jd[2]);

})
//关闭弹出层
function close1() {
    _layer.close(t);
    $('#map').css('cursor', "");
    _map.off('click');
}
function close2() {
    _layer.close(t);
    $('#map').css('cursor', "");
    _map.off('click');debugger
    if(tmpTitle!=""){
        if(polyline!=""){
            _map.removeLayer(polyline);
            polyline="";
        }
        _admin.req('api-user/seaMap/lineList', JSON.stringify({title:tmpTitle}), function (res) {
            latlngs=[];
            for(var i in res){
                var ls=[]
                ls.push(parseFloat(res[i].lat));
                ls.push(parseFloat(res[i].lng));
                latlngs.push(ls)
            }
            addMarkerLine(latlngs, tmpTitle)
            allLines.push({latlngs:latlngs,title:tmpTitle});
        },'POST')
    }

}

//保存点
function saveMarker() {
    var data={};
    data.id=$("#markId").val();
    data.sort=$("#sort").val();
    data.title=$("#title").val();
    data.type=$("input[name='markerType1']:checked ").val();
    data.lat= changeToDu($("#latd").val()+'°'+$("#latf").val()+"'"+$("#latm").val());
    data.lng=changeToDu($("#lngd").val()+'°'+$("#lngf").val()+"'"+$("#lngm").val());
    _admin.req('api-user/seaMap/saveSeaMapMarker', JSON.stringify(data), function (res) {
        if(res.resp_code==0){
            close1();
            _layer.msg("保存成功",{icon:1,time:_config.msgTime});
        }else {
            _layer.msg("保存失败",{icon:2,time:_config.msgTime});
        }
        _table.reload('markerList');
    }, 'POST');
}
//保存线
function saveLines() {
    var latlngs=[];
    for(var i in newLineData){
        newLineData[i].title=$("#title").val();
        newLineData[i].sort=parseInt(i)+1;
        newLineData[i].type='2';
        latlngs.push(parseFloat(newLineData[i].lat));
        latlngs.push(parseFloat(newLineData[i].lng));
    }
    var oldTitle='';
    if(oldLineData.length>0){
        oldTitle=oldLineData[0].title;
    }
    if(polyline!=""){
        polylineLayers.push(polyline);
        allLines.push({latlngs:latlngs,title:$("#title").val()});
        polyline="";
    }
    _admin.req('api-user/seaMap/saveSeaMapLine?oldTitle='+oldTitle, JSON.stringify(newLineData), function (res) {
        if(res.resp_code==0){
            close1();
            _layer.msg("保存成功",{icon:1,time:_config.msgTime});
        }else {
            _layer.msg("保存失败",{icon:2,time:_config.msgTime});
        }
        _table.reload('markerList');
    }, 'POST');
}

function deletePoint(id) {
    _admin.req('api-user/seaMap/'+id, {}, function (res) {
        if(res.resp_code==0){

            _layer.msg("删除成功",{icon:1,time:_config.msgTime});
        }else {
            _layer.msg("删除失败",{icon:2,time:_config.msgTime});
        }
        _table.reload('markerList');
    }, 'DELETE');
}
function deleteLines(title) {
    _admin.req('api-user/seaMap/deleteByTitle?title='+title, {}, function (res) {
        if(res.resp_code==0){
            _layer.msg("删除成功",{icon:1,time:_config.msgTime});
        }else {
            _layer.msg("删除失败",{icon:2,time:_config.msgTime});
        }
        _table.reload('markerList');
    }, 'DELETE');
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
//度分秒转度
function changeToDu(dfm) {
    const arr1 = dfm.split('°');
    const d = arr1[0];
    const arr2 = arr1[1].split("'")
    let f = arr2[0] || 0;
    const m = arr2[1] || 0;
    f = parseFloat(f) + parseFloat(m / 60);
    var du = parseFloat(f / 60) + parseFloat(d);
    return du.toFixed(6);
}
//数组索引检索
function arrayContains(a, obj,type) {
    var i = a.length;
    if(type==0){
        while (i--) {
            if (a[i][0] == obj.lat&&a[i][1] == obj.lng) {
                return i;
            }
        }
    }else if(type==1){
        while (i--) {
            if (a[i].lat == obj.lat&&a[i].lng == obj.lng) {
                return i;
            }
        }
    }

    return false;
}
