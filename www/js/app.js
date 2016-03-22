var surveyReportApp = angular.module('AncoSurveyReportApp', [ 'LocalStorageModule', 'ct.ui.router.extras', 'ui.bootstrap', 'infinite-scroll', 'pasvaz.bindonce']);

var appVersion = "1.0.1";
var appOldVersion = undefined;

surveyReportApp.config(['$stateProvider', '$stickyStateProvider', '$urlRouterProvider', '$httpProvider',
    function ($stateProvider, $stickyStateProvider, $urlRouterProvider, $httpProvider) {
        //$stickyStateProvider.enableDebug(true);
        $urlRouterProvider.otherwise("tabs.report-survey-menu");

        $stateProvider
            .state('tabs', {
                url: '/tabs',
                sticky: true,
                templateUrl: 'views/tabs.html',
                controller: "TabController",
            })


            //load view tabs and report-survey-menu together in this state
            .state('tabs.report-survey-menu', {
                url: '/report-survey-menu',
                templateUrl: 'views/report-survey-menu.html',
                controller: "ReportSurveyMenuController"
            })


            //load view tabs and report-survey-option together in this state
            .state('tabs.report-survey-option', {
                url: '/report-survey-option',
                views: {
                    'report-survey-option': {
                        templateUrl: "views/report-survey-option.html",
                        controller: "ReportSurveyOptionController",
                    }
                }
            })
            //choose top dealer option
            .state('tabs.top-dealer-option', {
                url: '/top-dealer-option',
                templateUrl: "views/top-dealer-option.html",
                controller: "TopDealerOptionController",
                    
            })

            //show filter data of top dealer
            .state('tabs.top-dealer-filter', {
                url: '/top-dealer-filter',
                templateUrl: "views/top-dealer-filter.html",
                controller: "TopDealerFilterController"
            })

            //this state to show the report of a area
            .state('tabs.report-survey-area', {
                url: '/report-survey-area',
                templateUrl: 'views/report-survey-area.html',
                controller: "ReportSurveyAreaController"
            })

            //this state to show the agency map
            .state('tabs.show-agency-map', {
                url: '/show-agency-map',
                templateUrl: 'views/show-map.html',
                controller: "ShowAgencyMapController"
            })

            .state('tabs.agency-filter', {
                url: '/agency-filter',
                templateUrl: 'views/agency-filter.html',
                controller: "AgencyFilterController"
            })

            .state('tabs.agency-dealer-info', {
                url: '/agency-dealer-info',
                templateUrl: 'views/survey-dealer-info.html',
                controller: "AgencyDealerInfoController"
            })

            //show the important region map
            .state('tabs.show-region-map', {
                url: '/show-region-map',
                templateUrl: 'views/show-region-map.html',
                controller: "ShowRegionMapController"
            })

            // load view login
            .state('login', {
                url: '/login',
                templateUrl: 'views/login.html',
                controller: 'LoginController'
            })
            
            //--- Begin add function for Survey ---
            .state('tabs.survey', {
                url: '/survey',
                templateUrl: 'views/survey.html',
                controller: "SurveyController"
            })

            .state('tabs.survey-dealers', {
                url: '/survey-dealers',
                templateUrl: 'views/survey-dealers.html',
                controller: "SurveyDealersController"
            })

            .state('tabs.survey-dealer-info', {
                url: '/survey-dealer-info',
                templateUrl: 'views/survey-dealer-info.html',
                controller: "SurveyDealerInfoController"
            })

            // ACCOUNT
            .state('tabs.account', {
                url: "/account",
                cache: false,
                templateUrl: "views/account.html",
                controller: 'AccountController'
            });
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }
        //disable IE ajax request caching
        $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
        // extra
        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
    }]);

surveyReportApp.run(function ($rootScope, $state, AuthService, AUTH_EVENTS, $localstorage, STORAGE_KEYS) {
    var APP_VERSION_KEY = STORAGE_KEYS.appversion_key;
    $rootScope.$state = $state;

    appOldVersion = $localstorage.getObject(APP_VERSION_KEY);

    if (appVersion != appOldVersion) {
        AuthService.logout();
        $localstorage.setObject(APP_VERSION_KEY, appVersion);
    }

    if (!AuthService.isAuthenticated())
        $state.go('login');
    else
        $state.go('tabs.report-survey-menu');

    $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {

        // AuthService.checkVersion(appVersion);
        if (!AuthService.isAuthenticated()) {
            if (next.name !== 'login') {
                event.preventDefault();
                $state.go('login');
            }
        }
    });
});


//var serviceBase = 'http://127.0.0.1:3000/';
//app.constant('ngAuthSettings', {
//    apiServiceBaseUri: serviceBase,
//    clientId: 'ngAuthApp'
//});

//surveyReportApp.config(function ($httpProvider) {
//    //disable IE ajax request caching
//    $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
//    // extra
//    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
//    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
//});

//app.run(['authService', function (authService) {
//    authService.fillAuthData();
//}]);