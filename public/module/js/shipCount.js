//
// $(function () {
//     var c = `<div class="search-center-wrapper">
//                         <div class="data-wrapper">
//                             <span class="data-title ship-icon">船舶</span>
//                             <span class="data-view">0</span>
//                         </div>
//                         <div class="data-txt">实时数据</div>
//                         <div class="data-wrapper">
//                             <span class="data-title net-icon">网位仪</span>
//                             <span class="data-view">0</span>
//                         </div>
//                     </div>`
//     // var c='<input  type="text" style="margin-left:5px;font-size: 16px;width: 155px;display: inline" readonly class="layui-input"  value="实时船舶:0艘">'
//     // +'<input  type="text" style="font-size: 16px;width: 153px;display: inline" readonly class="layui-input"  value="网位仪:0个">';
//     $("#allCount").html(c)
// })
//
// function getShipsCount(admin) {
//     admin.reqNoLoad('shipDynamicStatic-api/getShipAndNetsondeCount', {}, function (data) {
//         if(data!=undefined){
//             var c = `<div class="search-center-wrapper">
//                         <div class="data-wrapper">
//                             <span class="data-title ship-icon">船舶</span>
//                             <span class="data-view">${data.shipCount ? data.shipCount : 0}</span>
//                         </div>
//                         <div class="data-txt">实时数据</div>
//                         <div class="data-wrapper">
//                             <span class="data-title net-icon">网位仪</span>
//                             <span class="data-view">${data.netsondeCount ? data.netsondeCount : 0}</span>
//                         </div>
//                     </div>`
//             // var c='<input  type="text" style="margin-left:5px;font-size: 16px;width: 155px;display: inline" readonly class="layui-input"  value="实时船舶:'+data.shipCount+'艘">'
//             //  +'<input  type="text" style="font-size: 16px;width: 153px;display: inline" readonly class="layui-input"  value="网位仪:'+data.netsondeCount+'个">';
//         }
//         $("#allCount").html(c)
//     }, "POST");
// }
// function getShipsCountLTS(admin) {
//     admin.reqNoLoad('shipDynamicStatic-api/getShipAndNetsondeCountLTS', {}, function (data) {
//         if(data!=undefined){
//             var c = `<div class="search-center-wrapper">
//                         <div class="data-wrapper">
//                             <span class="data-title ship-icon">船舶</span>
//                             <span class="data-view">${data.shipCount ? data.shipCount :0}</span>
//                         </div>
//                         <div class="data-txt">实时数据</div>
//                         <div class="data-wrapper">
//                             <span class="data-title net-icon">网位仪</span>
//                             <span class="data-view">${data.netsondeCount ? data.netsondeCount : 0}</span>
//                         </div>
//                     </div>`
//             // var c='<input  type="text" style="margin-left:5px;font-size: 16px;width: 155px;display: inline" readonly class="layui-input"  value="实时船舶:'+data.shipCount+'艘">'
//             //     +'<input  type="text" style="font-size: 16px;width: 153px;display: inline" readonly class="layui-input"  value="网位仪:'+data.netsondeCount+'个">';
//         }
//         $("#allCount").html(c)
//     }, "POST");
// }
