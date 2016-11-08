myApp.controller('mainCtrl', function ($scope, $rootScope, $state){
    $rootScope.identita={};
    $rootScope.identita.type="none";
    $rootScope.identita.name="";
    firebase.auth().signInAnonymously().catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // ...
        console.log(errorCode+": "+errorMessage);
    });

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in.
            var isAnonymous = user.isAnonymous;
            var uid = user.uid;
            // ...
            $rootScope.identita.uid=uid;
        }
    });

    $rootScope.serverImg="img/server.png";
    $rootScope.idColors=["#04a0ca","#6a8c9c","#04ca3c","#ca7604","#7904ca","#FFEB3B"];
    $rootScope.avatarList = [];
    for (var i = 1; i <= 12; i++) {
        $rootScope.avatarList .push(i+".png");
    }

    var serversRef = firebase.database().ref('servers');
    serversRef.on('value', function(snapshot) {
        $scope.$apply(function(){
            $scope.serverNames=snapshot.val()
        });

        console.log("novitaServers");
        if($rootScope.identita.type=="gamer") {
            if($rootScope.identita.server!=null){
                var deleteServer= true;
                angular.forEach($scope.serverNames, function (item) {
                    console.log(item.name);
                    if (item.name == $rootScope.identita.server.name) {
                        deleteServer= false;
                    }
                });
                if(deleteServer==true){
                    console.log("deleting server");
                    firebase.database().ref('gamers/' + $rootScope.identita.uid+'/server').remove();
                    $rootScope.identita.server==null;
                    if($state.is("home")==false){
                        $state.go("home",{'showServers':true});
                    }
                }else{
                    console.log("not deleting server");
                    console.log(item);
                    firebase.database().ref('gamers/' + $rootScope.identita.uid+'/server').update(item);
                }
            }
            // $scope.$apply();
        }else{
            console.log("i am not gamer i am "+$rootScope.identita.type+" or maybe i am not connected to any server: "+$rootScope.identita.server);
            console.log($rootScope.identita.server);
        }
    });

    var gamersRef = firebase.database().ref('gamers');
    gamersRef.on('value', function(snapshot) {
        $scope.gamerNames=snapshot.val();
        console.log("novitaGamers");
        if($rootScope.identita.type=="gamer") {
            var tmpId=$rootScope.identita.uid;
            $rootScope.identita=$scope.gamerNames[$rootScope.identita.uid];
            if($rootScope.identita!=null)$rootScope.identita.uid=tmpId;
            $rootScope.identita.type="gamer";
        }
    });

});

myApp.controller('playServerCtrl', function ($scope, $rootScope, $state, $firebaseArray, $firebaseObject,GAMEURL){
    if($rootScope.identita.type=="none"){
        $state.go("home");
    }
    $scope.thereIsAMaster=false;

    if($rootScope.identita.type=="server") {
        var serversRef = firebase.database().ref('servers/'+$rootScope.identita.uid);
        serversRef.on('value', function(snapshot) {
            $scope.$apply(function() {
                $scope.players = snapshot.val().players;
                $rootScope.identita.players=$scope.players;
                if( $scope.players!=null){
                    console.log("novita players in Server");
                    if(Object.keys($scope.players).length==1){
                        console.log("should be the master");
                        $scope.thereIsAMaster=true;
                        $scope.players = snapshot.val().players;
                        angular.forEach(snapshot.val().players, function(value, key){
                            $scope.players[key].isMaster=true;
                            firebase.database().ref('servers/'+$rootScope.identita.uid+'/players/'+key).update({
                                isMaster: true
                            });
                            firebase.database().ref('gamers/'+key).update({
                                isMaster: true
                            });
                        });
                    }else {
                        console.log("controllo se c'è un master perché ci sono novita gamers, vediamo");
                        console.log($rootScope.identita);
                        $scope.thereIsAMaster = false;
                        angular.forEach($rootScope.identita.players, function (value, key) {
                            console.log("value= " + value);
                            console.log("key =" + key);
                            if (value.isMaster == true) {
                                $scope.thereIsAMaster = true;
                            }
                        });
                    }
                }else{
                    $scope.thereIsAMaster = false;
                }
            });

            if($scope.players!=null) {
                if ($scope.thereIsAMaster == false) {
                    angular.forEach(snapshot.val().players, function (value, key) {
                        $scope.players[key].requestToBeMaster = true;
                        firebase.database().ref('servers/' + $rootScope.identita.uid + '/players/' + key).update({
                            requestToBeMaster: true
                        });
                        firebase.database().ref('gamers/' + key).update({
                            requestToBeMaster: true
                        });
                    });
                }
            }

            angular.forEach(snapshot.val().players, function (value, key) {
                $scope.players[key].requestToBeMaster = true;
                firebase.database().ref('gamers/' + key +'/server/players').update(snapshot.val().players);
            });
        });
    }

});

myApp.controller('playGamerCtrl', function ($scope, $rootScope, $state, $firebaseArray, $firebaseObject,GAMEURL){
    if($rootScope.identita.type=="none"||$rootScope.identita.server==null){
        $state.go("home");
    }
});

