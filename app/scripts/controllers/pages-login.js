'use strict';

/**
 * @ngdoc function
 * @name minovateApp.controller:PagesLoginCtrl
 * @description
 * # PagesLoginCtrl
 * Controller of the minovateApp
 */
app
  .controller('LoginCtrl', function ($scope, $state,Auth,$timeout) {
  	$scope.logging = false;
  	//Login
    $scope.login = function() {	
    	$scope.logging = true;
    	$scope.loggingBtn = 'btn-warning';
    	$scope.loggingStatus = 'Logging...';
    	try {
    		Auth.$signInWithEmailAndPassword($scope.user.email, $scope.user.password,{remember: 'default'})
			.then(function(data){
				$scope.loggingBtn = 'btn-success';
				$scope.loggingStatus = 'Success!';
				$timeout(function(){
          			$state.go('app.pages.folder');
				},1000);
			})
			.catch(function(error) {
				$scope.loggingBtn = 'btn-danger';
    			$scope.loggingStatus = 'Fail!!';
				$timeout(function(){
          			$scope.logging = false;
          			$scope.$apply();
          			console.log($scope.logging);
				},1000);
			  	$scope.error = error.message;
			});
    	}catch(err){
    		$scope.loggingBtn = 'btn-danger';
  			$scope.loggingStatus = 'Fail!!';
  			$timeout(function(){
        			$scope.logging = false;
        			$scope.$apply();
  			},1000);
		  	$scope.error = err.message;
    	}
    };
  });
