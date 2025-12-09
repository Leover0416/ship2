+function ($) {
    'use strict';
    const KEYCODE_BACKSPACE = 8;
    const KEYCODE_LEFT = 37;
    const KEYCODE_UP = 38;
    const KEYCODE_RIGHT = 39;
    const KEYCODE_DOWN = 40;
    const KEYCODE_0 = '0'.charCodeAt();
    const KEYCODE_9 = '9'.charCodeAt();
    const KEYCODE_0_MIN = 97;
    const KEYCODE_9_MIN = +KEYCODE_0_MIN + 9;
    const KEYCODE_DOT = '.'.charCodeAt();

    const css = `<style>
        .dfm_edit input[type=number]::-webkit-inner-spin-button,
        .dfm_edit input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
        }
        dfm *{
            transition: all .3s;
            -webkit-transition: all .3s;
        }
        .dfm_edit:hover,.dfm_edit:focus-within{
            border: 1px solid #d2d2d2 ;
        }
        .dfm_box {
            display: inline-block;
            cursor: pointer;
            -webkit-appearance: none;
            box-sizing: border-box;
        }
        .dfm_edit {
            background: #313131;
            color: white;
            padding: 5.5px 4px 5.5px 4px;
            width: 132px;
            border: 1px solid #101010;
            text-align: right;
            display: inline-block;
            white-space:nowrap;
        }

        .dfm_edit .dfm_dd input,
        .dfm_edit .dfm_mm input,
        .dfm_edit .dfm_ss input
         {
            display: inline-block;
            width: 25px;
            height: 25px;
            border: none;
            padding-right: 0px;
            padding-left: 0px;
            text-align: right;                                      
        }
        .dfm_edit .dfm_ss input{
            width: 50px;
        } 
        .dfm_edit .dfm_dd, .dfm_edit .dfm_mm, .dfm_edit .dfm_ss {
            display: inline;
         }
       
        .dfm_edit .dfm_dd::after,
        .dfm_edit .dfm_ss:after,
        .dfm_edit .dfm_mm::after {
            display: inline;            
            line-height: 20px;            
        }
          
        .dfm_edit .dfm_dd::after {
            content: "°";
        }
        .dfm_edit .dfm_mm::after {
            content: "′";
        }
        .dfm_edit .dfm_ss:after {
            content: "″";
        }
        .dfm_coordinates {
            display: none;
        }
 
        .dfm_show .dfm_dd{
            min-width: 2em;
            text-align: right;
            display: inline-block;
        }
        .dfm_show .dfm_mm{
            min-width: 1.3em;
            text-align: right;
            display: inline-block;
        }
        .dfm_show .dfm_ss{
            min-width: 3em;
            text-align: right;
            display: inline-block;
        }
        </style>`
    $("head").ready(function () {
        $("head").append(css);
    })

    const html_dfm_edit = `
        <div class="dfm_coordinates" >
            <input class="layui-input" type="text">  
        </div>
        <div class="dfm_edit">
            <div class="dfm_dd">
                <input type="text" maxlength="3">
            </div>
            <div class="dfm_mm" >
                <input type="text" maxlength="3">
            </div>
            <div class="dfm_ss">
                <input type="text" maxlength="6">
            </div>
        </div>`;

    const html_dfm_show = `<div class="dfm_show"></div>`

    function convertDFM(rawData, precision = 3) {
        rawData = parseFloat(rawData);
        let du, fen, miao;
        du = Math.floor(rawData);
        let tp = rawData - du;
        tp = tp * 60;
        fen = Math.floor(tp);
        tp = tp - fen;
        miao = tp * 60;
        return [du, fen, miao.toFixed(precision)];
    }

    function convertToD(dfm, fractionDigits = 6) {
        var du = 0;
        if (dfm.indexOf("°") != -1) {
            du = parseFloat(dfm.substring(0, dfm.indexOf("°")));
        }
        var fen = 0;
        if (dfm.indexOf("°") != -1) {
            fen = parseFloat(dfm.substring(dfm.indexOf("°") + 1, dfm.indexOf("'")));
        }
        var miao = 0;
        if (dfm.indexOf("'") != -1) {
            miao = parseFloat(dfm.substring(dfm.indexOf("'") + 1).replace("\"", ""));
        }
        var tempfen = parseFloat(fen) + parseFloat(miao / 60);
        var tempdu = parseFloat(tempfen / 60) + parseFloat(du);
        return tempdu.toFixed(fractionDigits);
    }

    function check(dfm, options) {
        let d = convertToD(dfm);
        let res = options.minValue <= d && d <= options.maxValue;
        return res;
    }

    function init(element, input) {
        let attrs = ["name", "lay-verify"];
        attrs.forEach(item => {
            let val = element.attr(item);
            if (typeof val !== "undefined") {
                input.attr(item, val)
                element.removeAttr(item);
            }
        });
    }

    var DfmEdit = function (element, options) {
        this.$element = $(element)
        this.$element.append(html_dfm_edit);
        this.du = this.$element.find(".dfm_dd input");
        this.fen = this.$element.find(".dfm_mm input");
        this.miao = this.$element.find(".dfm_ss input");
        this.coordinates = this.$element.find(".dfm_coordinates input");
        init(this.$element, this.coordinates);
        this.val(options.value);
        let me = this;
        this.options = options;
        $(this.miao).keydown(function (event) {
            if (KEYCODE_LEFT == event.keyCode) {
            } else if (KEYCODE_RIGHT == event.keyCode) {

            } else if (event.keyCode == KEYCODE_BACKSPACE) {
                let val = $(this).val();
                if (val.length == 0)
                    me.fen.focus();
            }
        });
        $(this.fen).keydown(function (event) {
            if (event.keyCode == KEYCODE_BACKSPACE) {
                let val = $(this).val();
                if (val.length == 0)
                    me.du.focus();
            }
        });
        //---
        $(this.miao).keydown(new GoToNextInputByLeftKey(this.fen[0]));
        $(this.fen).keydown(new GoToNextInputByLeftKey(this.du[0]));
        //---
        $(this.fen).keydown(new GoToNextInputByRight(this.miao[0]));
        $(this.du).keydown(new GoToNextInputByRight(this.fen[0]));
        //---
        this.$element.mousedown(function (event) {
            if (event.button == 0 && event.altKey && event.shiftKey) {
                me.$element.find(".dfm_coordinates").toggle();
                me.$element.find(".dfm_edit").toggle();
            }
        });
        this.coordinates.change(function () {
            me.val($(this).val(), false);
        })

        function $EVENT$CHANGE() {
            let oldValue = me.$element.attr("value");
            let newValue = me.val();
            me.$element.attr("value", newValue);
            me.coordinates.val(newValue);
        }

        $(this.miao).change($EVENT$CHANGE)
        $(this.fen).change($EVENT$CHANGE)
        $(this.du).change($EVENT$CHANGE)
    }
    const dataFlag = 'bs.dfm';


    function GoToNextInputByRight(goto) {

        return function (event) {
            if (KEYCODE_RIGHT == event.keyCode) {
                event.stopPropagation();
                if (event.target.value.length === event.target.selectionStart) {
                    goto.focus();
                    setTimeout(() => goto.select(), 10)
                }
            }
        }
    }

    function GoToNextInputByLeftKey(goto) {

        return function (event) {
            if (KEYCODE_LEFT == event.keyCode) {
                event.stopPropagation();
                if (0 === event.target.selectionStart) {
                    goto.focus();
                    setTimeout(() => goto.select(), 10)
                }
            }
        }
    }

    function GoToNextInputByBackspace(goto) {
        if (event.keyCode == KEYCODE_BACKSPACE) {
            let val = event.target.value;
            if (val.length == 0) {
                goto.focus();
                setTimeout(() => goto.setSelectionRange(goto.value.length, goto.value.length), 10);
            }

        }
    }

    DfmEdit.DEFAULTS = {
        precision: 3,
        maxValue: 180,
        minValue: -180,
        value: "0.0",
        type: null,
        readonly: false,
        showType: "DFM"
    }
    DfmEdit.types = {
        //经度范围是0-180°
        longitude: "longitude|lon|lng|经度|jd".split("\|"),
        //纬度范围是0-90°
        latitude: "latitude|lat|纬度|wd".split("\|")
    }
    DfmEdit.typesName = {
        //经度范围是0-180°
        longitude: ["W", "E"],
        //纬度范围是0-90°
        latitude: ["S", "N"],
    }
    DfmEdit.prototype.change = function (fun) {
        this.$element.change(fun);
    }
    DfmEdit.prototype.val = function (val, setText = true) {
        if (arguments.length == 0) {
            return convertToD(this.toDfm());
        } else {
            let data = convertDFM(val);
            this.du.val(data[0]);
            this.fen.val(data[1]);
            this.miao.val(data[2]);
            if (setText)
                this.coordinates.val(parseFloat(val).toFixed(6));
            return this;
        }
    }
    DfmEdit.prototype.toDfm = function () {
        return `${this.du.val() || 0}°${this.fen.val() || 0}'${this.miao.val() || 0}″`;
    }
    DfmEdit.prototype.setEditable = function (status) {
        if (status)
            $(this.$element).find("input").removeAttr("disabled");
        else
            $(this.$element).find("input").attr("disabled", "disabled");
    }

    function DfmShow(element, options) {
        this.$element = $(element);
        this.options = options;
        this.val(options.value);
        const me = this;
        this.$element.dblclick(function () {
            if (me.options.showType == DfmEdit.DEFAULTS.showType) {
                me.options.showType = "D";
            } else {
                me.options.showType = DfmEdit.DEFAULTS.showType
            }
            me.val(me.options.value);
        });
    }

    /***
     * 返回经纬度 东经西经, 南北纬*/
    function getNEWS(option, value) {
        let index = value < 0 ? 0 : 1;
        return option.typeNames[index];
    }

    DfmShow.prototype.val = function (val) {
        if (arguments.length == 1) {
            this.options.value = val;


            if (this.options.showType === "DFM") {
                let dfm = convertDFM(Math.abs(val));
                this.$element.html(
                    `<div class="dfm_show">
                        <span class="dfm_dd">${dfm[0]}°</span>
                        <span class="dfm_mm">${dfm[1]}'</span>
                        <span class="dfm_ss">${dfm[2]}″</span>${getNEWS(this.options, val)}
                    </div>`
                );
            } else {
                this.$element.text(Math.abs(val) + getNEWS(this.options, val));
            }
            return this;
        } else
            return this.options.value;
    }

    function Plugin(option, _relatedTarget) {
        var args = Array.apply(null, arguments);
        args.shift();
        var internal_return = this;
        this.each(function () {
                var $this = $(this)
                var data = $this.data(dataFlag);
                if (!data) {
                    if ($this[0].tagName.toLowerCase() !== "dfm") {
                        throw "DFM need tageName: <dfm></dfm>";
                    }
                    var options = typeof option == 'object' ? option : {};
                    options.value = options.value || $this.attr("value");
                    options.readonly = Boolean(options.readonly || $this.attr("readonly"));
                    options.type = String(options.type || $this.attr("type")).toLowerCase();
                    if (DfmEdit.types.latitude.includes(options.type)) {
                        options.maxValue = 90;
                        options.minValue = -90;
                        options.typeNames = DfmEdit.typesName.latitude;
                    } else if (DfmEdit.types.longitude.includes(options.type)) {
                        options.maxValue = 180;
                        options.minValue = -180;
                        options.typeNames = DfmEdit.typesName.longitude;
                    } else {
                        throw "DFM type range[" + DfmEdit.types.latitude.join() + "," + DfmEdit.types.longitude.join() + "]";
                    }
                    options = $.extend({}, DfmEdit.DEFAULTS, options);
                    if (!$this.hasClass("dfm_box"))
                        $this.addClass("dfm_box");
                    if (options.readonly) {
                        $this.data(dataFlag, (data = new DfmShow(this, options)))
                    } else {
                        $this.data(dataFlag, (data = new DfmEdit(this, options)))
                    }
                }
                if (args.length == 0)
                    internal_return = data;
                if (typeof option === 'string' && typeof data[option] === 'function') {
                    internal_return = data[option].apply(data, args);
                }
            }
        );
        return internal_return;
    }

    $.fn.dfm = Plugin
    $.fn.dfm.Constructor = DfmEdit

}(jQuery);