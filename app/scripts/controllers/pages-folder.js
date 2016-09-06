'use strict';

/**
 * @ngdoc function
 * @name minovateApp.controller:BoxedlayoutCtrl
 * @description
 * # BoxedlayoutCtrl
 * Controller of the minovateApp
 */
app
  .controller('FolderPageCtrl', function ($scope,$firebaseObject,$firebaseArray,$state,NgTableParams,$mdSidenav,$mdUtil,FileUploader,$timeout,$mdDialog,$location) {
    $scope.page = {
      title: 'Folders',
      subtitle: 'Drag your files to upload...'
    };

    //Load User Files
    var rootRef = firebase.database().ref();
    var userFilesRef = rootRef.child("files/"+$scope.currentAuth.uid);
    $scope.studiesList = $firebaseArray(userFilesRef);
    $scope.studiesList.$loaded(function(){
      $scope.test = new NgTableParams({
        page: 1,
        count: 10
      }, { 
        dataset: $scope.studiesList
      });
      $scope.studiesList.$watch(function() { $scope.test.reload(); });

    });



    $scope.dateSelect = [
      {
        id: 0,
        title: "Today"
      },
      { 
        id: 1,
        title: "Last 7 days"
      },
      { 
        id: 2,
        title: "Last 30 days"
      }
    ];
    
    $scope.toggleRight = buildToggler('right');

    //Share Options
    $scope.showShareOptions = function(studyUID){
      var shareOptionsRef = userFilesRef.child(studyUID).child("shareOptions");
      $firebaseObject(shareOptionsRef).$bindTo($scope,"shareOptions").then(function(){
        //Set default share options
        if($scope.shareOptions.allowAnnotating === undefined){
          $scope.shareOptions.allowAnnotating = true;
        }
        if($scope.shareOptions.passwordRequired === undefined){
          $scope.shareOptions.passwordRequired = false;
        }
        if($scope.shareOptions.attachReport === undefined){
          $scope.shareOptions.attachReport = false;
        }
        if($scope.shareOptions.requireUserIdentification === undefined){
          $scope.shareOptions.requireUserIdentification = false;
        }
        if($scope.shareOptions.anonymiseStudy === undefined){
          $scope.shareOptions.anonymiseStudy = false;
        }
        var location = angular.copy($location);
        location.path("/dicomviewer").search({
          uid: $scope.currentAuth.uid,
          study: studyUID
        })
        $scope.shareOptions.shareUrl = location.absUrl();
        var shareOptions = angular.copy($scope.shareOptions);
        $mdDialog.show({
          clickOutsideToClose: true,
          parent: angular.element(document.body),
          locals: {
            options: shareOptions
          },
          templateUrl: 'shareOptions.tmpl.html',
          controller: function($scope,$mdDialog,options){
            $scope.shareOptions = options;
            $scope.closeDialog = function(){
              $mdDialog.hide();
            };
            $scope.apply = function(shareOptions){
              $mdDialog.hide(shareOptions);
            };
            $scope.minDate = new Date();
          }
        }).then(function(shareOptions){
          if(shareOptions != null){
            $scope.shareOptions = shareOptions;
          }
        });
      })
    }
    $scope.clockStudy = function(studyUID){
      userFilesRef.child(studyUID).child("shareOptions/isLocked").set(true);
    }
    $scope.unclockStudy = function(studyUID){
      userFilesRef.child(studyUID).child("shareOptions/isLocked").set(false);
    }

    $scope.preview = function(key,study){
      $scope.previewStudy = study;
      $scope.previewSeries = {};
      $scope.previewToolsCofig = {
        stackScroll : {
            actived : true
          }
      }
      $scope.seriesListRef = userFilesRef.child(study.$id).child("SeriesList");
      $scope.seriesList  = $firebaseArray($scope.seriesListRef);
      $scope.seriesList.$loaded(function(){
        //preview the first seri in study
        $scope.selectPreviewSeries(0);
        $scope.toggleRight();
      })
      
    }
    //Get Series Ref
    function getSeriesRef(studyUID,seriesUID) {
      return userFilesRef.child(studyUID).child(seriesUID);
    }
    //Unselect all preview Series
    function diacvtiveAllPreviewSeries(){
      angular.forEach($scope.previewSeries,function(preview,key){
        preview.visible = false;
      })
    }
    $scope.selectPreviewSeries = function(key){
      $scope.previewIndex = key
      console.log($scope.previewIndex);
      // diacvtiveAllPreviewSeries();
      // if($scope.previewSeries[key] == undefined){
      //   $scope.previewSeries[key] = {};
      // }
      // $scope.previewSeries[key].visible = true;
    }
    $scope.openDICOMViewer = function(study){
      $state.go('dicomviewer',{uid:$scope.currentAuth.uid,study:study.$id});
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
    // var query = SiriNova.$files().$ref.child($scope.currentAuth.uid);
    // $scope.patientsLoading = true;
    // $scope.patients = $firebaseArray(query);
    // $scope.patients.$loaded().then(function(){
    //   $scope.patientsLoading = false;
    // })
    // $scope.selectPatient = function(patient){
    //   $state.go('app.pages.patient', { SOPClassUID : patient.$id});
    // }

    //Uploader
    var uploader = $scope.uploader = new FileUploader({
      //url: 'scripts/modules/fileupload/upload.php' //enable this option to get f
    });
    uploader.filters.push({
      name: 'dicomFilter',
      fn: function(item, options) {
          return item.type == 'application/dicom';
      }
    });
    // CALLBACKS
    function setDefautUploader(){
      $scope.uploading = false;
      $scope.totalFileUpload = 0;
      $scope.fileUploaded = 0;
    }
    setDefautUploader();
    uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
      console.info('onWhenAddingFileFailed', item, filter, options);
    };
    uploader.onAfterAddingFile = function(fileItem) {
      console.info('onAfterAddingFile', fileItem);
      $scope.uploading = true;
      $scope.totalFileUpload++;
      $scope.$apply();
      startUpload(fileItem._file,function(){
        $scope.uploadPaused = false;
        $scope.fileUploaded++;
        if($scope.fileUploaded == $scope.totalFileUpload){
          setDefautUploader();
        }
        $scope.$apply();
      },function(error){
        if(error){
          console.log("Disconnect");
          $scope.uploadPaused = true
          $scope.$apply();
        }
      });
    };
    uploader.onAfterAddingAll = function(addedFileItems) {
      console.info('onAfterAddingAll', addedFileItems);
    };
    //Firebase Upload DICOM file
    var startUpload = function(file,complete,error){
      var fileType = file.type;
      if(fileType != 'application/dicom'){
        return;
      }
      var timeStamp = new Date().getTime();
      DCMParser().$initWithFile(file,function(parser){
        //UID
        var SOPClassUID = parser.$SOPClassUID().replaceAll(".","-");
        var StudyInstanceUID = parser.$StudyInstanceUID().replaceAll(".","-");
        var SeriesInstanceUID = parser.$SeriesInstanceUID().replaceAll(".","-");
        var SOPInstanceUID = parser.$SOPInstanceUID().replaceAll(".","-");

        var fileName = 'DCM_'+parser.$InstanceNumber() + ".dcm";
        var metaData = {
          contentType: 'application/dicom'
        }
        var uploadTask = SiriNova.$storage().$ref.child('UserFiles/'
                                                    + $scope.currentAuth.uid +'/'
                                                    + parser.$StudyInstanceUID() + '/'
                                                    + parser.$SeriesInstanceUID() + '/'
                                                    + fileName
                                                  ).put(file,metaData);
        uploadTask.on('state_changed', function(snapshot){
          switch (snapshot.state) {
            case firebase.storage.TaskState.PAUSED: // or 'paused'
              
              console.log("upload paused");
              break;
            case firebase.storage.TaskState.RUNNING: // or 'running'
              console.log("uploading...");
              break;
          }
        }, function(error) {
          console.log(error);
          error(error);
        }, function() {
          var downloadURL = uploadTask.snapshot.downloadURL;
          console.log("downloadURL",downloadURL);
          var rootRef = firebase.database().ref();
          rootRef.child("files/"+$scope.currentAuth.uid+"/"+StudyInstanceUID).once('value',function(snapshot){
            if(snapshot.val() === null){
              //Set study
              var studyRef = snapshot.ref;
              setStudy(parser,studyRef,downloadURL);
            }else{
              var seriesListSnap = snapshot.child("SeriesList");
              if(seriesListSnap.hasChild(SeriesInstanceUID)){
                var instancesListSnap = seriesListSnap.child(SeriesInstanceUID+"/InstancesList");
                if(instancesListSnap.hasChild(SOPInstanceUID)){
                  instancesListSnap.ref.child(SOPInstanceUID).update({
                    "InstanceNumber"  : parseInt(parser.$InstanceNumber()),
                    "NumberOfFrames"  : parser.$NumberOfFrames(),
                    "ImageID"         : downloadURL
                  });
                }else{
                  //Set Instance when not exist
                  var instancesRef = instancesListSnap.ref.child(SOPInstanceUID);
                  setInstance(parser,instancesRef,downloadURL);
                }
              }else{
                //Set seri when not exist
                var seriesRef = seriesListSnap.ref.child(SeriesInstanceUID);
                setSeries(parser,seriesRef,downloadURL);
              }
            }
            complete();
          })
        });
      });
    }
    String.prototype.replaceAll = function(search, replacement) {
        var target = this;
        return target.split(search).join(replacement);
    };

    function setStudy(parser,studyRef,fullPath){
      console.log("setStudy");
      var shareOptions = {
        allowAnnotating : true,
        anonymiseStudy  : false,
        attachReport    : false,
        isLocked        : true,
        passwordRequired : false,
        requireUserIdentification: false
      }
      studyRef.set({
        "PatientID"                       : parser.$PatientId(),
        "PatientName"                     : parser.$PatientName(),
        "PatientBirthDay"                 : parser.$PatientBirthDay(),
        "StudyDescription"                : parser.$StudyDescription(),
        "AccessionNumber"                 : parser.$AccessionNumber(),
        "InstitutionName"                 : parser.$InstitutionName(),
        "ReferringPhysicianName"          : parser.$ReferringPhysicianName(),
        "RequestedProcedureDescription"   : parser.$RequestedProcedureDescription(),
        "RequestingPhysician"             : parser.$RequestingPhysician(),
        "StudyID"                         : parser.$StudyID(),
        "StudyDate"                       : parser.$StudyDate(),
        "Modality"                        : parser.$Modality(),
        "shareOptions"                    : shareOptions
      });
      var seriesRef = studyRef.child("SeriesList/"+parser.$SeriesInstanceUID().replaceAll(".","-"));
      setSeries(parser,seriesRef,fullPath);
    }
    function setSeries(parser,seriesRef,fullPath){
      console.log("setSeries");
      seriesRef.set({
        "SeriesDescription"                 : parser.$SeriesDescription(),
        "ContrastBolusAgent"                : parser.$ContrastBolusAgent(),
        "OperatorsName"                     : parser.$OperatorsName(),
        "PerformedProcedureStepDescription" : parser.$PerformedProcedureStepDescription(),
        "ProtocolName"                      : parser.$ProtocolName(),
        "SequenceName"                      : parser.$SequenceName(),
        "SeriesNumber"                      : parseInt(parser.$SeriesNumber()),
        "StationName"                       : parser.$StationName(),

      });
      var instancesRef = seriesRef.child("InstancesList/"+parser.$SOPInstanceUID().replaceAll(".","-"));
      setInstance(parser,instancesRef,fullPath);
    }
    function setInstance(parser,instancesRef,fullPath){
      console.log("setInstances");
      instancesRef.set({
        "InstanceNumber"  : parseInt(parser.$InstanceNumber()),
        "NumberOfFrames"  : parser.$NumberOfFrames(),
        "ImageID"         : fullPath
      });
    }
  })
  .controller('StudyPreviewCtrl', function ($scope, $timeout, $mdSidenav, $log) {
    $scope.close = function () {
      $mdSidenav('right').close()
        .then(function () {
          $log.debug("close RIGHT is done");
        });
    };

  });
