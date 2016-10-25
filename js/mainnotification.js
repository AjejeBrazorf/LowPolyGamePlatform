"use strict";
window.onload = function() {
    if ('serviceWorker' in navigator) {
        console.log('Service Worker is supported');
        navigator.serviceWorker.register('sw.js').then(function (reg) {
            console.log(':^) sw registrato', reg);
            if ('serviceWorker' in navigator) {
                console.log('Service Worker is supported, check is');
                checkSubscription();
            }
        }).catch(function (err) {
            console.log(':^( erroee registrazione sw ', err);
        });
    }
}

function checkSubscription() {
    var state=false;
    navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.getSubscription().then(
            function(pushSubscription) {
                if(!!pushSubscription) {
                    state=true;
                    console.log("push sub" + pushSubscription);
                    console.log(pushSubscription);
                }
                else {
                    console.log("no !!");
                    console.log("ci entro.. mmmjh");
                    //se il client non è iscritto lo iscrivo
                    navigator.serviceWorker.register('sw.js').then(function (reg) {
                        console.log(':^)', reg);
                        reg.pushManager.subscribe({
                            userVisibleOnly: true
                        }).then(function (sub) {
                            //invio l'iscrizione
                            sendsub(sub);
                            console.log('adesso sei iscritto ! endpoint:', sub);
                        });
                    }).catch(function (error) {
                        console.log(':^(', error);
                    });
                    state=false;
                }
                console.log("state" + state);
                return state;
            }.bind(this)).catch(function(e) {
            console.error('Error getting subscription', e);
        });
    });

}

function sendsub(sub) {
    const endPoint=sub.endpoint.slice(sub.endpoint.lastIndexOf('/')+1);
    var   subRef = new Firebase('https://nod-music.firebaseio.com/subscribe/');
    subRef.push(endPoint);
    console.log("subscrition sended");
}

