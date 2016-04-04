surveyReportApp.controller('ShowRegionMapController', function ($scope, $rootScope, $state, $q, AuthService, $window, RegionMapService) {
    // one agency Location consists of:
    // At LatLng
    // description
    // get agency location from API on init
    $scope.agencyLocation;
    var formatNumber = $rootScope.numberWithCommas;
    // only one info
    var info = new google.maps.InfoWindow();
    // legend's levels
    var level = [];

    // legend
    var color = ['#ffb366', '#ffa64d', '#ff9933', '#ff8c1a', '#ff8000', '#e67300', '#cc6600', '#b35900', '#994d00', '#804000'];
    $scope.levels;

    //map
    $scope.map;
    
    //store current location
    $scope.my_location;

    //heatmap data
    $scope.heatMapData;

    //geo weight
    $scope.mapData;

    // hold current boundaries data
    var polygons;
    var type = "P";

    // boundaries
    $scope.boundaries;

    // default list
    $scope.defaultList;

    //change the center of the map
    $scope.ChangeCenter = function (id) {

        //get lat and lng
        var locationLat = $scope.agencyLocation[id].location.latitude;
        var locationLng = $scope.agencyLocation[id].location.longtitude;

        $scope.setCenterMap("", new google.maps.LatLng(locationLat, locationLng));

    }

    function clone(obj) {
        if (null == obj || "object" != typeof obj) return obj;
        var copy = obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
        }
        return copy;
    }

    function compare(a, b) {
        var A = a.details[0], B = b.detail[0];

        if (A.yield < B.yield)
            return -1;
        else if (A.yield > B.yield)
            return 1;
        else
            return 0;
    }

    function round(x, base) {
        var half = base / 2;
        return ((Number(((x + half) / base).toFixed(0)) * base));
    }

    function update_level() {

        var min = $scope.mapData.min;
        var max = $scope.mapData.max;

        var inc = max / 11;
        
        if (max > 1000)
            inc = round(inc, 1000);
        else if (max > 100)
            inc = round(inc, 100);
        else if (max > 10)
            inc = round(inc, 10);
        else
            inc = inc.toFixed(0);

        var levels = [];
        var cur = 0;
        var i;
        for (i = 0; i < 10; i++) {
            cur += inc;
            levels.push({ show: true, color: color[i], type: true, 'yield': cur });
            if (max < cur)
                break;
        }

        if (max > cur) {
            levels[9].yield -= inc;
            levels[9].type = false;
        }

        $scope.levels = levels;
    }

    function getInfo(id) {
        if (!$scope.mapData)
            return null;

        var index = $scope.mapData.index[id];
        if (index !== undefined && index !== null)
            return $scope.mapData.data[index].detail;
        else
            return null;
    }

    function getBoundary(id) {
        if(!$scope.boundaries)
            return null;

        var boundary = $scope.boundaries[id];
        if (boundary)
            return boundary;
        else
            return null;
    }

    function updatePolygons() {
        if (!polygons)
            return;

        angular.forEach(polygons, function (val, k) {
            val.setMap(null);
        });

        polygons = [];
        angular.forEach($scope.mapData.index, function (val, k) {
            var boundary = getBoundary(k);
            if (!polygons)
                polygons = addPolygon(boundary);
            else
                polygons = polygons.concat(addPolygon(boundary));
        });
    }
    
    function mergeData(src, dest) {
        var curID = dest.data.length;

        if (dest.max < src.max) {
            dest.max = src.max;
            update_level();
            updatePolygons();
        }

        if (dest.min > src.min)
            dest.min = src.min;

        angular.forEach(src.data, function (val, k) {
            dest.data.push(val);
            dest.index[val.id] = curID++;
        });
    }

    function setStyle(feature) {
        var _id = feature.getProperty('db_id');
        if (getInfo(_id)) {
            return {
                fillColor: setMapColor(_id),
                fillOpacity: 0.8,
                strokeColor: '#b3b3b3',
                strokeWeight: 1,
                zIndex: 1
            }
        } else {
            return {
                fillOpacity: 0,
                strokeWeight: 0,
                zIndex: 1
            }
        }
    }

    function addBoundary(id) {
        var mapInfo = getInfo(id);
        var boundary = getBoundary(id);

        if (mapInfo && boundary) {
            var polygon = new google.maps.Polygon({
                id: val.id,
                name: val.name,
                paths: google.maps.geometry.encoding.decodePath(bval),
                fillColor: setMapColor(id),
                fillOpacity: 0.8,
                strokeColor: '#b3b3b3',
                strokeWeight: 1,
                zIndex: 1
            });
            return polygon;
        } else
            return null;
    }

    //make data layer
    $scope.makeDataLayerTest = function () {
        RegionMapService.LoadBoundary('P', null).then(function (response) {
            boundaries = response;

            angular.forEach(response, function (val, k) {
                angular.forEach(val.boundary, function (bval, bk) {
                    var p = new google.maps.Polygon({
                        id: val.id,
                        name: val.name,
                        paths: google.maps.geometry.encoding.decodePath(bval),
                        fillOpacity: 0,
                        strokeWeight: 0,
                        zIndex: 1
                    });

                    p.addListener('click', function (e) {
                        info.close();
                        
                        var content = '<h3><b>' + this.name + '</b></h3>' +
                              '<div><p> ID: '+this.id+'</p></div>';

                        info.setContent(content);


                        var anchor = new google.maps.MVCObject();

                        anchor.set("position", e.latLng);

                        info.open($scope.map, anchor);

                    });

                    p.setMap($scope.map);

                });
            });

            $scope.closeProgress();
        });
    }

    function addPolygon(boundary) {
        if (!boundary)
            return [];

        var polygons = [];
        angular.forEach(boundary.boundary, function (val, k) {
            var polygon = new google.maps.Polygon({
                id: boundary.id,
                name: boundary.name,
                paths: google.maps.geometry.encoding.decodePath(val),
                fillColor: setMapColor(boundary.id),
                fillOpacity: 0.8,
                strokeColor: '#b3b3b3',
                strokeWeight: 1,
                zIndex: 1
            });

            polygon.addListener('click', function (e) {
                info.close();

                var map_info = getInfo(this.id);

                var content;

                if (!map_info)
                    content = '<h3><b>' + this.name + '</b></h3>' +
                      '<div>' +
                        '<p class = "info-text-style"> Không được phép truy cập</p>' +
                      '</div>';
                else {
                    content = '<h3><b>' + this.name + '</b></h3>' +
                      '<div><table style="border:0px;">';
                    angular.forEach(map_info, function (data, k) {
                        content += '<tr class = "info-text-style"><th>' + data.name + ':</th><td style="text-align:right;">' + formatNumber(data.yield) + ' tấn</td></tr>';
                    });
                    content += '</table></div>';
                }

                info.setContent(content);

                var anchor = new google.maps.MVCObject();

                anchor.set("position", e.latLng);

                info.open($scope.map, anchor);

            });

            polygon.setMap($scope.map);

            polygons.push(polygon);
        });
        
        return polygons;
    }

    $scope.makeDataLayer = function (type, param) {
        var mapPromise = RegionMapService.LoadBoundary(type).then(function (boundariesData) {
            $scope.boundaries = boundariesData;
        }); 
        
        ////////////////////////////////////////////////////////////////////////

        RegionMapService.GetMapData(type, param).then(function (response) {
            var promises = response;
            mapPromise.then(function () {
                angular.forEach(response, function (res, k) {
                    res.then(function (data) {
                       if (!$scope.mapData) {
                            $scope.mapData = clone(data);
                            $scope.mapData.data = [];
                            $scope.mapData.data = $scope.mapData.data.concat(data.data);
                        }
                        else
                            mergeData(data, $scope.mapData);

                        if (!$scope.levels)
                            update_level();

                        angular.forEach(data.index, function (val, k) {
                            var boundary = getBoundary(k);
                            if (!polygons)
                                polygons = addPolygon(boundary);
                            else
                                polygons = polygons.concat(addPolygon(boundary));
                        });

                        $scope.closeProgress();
                    });
                });
            })
        });
        
        ////////////////////////////////////////////////////////////////////////
                           
    }

    function setMapColor(id) {
        var info = getInfo(id);
        var weight;

        if (info)
            weight = info[0].yield;
        else
            weight = null;

        if (weight === undefined || weight === null)
            return null;
            
        var levels = $scope.levels;
        if (levels) {
            var len = levels.length;

            min = 0;

            for (var i = 0; i < len; i++) {
                if (levels[i].type) {
                    if (weight >= min && weight < levels[i].yield)
                        return levels[i].color;

                    min - levels[i].yield;
                } else {
                    if (weight > levels[i].yield)
                        return levels[i].color;
                }
            }
        } else
            return 0;
    }

    //set the center of map
    $scope.setCenterMap = function (address, center) {
        if (address.length > 0) {
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({ 'address': address }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {

                    //fit the map to boundary of Vietnam
                    $scope.map.fitBounds(results[0].geometry.bounds);
                    //set center at Viet nam location
                    if (typeof (center) === 'undefined')
                        $scope.map.setCenter(results[0].geometry.location);
                    else {

                        $scope.map.setCenter(center);
                    }
                } else {
                    alert("Geocode was not successful for the following reason: " + status);
                }
            });
        }
        else {
            $scope.map.setCenter(center);
            $scope.map.setZoom(13);
        }
    }

    function getBoundaries(provinces_list) {
        var zoom = $scope.map.getZoom();
        console.log(zoom);
        prevType = type;

        // uncomment de test
        /*
        if (zoom < 10) {
            type = "P";
        } else if (zoom < 13) {
            type = "D";
        } else {
            type = "W";
        }
        */

        type = "P";

        if (type !== "P" || prevType !== type) {

            angular.forEach(polygons, function (val, k) {
                val.setMap(null);
            });
            $scope.mapData = null;
            $scope.boundaries = null;
            $scope.levels = null;
            $scope.makeDataLayer(type, provinces_list);
        }
    }

    $scope.initMap = function () {
        // map option
        var mapOptions = {
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            scaleControl: true,
            zoomControl: true,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.LARGE
            },
        };

        // new map and put it in div "map"
        $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);
        if (document.getElementById("show-map").clientHeight === 0) {
            document.getElementById("show-map").style.height = (document.documentElement.clientHeight - 65) + 'px';
            document.getElementById("show-map").style.paddingTop = "65px";
        }

        //set the center of map
        $scope.setCenterMap("Viet Nam");

        var topDealer = document.getElementById('show-top-dealer');
        var legend = document.getElementById('legend');

        $scope.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(topDealer);
        $scope.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);

        google.maps.event.addListener($scope.map, "click", function (event) {
            info.close();
        });
    };

    $scope.ShowTopDealer = function () {
        $state.go("tabs.top-dealer-option", {}, { reload: false });
    }

    $scope.loadDefaultList = function () {
        return RegionMapService.LoadDefaultList().then(function (response) {
            $scope.defaultList = response;

            $scope.map.addListener('idle', function () {
                var bounds = $scope.map.getBounds();
                var ne = bounds.getNorthEast(); // LatLng of the north-east corner
                var sw = bounds.getSouthWest(); // LatLng of the south-west corder

                var top = ne.lat();
                var bottom = sw.lat();
                var right = ne.lng();
                var left = sw.lng();

                var provinces = $scope.defaultList;
                var province_list = [];

                angular.forEach(provinces, function (val, k) {
                    if (!((val.top > top && val.bottom > top) || (val.top < bottom && val.bottom < bottom))
                        &&
                        !((val.left > right && val.right > right) || (val.left < left && val.right < left))
                        ) {
                        province_list.push(val);
                    }
                });
                for (var i = 0, len = provinces.length; i < len; i++) {
                    var val = provinces[i];
                    if (!((val.top > top && val.bottom > top) || (val.Top < bottom && val.bottom < bottom))
                        &&
                        !((val.left > right && val.right > right) || (val.left < left && val.right < left))
                        ) {
                        province_list.push(val);
                    }
                }

                getBoundaries(province_list);

            });
        });
    }

    angular.element(document).ready(function () {
        $scope.openProgress();
        $scope.initMap();
        $scope.loadDefaultList();
        $scope.makeDataLayer('P', null);
    });
});