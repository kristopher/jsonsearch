/*
  Usage:
   
   var json_search = new JSONSearch({
     fields: {
       first_name: 'prefix',
       last_name: 'exact',
       category: 'infix'
     },
     ranks: {  // Not require but suggested
       first_name: 2,
       last_name: 1,
       category: 0
     },
     limit: 10,
     case_sensitive: false
   }); 
   
   json_search.getResults('first', [{ first_name: 'first', last_name: 'last', category: 'names'}, { first_na...]);
*/
//TODO remove Prototype dependency
var JSONSearch = Class.create({

  fields: {},
  ranks: {},
  limit: null,
  offset: 0,
  case_sensitive: 'i',
  query_string: '',
  query_function: new Template("1&&function(object) { var hits = 0, ranks_array = []; #{query_string} if (hits > 0) { return [(ranks_array.sort().last() || 0), hits, object]; } }"),
  patterns: {
    infix: '.*$token.*',
    prefix: '^$token.*',
    exact: '^$token$',
    word: '\\b$token\\b',
    word_prefix: '\\b$token.*'
  },
  
  initialize: function(options) {
    this.options = (options || {});
    this.fields = (Object.clone(this.options.fields) || {});
    this.ranks = this.getRanks();
    this.fields_ordered_by_rank = this.fieldsOrderedByRank();
    this.limit = (this.options.limit || this.limit);
    this.offset = (this.options.offset || this.offset);
    if (this.options.case_sensitive) {
      this.case_sensitive = '';      
    }
    this.buildMatcherTemplates();
    this.buildQueryString();
  },
  
  buildMatcherTemplates: function() {
    $H(this.patterns).each(function(pair) {
      this[pair.key + '_matcher'] = new Template('if(/' + pair.value + '/#{case_sensitive}.test(object["#{name}"])){hits++;ranks_array.push(ranks["#{name}"]);}');
    }, this);
  },
  
  getRanks: function(object) {
    var ranks = {};
    $H(this.fields).keys().each(function(field) {
      ranks[field] = (this.options.ranks && this.options.ranks[field] || 0);
    }, this);
    return ranks;
  },
  
  // TODO if ranks are all 0 might just use the format order if supplied
  fieldsOrderedByRank: function() {
    var fields_ordered_by_rank = [];
    $H(this.ranks).each(function(pair) {
      fields_ordered_by_rank.push([pair.value, pair.key]);
    });
    return fields_ordered_by_rank.sort().reverse().invoke('last');
  },
  
  buildQueryString: function() {
    var query_string_array = [];
    this.fields_ordered_by_rank.each(function(field) {
      query_string_array.push(this.buildMatcher(field, this.fields[field]));
    }, this)
    this.query_string = query_string_array.join('');
  },
  
  buildMatcher: function(name, pattern) {
    return this.subMatcher(this[pattern + '_matcher'], { name: name, case_sensitive: this.case_sensitive });
  },
  
  subMatcher: function(matcher, object) {
    return matcher.evaluate(object);
  },
  
  subQueryString: function(token) {    
    return this.query_string.gsub(/\$token/, RegExp.escape(token));
  },
  
  //TODO add an options object to pass limit/offset. 
  getResults: function(token, object) {
    var results;
    if (!Object.isArray(object)) {
      object = [object];
    }    
    results = this.getFilteredResults(this.subQueryString(token), object);
    results = this.sortResults(results);
    results = this.limitResults(results);
    return this.cleanResults(results);
  },
  
  getFilteredResults: function(query_string, array) {
    var results = [], ranks = this.ranks, result, len = (array.length);
    var query_function = eval(this.query_function.evaluate({query_string: query_string}));
    
    for(var i = 0; i < len; ++i) {
      if(result = query_function(array[i])) {
        results.push(result);
      }      
    }
    return results;
  },
  
  sortResults: function(results) {
    return results.sort().reverse();
  },

  //TODO handle limit/offset passed as options  
  limitResults: function(results) {
    if (this.limit) {
      return results.slice(this.offset, (this.limit + this.offset));
    } else if (this.offset > 0) {
      return results.slice(this.offset, (results.length));
    } else {
      return results;
    }
  },
  
  cleanResults: function(results) {
    var clean_results = []; len = (results.length);    
    for(var i = 0; i < len; ++i) {
      clean_results.push(results[i][2]);
    }
    return clean_results;
  },
  
  getRegex: function(token, pattern) {
    return new RegExp(this.patterns[pattern].gsub(/\$token/, token), this.case_sensitive);
  }

});

