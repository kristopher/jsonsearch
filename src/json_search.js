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
var JSONSearch = Class.create({

  default_options: {
    fields: {},
    ranks: {},
    limit: null,
    offset: 0,
    case_sensitive: false
  },  
  patterns: {
    infix: '.*$token.*',
    prefix: '^$token.*',
    exact: '^$token$',
    word: '\\b$token\\b',
    word_prefix: '\\b$token.*'
  },    
  query_string: '',
  // TODO Remove Prototype dependency
  query_function: new Template("1&&function(object) { var hits = 0, ranks_array = []; #{query_string} if (hits > 0) { return [(ranks_array.sort().last() || 0), hits, object]; } }"),
    
  initialize: function(options) {    
    this.options = Object.extend(this.default_options, options || {});
    this.setAttributes(options);
    this.buildMatcherTemplates();
    this.buildQueryString();
  },
  
  setAttributes: function() {
    // TODO Remove Prototype dependency
    ['fields', 'limit', 'offset', 'case_sensitive'].each(function(attr) {
      this[attr] = this.options[attr];
    }, this);
    this.ranks = this.getRanks();
    this.fields_ordered_by_rank = this.fieldsOrderedByRank();
  },
  
  buildMatcherTemplates: function() {
    // TODO Remove Prototype dependency
    $H(this.patterns).each(function(pair) {
      this[pair.key + '_matcher'] = new Template('if(/' + pair.value + '/#{regex_options}.test(object["#{name}"])){hits++;ranks_array.push(ranks["#{name}"]);}');
    }, this);
  },
  
  getRanks: function(object) {
    var ranks = {};
    // TODO Remove Prototype dependency
    $H(this.fields).keys().each(function(field) {
      ranks[field] = (this.options.ranks && this.options.ranks[field] || 0);
    }, this);
    return ranks;
  },
  
  // TODO if ranks are all 0 might just use the format order if supplied
  fieldsOrderedByRank: function() {
    var fields_ordered_by_rank = [];
    // TODO Remove Prototype dependency
    $H(this.ranks).each(function(pair) {
      fields_ordered_by_rank.push([pair.value, pair.key]);
    });
    // TODO Remove Prototype dependency
    return fields_ordered_by_rank.sort().reverse().invoke('last');
  },
  
  buildQueryString: function() {
    var query_string_array = [];
    // TODO Remove Prototype dependency
    this.fields_ordered_by_rank.each(function(field) {
      query_string_array.push(this.buildMatcher(field, this.fields[field]));
    }, this)
    this.query_string = query_string_array.join('');
  },
  
  buildMatcher: function(name, pattern) {
    return this.subMatcher(this[pattern + '_matcher'], { name: name, regex_options: this.getRegexOptions() });
  },
  
  subMatcher: function(matcher, object) {
    // TODO Remove Prototype dependency
    return matcher.evaluate(object);
  },
  
  subQueryString: function(token) {    
    return this.query_string.replace(/\$token/, this.regexEscape(token));
  },
  
  //TODO add an options object to pass limit/offset. 
  getResults: function(token, object) {
    // TODO Remove Prototype dependency
    if (!Object.isArray(object)) {
      object = [object];
    }    
    var results, subbed_query_string = this.subQueryString(token);
    results = this.getFilteredResults(subbed_query_string, object);
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
    return new RegExp(this.patterns[pattern].replace(/\$token/, this.regexEscape(token)), this.getRegexOptions());
  },
  
  getRegexOptions: function() {
    return (this.case_sensitive && '' || 'i');
  },
  
  regexEscape: function(string) {
    return String(string).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');    
  }
});

