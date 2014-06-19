var app = angular.module('myApp', []);


var allFunds = [
  {num:5117049, name:'איביאי 00 בונד צמודות יתר', class1:'', class2:'', mng1:0.5, mng2:0.04},
  {num:5117023, name:'איביאי 00 תל בונד צמודות', class1:'', class2:'', mng1:0.5, mng2:0.04},
  {num:5116876, name:'ילין לפידות 1D ! 5 כוכבים', class1:'אגד חוץ', class2:'אגד חוץ אג"ח', mng1:0.7, mng2:0.05},
  {num:5115530, name:'מגדל 1D ! א.חוץ דינמי נק$', class1:'אגד חוץ', class2:'אגד חוץ אג"ח', mng1:0.4, mng2:0.05},
  {num:5111125, name:'מיטב 1D א.חוץ נקוב ב-$', class1:'אגד חוץ', class2:'אגד חוץ אג"ח', mng1:0.82, mng2:0.05},
  {num:5115506, name:'סיגמא 1D ! אגד חוץ', class1:'אגד חוץ', class2:'אגד חוץ אג"ח', mng1:1.04, mng2:0.1},
  {num:5102363, name:'פסגות 1B ! א.חוץ פקדונ שח', class1:'אגד חוץ', class2:'אגד חוץ אג"ח', mng1:0.75, mng2:0.04},
  {num:5114210, name:'פסגות 1D ! א.חוץ פקדונו $', class1:'אגד חוץ', class2:'אגד חוץ אג"ח', mng1:0.72, mng2:0.04},
  {num:5114772, name:'דש 2A ! א.חוץ פלטינו נקוב', class1:'אגד חוץ', class2:'אגד חוץ אג"ח', mng1:0.65, mng2:0.05},
  {num:5105853, name:'דש 2D ! א.חוץ פלטינ נקוב$', class1:'אגד חוץ', class2:'אגד חוץ אג"ח', mng1:0.65, mng2:0.05},
  {num:5114079, name:'מיטב 2D ! אגד חוץ +20', class1:'אגד חוץ', class2:'אגד חוץ אג"ח', mng1:0.62, mng2:0.065}
];

/* $http ajax calls really belongs in a service, 
but I'll be using them inside the controller for this demo */ 
app.directive('validInt', function(){
   return {
     require: 'ngModel',
     link: function(scope, element, attrs, modelCtrl) {

       modelCtrl.$parsers.push(function (inputValue) {

         var transformedInput = inputValue.replace(/[^0-9]/g, ''); 

         if (transformedInput!=inputValue) {
           modelCtrl.$setViewValue(transformedInput);
           modelCtrl.$render();
         }         

         return transformedInput;         
       });
     }
   };
});
app.directive('valid2dp', function(){
   return {
     require: 'ngModel',
     link: function(scope, element, attrs, modelCtrl) {

       modelCtrl.$parsers.push(function (inputValue) {


         var transformedInput = inputValue.match(/^[0-9]+\.?[0-9]{0,2}/);
         //var transformedInput = inputValue.match(new RegExp('^[0-9]+\\.?[0-9]{0,2}', 'i'));
         if (transformedInput !== null) {
           transformedInput = transformedInput[0]; 
         }
         else transformedInput = "";

         if (transformedInput!=inputValue) {
           modelCtrl.$setViewValue(transformedInput);
           modelCtrl.$render();
         }         

         return transformedInput;         
       });
     }
   };
});
app.filter('percentage', ['$filter', function ($filter) {
  return function (input, decimals) {
    return $filter('number')(input * 100, decimals) + '%';
  };
}]);
app.filter('noFractionCurrency',
  [ '$filter', '$locale',
  function(filter, locale) {
    var currencyFilter = filter('currency');
    var formats = locale.NUMBER_FORMATS;
    return function(amount, currencySymbol) {
      var value = currencyFilter(amount, currencySymbol);
      var sep = value.indexOf(formats.DECIMAL_SEP);
      if(amount >= 0) { 
        return value.substring(0, sep);
      }
      return value.substring(0, sep) + ')';
    };
  } ]);
