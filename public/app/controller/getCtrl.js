angular.module('getCtrlModule',['ngUpload'])
.controller('getCtrl',function($scope,deleteFactory,$timeout,$location , getFactory , postFactory){

  function ree(){
        getFactory.information().then(function(data){
           $scope.data = data.data;
        }) ;
    }
    ree() ;
//Get All Emploi
function getemploi(){
        getFactory.getAllemploi().then(function(data){
           $scope.donnee = data.data; 
           
        }) ;
    }
    getemploi() ;




    $scope.postNewEmploi = function(emploiData){
        console.log(emploiData);
        postFactory.emploi(emploiData).then(function(res){
            $scope.failMessage = false ;
            
            if(res.data.success){
                $scope.SuccessMessage = res.data.message ;
                $timeout(()=>{
                    $location.path('/webmanager')
                },2000) ;
                
            }else{
                $scope.failMessage = res.data.message ;
            }
            
        }) ;
    };  

    $scope.deleteforid = function(id){
        deleteFactory.deleteid(id).then(function(data){
            $scope.failMessage = false ;
            
            if(data.data.success){
                
                $timeout(()=>{
                    console.log('sddsdsds');
                    
                    $location.path('/webmanager');
                    getemploi() ;
                    $scope.SuccessMessage = data.data.message ;
                },100) ;
                
            }else{
                $scope.failMessage = data.data.message ;
            }
        })
    };




    
   
})
.controller('lettreCtrl',function(getFactory,$routeParams, $route, deleteFactory,$location,$scope,putFactory,postFactory , $timeout , $location){

    function getAllLettre(){
       
        getFactory.getAllLettreMotivation().then(function(data){
           $scope.donnee = data.data; 
           
        }) ;
    }
    getAllLettre() ;

    $scope.postNewLettre = function(lettreData){
        postFactory.letterMotivation(lettreData).then(function(res){
            $scope.failMessage = false ;
            
            if(res.data.success){
                $scope.SuccessMessage = res.data.message ;
                $timeout(()=>{
                   $location.path('/webmanager/lettre-motivation') ;
                   getAllLettre() ;
                },100) ;
                
            }else{
                $scope.failMessage = res.data.message ;
            }
            
        }) ;
    };

    /** Delete For id */
    
    $scope.deleteLettreForId = function(id){
        deleteFactory.deleteLettreForMotivationId(id).then(function(data){
            $scope.failMessage = false ;
            
            if(data.data.success){
                
                $timeout(()=>{
                    console.log('sddsdsds');
                    
                    $location.path('/webmanager/lettre-motivation');
                    getAllLettre() ;
                    $scope.SuccessMessage = data.data.message ;
                },100) ;
                
            }else{
                $scope.failMessage = data.data.message ;
            }
        })
    };

    if ($routeParams.id) {
        
        $scope.divUpdate = true ;
        //Get Emploi for id
   
        var idObject = $routeParams ;
        
        getFactory.getAllLettreMotivationForId(idObject.id).then(function(data){
            $scope.update = data.data; 
            
        }) ;

        $scope.updateLettre = function(update){

            console.log(update);
            
            var idObject = $routeParams ;
            putFactory.updateLettre(idObject.id,update).then(function(data){
                $scope.failMessage = false ;
                
                if(data.data.success){
                    $scope.SuccessMessage = data.data.message ;
                    $timeout(()=>{
                        $location.path('/webmanager/lettre-motivation')
                    },1000) ;
                    
                }else{
                    $scope.failMessage = data.data.message ;
                }
            }) ;
            
        }
    //getEmploiForId() ;

       
        
    }else{
        $scope.divUpdate = false ;
    }
    

    //Get All Lettre


})

