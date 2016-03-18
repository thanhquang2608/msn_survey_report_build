surveyReportApp.controller('ShowRegionMapController', function ($scope, $rootScope, $state, $q, AuthService, $window, ShowReportSurveyAPI) {
    // one agency Location consists of:
    // At LatLng
    // description
    // get agency location from API on init
    $scope.agencyLocation;
    var agency_index = [];
    var info = new google.maps.InfoWindow();

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

    function getInfo(id) {
        var index = $scope.mapData.index[id];
        if (index !== undefined && index !== null)
            return $scope.mapData.data[index].detail;
        else
            return null;
    }
    
    function mergeData(src, dest) {
        var curID = dest.data.length;

        if (dest.max < src.max)
            dest.max = src.max;
        if (dest.min > src.min)
            dest.min = src.min;

        angular.forEach(src.data, function (val, k) {
            dest.data.push(val);
            dest.index[val.id] = curID++;
        });
    }

    //make heatmap
    $scope.makeHeatLayer = function () {

        $scope.heatMapData = [];

        angular.forEach($scope.agencyLocation, function (val, k) {
            // get latitude
            var locationLat = val.location.latitude;
            // get longtitude
            var locationLng = val.location.longtitude;
            // push to heatmap data 
            $scope.heatMapData.push({ location: new google.maps.LatLng(locationLat, locationLng), weight: val.weight });
        });

        var heatmap = new google.maps.visualization.HeatmapLayer({
            data: $scope.heatMapData
        });
        heatmap.setMap($scope.map);
    }

    $scope.makeHeatLayerTemp = function () {
        ShowReportSurveyAPI.LoadGeoJson().then(function (geoData) {
            $scope.geoData = new google.maps.Data();
            $scope.geoData.addGeoJson(geoData);
        });
        
        ////////////////////////////////////////////////////////////////////////

        ShowReportSurveyAPI.GetMapData().then(function (response) {
            var promises = response;

            angular.forEach(response, function (res, k) {
                res.then(function (data) {
                    if (!$scope.mapData)
                        $scope.mapData = data;
                    else
                        mergeData(data, $scope.mapData);
                    
                    $scope.geoData.setStyle(function (feature) {
                        return {
                            fillColor: setMapColor(feature.getProperty('db_id')),
                            fillOpacity: 0.8,
                            strokeColor: '#b3b3b3',
                            strokeWeight: 1,
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
                                content += '<tr class = "info-text-style"><th>' + data.name + ':</th><td style="text-align:right;">' + data.yield + ' tấn</td></tr>';
                            });
                            content += '</table></div>';
                        }

                        info.setContent(content);


                        var anchor = new google.maps.MVCObject();

                        anchor.set("position", e.latLng);

                        info.open($scope.map, anchor);

                    });

                    $scope.geoData.setMap($scope.map);
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

        return weight <= 1000 ? '#ffb366' :
               weight <= 2000 ? '#ffa64d' :
               weight <= 3000 ? '#ff9933' :
               weight <= 4000 ? '#ff8c1a' :
               weight <= 10000 ? '#ff8000' :
               weight <= 20000 ? '#e67300' :
               weight <= 30000 ? '#cc6600' :
               weight <= 40000 ? '#b35900' :
               weight <= 50000 ? '#994d00' :
               '#804000';
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

        $scope.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(topDealer);

    };

    $scope.ShowTopDealer = function () {
        $state.go("tabs.top-dealer-option", {}, { reload: false });
    }

    angular.element(document).ready(function () {
        $scope.openProgress();
        $scope.initMap();
        $scope.makeHeatLayerTemp();
    });
});