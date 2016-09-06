'use strict';

/**
 * @ngdoc function
 * @name minovateApp.controller:PagesCoreCtrl
 * @description
 * # PagesCoreCtrl
 * Controller of the minovateApp
 */
app
  .controller('CoreCtrl', function ($scope,currentAuth,$state) {
  	if(currentAuth != null){
  		$state.go('app.pages.folder');
  	}
  });
