surveyReportApp.controller('ReportSurveyMenuController', function ($scope, $rootScope, $state, AuthService, ShowReportSurveyAPI, $window, USERS,AgencyFilterCache) {
    // init services
    if(!$rootScope.user_info)
        $scope.openProgress();

    ShowReportSurveyAPI.Init().then(function(){
        $scope.closeProgress();
    });

    function isLoading () {
        $scope.closeProcess();
    };

    $scope.logout = function () {
        AgencyFilterCache.Clear();
        AuthService.logout();
        ShowReportSurveyAPI.ClearUserInfo();
        $state.go('login');
    };

    // On click report button
    $scope.OnClickReport = function () {   
        $state.go("tabs.report-survey-option", {}, { reload: false });
    }

    //on click show agency feature
    $scope.OnClickShowAgencyLocation = function () {
        $state.go("tabs.show-agency-map", {}, { reload: true });
    }

    // on click show region feature
    $scope.OnClickShowSurveyResultByRegion = function () {
        $state.go("tabs.show-region-map");
    }

    // on click Survey
    $scope.OnClickSurvey = function () {
        $state.go("tabs.survey", {}, { reload: true });
    }

    $scope.init = function () {
        $scope.changeHeight();
    }

    $scope.changeHeight = function () {
        var width = angular.element($('.report-survey-menu-button')).width();
        var imgWidth = angular.element($('.half-image')).width();
        angular.element($('.report-survey-menu-button')).height(width);
        angular.element($('.half-image')).height(imgWidth);
    }

    //when orientation change, change width and heigh again
    angular.element($window).bind('orientationchange', function () {
        $scope.changeHeight();
    });

    angular.element($window).ready(function () {
        $scope.init();
    });
});