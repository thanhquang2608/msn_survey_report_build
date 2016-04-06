surveyReportApp.controller('TopDealerFilterController', function ($scope, $rootScope, $state, $q, AuthService,
                                        $window, ShowReportSurveyAPI, ReportSurveyTopDealerOptionCache, TOPS, PRODUCTS, USERS) {

    $scope.isLoading = true;
    $scope.data;

    $scope.selectedOption = ReportSurveyTopDealerOptionCache.GetSelectedOption();

    $scope.selectedInfo = GetInfo();

    $scope.is_show_dealer_type;

    function GetInfo() {
        var info = {
            company: '',
            top: '',
            level: '',
            area: '',
            product: '',
            brand: '',
            dealer:'',
        };

        var area_type, area_name;
        var selectedOption = $scope.selectedOption;

        if (selectedOption.level.code === 'T') 
            area_type = 'Tỉnh';
            
        else 
            area_type = 'Miền';
        
        info.company = selectedOption.company.GetCompanyViewName();
        info.dealer = selectedOption.dealer.GetDealerViewName();
        info.top = selectedOption.top.id;
        info.level = area_type;
        info.area = selectedOption.area.name;
        info.product = selectedOption.product.name;
        info.brand = selectedOption.brand.name;

        return info;
    }
    

    $scope.init = function () {
        var selectedOption = $scope.selectedOption;
        
        var area_type, area_id;

        if (selectedOption.level.code === 'T')
            area_type = 'province';
        else 
            area_type = 'region';
         
        area_id = selectedOption.area.id;

        dealer_type = selectedOption.dealer.GetDealerName();
        
        if (dealer_type === "all")
            $scope.is_show_dealer_type = true;
        else
            $scope.is_show_dealer_type = false;

        ShowReportSurveyAPI.GetTopDealer(selectedOption.product.id, selectedOption.brand.id,
                                         area_type, area_id, selectedOption.company.GetCompanyName()
                                         , selectedOption.top.id, dealer_type)
            .then(function (response) {
                $scope.data = response;
                $scope.isLoading = false;
            });;

    }


    //when init the controller
    $scope.init();



})