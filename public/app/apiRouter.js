var appRouter = angular.module('apiRoute',['ngRoute'])
.config(($routeProvider,$locationProvider)=>{
    $routeProvider
        .when('/',{
                //templateUrl : 'app/view/page/home.html'
                templateUrl : 'app/view/page/repare/index.html',
                authenticated : false
            })
        .when('/about',{
                templateUrl : 'app/view/page/about.html',
                authenticated : false
            })
        .when('/stoplogin',{
            templateUrl : 'app/view/page/user/login.html',
            authenticated : false
        })

        .when('/webmanager',{
            templateUrl : 'app/view/webmanager/index.html',
            controller : 'getCtrl' ,
            authenticated : true
        })
        .when('/webmanager/addjob',{
            templateUrl : 'app/view/webmanager/addjob.html',
            controller : 'getCtrl' ,
            authenticated : true
        })
        .when('/webmanager/lettre-motivation',{
            templateUrl : 'app/view/webmanager/lettremotivation.html',
            controller : 'lettreCtrl' ,
            authenticated : true
        })
        .when('/webmanager/lettre-motivation/:id',{
            templateUrl : 'app/view/webmanager/lettremotivation.html',
            controller : 'lettreCtrl' ,
            authenticated : true
           })
        .when('/webmanager/cv',{
         templateUrl : 'app/view/webmanager/cv.html',
         controller : 'cvCtrl',
         authenticated : true
        })
        .when('/webmanager/cv/:id',{
            templateUrl : 'app/view/webmanager/cv.html',
            controller : 'cvCtrl',
            authenticated : true
           })
        .when('/webmanager/image-entreprise',{
         templateUrl : 'app/view/webmanager/image.html',
         controller : 'imageCtrl' ,
         authenticated : true
        })
        .when('/webmanager/edit/:id',{
         templateUrl : 'app/view/webmanager/editjob.html',
         controller : 'editCtrl' ,
         authenticated : true
        })
        .when('/webmanager/options/',{
            templateUrl : 'app/view/webmanager/options.html',
            controller : 'optionCtrl' ,
            authenticated : true
           })
        .when('/webmanager/options/:id',{
            templateUrl : 'app/view/webmanager/options.html',
            controller : 'optionCtrl' ,
            authenticated : true
        })
        .when('/webmanager/planifier',{
            templateUrl : 'app/view/webmanager/planifier.html',
            //controller : 'optionCtrl' ,
            authenticated : true
        })
        .when('/webmanager/notifications',{
            templateUrl : 'app/view/webmanager/notifications.html',
            controller : 'notifocationCtrl' ,
            authenticated : true
        })
        .when('/webmanager/historique',{
            templateUrl : 'app/view/webmanager/historique.html',
            //controller : 'optionCtrl' ,
            authenticated : true
        })
        .when('/webmanager/condition',{
         templateUrl : 'app/view/webmanager/condition_general.html',
         controller : 'conditionCtrl' ,
         authenticated : true
        })
        .otherwise({redirectTo : '/'});
    
    $locationProvider.html5Mode({
         enabled : true ,
        requireBase : false
    });
});

appRouter.run(['$rootScope','authenFactory','$location',function($rootScope,authenFactory,$location){
    $rootScope.$on('$routeChangeStart',function(event,next,current){
        if (next.$$route.authenticated == true) {
            if (!authenFactory.isLogging()) {
                $location.path('/');
            }
        }else if (next.$$route.authenticated == false) {
            if (authenFactory.isLogging()) {
                $location.path('/webmanager');
            }
        }
        
    });
}]);



