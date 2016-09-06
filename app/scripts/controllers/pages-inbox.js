'use strict';

/**
 * @ngdoc function
 * @name minovateApp.controller:PageInboxCtrl
 * @description
 * # PageInboxCtrl
 * Controller of the minovateApp
 */
app
  .controller('PageInboxCtrl', function ($scope, $resource) {
    $scope.mails = $resource('scripts/jsons/mails.json').query();

    $scope.selectedAll = false;

    $scope.selectAll = function () {

      if ($scope.selectedAll) {
        $scope.selectedAll = false;
      } else {
        $scope.selectedAll = true;
      }

      angular.forEach($scope.mails, function(mail) {
        mail.selected = $scope.selectedAll;
      });
    };
  });
