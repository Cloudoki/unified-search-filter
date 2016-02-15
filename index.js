(function ($) {
  'use strict';

  /**
   * Default options to be used in the plugin
   * @type {Object}
   */
  var defaultOptions = {
    plus: '<span>+</span>',
    minus: '<span>―</span>',
    endpoint: '/search',
    simple: false,
    success: function (data) {
      /* eslint-disable no-console */
      console.log(data);
      /* eslint-enable no-console */
    },
    error: function (errMsg) {
      /* eslint-disable no-console */
      console.error(errMsg);
      /* eslint-enable no-console */
    },
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
     * @return {boolean}     returns true if it's a valid date
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

    if (options.Models) setModels(self, options.Models);

    this.$element = $(el);
    this.$element.hide();

    this.$plus = $(options.plus || defaultOptions.plus);

    defaultOptions.plus = options.plus || defaultOptions.plus;
    defaultOptions.minus = options.minus || defaultOptions.minus;

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

    this.$query = {
      queries: []
    };

    this.init();
  }

  /**
   * Get the models as a selectable menu with each model as an option
   * @param {Object} self        the object containing the plugin
   * @param {HTML elemnt} parent the main parent container of the query
   * @return {HTML element}      element with the options
   */
  function getModelsAsOptions(self, parent) {
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

    selectModelHeader.change(function () {
      /* eslint-disable no-param-reassign */
      parent.data('dataquery').where = selectModelHeader.data('value');
      /* eslint-enable no-param-reassign */
    });

    return selectModel;
  }

  /**
   * Get the input for user search and the models as a selectable menu with each model as an option
   * @param  {Object} self       the object containing the plugin
   * @param {HTML elemnt} parent the main parent container of the query
   * @return {HTML element}      element with the input and options
   */
  function getModelsInput(self, parent) {
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

    textInput.change(function () {
      /* eslint-disable no-param-reassign */
      parent.data('dataquery').search = textInput.val();
      /* eslint-enable no-param-reassign */
    });

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
   * @param {object} self         the object containing the plugin
   * @param {HTML element} parent the main parent container of the query
   * @param {object} groups       The object where to put the query rules
   * @return {HTML element}       the created element
   */
  function addRule(self, parent, groups) {
    var ruleOptionsContainer = $('<div class="filter-rule-dropdown"></div>');
    var input = $('<input type="text"></input>');
    var condition = $('<select></select>');
    var where = $('<select></select>');
    var removeButton = $(' <span class="filter-btn filter-remove" title="Remove Rule">' +
      defaultOptions.minus + '</span>');

    var value = $(parent).find('.filter-models-wrapper')
      .find('.filter-models-select').data('value');

    var rule = {
      field: '',
      operator: '',
      type: '',
      value: ''
    };

    groups.rules.push(rule);

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
      rule.field = where.val();
      rule.type = type;
      getRuleCondition(condition, type);
      if (type === 'date') {
        input.datepicker();
      } else {
        input.datepicker('destroy');
      }
    });
    removeButton.on('click', function () {
      $(this).parent().remove();
      groups.rules.splice(groups.rules.indexOf(rule), 1);
      return false;
    });
    input.change(function () {
      var el = $(this);
      var content = el.val();
      if (!validation[where.find(':selected').data('validation')](content)) {
        el.removeClass('valid').addClass('invalid');
      } else {
        rule.value = content;
        el.removeClass('invalid').addClass('valid');
      }
    });
    rule.operator = condition.val();
    condition.change(function () {
      rule.operator = condition.val();
    });
    ruleOptionsContainer.append(where).append(condition).append(input);
    ruleOptionsContainer
      .append(removeButton);
    return ruleOptionsContainer;
  }

  /**
   * Creates a group to add rules to
   * @param {object} self        the object containing the plugin
   * @param {HTML element} parent the main parent container of the query
   * @return {HTML element}      the created element
   */
  function addGroup(self, parent) {
    var group = $('<div class="filter-group"></div>');
    var groupContainer = $('<div class="filter-group-container"></div>');
    var leftParentheses = $('<span class="parentheses">(</span>');
    var rightParentheses = $('<span class="parentheses">)</span>');
    var removeButton = $(' <span class="filter-btn filter-remove" title="Remove group">' +
      defaultOptions.minus + '</span>');
    var addButton = $('<span class="filter-btn filter-add" title="Add rule">' +
      defaultOptions.plus + '</span>');
    var select = $('<select name="group"></select>');

    var groups = {
      condition: 'AND',
      rules: []
    };
    var index;

    removeButton.on('click', function () {
      $(this).parent().remove();
      index = parent.data('dataquery').global.groups.indexOf(groups);
      parent.data('dataquery').global.groups.splice(index, 1);
      return false;
    });
    addButton.on('click', function () {
      groupContainer.append(addRule(self, parent, groups));
      return false;
    });

    select.append($('<option value="AND" selected<>AND</option>'));
    select.append($('<option value="OR">OR</option>'));

    if (!parent.data('dataquery').global) {
      /* eslint-disable no-param-reassign */
      parent.data('dataquery').global = {
        condition: 'AND',
        groups: []
      };
      /* eslint-enable no-param-reassign */
    }
    parent.data('dataquery').global.groups.push(groups);

    select.change(function () {
      groups.condition = select.val();
    });

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
    var removeButton = $(' <span class="filter-btn filter-remove" title="Remove Global Group">' +
      defaultOptions.minus + '</span>');
    var select = $('<select name="group"></select>');
    var leftParentheses = $('<span class="parentheses">(</span>');
    var rightParentheses = $('<span class="parentheses">)</span>');

    removeButton.on('click', function () {
      $(this).parent().remove();
      /* eslint-disable no-param-reassign */
      delete parent.data('dataquery').global;
      /* eslint-enable no-param-reassign */
      return false;
    });
    select.append($('<option value="AND" selected>AND</option>'));
    select.append($('<option value="OR">OR</option>'));

    select.change(function () {
      /* eslint-disable no-param-reassign */
      parent.data('dataquery').global.condition = select.val();
      /* eslint-enable no-param-reassign */
    });

    globalGroup.on('add:group', function () {
      addGroup(self, parent).insertBefore(rightParentheses, globalGroup);
    });

    return globalGroup.append(removeButton).append(select)
      .append(leftParentheses).append(rightParentheses);
  }

  /**
   * Creates the main query
   * @param {object} self              the object containing the plugin
   * @param {boolean} hasInitialQuery  indicates if fist query exist
   */
  function getMainQuery(self, hasInitialQuery) {
    var dataquery = {
      search: '',
      condition: 'in',
      where: '',
      global: {
        condition: 'AND',
        groups: []
      }
    };
    var modelsContainer = $('<div class="filter-models-query-container"></div>');

    self.$query.queries.push(dataquery);
    modelsContainer.data('dataquery', dataquery);
    /* eslint-disable vars-on-top */
    var removeButton = $('<span class="filter-btn filter-remove" title="Remove query">' +
      defaultOptions.minus + '</span>');
    var selectModel1 = getModelsInput(self, modelsContainer);
    var selectModel2 = getModelsAsOptions(self, modelsContainer);
    var rule = $('<select class="filter-model-rule"><option value="in">in</option>' +
      '<option value="notin">not in</option></select>');
    var addButton = $('<span class="filter-btn filter-add" title="Add group condition">' +
      defaultOptions.plus + '</span>');

    var globalGroup = addGlobalGroup(self, modelsContainer);
    /* eslint-enable vars-on-top */

    removeButton.on('click', function () {
      modelsContainer.remove();
      /* eslint-disable vars-on-top */
      var index = self.$query.queries.indexOf(dataquery);
      /* eslint-enable vars-on-top */
      self.$query.queries.splice(index, 1);
      if (!$('[data-role="initialQuery"]').length &&
        $('.filter-models-query-container').length) {
        $('.filter-models-query-container:first').attr('data-role', 'initialQuery')
          .find('select.filter-model-rule:first').remove();
        /* eslint-disable no-param-reassign */
        delete self.$query.queries[0].queryCondition;
        /* eslint-enable no-param-reassign */
      }
    });

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

    rule.change(function () {
      dataquery.condition = rule.val();
    });

    if (hasInitialQuery) {
      /* eslint-disable vars-on-top */
      var queryCondition = $('<select class="filter-model-rule">' +
        '<option value="AND">AND</option><option value="OR">OR</option></select>');
      /* eslint-enable vars-on-top */
      modelsContainer.append(queryCondition);
      dataquery.queryCondition = queryCondition.val();
      queryCondition.change(function () {
        dataquery.queryCondition = queryCondition.val();
      });
    } else {
      modelsContainer.attr('data-role', 'initialQuery');
    }

    modelsContainer.append(removeButton).append(selectModel1)
      .append(rule).append(selectModel2).append(addButton);
    self.$selectModels.append(modelsContainer);
    self.$container.append(self.$selectModels);
  }

  /**
   * Send the query to the server to do the search
   */
  function sendQuery(self) {
    var data = JSON.stringify(self.$query);

    // TODO: verify if fields are valid

    if(self.options.onQuery) {
      self.options.onQuery(self.$query);
    } else {
      $.ajax({
        type: 'POST',
        url: self.options.endpoint || defaultOptions.endpoint,
        data: data,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: self.options.success || defaultOptions.success,
        error: self.options.error || defaultOptions.error
      });
    }
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
        var initialQuery = $('[data-role="initialQuery"]').length > 0;
        getMainQuery(self, initialQuery);
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

      $('[data-role="searchButton"]').click(function () {
        sendQuery(self);
      });

      getMainQuery(self, false);
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
    },
  };

  /**
   * Register JQuery plugin
   */
  /* eslint-disable no-param-reassign */
  $.fn.unifiedSearchFilter = function (args) {
  /* eslint-enable no-param-reassign */
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
  /* eslint-disable no-param-reassign */
  $.fn.unifiedSearchFilter.Constructor = UnifiedSearchFilter;
  /* eslint-enable no-param-reassign */
/* eslint-disable no-undef */
})(jQuery);
/* eslint-enable no-undef */
