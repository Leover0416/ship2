layui.extend({
    JSMpeg: 'jsmpeg.min',
})
var cctvMap = {};
var cctvDetailLayer="";
var cctvLayer;
layui.define(["JSMpeg", 'common'], function (exports) {
    // 被选CCTV框图层
    var selectedCctvLayer = new L.layerGroup([],{"contentType": "cctv"});
    const videoBufferSize = 1024 * 1204 * 10;
    const chunkSize = 1024 * 1024;
    const config = {
        html: null,
        css: null,
    }
    // const cctvMap = {
    //     "20001": ["38.8658", "121.5284"]
    // };
    const DICT = {
        CTRL_CMD_ZOOM_IN: 11,
        CTRL_CMD_ZOOM_OUT: 12,
        CTRL_CMD_UP: 21,
        CTRL_CMD_DOWN: 22,
        CTRL_CMD_LEFT: 23,
        CTRL_CMD_RIGHT: 24,
        //控制指令状态 0开始，1停止
        CTRL_STATUS_START: 0,
        CTRL_STATUS_STOP: 1,

        //REQUEST_TYPE
        REQUEST_TYPE_CCTV_CRL: 100,
        REQUEST_TYPE_CCTV_STOP: 101,
        REQUEST_TYPE_CCTV_PLAY: 102,
        REQUEST_TYPE_RADAR: 103,
        REQUEST_TYPE_RADAR_STOP: 104,
        REQUEST_TYPE_CLOSE: 105,

        //RESULT_CODE
        RESULT_CODE_HELLO: 200,
        RESULT_CODE_CCTV_INFO: 1002,
        RESULT_CODE_RADAR_INFO: 1003,
        RESULT_CODE_SHIP_RECT: 1004,
        REQUEST_TYPE_SET_OPCV_PARAMS: 106,
    };


    function init() {
        if (config.html === null)
            $.ajax({
                url: "/pages/seamap/cctv/index.html",
                type: 'GET',
                async: false,
                success: function (data) {
                    config.html = data;
                }
            });
        if (config.css === null)
            $.ajax({
                url: "/pages/seamap/cctv/index.css",
                type: 'GET',
                async: false,
                success: function (data) {
                    config.css = data;
                }
            });
    }

    function CctvPlayer(layer) {
        this.layer = layer;
        this.viewVisibleRange = null;
        this.viewCurrentVisibleRange = null;
        this.player = null;
    }

    function ResultCodeShipRectHandle(dom, me) {
        let targetDom = dom.find(".video-t")[0];
        dom.find(".btn-gauss").click(function () {
            $(this).toggleClass("active");
            sendCommandSetOpenCVConfig();
        }).hide();
        dom.find(".threshold").on("input", sendCommandSetOpenCVConfig).hide();
        dom.find(".btn-ai").click(function () {
            $(this).toggleClass("active");
            $(targetDom).toggle();
            $(".ai-flag-close").toggle();
        }).show();

        function sendCommandSetOpenCVConfig() {
            clearTimeout(sendCommandSetOpenCVConfig.sendTimeout);
            sendCommandSetOpenCVConfig.sendTimeout = setTimeout(function () {
                me.sendCommand({
                    type: DICT.REQUEST_TYPE_SET_OPCV_PARAMS,
                    threshold: dom.find(".threshold").val(),
                    enableGaussBlur: dom.find(".btn-gauss").hasClass("active")
                })
            }, 500);
        }


        function drawTargetCanvas(json) {
            clearTimeout(clearTargetCanvas.clearTargetCanvasTimer);
            clearTargetCanvas.clearTargetCanvasTimer = setTimeout(clearTargetCanvas, 5000);
            let ctx = targetDom.getContext("2d");
            ctx.clearRect(0, 0, targetDom.clientWidth, targetDom.clientHeight);
            ctx.beginPath();
            ctx.strokeStyle = "red"
            ctx.fillStyle = 'transparent';
            json.data.forEach((item) => {
                let x = item.x * targetDom.clientWidth;
                let y = item.y * targetDom.clientHeight;
                let w = item.w * targetDom.clientWidth;
                let h = item.h * targetDom.clientHeight;
                ctx.strokeRect(x, y, w, h);
                let text = [];
                if (item.name) {
                    text.push(`船名:${item.name}`);
                }
                if (text.length == 0 && item.mmsi) {
                    text.push(`mmsi:${item.mmsi}`);
                }
                if (text.length == 0 && item.radarId) {
                    text.push(`radarId:${item.radarId}`);
                }
                if (text.length > 0) {
                    ctx.fillStyle = "red"
                    ctx.font = "13px serif";
                    text.forEach((t, index) => {
                        ctx.fillText(t, x, y - 5);
                    });
                }
            });
            ctx.closePath();
        }

        function clearTargetCanvas() {
            let ctx = targetDom.getContext("2d");
            ctx.clearRect(0, 0, targetDom.clientWidth, targetDom.clientHeight);
        }

        return function (json) {
            if ($(targetDom).is(":visible"))
                requestAnimationFrame(function () {
                    drawTargetCanvas(json);
                });
        }

    }

    CctvPlayer.prototype = {
        onClose: function () {
            let cctvPlayer = $("#cctv-radar").data("CCTV-PLAYER")
            cctvPlayer.onDestroy();
        },
        onShow: function () {
            //NOP
        },
        showRadar: function (dom, data) {
            let ttid = data.ttId || 0;
            let mmsi = data.mmsi || 0;
            if (ttid != 0 && /tt-\d-\d/.test(data.ename)) {
                ttid = data.ename.split("-")[2];
            }
            if (!!this.targetInfo) {
                this.sendCommand({
                    type: DICT.REQUEST_TYPE_RADAR_STOP,
                    ...this.targetInfo
                });
            }
            this.targetInfo = {
                mmsi: mmsi,
                lat: data.latitude,
                lng: data.longitude,
                ttId: data.radarType > 0 ? data.ttId : 0
            };
            this.ctrlType = "radar";
            this.latlng = ["38.8658", "121.5284"];
            this.id = 20001;
            this.url = `${layui.common.cctv_ws_server}${this.id}`;
            const me = this;
            this.dom = dom;
            let title = data.radarType == 1 ? `融合目标：${mmsi}/${ttid}` : data.radarType == 0 ? "AIS目标：" + mmsi : "雷达目标：" + ttid;

            //let title = (data.radarType == 0 ? "AIS目标：" + data.smmsi : data.radarType == 1 ? "融合目标：" + data.smmsi + "/" + data.radarId : "雷达目标：" + data.radarId);
            me.dom.find(".layui-layer-title").text(`视频联动 （${title}）`);
            me.dom.find(".target-box p").text(`船名:${data.cname || data.ename},mmsi:${data.mmsi}`);
            dom.append(`<style>${config.css}</style>`)
            let canvas = dom.find(".camera-box #video-canvas")[0];
            let canvas2 = dom.find(".camera-box #camera-direction")[0];
            let targetDom = dom.find("#video-t")[0];

            function clearTargetCanvas() {
                let ctx = targetDom.getContext("2d");
                ctx.clearRect(0, 0, targetDom.clientWidth, targetDom.clientHeight);
            }


            if (me.player === null) {
                me.WS_RESULT_HANDLER = {
                    // [DICT.RESULT_CODE_CCTV_INFO]: function (json) {
                    //     let data = json.data;
                    //     requestAnimationFrame(function () {
                    //         me.drawVisibleRange(me.latlng,
                    //             data.cctvRadius,
                    //             data.cctvStart,
                    //             data.cctvStart + data.cctvSweep,
                    //             data.cctvHorizontal);
                    //         // me.drawVisibleRange2(
                    //         //     canvas2, 25,
                    //         //     data.cctvStart, data.cctvSweep, data.cctvHorizontal);
                    //     });
                    // },
                    [DICT.RESULT_CODE_HELLO]: function (json) {

                    },
                    [DICT.RESULT_CODE_RADAR_INFO]: function (json) {
                        let data = json.data;
                    },
                    [DICT.RESULT_CODE_SHIP_RECT]: new ResultCodeShipRectHandle(dom, me),
                    [DICT.RESULT_CODE_RADAR_INFO]: function (json) {
                        let data = json.data;
                        let mmsi = data.mmsi;
                        let ttid = data.ttId;
                        let title = mmsi > 0 && ttid > 0 ? `融合目标：${mmsi}/${ttid}` : ttid == 0 ? "AIS目标：" + mmsi : "雷达目标：" + ttid;
                        me.dom.find(".layui-layer-title").text(`视频联动 （${title}）`);
                    }
                };
                me.player = new JSMpeg.Player(me.url, {
                    canvas: canvas,
                    videoBufferSize: videoBufferSize,
                    chunkSize: chunkSize,
                    onSourceEstablished: function (ws) {
                        ws.socket.onmessage = function (ev) {
                            if (typeof ev.data === 'object') {
                                ws.onMessage(ev);
                                me.rx += ev.data.length;
                            } else if (typeof ev.data === 'string') {
                                try {
                                    const json = JSON.parse(ev.data);
                                    let handler = me.WS_RESULT_HANDLER[json.code];
                                    if (handler) {
                                        handler(json);
                                    }
                                } catch (e) {

                                }
                            }
                        }
                        me.sendCommand({
                            type: DICT.REQUEST_TYPE_RADAR,
                            ...me.targetInfo
                        });
                    }
                });
                if (me.ctrlType === "radar") {
                    dom.find(".camera_control button").remove();
                } else {
                    dom.find(".camera_control button").click(function () {
                        let key = DICT[$(this).attr("event-key")];
                        if (!!key)
                            me.sendCommand({
                                type: DICT.REQUEST_TYPE_CCTV_CRL,
                                command: key
                            });
                    });
                }
                me.onDestroy = function () {
                    me.sendCommand({
                        type: DICT.REQUEST_TYPE_RADAR_STOP,
                        ...me.targetInfo
                    });
                }
            } else {
                me.sendCommand({
                    type: DICT.REQUEST_TYPE_RADAR,
                    ...me.targetInfo
                });
            }
        },
        showCCTV: function (dom,/**cameraId*/cameraId,/**摄像头坐标**/ latlng) {
            this.ctrlType = "cctv";
            this.latlng = latlng;
            this.id = cameraId;
            this.url = `${layui.common.cctv_ws_server}${cameraId}`;
            const me = this;
            me.dom = dom;
            me.dom.find(".target-box").remove();
            me.WS_RESULT_HANDLER = {
                // [DICT.RESULT_CODE_CCTV_INFO]: function (json) {
                //     let data = json.data;
                //     me.dom.find(".layui-layer-title").text(`视频监控:${data.cctvId}(${data.cctvName})`);
                //     requestAnimationFrame(function () {
                //         me.drawVisibleRange(me.latlng,
                //             data.cctvRadius,
                //             data.cctvStart,
                //             data.cctvStart + data.cctvSweep,
                //             data.cctvHorizontal);
                //     });
                // },
                [DICT.RESULT_CODE_HELLO]: function (json) {

                },
                [DICT.RESULT_CODE_SHIP_RECT]: new ResultCodeShipRectHandle(dom, me)
            };

            this.dom = dom;
            dom.append(`<style>${config.css}</style>`)
            let canvas = dom.find(".camera-box #video-canvas")[0];
            let canvas2 = dom.find(".camera-box #camera-direction")[0];
            me.player = new JSMpeg.Player(me.url, {
                canvas: canvas,
                videoBufferSize: videoBufferSize,
                chunkSize: chunkSize,
                onSourceEstablished: function (ws) {
                    ws.socket.onmessage = function (ev) {
                        if (typeof ev.data === 'object') {
                            ws.onMessage(ev);
                            me.rx += ev.data.length;
                        } else if (typeof ev.data === 'string') {
                            try {
                                const json = JSON.parse(ev.data);
                                let handler = me.WS_RESULT_HANDLER[json.code];
                                if (handler) {
                                    handler(json);
                                }
                            } catch (e) {

                            }
                        }
                    }
                }
            });
            if (me.ctrlType === "radar") {
                dom.find(".camera_control button").remove();
            } else {
                dom.find(".camera_control button").mousedown(function () {
                    let key = DICT[$(this).attr("event-key")];
                    if (!!key)
                        me.sendCommand({
                            type: DICT.REQUEST_TYPE_CCTV_CRL,
                            command: key,
                            status: DICT.CTRL_STATUS_START
                        });
                });
                dom.find(".camera_control button").mouseup(function () {
                    let key = DICT[$(this).attr("event-key")];
                    if (!!key)
                        me.sendCommand({
                            type: DICT.REQUEST_TYPE_CCTV_CRL,
                            command: key,
                            status: DICT.CTRL_STATUS_STOP
                        });
                });


                // dom.find(".camera_control button").click(function () {
                //     let key = DICT[$(this).attr("event-key")];
                //     if (!!key)
                //         me.sendCommand({
                //             type: DICT.REQUEST_TYPE_CCTV_CRL,
                //             command: key
                //         });
                // });
            }

            //@TODO 这地方写的太烂了,有空重构下 ↑
        },
        destroy: function destroy() {
            // this.onClose();
            let targetInfo = {
                mmsi: 20001,
                lat: 11,
                lng: 222,
                ttId: 20001,
                type: DICT.REQUEST_TYPE_CCTV_STOP,
            };

            this.sendCommand(
                targetInfo
            );


            if (this.player) {
                try {
                    this.player.source.socket.close();
                } catch (e) {
                }
                try {
                    this.player.destroy();
                } catch (e) {
                }
            }
            if (this.viewCurrentVisibleRange)
                this.viewCurrentVisibleRange.remove();
            if (this.viewVisibleRange)
                this.viewVisibleRange.remove();
        },
        sendCommand: function (json) {
            if (this.player && this.player.source && this.player.source.socket) {
                this.player.source.socket.send(JSON.stringify(json))
            }
        },
        drawVisibleRange2: function (/**画布**/canvas,/**半径*/ r,/**扇形起始角*/ startAng,/**扇形结束角*/ endAng,/**方位角**/ azimuth) {
            let ctx = canvas.getContext("2d");
            let R = 2 * r;
            ctx.clearRect(0, 0, R, R);
            ctx.fillStyle = 'transparent';
            ctx.beginPath();
            ctx.fillRect(0, 0, R, R);
            ctx.fillStyle = 'rgba(0,0,0,0.11)';
            ctx.moveTo(r, r);
            ctx.arc(r, r, r, degrees2radians(startAng), degrees2radians(endAng), false);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(r, r);
            ctx.arc(r, r, r, degrees2radians(azimuth - 5), degrees2radians(azimuth + 5), false);
            ctx.fillStyle = "rgba(148,50,55,0.50)";
            ctx.fill();
            ctx.moveTo(r, r);
            ctx.arc(r, r, r / 10, 0, 2 * Math.PI, true);   //   (顺时针)
            ctx.fillStyle = "rgba(148,50,55,0.78)";
            ctx.fill();
            ctx.closePath();
        }
        , drawVisibleRange: function (/**坐标*/latlng,/**半径*/ r,
                                      /**扇形起始角*/ startAng,
                                      /**扇形结束角*/ endAng,
                                      /**方位角**/ azimuth) {

            if (!this.viewVisibleRange) {
                this.viewVisibleRange = L.semiCircle(latlng, {
                    radius: r,
                    radiusb: 20,
                    fill: false,
                    color: 'rgba(0,0,0,0.5)',
                    dashArray: "5,10",
                    weight: 4,
                    startAngle: 0,
                    endAngle: 180,
                    fillOpacity: 1,
                    dataType: "cctv-view-visible-range"
                }).addTo(this.layer);
                this.viewVisibleRange.setDirection((startAng + endAng) / 2, (startAng + endAng) / 2);
                // this.viewVisibleRange.setStartAngle(startAng);
                // this.viewVisibleRange.setStopAngle(startAng + endAng);
            }
            if (azimuth < 0) {
                return
            }
            if (!this.viewCurrentVisibleRange)
                this.viewCurrentVisibleRange = L.semiCircle(latlng, {
                    radius: r,
                    radiusb: 20,
                    fill: true,
                    color: '#7AE14866',
                    weight: 1,
                    startAngle: azimuth + 5,
                    endAngle: azimuth + 5,
                    fillOpacity: 1,
                    dataType: "cctv-view-current-visible-range"
                }).addTo(this.layer);
            this.viewCurrentVisibleRange.setDirection(azimuth, 10);
        }
    }

    function Cctv(map, isMarkerOverlay) {
        this.map = map;
        this.layer = new L.layerGroup([], {"contentType": "cctv"});
        this.layer.addTo(map)
        this.child = {};
        this.isMarkerOverlay = isMarkerOverlay;
        this.rx = 0;
        const me = this;
        layui.form.on('submit(cctv-radar-ais)', function () {
            // $("[times]").each(function (index, item) {
            //     $(item).find(".layui-layer-close").click();
            // });
            // $('.shipDetail_id').css('top', '90px')
            let data = $("#cctv-radar-ais").data("ship-info");
            if (data) {
                me.showRadarDialog(data);
            }
        });
    }


    Cctv.prototype = {
        onShipInfoOpen: function (shipInfo) {
            $("#cctv-radar-ais").data("ship-info", null).hide();
            $("#cctv-radar-ais").css("margin-left", "").css("margin-right", "");
            if (shipInfo.radarType === 1) {
                //融合数据
                $("#cctv-radar-ais").show().data("ship-info", shipInfo);
            } else if (shipInfo.radarType === 0) {
                //ais
                // let r = getGreatCircleDistance(shipInfo.lat, shipInfo.lng, cctvMap["20001"][0], cctvMap["20001"][1]);
                // if (r <= 41778) {
                $("#cctv-radar-ais").show().data("ship-info", shipInfo);
                //}
            } else if (shipInfo.radarType === 2) {
                $("#cctv-radar-ais").parent().show().find("button").hide();
                $("#cctv-radar-ais").show().data("ship-info", shipInfo).css({
                    "margin-left": "50%",
                    "margin-right": "50%"
                });
            }
        },
        showRadarDialog: function (data) {
            init();
            const me = this;
            let cctvPlayer = $("#cctv-radar").data("CCTV-PLAYER")

            if (!cctvPlayer) {
                cctvPlayer = new CctvPlayer(me.layer);
                let h = $(".shipDetail_id").height() || 401;
                ship_video = layer.open({
                    type: 1,
                    offset: [h + 80 + "px", "5px"],
                    id: `cctv-radar`,
                    title: "雷达AIS联动",
                    content: $(config.html).html(),
                    btn: '',
                    closeBtn: 1,
                    shade: 0,
                    anim: 0,
                    skin: 'layui-layer-lan cctv-radar',
                    resize: false,
                    end: function () {
                        cctvPlayer.destroy();
                    },
                    success: function (dom, index) {
                        var now_url = window.location.href
                        if (now_url.includes(('ayxaeMap.html'))) {
                            layer.style(index, {
                                position: 'fixed',
                                top: 530,
                                left: 12,
                                marginLeft: 0,
                                marginTop: 0,

                            })
                        } else {
                            layer.style(index, {
                                position: 'fixed',
                                top: 510,
                                left: 5,

                            })
                        }
                        // clearAllShipMessagebox()

                        $("#cctv-radar").data("CCTV-PLAYER", cctvPlayer);
                        cctvPlayer.showRadar(dom, data);
                    },
                    zIndex: 10000
                });
            } else {
                cctvPlayer.showRadar(cctvPlayer.dom, data);
            }
        },
        showVideoDialog: function (id) {
            //关闭上一个视频
            if (cctvLayer) {
                layer.close(cctvLayer)
            }

            var url = window.location.href
            const me = this;
            if(url.includes('seamap/seamap.html')){
                // hiddenEcharts()
                if(is_Measure_marker_electronic){
                    return
                }
            }
            init();
            const cctvPlayer = new CctvPlayer(me.layer);
            cctvLayer = layer.open({
                type: 1,
                offset: ["451px", '5px'],
                id: 'cctv_' + id,
                title: "视频监控-" + cctvMap[id].cctvName,
                content: $(config.html).html(),
                btn: '',
                closeBtn: 1,
                shade: 0,
                anim: 0,
                skin: 'layui-layer-lan',
                resize: false,
                end: function () {
                    cctvLayer = null;
                    cctvPlayer.destroy();
                },
                success: function (dom, index) {
                    cctvPlayer.showCCTV(dom, id, cctvMap[id].latlng)
                    var w = $("body").width() //获取视口宽
                    if(w<1600) {
                        layer.style(index, {
                            top: 290,
                        })
                    } else {

                    }
                },
                cancel:function(){
                    cctvLayer = null;
                    if(cctvDetailLayer == null){
                        _map.removeLayer(selectedCctvLayer)
                    }
                },
                zIndex: 10000
            });
        },
        disable: function (map) {
            this.layer.clearLayers();
        },
        enable: function (map) {
            const me = this;
            Object.keys(cctvMap).forEach(id => this.addCctvMarker(id, cctvMap[id].latlng, map));
        },
        init: function (map) {
        },
        addCctvMarker: function addCctvMarker(id, latlng, map) {
            const me = this;
            let zoom = getZoomRatio();

            let imageUrl = "/assets/images/icon-cctv.svg"
            if(cctvMap[id].status == 1){
                imageUrl = "/assets/images/icon-cctv-off.svg"
            }

            let marker = new L.marker(latlng, {
                icon: L.icon({
                    iconUrl: imageUrl,
                    iconSize: [zoom, zoom],
                    className: "cctv-marker-" + id
                }),
                zIndexOffset: 9999,
                attribution: id,
                dataType: "cctv-marker",
                id: id
            });

            function getZoomRatio() {
                var zoom = map.getZoom();
                if (zoom <= 10) {
                    return zoom = 25;
                } else  {
                    return zoom = 35;
                }
            }

            function onMoveend() {
                let zoom = getZoomRatio();
                let imageUrl = "/assets/images/icon-cctv.svg"
                if(cctvMap[id].status == 1){
                    imageUrl = "/assets/images/icon-cctv-off.svg"
                }
                marker.setIcon(L.icon({
                    iconUrl: imageUrl,
                    iconSize: [zoom, zoom],
                    className: "cctv-marker-" + id
                }));
            }

            map.on("zoom", onMoveend);
            marker.on("remove", function () {
                map.off("zoom", onMoveend);
                if(_map.getZoom()<=6){
                    if (_map.hasLayer(selectedCctvLayer)) {
                        _map.removeLayer(selectedCctvLayer);
                        selectedCctvLayer.clearLayers();
                    }
                }
            })
            marker.on("click", function (e) {
                // hiddenEcharts();
                // if(no_close_model==1||no_close_model==2){
                //     layer.confirm('已编辑的内容还未保存，是否继续？', function () {
                //         no_close_model = 0
                //         setmeasureDistance()
                //     })
                // } else {
                //     $(".dialog-right").each(function (index, item) {
                //         let times = $(item).attr("times");
                //         layer.close(times);
                //     })
                    setmeasureDistance()
                //
                // }
                function setmeasureDistance(){
                    // layer.closeAll()
                    // is_Measure_marker_electronic =  false
                    // _map.eachLayer(function (l) {
                    //     if (l.options.contentType === 'shipBox'||l.options.contentType === 'stationBox'||l.options.contentType === 'netBox'||l.options.contentType === 'atonBox'||l.options.contentType === 'hymeBox'||l.options.contentType === 'radarBox'||l.options.contentType === 'cctvBox'||l.options.contentType === 'tagBox') {
                    //         l.getLayers().forEach(function (item) {
                    //             _map.removeLayer(item);
                    //         });
                    //     }
                    // });
                    if (!me.isMarkerOverlay(e)){
                        var arr = ['cctvDetailLayer', 'radarDetailLayer', 'hymeInfoDetailLayer','stationDetailLayer', 'heatmapLayer', 'shipDetailLayer', 'selectedShipLayer', 'targetLayer', 'atonDetailLayer', 'stationCoverageLayer', 'owmStationLayer', 'fishingNetDetailLayer', 'cctvLayer'];
                        // closeLayer(arr);
                        _map.removeLayer(arr)
                        // me.showCctv(id);

                        me.showVideoDialog(id);
                    }
                }

            });
            if (!!me.child[id]) {
                me.child[id].remove()
            }
            me.child[id] = marker;
            marker.addTo(this.layer);
        },
        showCctv: function (id,index) {
            //fss没仔细看
            var arr = ['cctvDetailLayer', 'radarDetailLayer', 'hymeInfoDetailLayer','stationDetailLayer', 'heatmapLayer', 'shipDetailLayer', 'selectedShipLayer', 'targetLayer', 'atonDetailLayer', 'stationCoverageLayer', 'owmStationLayer', 'fishingNetDetailLayer', 'cctvLayer'];
            closeLayer(arr);
            var cctvData = cctvMap[id];
            selectedCctvAndRadarShow(cctvData.latitude, cctvData.longitude, 0, 0, 0, 0, 0, 0);
            if (index == true) {
                _map.flyTo([cctvData.latitude, cctvData.longitude], _map.getZoom() > 6 ? _map.getZoom() : 7);
            }
            let latLng = doPointNSWE(cctvData.latitude+"", cctvData.longitude+"");
            var cctvInfo = "<div id='stationDetailLayer' class='layui-form' >" +
                "<table class='layui-table no-hover-table' lay-skin='nob' style='border:none'>" +
                "<tbody>" +
                "<tr>" +
                "<td>视频名称：</td>" +
                "<td class='remarksDel'><input style='border: 0px;width: 130px;text-overflow: ellipsis;'  value='" + cctvData.cctvName + "' readonly/></td>" +
                "<td>视频编号：</td>" +
                "<td class='remarksDel'><input style='border: 0px;width: 160px;text-overflow: ellipsis;'  value='" + cctvData.cctvNum + "' readonly/></td>" +
                "</tr>" +
                "<tr>" +
                "<td>纬度：</td>" +
                "<td class='remarksDel'><input style='border: 0px;width: 160px;text-overflow: ellipsis;'  value='" + latLng[0] + "' readonly/></td>" +
                "<td>经度：</td>" +
                "<td class='remarksDel'><input style='border: 0px;width: 130px;text-overflow: ellipsis;'  value='" + latLng[1] + "' readonly/></td>" +
                "</tr>" +
                "<tr>" +
                "<td>厂商：</td>" +
                "<td class='remarksDel'><input style='border: 0px;width: 130px;text-overflow: ellipsis;'  value='" + cctvData.supplier + "' readonly/></td>" +
                "<td>型号：</td>" +
                "<td class='remarksDel'><input style='border: 0px;text-overflow: ellipsis;'  value='" + cctvData.model + "' readonly /></td>" +
                "</tr>" +
                "<tr>" +
                "<td>通道号：</td>" +
                "<td class='remarksDel'><input style='border: 0px;width: 130px;text-overflow: ellipsis;'  value='" + cctvData.channelNum + "' readonly /></td>" +
                "</tr>" +
                "</tbody>" +
                "</table>" +
                "</div>"

            cctvDetailLayer = layer.open({
                type: 1
                , offset: ['-20px', '0']
                , id: 'cctvDetail_id'
                , title: '视频监控详情'
                , content: cctvInfo
                , btn: ''
                , shade: 0
                , skin: 'layui-layer-lan radarDetails'
                , area: ['500px','220px']
                , resize: false,
                end: function () {
                    cctvDetailLayer = null;
                }
                , cancel: function () {
                    cctvDetailLayer = null;
                    if(cctvLayer == null){
                        _map.removeLayer(selectedCctvLayer);
                        selectedCctvLayer.clearLayers();
                    }
                }
                , success: function (layero, index) {
                    layer.style(index, {
                        position: 'fixed',
                        top: 145,
                        left: 12,
                        marginLeft: 0,
                        marginTop: 0,

                    })
                }
                , zIndex: 10000
            });
        },
    }

    // CCTV RADAR选择框图层
    function selectedCctvAndRadarShow(lat, lng, heading, course, gpsRefPos1, gpsRefPos2, gpsRefPos3, gpsRefPos4) {

        // 其他图层关闭
        if (_map.hasLayer(selectedCctvLayer)) {
            _map.removeLayer(selectedCctvLayer);
            selectedCctvLayer.clearLayers();
        }
        var selectedCctvAndRadar = L.trackSymbol(L.latLng(lat, lng), {
            fill: false,
            stroke: true,
            heading: heading * Math.PI / 180.0,
            course: course * Math.PI / 180.0,
            type: 'CCTVandRadar',
            gpsRefPos: [gpsRefPos1, gpsRefPos2, gpsRefPos3, gpsRefPos4],
            color: "#fd0404",
            weight: 1.5,
        });
        selectedCctvAndRadar.addTo(selectedCctvLayer);
        _map.addLayer(selectedCctvLayer);
    }

    //输出 mymod 接口
    exports('cctv', Cctv);

    /**角度转弧度*/
    function degrees2radians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**弧度转角度*/
    function radians2degrees(radians) {
        return radians * (180 / Math.PI);
    }

    function getGreatCircleDistance(lat1, lng1, lat2, lng2) {
        var EARTH_RADIUS = 6378137.0;
        var PI = Math.PI;

        function getRad(d) {
            return d * Math.PI / 180.0;
        }

        var radLat1 = getRad(lat1);
        var radLat2 = getRad(lat2);

        var a = radLat1 - radLat2;
        var b = getRad(lng1) - getRad(lng2);

        var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
        s = s * EARTH_RADIUS;
        s = Math.round(s * 10000) / 10000.0;
        return s;// 公里数
    }
});
