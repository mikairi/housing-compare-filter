angular.module('housingResources')
  .config(['$httpProvider', function ($httpProvider) {
    // $http config
    $httpProvider.interceptors.push(function () {
      return {
        request: function (config) {
          // append base path to all request URLs
          var baseUrl = 'https://www-staging.rit.edu';
          if (config.url.startsWith('/fa/housing')) config.url = baseUrl + config.url;
          return config;
        }
      };
    });
  }]);