app.factory('inputService', ['$rootScope', function ($rootScope) {

    var service = {

        model: {
            portfolioValue: 30000,
            mngPercent: 0.02,
          funds: []
        },
      
      // fund: { num:0, value:0 }

        SaveState: function () {
            localStorage.inputService = angular.toJson(service.model);
        },

        RestoreState: function () {
            service.model = angular.fromJson(localStorage.inputService);
        },
        ResetState: function () {

            service.model.funds = [];
            service.model.mngPercent=0.02;
            service.model.portfolioValue = 30000;
        }
    };

    $rootScope.$on("savestate", service.SaveState);
    $rootScope.$on("restorestate", service.RestoreState);
    $rootScope.$on("resetstate", service.ResetState);

    return service;
}]);

app.controller('myCtrl', function($scope, $http,$rootScope, inputService) {
  $scope.input = inputService;
  $scope.showAddFundList = true;
  $scope.save = function() {
    $rootScope.$broadcast('savestate');
  };
  $scope.restore = function() {
    $rootScope.$broadcast('restorestate');
  };
  $scope.reset = function() {
    $rootScope.$broadcast('resetstate');
  };
  $scope.allFunds = allFunds;

  $scope.addNewFund = function(fundData,value) {
    
    $scope.input.model.funds.push({num:fundData.num,value:parseFloat(value)});
    $scope.newFundValue= null;
    $scope.newFundData = { num:'XXX', name: '' };
    $scope.closePopup();
    //$rootScope.$broadcast('savestate');
  };
  
  $scope.removeFund = function(fundNum) {
    $scope.input.model.funds = $scope.input.model.funds.filter(function(fund){
      return fund.num !== fundNum;
    });
  };
  
  $scope.openPopup = function(fundNum) {
    $scope.newFundData = getFundByNum(allFunds,fundNum);
    $scope.addFundPopup=true;
  };
  $scope.closePopup = function() {
    $scope.addFundPopup=false;
    $scope.newFundValue = null;
    $scope.newFundData = null;
  };

  $scope.$watchCollection(function () { return  $scope.input.model.funds;},function(data) {
    $scope.onInputUpdate();
  });
  $scope.$watchCollection(function () { return  $scope.input.model;},function(data) {$scope.onInputUpdate();});
  
  $scope.onInputUpdate = function() {
  $scope.myFunds = [];
  angular.forEach($scope.input.model.funds, function(fund, i) {
    var fundData = getFundByNum(allFunds,fund.num);
    // TODO: Handle NULL
    var myFund = angular.copy(fundData);
    myFund.mngPercent = (myFund.mng1 + myFund.mng2) / 100;
    myFund.value = fund.value;
    myFund.yearlyMng = myFund.mngPercent * myFund.value;
    myFund.additional= 'NO';
    
    this.push(myFund);
  }, $scope.myFunds);
  
  $scope.totalValue = $scope.myFunds.reduce(function(sum, fund) {
   return ( sum + fund.value);
}, 0);
  
  $scope.totalYearlyMng = $scope.myFunds.reduce(function(sum, fund) {
   return ( sum + fund.yearlyMng);
}, 0);
  $scope.percentageMutual = $scope.totalValue / $scope.input.model.portfolioValue;
  $scope.valueExclMutual = $scope.input.model.portfolioValue - $scope.totalValue;
  $scope.annualCharge = $scope.valueExclMutual * $scope.input.model.mngPercent / 100;
 $scope.totalMng = $scope.annualCharge +  $scope.totalYearlyMng;
  $scope.percentageMng = $scope.totalMng / $scope.input.model.portfolioValue;
    if ($scope.totalValue === 0) $scope.mngChargeMutual = 0;
    else $scope.mngChargeMutual = $scope.totalYearlyMng / $scope.totalValue;  
  };


});
/*app.run(function($rootScope) {
  $rootScope.$on("$routeChangeStart", function (event, next, current) {
    //if (sessionStorage.restorestate == "true") {
        $rootScope.$broadcast('restorestate'); //let everything know we need to restore state
        sessionStorage.restorestate = false;
    //}
});
});
window.onbeforeunload = function (event) {
    $rootScope.$broadcast('savestate');
};
*/
function getFundByNum(funds,num) {
  for(var i = 0; i < funds.length; i += 1){
    var fund = funds[i];
    if(fund.num === num){
        return fund;
    }
  }
  return {num:0, name:"XXX", class1:"", class2:"hello", mng1:0, mng2:0,value:0};
}