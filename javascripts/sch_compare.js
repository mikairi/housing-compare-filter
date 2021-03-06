angular.module('housingCompare', ['ui.router', 'housingResources'])
  .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $stateProvider
      .state('compare', {
        templateUrl: 'table.html',
        controller: 'TableCtrl',
        abstract: true
      })

      .state('compare.table', {
        url: '/compare/:room',
        params: {
          room: {
            array: true
          }
        },
        views: {
          'header': {
            template: '<div><a href="" ng-click="removeCompare($index)">remove from comparison</div>' +
            '<div class="thumbnail hidden-print"><img ng-src="{{getHeaderImage($index)}}" alt=""></div>' +
            '<div class="lead"><a ng-href="{{comparees.residences[$index].url}}">{{comparees.residences[$index].label | correctName}}</a></div>' +
            '<div>{{comparees.rooms[$index].label}}</div>'
          },
          'rent': {
            template: '{{comparees.rooms[$index].full_day}}'
          },
          'occupancy': {
            template: '{{comparees.residences[$index].field_required_occupancy}}'
          },
          'feature': {
            template: '<span ng-bind-html="comparees.residences[$index].amenities[feature.tid] || comparees.residences[$index].free_services[feature.tid] || comparees.residences[$index].communities[feature.tid] || comparees.residences[$index].safety[feature.tid] | compact"></span>'
          }
        }
      })

      .state('choose', {
        url: '/',
        templateUrl: 'choose.html',
        controller: 'ChooseCtrl'
      });

    //$urlRouterProvider.when('', '/');

    $urlRouterProvider.otherwise(function ($injector, $location) {
      if (_.includes($location.url(), '=&overlay')) {
        return $location.url();
      }
      $location.replace();
      return '/';
    });

    $locationProvider.hashPrefix('').html5Mode(false);
  }])

  .config(['$compileProvider', function ($compileProvider) {
    //$compileProvider.debugInfoEnabled(false);
  }])

  .filter('correctName', [function () {
    return function (text) {
      //if (text === 'Nathaniel Rochester Hall') {
      //  return 'Residence Hall';
      //}
      //return text;

      // Names are left as is for SCH
      return text;
    };
  }])

  .filter('compact', ['$sce', function ($sce) {
    return function (text) {
      if (angular.isDefined(text)) {
        return $sce.trustAsHtml('<span class="glyphicon glyphicon-ok" style="color:#22cc55;"></span>');
      }
      return $sce.trustAsHtml('<!--span class="glyphicon glyphicon-remove" style="color:#bbb;"></span-->');
    };
  }])

  .controller('MainCtrl', ['$scope', '$q', 'HousingResources', function ($scope, $q, HousingResources) {
    // For presisting the state of the selectors.
    $scope.master = {residences: [], apartments: [], rooms: []};

    // Load housing features for the comparison table to the cache in bg.
    $scope.loadingComplete = false;

    var promises = [
      HousingResources.residenceTypes(),
      HousingResources.housingOptions(),
      HousingResources.onCampus(),
      HousingResources.freeServices(),
      HousingResources.amenities(),
      HousingResources.safety()
    ];
    $q.all(promises).then(function () {
      $scope.loadingComplete = true;
    });

  }])

  .controller('ChooseCtrl', ['$scope', '$state', 'HousingResources', '$timeout', function ($scope, $state, HousingResources, $timeout) {
    $scope.comparees = {residences: [], apartments: [], rooms: []};
    //$scope.loadingComplete = false;
    $scope.goToCompare = goToCompare;
    $scope.getRoomsByRes = getRoomsByRes;
    $scope.showSelector = showSelector;
    $scope.showRoomSelector = showRoomSelector;
    $scope.resetSubSelect = resetSubSelect;
    $scope.resetRoomSelect = resetRoomSelect;

    $timeout(function () {
      $scope.comparees = angular.copy($scope.master);
      // watch and reset selected residences when a previous one is unselected
      $scope.$watchCollection('comparees.residences', function (newCol, oldCol) {
        if (!angular.equals(newCol, oldCol)) {
          angular.forEach(newCol, function (comparee, index) {
            resetComparees(index);
          });
        }
      });
    });

    HousingResources.residenceTypes().success(function (data) {
      $scope.apartTypes = _.chain(data.list)
        .filter(function (res) {
          return _.some(res.parent, function (parent) {
            return parent.id === 52;
          });
        })
        .sortBy(function (res) {
          return parseInt(res.weight);
        })
        .value();

      // Create a hierarchy of housing types
      $scope.housingTypes = _.chain(data.list)
        .filter(function (res) {
          return _.isEmpty(res.parent);
        })
        .sortBy(function (res) {
          return parseInt(res.weight);
        })
        .value();

      //$scope.loadingComplete = true;
    });

    HousingResources.housingOptions().success(function (data) {
      // filter for summer housing only
      $scope.residences = _.filter(data.data, 'summer_housing');
    });


    function resetComparees(index) {
      if (!$scope.comparees.residences[index]) {
        for (var i = index; i < $scope.comparees.residences.length; i++) {
          if (i < $scope.comparees.residences.length - 1) {
            $scope.comparees.residences[i] = $scope.comparees.residences[i + 1];
            $scope.comparees.apartments[i] = $scope.comparees.apartments[i + 1];
            $scope.comparees.rooms[i] = $scope.comparees.rooms[i + 1];
          } else {
            resetSubSelect(i);
            $scope.comparees.residences[i] = null;
          }
        }
      }
    }

    function getRoomsByRes(residence) {
      if (!residence) return [];
      var currentRates = _.last(residence.rates);
      return currentRates.rates;
    }

    function resetSubSelect(index) {
      resetRoomSelect(index);
      $scope.comparees.apartments[index] = null;
    }

    function resetRoomSelect(index) {
      $scope.comparees.rooms[index] = null;
    }

    function resetForm(form) {
      if (form) {
        form.$setPristine();
      }
      $scope.comparees.residences = $scope.comparees.apartments = $scope.comparees.rooms = [];
    }

    // show additional selectors depending on whether a previous one was selected
    function showSelector(index) {
      var result = true;
      //noinspection FallThroughInSwitchStatementJS
      switch (index) {
        default:
          result = result && !!$scope.comparees.residences[index - 1];
        case 2:
          result = result && !!$scope.comparees.residences[1] && !!$scope.comparees.residences[0];
          return result;
        case 1:
        case 0:
          return result;
      }
    }

    function showRoomSelector(index) {
      return $scope.comparees.residences[index]
        && ($scope.comparees.residences[index].tid !== '52'
        || ($scope.comparees.residences[index].tid === '52' && $scope.comparees.apartments[index]));
    }

    function goToCompare() {
      var roomIds = _.reduce($scope.comparees.rooms, function (memo, room) {
        if (room) return memo.concat(room.id);
        else return memo;
      }, []);

      $state.go('compare.table', {room: roomIds}).then(function () {
        angular.copy($scope.comparees, $scope.master);
      });
    }
  }])

  .controller('TableCtrl', ['$scope', '$state', '$q', '$timeout', 'HousingResources', function ($scope, $state, $q, $timeout, HousingResources) {
    var featuresPromises = {
      onCampus: HousingResources.onCampus(),
      freeServices: HousingResources.freeServices(),
      amenities: HousingResources.amenities(),
      safety: HousingResources.safety()
    };

    $scope.comparees = {residences: [], rooms: []};
    $scope.features = [];
    $scope.generateUrl = generateUrl;
    $scope.getHeaderImage = getHeaderImage;
    $scope.toggleCollapse = toggleCollapse;

    $q.all(featuresPromises).then(function (result) {
      $scope.features = _.reduce(result, function (memo, eachResult) {
        return memo.concat(_.sortBy(eachResult.data.list, function (feature) {
          return parseInt(feature.weight);
        }));
      }, []);
    });

    HousingResources.housingOptions().then(function (result) {
      var housing = _.filter(result.data.data, 'summer_housing');
      angular.forEach($state.params.room, function (roomId, index) {
        $scope.comparees.residences[index] = _.find(housing, function (residence) {
          var currentRates = _.last(residence.rates);
          return _.some(currentRates.rates, function (rate) {
            if (rate.id == roomId) {
              $scope.comparees.rooms[index] = rate;
            }
            return rate.id == roomId;
          });
        });

        //if (!$scope.comparees.residences[index].images) {
        //  $scope.comparees.residences[index].images = ['https://placehold.it/300'];
        //}
      });
    });

    $timeout(function () {
      angular.element('#collapseTop')
        .on('show.bs.collapse', function () {
          $scope.collapseShown = true;
        })
        .on('hide.bs.collapse', function () {
          $scope.collapseShown = false;
        });
    });


    function toggleCollapse(selector) {
      angular.element(selector).collapse('toggle');
    }

    function getHeaderImage(index) {
      var images = $scope.comparees.residences[index].images;
      if (images) {
        return images;
      } else {
        return 'https://placehold.it/240x180';
      }
    }

    function generateUrl() {
      var roomIds = _.reduce($scope.comparees.rooms, function (memo, room) {
        if (room) return memo.concat(room.id);
        else return memo;
      }, []);

      return $state.href('compare.table', {room: roomIds}, {absolute: true});
    }
  }]);
