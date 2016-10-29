'use strict';
var myApp=angular.module('mainApp',['firebase','ngSanitize','ui.router','ngTouch'])
    .constant('GAMEURL','https://gameplatform-f07aa.firebaseio.com/')
    .config(function($stateProvider,$urlRouterProvider) {
        $stateProvider.
            state('playServer',{
                url:'/playServer',
                templateUrl: 'views/playserver.html',
                controller: 'playServerCtrl'
            })
            .state('playGamer',{
                url:'/playGamer',
                templateUrl: 'views/playgamer.html',
                controller: 'playGamerCtrl'
            })
            .state('home',{
                 url:'/home',
                 templateUrl: 'views/home.html',
                 params: {
                     showServers: null
                 },
                 controller: 'homeCtrl'
            });
        $urlRouterProvider.otherwise('home');
    })

    .directive('focusWhen', function() {
        return {
            scope: {
                focusWhen: '='
            },
            link: function($scope, $element) {

                $scope.$watch('focusWhen', function(shouldFocus) {
                    if (shouldFocus) {
                        $element[0].focus();
                    }
                });

            }
        };
    });
