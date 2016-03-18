surveyReportApp.controller('ReportSurveyOptionController'
    , function ($scope, $rootScope, $state, AuthService, USERS, ShowReportSurveyAPI, ReportSurveyOptionCache) {
        // Array data to show to users
        $scope.products;
        $scope.dealers;
        $scope.regions;
        $scope.provinces;
        $scope.rural_districts;
        $scope.rural_communes;

        //selected location (models)
        $scope.selected_option;

        // check if we should disable this
        $scope.userData;

        //check true to lock
        $scope.lock = {
            company: false,
            region: true,
            province: true,
            district: true,
            commune: true,
        };

        function validate() {
            if(!$scope.selected_option.company.anco && !$scope.selected_option.company.conco){
                alert("Vui lòng chọn công ty.");
                return false;
            }

            if (!$scope.selected_option.dealer.direct && !$scope.selected_option.dealer.indirect) {
                alert("Vui lòng chọn loại đại lý.")
                return false;
            }
            return true;
        }

        function lockFrom(target) {
            switch (target) {
                case 'region':
                    $scope.selected_option.province = { id: 'all', name: "Tất Cả" };
                    $scope.provinces = null;
                    $scope.lock.province = true;
                case 'province':
                    $scope.selected_option.rural_district = { id: 'all', name: "Tất Cả" };
                    $scope.rural_districts = null;
                    $scope.lock.district = true;
                case 'district':
                    $scope.selected_option.rural_commune = { id: 'all', name: "Tất Cả" };
                    $scope.rural_communes = null;
                    $scope.lock.commune = true;
            }
        }

        function loadLock() {
            // unlock if selected_option exist
            if ($scope.selected_option.region) {
                $scope.lock.region = false;

                if ($scope.selected_option.province && $scope.selected_option.region.id !== 'all') {
                    $scope.lock.province = false;

                    if ($scope.selected_option.rural_district && $scope.selected_option.province.id !== 'all') {
                        $scope.lock.district = false;

                        if ($scope.selected_option.rural_commune && $scope.selected_option.rural_district.id !== 'all')
                            $scope.lock.commune = false;
                    }
                }
            }

        }

        //Update data
        $scope.UpdateCompany = function () {
            lockFrom('region');
            if ($scope.selected_option.company.anco || $scope.selected_option.company.conco)
                if ($scope.selected_option.region.id !== 'all')
                    $scope.UpdateProvince();
        }

        //Update product based on choosing company
        $scope.UpdateProduct = function () {
            $scope.products = ShowReportSurveyAPI.GetProduct();
        }

        // update the region
        $scope.UpdateRegion = function () {
            ShowReportSurveyAPI.GetRegion().then(function (response) {
                $scope.regions = response;
                $scope.lock.region = false;
            });                       
        }

        //Update the province base on choosing region
        $scope.UpdateProvince = function () {
            if ($scope.selected_option.region.id !== 'all') {
                if (!$scope.selected_option.company.anco && !$scope.selected_option.company.conco) {
                    alert('Vui lòng chọn công ty.');
                    return;
                }
                ShowReportSurveyAPI.GetProvince($scope.selected_option.region.id
                                                                    , $scope.selected_option.company.GetCompanyName()).then(function (response) {
                    $scope.provinces = response;
                    $scope.lock.province = false;
                });
                
            } else {
                lockFrom('region');
            }
        };

        //Update district base on choosing Province
        $scope.UpdateRuralDistricts = function () {
            if ($scope.selected_option.province.id !== 'all') {
                ShowReportSurveyAPI.GetRuralDistrict($scope.selected_option.province.id).then(function (response) {
                    $scope.rural_districts = response;
                    $scope.lock.district = false;
                });
                
            } else {
                lockFrom('province');
            }
        };
        
        //Update Communes base on choosing District
        $scope.UpdateRuralCommunes = function () {
            if ($scope.selected_option.rural_district.id !== 'all') {
                ShowReportSurveyAPI.GetRuralCommunes($scope.selected_option.rural_district.id).then(function (response) {
                    $scope.rural_communes = response;
                    $scope.lock.commune = false;
                });
            } else {
                lockFrom('district');
            }
        };

        //clicking 
        ///click view report button
        $scope.viewReport = function () {
            if (validate()) {
                //Cache the data of this form
                $scope.CacheData();
                $state.go("tabs.report-survey-area", {}, { reload: true });
            }
        };

        //Init data
        //cache the data
        $scope.CacheData = function () {
            ReportSurveyOptionCache.CacheProduct($scope.products);
            ReportSurveyOptionCache.CacheDealer($scope.dealers);
            ReportSurveyOptionCache.CacheRegion($scope.regions);
            ReportSurveyOptionCache.CacheProvince($scope.provinces);
            ReportSurveyOptionCache.CacheDistrict($scope.rural_districts);
            ReportSurveyOptionCache.CacheCommune($scope.rural_communes);
            ReportSurveyOptionCache.CacheSelectedOption($scope.selected_option);
        }

        //init the data forr first time 
        $scope.init = function () {
            $scope.userData = $rootScope.user_info;

            // restore cache
            $scope.products = ReportSurveyOptionCache.GetProductList();
            $scope.dealers = ReportSurveyOptionCache.GetDealerList();
            $scope.regions = ReportSurveyOptionCache.GetRegionList();
            $scope.provinces = ReportSurveyOptionCache.GetProvinceList();
            $scope.rural_districts = ReportSurveyOptionCache.GetDistrictList();
            $scope.rural_communes = ReportSurveyOptionCache.GetCommuneList();
            $scope.selected_option = ReportSurveyOptionCache.GetSelectedOption();

            loadLock();
            
            // update option list
            $scope.UpdateProduct();
            
            switch ($scope.userData.role) {
                case USERS.SUPERVISOR:
                    if ($scope.selected_option.province.id === 'all')
                        $scope.selected_option.province = $scope.userData.provinces[0];
                case USERS.ASM:
                    if ($scope.selected_option.region.id === 'all')
                        $scope.selected_option.region = $scope.userData.regions[0];
                case USERS.RSM:
                    $scope.lock.company = true;
                    break;
                case USERS.NSM:
            }
            
            // update region
            $scope.UpdateRegion();
            if($scope.selected_option.region.id !== 'all')
                $scope.UpdateProvince();

            if ($scope.selected_option.province.id !== 'all')
                $scope.UpdateRuralDistricts();

            if ($scope.selected_option.rural_district.id !== 'all')
                $scope.UpdateRuralCommunes();

        };


        //when init the controller
        $scope.init();

    });