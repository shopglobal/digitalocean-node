(function() {
  var slice = [].slice;

  module.exports.safeUrl = function() {
    var args = Array.prototype.slice.call(arguments);
    return args.reduce(function(accum, fragment) {
      return accum + '/' + encodeURIComponent(fragment);
    }, '');
  };

  // Based on Humps by Dom Christie
  var decamelizeKeys = function(object) {
    // if we're not an array or object, return the primative
    if (object !== Object(object)) {
      return object;
    }

    var decamelizeString = function(string) {
      var separator = '_';
      var split = /(?=[A-Z])/;

      return string.split(split).join(separator).toLowerCase();
    };


    var output;
    if (object instanceof Array) {
      output = [];
      for(var i = 0, l = object.length; i < l; i++) {
        output.push(decamelizeKeys(object[i]));
      }
    } else {
      output = {};
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          output[decamelizeString(key)] = decamelizeKeys(object[key]);
        }
      }
    }

    return output;
  };
  module.exports.decamelizeKeys = decamelizeKeys;

  module.exports.extractListArguments = function(args, countPrependedArgs) {
    var startIndex, endIndex, id, params, callback;

    var hasCallback = typeof(args[args.length - 1]) === 'function';

    startIndex = countPrependedArgs;
    if (args.length > 0) {
      endIndex = args.length;
      if (hasCallback) {
        endIndex -= 1;
      }
      params = slice.call(args, startIndex, endIndex);
    } else {
      endIndex = countPrependedArgs;
      params = [];
    }

    if (countPrependedArgs > 0) {
      id = args[0];
    }

    if (hasCallback) {
      callback = args[args.length - 1];
    }

    return {
      identifier: id,
      callback: callback,
      params: params
    };
  };

  /**
   * A class that runs the pagination until the end if necessary.
   *
   * @class PaginatingArray
   */
  var PaginatingArray = function(client, initialData, totalLength, path, requestOptions, queryParams, successStatuses, successRootKeys) {
    this.currentPage = 1 //queryParams && queryParams.page || 1; // default to start at page 1
    // this.perPage = queryParams && queryParams.per_page || 25; // default to 25 per page
    this.totalLength = totalLength;
    this.concat(initialData); // bootstrap with initial data

    // encapuslate this in a curried function?
    this.path = path;
    this.requestOptions = requestOptions;
    this.queryParams = queryParams;
    this.successStatuses = successStatuses;
    this.successRootKeys = successRootKeys;
  };
  PaginatingArray.prototype = Object.create(Array.prototype);

  /**
   * Implement the iterator protocol. Return an object that responds to next()
   * with two properties: a boolean `done` and `value` with the result of that iteration, which is a promise in this case.
   */
  PaginatingArray.prototype.iterator = function() {
    var totalIterated = 0; //this.currentPage * this.perPage;
    var paginatedArray = this;
    return {
      next: function() { // needs to curry below and return the results of a promise?
        if totalIterated < paginatedArray.totalLength {
          if (totalIterated > paginatedArray.length) {
            // Fetch next page
            var promise = paginatedArray.nextPage();
            // TODO promise => page
            // var page = promise.resolve()....
            paginatedArray.concat(page);
          }

          var value = paginatedArray[totalIterated];
          totalIterated += 1;
          return {
            value: value, //TODO caller should do something with errors
            done: false
          };
        } else {
          return {
            done: true
          };
        }
      }
    }
  }
  // PaginatingArray.prototype[Symbol.iterator] = PaginatingArray.prototype.iterator;

  // returns a promise
  PaginatingArray.prototype.nextPage = function(page) {
    this.currentPage += 1;
    queryParams.page = currentPage;
    var promise = this.client.get(
      this.client,
      this.path,
      this.requestOptions,
      this.queryParams,
      this.successStatuses,
      thisl.successRootKeys
    );

    // hook into promise to add
    return promise;
  }

  module.exports.PaginatingArray = PaginatingArray;
}).call(this);

// array => nextPage, previousPage, forEach, forEachInAllPages ?
// from stripe:
// def auto_paging_each(&blk)
//   return enum_for(:auto_paging_each) unless block_given?

//   page = self
//   loop do
//     page.each(&blk)
//     page = page.next_page
//     break if page.empty?
//   end
// end

// function letters() {
//   var state = 0;
//   return {
//     next: function() {
//       switch (state) {
//         case 0:
//           console.log('a');
//           state = 1;
//           return {
//             value: 'a', // Return the first yielded value.
//             done: false
//           };
//         case 1:
//           console.log('b');
//           state = 2;
//           return {
//             value: 'b', // Return the second yielded value.
//             done: false
//           };
//         case 2:
//           console.log('c');
//           return {
//             value: 'c',
//             done: true
//           };
//       }
//     }
//   };
// }

// // usage:
// var a = letters();
// a.next(); a.next(); a.next(); a.next();

// for (var alpha in letters()) {
//   console.log(alpha);
// }

// getAllDroplets().then(function(allDroplets) {
//   console.log(allDroplets);
// }).catch(function(err) {
//   console.log(err);
// });

// function getAllDroplets() {
//   var allDroplets = [];

//   function getDropletPage(page) {
//     if (page == null) {
//       page = 1;
//     }

//     return client.droplets.list(page)
//       .each(function(droplet) {
//         allDroplets.push(droplet);
//       })
//       .then(function(droplets) {
//         var links = droplets._digitalocean.body.links;
//         var isLastPage = links && (
//           !links.pages ||
//             (links.pages && links.pages.last === undefined)
//         );

//         if (isLastPage) {
//           return allDroplets;
//         } else {
//           return getDropletPage(page + 1);
//         }
//       });
//   }

//   return getDropletPage();
// }
