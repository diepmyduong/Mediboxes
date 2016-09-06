'use strict';

/**
 * @ngdoc function
 * @name minovateApp.controller:DicomViewerCtrl
 * @description
 * # DicomViewerCtrl
 * Controller of the minovateApp
 */
app
  .controller('ReportCtrl', function ($scope, $timeout, $mdSidenav, $log) {
    $scope.close = function () {
      $mdSidenav('right').close()
        .then(function () {
          $log.debug("close RIGHT is done");
        });
    };

  })
  .controller('DicomViewerCtrl'
    ,function($scope,$mdSidenav,$mdUtil,OTSession,Anonymous,$state,$stateParams,$firebaseObject,$firebaseArray,$mdDialog,$mdBottomSheet,$location,$timeout){
    
    var uid = $stateParams.uid;
    var studyUID = $stateParams.study;

    var rootRef = firebase.database().ref();
    var studyRef = rootRef.child('files').child(uid).child(studyUID);

    //Get Anonymous Auth
    Anonymous.$getUser(function(user){
      var currentAuth = user;
      $scope.currentAuth = currentAuth;
      //Check is Owner
      if(currentAuth.uid == uid){
        $scope.isOwner = true;
      }else{
        $scope.isOwner = false;
      }
      //Check study exist?
      studyRef.child("shareOptions/passwordRequired").once("value",function(snap){
        if(snap.val() == null){
          //Study not exist
          $state.go('app.pages.folder');
        }else{
          if(!$scope.isOwner){
            //Join to user list
            var userRef = studyRef.child("users").child(currentAuth.uid);
            userRef.set({
              password: ""
            },function(error){
              if(error){
                //Password is Required
                showRequiredPasswordConfirm(userRef);
              }else{
                $scope.connected = true;
                $scope.$apply();
              }
            })
          }else{
            $scope.connected = true;
            $timeout(function(){
              $scope.$apply();
            });
          }
        }
      });
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
      var userRef = studyRef.child("users/"+$scope.currentAuth.uid);
      userRef.onDisconnect().remove();

      //Get study
      $firebaseObject(studyRef).$bindTo($scope,'study');
      //Get Series List
      $scope.preview = {};
      $scope.preview.seriesListRef = studyRef.child('SeriesList');
      $scope.preview.seriesList = $firebaseArray($scope.preview.seriesListRef);

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
        var shareOptionsRef = studyRef.child("shareOptions");
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

      //Video Call
      //TokBox
      var apiKey = '45642722';
      var sessionId = '1_MX40NTY0MjcyMn5-MTQ3MjU3MDkwMjA1OH5wWUs5S0VsQ29mWlZoU2xwc2R3M1I1eTR-fg';
      var token = 'T1==cGFydG5lcl9pZD00NTY0MjcyMiZzaWc9NmEzMDgwYmIzYTBlZDFhYjEwOTU0ZWJkZTYyZjQ5ZDE2ZTgyZWI0YzpzZXNzaW9uX2lkPTFfTVg0ME5UWTBNamN5TW41LU1UUTNNalUzTURrd01qQTFPSDV3V1VzNVMwVnNRMjltV2xab1UyeHdjMlIzTTFJMWVUUi1mZyZjcmVhdGVfdGltZT0xNDcyNTcxNTU1Jm5vbmNlPTAuNTc4NzA0NjI3MjMwNzYzNCZyb2xlPXB1Ymxpc2hlciZleHBpcmVfdGltZT0xNDczMTc2MzU1';
      OTSession.init(apiKey, sessionId, token, function(err, session) {
        if(err != null){
          console.log("error",err);
        }else{
          console.log("session",session);
        }
      });
      $scope.streams = OTSession.streams;

      //Report
      $scope.toggleRight = buildToggler('right');
      function buildToggler(navID) {
        var debounceFn =  $mdUtil.debounce(function(){
          $mdSidenav(navID)
            .toggle();
        },200);
        return debounceFn;
      }
      // //LiveShare
      $scope.liveShare = function(event){
        TogetherJS(event.currentTarget);
      }
      $scope.$watch('main.settings.rightbarShow',function(setting){
        console.log(setting);
      })
    })

    



  });
