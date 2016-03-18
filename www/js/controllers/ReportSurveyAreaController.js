surveyReportApp.controller('ReportSurveyAreaController', function ($scope, $rootScope, $state, $window, AuthService, COMPANIES, REGIONS, ReportSurveyOptionCache, ShowReportSurveyAPI) {

    $scope.title = "";
    $scope.data;
    $scope.first_row;
    $scope.first_column;
    $scope.isLoading = true;

    $scope.option = {
        company: null,
        product: null,
        dealer: null, 
        region: null,
        province: null,
        district: null,
        ward: null
    };

    $scope.optionInfo = {
        company: null,
        product: null,
        region: null,
        province: null,
        district: null,
        ward: null
    }

    $scope.changeTitle = function (title) {
        $scope.title = title;
    };
   
    //get Data from server to display
    $scope.getData = function (option) {
        var promise = ShowReportSurveyAPI.GetYieldData(option);
        promise.then(function (response) {
            $scope.first_row = response.first_row;
            $scope.first_column = response.first_column;
            $scope.data = response.data;
            $scope.isLoading = false;
        });
    };

    //init the controller
    $scope.init = function () {
        var selectedOption = ReportSurveyOptionCache.GetSelectedOption();

        // process the selectedOption
        // set company
        if (selectedOption.company.anco && selectedOption.company.conco) {
            $scope.option.company = 'all';
        } else if (selectedOption.company.anco) {
            $scope.option.company = 'anco';
        } else if (selectedOption.company.conco) {
            $scope.option.company = 'conco';
        } else {
            var user_info = ShowReportSurveyAPI.GetUserInfo();
            if (user_info.company) {
                $scope.option.company = 'conco';
            } else {
                $scope.option.company = 'anco';
            }
        }
         
        $scope.option.product = selectedOption.product.id;

        if (selectedOption.dealer.direct && selectedOption.dealer.indirect) {
            $scope.option.dealer = 'all';
        } else if (selectedOption.dealer.direct) {
            $scope.option.dealer = 1;
        } else if (selectedOption.dealer.indirect) {
            $scope.option.dealer = 0;
        }

        if (selectedOption.region) {
            // set region
            $scope.option.region = selectedOption.region.id;
            $scope.optionInfo.region = selectedOption.region.name;
            if (selectedOption.region.id !== 'all') {
                $scope.changeTitle(selectedOption.region);

                if (selectedOption.province && selectedOption.province.id !== 'all') {
                    // set province
                    $scope.option.province = selectedOption.province.id;
                    $scope.changeTitle(selectedOption.province);
                    $scope.optionInfo.province = selectedOption.province.name;

                    if (selectedOption.rural_district && selectedOption.rural_district.id !== 'all') {
                        // set district
                        $scope.option.district = selectedOption.rural_district.id;
                        $scope.changeTitle(selectedOption.rural_district);
                        $scope.optionInfo.district = selectedOption.rural_district.name;

                        if (selectedOption.rural_commune && selectedOption.rural_commune.id !== 'all') {
                            // set ward
                            $scope.option.ward = selectedOption.rural_commune.id;
                            $scope.changeTitle(selectedOption.rural_commune);
                            $scope.optionInfo.ward = selectedOption.rural_commune.name;
                        }
                    }
                }
            }
        }
        $scope.optionInfo.company = $scope.option.company === 'all' ? 'Tất Cả' : $scope.option.company === 'anco' ? 'Anco' : 'Con Cò';
        $scope.optionInfo.product = selectedOption.product.name;
        $scope.optionInfo.dealer = $scope.option.dealer === 'all' ? 'Tất Cả' : $scope.option.dealer ? 'Mua trực tiếp' : 'Mua gián tiếp';

        //get the data from API
        $scope.getData($scope.option);
    }
    $scope.init();
})