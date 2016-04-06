'use strict';

surveyReportApp.controller('SurveyDealersController',
        ['$scope', '$state', 'SurveyCache', 'SurveyDealersCache', 'SurveyListDealers',
        function($scope, $state, SurveyCache, SurveyDealersCache, SurveyListDealers) {

    // Declare variables
    $scope.dealers;
    $scope.offset;
    $scope.isContinue;
    $scope.region;
    $scope.province;
    $scope.district;
    $scope.company;
    $scope.buy;
    $scope.total;
    $scope.isLoading = false;

    // Initial
    initialize();

    $scope.showDealer = function(dealer) {
        cacheData(dealer);

        $state.go("tabs.survey-dealer-info", {}, { reload: false });
    };

    $scope.loadMore = function() {
        if (!$scope.isLoading && $scope.isContinue && $scope.dealers !== undefined && $scope.dealers.length < $scope.total) {
            $scope.isLoading = true;
            $scope.offset++;

            var params = {
                region: $scope.region,
                province: $scope.province,
                district: $scope.district,
                buy: $scope.buy,
                company: $scope.company.getCompany(),
                offset: $scope.offset
            };

            SurveyListDealers.getListOfDealers(params).then(function (res) {
                if (res) {
                    res.forEach(function(dealer) {
                        $scope.dealers.push(dealer);
                    });

                    $scope.isLoading = false;

                    if (res.length === 0) {
                        $scope.isContinue = false;
                    }
                }
            }, function(err) {
                // IF request error: roll back param
                $scope.isLoading = false;
                $scope.offset--;
            });
        }
    };

    $scope.getCompany = function() {
        if ($scope.company.anco) {
            if ($scope.company.conco) {
                return 'Tất cả'
            } else {
                return 'ANCO';
            }
        } else if ($scope.company.conco) {
            return 'CON CÒ';
        }

        return 'Không xác định';
    };

    $scope.getBuy = function() {
        if ('all' === $scope.buy)
            return 'Tất cả';
        if (1 == $scope.buy)
            return 'Trực tiếp';
        return 'Gián tiếp';
    };

    // Define private functions
    function initialize() {

        $scope.offset = 0;
        $scope.isContinue = true;

        var isCached = SurveyDealersCache.isCached();

        loadCache();

        if (isCached) {
            $scope.total = SurveyDealersCache.getNumberOfDealers();
            $scope.dealers = SurveyDealersCache.getDealers();
        } else {
            var params = {
                region: $scope.region,
                province: $scope.province,
                district: $scope.district,
                buy: $scope.buy,
                company: $scope.company.getCompany(),
                offset: $scope.offset
            };

            var total = false;

            SurveyListDealers.getListOfDealers(params).then(function(res) {
                $scope.dealers = res;
                SurveyDealersCache.setDealers($scope.dealers);
                SurveyDealersCache.cache($scope.dealers && total);
            });

            $scope.total = 'Đang cập nhật';

            SurveyListDealers.getNumberOfDealers(params).then(function (res) {
                total = true;
                $scope.total = res[0].Total;
                SurveyDealersCache.setNumberOfDealers($scope.total);
                SurveyDealersCache.cache($scope.dealers && total);
            });
        }
    }

    function loadCache() {
        $scope.company = SurveyCache.getCompany();
        $scope.buy = SurveyCache.getBuy();
        $scope.region = SurveyCache.getRegion();
        $scope.province = SurveyCache.getProvince();
        $scope.district = SurveyCache.getDistrict();
    }

    function cacheData(dealer) {
        SurveyCache.setDealer(dealer);
        SurveyDealersCache.setNumberOfDealers($scope.total);
        SurveyDealersCache.setDealers($scope.dealers);
        SurveyDealersCache.cache(true);
    }

}]);
