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
  }).
  directive('entryListScrollbar', ['$routeParams', 'EntryService', function ($routeParams, EntryService) {
    return {
      restrict: 'A',
      link: function(scope, element) {
        if ($('[id$=_dragger_vertical]').length > 0) {
          return;
        }
        $(element[0]).mCustomScrollbar({
          theme        : 'dark',
          scrollInertia: 500,
          mouseWheel   : { scrollAmount: 300 },
          advanced     : { updateOnImageLoad: false },
          callbacks    : {
            onInit: function() {
              var $scrollbar  = $('[id$=_dragger_vertical]');
              var $entryBoard = $('#entryboard');
              var observer = new MutationObserver(function() {doEvent($entryBoard, $scrollbar);});
              observer.observe($scrollbar[0], {attributes : true, attributeFilter : ['style']});
            }
          }
        });

        function doEvent($entryBoard, $scrollbar) {
          var entryboard_h = $entryBoard.height();
          var slidebar_h = $scrollbar.height();
          var top = $scrollbar.css('top').replace('px', '');

          if (entryboard_h - slidebar_h - top <= 0) {
            if (!scope.completed && !scope.loading) {
              load();
            }
          }
        }

        function load() {
          scope.loading = true;
          EntryService.load($routeParams.tag, ++scope.page).then(function(entriesData) {
            setEntries(entriesData);
          }).finally(function() {
            scope.loading = false;
          });
        }

        function setEntries(entriesData) {
          if (entriesData.completed) {
            scope.completed = true;
            return;
          }
          if (entriesData.sort === 'recent') {
            var prevDate = scope.entries.pop.hotentry_date;
            angular.forEach(entriesData.entries, function (entry) {
              if (prevDate > entry.hotentry_date) {
                entry.visibleDate = true;
              }
              prevDate = entry.hotentry_date;
            });
          }

          scope.entries = scope.entries.concat(entriesData.entries);
        }
      }
    };
  }]).
  directive('dashboardScrollbar', function () {
    return {
      restrict: 'A',
      link: function(scope, element) {
        $(element[0]).mCustomScrollbar({
          theme        : 'dark',
          scrollInertia: 500,
          mouseWheel   : { scrollAmount: 300 },
          advanced     : { updateOnImageLoad: false }
        });
      }
    };
  }).
  directive('sidebarLink', function () {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var $el = $(element[0]);
        var href = attrs.sidebarLink;

        $el.on('click', function() {
          $el.parents('#sidebar').find('.active').removeClass('active');
          $el.addClass('active');
          document.location.href = href;
        });
      }
    };
  });
