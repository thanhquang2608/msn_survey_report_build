surveyReportApp.controller('ReportSurveyAreaController', function ($scope, $rootScope, $state, $window, AuthService, COMPANIES, REGIONS, ReportSurveyOptionCache, ShowReportSurveyAPI) {

    $scope.title = "";
    $scope.data;
    $scope.first_row;
    $scope.first_column;
    $scope.isLoading = true;
    $scope.viewType = 1;

    $scope.dataViewType2 = {
        columns : [],
        rows : []
    }

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

            // Tạm thời xong thì tính luôn, nếu chậm thì có thể bỏ, khi nào
            // người dùng nhấn button thì mới tính
            if (!option.ward) {
                generateDataViewType2($scope.first_row, $scope.data);
            }

            console.log($scope.data);
            console.log($scope.dataViewType2);
        });
    };

    function generateDataViewType2(columns, data) {
        if (!columns || !data) return;

        // Tạo cột
        // Bắt đầu từ 1 để bỏ dòng tổng
        for (var i = 1, len = data.length; i < len; i++) {
            var row = data[i];
            var col = {
                id : row.id,
                name : row.name
            }

            $scope.dataViewType2.columns.push(col);
        };

        // Tạo dòng
        for (var i = 0, len = columns.length; i < len; i++) {
            var region = columns[i];
            var row = {
                id : region.id,
                name : region.name,
                cols : []
            }

            $scope.dataViewType2.rows.push(row);
        };

        for (var i = 1, len = data.length; i < len; i++) {
            var row = data[i];

            for (var j = 0, len1 = row.data.length; j < len1; j++) {
                var d = row.data[j];

                // Tính phần trăm
                var yieldTotal = data[i].data[0].yield;
                var percent = d.yield == 0 ? 0 : (d.yield / yieldTotal) * 100;
                percent = percent.toFixed(2) + '%';

                var col = {
                    id : row.id,
                    percentage : percent,
                    number : $rootScope.numberWithCommas(d.yield)
                }

                $scope.dataViewType2.rows[j].cols.push(col);
            };
        };
    }

    $scope.switchViewType = function () {
        $scope.viewType = ($scope.viewType === 1) ? 2 : 1;
    }

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