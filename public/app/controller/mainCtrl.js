angular.module('mainCtrlModule',['authenService'])
.controller('mainCtrl',function($scope,authenFactory,$timeout,$location,$rootScope){
   

    $rootScope.$on('$routeChangeStart',function(){
        if (authenFactory.isLogging()) {
            console.log("Logging");
            authenFactory.getUser().then(function(data){
               //console.log(data.data);
               var tokenValide = typeof(data.data.success) == "undefined" ? true : data.data.success;
              // console.log(tokenValide);
               //console.log(data.data.success);
               
              if(!tokenValide){
                   //console.log("fdsfsdfs");
                   
                 authenFactory.logout() ;
               }
               
                
            }) ;
        }else{
            console.log("no user");
            
        }
       // if($location.hash() == '_=_') $location.hash(null) ;
    });

   

    /*$scope.postNewEmploi = function() {
        console.log('sfdsfdsfdffd');
        
    }*/

    $scope.logUser = function(logData){
        
        authenFactory.login(logData).then(function(res){
            $scope.failMessage = false ;
            
            if(res.data.success){
                $scope.SuccessMessage = res.data.message ;
                $timeout(()=>{
                    $location.path('/webmanager')
                },2000) ;
                
            }else{
                $scope.failMessage = res.data.message ;
            }
            
        })
        
    }
    $scope.outUser = function(){
        authenFactory.logout() ;
    }
});