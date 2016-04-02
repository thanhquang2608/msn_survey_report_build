surveyReportApp.controller('ShowAgencyMapController', function ($scope, $interval, $rootScope, $state, AgencyFilterCache, AgencyDealerCache,
                                                                AuthService, ShowReportSurveyAPI, USERS, $compile, $filter) {

    $scope.openProgress();
    // one agency Location consists of:
    // At LatLng
    // description
    // get agency location from API on init
    $scope.agencyLocation;

    //map
    $scope.map;

    //contain markers of the map
    $scope.markers = [];

    //contain places in search box
    $scope.places = [];

    $scope.selected_marker;

    $scope.selected_search_place;

    //contain first place
    $scope.selected_place;

    $scope.selected_des;
    //allow search for path to agency
    $scope.is_path = false;

    $scope.is_track = false;

    //store current location
    $scope.my_location;
    //store location marker
    $scope.location_marker;
    //show content of each marker
    $scope.info_window;

    //Direction Service
    $scope.directionsService;
    $scope.directionsDisplay;

    $scope.Timer = null;

    //Timer start function.
    $scope.StartTimer = function () {

        //Initialize the Timer to run every 15000 milliseconds i.e. one second.
        $scope.Timer = $interval(function () {
            console.log("refresh");
            if ($scope.is_track) {
                $scope.directionsDisplay.setOptions({ preserveViewport: true });
                $scope.getCurrentLocationAndShowWay();
            }

        }, 15000);

    };

    $scope.StartBlinkLocation = function () {
        var current_location_marker = true;
        $scope.LocationBlinkTimer = $interval(function () {

            if ($scope.location_marker) {
                $scope.location_marker.setVisible(!current_location_marker);
                current_location_marker = !current_location_marker;
            }

        }, 400);
    }
    $scope.StartBlinkLocation();

    //Timer stop function.
    $scope.StopTimer = function () {

        //Cancel the Timer.
        if (angular.isDefined($scope.Timer)) {
            $interval.cancel($scope.Timer);
        }
    };

    $scope.isPath = function () {
        return $scope.is_path;
    }

    $scope.OpenFindPathUI = function () {
        $scope.is_path = true;
        $scope.is_track = true;

    }

    $scope.OpenFindPlaceUI = function () {
        $scope.is_path = false;
        $scope.is_track = false;
        $scope.StopTimer();
        TurnMarker(true);
        $scope.directionsDisplay.set('directions', null);
    }

    $scope.SwitchPlace = function(){
        var tmp = $scope.selected_place;
        $scope.selected_place = $scope.selected_des;
        $scope.selected_des = tmp;

        tmp = $('#first-place-path').val();
        $('#first-place-path').val( $('#second-place-path').val() );
        $('#second-place-path').val(tmp);
        $scope.calculateAndDisplayRoute();
    }
    //get agency location with specific id
    $scope.getAgencyLocation = function (id) {
        var locationLat = $scope.agencyLocation[id].location.latitude;
        var locationLng = $scope.agencyLocation[id].location.longtitude;
        return new google.maps.LatLng(locationLat, locationLng);
    }


    //get selected agency (destination)
    $scope.getSelectedAgencyLocation = function () {
        if ($scope.selected_des == -1) {
            return $scope.my_location;
        }
        else
            return $scope.getAgencyLocation($scope.selected_des);
    }


    //get selected origin in find path
    $scope.getSelectedOriginLocation = function () {
        if ($scope.selected_place == -1) {
            return $scope.my_location;
        }
        else
            return $scope.getAgencyLocation($scope.selected_place);
    }


    //change the center of the map
    $scope.ChangeCenter = function (id) {
        if (id != -1) {

            google.maps.event.trigger($scope.markers[id], 'click');
            //get lat and lng

            var locationLat = $scope.agencyLocation[id].location.latitude;
            var locationLng = $scope.agencyLocation[id].location.longtitude;

            $scope.setCenterMap("", new google.maps.LatLng(locationLat, locationLng));
        }
        else {
            $scope.setCenterMap("", $scope.my_location);
        }
    }

    $scope.ChangeCenterOnCurrentPlace = function () {
        $scope.ChangeCenter($scope.selected_search_place);
    }
    //show marker
    $scope.showMarker = function () {

        var image = {
            url: 'img/Diff-icon.png',
            
        };

        // for all location of agency, put  a marker on it
        for (index = 0; index < $scope.agencyLocation.length; ++index) {
            // get latitude
            var locationLat = $scope.agencyLocation[index].location.latitude;
            //get longtitude
            var locationLng = $scope.agencyLocation[index].location.longtitude;
            //get title
            var title = $scope.agencyLocation[index].title;

            //push a marker to search box
            //+1 for index because the autocomplete Jquery does not receive value 0
            $scope.places.push({ "value": index + 1, "label": title });
            var brand = $scope.agencyLocation[index].brand;
            switch ($scope.agencyLocation[index].company) {
                case 0:
                    if (brand)
                        switch (brand[0]) {
                            case "AC":
                                image.url = 'img/ac-anco.png';
                                break;

                            case "AM":
                                image.url = 'img/ac-a&m.png';
                                break;

                            case "GN":
                                image.url = 'img/ac-guinniess.png';
                                break;
                               
                        }
                    else
                        image.url = 'img/ac.png';

                    priority = 100;
                    break;
                case 1:
                    image.url = 'img/pc.png';
                    priority = 100;
                    break;
                case 2:
                    image.url = 'img/other.png';
                    priority = 10;
                    break;
                 
            }
            // put a marker on that location
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(locationLat, locationLng),
                map: $scope.map,
                icon: image,
                title: title,
                zIndex: priority,
            });

            //store the marker in array
            $scope.markers[index] = marker;

            var agency = $scope.agencyLocation[index];

            //construct the interface code for info window
            var contentString = '<div class="info-window">' + '<h3><b>' + agency.title + '</b></h3>' +
                                '<div >';

            if (agency.code)
                contentString = contentString + '<p class = "info-text-style"> <b>Mã đại lý:</b>  ' + agency.code + '</p>';
            else
                contentString = contentString + '<p class = "info-text-style"> <b>Mã đại lý:</b>  ' + 'Không có' + '</p>';
            if (agency.address)
                contentString = contentString + '<p class = "info-text-style"> <b>Địa chỉ:</b>  ' + agency.address + '</p>' + '</div>';
            else
                contentString = contentString + '<p class = "info-text-style"> <b>Địa chỉ:</b>  ' + 'Không Có' + '</p>' + '</div>';

            contentString = contentString + '<table style="width:100%" ><tr> <td><button class = "info-text-style btn btn-default col-sm-6 col-xs-6" style ="width:95%" ng-click="ShowWayTo()"> Chỉ đường</a>' + '</td></button>';
            contentString = contentString + '<td><button class = "info-text-style btn btn-default" style ="width:95%" ng-click="ShowInfoDealer()"> Thông Tin </a>' + '</button></td></tr></table>';
           

            //compile the HTML code for angular js binding
            var compiled = $compile(contentString)($scope);


            google.maps.event.addListener(marker, 'click', (function (marker, index, compiled) {
                return function () {


                    $scope.selected_marker = index;

                    $scope.info_window.setContent(compiled[0]);

                    $scope.info_window.open($scope.map, marker);
                }
            })(marker, index, compiled));

        }
    }
    $scope.OpenSetting = function () {
        $state.go("tabs.agency-filter", {}, { reload: true });
    }
    $scope.ShowInfoDealer = function () {
        
        var company = $scope.agencyLocation[$scope.selected_marker].company;
        var dealer = $scope.agencyLocation[$scope.selected_marker].id;
        var buy = 'all';
        AgencyDealerCache.CacheCompany(company);
        AgencyDealerCache.CacheDealer(dealer);
        AgencyDealerCache.CacheBuy(buy);

        $state.go("tabs.agency-dealer-info", {}, { reload: true });
    }
    
    function SetPlaceName(box, id) {
        if (id != -1) {


            $(box).val($scope.places[id].label);

        }
        else {


            $(box).val("Vị trí hiện tại");

        }

    }


    $scope.ShowWayTo = function () {

        $scope.StartTimer();
        //Open find path ui
        $scope.OpenFindPathUI();
        //change destination
        $scope.selected_des = $scope.selected_marker;

        $scope.directionsDisplay.setOptions({ preserveViewport: false });

        SetPlaceName("#second-place-path", $scope.selected_marker);
        //show the way from current location to agency

        $scope.selected_place = -1;
        SetPlaceName('#first-place-path', $scope.selected_place);

        $scope.getCurrentLocationAndShowWay();

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
                    if (typeof (center) === 'undefined' || !center)
                        $scope.map.setCenter(results[0].geometry.location);
                    else
                        $scope.map.setCenter(center);

                    $scope.map.setZoom($scope.map.getZoom() + 1);
                }

                else {
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
        if (document.getElementById("show-map").clientHeight === 0) {
            document.getElementById("show-map").style.height = (document.documentElement.clientHeight - 65) + 'px';
            document.getElementById("show-map").style.paddingTop = "65px";
        }
        //init search box
        $scope.AttachSearchUI();


        //$user_info = ShowReportSurveyAPI.GetUserInfo();

        //if ($user_info.role == "NSM")
            //set the center of map
            //set to the center of Vietnam constant point like below
        //    $scope.setCenterMap('Viet Nam', new google.maps.LatLng(15.42525, 106.76514));
        //else if ($user_info.role == "RSM")
         //   $scope.setCenterMap($user_info.provinces[0].name);
        //else
         //   $scope.setCenterMap($user_info.provinces[0].name);
        $scope.setCenterMap('Viet Nam', new google.maps.LatLng(15.42525, 106.76514));

    };


    $scope.AttachSearchUI = function () {
        var map = $scope.map;
        // Create the search box and link it to the UI element.
        var findPath = document.getElementById('find-path-agency');
        var searchPlace = document.getElementById('search-agency');

        map.controls[google.maps.ControlPosition.TOP_LEFT].push(findPath);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchPlace);
        //add find my location button to google map
        addYourLocationButton(map);
    }

    //return a new search content
    $scope.createSearchContent = function () {
        return {
            source: $scope.places,
            autoFocus: true,
            minLength: 1,
            focus: function (event, ui) {
                $scope.selected_search_place = ui.item.value - 1;
                return false;
            },

            select: function (event, ui) {
                $("#first-place").val(ui.item.label);

                //This jquery does not receive value zero
                $scope.selected_search_place = ui.item.value - 1;
                $scope.ChangeCenter($scope.selected_search_place);
                return false;
            },
            response: function (event, ui) {
                //if (ui.content.length === 0) {
                //    $scope.selected_place = null;
                //}
            }
        };
    }
    $scope.initSearchBox = function () {
        //create new search content
        var searchContent = $scope.createSearchContent();
        $("#first-place").autocomplete(searchContent);

        //contain destination place
        searchContent = $scope.createSearchContent();
        searchContent.focus = function (event, ui) {
            $scope.selected_des = ui.item.value - 1;
            return false;
        }
        searchContent.select = function (event, ui) {
            $("#second-place-path").val(ui.item.label);
            $scope.selected_des = ui.item.value - 1;
            //$scope.ChangeCenter($scope.selected_des);
            return false;
        }
        $("#second-place-path").autocomplete(searchContent);

        //contain origin place
        //create new search content
        searchContent = $scope.createSearchContent();
        searchContent.focus = function (event, ui) {
            $scope.selected_place = ui.item.value - 1;
            return false;
        }
        searchContent.select = function (event, ui) {
            $("#first-place-path").val(ui.item.label);

            //This jquery does not receive value zero
            $scope.selected_place = ui.item.value - 1;
            //$scope.ChangeCenter($scope.selected_place);
            return false;
        }
        $("#first-place-path").autocomplete(searchContent);

    }

    function TurnMarker(mode) {
        if ($scope.is_path) {
            for (var index = 0; index < $scope.markers.length; ++index)
                if (index != $scope.selected_place && index != $scope.selected_des)
                    $scope.markers[index].setVisible(mode);
                else
                    $scope.markers[index].setVisible(!mode);

        }
        else
            for (var index = 0; index < $scope.markers.length; ++index)
                $scope.markers[index].setVisible(mode);
    }
    $scope.FindRoute = function(){
        $scope.StopTimer();
        $scope.directionsDisplay.setOptions({ preserveViewport: false});
        $scope.calculateAndDisplayRoute();
    }

    $scope.calculateAndDisplayRoute = function () {

        //turn off all marker

        TurnMarker(false);

        var directionsService = $scope.directionsService;
        var directionsDisplay = $scope.directionsDisplay;

        directionsDisplay.setOptions({ suppressMarkers: true });

        directionsService.route({
            origin: $scope.getSelectedOriginLocation(),
            destination: $scope.getSelectedAgencyLocation(),
            provideRouteAlternatives: false,
            travelMode: google.maps.TravelMode.DRIVING,
            drivingOptions: {
                departureTime: new Date(/* now, or future date */),
                trafficModel: google.maps.TrafficModel.PESSIMISTIC
            },

        }, function (response, status) {
            if (status === google.maps.DirectionsStatus.OK) {

                directionsDisplay.setDirections(response);

            } else {
                alert('Directions request failed due to ' + status);
            }
        });
    }


    function setPropertiesMyLocationMarker(latt, long) {
        var latlng = new google.maps.LatLng(latt, long);
        $scope.my_location = latlng;

        // if already has a marker, just change its location
        if ($scope.location_marker) {

            $scope.location_marker.setPosition(latlng);

        }
            //else create new marker
        else {

            var image = {
                url: 'img/current_location.png',
            };

            $scope.location_marker = new google.maps.Marker({
                position: latlng,
                map: $scope.map,
                icon: image,
                title: 'Vị trí hiện tại',
                zIndex: 99999999
            });

            marker = $scope.location_marker;
            google.maps.event.addListener(marker, 'click', (function (marker) {
                return function () {
                    $scope.info_window.setContent('Vị trí hiện tại');

                    $scope.info_window.open($scope.map, marker);
                }
            })(marker));

        }


        
    }
    $scope.getCurrentLocationAndShowWay = function () {

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        function success(position) {
            var latt = position.coords.latitude;
            var long = position.coords.longitude;

            setPropertiesMyLocationMarker(latt, long);

            $scope.calculateAndDisplayRoute();

        };

        function error() {
            alert("Unable to retrieve your location");
        };

        navigator.geolocation.getCurrentPosition(success, error);
    }


    function addYourLocationButton(map) {
        var controlDiv = document.createElement('div');

        var firstChild = document.createElement('button');
        firstChild.id = "button-my-location";
        firstChild.style.backgroundColor = '#fff';
        firstChild.style.border = 'none';
        firstChild.style.outline = 'none';
        firstChild.style.width = '28px';
        firstChild.style.height = '28px';
        firstChild.style.borderRadius = '2px';
        firstChild.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
        firstChild.style.cursor = 'pointer';
        firstChild.style.marginRight = '10px';
        firstChild.style.padding = '0';
        firstChild.title = 'Your Location';
        controlDiv.appendChild(firstChild);

        var secondChild = document.createElement('div');
        secondChild.style.margin = '5px';
        secondChild.style.width = '18px';
        secondChild.style.height = '18px';
        secondChild.style.backgroundImage = 'url(img/mylocation.png)';
        secondChild.style.backgroundSize = '180px 18px';
        secondChild.style.backgroundPosition = '0 0';
        secondChild.style.backgroundRepeat = 'no-repeat';
        firstChild.appendChild(secondChild);

        google.maps.event.addListener(map, 'center_changed', function () {
            secondChild.style['background-position'] = '0 0';
        });

        firstChild.addEventListener('click', function () {
            var imgX = '0',
                animationInterval = setInterval(function () {
                    imgX = imgX === '-18' ? '0' : '-18';
                    secondChild.style['background-position'] = imgX + 'px 0';
                }, 500);

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    
                    setPropertiesMyLocationMarker(position.coords.latitude, position.coords.longitude);

                    $scope.map.setCenter($scope.my_location);

                    map.setZoom(14);
                    clearInterval(animationInterval);
                    secondChild.style['background-position'] = '-144px 0';

                    if ($scope.is_path) {
                        $scope.selected_place = -1;
                        SetPlaceName('#first-place-path', $scope.selected_place);
                    }
                    else {
                        $scope.selected_search_place = -1;
                        SetPlaceName('#first-place', $scope.selected_search_place);
                    }
                });
            } else {
                clearInterval(animationInterval);
                secondChild.style['background-position'] = '0 0';
            }
        });

        controlDiv.index = 1;
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controlDiv);
    }



    
    $scope.filter_option = AgencyFilterCache.GetSelectedOption();
    
    ShowReportSurveyAPI.GetAgencyLocation($scope.filter_option).then(function (response) {
        $scope.agencyLocation = response;

        //show Marker
        $scope.showMarker();
        $scope.closeProgress();
    });

    angular.element(document).ready(function () {
        setTimeout(function () {
            $scope.closeProgress();
        }, 10000);

        $scope.initMap();
        $scope.initSearchBox();

        //init direction service
        $scope.directionsService = new google.maps.DirectionsService;
        $scope.directionsDisplay = new google.maps.DirectionsRenderer;
        $scope.directionsDisplay.setMap($scope.map);

        $scope.info_window = new google.maps.InfoWindow({
            content: "",
            
        });

        
    });

});