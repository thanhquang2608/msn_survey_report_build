'use strict';

surveyReportApp.controller('SurveyController',
        ['$scope', '$rootScope', '$state', 'ShowReportSurveyAPI', 'SurveyCache', 'SurveyDealersCache', 'SurveyListDealers', 'USERS',
        function ($scope, $rootScope, $state, ShowReportSurveyAPI, SurveyCache, SurveyDealersCache, SurveyListDealers, USERS) {

            // Declare variables
            $scope.regions;
            $scope.provinces;
            $scope.districts;
            $scope.region;
            $scope.province;
            $scope.district;
            $scope.company;
            $scope.buy;
            $scope.lock;
            $scope.backupData;
            $scope.dealers;
            $scope.isLoading = false;


            $scope.dealerCache = function () {
                SurveyDealersCache.cache(false);
            }

            // Define scope's functions
            $scope.updateProvince = function () {
                if (!SurveyCache.isCached()) {
                    resetProvince();
                    resetDistrict();
                } else if ($scope.region !== $scope.backupData.region) {
                    resetProvince();
                    resetDistrict();
                }

                $scope.lock.district = true;

                if (!$scope.company.getCompany()) {
                    resetProvince();
                    $scope.lock.province = true;
                    return alert('Vui lòng chọn công ty');
                }

                if ($scope.region && 'all' !== $scope.region.id) {
                    ShowReportSurveyAPI.GetProvince($scope.region.id, $scope.company.getCompany()).then(function (response) {
                        $scope.provinces = response;
                    });

                    $scope.lock.province = false;
                } else {
                    resetProvince();
                    $scope.lock.province = true;
                }
            };

            $scope.updateDistrict = function () {
                if (!SurveyCache.isCached()) {
                    resetDistrict();
                } else if ($scope.province !== $scope.backupData.province)
                    resetDistrict();

                if ($scope.province && 'all' !== $scope.province.id) {
                    ShowReportSurveyAPI.GetRuralDistrict($scope.province.id).then(function (response) {
                        $scope.districts = response;
                    });

                    $scope.lock.district = false;
                } else {
                    resetDistrict();
                    $scope.lock.district = true;
                }
            };

            $scope.updateCompany = function () {
                if ($scope.region) {
                    resetRegion();
                    resetProvince();
                    resetDistrict();

                    $scope.lock.district = true;
                    $scope.lock.province = true;
                }
            };

            $scope.showSurvey = function () {
                if (!validate())
                    return;

                cacheData();

                var params = {
                    region: $scope.region,
                    province: $scope.province,
                    district: $scope.district,
                    buy: $scope.buy,
                    company: $scope.company.getCompany()
                };

                $scope.isLoading = true;

                $state.go("tabs.survey-dealers", {}, { reload: true });
            };

            // Define private functions
            function initialize() {
                ShowReportSurveyAPI.GetRegion().then(function (response) {
                    $scope.regions = response;
                });

                
                loadCache();

                if (!SurveyCache.isCached()) {
                    $scope.buy = 'all';
                    resetRegion();
                    resetProvince();
                    resetDistrict();

                    $scope.lock = {
                        region: false,
                        province: true,
                        district: true,
                        company: false
                    };
                }   

                var user_data = $rootScope.user_info;

                switch (user_data.role) {
                    case USERS.SUPERVISOR:
                        $scope.province = user_data.provinces[0];
                    case USERS.ASM:
                        $scope.region = user_data.regions[0];
                    case USERS.RSM:
                        $scope.lock.company = true;
                        break;
                    case USERS.NSM:
                }                
                
                $scope.updateProvince();
                if ($scope.province.id !== 'all')
                    $scope.updateDistrict();
            }

            function loadCache() {
                $scope.company = SurveyCache.getCompany();
                if(SurveyCache.isCached()){
                    $scope.buy = SurveyCache.getBuy();
                    $scope.region = SurveyCache.getRegion();
                    $scope.province = SurveyCache.getProvince();
                    $scope.district = SurveyCache.getDistrict();
                    $scope.regions = SurveyCache.getRegions();
                    $scope.provinces = SurveyCache.getProvinces();
                    $scope.districts = SurveyCache.getDistricts();
                    $scope.lock = SurveyCache.getLock();

                    $scope.backupData = {
                        company: SurveyCache.getCompany(),
                        buy: SurveyCache.getBuy(),
                        region: SurveyCache.getRegion(),
                        province: SurveyCache.getProvince(),
                        district: SurveyCache.getDistrict()
                    }
                }

            }

            function cacheData() {
                SurveyCache.setCompany($scope.company);
                SurveyCache.setBuy($scope.buy);
                SurveyCache.setRegion($scope.region);
                SurveyCache.setRegions($scope.regions);
                SurveyCache.setProvince($scope.province);
                SurveyCache.setProvinces($scope.provinces);
                SurveyCache.setDistrict($scope.district);
                SurveyCache.setDistricts($scope.districts);
                SurveyCache.cache();
                SurveyCache.setLock($scope.lock);
            }

            function validate() {
                if (!$scope.company.getCompany()) {
                    alert('Vui lòng chọn công ty');
                    return false;
                }

                if (!$scope.region) {
                    alert('Vui lòng chọn vùng miền');
                    return false;
                }



                return true;
            }

            function resetRegion() {
                if ($scope.regions)
                    $scope.region = $scope.regions[0];
            }

            function resetProvince() {
                $scope.province = {
                    id: 'all',
                    name: 'Tất cả'
                };
            }

            function resetDistrict() {
                $scope.district = {
                    id: 'all',
                    name: 'Tất cả'
                };
            }

            // Initial
            initialize();

        }]);