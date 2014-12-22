var app = angular.module('myApp', []);




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
            var storedModel = localStorage.inputService;
            if (storedModel === null) service.ResetState
            else service.model = angular.fromJson(localStorage.inputService);
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
app.factory('fundsService', function($http) {
    return $http.get('data/funds.json');
});
app.controller('myCtrl', function($scope, $http,$rootScope, inputService, fundsService) {
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
//  $scope.$scope.allFunds = $scope.allFunds;
  $scope.allFunds = [];
  fundsService.success(function (data) {
     $scope.allFunds = data;
  });
  fundsService.error(function (data) {
    alert("Error loading fund data!");
  });
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
    $scope.newFundData = getFundByNum($scope.allFunds,fundNum);
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
    var fundData = getFundByNum($scope.allFunds,fund.num);
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