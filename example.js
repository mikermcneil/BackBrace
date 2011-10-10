// Build your domain model with defaults and validation rules
var Example = Backbone.Model.extend({
	initialize: function(obj) {
		this.body = obj;
	},
	defaults: {
		email:'',
		url:'',
		username:'',
		password:'',
		personality:'',
		newsletter:''
	},
	rules: {
		email: ["email","required"],
		url: ["url","required"],
		username: [
		{
			name:"minlength",
			minlength: 3
		},
		{
			name:"maxlength",
			maxlength: 15
		},
		"required"
		],
		password: ["required"]
	}
});
// Create, but don't use the form as your view
var ExampleForm = Backbone.Form.extend({
	model: Example,
	el: "form.example"
});
// Instead create a formview to encapsulate the form logic
var ExampleFormView = Backbone.View.extend({
	initialize: function () {
		// Make the form
		this.form = new ExampleForm();

		// Assign submission event
		this.form.submit = function () {
			var result=$("#form-result");
			var finish = function () {
				result.addClass('success').removeClass('error').fadeIn(800).text('Success!');
			}

			if (!result.hasClass('success'))
				result.fadeOut(100,finish);
			else finish();
		}
		// Assign error event
		this.form.error = function () {
			var result=$("#form-result");
			var finish = function (){
				result.addClass('error').fadeIn(800).text('Error!');
			}
			
			if (!result.hasClass('error'))
				result.fadeOut(100,finish);
			else finish();
		}

		// *****
		// Notice, I didn't override the decorateField and undecorateField events.
		// That's because I like them just how they are, thanks.

	}
})


// Initialize
$(function () {
	new ExampleFormView();
})

