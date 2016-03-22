surveyReportApp.controller('ShowRegionMapController', function ($scope, $rootScope, $state, $q, AuthService, $window, RegionMapService) {
    // one agency Location consists of:
    // At LatLng
    // description
    // get agency location from API on init
    $scope.agencyLocation;
    var formatNumber = $rootScope.numberWithCommas;
    var agency_index = [];
    var info = new google.maps.InfoWindow();
    var level = [];

    // legend
    var color = ['#ffb366', '#ffa64d', '#ff9933', '#ff8c1a', '#ff8000', '#e67300', '#cc6600', '#b35900', '#994d00', '#804000']
    $scope.levels;

    //map
    $scope.map;
    
    //store current location
    $scope.my_location;

    //heatmap data
    $scope.heatMapData;

    //geo weight
    $scope.mapData;
    
    //geo data
    $scope.geoData;

    //change the center of the map
    $scope.ChangeCenter = function (id) {

        //get lat and lng
        var locationLat = $scope.agencyLocation[id].location.latitude;
        var locationLng = $scope.agencyLocation[id].location.longtitude;

        $scope.setCenterMap("", new google.maps.LatLng(locationLat, locationLng));

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
        //var temp = $scope.mapData.data;
        //temp.sort(compare);

        //var len = temp.length;
        //var median = 0;
        //var q1 = 0;
        //var q3 = 0;

        //if (len % 2 == 0) {
        //    var mid = len / 2;
        //    median = (temp[mid].detail[0].yield + temp[mid + 1].detail[0].yield) / 2;
        //} else {
        //    var mid = ceil(len / 2);
        //    median = temp[mid].detail[0].yield;
        //}

        //if (len % 4 == 0) {
        //    var q = len / 4;
        //    q1 = (temp[q].detail[0].yield + temp[q + 1].detail[0].yield) / 2;
        //    q3 = (temp[q * 3].detail[0].yield + temp[q * 3 + 1].detail[0].yield) / 2;
        //} else {
        //    var q = ceil(len / 4);
        //    q1 = (temp[q].detail[0].yield + temp[q + 1].detail[0].yield) / 2;
        //    q3 = (temp[q * 3].detail[0].yield + temp[q * 3 + 1].detail[0].yield) / 2;
        //}

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
        if (max > cur){
            levels[9].yield -= inc;
            levels[9].type = false;
            }

        $scope.levels = levels;
    }

    function getInfo(id) {
        var index = $scope.mapData.index[id];
        if (index !== undefined && index !== null)
            return $scope.mapData.data[index].detail;
        else
            return null;
    }
    
    function mergeData(src, dest) {
        var curID = dest.data.length;

        if (dest.max < src.max) {
            dest.max = src.max;
            update_level();
        }
        if (dest.min > src.min)
            dest.min = src.min;

        angular.forEach(src.data, function (val, k) {
            dest.data.push(val);
            dest.index[val.id] = curID++;
        });
    }

    //make data layer
    var polygon = [];
    $scope.makeDataLayerTest = function () {
        RegionMapService.LoadDistrictsBoundary(null).then(function (response) {
            angular.forEach(response, function (val, k) {
                angular.forEach(val.boundary, function (bval, bk) {
                    var p = new google.maps.Polygon({
                        id: val.id,
                        name: val.name,
                        paths: google.maps.geometry.encoding.decodePath(bval),
                        strokeColor: '#00FF00',
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillOpacity: 0.5
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
        });
    }

    function updateLayer(layer) {
        var layerMap = layer.getMap();
        if (layerMap)
            layer.setMap(null);
        else
            layer.setMap($scope.map);
    }

    $scope.makeDataLayer = function () {
        var start = new Date().getTime();
        var end;
        RegionMapService.LoadGeoJson().then(function (geoData) {
            $scope.geoData = new google.maps.Data();
            $scope.geoData.addGeoJson(geoData);
            end = new Date().getTime();
            console.log(end - start);

            $scope.geoData.setStyle(function (feature) {
                return {
                    fillOpacity: 0,
                    strokeWeight: 0,
                    zIndex: 1
                }
            });

            $scope.geoData.addListener('mouseover', function (e) {
                $scope.geoData.overrideStyle(e.feature, {
                    strokeColor: '#2a2a2a',
                    strokeWeight: 2,
                    zIndex: 2
                });
            });

            $scope.geoData.addListener('mouseout', function (e) {
                $scope.geoData.revertStyle();
            });

            $scope.geoData.addListener('click', function (e) {
                info.close();

                var map_info = getInfo(e.feature.getProperty('db_id'));

                var content;

                if (!map_info)
                    content = '<h3><b>' + e.feature.getProperty('NAME_1') + '</b></h3>' +
                      '<div>' +
                        '<p class = "info-text-style"> Không được phép truy cập</p>' +
                      '</div>';
                else {
                    content = '<h3><b>' + e.feature.getProperty('NAME_1') + '</b></h3>' +
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

            $scope.geoData.setMap($scope.map);
        });
        
        ////////////////////////////////////////////////////////////////////////

        RegionMapService.GetMapData('P', null).then(function (response) {
            var promises = response;

            angular.forEach(response, function (res, k) {
                res.then(function (data) {
                    if (!$scope.mapData)
                        $scope.mapData = data;
                    else
                        mergeData(data, $scope.mapData);

                    if (!$scope.levels)
                        update_level();

                    $scope.geoData.setStyle(function (feature) {
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
                    });
                    
                    $scope.closeProgress();
                });
            });
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
        //set the center of map
        $scope.setCenterMap("Viet Nam");

        var topDealer = document.getElementById('show-top-dealer');
        var legend = document.getElementById('legend');

        $scope.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(topDealer);
        $scope.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);

    };

    $scope.ShowTopDealer = function () {
        $state.go("tabs.top-dealer-option", {}, { reload: false });
    }

    angular.element(document).ready(function () {
        $scope.openProgress();
        $scope.initMap();
        $scope.makeDataLayer();
    });
});