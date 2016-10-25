/**
 * Created by gianpaolobasilico on 23/5/16.
 */
if ('serviceWorker' in navigator) {
    console.log('Service Worker is supported');
    navigator.serviceWorker.register('sw.js').then(function(reg) {
        console.log(':^)', reg);
        // TODO
    }).catch(function(err) {
        console.log(':^(', err);
    });
}