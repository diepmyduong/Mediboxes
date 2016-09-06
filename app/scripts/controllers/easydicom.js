'use strict';

/**
 * @ngdoc function
 * @name minovateApp.controller:EasyDicomCtrl
 * @description
 * # EasyDicomCtrl
 * Controller of the minovateApp
 */
app
  .controller('EasyDicomCtrl', function ($scope,$state,Anonymous) {
    if(TogetherJS.running){
      TogetherJS.refreshUserData();
    }
    $scope.createRoom = function(){
      Anonymous.$getUser(function(user){
        var currentAuth = user;
        var rootRef = firebase.database().ref();
        var roomMetaRef = rootRef.child("rooms/"+$scope.boxName+"/meta/");
        roomMetaRef.set({
          owner : currentAuth.uid
        },function(error){
          if(error){
            console.log("Error",error);
            $scope.alert = "This box's name already exists";
            $scope.$apply();
          } else{
            console.log("success");
            //Setup default Room value
            var usersRef  = roomMetaRef.parent.child("users");
            var data = {};
            data[currentAuth.uid] = {
              password: ""
            };
            usersRef.set(data);
            $state.go("esdcRoom",{boxName : $scope.boxName});
          }     
        })
      });
    }

    $scope.liveShare = function(event){
      TogetherJS(event.currentTarget);
    }

    $scope.testSend = function(event){
      TogetherJS.send({type: "test", content: "hello"});
    }

    
    
  })
  

  .controller('ViewerRoomCtrl'
    ,function($scope,OTSession,Anonymous,$state,$stateParams,FileUploader,$firebaseObject,$firebaseArray,$mdDialog,$mdBottomSheet,$location){
    
    var boxName = $stateParams.boxName;
    var rootRef = firebase.database().ref();
    var roomRef = rootRef.child('rooms/'+boxName);
    //Get Anonymous Auth
    Anonymous.$getUser(function(user){
      var currentAuth = user;
      $scope.currentAuth = currentAuth;
      //Check room exist?
      var roomMetaRef = rootRef.child("rooms/"+boxName+"/meta");
      roomMetaRef.on('value',function(snapshot){
        if(snapshot.val() == null){
          //Room is not exist
          var roomMetaRef = roomRef.child("meta");
          roomMetaRef.set({
            owner : currentAuth.uid
          },function(error){
            //Setup default Room value
            if(error){

            }else{
              var usersRef  = roomMetaRef.parent.child("users").child(currentAuth.uid);
              usersRef.set({
                password: ""
              }); 
              $scope.isOwner = true;
              $scope.connected = true;
              $scope.$apply();
            } 
          });
        }else{
          var metaData = snapshot.val();
          //Check user is Room Owner
          if(metaData.owner == currentAuth.uid){
            $scope.isOwner = true;
          }else{
            $scope.isOwner = false;
          }
          //Join to user list
          var userRef = roomRef.child("users/"+currentAuth.uid);
          userRef.set({
            password: ""
          },function(error){
            if(error){
              console.log('error',error);
              console.log("Password is Required");
              showRequiredPasswordConfirm(userRef);
            }else{
              //Autoremove user node when user offline
              $scope.connected = true;
              $scope.$apply();
            }
          });
        }
      })
    });
    function showRequiredPasswordConfirm(userRef) {
      // Appending dialog to document.body to cover sidenav in docs app
      var confirm = $mdDialog.confirm({
          parent: angular.element(document.body),
          templateUrl: 'requiredPasswordCofirm.tmpl.html',
          locals: {
            userRef : userRef
          },
          controller: ['$scope','userRef','$mdDialog',function($scope,userRef,$mdDialog){
            $scope.submit = function(){
              $scope.checking = true;
              $scope.passwordNotCorrect = false;
              if($scope.password != undefined && $scope.password != null && $scope.password != ""){
                userRef.set({
                  password: $scope.password
                },function(error){
                  if(error){
                    $scope.passwordNotCorrect = true;
                    $scope.checking = false;
                    $scope.$apply();
                  }else{
                    $mdDialog.hide();
                  }
                });
              }else{
                $scope.checking = false;
              }
            }
          }]
       });
       $mdDialog.show(confirm).then(function() {
          $scope.connected = true;
       });
    };
    $scope.$watch("connected",function(connected){
      if(connected != true){
        return;
      }
      //Wait to user connected Room
      console.log("user connected");
      if(TogetherJS.running){
        var TogetherJSConfig_findRoom = boxName;
        TogetherJS.reinitialize();
        // TogetherJS.config('findRoom',boxName);
        TogetherJS.refreshUserData();
      }
      var userRef = roomRef.child("users/"+$scope.currentAuth.uid);
      userRef.onDisconnect().remove();
      //Get Patient List
      var sharedFilesRef = roomRef.child('/sharedFile');
      // $scope.patientsList = $firebaseArray(sharedFilesRef);
      $scope.preview = {};
      $scope.preview.studiesListRef = roomRef.child('/sharedFile');
      $scope.preview.studiesList = $firebaseArray($scope.preview.studiesListRef);
      $scope.$watch('preview.studyId',function(studyId){
        if(studyId == undefined){
          return;
        }
        $scope.preview.seriesListRef = $scope.preview.studiesListRef.child(studyId+'/SeriesList');
        $scope.preview.seriesList = $firebaseArray($scope.preview.seriesListRef);
      });

      //Preview Control
      $scope.previewSeries = {};
      $scope.viewPorts = {};
      var isFormRemote = false;
      $scope.setupViewPort = function(row,column){
        console.log(isFormRemote);
        
        angular.forEach($scope.viewPorts,function(viewPort,key){
          viewPort.actived = false;
        })
        for(var i = 0; i < row; i++){
          for(var j = 0; j < column; j++){
            var index = (i*row) + j;
            if($scope.viewPorts[index] == undefined){
              $scope.viewPorts[index] = {};
            }
            $scope.viewPorts[index].actived = true;
            if($scope.viewPorts[index].isEmpty == undefined){
              $scope.viewPorts[index].isEmpty = true;
            }
            var top = (100/row) * i;
            var bottom = (100/row) * (row - 1 - i);
            var left = (100/column) * j;
            var right = (100/column) * (column - 1 - j);
            $scope.viewPorts[index].top = top == 0 ? top : top + '%';
            $scope.viewPorts[index].bottom =  bottom == 0 ? bottom : bottom + '%';
            $scope.viewPorts[index].left = left == 0 ? left : left + '%';
            $scope.viewPorts[index].right = right == 0 ? right : right + '%';
          }
        }
        if(!isFormRemote){
          if(TogetherJS.running){
            TogetherJS.send({type: "setupViewPort", row: row, column: column});
          }
        }else{
          $scope.$apply();
        }
      }
      TogetherJS.hub.on("setupViewPort", function (msg) {
          console.log("togetherJS",msg);
          isFormRemote = true;
          try {
            $scope.setupViewPort(msg.row,msg.column);
          } finally {
            isFormRemote = false;
          }
      });
      $scope.setupViewPort(1,1);
      $scope.onDragComplete=function(data,evt){
        //Drag success
      }
      $scope.onDropComplete=function(key,evt,viewPort){
        viewPort.isEmpty = false;
        viewPort.previewSeries = angular.copy($scope.previewSeries);
        // angular.forEach(viewPort.previewSeries, function(previewSeries,key){
        //   previewSeries.visible = false;
        // });
        viewPort.previewSeries[key].visible = true;
      }


      //Conerstone Tool
      $scope.tools = {
          wwwc : {
            actived : false,
            tooltip : "WW/WL",
            visible : true,
            icon    : "sun-o"
          },
          invert : {
            actived : false,
            tooltip : "Invert",
            visible : true,
            icon    : "adjust"
          },
          zoom : {
            actived : false,
            tooltip : "Zoom",
            visible : true,
            icon    : "search"
          },
          pan : {
            actived : false,
            tooltip : "Pan",
            visible : true,
            icon    : "arrows"
          },
          stackScroll : {
            actived : true,
            tooltip : "Stack Scroll",
            visible : true,
            icon    : "bars"
          },
          length : {
            actived : false,
            tooltip : "Length Measurement",
            visible : true,
            icon    : "arrows-v"
          },
          angle : {
            actived : false,
            tooltip : "Angle Measurement",
            visible : true,
            icon    : "angle-left"
          },
          probe : {
            actived : false,
            tooltip : "Pixel Probe",
            visible : true,
            icon    : "dot-circle-o"
          },
          ellipticalRoi : {
            actived : false,
            tooltip : "Elliptical ROI",
            visible : true,
            icon    : "circle-o"
          },
          rectangleRoi : {
            actived : false,
            tooltip : "Rectangle ROI",
            visible : true,
            icon    : "square-o"
          },
          playClip : {
            actived : false,
            tooltip : "Play Clip",
            visible : true,
            icon    : "play"
          },
          stopClip : {
            actived : true,
            tooltip : "Stop Clip",
            visible : true,
            icon    : "stop"
          },
          wwwcTouchDrag : {
            actived : true,
            tooltip : "WW/WL Touch Drag",
            visible : false,
            icon    : ""
          },
          zoomTouchDrag : {
            actived : false,
            tooltip : "Zoom Touch Drag",
            visible : false,
            icon    : ""
          },
          panTouchDrag : {
            actived : false,
            tooltip : "Pan Touch Drag",
            visible : false,
            icon    : ""
          },
          stackScrollTouchDrag : {
            actived : false,
            tooltip : "Stack Scroll Touch Drag",
            visible : false,
            icon    : ""
          }
      };
      $scope.numberOfVisibleTools = 0;
      angular.forEach($scope.tools, function(tool, key) {
        if(tool.visible){
          $scope.numberOfVisibleTools++;
        }
      });
      $scope.disableAllTools = function() {
        $scope.tools.wwwc.actived = false;
        $scope.tools.pan.actived = false;
        $scope.tools.zoom.actived = false;
        $scope.tools.probe.actived = false;
        $scope.tools.length.actived = false;
        $scope.tools.angle.actived = false;
        $scope.tools.ellipticalRoi.actived = false;
        $scope.tools.rectangleRoi.actived = false;
        $scope.tools.stackScroll.actived = false;
        $scope.tools.wwwcTouchDrag.actived = false;
        $scope.tools.zoomTouchDrag.actived = false;
        $scope.tools.panTouchDrag.actived = false;
        $scope.tools.stackScrollTouchDrag.actived = false;
      }
      $scope.activeTools = function(tool){
        switch(tool){
          case 'wwwc':
            $scope.disableAllTools();
            $scope.tools.wwwc.actived = true;
            break;
          case 'invert':
            if($scope.tools.invert.actived == true){
              $scope.tools.invert.actived = false;
            }else{
              $scope.tools.invert.actived = true;
            }
            break;
          case 'zoom':
            $scope.disableAllTools();
            $scope.tools.zoom.actived = true;
            break;
          case 'pan':
            $scope.disableAllTools();
            $scope.tools.pan.actived = true;
            break;
          case 'stackScroll':
            $scope.disableAllTools();
            $scope.tools.stackScroll.actived = true;
            break;
          case 'length':
            $scope.disableAllTools();
            $scope.tools.length.actived = true;
            break;
          case 'angle':
            $scope.disableAllTools();
            $scope.tools.angle.actived = true;
            break;
          case 'probe':
            $scope.disableAllTools();
            $scope.tools.probe.actived = true;
            break;
          case 'ellipticalRoi':
            $scope.disableAllTools();
            $scope.tools.ellipticalRoi.actived = true;
            break;
          case 'rectangleRoi':
            $scope.disableAllTools();
            $scope.tools.rectangleRoi.actived = true;
            break;
          case 'playClip':
            $scope.tools.playClip.actived = true;
            $scope.tools.stopClip.actived = false;
            break;
          case 'stopClip':
            $scope.tools.playClip.actived = false;
            $scope.tools.stopClip.actived = true;
            break;
        }
      }
      $scope.showGridBottomSheet = function($event) {
        $mdBottomSheet.show({
          parent: angular.element(document.getElementById('dicom-viewport')),
          templateUrl: 'bottom-tools-sheet-template.html',
          scope: $scope.$new(true),
          clickOutsideToClose : true ,
          targetEvent: $event,
          controller: function($scope, $mdBottomSheet) {
            $scope.listItemClick = function($index) {
              $mdBottomSheet.hide($index);
            };
          }
        }).then(function(toolKey) {
          $scope.activeTools(toolKey);
        });
      };
      $scope.disableAllTools();
      $scope.tools.stackScroll.actived = true;


      //Share Options
      //Load option if is Owner
      if($scope.isOwner){
        var shareOptionsRef = roomRef.child("shareOptions");
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
          $scope.shareOptions.shareUrl = $location.absUrl();
        })
      };
      // $scope.shareOptions = {
      //   allowAnnotating : true,
      //   passwordProtect : false,
      //   password        : null,
      //   hotspots        : true,
      //   attachReport    : false,
      //   requireUserIdentification : false,
      //   anonymiseStudy  : false,
      //   urlActivationPeriod : 1,
      //   shareUrl        : $location.absUrl()
      // };


      $scope.showShareOption = function(ev) {
        var shareOptions = angular.copy($scope.shareOptions);
        $mdDialog.show({
          clickOutsideToClose: true,
          targetEvent: ev,
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
      };

      // //Video Call
      // //TokBox
      // var apiKey = '45642722';
      // var sessionId = '1_MX40NTY0MjcyMn5-MTQ3MjU3MDkwMjA1OH5wWUs5S0VsQ29mWlZoU2xwc2R3M1I1eTR-fg';
      // var token = 'T1==cGFydG5lcl9pZD00NTY0MjcyMiZzaWc9NmEzMDgwYmIzYTBlZDFhYjEwOTU0ZWJkZTYyZjQ5ZDE2ZTgyZWI0YzpzZXNzaW9uX2lkPTFfTVg0ME5UWTBNamN5TW41LU1UUTNNalUzTURrd01qQTFPSDV3V1VzNVMwVnNRMjltV2xab1UyeHdjMlIzTTFJMWVUUi1mZyZjcmVhdGVfdGltZT0xNDcyNTcxNTU1Jm5vbmNlPTAuNTc4NzA0NjI3MjMwNzYzNCZyb2xlPXB1Ymxpc2hlciZleHBpcmVfdGltZT0xNDczMTc2MzU1';
      // OTSession.init(apiKey, sessionId, token, function(err, session) {
      //   if(err != null){
      //     console.log("error",err);
      //   }else{
      //     console.log("session",session);
      //   }
      // });
      // $scope.streams = OTSession.streams;
    })

    //LiveShare
    $scope.liveShare = function(event){
      TogetherJS(event.currentTarget);
    }
    
    //Uploader
    function setDefautUploader(){
      $scope.uploading = false;
      $scope.totalFileUpload = 0;
      $scope.fileUploaded = 0;
    }
    setDefautUploader();
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
        var uploadTask = SiriNova.$storage().$ref.child('DCMFiles/'
                                                    + boxName +'/'
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
          var rootRef = firebase.database().ref();
          rootRef.child("rooms/"+boxName+"/sharedFile/"+StudyInstanceUID).once('value',function(snapshot){
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
        "Modality"                          : parser.$Modality(),
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


  });
