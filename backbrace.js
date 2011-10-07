/**
 * Backbrace
 * Mike McNeil 2011
 *
 * dependencies:
 * backbone.js
 * underscore.js
 * jquery
 */


// Adds a max and minimum to backbone collections
Backbone.Collection = Backbone.Collection.extend({
	max: 100,
	min: 0,
	// Add without overflowing
	safeAdd: function (o) {
		if (this.length < this.max) {
			this.add(o);
			if (this.length==this.max && this.onFull) this.onFull();
			return true;
		} else return false;
	},
	// Remove without overflowing
	safeRemove: function (o) {
		if (o && o.length && this.length-o.length >= this.min) {
			this.remove(o);
			return true;
		}
		else if (o && this.length-1 >= this.min) {
			this.remove(o)
			return true;
		}
		else
			return false;
	}
})



//
//
// When you extend this class:
//
// 1) set this.el = a form selector
//
// 2) set this.model = the backbone class name of your model (i.e. Message)
//
// 3) There is a map "rules" in the backbone model
//
// 4) All form fields must have classes 'field' and $fieldName where $fieldname == the corresponding
//		attribute in the backbone model.  If you assign a validation rule that and $fieldName
//		which is not in the model, you can still use custom validation (things like reentering your password)
//
// 5) Overwrite decorateField and undecorateField to control what happens when an error is detected (and resolved)
//
Backbone.Model = Backbone.Model.extend({
	
	validateOne: function (field,value) {
		var ruleName = this.rules[field];
		var result = this.runValidationFn(this.attributes,ruleName,field,value);
		return result;
	},
	// Validate a field for one or more rules
	runValidationFn: function (attributes,rule,fieldName,value) {
		// Parse rule name, get options if they exist
		if (_.isArray(rule)) {
			var errors = [];
			for (var i=0;i<rule.length;i++) {
				var error=this.runValidationFn(attributes,rule[i],fieldName,value);
				if (error)
					errors.push(error);
			}
			return (errors.length > 0) ? errors : false;
		}
		else {
			var ruleName,options={};
			if (_.isString(rule)) {
				ruleName=rule;
			}
			else {
				ruleName = rule.name;
				options = _.extend(options,rule);
			}
			// Add all new values to options
			options = _.extend(options,{
				newValues: attributes
			});
			if (!this.validators[ruleName])
				throw new Error ("Unknown validation function ("+ruleName+")!");
			else {
				return this.validators[ruleName](fieldName,this,value,options);
			}
		}
	},

	// adapted from https://github.com/n-time/backbone.validation/blob/master/backbone.validations.js
	validators: {
		custom : function(attributeName, model, valueToSet,options) {
			return model[options.methodName](attributeName, valueToSet);
		},
		required : function(attributeName, model, valueToSet) {
			var currentValue = model.get(attributeName);
			var isNotAlreadySet = _.isUndefined(currentValue);
			var isNotBeingSet = _.isUndefined(valueToSet);
			if (_.isNull(valueToSet) || valueToSet === "" || (isNotBeingSet && isNotAlreadySet)) {
				return "required";
			}
			return false;
		},
		email : function(attributeName, model, valueToSet) {
			var emailRegex = new RegExp("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?");

			if (_.isString(valueToSet) && !valueToSet.match(emailRegex)) {
				return "email";
			} else return false;
		},
		url : function(attributeName, model, valueToSet) {
			var urlRegex = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
			if (_.isString(valueToSet) && !valueToSet.match(urlRegex)) {
				return "url";
			} else return false;
		},
		pattern : function(attributeName, model, valueToSet,options) {
			if (_.isString(valueToSet)) {
				if (valueToSet.match(options.pattern)) {
					return false;
				} else {
					return "pattern";
				}
			} else return false;
		},
		min : function(attributeName, model, valueToSet,options) {
			if (valueToSet < options.minimumValue) {
				return "min";
			} else return false;
		},
		max : function(attributeName, model, valueToSet,options) {
			if (valueToSet > options.maximumValue) {
				return "max";
			} else return false;
		},
		minlength : function( attributeName, model, valueToSet,options) {
			if (_.isString(valueToSet)) {
				if (valueToSet.length < options.minlength) return "minlength";
			}
			return false;
		},
		maxlength : function( attributeName, model, valueToSet,options) {
			if (_.isString(valueToSet)) {
				if (valueToSet.length > options.maxlength) return "maxlength";
			}
			return false;
		}
	}
});


/**
 * Form view
 */
Backbone.Form = Backbone.View.extend({
	dataKey: 'backbraceinput',
	events: {
		"focus .field": "focusField",
		"blur .field": "blurField",
		"change .field":"changeField",
		"submit":"submitForm"
	},
	fields: {},
	initialize: function () {
		this.model = new (this.model)()
		this.el = $(this.el);

		// Populate fields
		var view = this;
		_.each(this.model.rules,function (value,field) {
			var element = view.el.find(".field."+field);
			element.data(view.dataKey,field);
			view.fields[field]=element;
		})
		_.bindAll(this);
	},
	focusField: function (e) {
		this.undecorateField($(e.currentTarget));
	},
	blurField: function (e) {
		this.validateField($(e.currentTarget));
	},
	changeField: function (e) {
		this.validateField($(e.currentTarget));
	},
	submitForm: function(e) {
		if (!this.validateFields()) {
			// Allow traditionals form submission by default
			// you can override this with an AJAX submission if you'd like
			return true;
		}
		else {
			// Prevent form submission
			e.preventDefault();
			return false;
		}
	},
	validateField: function(element) {
		var field = element.data(this.dataKey),
		input = this.fields[field],
		hasError;
		if (field) {
			hasError = this.model.validateOne(field,input.val());
			this.renderField(hasError,input,field);
		}
		return !field || hasError;
	},
	renderField: function(error,elem,field) {
		if (error)
			this.decorateField(elem,error);
		else
			this.undecorateField(elem,error);
	},
	validateFields: function () {
		// Get values from form
		var view = this;
		var data= {},
		hasError = false;
		_.each(this.model.rules,function (rule,field) {
			var elem = view.el.find(".field."+field);
			hasError = view.validateField(elem) || hasError;
			data[field] = view.el.find(".field."+field).val();
		});
		this.model.set(data);
		return hasError;
	},

	// Presentation logic for error reporting

	/**
	 * element -> the form element that is naughty
	 * error   -> the string key of the validation fail that was triggered
	 *				( i.e. required, email, url, minLength, etc. )
	 */
	decorateField: function(element,error) {
		element.addClass('error')
		element.parent().addClass('error');
	},
	undecorateField: function(element,error) {
		element.removeClass('error');
		element.parent().removeClass('error');
	}
});