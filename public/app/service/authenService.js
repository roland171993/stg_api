angular.module('authenService',[])
.factory('authenFactory',function($http,authenToken,$location,$timeout){
    var authen = {} ;
    authen.login = function(logData){
        return $http.post('stopgalereapi/authenticate',logData).then(function(data){
         //   console.log(data.data.token);
            authenToken.setToken(data.data.token);
            return data ;
        }) ; 
    }
    authen.isLogging = function(){
        if(authenToken.getToken()){
            return true ;
        }else{
            return false ;
        }
    };
    authen.logout = function(){
        authenToken.removeToken();
        $timeout(()=>{
            $location.path('/') ;
        },2000);
    };
    authen.getUser = function(){
        if (authenToken.getToken()) {
            return $http.post('stopgalereapi/me');
        }else{
            $q.reject({message : 'user has no token'}) ;
        }
    }
    return authen ;
})
.factory('authenToken',function($window){
    var  authenTokenFactory = {} ;
    authenTokenFactory.setToken = function(token){
        $window.localStorage.setItem('token',token)
    };
    authenTokenFactory.getToken = function(){
        return $window.localStorage.getItem('token')
    };
    authenTokenFactory.removeToken = function(){
        $window.localStorage.removeItem('token')
    };
    return authenTokenFactory ;
})
.factory('AuthInterceptors',function(authenToken){
    var authInterceptorsFactory = {} ;

    authInterceptorsFactory.request = function(config){
        var token = authenToken.getToken() ;
        if (token) config.headers['x-access-token'] = token ;
        return config ;
    };
    return authInterceptorsFactory ;
});