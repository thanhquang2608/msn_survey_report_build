surveyReportApp.controller('LoginController', function ($scope, $rootScope, $state, AuthService, REGIONS, USERS) {
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
        AuthService.login($scope.user).then(
            function (response) {
                $scope.user.password = null;
                console.log("success")
                $state.go("tabs.report-survey-menu", {}, { reload: false });
            },

            function (err) {
                alert(err.data.message);
                console.log("error")
         });
    };
});