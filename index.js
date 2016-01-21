(function($) {
  'use strict';

  var defaultOptions = {};

  /**
   * NaturalSeachbox constructor
   * @param {object} el         element where to render the plugin
   * @param {object} options    custom options
   */
  function NaturalSeachbox(el, options) {
    var self = this;
    this.options = options || {};

    this.$element = $(el);
    this.$element.hide();

    this.$plus = $(options.plus || '<i class="fa fa-plus"></i>');
    this.$minus = $(options.minus || '<i class="fa fa-minus"></i>');

    this.$plusButton = $('<button class="filter-plus"></button>');

    this.$container = $('<div id="input" class="filter-single-line filter-input" \
                      contenteditable="true"></div>');

    this.$addGroupElement = $('<div class="filter-dropdown"></div>');

    this.$andGroupSelection = $('<li data-type="AND">AND Group</li>');
    this.$orGroupSelection = $('<li data-type="OR">OR Group</li>');

    this.$element.before(this.$container);
    this.$element.after(this.$addGroupElement);
    this.$element.after(this.$plusButton);

    this.$addGroupElement
      .append(this.$andGroupSelection)
      .append(this.$orGroupSelection);

    this.$plusButton.html(this.$plus);

    this.$mainGroup = ['group'];

    this.init();
  }

  function Group() {
    return
  }

  NaturalSeachbox.prototype = {
    constructor: NaturalSeachbox,

    init: function() {
      var self = this;

      function closeAccordion() {
        self.$plusButton.removeClass('active');
        self.$addGroupElement.slideUp(300).removeClass('open');
      }
      function openAccordion() {
        self.$plusButton.addClass('active');
        self.$addGroupElement.slideDown(300).addClass('open');;
      }
      function clickOption(groupType) {
        self.addGroup(groupType);
        closeAccordion();
        self.$plusButton.html(self.$plus);
      }

      this.$plusButton.on('click', function(e) {
        if ($(this).hasClass('active')) {
          closeAccordion();
          $(this).html(self.$plus)
        } else {
          closeAccordion();
          $(this).html(self.$minus)
          openAccordion();
        }
        e.preventDefault();
      });

      this.$andGroupSelection.on('click', function(e) {
        clickOption('AND');
      });
      this.$orGroupSelection.on('click', function(e) {
        clickOption('OR');
      });
    },

    destroy: function() {
      this.$container.remove();
      this.$addGroupElement.remove();
      this.$plusButton.remove();
      this.$element.removeData('naturalsearchbox');
      this.$element.show();
    },

    addGroup: function(type) {
      switch (type) {
        case 'AND':
          this.$container.html(this.$mainGroup.toString());
          break;
        case 'OR':
          this.$container.html(this.$mainGroup.toString());
          break;
        default: // default type for group is AND
          this.$container.html(this.$mainGroup.toString());
          break;
      }
    }
  };

  /**
   * Register JQuery plugin
   */
  $.fn.naturalsearchbox = function(args) {
    var results = [];
    this.each(function() {
      var naturalsearchbox = $(this).data('naturalsearchbox');
      if (!naturalsearchbox) {
        naturalsearchbox = new NaturalSeachbox(this, args);
        $(this).data('naturalsearchbox', naturalsearchbox);
        results.push(naturalsearchbox)
      } else if (naturalsearchbox[args]) {
        var retVal = naturalsearchbox[args]();
        if (retVal) {
          results.push(retVal);
        }
      }
    });

    if (typeof args == 'string') {
      return results.length > 1 ? results : results[0];
    } else {
      return results;
    }
  };

  $.fn.naturalsearchbox.Constructor = NaturalSeachbox;

})(jQuery);
