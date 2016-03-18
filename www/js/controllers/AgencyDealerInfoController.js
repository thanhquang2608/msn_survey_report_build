'use strict';

surveyReportApp.controller('AgencyDealerInfoController',
        ['$scope', 'AgencyDealerCache', 'SurveyDealerInfo',
        function ($scope, AgencyDealerCache, SurveyDealerInfo) {

            // Declare variables
            $scope.dealer;
            $scope.buy;
            $scope.company;
            $scope.info;
            $scope.brands;

            $scope.getBrandName = function (brand) {
                return $scope.brands[brand];
            };

            // Initial
            initialize();

            // Define private functions
            function initialize() {
                loadCache();

                var params = {
                    dealer: $scope.dealer,
                    buy: $scope.buy,
                    company: $scope.company
                };

                SurveyDealerInfo.getBrands().then(function (res) {
                    $scope.brands = res;
                });

                SurveyDealerInfo.getDealerInfo(params).then(function (res) {
                    $scope.info = res.response;
                });
            }

            function loadCache() {
                $scope.company = AgencyDealerCache.GetCompany();
                $scope.buy = AgencyDealerCache.GetBuy();
                $scope.dealer = AgencyDealerCache.GetDealer();
            }

        }]);