'use strict';
angular.module('ngAudio', [])
    .directive('ngAudio', ['$compile', '$q', 'ngAudio', function($compile, $q, ngAudio) {
        return {
            restrict: 'AEC',
            scope: {
                volume: '=',
                start: '=',
                currentTime: '=',
                loop: '=',
                clickPlay: '=',
                disablePreload:'='
                //ngAudio:'='
            },
            controller: function($scope, $attrs, $element, $timeout) {

                /* Loads the sound from destination */
                var audio;
                function initSound(){
                    audio = ngAudio.load($attrs.ngAudio);
                    /* Add audio to local scope for modification with nested inputs */
                    $scope.$audio = audio;

                    /* Remove watching features for improved performance */
                    audio.unbind();
                }

                if (!$scope.disablePreload){
                    initSound();
                }


                $element.on('click', function() {
                    if ($scope.clickPlay === false) {
                        return;
                    }

                    if ($scope.disablePreload){
                        initSound();
                    }

                    /* iOS workaround: Call the play method directly in listener function */
                    audio.audio.play();

                    /* Set volume to $scope volume if it exists, or default to audio's current value */
                    audio.volume = $scope.volume || audio.volume;
                    audio.loop = $scope.loop;
                    audio.currentTime = $scope.start || 0;

                    /* Fixes a bug with Firefox (???) */
                    $timeout(function() {
                        audio.play();
                    }, 5);
                });
            }
        };
    }])

    .directive('ngAudioHover', ['$compile', '$q', 'ngAudio', function($compile, $q, ngAudio) {
        return {
            restrict: 'AEC',
            controller: function($scope, $attrs, $element, $timeout) {

                var audio = ngAudio.load($attrs.ngAudioHover);

                $element.on('mouseover rollover hover', function() {

                    /* iOS workaround: Call the play method directly in listener function */
                    audio.audio.play();

                    audio.volume = $attrs.volumeHover || audio.volume;
                    audio.loop = $attrs.loop;
                    audio.currentTime = $attrs.startHover || 0;

                });
            }
        };
    }])

    .service('localAudioFindingService', ['$q', function($q) {

        this.find = function(id) {
            var deferred = $q.defer();
            var $sound = document.getElementById(id);
            if ($sound) {
                deferred.resolve($sound);
            } else {
                deferred.reject(id);
            }

            return deferred.promise;
        };
    }])

    .service('remoteAudioFindingService', ['$q', function($q) {

        this.find = function(url) {
            var deferred = $q.defer();
            var audio = new Audio();

            audio.addEventListener('error', function() {
                deferred.reject();
            });

            audio.addEventListener('loadstart', function() {
                deferred.resolve(audio);
            });

            // bugfix for chrome...
            setTimeout(function() {
                audio.src = url;
            }, 1);

            return deferred.promise;

        };
    }])

    .service('cleverAudioFindingService', ['$q', 'localAudioFindingService', 'remoteAudioFindingService', function($q, localAudioFindingService, remoteAudioFindingService) {
        this.find = function(id) {
            var deferred = $q.defer();

            id = id.replace('|', '/');

            localAudioFindingService.find(id)
                .then(deferred.resolve, function() {
                    return remoteAudioFindingService.find(id);
                })
                .then(deferred.resolve, deferred.reject);

            return deferred.promise;
        };
    }])

    .value('ngAudioGlobals', {
        muting: false,
        songmuting: false,
        performance: 25,
        unlock: true
    })

    .factory('NgAudioObject', ['cleverAudioFindingService', '$rootScope', '$interval', '$timeout', 'ngAudioGlobals', function(cleverAudioFindingService, $rootScope, $interval, $timeout, ngAudioGlobals) {
        return function(id) {

            if (ngAudioGlobals.unlock) {

                window.addEventListener("click",function twiddle(){
                    audio.play();
                    audio.pause();
                    window.removeEventListener("click",twiddle);
                });

            }


            var $audioWatch,
                $willPlay = false,
                $willPause = false,
                $willRestart = false,
                $willChangePlaybackRate = false,
                $newPlaybackRate = false,
                $volumeToSet,
                $looping,
                $isMuting = false,
                $observeProperties = true,
                audio,
                audioObject = this;

            this.id = id;
            this.safeId = id.replace('/', '|');
            this.loop = 0;

            this.unbind = function() {
                $observeProperties = false;
            };

            this.play = function() {
                $willPlay = true;
                return this;
            };

            var completeListeners = [];
            this.complete = function(callback){
                completeListeners.push(callback);
            }

            this.pause = function() {
                $willPause = true;
            };

            this.restart = function() {
                $willRestart = true;
            };

            this.stop = function() {
                this.restart();
            };

            this.setVolume = function(volume) {
                $volumeToSet = volume;
            };

            this.setPlaybackRate = function(rate) {
                $newPlaybackRate = rate;
                $willChangePlaybackRate = true;
            };

            this.setMuting = function(muting) {
                $isMuting = muting;
            };

            this.setProgress = function(progress) {
                if (audio && audio.duration && isFinite(progress)) {
                    audio.currentTime = audio.duration * progress;
                }
            };

            this.setCurrentTime = function(currentTime) {
                if (audio && audio.duration) {
                    audio.currentTime = currentTime;
                }
            };

            function $setWatch() {
                $audioWatch = $rootScope.$watch(function() {
                    return {
                        volume: audioObject.volume,
                        currentTime: audioObject.currentTime,
                        progress: audioObject.progress,
                        muting: audioObject.muting,
                        loop: audioObject.loop,
                        playbackRate: audioObject.playbackRate
                    };
                }, function(newValue, oldValue) {
                    if (newValue.currentTime !== oldValue.currentTime) {
                        audioObject.setCurrentTime(newValue.currentTime);
                    }

                    if (newValue.progress !== oldValue.progress) {
                        audioObject.setProgress(newValue.progress);
                    }
                    if (newValue.volume !== oldValue.volume) {
                        audioObject.setVolume(newValue.volume);
                    }

                    if (newValue.playbackRate !== oldValue.playbackRate) {
                        audioObject.setPlaybackRate(newValue.playbackRate);
                    }



                    $looping = newValue.loop;

                    if (newValue.muting !== oldValue.muting) {
                        audioObject.setMuting(newValue.muting);
                    }
                }, true);
            }

            cleverAudioFindingService.find(id)
                .then(function(nativeAudio) {
                    audio = nativeAudio;
                    audio.addEventListener('canplay', function() {
                        audioObject.canPlay = true;
                    });


                }, function(error) {
                    audioObject.error = true;
                    console.warn(error);
                });


            var interval = $interval(checkWatchers, ngAudioGlobals.performance);
            $rootScope.$watch(function(){
                return ngAudioGlobals.performance;
            },function(){
                $interval.cancel(interval);
                interval = $interval(checkWatchers, ngAudioGlobals.performance);
            })

            function checkWatchers() {
                if ($audioWatch) {
                    $audioWatch();
                }
                if (audio) {

                    if ($isMuting || ngAudioGlobals.isMuting) {
                        audio.volume = 0;
                    } else {
                        audio.volume = audioObject.volume !== undefined ? audioObject.volume : 1;
                    }

                    if ($willPlay) {
                        audio.play();
                        $(document).ready(function(){
                            var $cover=$(".player-cover")
                                ,$bars=$(".player-spectrum-bar")
                                ,$drops=$(".player-drops")
                                ,$spectrum=$(".player-spectrum")

                                ,paused=false

                                ,barWidth=$bars.width()
                                ,barHeight=$bars.height()

                                ,coverPos=$cover.position()
                                ,coverSize=$cover.width()
                                ,coverCenter=coverPos.left+(coverSize/2)
                                ,coverRadius=coverSize/2

                                ,spectrumPos=$spectrum.position().top
                                ,spectrumMargin=parseFloat($spectrum.css("marginTop"))
                                ,dropsPos=$drops.position()
                                ,distanceCoverFromDrops=dropsPos.top-coverPos.top-coverSize
                                ;

                            $.fn.animBar=function(v){
                                var $bar=$(this);

                                var min=0.1;
                                var setV=true
                                if(typeof v=="undefined"){
                                    v=min+(Math.random()*(1-min));
                                    setV=false;
                                }else{
                                    // v=Math.max(min,v)
                                }

                                if(v>parseFloat($bar.attr("data-scale")) && v>min){
                                    TweenMax.to($bar,v*(setV?0.6:0.2),{
                                        scaleY:v,
                                        attr:{
                                            "data-scale":v
                                        },
                                        ease:Quad.easeOut,
                                        onComplete:function(){
                                            TweenMax.to($bar,v*0.6,{
                                                scaleY:0.1,
                                                attr:{
                                                    "data-scale":0.1
                                                },
                                                ease:Quad.easeIn,
                                                onComplete:function(){
                                                    $bar.animBar(v*0.5)
                                                }
                                            });
                                        },
                                        onUpdate:function(){
                                            $bar.checkCoverDrops()
                                        }
                                    });

                                }
                                if(!setV && !paused){
                                    setTimeout(function(){
                                        $bar.animBar()
                                    },Math.random()*500);
                                }
                            }
                            $.fn.checkCoverDrops=function(){

                            }
                            function addDrop(x){
                                var $drop=$("<div/>")
                                    .addClass("player-drop")
                                    .css({
                                        left:x,
                                        top:dropTopPos(x)
                                    })
                                    .appendTo(".player-drops")
                                    ;
                                var distanceFromCenter=coverCenter-(x+(barWidth/2));
                                TweenMax.to($drop,Math.abs(distanceFromCenter)*0.06,{
                                    x:distanceFromCenter,
                                    y:Math.abs(distanceFromCenter)*0.3,
                                    ease:Quint.easeInOut,
                                    force3D:true,
                                    onComplete:function(){
                                        $drop.addClass('player-drop-ready')
                                        TweenMax.to($drop,1,{
                                            scaleY:1.5,
                                            ease:Quad.easeInOut
                                        })
                                    }
                                })

                            }
                            function dropDrops(){
                                var $readyDrops=$(".player-drop-ready");
                                TweenMax.to($readyDrops,0.4,{
                                    delay:0.2,
                                    y:distanceCoverFromDrops,
                                    scaleY:4,
                                    scaleX:0.5,
                                    force3D:true,
                                    ease:Quint.easeIn,
                                    onComplete:function(){
                                        $readyDrops.remove();
                                    }
                                })
                            }
                            setInterval(dropDrops,1000);

                            function dropTopPos(x){
                                return -distanceCoverFromDrops-(Math.abs((x+(barWidth/2))-coverCenter)*0.314)
                            }

                            function start() {
                                $bars.each(function(){
                                    var $cur=$(this);
                                    $cur.attr("data-scale",0.5);
                                    TweenMax.set($cur,{
                                        scaleY:0
                                    });
                                    $cur.animBar();
                                })
                            }

                            start();

                            $(".play-pause-button").click(function(){
                                paused=!paused;
                                if(!paused) {
                                    start();
                                    $(".fa-play").attr("class","fa fa-pause");
                                }else{
                                    $(".fa-pause").attr("class","fa fa-play");
                                }
                            })
                        })
                        $willPlay = false;
                    }

                    if ($willRestart) {
                        audio.pause();
                        audio.currentTime = 0;
                        $willRestart = false;
                    }

                    if ($willPause) {
                        audio.pause();
                        $willPause = false;
                    }

                    if ($willChangePlaybackRate) {
                        audio.playbackRate = $newPlaybackRate;
                        $willChangePlaybackRate = false;
                    }

                    if ($volumeToSet) {
                        audio.volume = $volumeToSet;
                        $volumeToSet = undefined;
                    }

                    if ($observeProperties) {
                        audioObject.currentTime = audio.currentTime;
                        audioObject.duration = audio.duration;
                        audioObject.remaining = audio.duration - audio.currentTime;
                        audioObject.progress = audio.currentTime / audio.duration;
                        audioObject.paused = audio.paused;
                        audioObject.src = audio.src;

                        if (audioObject.currentTime >= audioObject.duration) {
                            completeListeners.forEach(function(listener){
                                listener(audioObject);
                            })
                        }

                        if ($looping && audioObject.currentTime >= audioObject.duration) {
                            if ($looping !== true) {
                                $looping--;
                                audioObject.loop--;
                                // if (!$looping) return;
                            }
                            audioObject.setCurrentTime(0);
                            audioObject.play();

                        }
                    }

                    if (!$isMuting && !ngAudioGlobals.isMuting) {
                        audioObject.volume = audio.volume;
                    }

                    audioObject.audio = audio;
                }

                $setWatch();
            }
        };
    }])
    .service('ngAudio', ['NgAudioObject', 'ngAudioGlobals', '$q',function(NgAudioObject, ngAudioGlobals,$q) {
        var deferred = $q.defer();
        this.play = function(id) {

            var audio = new NgAudioObject(id);
            audio.play();
            audio.audio.addEventListener('play',function () {
                deferred.resolve(audio);

            });

            return audio;
        };

        this.load = function(id) {
            return new NgAudioObject(id);
        };

        this.mute = function() {
            ngAudioGlobals.muting = true;
        };

        this.unmute = function() {
            ngAudioGlobals.muting = false;
        };

        this.toggleMute = function() {
            ngAudioGlobals.muting = !ngAudioGlobals.muting;
        };

        this.setUnlock = function(unlock) {
            ngAudioGlobals.unlock = unlock;
        };
    }])
    .filter("trackTime", function(){
        /* Conveniently takes a number and returns the track time */

        return function(input){

            var totalSec = 0;

            // String manipulation
            var inputString = input ? input.toString() : "";
            for (var i = 0; i < inputString.length; i++){
                var dotIndex = inputString.indexOf(".");
                totalSec = parseInt(inputString.slice(0, dotIndex));
            }

            var output = "";
            var hours = 0;
            var minutes = 0;
            var seconds = 0;

            if (totalSec > 3599) {

                hours = Math.floor(totalSec / 3600);
                minutes = Math.floor((totalSec - (hours * 3600)) / 60);
                seconds = (totalSec - ((minutes * 60) + (hours * 3600)));

                if (hours.toString().length == 1) {
                    hours = "0" + (Math.floor(totalSec / 3600)).toString();
                }

                if (minutes.toString().length == 1) {
                    minutes = "0" + (Math.floor((totalSec - (hours * 3600)) / 60)).toString();
                }

                if (seconds.toString().length == 1) {
                    seconds = "0" + (totalSec - ((minutes * 60) + (hours * 3600))).toString();
                }

                output = hours + ":" + minutes + ":" + seconds;

            } else if (totalSec > 59) {

                minutes = Math.floor(totalSec / 60);
                seconds = totalSec - (minutes * 60);

                if (minutes.toString().length == 1) {
                    minutes = "0" + (Math.floor(totalSec / 60)).toString();
                }

                if (seconds.toString().length == 1) {
                    seconds = "0" + (totalSec - (minutes * 60)).toString();
                }

                output = minutes + ":" + seconds;

            } else {

                seconds = totalSec;

                if (seconds.toString().length == 1) {
                    seconds = "0" + (totalSec).toString();
                }

                output = totalSec + "s";

            }

            if (Number.isNaN(output)){
                debugger;
            }

            return output;
        }
    });