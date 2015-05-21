angular.module('housingResources', [])
  .factory('HousingResources', ['$http', function ($http) {
    return {
      housingOptions: function () {
        return $http.get('/fa/housing/api/v1.0/housing_options', {
          cache: true,
          transformResponse: appendTransform($http.defaults.transformResponse, function (data) {
            data.data = _.filter(data.data, 'rates');
            return data;
          })
        });
      },

      residenceTypes: function () {
        return $http.get('/fa/housing/taxonomy_term.json?vocabulary=8', {cache: true});
      },

      amenities: function () {
        return $http.get('/fa/housing/taxonomy_term.json?vocabulary=9', {cache: true});
      },

      freeServices: function () {
        return $http.get('/fa/housing/taxonomy_term.json?vocabulary=13', {cache: true});
      },

      contractTerms: function () {
        return $http.get('/fa/housing/taxonomy_term.json?vocabulary=17', {cache: true});
      },

      communities: function () {
        return $http.get('/fa/housing/taxonomy_term.json?vocabulary=21', {cache: true});
      },

      safety: function () {
        return $http.get('/fa/housing/taxonomy_term.json?vocabulary=25', {cache: true});
      },

      onCampus: function () {
        return $http.get('/fa/housing/taxonomy_term.json?tid=237', {cache: true});
      },

      offCampus: function () {
        return $http.get('/fa/housing/taxonomy_term.json?tid=241', {cache: true});
      }
    };
  }]);

function appendTransform(defaults, transform) {
  defaults = angular.isArray(defaults) ? defaults : [defaults];
  return defaults.concat(transform);
}