.controller('editCtrl',function(getFactory,$routeParams,$scope,putFactory , $timeout , $location){
    function ree(){
        getFactory.information().then(function(data){
           $scope.data = data.data;
        }) ;
    }
    ree() ;
    //Get Emploi for id
    function getEmploiForId(){
        var idObject = $routeParams ;
        
        getFactory.getemploiforid(idObject.id).then(function(data){
            $scope.emploi = data.data; 
        }) ;
    }
    getEmploiForId() ;

    $scope.editEmploi = function(emploi){
       // console.log(emploi);
        var idObject = $routeParams ;
       // console.log(idObject.id);
        putFactory.updateEmploi(idObject.id,emploi).then(function(data){
            $scope.failMessage = false ;
            
            if(data.data.success){
                $scope.SuccessMessage = data.data.message ;
                $timeout(()=>{
                    $location.path('/webmanager')
                },1000) ;
                
            }else{
                $scope.failMessage = data.data.message ;
            }
        }) ;
        
    }
})
.controller('imageCtrl',function(getFactory,$routeParams,$scope,putFactory , $timeout , $location){
    function getAllimage(){
       
        getFactory.getAllLettreImage().then(function(data){
           $scope.donnee = data.data; 
           
        }) ;
    }
    getAllimage() ;

    $scope.editUriImage = function(data){
        console.log(data);
        
    }
})
.controller('cvCtrl',function(getFactory,$http,$routeParams, deleteFactory,$location,$scope,putFactory,postFactory , $timeout , $location){

    function getAllCv(){
       
        getFactory.getAllCv().then(function(data){
           $scope.dataCv = data.data;
        }) ;
    }
    getAllCv() ;

    

    $scope.complete = function(data){
       // log
       console.log(data);
      postFactory.cv(data).then(function(res){
            $scope.failMessage = false ;
            
            if(res.data.success){
                $scope.SuccessMessage = res.data.message ;
                $timeout(()=>{
                   $location.path('/webmanager/cv') ;
                   getAllCv() ;
                },100) ;
                
            }else{
                $scope.failMessage = res.data.message ;
            }
            
        });
    };

    /** Delete For id */
    
    $scope.deleteLettreForId = function(id){
        deleteFactory.deleteCvForMotivationId(id).then(function(data){
            $scope.failMessage = false ;
            
            if(data.data.success){
                
                $timeout(()=>{
                    console.log('sddsdsds');
                    
                    $location.path('/webmanager/cv');
                    getAllCv() ;
                    $scope.SuccessMessage = data.data.message ;
                },100) ;
                
            }else{
                $scope.failMessage = data.data.message ;
            }
        })
    };

    if ($routeParams.id) {
        $scope.divUpdate = true ;
        //Get Emploi for id
   
        var idObject = $routeParams ;
        
        getFactory.getAllCvForId(idObject.id).then(function(data){
            $scope.update = data.data; 
            
        }) ;

        $scope.updateCv = function(update){

            console.log(update);
            
            var idObject = $routeParams ;
            putFactory.updateCv(idObject.id,update).then(function(data){
                $scope.failMessage = false ;
                
                if(data.data.success){
                    $scope.SuccessMessage = data.data.message ;
                    $timeout(()=>{
                        $location.path('/webmanager/cv')
                    },1000) ;
                    
                }else{
                    $scope.failMessage = data.data.message ;
                }
            }) ;
            
        }
    //getEmploiForId() ;

       
        
    }else{
        $scope.divUpdate = false ;
    }
    

    //Get All Lettre


})
.controller('conditionCtrl',function(getFactory,$routeParams, deleteFactory,$location,$scope,putFactory,postFactory , $timeout , $location){

    function getcondition(){
       
        getFactory.getCondition().then(function(data){
           $scope.donnee = data.data; 
           
        }) ;
    }
    getcondition() ;

    $scope.postNewCondition = function(condition){
        console.log(condition);
        postFactory.condition(condition).then(function(res){
            $scope.failMessage = false ;
            
            if(res.data.success){
                $scope.SuccessMessage = res.data.message ;
                $timeout(()=>{
                   $location.path('/webmanager/condition') ;
                   getcondition() ;
                },100) ;
                
            }else{
                $scope.failMessage = res.data.message ;
            }
            
        }) ;
    };

    /** Delete For id */
    
    $scope.deleteCondForId = function(id){
        deleteFactory.deleteConditionId(id).then(function(data){
            $scope.failMessage = false ;
            
            if(data.data.success){
                
                $timeout(()=>{
                    console.log('sddsdsds');
                    
                    $location.path('/webmanager/condition');
                    getcondition() ;
                    $scope.SuccessMessage = data.data.message ;
                },100) ;
                
            }else{
                $scope.failMessage = data.data.message ;
            }
        })
    };

    if ($routeParams.id) {
        $scope.divUpdate = true ;
        //Get Emploi for id
   
        var idObject = $routeParams ;
        getFactory.getConditionForId(idObject.id).then(function(data){
            $scope.update = data.data; 
            console.log(data.data);
            
            
        }) ;

        $scope.updateCondition = function(update){

            console.log(update);
            
            var idObject = $routeParams ;
            putFactory.updateCondition(idObject.id,update).then(function(data){
                $scope.failMessage = false ;
                
                if(data.data.success){
                    $scope.SuccessMessage = data.data.message ;
                    $timeout(()=>{
                        $location.path('/webmanager/condition')
                    },1000) ;
                    
                }else{
                    $scope.failMessage = data.data.message ;
                }
            }) ;
            
        }
    //getEmploiForId() ;

       
        
    }else{
        $scope.divUpdate = false ;
    }
    

    //Get All Lettre


})
.controller('optionCtrl',function(getFactory,$routeParams, $route, deleteFactory,$location,$scope,putFactory,postFactory , $timeout , $location){

    //secteur
    function getAllSecteur(){
       
        getFactory.getAllSecteurActivity().then(function(data){
           $scope.secteur = data.data; 
           
        }) ;
    }
    getAllSecteur() ;

    //mode
    function getAllMode(){
       
        getFactory.getAllModeActivity().then(function(data){
           $scope.mode = data.data; 
           
        }) ;
    }
    getAllMode() ;

    // contrat 
    function getAllContrat(){
       
        getFactory.getAllContratActivity().then(function(data){
           $scope.contrat = data.data; 
           
        }) ;
    }
    getAllContrat() ;

    // Sexe 
    function getAllSexe(){
       
        getFactory.getAllSexeActivity().then(function(data){
           $scope.sexe = data.data; 
           
        }) ;
    }
    getAllSexe() ;

    

    /** Delete For id */
    
    $scope.deleteSecteur = function(id){
        deleteFactory.deleteSecteurId(id).then(function(data){
            $scope.failMessage = false ;
            
            if(data.data.success){
                
                $timeout(()=>{
                    console.log('sddsdsds');
                    
                    $location.path('/webmanager/options');
                  //  getAllLettre() ;
                    $scope.SuccessMessage = data.data.message ;
                },100) ;
                
            }else{
                $scope.failMessage = data.data.message ;
            }
        })
    };
    // Delete sexe
    $scope.deleteSexe = function(id){
        deleteFactory.deleteSexeId(id).then(function(data){
            $scope.failMessage = false ;
            
            if(data.data.success){
                
                $timeout(()=>{
                    console.log('sddsdsds');
                    
                    $location.path('/webmanager/options');
                  //  getAllLettre() ;
                    $scope.SuccessMessage = data.data.message ;
                },100) ;
                
            }else{
                $scope.failMessage = data.data.message ;
            }
        })
    };

    //Delete mode
    $scope.deleteMode = function(id){
        deleteFactory.deleteModeId(id).then(function(data){
            $scope.failMessage = false ;
            
            if(data.data.success){
                
                $timeout(()=>{
                    console.log('sddsdsds');
                    
                    $location.path('/webmanager/options');
                  //  getAllLettre() ;
                    $scope.SuccessMessage = data.data.message ;
                },100) ;
                
            }else{
                $scope.failMessage = data.data.message ;
            }
        })
    };

    // Delete contrat
    $scope.deleteContrat = function(id){
        deleteFactory.deleteContratId(id).then(function(data){
            $scope.failMessage = false ;
            
            if(data.data.success){
                
                $timeout(()=>{
                    console.log('sddsdsds');
                    
                    $location.path('/webmanager/options');
                  //  getAllLettre() ;
                    $scope.SuccessMessage = data.data.message ;
                },100) ;
                
            }else{
                $scope.failMessage = data.data.message ;
            }
        })
    };
    if ($routeParams.id) {
        $scope.divUpdate = true ;
        //Get Emploi for id
   
        var idObject = $routeParams.id ;

        if (idObject == 'secteuradd') {

            $scope.displayAddSecteur = true ;

            $scope.postNewSecteur = function(secteur){
                console.log(secteur);
                postFactory.postNewSecteur(secteur).then(function(res){
                    $scope.failMessage = false ;
                    
                    if(res.data.success){
                        $scope.SuccessMessage = res.data.message ;
                        $timeout(()=>{
                           $location.path('/webmanager/options') ;
                          // getAllLettre() ;
                        },100) ;
                        
                    }else{
                        $scope.failMessage = res.data.message ;
                    }
                    
                }) ;
            };
            
        } else if (idObject == 'sexeadd') {
            $scope.displayAddSexe = true ;

            $scope.postNewSexe = function(sexe){
                console.log(sexe);
                postFactory.postNewSexe(sexe).then(function(res){
                    $scope.failMessage = false ;
                    
                    if(res.data.success){
                        $scope.SuccessMessage = res.data.message ;
                        $timeout(()=>{
                           $location.path('/webmanager/options') ;
                          // getAllLettre() ;
                        },100) ;
                        
                    }else{
                        $scope.failMessage = res.data.message ;
                    }
                    
                }) ;
            };
        }
        else if (idObject == 'modeadd') {
            $scope.displayAddMode = true ;
            
            $scope.postNewMode = function(mode){
                console.log(mode);
                postFactory.postNewMode(mode).then(function(res){
                    $scope.failMessage = false ;
                    
                    if(res.data.success){
                        $scope.SuccessMessage = res.data.message ;
                        $timeout(()=>{
                           $location.path('/webmanager/options') ;
                          // getAllLettre() ;
                        },100) ;
                        
                    }else{
                        $scope.failMessage = res.data.message ;
                    }
                    
                }) ;
            };
        }
        else if (idObject == 'contratadd') {
            $scope.displayAddContrat = true ;
            
            $scope.postNewContrat = function(contrat){
                console.log(contrat);
                postFactory.postNewContrat(contrat).then(function(res){
                    $scope.failMessage = false ;
                    
                    if(res.data.success){
                        $scope.SuccessMessage = res.data.message ;
                        $timeout(()=>{
                           $location.path('/webmanager/options') ;
                          // getAllLettre() ;
                        },100) ;
                        
                    }else{
                        $scope.failMessage = res.data.message ;
                    }
                    
                }) ;
            };
        }
        console.log($routeParams);

       
        
    }else{
        $scope.divUpdate = false ;
    }
    

    //Get All Lettre


})
.controller('notifocationCtrl',function(getFactory,$routeParams, $route, deleteFactory,$location,$scope,putFactory,postFactory , $timeout , $location){

    //Upadate info
    (function (){   
        getFactory.getUpdateVersionApp().then(function(data){
           $scope.appUpdate = data.data; 
        }) ;
    })() ;
     //Agence Public checked info
    (function (){   
        getFactory.pub().then(function(data){
           $scope.pub = data.data;
        }) ;
    })() ;

    $scope.updateApp = function(update){

       putFactory.updateAppVersion(update._id,update).then(function(data){
            $scope.failMessage = false ;
            
            if(data.data.success){
                $scope.SuccessMessage = data.data.message ;
                $timeout(()=>{
                    $location.path('/webmanager/notifications')
                },1000) ;
                
            }else{
                $scope.failMessage = data.data.message ;
            }
        }) ;
         
    } ; 
    
    $scope.agenceUpdate = function(update){
        
        putFactory.agence(update._id, update).then(function(data){
            $scope.failMessage = false ;
            
            if(data.data.success){
                $scope.SuccessMessage = data.data.message ;
                $timeout(()=>{
                    $location.path('/webmanager/notifications')
                },1000) ;
                
            }else{
                $scope.failMessage = data.data.message ;
            }
        }) ;
        
    } ;

})
;

/*app.run(['$rootScope',function($rootScope){
    $rootScope.$on('$routeChangeStart',function(){

    })
}])*/