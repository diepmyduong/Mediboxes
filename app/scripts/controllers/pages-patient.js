'use strict';

/**
 * @ngdoc function
 * @name minovateApp.controller:PatientPageCtrl
 * @description
 * # PatientPageCtrl
 * Controller of the minovateApp
 */
app
  .controller('PatientPageCtrl', function ($scope,$firebaseArray,$firebaseObject,$mdSidenav,$mdUtil,$state,$stateParams) {
    $scope.page = {
      title: 'Studies',
      subtitle: ''
    };
    var SOPClassUID = $stateParams.SOPClassUID;
    if(SOPClassUID === undefined){
      $state.go("app.pages.folder");
    }
    $scope.patientLoading = true;
    $firebaseObject(SiriNova.$files().$ref.child($scope.currentAuth.uid+"/"+SOPClassUID)).$bindTo($scope,"patient").then(function(){
      $scope.patientLoading = false;
    });
    $scope.toggleRight = buildToggler('right');
    var previewStudyUID = null;
    $scope.preview = function(uid,study){
      $scope.previewStudy = null;
      $scope.previewStudy = study;
      previewStudyUID = uid;
      //preview the first seri in study
      $scope.previewSeriesIndex = Object.keys(study.SeriesList)[0];
      $scope.toggleRight();
    }
    $scope.selectPreviewSeri = function(key){
      $scope.previewSeriesIndex = key;
    }
    $scope.openDICOMViewer = function(study){
      var link = $state.href('dicomviewer', {
             uid: $scope.currentAuth.uid,
             patient: $scope.patient.$id,
             study: previewStudyUID,
      });
      window.open(link, '_blank');
    }

    /**
     * Build handler to open/close a SideNav; when animation finishes
     * report completion in console
     */
    function buildToggler(navID) {
      var debounceFn =  $mdUtil.debounce(function(){
        $mdSidenav(navID)
          .toggle();
      },200);
      return debounceFn;
    }
  });
