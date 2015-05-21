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

  .controller('FilterCtrl', ['HousingResources', '$scope', '$q', function (HousingResources, $scope, $q) {
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


    $q.all(promises).then(function (results) {
      $scope.features['Free Services'] = results.freeServices.data.list;
      $scope.features["RIT's Housing Contract"] = results.contractTerms.data.list;
      $scope.features['Lifestyle Communities'] = results.communities.data.list;
      $scope.features['Amenities'] = results.amenities.data.list;
      $scope.features['Safety & Security'] = results.safety.data.list;

      $scope.residences = results.housingOptions.data.data;
      angular.forEach($scope.residences, function (res) {
        // Concat all features into one big "all" category
        res.allFeatures = [].concat(_.values(res.free_services),
          _.values(res.contract),
          _.values(res.communities),
          _.values(res.amenities),
          _.values(res.safety));

        // Assign initial room/rate selection
        res.selectedRoom = res.rates[res.rates.length - 1].rates[0];
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
      var images = residence.images;

      if (images) {
        return images[0].url;
      } else {
        // placeholder thumbnail
        return 'https://placehold.it/240x180';
      }
    }
  }]);
