app.factory("Auth", ["$firebaseAuth",
  function($firebaseAuth) {
    return $firebaseAuth();
  }
]);
app.factory("Anonymous", ["$firebaseAuth",
  function($firebaseAuth) {
    var Anonymous = {};
    Anonymous.$getUser = function(callback){
      var Auth = $firebaseAuth();
      var currentAuth = Auth.$getAuth();
      if(currentAuth == null){
        Auth.$signInAnonymously().then(function(firebaseUser) {
          console.log("Signed in as:", firebaseUser.uid);
          callback(firebaseUser);
        }).catch(function(error) {
          console.error("Authentication failed:", error);
          callback(null);
        });
      }else{
        console.log("Signed in as:", currentAuth.uid);
        callback(currentAuth);
      }
    }
    return Anonymous;
  }
]);

app.directive("fileread", [function () {
    return {
        scope: {
            fileread: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                scope.$apply(function () {
                    // scope.fileread = changeEvent.target.files[0];
                    // or all selected files:
                    scope.fileread = changeEvent.target.files;
                });
            });
        }
    }
}]);

//Siri Image Source
app.directive("srSrc", [function () {  
    return {
        scope: {
            data: "@"
        },
        link: function (scope, element, attributes) {
           var path = attributes.srSrc;
          if(path.startsWith("gs://")){
            var storageRef = firebase.storage().refFromURL(path);
            storageRef.getMetadata().then(function(metadata) {
              element.attr('src',metadata.downloadURLs[0]);
            }).catch(function(error) {
              element.attr('src','');
            });
          }else{
            element.attr('src',path);
          }
        }
    }
}]);

