angular.module('postCtrlModule',[])
.controller('postCtrl',function($scope,$timeout,$location){
    
    $scope.postEmploi = function(emploiData){
        

        console.log(emploiData);
        
       /* postFactory.emploi(emploiData).then(function(res){
            console.log(res.data.name);
            $scope.failMessage = false ;

            if(res.data.success){
                $scope.SuccessMessage = res.data.message ;
                $timeout(()=>{
                    $location.path('/webmanager')
                },2000) ;
                
            }else{
                $scope.failMessage = res.data.message ;
            }
            
        });*/
        
    }
   
});