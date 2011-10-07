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
		email: ["required","email"],
		url: ["required","url"],
		username: [
			"required",
			{
				name:"minlength",
				minlength: 3
			},
			{
				name:"maxlength",
				maxlength: 15
			}
		],
		password: "required"
	}
});
var ExampleForm = Backbone.Form.extend({
	model: Example,
	el: "form.example"
});


// Initialize
$(function () {
	new ExampleForm();
})

