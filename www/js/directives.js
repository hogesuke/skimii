'use strict';

angular.module('techBookDirectives', []).
  directive('tagOption', function () {
    return {
      restrict: 'A',
      link: function(scope, element) {
        var $el = $(element[0]);
        var $tagOp = $el.find('.tag-option');
        $el.on('click', function(e) {
          $tagOp.trigger('click');
          e.preventDefault();
        });
        $tagOp.on('click', function(e) {
          e.stopPropagation();
        });
      }
    };
  }
);