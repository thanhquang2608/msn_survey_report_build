surveyReportApp.controller('TabController', function ($rootScope, $scope, $state, $modal, $log, AuthService, ShowReportSurveyAPI, AUTH_EVENTS, NETWORK_EVENTS) {
    document.getElementById("home-button").style.visibility = 'visible';
    $scope.setBackVisibility = function (flag) {
        document.getElementById("back-button").style.visibility = flag;
    }

    $scope.backPage = function () {
        window.history.back();
    }

    $scope.changeTabName = function(name){
        document.getElementById("top-title").innerHTML = name;
    }

    $scope.$on('$viewContentLoaded', function () {
        //change the top title name based on the state
        var name = $state.current.name;

        if (name == "tabs.report-survey-menu") {
            $scope.changeTabName("Báo cáo khảo sát");
        }
        else if (name == "tabs.report-survey-option") {
            $scope.changeTabName("Báo cáo");
        }
        else if (name == "tabs.show-region-map") {
            $scope.changeTabName("Vùng chăn nuôi");
        }
        else if (name == "tabs.show-agency-map") {
            $scope.changeTabName("Đại lý vùng chăn nuôi");
        }
        else if ('tabs.survey' === name) {
            $scope.changeTabName('Khảo sát');
        }
        else if ('tabs.survey-dealers' === name) {
            $scope.changeTabName('Khảo sát');
        }
        else if ('tabs.survey-dealer-info' === name) {
            $scope.changeTabName('Khảo sát');
        }
        else if ('tabs.top-dealer-option' === name) {
            $scope.changeTabName('Chăn nuôi trọng điểm');
        }
        else if ('tabs.top-dealer-filter' === name) {
            $scope.changeTabName('Chăn nuôi trọng điểm');
        }
        else if ('tabs.agency-dealer-info' === name){
            $scope.changeTabName('Bản đồ đại lý');
        }
        //change the visibility of Back button
        if (name != "tabs.report-survey-menu") {
            $scope.setBackVisibility('visible');
        }
        else if (name == "tabs.report-survey-menu") {
            $scope.setBackVisibility('hidden');
        }
    });

    //$rootScope.$on('$stateChangeSuccess', function () {
    //    $("html, body").animate({ scrollTop: 0 }, 200);
    //})

    $rootScope.TIME_OUT = 60000;

    $scope.$on(AUTH_EVENTS.notAuthorized, function (event) {
        //var alertPopup = $ionicPopup.alert({
        //    title: 'Unauthorized!',
        //    template: 'You are not allowed to access this resource.'
        //});
        alert('You are not allowed to access this resource.');
    });

    $scope.$on(AUTH_EVENTS.notAuthenticated, function (event) {
        AuthService.logout();
        $state.go('login');
        //var alertPopup = $ionicPopup.alert({
        //    title: 'Session Lost!',
        //    template: 'Sorry, You have to login again.'
        //});
        alert('Sorry, You have to login again.');
    });

    var noInternet = false;
    $scope.$on(NETWORK_EVENTS.nointernet, function (event) {
        //var alertPopup = $ionicPopup.alert({
        //    template: 'Không kết nối được với server'
        //});
        $scope.closeProgress();
        if(!noInternet)
            alert('Không kết nối được với server');
        noInternet = true;
    });

    $scope.$on(NETWORK_EVENTS.timeout, function (event) {
        //var alertPopup = $ionicPopup.alert({
        //    template: 'Kết nối timeout'
        //});
        alert('Kết nối timeout');
    });

    $scope.setCurrentUsername = function (name) {
        $scope.username = name;
    };

    //$scope.$on('$ionicView.beforeEnter', function () {
    //    console.log('enter');
    //    var stateName = $state.current.name;
    //    if (stateName === 'tabs.survey' || stateName === 'tabs.dealers' || stateName === 'tabs.account') {
    //        $rootScope.hideTabs = false;
    //    } else {
    //        $rootScope.hideTabs = true;
    //    }
    //});

    $rootScope.processRequestError = function (response) {
        if (response.status != 0 && response.status != 408) {
            //var alertPopup = $ionicPopup.alert({
            //    title: 'Thất bại!',
            //    template: err.data.message
            //});
            alert(response.data.message);
        }
    }

    $rootScope.$on('uploadImagesFinishDealer', function (event) {
        console.log('uploadImagesFinishDealer');
        $scope.$apply(function () {
            $scope.uploadImageFinish = true;
            DealerService.setUploadImageFinish(true);
        })
    });

    $scope.getUser = function() {
        $scope.user = AuthService.user();
        if (!$scope.user || !$scope.user.RoleId || $scope.user.RoleId == 1) {
            $rootScope.IsSaleRep = true;
        } else {
            $rootScope.IsSaleRep = false;
        }

        if (!$rootScope.$$phase) {
            $rootScope.$apply();
        }
    }

    $scope.openProgress = function () {
        $scope.modalProgress = $modal.open({
            animation: true,
            templateUrl: 'progress.html',
            controller: 'LoadingInstance',
            size: 'sm',
            backdrop: 'static',
            keyboard: false
        });

        setTimeout(function () {
            $scope.closeProgress();
        }, 60000);

        $scope.modalProgress.result.then(function (from) {
            $log.info('Loading finished.1');
        }, function () {
            $log.info('Loading finished.2');
            //alert('Modal dismissed at: ' + new Date());
        });
    };

    $scope.closeProgress = function () {
    if( $scope.modalProgress)
        $scope.modalProgress.dismiss("ok");
    };
   
    $scope.getUser();
});