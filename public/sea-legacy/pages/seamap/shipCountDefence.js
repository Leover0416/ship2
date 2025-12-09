
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
        if(data!=undefined){
            admin.reqNoLoad('fishingPort60-api/alarmCount', {}, function (data2) {
                if(data2!=undefined){


                    var c = `<div class="search-center-wrapper">
                                <div class="data-wrapper">
                                    <span class="data-title ship-icon">船舶</span>
                                    <span class="data-view">${data.shipCount ? data.shipCount :0}</span>
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

