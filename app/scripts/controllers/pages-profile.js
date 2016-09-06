'use strict';

/**
 * @ngdoc function
 * @name minovateApp.controller:PagesProfileCtrl
 * @description
 * # PagesProfileCtrl
 * Controller of the minovateApp
 */
app
  .controller('ProfileCtrl', function ($scope) {
    $scope.page = {
      title: 'Profile Page',
      subtitle: 'Make realtime Profile change'
    };

    // Change Photo
    $scope.uploadFile = {};
    $scope.$watch('uploadFile.src', function(val) {
      if(val != undefined){
        console.log("photoFile",val);
      	var fileType = val[0].type;
      	if(fileType == 'image/jpeg' || fileType == 'image/png'){
      		SiriNova.$user().$uploadProfileImage($scope.currentAuth.uid,val[0],function(err){
      			if(err != null){
      				console.log(err);
      			}
      		})
      	}
      }
    });
  });
