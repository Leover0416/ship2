L.Control.MousePosition = L.Control.extend({
  options: {
    position: 'bottomleft',
    separator: ' : ',
    emptyString: 'Unavailable',
    lngFirst: false,
    numDigits: 5,
    lngFormatter: undefined,
    latFormatter: undefined,
    prefix: ""
  },

  onAdd: function (map) {
    this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
    L.DomEvent.disableClickPropagation(this._container);
    map.on('mousemove', this._onMouseMove, this);
    this._container.innerHTML=this.options.emptyString;
    return this._container;
  },

  onRemove: function (map) {
    map.off('mousemove', this._onMouseMove)
  },

  // _onMouseMove: function (e) {
  //   var lng = this.options.lngFormatter ? this.options.lngFormatter(e.latlng.lng) : L.Util.formatNum(e.latlng.lng, this.options.numDigits) + ' E ' ;
  //   var lat = this.options.latFormatter ? this.options.latFormatter(e.latlng.lat) : L.Util.formatNum(e.latlng.lat, this.options.numDigits) + ' N ' ;
  //   var value = this.options.lngFirst ? lng + this.options.separator + lat : lat + this.options.separator + lng;
  //   var prefixAndValue = this.options.prefix + ' ' + value;
  //   this._container.innerHTML = prefixAndValue;
  // }

  _onMouseMove: function (e) {
    var lng = this.options.lngFormatter ? this.options.lngFormatter(e.latlng.lng) : L.Util.formatNum(e.latlng.lng, this.options.numDigits) ;
    var lat = this.options.latFormatter ? this.options.latFormatter(e.latlng.lat) : L.Util.formatNum(e.latlng.lat, this.options.numDigits) ;
    if (lng < 0) {
      var quzheng = String(lng).replace("-", "");
    } else {
      var quzheng = lng;
    }
    var zhengshu = Math.floor(quzheng);

    var b = Math.floor(zhengshu / 180);
    if (lng > 0&&b >= 1) {
      var lngDu = zhengshu - 180 * b;
    } else if(lng < 0&& b >=1){
      var lngDu = 180-(zhengshu - 180 * b);
    }
    else{
      var lngDu = zhengshu;
    }
    var fen = (quzheng - zhengshu) * 60;
    var lngFen = Math.floor(fen);
    var lngMiao = Math.floor((fen - lngFen) * 60)
    if (lng < 0&&b%2==0) {
      var lng1 = lngDu + "°" + lngFen + "′" + lngMiao + "″" + ' W ';
    }else if (lng < 0&&b%2!=0) {
      var lng1 = lngDu + "°" + lngFen + "′" + lngMiao + "″" + ' E ';
    }
    else if(lng > 0&&b%2==0) {
      var lng1 = lngDu + "°" + lngFen + "′" + lngMiao + "″" + ' E ';
    }else if(lng > 0&&b%2!=0) {
      var lng1 = lngDu + "°" + lngFen + "′" + lngMiao + "″" + ' W ';
    }
    if (lat < 0) {
      var quzheng1 = String(lat).replace("-", "");
    } else {
      var quzheng1 = lat;
    }
    var latDu = Math.floor(quzheng1);
    var c = (quzheng1 - latDu) * 60;
    var latFen = Math.floor(c);
    var latMiao = Math.floor((c - latFen) * 60);
    if (lat < 0) {
      var lat1 = latDu + "°" + latFen + "′" + latMiao + "″" + ' S ';
    } else {
      var lat1 = latDu + "°" + latFen + "′" + latMiao + "″" + ' N ';
    }
    var value = this.options.lngFirst ? lng1 + this.options.separator + lat1 : lat1 + this.options.separator + lng1;
    var prefixAndValue = this.options.prefix + ' ' + value;
    this._container.innerHTML = prefixAndValue;
  }
});

L.Map.mergeOptions({
    positionControl: false
});

L.Map.addInitHook(function () {
    if (this.options.positionControl) {
        this.positionControl = new L.Control.MousePosition();
        this.addControl(this.positionControl);
    }
});

L.control.mousePosition = function (options) {
    return new L.Control.MousePosition(options);
};
