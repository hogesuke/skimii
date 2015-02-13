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
  directive('entryListScrollbar', ['$routeParams', '$timeout', 'EntryService', function ($routeParams, $timeout, EntryService) {
    return {
      restrict: 'A',
      link: function(scope, element) {
        if ($('[id$=_dragger_vertical]').length > 0) {
          return;
        }

        var $el = $(element[0]);

        // contentのloadが完了したのちentry-listのheightを設定
        scope.$on('$includeContentLoaded', function() {
          setHeight($el);

          $(window).resize(function() {
            setHeight($el);
          });
        });

        $el.mCustomScrollbar({
          theme        : 'dark',
          scrollInertia: 500,
          mouseWheel   : { scrollAmount: 300 },
          advanced     : { updateOnImageLoad: false },
          callbacks    : {
            onInit: function() {
              var $scrollbar = $('[id$=_dragger_vertical]');
              var $entryList = $('.entry-list');
              var observer   = new MutationObserver(function() {doEvent($entryList, $scrollbar);});
              observer.observe($scrollbar[0], {attributes : true, attributeFilter : ['style']});
            }
          }
        });

        function setHeight($el) {
          var $header  = $el.siblings('#entry-list-header');
          var header_h = $header.height();
          var board_h  = $('#entryboard').height();

          $el.height(board_h - header_h);
        }
        function doEvent($entryList, $scrollbar) {
          var entrylist_h = $entryList.height();
          var slidebar_h  = $scrollbar.height();
          var top         = $scrollbar.css('top').replace('px', '');

          if (entrylist_h - slidebar_h - top <= 0) {
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
  directive('dashboardEntryList', function () {
    return {
      restrict: 'A',
      link: function(scope, element) {
        var $entryList = $(element[0]);
        var $container = $entryList.parents('.mCSB_container');

        setWidthAndHeight($entryList, $container);

        $(window).resize(function() {
          setWidthAndHeight($entryList, $container);
        });

        function setWidthAndHeight($entryList, $container) {
          // for width variables
          var adjustment_w = $container.css('margin-right') === '0px' ? 15 : 0;
          var container_w  = $container.width() - adjustment_w;
          var lefPad_w     = 20;
          // for height variables
          var count        = scope.settings.dashboard_count;
          var entry_h      = 101;
          var listHeader_h = $entryList.children('.tag-name').height();
          var list_h       = entry_h * (count + 1) + listHeader_h;

          $entryList.height(list_h);

          if (container_w < 800) {
            $entryList.width(container_w - lefPad_w);
            $entryList.css({height: ''});
          } else if (container_w < 1200) {
            $entryList.width(container_w / 2 - lefPad_w);
          } else {
            $entryList.width(container_w / 3 - lefPad_w);
          }
        }
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
