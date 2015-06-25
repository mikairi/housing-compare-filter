angular.module('housingFilter', ['housingResources'])
  .config(['$compileProvider', function ($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
  }])

  .filter('byFeature', [function () {
    return function (array, featuresObj) {
      if (!featuresObj) return array;

      var result = [];
      var features = _.filter(featuresObj);

      angular.forEach(array, function (element) {
        if (_.every(features, function (featureValue, featureKey) {
            return _.some(element.allFeatures, featureKey);
          })) {

          result = result.concat(element);
        }
      });

      return result;
    }
  }])

  .controller('FilterCtrl', ['HousingResources', '$scope', '$q', '$timeout', function (HousingResources, $scope, $q, $timeout) {
    var promises = {
      freeServices: HousingResources.freeServices(),
      contractTerms: HousingResources.contractTerms(),
      communities: HousingResources.communities(),
      amenities: HousingResources.amenities(),
      safety: HousingResources.safety(),
      housingOptions: HousingResources.housingOptions()
    };

    $scope.loadingComplete = false;
    $scope.features = {};
    $scope.filters = {};
    $scope.residences = [];
    $scope.comparees = [];
    $scope.addToCompare = addToCompare;
    $scope.removeFromCompare = removeFromCompare;
    $scope.linkToCompare = linkToCompare;
    $scope.getHeaderImage = getHeaderImage;
    $scope.getHousingType = getHousingType;
    $scope.getRoomTypes = getRoomTypes;


    $timeout(function () {
      $scope.$watch('loadingComplete', function (newValue) {
        if (newValue == true) {
          loadJQuery(jQuery);
        }
      });
    });

    $q.all(promises).then(function (results) {
      $scope.features['Free Services'] = results.freeServices.data.list;
      $scope.features["RIT's Housing Contract"] = results.contractTerms.data.list;
      $scope.features['Lifestyle Communities'] = results.communities.data.list;
      $scope.features['Amenities'] = results.amenities.data.list;
      $scope.features['Safety & Security'] = results.safety.data.list;

      $scope.residences = _.filter(results.housingOptions.data.data, function (value) {
        return !value.summer_housing;
      });
      angular.forEach($scope.residences, function (res) {
        // Concat all features into one big "all" category
        res.allFeatures = [].concat(_.values(res.free_services),
          _.values(res.contract),
          _.values(res.communities),
          _.values(res.amenities),
          _.values(res.safety));

        // Assign initial room/rate selection
        res.selectedRoom = $scope.getRoomTypes(res)[0];
      });

      $scope.loadingComplete = true;
    });

    $scope.filterFn = function (value) {
      var features = _.reduce($scope.filters, function (result, feature, key) {
        if (!!feature) {
          return result.concat(key);
        } else {
          return result;
        }
      }, []);

      if (_.isEmpty(features)) return true;

      return _.every(features, function (feature) {
        return _.includes(value.allFeatures, feature);
      });
    };

    $scope.clearFilters = function () {
      angular.forEach($scope.filters, function (filterValue, filterKey) {
        $scope.filters[filterKey] = false;
      });
    };

    $scope.isEmpty = function (collection) {
      return _.isEmpty(collection);
    };


    function addToCompare(residence) {
      if ($scope.comparees.length < 4) {
        $scope.comparees = $scope.comparees.concat(residence.selectedRoom);
        $scope.comparees[$scope.comparees.length - 1].residenceName = residence.label;
      }
    }

    function removeFromCompare(index) {
      $scope.comparees.splice(index, 1);
    }

    function linkToCompare() {
      if ($scope.comparees.length < 2) return '';

      var param = _.pluck($scope.comparees, 'id').join('-');
      return '/fa/housing/content/compare-residences-side-side#/compare/' + param;
    }

    function getHeaderImage(residence) {
      if (residence.images) {
        return residence.images;
      } else {
        // placeholder thumbnail
        return 'https://placehold.it/240x180';
      }
    }

    function getHousingType(residence) {
      var housingType = _.last(residence.housing_type_all);
      if (housingType === "Residence Hall" || housingType === "Apartments") return housingType;
      if (residence.id === 405 || residence.id === 505) return "Suite";
      return "";
    }

    function getRoomTypes(residence) {
      var latestRates = _.last(residence.rates).rates;

      // if no room_type field explicitly defined (i.e empty) get the rates
      if (_.isEmpty(residence.room_types)) {
        return latestRates;
      } else {
        return _.map(residence.room_types, function (room) {
          room.id = _.result(_.find(latestRates, 'label', room.rate), 'id');
          return room;
        });
      }
    }
  }]);


function loadJQuery($) {
  $(function () {
    $('fieldset').on('show.bs.collapse', function () {
      $(this).find('.glyphicon').removeClass('glyphicon-plus-sign').addClass('glyphicon-minus-sign');
    }).on('hide.bs.collapse', function () {
      $(this).find('.glyphicon').removeClass('glyphicon-minus-sign').addClass('glyphicon-plus-sign');
    });
  });
}
