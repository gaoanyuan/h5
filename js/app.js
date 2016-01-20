'use strict';

// process config
(function () {
  var config = window.appConfig;
  if (!config.public) config.public = {};
  if (!config.user) config.user = {};

  var arr = config.oss.endpoint.split('//');
  config.oss.host = arr[0] + '//' + config.oss.bucket + '.' + arr[1];

  angular.forEach(['bg', 'image', 'music', 'page', 'doc'], function (item) {
    if (config.public[item] && !config.public[item].host) {
      delete config.public[item].host;
    }
    config.public[item] = jQuery.extend(true, {}, config.oss, config.public[item]);
    config.public[item]['path'] = 'public/' + item;

    config.user[item] = jQuery.extend(true, {}, config.oss, config.user[item]);
    config.user[item]['path'] = 'user/' + config.uid + '/' + item;
  });

  config.publish = jQuery.extend(true, {}, config.oss, config.publish);
  config.publish['path'] = 'publish';

})();

var app = angular.module('app', [
  'ngAnimate',
  'ngSanitize',
  'ngStorage',
  'ui.router',
  'ui.bootstrap',
  'remoteService',
  'aliyunService',
  'toaster',
  'ct.ui.router.extras',
  'ui.bootstrap-slider',
  'ui.colorpicker',
  'ui.spinner',
  //'app.tpls',
  'ui.cropper'
]);

app.config(['$controllerProvider', '$compileProvider', '$filterProvider', '$provide', '$httpProvider',
  function ($controllerProvider, $compileProvider, $filterProvider, $provide, $httpProvider) {
    // lazy controller, directive and service
    app.controller = $controllerProvider.register;
    app.directive = $compileProvider.directive;
    app.filter = $filterProvider.register;
    app.factory = $provide.factory;
    app.service = $provide.service;
    app.constant = $provide.constant;
    app.value = $provide.value;
    $httpProvider.defaults.withCredentials = true;
    $provide.decorator('ossService', ['$delegate', '$http', '$q', function ($delegate, $http, $q) {
      var serviceUrl = "https://marketdev.qiangungun.com/";
      var sessionId = "dc8d92875703b215f35b564d9cde2937";


      $delegate.loadDoc = function (docId) {
        return $http.get("./default.json",{
          responseType:"json"
        }).then(function (resp) {
          return resp.data;
        });


        /*return $http.get(serviceUrl + "document/query", {
          documentId: docId
        }, {
          params: {
            sessionId: sessionId
          }
        }).then(function (resp) {
          return resp.data;
        })*/
      };
      $delegate.getImageList = function (isPublic) {
        return $http.get(serviceUrl + "material/query/", {
          params: {
            sessionId: sessionId,
            type: 'IMAGE'
          }
        }).then(function (resp) {
          var data = {
            list: resp.data && resp.data.data
          };
          data.property = {
            "latestTag": 0,
            "tags": []
          };
          return data;
        });
      };
      $delegate.uploadImage = function (data, contentType, isPublic) {
        var deferred = $q.defer();
        var fd = new FormData();

        var blob = new Blob([data], {type: "image/png"});
        fd.append("file", blob);

        /*var request = new XMLHttpRequest();
         request.open("POST", serviceUrl + "material/upload?sessionId=c9148e98d586fd85ddcb66c4e4c01b2a");
         request.onload = function (event) {
         if (request.status == 200) {
         console.log("11");
         } else {

         }
         };
         request.send(fd);*/
        $http.post(serviceUrl + "material/upload", fd, {
          /*withCredentials: true,*/
          headers: {
            'Content-Type': undefined
          },
          params: {
            sessionId: sessionId
          },
          transformRequest: angular.identity
        }).success(function (data, status, headers, config) {
          deferred.resolve(data);
        }).error(function (err, status) {
          deferred.reject(data);
        });
        return deferred.promise;
      };
      $delegate.saveDoc = function (doc, docId) {

        return $http.post(serviceUrl + "document/update", {
          documentId:docId,
          content: JSON.stringify(doc)
        }, {
          params: {
            sessionId: sessionId
          }
        });
      };
      return $delegate;
    }])
  }
])
  .run(['$rootScope', '$state', '$stateParams', 'applyFn',
    function ($rootScope, $state, $stateParams, applyFn) {
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
      $rootScope.winHeight = jQuery(window).height();
      $rootScope.winWidth = jQuery(window).width();
      $rootScope.applyFn = applyFn;
      $rootScope.global = {};
      $rootScope.isAdmin = window.appConfig.isAdmin;

      $rootScope.log = function () {
        switch (arguments.length) {
          case 0:
            return;
          case 1:
            console.log(arguments[0]);
            break;
          case 2:
            console.log(arguments[0], arguments[1]);
            break;
          case 3:
            console.log(arguments[0], arguments[1], arguments[2]);
            break;
          default:
            console.log(arguments);
        }
      };
    }]
);
app.factory('applyFn', ['$rootScope',
  function ($rootScope) {
    return function (fn, scope) {
      fn = angular.isFunction(fn) ? fn : angular.noop;
      scope = scope && scope.$apply ? scope : $rootScope;
      fn();
      if (!scope.$$phase) {
        scope.$apply();
      }
    };
  }
])

