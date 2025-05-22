angular.module('getService',[])
.factory('getFactory',function($http,$location,$timeout){
    var getData = {} ;
    getData.information = function(){
        return $http.get('stopgalereapi_get/getnewemploichamp').then(function(data){
            return data ;
        }) ;
    } ;
    getData.getAllemploi = function(){
        return $http.get('stopgalereapi_get/emplois').then(function(data){
            return data ;
        }) ;
    };
    getData.getCondition = function(){
        return $http.get('stopgalereapi_get/condition-utilisateur').then(function(data){
            return data ;
        }) ;
    };
    getData.getConditionForId = function(id){
        return $http.get('stopgalereapi_get/condition-utilisateur/'+id).then(function(data){
            return data ;
        }) ;
    };
    getData.getemploiforid = function(id){
        return $http.get('stopgalereapi_get/emploiDesription/'+id).then(function(data){
            return data ;
        }) ;
    };


    getData.getAllLettreMotivation = function(){
        return $http.get('stopgalereapi_get/LeMotivations').then(function(data){
            return data ;
        }) ;
    };

    getData.getAllLettreMotivationForId = function(id){
        return $http.get('stopgalereapi_get/LeMotivations/'+id).then(function(data){
            return data ;
        }) ;
    }; 
    getData.getAllCvForId = function(id){
        return $http.get('stopgalereapi_get/cvDescription/'+id).then(function(data){
            return data ;
        }) ;
    };
    getData.getAllLettreImage = function(){
        return $http.get('stopgalereapi_get/image/').then(function(data){
            return data ;
        }) ;
    };
   getData.getAllCv = function(){
        return $http.get('stopgalereapi_get/cv').then(function(data){
            return data ;
        }) ;
    };

    //Secteur 
    getData.getAllSecteurActivity = function(){
        return $http.get('stopgalereapi_get/secteur').then(function(data){
            return data ;
        }) ;
    };

    // Mode
    getData.getAllModeActivity = function(){
        return $http.get('stopgalereapi_get/mode').then(function(data){
            return data ;
        }) ;
    };

    // Sexe

    getData.getAllSexeActivity = function(){
        return $http.get('stopgalereapi_get/sexe').then(function(data){
            return data ;
        }) ;
    };

    //Contrat

    getData.getAllContratActivity = function(){
        return $http.get('stopgalereapi_get/contrat').then(function(data){
            return data ;
        }) ;
    };

    getData.getUpdateVersionApp = function(){
        return $http.get('stopgalereapi_get/fastCurrentVersion').then(function(data){
            return data ;
        }) ;
    };
    getData.pub = function(){
        return $http.get('stopgalereapi_get/advertiser').then(function(data){
            return data ;
        }) ;
    };
    return getData ;
})
.factory('postFactory',function($http,$location,$timeout){
    var postData = {} ;
    postData.emploi = function(emploiData){
        return $http.post('stopgalereapi/fastEmploisLatest',emploiData).then(function(data){
            return data ;
        }) ;
    };
    postData.letterMotivation = function(lettreData){
        return $http.post('stopgalereapi/LeMotivations',lettreData).then(function(data){
            return data ;
        }) ;
    }
    
    postData.cv = function(cvData){
        return $http.post('/upload',cvData).then(function(data){
            return data ;
        }) ;
    };
    postData.condition = function(condition){
        return $http.post('stopgalereapi/condition-utilisateur',condition).then(function(data){
            return data ;
        }) ;
    }

    // field select
    postData.postNewSecteur = function(secteur){
        return $http.post('stopgalereapi/secteur',secteur).then(function(data){
            return data ;
        }) ;
    };
    postData.postNewSexe = function(sexe){
        return $http.post('stopgalereapi/sexe',sexe).then(function(data){
            return data ;
        }) ;
    };

    postData.postNewMode = function(mode){
        return $http.post('stopgalereapi/mode',mode).then(function(data){
            return data ;
        }) ;
    };
    postData.postNewContrat = function(contrat){
        return $http.post('stopgalereapi/contrat',contrat).then(function(data){
            return data ;
        }) ;
    }
    return postData ;
})
.factory('deleteFactory',function($http,$location,$timeout){
    var deleteData = {} ;
    deleteData.deleteid = function(id){
        return $http.delete('stopgalereapi/deleteemploi/'+id).then(function(data){
            return data ;
        }) ;
    };
    
    deleteData.deleteLettreForMotivationId = function(id){
        return $http.delete('stopgalereapi/deletelettre/'+id).then(function(data){
            return data ;
        }) ;
    };
    deleteData.deleteCvForMotivationId = function(id){
        return $http.delete('stopgalereapi/deletecv/'+id).then(function(data){
            return data ;
        }) ;
    };
    deleteData.deleteConditionId = function(id){
        return $http.delete('stopgalereapi/condition-utilisateur/'+id).then(function(data){
            return data ;
        }) ;
    };
    deleteData.deleteSecteurId = function(id){
        return $http.delete('stopgalereapi/secteur/'+id).then(function(data){
            return data ;
        }) ;
    }; 
    deleteData.deleteContratId = function(id){
        return $http.delete('stopgalereapi/contrat/'+id).then(function(data){
            return data ;
        }) ;
    }; 
    deleteData.deleteModeId = function(id){
        return $http.delete('stopgalereapi/mode/'+id).then(function(data){
            return data ;
        }) ;
    };
    deleteData.deleteSexeId = function(id){
        return $http.delete('stopgalereapi/sexe/'+id).then(function(data){
            return data ;
        }) ;
    };
    return deleteData ;
})

.factory('putFactory',function($http,$location,$timeout){
    var putData = {} ;
    putData.updateEmploi = function(id , emploi){
        return $http.put('stopgalereapi/fastEmploisLatest/'+id , emploi).then(function(data){
            return data ;
        }) ;
    };

     putData.updateLettre = function(id , lettre){
        return $http.put('stopgalereapi/LeMotivations/'+id , lettre).then(function(data){
            return data ;
        }) ;
    };
    
    putData.updateCv = function(id , cv){
        return $http.put('stopgalereapi/cv/'+id , cv).then(function(data){
            return data ;
        }) ;
    };

    putData.updateCondition = function(id , condition){
        return $http.put('stopgalereapi/condition-utilisateur/'+id , condition).then(function(data){
            return data ;
        }) ;
    };
    
    putData.updateAppVersion = function(id , condition){
        return $http.put('stopgalereapi/fastCurrentVersion/'+id , condition).then(function(data){
            return data ;
        }) ;
    };
    putData.agence = function(id , don){
        return $http.put("stopgalereapi/advertiser/"+ id , don).then(function(data){
            return data ;
        }) ;
    };
    return putData ;
});
