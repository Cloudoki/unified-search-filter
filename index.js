(function ($) {
  'use strict';

  var defaultOptions = {};
  var rules = {
    text: {
      equal: 'equal',
      not_equal: 'not equal',
      contains: 'contains',
      not_contains: 'doesn\'t contain',
    },
    number: {
      equal: 'equal',
      not_equal: 'not equal',
      less: 'less',
      less_or_equal: 'less or equal',
      greater: 'greater',
      greater_or_equal: 'greater or equal',
    },
    email: {
      equal: 'equal',
      not_equal: 'not equal',
      contains: 'contains',
      not_contains: 'doesn\'t contain',
    },
    date: {
      equal: 'equal',
      not_equal: 'not equal',
      less: 'less',
      less_or_equal: 'less or equal',
      greater: 'greater',
      greater_or_equal: 'greater or equal',
    },
    condition: {
      in : 'in',
      not_in: 'not in',
    }
  };
  var validation = {
    text: function(text) {
      var pattern = /\w\W*/gi;
      return pattern.test(text);
    },
    number: function(number) {
      var pattern = /^\d+$/g;
      return pattern.test(number);
    },
    email: function(email) {
      var pattern = /^(([a-zA-Z]|[0-9])|([-]|[_]|[.]))+[@](([a-zA-Z0-9])|([-])){2,63}[.](([a-zA-Z0-9]){2,63})+$/gi;
      return pattern.test(email);
    },
    date: function(date) {
      try {
        console.log(new Date(date));
        return true;
      } catch (err) {
        return false;
      }
    },
  };

  /**
   * Put the models received as arguments in a container
   * @param {object} self   Instance of UnifiedSearchFilter object
   * @param {object} Models The models received
   */
  function setModels(self, Models) {
    var modelsCount = Object.keys(Models).length;
    self.$models = [];
    for (var i = 0; i < modelsCount; i++) {
      var key = Object.keys(Models)[i];
      self.$models.push(key);
    }
  }

  /**
   * UnifiedSearchFilter constructor
   * @param {object} el         element where to render the plugin
   * @param {object} options    custom options
   */
  function UnifiedSearchFilter(el, options) {
    var self = this;
    this.options = options || {};
    this.state = 'init';

    if (options.Models) setModels(self, options.Models);

    this.$element = $(el);
    this.$element.hide();

    self.hasGlobal = false;

    this.$plus = $(options.dropdownShowIcon || '<i class="fa fa-plus"></i>');
    this.$minus = $(options.dropdownHideIcon || '<i class="fa fa-minus"></i>');

    this.$wrapper = $('<div class="filter-wrapper"></div>');
    this.$plusButton = $('<button class="filter-addButton"></button>');

    // TODO: future feature add contenteditable to filter so it can be
    // delete using keyboard
    this.$container = $('<div id="input" class="filter-single-line filter-input"></div>');

    this.$selectModels = $('<div class="filter-models"></div>');

    this.$selectedModel = undefined;

    this.$globalGroup = $('<div class="filter-global-group"></div>');
    this.$globalGroupContainer = $('<div class="filter-global-group-container"></div>');

    this.$selectionOptionsContainer = $('<div class="filter-dropdown"></div>');
    this.$groupSelection = $('<li>Add Group</li>');
    this.$condition = $('<li>Add Condition</li>');
    this.$addModel = $('<li data-type="model">Model</li>');


    this.$element.before(this.$wrapper);
    this.$wrapper.append(this.$container);
    this.$container.after(this.$selectionOptionsContainer);
    this.$container.after(this.$plusButton);

    this.$plusButton.html(this.$plus);

    this.init();
  }

  function addRules(self) {
    var ruleOptionsContainer = $('<div class="filter-rule-dropdown"></div>');
    var input = $('<input type="text"></input>');
    var condition = $('<p> IN </p>');
    var where = $('<select></select>');
    var removeButton = $(' <span class="btn remove"><i class="fa fa-minus"></i></span>');

    getOptionsFromModel(self, where);

    self.$selectModels.on('updaterules:options', function() {
      where.children().remove();
      getOptionsFromModel(self, where);
    });
    removeButton.on('click', function() {
      $(this).parent().remove();
    });
    where.change(function() {
      var el = $(this).val()
    });
    input.change(function() {
      console.log(validation[where.find(':selected').data().validation](content));
      var el = $(this);
      var content = el.val();
      if(!validation[where.find(':selected').data().validation](content)) {
        el.removeClass('valid').addClass('invalid');
      } else {
        el.removeClass('invalid').addClass('valid');
      }
    });
    ruleOptionsContainer.append(where).append(condition).append(input);
    ruleOptionsContainer
      .append(removeButton);
    return ruleOptionsContainer;
  }

  function newGroup(self, type) {
    var group = $('<div class="filter-group-' + type + '"><div>');
    var removeButton = $(' <span class="btn remove"><i class="fa fa-minus"></i></span>');
    var addButton = $(' <span class="btn add"><i class="fa fa-plus"></i></span>');

    removeButton.on('click', function() {
      $(this).parent().remove();
      if (self.$container.children().length === 1)
        self.$selectModels.removeClass('filter-models-after');
    });
    addButton.on('click', function() {
      addRules(self).insertBefore($(this));
    });

    group
      .append(addButton)
      .append(removeButton.hide())
      .hover(
        function() {
          removeButton.show();
        },
        function() {
          removeButton.hide();
        }
      );
    return group;
  }

  function addGlobalGroup(self, type) {
    var removeButton = $(' <span class="btn remove"><i class="fa fa-minus"></i></span>');
    var select = $('<select name="group"></select>');
    self.hasGlobal = true;

    removeButton.on('click', function() {
      $(this).parent().remove();
      self.clearGlobalGroup();
    });
    select.append($('<option value="AND" ' + (type === 'AND' ? 'selected' : '') + '>AND</option>'));
    select.append($('<option value="OR" ' + (type === 'OR' ? 'selected' : '') + '>OR</option>'));

    return self.$globalGroup.html(select).append(self.$globalGroupContainer).append(removeButton);
  }

  function getModels(self){
    var selectModel = $('<ul class="filter-models-select"></ul>');
    if (self.$models) {
      self.$models.forEach(function(value) {
        selectModel
          .append($('<li value="' + value + '">' + value + '</li>'));
      });
    } else {
      selectModel
        .append($('<li disabled selected>No Models defined.</li>'));
    }
    return selectModel;
  }

  function getModelsAsOptions(self) {
    self.$selectModels.html('');
    var textAndModel = $('<div class="filter-input-select"></div>');
    var textInput = $('<input type="text" />');
    var selectModel1 = getModels(self);
    var selectModel2 = getModels(self);
    var rule = $('<select class="filter-model-rule"><option value="IN">IN</option><option value="NOTIN">NOT IN</option></select>');
    var removeButton = $('<span class="btn remove"><i class="fa fa-minus"></i></span>').on('click', function() {
      self.clearAll();
    });

    selectModel1.change(function() {
      var idx = $(this).prop('selectedIndex');
      selectModel2.find('option').each(function () {
        $(this).prop('disabled', false);
      });
      selectModel2.prop("selectedIndex", idx);
    });
    selectModel2.change(function() {
      self.$selectedModel = $(this).val();
      $(this).parent().trigger('updaterules:options');
    });

    textAndModel.append(textInput).append(selectModel1);
    self.$selectModels.append(removeButton).append(textAndModel).append(rule).append(selectModel2);
    self.$container.append(self.$selectModels);
  }

  function getOptionsFromModel(self, element) {
    var options = self.$selectedModel ? self.options.Models[self.$selectedModel] : undefined;

    if (!options) {
      var li = $('<option disabled selected>No Models Selected.</option>');
      element
        .append(li);
    } else {
      element
        .append($('<option disabled selected>Select Option</option>'));
    }
    for (var key in options) {
      var li = $('<option value="' + key + '" data-validation="' + options[key] + '">' + key + '</option>');
      li.on('mousedown', function() {
        console.log($(this).data());
      });
      element
        .append(li);
    }
  }

  var states = function(self) {
    return {
      init: function() {
        self.$selectionOptionsContainer.children().remove();
        getModelsAsOptions(self);
        self.state = 'groupsList';
      },
      listOptions: function() {
        self.$selectionOptionsContainer.children().remove();
        self.$selectionOptionsContainer
          .append(self.$groupSelection)
          .append(self.$condition);
        self.$groupSelection.on('click', function(e) {
          self.clickOption('AND');
        });
        self.$condition.on('click', function(e) {
          self.clickOption('OR');
        });
      },
      groupsList: function() {
        self.$selectionOptionsContainer.children().remove();
        self.$selectionOptionsContainer
          .append(self.$groupSelection)
          .append(self.$condition);
        self.$groupSelection.on('click', function(e) {
          self.clickOption('AND');
        });
        self.$condition.on('click', function(e) {
          self.clickOption('OR');
        });
      },
    }
  };

  UnifiedSearchFilter.prototype = {
    constructor: UnifiedSearchFilter,

    init: function() {
      var self = this;
      $(document).unbind('mousedown').mousedown(function(event) {
        if (!$(event.target).closest('.filter-dropdown').length) {
          if ($('.filter-addButton').hasClass('active')) {
            $('.filter-addButton').removeClass('active');
            $('.filter-addButton').html(self.$plus);
            $('.filter-dropdown').slideUp(100).removeClass('open');
          }
        }
      });

      this.closeAccordion = function() {
        self.$plusButton.removeClass('active');
        self.$selectionOptionsContainer.slideUp(100).removeClass('open');
      };

      this.openAccordion = function() {
        self.$plusButton.addClass('active');
        self.$selectionOptionsContainer.slideDown(100).addClass('open');;
      };

      this.clickOption = function(groupType) {
        self.$selectModels.addClass('filter-models-after');
        self.addGroup(groupType);
        self.closeAccordion();
        self.$plusButton.html(self.$plus);
      };

      this.$plusButton.on('click', function(e) {
        if (self.state !== 'init') {
          if ($(this).hasClass('active')) {
            self.closeAccordion();
            $(this).html(self.$plus)
          } else {
            self.closeAccordion();
            $(this).html(self.$minus)
            self.openAccordion();
          }
        }

        states(self)[self.state]();

        e.preventDefault();
      });
    },

    destroy: function() {
      $(document).unbind('mouseup')
      this.$container.remove();
      this.$selectionOptionsContainer.remove();
      this.$plusButton.remove();
      this.$element.removeData('unifiedSearchFilter');
      this.$element.show();
    },

    addGroup: function(type) {
      var self = this;
      if (!self.hasGlobal) {
        this.$container.append(addGlobalGroup(self, type));
      } else {
        this.$globalGroupContainer.append(newGroup(self, type));
      }
    },

    addCondition: function() {
      var self = this;

    },

    clearAll: function() {
      this.$selectModels.removeClass('filter-models-after');
      this.$container.children().remove();
      this.$globalGroup.children().remove();
      this.$globalGroupContainer.children().remove();
      this.hasGlobal = false;
      this.$selectedModel = '';
      this.state = 'init';
    },

    clearGlobalGroup: function() {
      this.hasGlobal = false;
      this.$globalGroup.children().remove();
      this.$globalGroupContainer.children().remove();
      if (this.$container.children().length === 1) this.$selectModels.removeClass('filter-models-after');
    },
  };

  /**
   * Register JQuery plugin
   */
  $.fn.unifiedSearchFilter = function(args) {
    var results = [];
    this.each(function() {
      var unifiedSearchFilter = $(this).data('unifiedSearchFilter');
      if (!unifiedSearchFilter) {
        unifiedSearchFilter = new UnifiedSearchFilter(this, args);
        $(this).data('unifiedSearchFilter', unifiedSearchFilter);
        results.push(unifiedSearchFilter)
      } else if (unifiedSearchFilter[args]) {
        var retVal = unifiedSearchFilter[args]();
        if (retVal) {
          results.push(retVal);
        }
      }
    });

    if (typeof args === 'string') {
      return results.length > 1 ? results : results[0];
    } else {
      return results;
    }
  };

  $.fn.unifiedSearchFilter.Constructor = UnifiedSearchFilter;

})(jQuery);
