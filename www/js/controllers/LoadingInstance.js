surveyReportApp.controller('LoadingInstance', function ($scope, $modalInstance) {
    $scope.ok = function () {
        $modalInstance.close($scope.reason);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});