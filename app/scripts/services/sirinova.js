window.SiriNova = new function(){

	var rootRef = firebase.database().ref();
	var messageRef = rootRef.child('messages');
	var roomRef = rootRef.child('rooms');
	var userRef = rootRef.child('users');
	var fileRef = rootRef.child('files');
	var storeRef = firebase.storage().ref();


	this.$user = function(){
		var user = {};
		user.$profileRef = function(uid){
			return userRef.child(uid+"/meta");
		}

		user.$ref = function(uid){
			return userRef.child(uid);
		};

		user.$uploadProfileImage = function(userId,file,complete){
			var fileType = file.type;
	      	switch(fileType){
	        	case 'image/jpeg':
	        	case 'image/png':
	            	var metaData = {
	              		contentType: fileType
	              	}
	            	var uploadTask = storeRef.child('profileImage/'+userId).put(file,metaData);
	            	uploadTask.on('state_changed', function(snapshot){
		              	switch (snapshot.state) {
		                	case firebase.storage.TaskState.PAUSED: // or 'paused'
		                  		break;
		                	case firebase.storage.TaskState.RUNNING: // or 'running'
		                  		// $scope.uploadFile.array[key].processing = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
		                  		// $scope.$apply();
		                  	break;
		              	}
	            	}, function(error) {
	            		complete(error);
	              	// Handle unsuccessful uploads
	            	}, function() {
	              		var metadata = uploadTask.snapshot.metadata;
	              		userRef.child(userId+"/meta/photoURL").set(metadata.downloadURLs[0]);
	              		complete(null);
	            	});
	            break;
          	}
		}

		user.$updateBasicProfile = function(userId,email,displayName){
			userRef.child(userId+"/meta").set({
				email: email,
				displayName: displayName
			});
		}
		return user;
	}

	this.$room = function(){
		var room = {};
		room.$ref = roomRef;

		// Get Room 
		room.$getRoom = function(roomId,privateRoom){
			if(privateRoom){

			}else{
				return roomRef.child(roomId);
			}
		}
		// Get messages
		room.$messages = messageRef;
		// Send message
		room.$sendMessage = function(userId,roomId,privateRoom,message,complete){
			console.log("send new message");
			if(message == null || message == ""){
				complete(null);
				return;
			}
			console.log(message);
			console.log(userId);
			
			var newMessage = messageRef.push({
				message: message,
				senderId: userId,
				timeStamp: new Date().getTime()
			});
			if(privateRoom){

			}else{
				roomRef.child(roomId).child('messages').child(newMessage.key).set(false);
			}
			complete(newMessage.key);
		};

		return room;
	}
	
	this.$storage = function(){
		var storage = {};

		storage.$ref = storeRef;

		storage.$refFromURL = function(url){
			return firebase.storage().refFromURL(url);
		}

		return storage;
	}

	this.$files = function(){
		var files = {};

		files.$ref = fileRef;

		

		return files
	}


	

	// this.sendMessage = function(userId,roomId,message,complete){
	// 	console.log("send new message");
	// 	var newMessage = this.messageRef.push({
	// 		message: message,
	// 		senderId: userId,
	// 		timeStamp: new Date().getTime()
	// 	});
	// 	this.roomRef.child(roomId).child('messages').child(newMessage.key).set(true);
	// 	complete(newMessage.key);
	// };
};