//Cornerstone Viewer
app.directive("srDicomViewer", [function () {  
    return {
        restrict: 'E',
        replace: true,
        scope: {
            series                : "=",
            seriesListRef         : "=",
            progressing           : "=?",
            toolsEnable           : "=?",
            resize                : "=?",
            totalFrame            : "=?",
            currentFrame          : "=?",
            toolsConfig           : "=?",
            scrollIndicator       : "=?"
        },
        template:"<div></div>",
        controller: function($scope, $element, $attrs,$q,$timeout,$firebaseArray){
          $scope.progressing = true;
          cornerstone.enable($element[0]);
          if($scope.resize == true){
            $($element[0]).resize(function(){
              cornerstone.resize($element[0], true);
            });
          }
          //Add Stack Manager
          $scope.stack = {
              seriesDescription: $scope.series.SeriesDescription,
              stackId: $scope.series.SeriesNumber,
              imageIds: [],
              seriesIndex: $scope.series.SeriesNumber,
              currentImageIdIndex: 0,
              frameRate: $scope.series.frameRate
          };
          //Control Image loading
          //Event Callback
          $(cornerstone).bind('CornerstoneImageLoaded', function(event, eventData)
          {

          });
          $($element[0]).on("CornerstoneNewImage",function(e,data){
            $scope.num
          });
          $($element[0]).on("CornerstoneImageRendered", function(e,data){
            $scope.progressing = false;
            $timeout(function(){
              $scope.currentFrame = $scope.stack.currentImageIdIndex;
            });
          });
          


          cornerstoneTools.addStackStateManager($element[0], ['playClip']);
          cornerstoneTools.addToolState($element[0], 'stack', $scope.stack);

          $scope.$watch("series",function(series){
            if(series == undefined || $scope.seriesListRef == undefined){
              return;
            }
            var instanceListRef = $scope.seriesListRef.child(series.$id+'/InstancesList');
            var instanceListFactory = $firebaseArray.$extend({    
                //This is called anytime a new instance_node is added   
                $$added: function(dataSnapshot){
                  var instance = dataSnapshot.val(); //This is the data
                  var instanceId = dataSnapshot.key; //The instance id
                  if($scope.toolsEnable == true){
                    //Load Instance
                    var imageId = instance.ImageID.replace("https://","");
                    imageId = "dicomweb://"+imageId;
                    if(instance.NumberOfFrames == ""){
                      $scope.stack.imageIds[instance.InstanceNumber - 1] = imageId;
                      cornerstone.loadAndCacheImage(imageId)
                    }else{
                      for(var i = 0; i < instance.NumberOfFrames;i++){
                        // var index = parseInt(instance.InstanceNumber) + i - 1;
                        var index = i;
                        $scope.stack.imageIds[index] = imageId+"?frame=" + i;
                        cornerstone.loadAndCacheImage($scope.stack.imageIds[index])
                      }
                    }
                    $scope.totalFrame = $scope.stack.imageIds.length;
                    // Get the state of the stack tool
                    var stackState = cornerstoneTools.getToolState($element[0], 'stack');
                    if(stackState != undefined){
                      stackState.data[0] = $scope.stack;
                    }
                  }
                  return instance;
                },
                $$updated: function(dataSnapshot){
                  var instance = dataSnapshot.val(); //This is the data
                  var instanceId = dataSnapshot.key; //The instance id
                  if($scope.toolsEnable == true){
                    //Load Instance
                    var imageId = instance.ImageID.replace("https://","");
                    imageId = "dicomweb://"+imageId;
                    if(instance.NumberOfFrames == ""){
                      $scope.stack.imageIds[instance.InstanceNumber - 1] = imageId;
                      cornerstone.loadAndCacheImage(imageId);
                    }else{
                      for(var i = 0; i < instance.NumberOfFrames;i++){
                        // var index = parseInt(instance.InstanceNumber) + i - 1;
                        var index = i;
                        $scope.stack.imageIds[index] = imageId+"?frame=" + i;
                        cornerstone.loadAndCacheImage($scope.stack.imageIds[index]);
                      }
                    }
                    $scope.totalFrame = $scope.stack.imageIds.length;
                    // Get the state of the stack tool
                    var stackState = cornerstoneTools.getToolState($element[0], 'stack');
                    if(stackState != undefined){
                      stackState.data[0] = $scope.stack;
                    }
                  }
                  return false;
                }
            });

            var instancesList = new instanceListFactory(instanceListRef.orderByChild("InstanceNumber"));
            instancesList.$loaded().then(function(){
              var imageId = instancesList[0].ImageID.replace("https://","");
              imageId = "dicomweb://"+imageId;
              cornerstone.loadAndCacheImage(imageId).then(function(image){
                cornerstone.displayImage($element[0], image);
                cornerstone.resize($element[0], true);

                
                //Tools Config

                if($scope.toolsEnable == true){
                  // Activate mouse clicks, mouse wheel and touch
                  cornerstoneTools.mouseInput.enable($element[0]);
                  cornerstoneTools.mouseWheelInput.enable($element[0]);
                  cornerstoneTools.touchInput.enable($element[0]);
                  
                }
                //Active WW/WL
                $scope.$watch('toolsConfig.wwwc.actived',function(activated){
                  if(activated == true){
                    cornerstoneTools.wwwc.activate($element[0], 1);
                    cornerstoneTools.wwwcTouchDrag.activate($element[0]);
                  }else{
                    cornerstoneTools.wwwc.disable($element[0]);
                    cornerstoneTools.wwwcTouchDrag.deactivate($element[0]);
                  }
                });
                //Active Invert
                $scope.$watch('toolsConfig.invert.actived',function(activated){
                  var viewport = cornerstone.getViewport($element[0]);
                  viewport.invert = activated;
                  cornerstone.setViewport($element[0], viewport);
                });
                
                //Active Zoom tool
                $scope.$watch('toolsConfig.zoom.actived',function(activated){
                  if(activated == true){
                    cornerstoneTools.zoom.activate($element[0], 5); // 5 is right mouse button and left mouse button
                    cornerstoneTools.zoomTouchDrag.activate($element[0]);
                  }else{
                    cornerstoneTools.zoom.activate($element[0], 4); // 4 is right mouse button
                    cornerstoneTools.zoomTouchDrag.deactivate($element[0]);
                  }
                });
                //Active Pan tool
                $scope.$watch('toolsConfig.pan.actived',function(activated){
                  if(activated == true){
                    cornerstoneTools.pan.activate($element[0], 3); // 3 is middle mouse button and left mouse button
                    cornerstoneTools.panTouchDrag.activate($element[0]);
                  }else{
                    cornerstoneTools.pan.activate($element[0], 2); // 2 is middle mouse button
                    cornerstoneTools.panTouchDrag.deactivate($element[0]);
                  }
                });
                //Active Stack Scroll TouchDrag
                $scope.$watch('toolsConfig.stackScrollTouchDrag.actived',function(activated){
                  if(activated == true){
                    cornerstoneTools.stackScrollTouchDrag.activate($element[0]);
                  }else{
                    cornerstoneTools.stackScrollTouchDrag.deactivate($element[0]);
                  }
                });
                //Active Stack Scroll Tool
                $scope.$watch('toolsConfig.stackScroll.actived',function(activated){
                  if(activated == true){
                    cornerstoneTools.stackScroll.activate($element[0], 1);
                    cornerstoneTools.stackScrollWheel.activate($element[0]);
                    cornerstoneTools.stackScrollTouchDrag.activate($element[0]);
                  }else{
                    cornerstoneTools.stackScroll.deactivate($element[0], 1);
                    cornerstoneTools.stackScrollTouchDrag.deactivate($element[0]);
                  }
                });
                //Active Length measurement Tool
                $scope.$watch('toolsConfig.length.actived',function(activated){
                  if(activated == true){
                    cornerstoneTools.length.activate($element[0], 1);
                  }else{
                    cornerstoneTools.length.deactivate($element[0], 1);
                  }
                });
                //Active Angle measurement tool
                $scope.$watch('toolsConfig.angle.actived',function(activated){
                  if(activated == true){
                    cornerstoneTools.angle.activate($element[0], 1);
                  }else{
                    cornerstoneTools.angle.deactivate($element[0], 1);
                  }
                });
                // Pixel probe
                $scope.$watch('toolsConfig.probe.actived',function(activated){
                  if(activated == true){
                    cornerstoneTools.probe.activate($element[0], 1);
                  }else{
                    cornerstoneTools.probe.deactivate($element[0], 1);
                  }
                });
                // Elliptical ROI
                $scope.$watch('toolsConfig.ellipticalRoi.actived',function(activated){
                  if(activated == true){
                    cornerstoneTools.ellipticalRoi.activate($element[0], 1);
                  }else{
                    cornerstoneTools.ellipticalRoi.deactivate($element[0], 1);
                  }
                });
                // Rectangle ROI
                $scope.$watch('toolsConfig.rectangleRoi.actived',function(activated){
                  if(activated == true){
                    cornerstoneTools.rectangleRoi.activate($element[0], 1);
                  }else{
                    cornerstoneTools.rectangleRoi.deactivate($element[0], 1);
                  }
                });
                // Play clip
                $scope.$watch('toolsConfig.playClip.actived',function(activated){
                  if(activated == true){
                    var stackState = cornerstoneTools.getToolState($element[0], 'stack');
                    var frameRate = stackState.data[0].frameRate;
                    // Play at a default 10 FPS if the framerate is not specified
                    if (frameRate === undefined) {
                      frameRate = 10;
                    }
                    cornerstoneTools.playClip($element[0], frameRate);
                  }else{
                    cornerstoneTools.stopClip($element[0]);
                  }
                });

                $scope.$watch("currentFrame",function(currentFrame){
                  if(currentFrame != $scope.stack.currentImageIdIndex && $scope.stack.imageIds[currentFrame] != undefined){
                    cornerstone.loadAndCacheImage($scope.stack.imageIds[currentFrame]).then(function(image){
                      $scope.stack.currentImageIdIndex = currentFrame;
                      cornerstone.displayImage($element[0], image);
                    })
                  }
                });

                if($scope.scrollIndicator == true){
                  cornerstoneTools.scrollIndicator.enable($element[0]);
                }
              });
            });
          });
        }
    }
}]);