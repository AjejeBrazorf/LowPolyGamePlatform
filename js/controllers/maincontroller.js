myApp.controller('mainCtrl', function ($scope, $rootScope){
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
        } else {
            // User is signed out.
            // ...
            if($rootScope.identita.type=="server") {
                firebase.database().ref('servers/' + serverId).set({

                });
            }
        }
        // ...
    });
    $rootScope.serverImg="img/server.png";
    $rootScope.idColors=["#04a0ca","#6a8c9c","#04ca3c","#ca7604","#7904ca","#FFEB3B"];
    $rootScope.avatarList = [];
    for (var i = 1; i <= 12; i++) {
        $rootScope.avatarList .push(i+".png");
    }
});

myApp.controller('playServerCtrl', function ($scope, $rootScope, $state, $firebaseArray, $firebaseObject,GAMEURL){
    if($rootScope.identita.type=="none"){
        $state.go("home");
    }
    if($rootScope.identita.type=="server") {
        var serversRef = firebase.database().ref('servers/'+$rootScope.identita.uid);
        serversRef.on('value', function(snapshot) {
            $scope.players=snapshot.val().players;
            console.log("novita players in Server");
            $scope.$apply()
        });
    }

});

myApp.controller('playGamerCtrl', function ($scope, $rootScope, $state, $firebaseArray, $firebaseObject,GAMEURL){
    if($rootScope.identita.type=="none"){
        $state.go("home");
    }
});

myApp.controller('homeCtrl', function ($scope, $rootScope, $state, $timeout){
    $scope.showServers=false;
    $scope.createServer= function(){
        $rootScope.identita.type="server";
        $rootScope.identita.color=0;
        $rootScope.identita.img="img/server.png";
        $rootScope.identita.pass="";
    };
    $scope.createGamer= function(){
        $rootScope.identita.type="gamer";
        $rootScope.identita.color=1;
        $rootScope.identita.img="img/joypad.png";
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
            subscribeGamerToServer($rootScope.identita.uid, $rootScope.identita.name,$scope.idColors[$rootScope.identita.color],$rootScope.identita.avatar, i);
            $timeout(function(){$state.go("playGamer");}, 1000);
        }
    };

    $scope.isMyPasswordOk=function(i,myP){
        console.log($scope.serverNames[i].pass);
        console.log(myP);
          if($scope.serverNames[i].pass==myP){
              subscribeGamerToServer($rootScope.identita.uid, $rootScope.identita.name,$scope.idColors[$rootScope.identita.color],$rootScope.identita.avatar, i);
          }
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

    var serversRef = firebase.database().ref('servers');
    serversRef.on('value', function(snapshot) {
        $scope.serverNames=snapshot.val();
        console.log("novitaServers");
        if($rootScope.identita.type=="gamer") {$scope.$apply();}
    });

    var gamersRef = firebase.database().ref('gamers');
    gamersRef.on('value', function(snapshot) {
        $scope.gamerNames=snapshot.val();
        console.log("novitaGamers");
    });
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

function subscribeGamerToServer(gamerId, gamerName, gamerColor, gamerAvatar, serverId) {
    firebase.database().ref('servers/' + serverId+'/players/'+gamerId).update({
        name: gamerName,
        color: gamerColor,
        avatar: gamerAvatar
    });
}


/*

*/