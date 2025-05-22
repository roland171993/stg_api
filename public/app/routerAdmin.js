angular.module('routerwebmanger',['ngRoute'])
.config(($routeProvider,$locationProvider)=>{
    $routeProvider
        .when('/webmanager/lisjob',{
                templateUrl : 'app/view/webmanager/lisjob.html'
            })
        .when('/webmanager/addjob',{
                templateUrl : 'app/view/page/about.html'
            })
        .when('/webmanager/cv',{
             templateUrl : 'app/view/page/user/register.html',
             controller : 'useruserCtrl'
            })
        .otherwise({redirectTo : '/webmanager/lisjob'});
    
    $locationProvider.html5Mode({
         enabled : true ,
        requireBase : false
    });
});