myApp.controller('homeCtrl', function ($scope, $rootScope, $state, $timeout, $stateParams){
    if($stateParams.showServers==null){
        $scope.showServers=false;
    }else{
        $scope.showServers=$stateParams.showServers;
    }
    if($scope.showServers==true){
        $scope.showErrorDisconnectedFromServer=true;
    }
    $scope.NameShouldFocus=false;
    console.log($scope.NameShouldFocus);

    $scope.createServer= function(){
        $rootScope.identita.type="server";
        $rootScope.identita.color=0;
        $scope.NameShouldFocus=true;
        console.log($scope.NameShouldFocus);
        $rootScope.identita.img="img/server.png";
        $rootScope.identita.pass="";
        $rootScope.disconectref = firebase.database().ref($rootScope.identita.type+"s/"+$rootScope.identita.uid);
        $rootScope.disconectref.onDisconnect().remove();
        firebase.database().ref("uids/"+$rootScope.identita.uid).onDisconnect().remove();
    };
    $scope.createGamer= function(){
        $rootScope.identita.type="gamer";
        $rootScope.identita.color=1;
        $scope.NameShouldFocus=true;
        console.log($scope.NameShouldFocus);
        $rootScope.identita.img="img/joypad.png";
        $rootScope.disconectref = firebase.database().ref($rootScope.identita.type+"s/"+$rootScope.identita.uid);
        $rootScope.disconectref.onDisconnect().remove();
        firebase.database().ref("uids/"+$rootScope.identita.uid).onDisconnect().remove();
    };

    $scope.writeData=function(){
        firebase.database().ref('uids/' + $rootScope.identita.uid).set({
            type: $rootScope.identita.type
        });

        if($rootScope.identita.type=="server") {
            createServerData($rootScope.identita.uid, $rootScope.identita.name,$rootScope.identita.pass,$scope.havePassword, $scope.idColors[$rootScope.identita.color]);
            $state.go('playServer');
        }
        if($rootScope.identita.type=="gamer") {
            createGamerData($rootScope.identita.uid, $rootScope.identita.name,$scope.idColors[$rootScope.identita.color], $rootScope.identita.avatar);
            $scope.showServers=true;
        }
    };

    $scope.checkHasPassowrd=function(i){
        $scope.showModalPass=i;
        if($scope.serverNames[i].pass==null){
            $scope.subscribeGamerAndRedirect(i);
        }
    };

    $scope.isMyPasswordOk=function(i,myP){
        console.log($scope.serverNames[i].pass);
        console.log(myP);
        if($scope.serverNames[i].pass==myP){
            $scope.subscribeGamerAndRedirect(i);
        }

    };

    $scope.subscribeGamerAndRedirect=function(i){
        console.log($rootScope.identita);
        console.log($rootScope.identita.uid+", "+$rootScope.identita.name+", "+$rootScope.identita.color+", "+$rootScope.identita.avatar+", "+$scope.serverNames[i]+", "+i);
        subscribeGamerToServer($rootScope.identita.uid, $rootScope.identita.name,$rootScope.identita.color,$rootScope.identita.avatar, $scope.serverNames[i],i);
        $rootScope.identita.server=$scope.serverNames[i];
        $scope.connecting=true;
        $rootScope.disconectrefGamer = firebase.database().ref('servers/' + i+'/players/'+$rootScope.identita.uid);
        $rootScope.disconectrefGamer.onDisconnect().remove();
        $rootScope.disconectrefGamerInServer = firebase.database().ref('gamers/'+$rootScope.identita.uid+'/server');
        $rootScope.disconectrefGamerInServer.onDisconnect().remove();
        $timeout(function(){$state.go("playGamer");}, 1000);
    };

    $scope.checkName= function(){
        tmp=false;
        if($rootScope.identita.type=="server") {
            angular.forEach($scope.serverNames, function (item) {
                console.log(item.name);
                if (item.name == $rootScope.identita.name) {
                    tmp = true;
                }
            });
        }
        if($rootScope.identita.type=="gamer") {
            angular.forEach($scope.gamerNames, function (item) {
                console.log(item.name);
                if (item.name == $rootScope.identita.name) {
                    tmp = true;
                }
            });
        }
        $scope.notValidName=tmp;
    };

});

function createServerData(serverId, name, pass, havePassword, color) {
    firebase.database().ref('servers/' + serverId).set({
        name: name,
        color: color
    });
    if(havePassword==true){
        firebase.database().ref('servers/' + serverId).update({
            pass: pass
        });
    }
}

function createGamerData(gamerId, name, color, avatar) {
    firebase.database().ref('gamers/' + gamerId).set({
        name: name,
        color: color,
        avatar: avatar
    });
}

function subscribeGamerToServer(gamerId, gamerName, gamerColor, gamerAvatar, server,serverId) {
    firebase.database().ref('servers/' + serverId+'/players/'+gamerId).update({
        name: gamerName,
        color: gamerColor,
        avatar: gamerAvatar
    });
    server.id=serverId;
    firebase.database().ref('gamers/'+gamerId+'/server').update(server);
}


/*

 */