'use strict';

/**
 * @ngdoc function
 * @name minovateApp.controller:BoxedlayoutCtrl
 * @description
 * # BoxedlayoutCtrl
 * Controller of the minovateApp
 */
app
  .controller('HospitalsCtrl',function($scope,$mdBottomSheet){
    //List HospitalsCtrl
    $scope.showGridBottomSheet = function($event) {
      $mdBottomSheet.show({
        parent: angular.element(document.body),
        templateUrl: 'hospital-list.tmp.html',
        controller: function($scope){
        },
        targetEvent: $event
      }).then(function() {

      });
    };
  })
  .controller('PartnersCtrl', function($scope,$firebaseArray,$firebaseObject){
    // Partners Control
    // Load list of partners
    var userRef = SiriNova.$user().$ref($scope.currentAuth.uid);
    $scope.partnerProfiles = {};
    $scope.partners = $firebaseArray(userRef.child("partners"));
    $scope.partners.$loaded().then(function(){
      console.log("parners",$scope.partners);
      //Binding partners Meta profile
      angular.forEach($scope.partners, function(value, key) {
        var partnerProfileRef = SiriNova.$user().$profileRef(value.$id);
        var partnerProfile = $firebaseObject(partnerProfileRef);
        partnerProfile.$bindTo($scope,'partnerProfiles['+key+']').then(function(){
          console.log("partnerProfile",$scope.partnerProfiles[key]);
        });
      });
    });
  })
  .controller('AppCtrl', function ($scope,currentAuth,Auth,$state,$firebaseObject,$firebaseArray,$compile,$timeout) {
  	// Current User
    $scope.currentAuth = currentAuth;
    // Logout
    $scope.logout = function(){
        if(!$scope.currentAuth.isAnonymous){
            $scope.profile.isOnline = false;
        }
      Auth.$signOut();
      $timeout(function(){
        $state.go('core.login');
      },1000)
    };
    if($scope.currentAuth.isAnonymous){
        $scope.logout();
    }
    
    var userRef = SiriNova.$user().$ref(currentAuth.uid);
    var userProfileRef = SiriNova.$user().$profileRef(currentAuth.uid);
    $firebaseObject(userProfileRef).$bindTo($scope,'profile').then(function(){
      $scope.profile.isOnline = true;
    })
    //Set Connection Status when disconnect
    userProfileRef.child('isOnline').onDisconnect().set(false);
    // Load Friend List




    // // Room
    // $scope.rooms = $firebaseArray(SiriNova.$room().$ref)

    // // Chat
    // // Chat boxs
    // var chatBoxs = {};
    // chatBoxs.numberActive = 3;
    // chatBoxs.src = [];
    // chatBoxs.push = function(chatbox) {
    //   if(chatBoxs.src.lenght != 0){
    //     if(chatBoxs.src[chatBoxs.numberActive-1]){
    //       chatBoxs.src[chatBoxs.numberActive-1].hide();
    //     }
    //     chatBoxs.src.forEach(function(val,key){
    //       val.goLeft();
    //     })
    //     chatBoxs.src.unshift(chatbox);
    //   }else{
    //     chatBoxs.src.unshift(chatbox);
    //   }
    // }

    // $scope.openChatBox = function(room,privateRoom){

    //   var config = { 
    //     label: room.caption,
    //     pacing:10, // Khoang cach giua cac box,
    //     roomId: room.$id
    //   };
    //   // Init
    //   var chat = siriChat(config).init(function(chat){});
    //   chat.setUser({
    //     name:$scope.profile.displayName,
    //     email: $scope.profile.email
    //   });
    //   chat.hideUserFields(true);
    //   chat.showTab(true);
    //   chat.toggleBox();
      
    //   chat.on('anySubmission',function(e){
    //     SiriNova.$room().$sendMessage($scope.currentAuth.uid,room.$id,privateRoom,chat.$srChatMessageBox.val(),function(key){
    //       chat.$srChatMessageBox.val('');
    //     })
    //   });
    //   chat.on('mssgKeyup',function(e){
    //     // console.log('mssgKeyup');
    //   });
    //   chat.on('onClose',function(e){
    //     chat.hide();
    //   })
    //   chatBoxs.push(chat);
    //   var roomMessageRef = SiriNova.$room().$getRoom(room.$id,privateRoom).child('messages');
    //   var messageRef = SiriNova.$room().$messages;
    //   roomMessageRef.on('child_added',function(snapshot,prevChildKey){
    //     var message = $firebaseObject(messageRef.child(snapshot.key));
    //     message.$loaded().then(function(){
    //       if(message.senderId == $scope.currentAuth.uid){
    //         chat.addMessage({
    //             from: $scope.profile.displayName,
    //             content: message.message,
    //             date: new Date(message.timeStamp),
    //             isRight: true,
    //             avatarSrc: $scope.profile.photoURL,
    //             compile: $compile,
    //             scope:$scope
    //          });
    //       }else{
    //         var index = $scope.friends.$indexFor(message.senderId);
    //         if(index == -1){
    //           var profile = $firebaseObject(SiriNova.$user().$profileRef(message.senderId));
    //           chat.addMessage({
    //             from: profile.displayName,
    //             content: message.message,
    //             date: new Date(message.timeStamp),
    //             isRight: false,
    //             avatarSrc: profile.photoURL,
    //             compile: $compile,
    //             scope:$scope
    //           });
    //         }else{
    //           chat.addMessage({
    //             from: $scope.friendProfiles[index].displayName,
    //             content: message.message,
    //             date: new Date(message.timeStamp),
    //             isRight: false,
    //             avatarSrc: $scope.friendProfiles[index].photoURL,
    //             compile: $compile,
    //             scope:$scope
    //           });
    //         }
    //       }
    //     });
          
    //     });
    // }

    // // Upload Files
    // $scope.filesUpload = {}
    // $scope.uploading = false;
    // $scope.totalFileUpload = 0;
    // $scope.uploadProgress = 0;
    // $scope.$watch('filesUpload.src',function(val){
    //   if(val != undefined){
    //     $scope.filesUpload.array = $.map(val, function(value, index) {
    //         if(value.type == 'application/dicom') {
    //           return [value];
    //         }
    //     });
    //     $scope.totalFileUpload = $scope.filesUpload.array.length;
    //   }
    // })

    // $scope.uploadAll = function(){
    //   $scope.uploading = true;
    //   if($scope.totalFileUpload > 0 ){
    //     $scope.startUpload(0,function(err){
    //       if(err == null){
    //         $scope.uploadAll();
    //       }
    //     });
    //   }
    // }

    // $scope.startUpload = function(key,callback){
    //   var file = $scope.filesUpload.array[key];
    //   var fileType = $scope.filesUpload.array[key].type;
    //   var timeStamp = new Date().getTime();
    //   var complete = callback ? callback : function(err){};
    //   switch(fileType){
    //     case 'application/dicom':
    //       file.uploading = true
    //       DCMParser().$initWithFile(file,function(parser){
    //         var SOPClassUID = parser.$SOPClassUID().replaceAll(".","-");
    //         var StudyInstanceUID = parser.$StudyInstanceUID().replaceAll(".","-");
    //         var SeriesInstanceUID = parser.$SeriesInstanceUID().replaceAll(".","-");
    //         var SOPInstanceUID = parser.$SOPInstanceUID().replaceAll(".","-");
    //         var fileName = parser.$SOPInstanceUID() + ".dcm";
    //         var metaData = {
    //           contentType: 'application/dicom',
    //           customMetadata: {
    //             name: fileName,
    //             patientName: parser.$PatientName(),
    //             studyDescription: parser.$StudyDescription()
    //           }
    //         }
    //         $scope.filesUpload.array[key].uploadTask = SiriNova.$storage().$ref.child('DCMFiles/'
    //                                                     + currentAuth.uid + '/'
    //                                                     + parser.$SOPClassUID() + '/'
    //                                                     + parser.$StudyInstanceUID() + '/'
    //                                                     + parser.$SeriesInstanceUID() + '/'
    //                                                     + fileName
    //                                                   ).put(file,metaData);
    //         $scope.filesUpload.array[key].uploadTask.on('state_changed', function(snapshot){
    //           switch (snapshot.state) {
    //             case firebase.storage.TaskState.PAUSED: // or 'paused'
    //               break;
    //             case firebase.storage.TaskState.RUNNING: // or 'running'
    //               $scope.filesUpload.array[key].uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    //               // $scope.$apply();
    //               break;
    //           }
    //         }, function(error) {
    //           // Handle unsuccessful uploads
    //           complete(error);
    //         }, function() {
    //           var metadata = $scope.filesUpload.array[key].uploadTask.snapshot.metadata;
    //           var fullPath = "gs://"+metadata.bucket+"/"+metadata.fullPath;
    //           //Check User Has Any files updated
    //           SiriNova.$files().$ref.child(currentAuth.uid+"/"+SOPClassUID).once('value',function(snapshot){
    //             if(snapshot.val() === null){
    //               //Set patient
    //               var patientRef = snapshot.ref;
    //               setPatient(parser,patientRef,fullPath);
    //             }else{
    //               var studiesListSnap = snapshot.child("StudiesList");
    //               if(studiesListSnap.hasChild(StudyInstanceUID)){
    //                 var seriesListSnap = studiesListSnap.child(StudyInstanceUID+"/SeriesList");
    //                 if(seriesListSnap.hasChild(SeriesInstanceUID)){
    //                   var instancesListSnap = seriesListSnap.child(SeriesInstanceUID+"/InstancesList");
    //                   if(instancesListSnap.hasChild(SOPInstanceUID)){
    //                     instancesListSnap.ref.child(SOPInstanceUID).update({
    //                       "InstanceNumber"  : parser.$InstanceNumber(),
    //                       "NumberOfFrames"  : parser.$NumberOfFrames(),
    //                       "ImageID"         : fullPath
    //                     });
    //                   }else{
    //                     //Set Instance when not exist
    //                     var instancesRef = instancesListSnap.ref.child(SOPInstanceUID);
    //                     setInstance(parser,instancesRef,fullPath);
    //                   }
    //                 }else{
    //                   //Set seri when not exist
    //                   var seriesRef = seriesListSnap.ref.child(SeriesInstanceUID);
    //                   setSeries(parser,seriesRef,fullPath);
    //                 }
    //               }else{
    //                 //Set study when not exist
    //                 var studyRef = studiesListSnap.ref.child(StudyInstanceUID);
    //                 setStudy(parser,studyRef,fullPath);
    //               }
    //             }
    //             $scope.removeUploadFile(key);
    //             complete(null);
    //             $scope.$apply();
    //           });
    //         });
    //       });
    //     break;
    //   };
    // }
    // String.prototype.replaceAll = function(search, replacement) {
    //     var target = this;
    //     return target.split(search).join(replacement);
    // };
    // //Set DiCOM File Data
    // function setPatient(parser,patientRef,fullPath){
    //   patientRef.set({
    //     "PatientID"       : parser.$PatientId(),
    //     "PatientName"     : parser.$PatientName(),
    //     "PatientBirthDay" : parser.$PatientBirthDay(),
    //   });
    //   var studyRef = patientRef.child("StudiesList/"+parser.$StudyInstanceUID().replaceAll(".","-"));
    //   setStudy(parser,studyRef,fullPath);
    // }

    // function setStudy(parser,studyRef,fullPath){
    //   studyRef.set({
    //     "StudyDescription"                : parser.$StudyDescription(),
    //     "AccessionNumber"                 : parser.$AccessionNumber(),
    //     "InstitutionName"                 : parser.$InstitutionName(),
    //     "ReferringPhysicianName"          : parser.$ReferringPhysicianName(),
    //     "RequestedProcedureDescription"   : parser.$RequestedProcedureDescription(),
    //     "RequestingPhysician"             : parser.$RequestingPhysician(),
    //     "StudyID"                         : parser.$StudyID(),
    //     "StudyDate"                       : parser.$StudyDate()
    //   });
    //   var seriesRef = studyRef.child("SeriesList/"+parser.$SeriesInstanceUID().replaceAll(".","-"));
    //   setSeries(parser,seriesRef,fullPath);
    // }
    // function setSeries(parser,seriesRef,fullPath){
    //   seriesRef.set({
    //     "SeriesDescription"                 : parser.$SeriesDescription(),
    //     "ContrastBolusAgent"                : parser.$ContrastBolusAgent(),
    //     "Modality"                          : parser.$Modality(),
    //     "OperatorsName"                     : parser.$OperatorsName(),
    //     "PerformedProcedureStepDescription" : parser.$PerformedProcedureStepDescription(),
    //     "ProtocolName"                      : parser.$ProtocolName(),
    //     "SequenceName"                      : parser.$SequenceName(),
    //     "SeriesNumber"                      : parser.$SeriesNumber(),
    //     "StationName"                       : parser.$StationName(),

    //   });
    //   var instancesRef = seriesRef.child("InstancesList/"+parser.$SOPInstanceUID().replaceAll(".","-"));
    //   setInstance(parser,instancesRef,fullPath);
    // }
    // function setInstance(parser,instancesRef,fullPath){
    //   instancesRef.set({
    //     "InstanceNumber"  : parser.$InstanceNumber(),
    //     "NumberOfFrames"  : parser.$NumberOfFrames(),
    //     "ImageID"         : fullPath
    //   });
    // }

    // $scope.removeUploadFile = function(key){
    //   $scope.filesUpload.array.splice(key,1);
    //   $scope.totalFileUpload = $scope.filesUpload.array.length;
    //   $scope.uploadProgress = 1/$scope.totalFileUpload * 100;
    //   if($scope.totalFileUpload == 0){
    //     $scope.uploading = false;
    //   }
    // }    
    
  });
