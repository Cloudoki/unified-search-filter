(function ($) {
  'use strict';

  /**
   * Default options to be used in the plugin
   * @type {Object}
   */
  var defaultOptions = {
    plus: '<span>+</span>',
  };
  /**
   * Map of html characters to be escaped and corresponding ascii code
   * @type {Object}
   */
  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
    '/': '&#x2F;'
  };
  /**
   * The rules for the different types of data
   * @type {Object}
   */
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
  };
  /**
   * Validate the different types of data
   * @type {Object}
   */
  var validation = {
    /**
     * Validates text
     * @param  {string} text text to be tested
     * @return {boolean}     returns true if it's a text
     */
    text: function (text) {
      var pattern = /\w\W*/gi;
      return pattern.test(text);
    },
    /**
     * Validates number
     * @param  {string} number number to be tested
     * @return {boolean}     returns true if it's a number
     */
    number: function (number) {
      var pattern = /^\d+$/g;
      return pattern.test(number);
    },
    /**
     * Validates email
     * @param  {string} email email to be tested
     * @return {boolean}     returns true if it's an email
     */
    email: function (email) {
      /* eslint-disable max-len */
      var pattern = /^(([a-zA-Z]|[0-9])|([-]|[_]|[.]))+[@](([a-zA-Z0-9])|([-])){2,63}[.](([a-zA-Z0-9]){2,63})+$/gi;
      /* eslint-enable max-len */
      return pattern.test(email);
    },
    /**
     * Validates date
     * @param  {string} date date to be tested
     * @return {boolean}     returns true if it's a date
     */
    date: function (date) {
      /* eslint-disable max-len */
      var pattern = /^(?:(?:(?:0?[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0?[1,3-9]|1[0-2])(\/?|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:(?:0?2)(\/?|-|\.)(?:29)\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:(?:0?[1-9])|(?:1[0-2]))(\/?|-|\.)(?:0?[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/gm;
      /* eslint-enable max-len */
      return pattern.test(date);
    },
  };

  /**
   * Escape html characters
   * @param  {String} string  text with characters to escape
   * @return {string}         escaped text
   */
  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  /**
   * Put the models received as arguments in a container
   * @param {object} self   Instance of UnifiedSearchFilter object
   * @param {object} Models The models received
   */
  function setModels(self, Models) {
    var modelsCount = Object.keys(Models).length;
    var i = 0;
    var key;
    /* eslint-disable no-param-reassign */
    self.$models = [];
    /* eslint-enable no-param-reassign */
    for (i; i < modelsCount; i++) {
      key = Object.keys(Models)[i];
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

    this.$plus = $(options.plus || defaultOptions.plus);

    this.$wrapper = $('<div class="filter-wrapper"></div>');
    this.$plusButton = $('<button class="filter-addButton" title="Add query"></button>');

    // TODO: future feature add contenteditable to filter so it can be
    // delete using keyboard
    this.$container = $('<div id="input" class="filter-single-line filter-input"></div>');

    this.$selectModels = $('<div class="filter-models"></div>');

    this.$selectedModel = undefined;

    this.$groupSelection = $('<li>Add Group</li>');
    this.$condition = $('<li>Add Condition</li>');
    this.$addModel = $('<li data-type="model">Model</li>');

    this.$element.before(this.$wrapper);
    this.$wrapper.append(this.$container);
    this.$container.after(this.$plusButton);

    this.$plusButton.html(this.$plus);

    this.$query = {};

    this.init();
  }

  /**
   * Get the models as a selectable menu with each model as an option
   * @param  {Object} self       the object containing the plugin
   * @return {HTML element}      element with the options
   */
  function getModelsAsOptions(self) {
    var selectModel = $('<div class="filter-models-wrapper"></div>');
    var selectModelHeader = $('<div class="filter-models-select" data-value="">Select Model</div>');
    var selectModelOptions = $('<ul class="filter-models-options"></ul>');
    var val;
    if (self.$models) {
      self.$models.forEach(function (value) {
        var option = $('<li data-value="' + value + '">' + value + '</li>');
        selectModelOptions.append(option);
        option.click(function () {
          if (!option.hasClass('disabled')) {
            val = $(this).data('value');
            selectModelHeader.data('value', val).html(val);
            selectModelHeader.trigger('change');
            selectModelOptions.hide();
          }
          return false;
        });
      });
    } else {
      selectModelOptions
        .append($('<li class="disabled">No Models defined.</li>'));
    }

    selectModel.append(selectModelHeader).append(selectModelOptions.menu().hide());

    selectModelHeader.click(function () {
      selectModelOptions.show().position({
        my: 'center-8 top',
        at: 'right bottom',
        of: this
      });
      return false;
    });
    $(document).on('click', function () {
      selectModelOptions.hide();
      return false;
    });

    return selectModel;
  }

  /**
   * Get the input for user search and the models as a selectable menu with each model as an option
   * @param  {Object} self       the object containing the plugin
   * @return {HTML element}      element with the input and options
   */
  function getModelsInput(self) {
    var textInput = $('<input type="text" />');
    var selectModel = $('<ul class="filter-models-options"></ul>');
    var textAndModel = $('<div class="filter-input-select"></div>');

    if (self.$models) {
      self.$models.forEach(function (value) {
        var option = $('<li data-value="' + value + '">' + value + '</li>');
        selectModel.append(option);
        option.click(function () {
          if (!option.hasClass('disabled')) {
            textInput.val(option.data('value'));
            textInput.change();
            textInput.blur();
          }
          return false;
        });
      });
    } else {
      /* eslint-disable vars-on-top */
      var option = $('<li class="disabled" data-value="">No Models defined.</li>');
      /* eslint-enable vars-on-top */
      selectModel.append(option);
      option.click(function () {
        textInput.val(option.data('value'));
        selectModel.hide();
        return false;
      });
    }

    selectModel.menu().hide();

    textInput.focus(function () {
      selectModel.show().position({
        my: 'center-20 top',
        at: 'right bottom',
        of: this
      });
    });

    textInput.blur(function () {
      selectModel.hide();
    });

    textAndModel.append(textInput).append(selectModel);
    return textAndModel;
  }

  /**
   * Sets the models as options in the received element
   * @param  {object} self          the object containing the plugin
   * @param  {HTML element} element the element that will receive the options
   * @param  {string} selectedModel the model from which to get the options
   */
  function getOptionsFromModel(self, element, selectedModel) {
    var options = selectedModel ? self.options.Models[selectedModel] : undefined;
    var key;

    if (!options) {
      element.append($('<option disabled selected>No Models Selected.</option>'));
    } else {
      element
        .append($('<option disabled selected>Select Option</option>'));
      /* eslint-disable guard-for-in */
      for (key in options) {
        /* eslint-disable vars-on-top */
        var li = $('<option value="' + key + '" data-validation="' +
          options[key] + '">' + key + '</option>');
        /* eslint-enable vars-on-top */
        element.append(li);
      }
      /* eslint-enable guard-for-in */
    }
  }

  /**
   * Set the list of conditions available for received type
   * @param  {HTML element} element the element that will receive the conditions
   * @param  {string} type          the type of data
   */
  function getRuleCondition(element, type) {
    var paramType = type || 'text';
    var key;
    /* eslint-disable guard-for-in */
    for (key in rules[paramType]) {
      /* eslint-disable vars-on-top */
      var li = $('<option value="' + key + '">' + key + '</option>');
      /* eslint-enable vars-on-top */
      element.append(li);
    }
    /* eslint-enable guard-for-in */
  }

  /**
   * Creates a rule condition to add to a group
   * @param {object} self        the object containing the plugin
   * @param {HTML elemnt} parent the main parent container of the query
   * @return {HTML element}      the created element
   */
  function addRule(self, parent) {
    var ruleOptionsContainer = $('<div class="filter-rule-dropdown"></div>');
    var input = $('<input type="text"></input>');
    var condition = $('<select></select>');
    var where = $('<select></select>');
    var removeButton = $(' <span class="btn remove" title="Remove Rule">―</span>');

    var value = $(parent).find('.filter-models-wrapper')
      .find('.filter-models-select').data('value');

    getRuleCondition(condition);
    getOptionsFromModel(self, where, value);

    parent.on('update:model', function (e, el) {
      where.children().remove();
      getOptionsFromModel(self, where, $(el).data('value'));
    });
    where.on('change', function () {
      condition.children().remove();
      /* eslint-disable vars-on-top */
      var type = where.find(':selected').data('validation');
      /* eslint-enable vars-on-top */
      getRuleCondition(condition, type);
      if (type === 'date') {
        input.datepicker();
      } else {
        input.datepicker('destroy');
      }
    });
    removeButton.on('click', function () {
      $(this).parent().remove();
      return false;
    });
    input.change(function () {
      var el = $(this);
      var content = el.val();
      if (!validation[where.find(':selected').data('validation')](content)) {
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

  /**
   * Creates a group to add rules to
   * @param {object} self        the object containing the plugin
   * @param {HTML elemnt} parent the main parent container of the query
   * @return {HTML element}      the created element
   */
  function addGroup(self, parent) {
    var group = $('<div class="filter-group"></div>');
    var groupContainer = $('<div class="filter-group-container"></div>');
    var leftParentheses = $('<span>(</span>');
    var rightParentheses = $('<span>)</span>');
    var removeButton = $(' <span class="btn remove" title="Remove group">―</span>');
    var addButton = $('<span class="btn add" title="Add rule">+</span>');
    var select = $('<select name="group"></select>');

    removeButton.on('click', function () {
      $(this).parent().remove();
      return false;
    });
    addButton.on('click', function () {
      groupContainer.append(addRule(self, parent));
      return false;
    });

    select.append($('<option value="AND" selected<>AND</option>'));
    select.append($('<option value="OR">OR</option>'));

    return group.append(select).append(leftParentheses)
      .append(groupContainer).append(addButton)
      .append(rightParentheses).append(removeButton);
  }

  /**
   * Creates a global group to add groups
   * @param {object} self        the object containing the plugin
   * @param {HTML elemnt} parent the main parent container of the query
   * @return {HTML element}      the created element
   */
  function addGlobalGroup(self, parent) {
    var globalGroup = $('<div class="filter-global-group"></div>');
    var removeButton = $(' <span class="btn remove" title="Remove Global Group">―</span>');
    var select = $('<select name="group"></select>');
    var leftParentheses = $('<span>(</span>');
    var rightParentheses = $('<span>)</span>');

    removeButton.on('click', function () {
      $(this).parent().remove();
      return false;
    });
    select.append($('<option value="AND" selected>AND</option>'));
    select.append($('<option value="OR">OR</option>'));

    globalGroup.on('add:group', function () {
      addGroup(self, parent).insertBefore(rightParentheses, globalGroup);
    });

    return globalGroup.append(removeButton).append(select)
      .append(leftParentheses).append(rightParentheses);
  }

  /**
   * Creates the main query
   * @param {object} self        the object containing the plugin
   */
  function getMainQuery(self) {
    var modelsContainer = $('<div class="filter-models-query-container"></div>');
    var selectANDOR = $('<select class="filter-model-rule"><option value="AND">AND' +
      '</option><option value="OR">OR</option></select>');

    var state = 'clickedOnce';
    if (self.state === 'init') {
      state = 'init';
    }
    /* eslint-disable vars-on-top */
    var removeButton = $('<span class="btn remove" title="Remove query">―</span>')
      .on('click', function () {
        modelsContainer.remove();
        /* eslint-disable no-param-reassign */
        self.state = state;
        /* eslint-disable no param-reassign */
      });
    var selectModel1 = getModelsInput(self);
    var selectModel2 = getModelsAsOptions(self);
    var rule = $('<select class="filter-model-rule"><option value="in">in</option>' +
      '<option value="notin">not in</option></select>');
    var addButton = $('<span class="btn add" title="Add group condition">+</span>');

    var globalGroup = addGlobalGroup(self, modelsContainer);
    /* eslint-enable vars-on-top */

    addButton.on('click', function () {
      if (modelsContainer.find('.filter-global-group').length) {
        globalGroup.trigger('add:group');
      } else {
        globalGroup = addGlobalGroup(self, modelsContainer);
        globalGroup.trigger('add:group');
        modelsContainer.append(globalGroup);
      }
      return false;
    });

    selectModel1.find('input').on('change', function (e) {
      var value = escapeHtml($(e.target).val());
      selectModel2.find('[data-value]').removeClass('disabled');
      /* eslint-disable vars-on-top */
      var elem = selectModel2.find('li[data-value="' + value + '"]');
      /* eslint-enable vars-on-top */
      if (elem.length) {
        elem.addClass('disabled');
      }
    });

    selectModel2.find('div').on('change', function (e) {
      modelsContainer.trigger('update:model', e.target);
      /* eslint-disable vars-on-top */
      var value = escapeHtml($(e.target).data('value'));
      /* eslint-enable vars-on-top */
      selectModel1.find('[data-value]').removeClass('disabled');
      /* eslint-disable vars-on-top */
      var elem = selectModel1.find('li[data-value="' + value + '"]');
      /* eslint-enable vars-on-top */
      if (elem.length) {
        elem.addClass('disabled');
      }
    });

    if (self.state !== 'init') {
      modelsContainer.append(selectANDOR);
    }

    modelsContainer.append(removeButton).append(selectModel1)
      .append(rule).append(selectModel2).append(addButton);
    self.$selectModels.append(modelsContainer);
    self.$container.append(self.$selectModels);
  }

  /**
   * Send the query to the server to do the search
   */
  function sendQuery() {
    // TODO
  }
  /**
   * Extend the plugin to add more functions
   * @type {Object}
   */
  UnifiedSearchFilter.prototype = {
    constructor: UnifiedSearchFilter,

    /**
     * Initialize the plugin
     */
    init: function () {
      var self = this;

      this.$plusButton.on('click', function () {
        getMainQuery(self);
        self.state = 'clickedOnce';
        return false;
      });

      $(document).tooltip({
        position: {
          my: 'center bottom-20',
          at: 'center top',
          using: function (position, feedback) {
            $(this).css(position);
            $('<div>')
              .addClass('arrow')
              .addClass(feedback.vertical)
              .addClass(feedback.horizontal)
              .appendTo(this);
          }
        }
      });
    },

    /**
     * Destroys the plugin
     */
    destroy: function () {
      this.$container.remove();
      this.$plusButton.remove();
      this.$element.removeData('unifiedSearchFilter');
      this.$element.show();
    },

    /**
     * Clears all data from the querys
     */
    clearAll: function () {
      this.$container.children().remove();
      this.$selectedModel = '';
      this.state = 'init';
    },
  };

  /**
   * Register JQuery plugin
   */
  $.fn.unifiedSearchFilter = function (args) {
    var results = [];
    this.each(function () {
      var unifiedSearchFilter = $(this).data('unifiedSearchFilter');
      if (!unifiedSearchFilter) {
        unifiedSearchFilter = new UnifiedSearchFilter(this, args);
        $(this).data('unifiedSearchFilter', unifiedSearchFilter);
        results.push(unifiedSearchFilter);
      } else if (unifiedSearchFilter[args]) {
        /* eslint-disable vars-on-top */
        var retVal = unifiedSearchFilter[args]();
        /* eslint-enable vars-on-top */
        if (retVal) {
          results.push(retVal);
        }
      }
    });

    if (typeof args === 'string') {
      return results.length > 1 ? results : results[0];
    }
    return results;
  };

  $.fn.unifiedSearchFilter.Constructor = UnifiedSearchFilter;
/* eslint-disable no-undef */
})(jQuery);
/* eslint-enable no-undef */
