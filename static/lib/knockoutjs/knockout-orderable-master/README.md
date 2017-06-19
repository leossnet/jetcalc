Knockout orderable binding
==================
This knockout binding allows to create sortable tables. It works by sorting items in observableArray, so tables rendered by "foreach" binding are automatically refreshed by knockout.

##Design Goals

###Focused only on ordering
Some other plugins take control of entire table rendering, making it complicated to build arbitrary tables. This plugin is only focused on sorting of observableArrays, leaving rendering of HTML to knockout. It gives freedom of using custom item templates for tables or lists.

###Controllable from a view model
When binding applied for the first time it adds extra observables to a view model. So order can be changed programmatically like 

	viewModel.people.orderDirection("desc") 
or 

	viewModel.people.orderDirection("lastName")

###Minimal view model setup
There is nothing to be configured on a view model manually to use the plugin. Only bindings have to be set on elements which will trigger observableArray to be reordered.

###Can be used with multiple observableArrays
Works well with multiple observableArray. oservableArrays can be ordered independently of each other.


##Usage
To make table header sortable set binding like this:

	<th><a href="#" data-bind="orderable: {collection: 'people', field: 'firstName'}">First Name</a></th>

Default field to sort can also be provided:

	<th><a href="#" data-bind="orderable: {collection: 'people', field: 'age', defaultField: true, defaultDirection: 'desc'}">Age</a></th>

It's also possible to sort by nested attibutes by separating the attribute names with a dot (should work with array indices too):

	<th><a href="#" data-bind="orderable: {collection: 'people', field: 'pet.name'}">Pet name</a></th>

See full examples in examples folder.

##Dependencies
 - [jQuery](http://jquery.com/)
 - [Knockout](http://knockoutjs.com/)

##License
MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
