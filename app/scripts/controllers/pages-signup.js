'use strict';

/**
 * @ngdoc function
 * @name minovateApp.controller:PagesSignupCtrl
 * @description
 * # PagesSignupCtrl
 * Controller of the minovateApp
 */
app
  .controller('SignupCtrl', function ($scope,Auth,$timeout,$state) {

  	$scope.signing = false;
  	$scope.signUpBtn = 'btn-greensea';
  	$scope.signUpStatus = 'Sign Up';
  	$scope.signUp = function(){
  		try{
  			$scope.signing = true;
  			$scope.signUpBtn = 'btn-warning';
  			$scope.signUpStatus = 'Signing Up...';
  			console.log(Auth);

  			Auth.$createUserWithEmailAndPassword(
  				$scope.user.email,
  				$scope.user.password
  			).then(function(userData) {
	        SiriNova.$user().$updateBasicProfile(userData.uid,userData.email,$scope.user.name);
	        $scope.signUpBtn = 'btn-success';
  				$scope.signUpStatus = 'Success!';
  				$timeout(function(){
  					$state.go('app.pages.folder');
  				},1000);
		    }).then(function(authData) {
		    }).catch(function(error) {
		    	$scope.error = error.message;
	        $scope.signUpBtn = 'btn-danger';
  				$scope.signUpStatus = 'Fail!!';
  				$timeout(function(){
  					$scope.signing = false;
  					$scope.signUpBtn = 'btn-greensea';
  					$scope.signUpStatus = 'Sign Up';
  				},1000);
		    });
  		}catch(err){
  			$scope.error = err.message;
        $scope.signUpBtn = 'btn-danger';
  			$scope.signUpStatus = 'Fail!!';
  			$timeout(function(){
  				$scope.signing = false;
  				$scope.signUpBtn = 'btn-greensea';
    			$scope.signUpStatus = 'Sign Up';
  			},1000);
  		};
  	}
  });
