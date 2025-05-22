angular.module('postService',[])
.factory('postFactory',function($http,$location,$timeout){
    var postData = {} ;
    postData.emploi = function(emploiData){
        return $http.post('stopgalereapi/fastEmploisLatest',emploiData).then(function(data){
            return data ;
        }) ;
    }
    return postData ;
});