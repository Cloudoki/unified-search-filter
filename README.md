# Unified Search Filter

A search query builder.

## Features
- Use a query to do searches instead of searching for keywords;

## Requirements
- [jQuery](https://jquery.com/)
- [jQuery UI](https://jqueryui.com/)

## Installation
- **Script Tag:** `<script type="text/javascript" src="https://cdn.rawgit.com/Cloudoki/unified-search-filter/master/index.js"></script>`
- **Bower:** `bower install git://github.com/Cloudoki/unified-search-filter.git`
- **npm:** `npm install github:Cloudoki/unified-search-filter`

## Usage

### Initialize the plugin:
```html
  <input data-role="unifiedSearchFilter" value="input data" />
  <button data-role="searchButton">search</button>
```
```javascript
$('[data-role="unifiedSearchFilter"]').unifiedSearchFilter({
    Models: {
        identities: {
            type: 'text',
            name: 'text',
            interprise: 'number',
            country: 'text',
            legalForm: 'text',
            location: 'text',
        },
        account: {
            ID: 'number',
            uniqueName: 'text',
            name: 'text',
        },
        users: {
            ID: 'number',
            email: 'email',
            firstName: 'text',
            lastName: 'text',
            "birthday": "date",
        },
    },
    plus: '<i class="fa fa-plus"></i>',
    minus: '<i class="fa fa-minus"></i>',
    endpoint: '/search',
    success: function (data) {
        console.log(data);
    },
    error: function (errorMsg) {
        console.log(errorMsg);
    },
});
```
Add the following line to your script `$(element).unifiedSearchFilter({options});` this will initialize the plugin in the chosen element with the options.
Add `data-role="searchButton"` to a element to make it so that when it's clicked the query will be sent to the endpoint(see options bellow).

### Options:
- Models (**required**): An object that represents the searchable data. This object must have models and each model contains the attributes of that model as key and the type as an value. Thinking of databases the model would represent a table. For example, the following model:
```javascript
Models: {
    user: {
        firstName: 'text',
        lastName: 'text'
    }
}
```
can represent the searchable data in this table:
| id  | firstName | lastName | info |
| --- | --------- | -------- | ---- |
- plus: The icon or text you want to show on the plus buttons.
- minus: The icon or text you want to show on the minus buttons.
- endpoint (**required**): The URL you want the query to be sent. (*'/search'* by default).
- success: A function to be called on successful search.
- error: A function to be called on search failure.

### See example
You'll need a static server
If you have [nodejs](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.

Run `npm install`
And after the installation finishes 
`npm run example`
Open your browser at `http://127.0.0.1:8080/examples/`
