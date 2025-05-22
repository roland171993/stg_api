angular.module('apiModule',['apiRoute','mainCtrlModule','authenService','postService','postCtrlModule','getCtrlModule','getService'])
.config(function($httpProvider){
    $httpProvider.interceptors.push('AuthInterceptors');
});
