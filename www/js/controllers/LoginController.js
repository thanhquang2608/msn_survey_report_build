surveyReportApp.controller('LoginController', function ($scope, $rootScope, $state, $modal, $log, AuthService, REGIONS, USERS) {
    $scope.regions = REGIONS;

    $scope.users = USERS;

    // AC1003 @p5Zq8@
    // 8 PC1738 @p2Oh6@
    // PC1979 @p7Xb1@
    $scope.user = {};
    // $scope.user.region = 104;
    // $scope.user.AC_PC = 0;

    $scope.data = {};

    // Nếu đã đăng nhập rồi thì chuyển sang trang home
    if (AuthService.isAuthenticated()) {
        $state.go("tabs.report-survey-menu");
    }

    $scope.login = function (userdata) {
        $scope.openProgress();
        AuthService.login($scope.user).then(
            function (response) {
                $scope.user.password = null;
                console.log("success");
                $scope.closeProgress();
                $state.go("tabs.report-survey-menu", {}, { reload: true });
                console.log("");
                
            },

            function (err) {
                $scope.closeProgress();
                $rootScope.processRequestError(err);
                console.log("error")
         });
    };

    $scope.open = function (msg) {

        $scope.modal = $modal.open({
            animation: true,
            templateUrl: 'errorModalContent.html',
            controller: 'ModalInstanceCtrl',
            size: 'sm',
            resolve: {
                message: function () {
                    return msg;
                },
                mode: function () {
                    return 0;
                }
            }
        });

        $scope.modal.result.then(function (from) {

        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
            //alert('Modal dismissed at: ' + new Date());
        });
    };
    $rootScope.processRequestError = function (response) {
        if (response.status == 403) {
            $scope.open("Bạn không có quyền thực hiện thao tác này!");
        }
        else if (response.status != 0 && response.status != 408) {
            console.log(response);
            var msg = "Lỗi trong quá trình xử lý";
            if (response.data == null || response.data.message == null) {
                msg = "Thao tác thất bại!";
            }
            else
                msg = response.data.message;
            $scope.open(msg);
        }
        else {
            $scope.open("Kết nối thất bại. Kiểm tra lại đường truyền.");
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
        if ($scope.modalProgress)
            $scope.modalProgress.dismiss("ok");
    };
});