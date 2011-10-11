/**
 * Backbrace
 * Mike McNeil 2011
 *
 * dependencies:
 * backbone.js
 * underscore.js
 * jquery
 */

//
// When you extend this class:
//
// 1) set this.el = a form selector
//
// 2) set this.model = the backbone class name of your model (i.e. Message)
//
// 3) There is a map "rules" in the backbone model.  List them in order of display preference
//
// 4) All form fields must have classes 'field' and $fieldName where $fieldname == the corresponding
//		attribute in the backbone model.  If you assign a validation rule that and $fieldName
//		which is not in the model, you can still use custom validation (things like reentering your password)
//
// 5) Override decorateField and undecorateField to control what happens when an error is detected (and resolved)
//
// 6) Override handleForm to control your form's submit behavior
//
/**
 *
 *
 * events ->
 *	decorateField
 *	undecorateField
 *	submit
 *	error
 *
 * Methods ->
 *	reset
 */
Backbone.Form = Backbone.View.extend({

	// The jQuery.data key to use on form inputs (associates them w/ model)
	dataKey: 'backbraceinput',

	// Set to true to validate after an field's onblur event
	validateOnBlur: true,


	//////////////////////////////////////////////////////////////////////////
	// Public events
	//////////////////////////////////////////////////////////////////////////
	/**
	 * Presentation logic for error reporting
	 * element -> the form element that is naughty
	 * error   -> the string key of the validation fail that was triggered
	 *				( i.e. required, email, url, minLength, etc. )
	 *
	 *	Some sensible defaults are included here that depend on the
	 *	form convention outlined in example.html.
	 */
	decorateField: function(element,error) {
		try {
			element.addClass('error');
			element.parent().addClass('error');
			element.parent().children('span.validation-message').addClass('error').text(error[0].message);
		}
		catch (e) {
			var msg =
			"Trying to use default behavior of backbrace,"+
			" but there was an error when highlighting "+
			"a field.\n"+
			"If you don't want to use backbrace form conventions, "+
			"you must override highlightField.\n"
			if (console)
				console.log(msg,e);
			else alert(msg);
			throw e;
		}
	},
	undecorateField: function(element,error) {
		try {
			element.removeClass('error');
			element.parent().removeClass('error');
			element.parent().children('span.validation-message').addClass('error').text('');
		}
		catch (e) {
			var msg =
			"Trying to use default behavior of backbrace,"+
			" but there was an error when unhighlighting "+
			"a field."+
			"If you don't want to use backbrace form conventions, "+
			"you must override unhighlightField."
			if (console)
				console.log(msg,e);
			else alert(msg);
			throw e;
		}
	},

	/**
	 * Submit-- fired when form is successfully submitted
	 */
	submit: function() {

		// Override this with a method that handles the form here.
		alert("Backbrace default form handler triggered.");

		// To allow traditional form submission, return true
		// Default is to override
		return false;
	},
	/**
	 * Error-- fired when form submission is attempted, but fails
	 */
	error: function () {
	},


	//////////////////////////////////////////////////////////////////////////
	// Public actions
	//////////////////////////////////////////////////////////////////////////

	// Reset the form
	reset: function () {
		this.undecorateField(this.el.find('.field'))
	},
	// Trigger the form's submit event
	doSubmit: function () {
		this.el.submit();
	},



	events: {
		"focus .field": "focusField",
		"blur .field": "blurField",
		"change .field":"changeField",
		"submit":"trySubmit"
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
		if (this.validateOnBlur) {
			this.validateField($(e.currentTarget));
		}
	},
	changeField: function (e) {
		this.validateField($(e.currentTarget));
	},
	trySubmit: function(e) {
		if (!this.validateFields()) {
			if (this.submit())
				return true;
		}
		else
			this.error();

		// Prevent form submission
		e.preventDefault();
		return false;
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
		if (error) {
			if (! _.isArray(error))
				error = [error];
			this.decorateField(elem,error);
		}
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
	}
});




// Extensions to the model that support validation
Backbone.Model = Backbone.Model.extend({

	validateOne: function (field,value) {
		var ruleName = this.rules[field];
		var result = this.runValidationFn(this.attributes,ruleName,field,value);
		return result;
	},
	// Validate a field for one or more rules
	runValidationFn: function (attributes,rule,fieldName,value) {
		// Parse rule name, get options if they exist
		// If this is a list of rules, evaluate each rule
		if (_.isArray(rule)) {
			var errors = [];
			for (var i=0;i<rule.length;i++) {
				var error=this.runValidationFn(attributes,rule[i],fieldName,value);
				if (error)
					errors.push(error);
			}
			return (errors.length > 0) ? errors : false;
		}
		// Evaluate an individual rule
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
		// Error map
		errors: {
			required: {
				message: 'That field is required.'
			},
			email: {
				message: 'Invalid email.'
			},
			url: {
				message: 'Invalid URL.'
			},
			pattern: {
				message: 'pattern'
			},
			min: {
				message: 'min'
			},
			max: {
				message: 'max'
			},
			minlength: {
				message: 'Too short.'
			},
			maxlength: {
				message: 'Too long.'
			}
		},
		custom : function(attributeName, model, valueToSet,options) {
			return model[options.methodName](attributeName, valueToSet);
		},
		required : function(attributeName, model, valueToSet) {
			var currentValue = model.get(attributeName);
			var isNotAlreadySet = _.isUndefined(currentValue);
			var isNotBeingSet = _.isUndefined(valueToSet);
			if (_.isNull(valueToSet) || valueToSet === "" || (isNotBeingSet && isNotAlreadySet)) {
				return this.errors.required;
			}
			return false;
		},
		email : function(attributeName, model, valueToSet) {
			var emailRegex = new RegExp("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?");

			if (_.isString(valueToSet) && !valueToSet.match(emailRegex)) {
				return this.errors.email;
			} else return false;
		},
		url : function(attributeName, model, valueToSet) {
			var urlRegex = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
			if (_.isString(valueToSet) && !valueToSet.match(urlRegex)) {
				return this.errors.url;
			} else return false;
		},
		pattern : function(attributeName, model, valueToSet,options) {
			if (_.isString(valueToSet)) {
				if (valueToSet.match(options.pattern)) {
					return false;
				} else {
					return this.errors.pattern;
				}
			} else return false;
		},
		min : function(attributeName, model, valueToSet,options) {
			if (valueToSet < options.minimumValue) {
				return this.errors.min;
			} else return false;
		},
		max : function(attributeName, model, valueToSet,options) {
			if (valueToSet > options.maximumValue) {
				return this.errors.max;
			} else return false;
		},
		minlength : function( attributeName, model, valueToSet,options) {
			if (_.isString(valueToSet)) {
				if (valueToSet.length < options.minlength) return this.errors.minlength;
			}
			return false;
		},
		maxlength : function( attributeName, model, valueToSet,options) {
			if (_.isString(valueToSet)) {
				if (valueToSet.length > options.maxlength) return this.errors.maxlength;
			}
			return false;
		}
	}
});



// Bonus?
// This should probably be put somewhere else,
// but it's included because it's userful
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