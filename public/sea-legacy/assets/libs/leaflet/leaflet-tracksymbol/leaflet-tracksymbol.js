L.TrackSymbol = L.Path.extend({
    initialize: function (latlng, options) {
        L.setOptions(this, options);
        if (latlng === undefined) {
            throw Error('Please give a valid lat/lon-position');
        }

        options = options || {};
        this._id = options.trackId || 0;
        this._leaflet_id = this._id;
        this._latlng = L.latLng(latlng);
        this._size = options.size || 24;
        if (options.heading == 511 * Math.PI / 180.0 || options.heading == undefined || isNaN(options.heading) || options.heading == 0) {
            this._heading = options.course;
        } else {
            this._heading = options.heading;
        }
        ;
        this._course = options.course;
        if (options.speed == 102.3 || options.speed == undefined || isNaN(options.speed)) {
            this.speed = undefined;
        } else {
            this._speed = options.speed;
        }
        ;
        this._rot = options.rot;
        this._leaderTime = options.leaderTime || 60.0;
        this._minSilouetteZoom = options.minSilouetteZoom || 17;
        this.setGPSRefPos(options.gpsRefPos);
        this._triSymbol = options.defaultSymbol || [0.6, 0, -0.22, 0.22, -0.22, -0.22];
        this._triSymbolSmall = options.defaultSymbol || [0.4, 0, -0.15, 0.15, -0.15, -0.15];
        this._silSymbol = options.silouetteSymbol || [1, 0.5, 0.75, 1, 0, 1, 0, 0, 0.75, 0];
        this._selTriangularSymbol = [0.7, 0.5, 0.9, 0.5, 0.9, 0.3, 0.7, -0.5, 0.9, -0.5, 0.9, -0.3, -0.5, -0.3, -0.5, -0.5, -0.3, -0.5, -0.3, 0.5, -0.5, 0.5, -0.5, 0.3];
        this._selShipSymbol = [1.0, 1.2, 1.1, 1.2, 1.1, 1.1, 1.0, -0.2, 1.1, -0.2, 1.1, -0.1, -0.1, -0.1, -0.1, -0.2, 0, -0.2, 0, 1.2, -0.1, 1.2, -0.1, 1.1];
        this._radarSymbol = options.defaultSymbol || [0.6, 0, 0.6, 0.22, -0.22, 0.22, -0.22, -0.22, 0.6, -0.22];
        this._bigRadarSymbol = options.defaultSymbol || [1, 0.5, 1, 1, 0, 1, 0, 0, 1, 0];
        this._recvTime = new Date(options.recvTime).getTime() / 1000;
        this._minRecvTime = options.minRecvTime * 60 || 180;
        this._type = options.type;
        this._point = options.point;
        this._radarType = 0 || options.radarType;
    },

    _project: function () {
    },

    _update: function () {
        this._setPath();
    },

    _setPath: function () {
        this._path.setAttribute('d', this.getPathString());
    },

    _getViewAngleFromModel: function (modelAngle) {
        return Math.PI / 2.0 - modelAngle;
    },

    _getSizeFromGPSRefPos: function () {
        return [
            this._gpsRefPos[0] + this._gpsRefPos[1],
            this._gpsRefPos[2] + this._gpsRefPos[3]
        ];
    },

    _getOffsetFromGPSRefPos: function () {
        return [
            -this._gpsRefPos[1],
            -this._gpsRefPos[3]
        ];
    },

    _resizeAndMovePoint: function (point, size, offset) {
        return [
            point[0] * size[0] + offset[0],
            point[1] * size[1] + offset[1]
        ];
    },

    getTrackId: function () {
        return this._Id;
    },

    _getLatSize: function () {
        return this._getLatSizeOf(this._size);
    },

    _getLngSize: function () {
        return this._getLngSizeOf(this._size);
    },

    _getLngSizeOf: function (value) {
        return ((value / 40075017) * 360) / Math.cos((Math.PI / 180) * this._latlng.lat);
    },

    _getLatSizeOf: function (value) {
        return (value / 40075017) * 360;
    },

    getBounds: function () {
        var lngSize = this._getLngSize() / 2.0;
        var latSize = this._getLatSize() / 2.0;
        var latlng = this._latlng;
        return new L.LatLngBounds(
            [latlng.lat - latSize, latlng.lng - lngSize],
            [latlng.lat + latSize, latlng.lng + lngSize]);
    },

    getLatLng: function () {
        return this._latlng;
    },

    setGPSRefPos: function (gpsRefPos) {
        if (gpsRefPos === undefined ||
            gpsRefPos.length < 4 ||
            gpsRefPos[0] === 0 || gpsRefPos[0] == null ||
            gpsRefPos[1] === 0 || gpsRefPos[1] == null ||
            gpsRefPos[2] === 0 || gpsRefPos[2] == null ||
            gpsRefPos[3] === 0 || gpsRefPos[3] == null) {
            this._gpsRefPos = [7, 3, 2, 1];
        } else {
            this._gpsRefPos = gpsRefPos;
        }
        return this.redraw();
    },

    _rotateAllPoints: function (points, angle) {
        var result = [];
        for (var i = 0; i < points.length; i += 2) {
            var x = points[i + 0] * this._size;
            var y = points[i + 1] * this._size;
            var pt = this._rotate([x, y], angle);
            result.push(pt[0]);
            result.push(pt[1]);
        }
        return result;
    },

    _rotate: function (point, angle) {
        var x = point[0];
        var y = point[1];
        var si_z = Math.sin(angle);
        var co_z = Math.cos(angle);
        var newX = x * co_z - y * si_z;
        var newY = x * si_z + y * co_z;
        return [newX, newY];
    },

    _transformTargetSmallSymbol: function (points) {
        var result = [];
        var symbolViewCenter = this._map.latLngToLayerPoint(this._latlng);
        for (var i = 0; i < points.length; i += 2) {
            var x = symbolViewCenter.x + points[i + 0];
            var y = symbolViewCenter.y - points[i + 1];
            result.push(x);
            result.push(y);
        }
        return result;
    },

    _transformTargetBigSymbol: function () {
        var headingAngle = this._getViewAngleFromModel(this._heading);
        var result = [];
        var size = this._getSizeFromGPSRefPos();
        var offset = this._getOffsetFromGPSRefPos();
        for (var i = 0; i < this._selShipSymbol.length; i += 2) {
            var pt = [
                this._selShipSymbol[i + 0],
                this._selShipSymbol[i + 1]
            ];
            pt = this._resizeAndMovePoint(pt, size, offset);
            pt = this._rotate(pt, headingAngle);
            var pointLng = this._latlng.lng + this._getLngSizeOf(pt[0]);
            var pointLat = this._latlng.lat + this._getLatSizeOf(pt[1]);
            var viewPoint = this._map.latLngToLayerPoint(L.latLng([pointLat, pointLng]));
            result.push(viewPoint.x);
            result.push(viewPoint.y);
        }
        return result;
    },

    _createBigShipPathFromPoints: function (points) {
        var result;
        for (var i = 0; i < points.length; i += 2) {
            var x = points[i + 0];
            var y = points[i + 1];
            if (result === undefined) {
                result = 'M ' + x + ' ' + y + ' ';
            } else if (i == 6 || i == 12 || i == 18) {
                result += 'M ' + x + ' ' + y + ' ';
            } else {
                result += 'L ' + x + ' ' + y + ' ';
            }
        }
        return result;
    },

    _createPathFromPoints: function (points) {
        var result;
        for (var i = 0; i < points.length; i += 2) {
            var x = points[i + 0];
            var y = points[i + 1];
            if (result === undefined)
                result = 'M ' + x + ' ' + y + ' ';
            else
                result += 'L ' + x + ' ' + y + ' ';
        }
        return result + ' Z';
    },

    _transformAllPointsToView: function (points) {
        var result = [];
        var symbolViewCenter = this._map.latLngToLayerPoint(this._latlng);
        for (var i = 0; i < points.length; i += 2) {
            var x = symbolViewCenter.x + points[i + 0];
            var y = symbolViewCenter.y - points[i + 1];
            result.push(x);
            result.push(y);
        }
        return result;
    },

    _createCourseLeaderViewPoints: function (angle) {
        var leaderLength = this._speed * this._leaderTime;
        var leaderEndLng = this._latlng.lng + this._getLngSizeOf(leaderLength * Math.cos(angle));
        var leaderEndLat = this._latlng.lat + this._getLatSizeOf(leaderLength * Math.sin(angle));
        var endPoint = this._map.latLngToLayerPoint(L.latLng([leaderEndLat, leaderEndLng]));
        var startPoint = this._map.latLngToLayerPoint(this._latlng);
        return [startPoint.x, startPoint.y, endPoint.x, endPoint.y];
    },

    _createCourseLeaderViewPointsNew: function (startPoint, angle) {
        var leaderLength = this._speed * this._leaderTime;
        var leaderEndLng = startPoint.lng + this._getLngSizeOf(leaderLength * Math.cos(angle));
        var leaderEndLat = startPoint.lat + this._getLatSizeOf(leaderLength * Math.sin(angle));
        var endPoint = this._map.latLngToLayerPoint(L.latLng([leaderEndLat, leaderEndLng]));
        var startPoint = this._map.latLngToLayerPoint(startPoint);
        return [startPoint.x, startPoint.y, endPoint.x, endPoint.y];
    },

    _createCourseLeaderViewPointsRot: function (startPoint, angle) {
        var leaderLength = (18 - this._map.getZoom()) * 7;
        var leaderEndLng = startPoint.lng + this._getLngSizeOf(leaderLength * Math.cos(angle));
        var leaderEndLat = startPoint.lat + this._getLatSizeOf(leaderLength * Math.sin(angle));
        var endPoint = this._map.latLngToLayerPoint(L.latLng([leaderEndLat, leaderEndLng]));
        var startPoint = this._map.latLngToLayerPoint(startPoint);
        return [startPoint.x, startPoint.y, endPoint.x, endPoint.y];
    },

    _createCoursePathFromPoints: function (points) {
        var result;
        var xStart = points[0];
        var yStart = points[1];
        var xEnd = points[2];
        var yEnd = points[3];
        var pointNum = parseInt(Math.sqrt((xStart - xEnd) * (xStart - xEnd) + (yStart - yEnd) * (yStart - yEnd)) / 10);
        var x = (xEnd - xStart) / pointNum;
        var y = (yEnd - yStart) / pointNum;
        result = 'M ' + xStart + ' ' + yStart + ' ';
        for (var i = 0; i < (pointNum - 1); i++) {
            xStart = xStart + x;
            yStart = yStart + y;
            if ((pointNum) - i == 1 && i % 2 != 0) {
                result += 'L ' + xEnd + ' ' + yEnd + ' ';
            } else if ((pointNum - i) == 1 && i % 2 == 0) {
                result += 'M ' + xEnd + ' ' + yEnd + ' ';
            } else if (i % 2 == 0) {
                result += 'L ' + xStart + ' ' + yStart + ' '
            } else {
                result += 'M ' + xStart + ' ' + yStart + ' ';
            }
        }
        return result;
    },

    _transformSilouetteSymbol: function () {
        var headingAngle = this._getViewAngleFromModel(this._heading);
        var result = [];
        var size = this._getSizeFromGPSRefPos();
        var offset = this._getOffsetFromGPSRefPos();
        for (var i = 0; i < this._silSymbol.length; i += 2) {
            var pt = [
                this._silSymbol[i + 0],
                this._silSymbol[i + 1]
            ];
            pt = this._resizeAndMovePoint(pt, size, offset);
            pt = this._rotate(pt, headingAngle);
            var pointLng = this._latlng.lng + this._getLngSizeOf(pt[0]);
            var pointLat = this._latlng.lat + this._getLatSizeOf(pt[1]);
            var viewPoint = this._map.latLngToLayerPoint(L.latLng([pointLat, pointLng]));
            result.push(viewPoint.x);
            result.push(viewPoint.y);
        }
        return result;
    },

    _transformSilouetteSymbolSmall: function () {
        var headingAngle = this._getViewAngleFromModel(this._heading);
        var result = [];
        var size = this._getSizeFromGPSRefPos();
        var offset = this._getOffsetFromGPSRefPos();
        for (var i = 0; i < this._silSymbol.length; i += 2) {
            var pt = [
                this._silSymbol[i + 0],
                this._silSymbol[i + 1]
            ];
            pt = this._resizeAndMovePoint(pt, size, offset);
            pt = this._rotate(pt, headingAngle);
            var pointLng = this._latlng.lng + this._getLngSizeOf(pt[0]);
            var pointLat = this._latlng.lat + this._getLatSizeOf(pt[1]);
            var viewPoint = this._map.latLngToLayerPoint(L.latLng([pointLat, pointLng]));
            result.push(viewPoint.x);
            result.push(viewPoint.y);
        }
        return result;
    },

    _transformSilouetteSymbolRadar: function () {
        var headingAngle = this._getViewAngleFromModel(this._heading);
        var result = [];
        var size = this._getSizeFromGPSRefPos();
        var offset = this._getOffsetFromGPSRefPos();
        for (var i = 0; i < this._bigRadarSymbol.length; i += 2) {
            var pt = [
                this._bigRadarSymbol[i + 0],
                this._bigRadarSymbol[i + 1]
            ];
            pt = this._resizeAndMovePoint(pt, size, offset);
            pt = this._rotate(pt, headingAngle);
            var pointLng = this._latlng.lng + this._getLngSizeOf(pt[0]);
            var pointLat = this._latlng.lat + this._getLatSizeOf(pt[1]);
            var viewPoint = this._map.latLngToLayerPoint(L.latLng([pointLat, pointLng]));
            result.push(viewPoint.x);
            result.push(viewPoint.y);
        }
        return result;
    },

    // 船舶选择框
    _createWithTargetymbolPathString: function () {
        var headingAngle = this._getViewAngleFromModel(this._heading);
        var viewPoints;
        if (this._map.getZoom() <= this._minSilouetteZoom) {
            // 缩放小于minSilouetteZoom时船舶选择框
            viewPoints = this._transformTargetSmallSymbol(this._rotateAllPoints(this._selTriangularSymbol, headingAngle));
        } else {
            // 缩放大于minSilouetteZoom时船舶选择框
            viewPoints = this._transformTargetBigSymbol();
        }
        var viewPath = this._createBigShipPathFromPoints(viewPoints);
        return viewPath;
    },

    // 三角
    _createWithHeadingSymbolPathString: function () {
        var headingAngle = this._getViewAngleFromModel(this._heading);
        var viewPath = '';
        var viewPoints ;

        if (this._radarType == 0) {
            viewPoints = this._transformAllPointsToView(this._rotateAllPoints(this._triSymbol, headingAngle));
            viewPath += this._createPathFromPoints(viewPoints);
        } else {
            viewPoints = this._transformAllPointsToView(this._rotateAllPoints(this._triSymbolSmall, headingAngle));
            if (this._radarType == 1) {
                viewPath += this._createPathFromPoints(viewPoints);
            }
        }
        // if (this._radarType == 1 || this._radarType == 2) {
        //     // var viewPointsRadar = this._transformAllPointsToView(this._rotateAllPoints(this._radarSymbol, headingAngle));
        //     // viewPath += this._createPathFromPoints(viewPointsRadar);
        // }
        if (this._heading !== undefined && this._speed !== undefined) {
            var leaderPoints = [viewPoints[0], viewPoints[1]];
            var latLng = this._map.layerPointToLatLng(leaderPoints);
            var leaderPoints = this._createCourseLeaderViewPointsNew(latLng, headingAngle);
            viewPath += '' + this._createPathFromPoints(leaderPoints);

            if (this._rot !== null && this._rot !== undefined && this._rot !== "" && this._rot !== 0) {
                var rotPoints = [leaderPoints[2], leaderPoints[3]];
                var latLngRot = this._map.layerPointToLatLng(rotPoints);
                var rotHeading;
                var headingAngle = this._heading * 180 / Math.PI;
                if (this._rot > 0) {
                    rotHeading = headingAngle + 90;
                } else {
                    rotHeading = headingAngle - 90;
                }

                var headingAngleRot = this._getViewAngleFromModel(rotHeading * Math.PI / 180.0);
                var rotPoints = this._createCourseLeaderViewPointsRot(latLngRot, headingAngleRot);
                viewPath += '' + this._createPathFromPoints(rotPoints);
            }
        }
        if (this._radarType == 1 || this._radarType == 2) {
            var r = this._getSolve(L.point(viewPoints[0],viewPoints[1]),L.point(viewPoints[2],viewPoints[3]),L.point(viewPoints[4],viewPoints[5]));
            viewPath += 'M '+viewPoints[0]+','+viewPoints[1]
                +'A '+ r +','+ r +',0,0,0,' + viewPoints[2]+','+viewPoints[3] +
                'A '+ r +','+ r +',0,1,0,' + viewPoints[0]+','+viewPoints[1]
                +'z';
        }
        this._point = viewPath;
        return viewPath;
    },

    _getSolve: function(a, b ,c) {
        var x=( (a.x*a.x-b.x*b.x+a.y*a.y-b.y*b.y)*(a.y-c.y)-(a.x*a.x-c.x*c.x+a.y*a.y-c.y*c.y)*(a.y-b.y) ) / (2*(a.y-c.y)*(a.x-b.x)-2*(a.y-b.y)*(a.x-c.x));
        var y=( (a.x*a.x-b.x*b.x+a.y*a.y-b.y*b.y)*(a.x-c.x)-(a.x*a.x-c.x*c.x+a.y*a.y-c.y*c.y)*(a.x-b.x) ) / (2*(a.y-b.y)*(a.x-c.x)-2*(a.y-c.y)*(a.x-b.x));
        var r=Math.sqrt((x-a.x)*(x-a.x)+(y-a.y)*(y-a.y));
        return r;
    },

    // 船型
    _createSilouetteSymbolPathString: function () {
        var viewPath = '';
        var silouettePoints = this._transformSilouetteSymbol();
        if (this._radarType == 0 || this._radarType == 1) {
            viewPath += this._createPathFromPoints(silouettePoints);
        }
        // if (this._radarType == 1 || this._radarType == 2) {
        //     var silouettePointsRadar = this._transformSilouetteSymbolRadar();
        //     viewPath += this._createPathFromPoints(silouettePointsRadar);
        // }
        if (this._heading !== undefined && this._speed !== undefined) {
            var leaderPoints = [silouettePoints[0], silouettePoints[1]];
            leaderPoints.push(silouettePoints[0] * 3 - silouettePoints[6] - silouettePoints[4]);
            leaderPoints.push(silouettePoints[1] * 3 - silouettePoints[7] - silouettePoints[5]);
            viewPath += '' + this._createPathFromPoints(leaderPoints);
            if (this._rot !== null && this._rot !== undefined && this._rot !== "" && this._rot !== 0) {

                var rotPoints = [leaderPoints[2], leaderPoints[3]];
                if (this._rot > 0) {
                    rotPoints.push(silouettePoints[6] + (leaderPoints[2] - (silouettePoints[4] + silouettePoints[6]) * 0.5));
                    rotPoints.push(silouettePoints[7] + (leaderPoints[3] - (silouettePoints[5] + silouettePoints[7]) * 0.5));
                } else {
                    rotPoints.push(silouettePoints[4] + (leaderPoints[2] - (silouettePoints[4] + silouettePoints[6]) * 0.5));
                    rotPoints.push(silouettePoints[5] + (leaderPoints[3] - (silouettePoints[5] + silouettePoints[7]) * 0.5));
                }

                viewPath += '' + this._createPathFromPoints(rotPoints);
            }
        }
        if (this._course !== undefined && this._speed !== undefined) {
            var courseAngle = this._getViewAngleFromModel(this._course);
            var leaderPoints = this._createCourseLeaderViewPoints(courseAngle);
            viewPath += '' + this._createCoursePathFromPoints(leaderPoints);
        }
        if (this._radarType == 1 || this._radarType == 2) {
            var r = this._getSolve(L.point(silouettePoints[0],silouettePoints[1]),L.point(silouettePoints[4],silouettePoints[5]),L.point(silouettePoints[6],silouettePoints[7]));
            viewPath += 'M '+silouettePoints[0]+','+silouettePoints[1]
                +'A '+ r +','+ r +',0,0,0,' + silouettePoints[4]+','+silouettePoints[5] +
                'A '+ r +','+ r +',0,1,0,' + silouettePoints[0]+','+silouettePoints[1]
                +'z';
        }
        this._point = viewPath;
        return viewPath;
    },

    getPathString: function () {
        if (this._type == "target") {
            return this._createWithTargetymbolPathString();
        } else if (this._gpsRefPos === undefined || this._map.getZoom() <= this._minSilouetteZoom) {
            return this._createWithHeadingSymbolPathString();
        } else {
            return this._createSilouetteSymbolPathString();
        }
    }

})

L.trackSymbol = function (latlng, options) {
    return new L.TrackSymbol(latlng, options);
};