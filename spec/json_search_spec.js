Screw.Unit(function() {

  describe("JSONSearch", function() {
    var json_search, json_search_with_ignore_case, json_search_with_limit, json_search_with_ranks;
    before(function() {
      json_search = Smoke.Mock(new JSONSearch({ 
        fields: { name: 'prefix', category: 'infix'  }
      }));

      json_search_with_case_sensitive = Smoke.Mock(new JSONSearch({ 
        fields: { name: 'prefix', category: 'infix'  },
        ignore_case: false
      }));
      
      json_search_with_limit = Smoke.Mock(new JSONSearch({ 
        fields: { name: 'prefix', category: 'infix'  },
        limit: 1,
        offset: 1
      }));
      
      json_search_with_ranks = Smoke.Mock(new JSONSearch({
        fields: { name: 'prefix', category: 'infix'  },
        ranks: { name: 1, category: 0 }
      }));
    });
            
    describe('initialize', function() {
      it("should set the options property", function() {
        expect(json_search.options).to_not(be_undefined);
      });
      
      it("should call setAttributes()", function() {
        json_search.should_receive('setAttributes').exactly('once');
        json_search.initialize();
        json_search.checkExpectations();
      });
      
      it("should call buildMatcherTemplates", function() {
        json_search.should_receive('buildMatcherTemplates').exactly('once')
        json_search.initialize();
        json_search.checkExpectations();
      });
      
      it("should call buildQueryString()", function() {
        json_search.should_receive('buildQueryString').exactly('once');
        json_search.initialize();
        json_search.checkExpectations();
      });
    });
    
    describe('setAttributes', function() {
      it("should set the fields property to the fields in the options object", function() {
        expect(json_search.fields).to(equal, { name: 'prefix', category: 'infix'  });
      });
      
      it("should set the ranks property to the return value of getRanks", function() {
        json_search.stub('getRanks').and_return({name: 6, category: 6})
        json_search.initialize({fields: { name: 'prefix', category: 'prefix'}});
        expect(json_search.ranks).to(equal, {name: 6, category: 6})
      });
      
      it("should set the fields_ordered_by_rank property to the return value of fieldsOrderedByRank", function() {
        json_search.stub('fieldsOrderedByRank').and_return(['test1', 'test2'])
        json_search.initialize({fields: { test1: 'prefix', test2: 'prefix'}});
        expect(json_search.fields_ordered_by_rank).to(equal, ['test1', 'test2'])        
      });
      
      it("should set the limit property to the limit that is passed in the options", function() {
        json_search_with_limit.initialize({limit: 2});
        expect(json_search_with_limit.limit).to(equal, 2)
      });
      
      it("should set the offset property to the offset that is passed in the options", function() {
        json_search_with_limit.initialize({offset: 2});
        expect(json_search_with_limit.offset).to(equal, 2)
      });
      
      it("should set the case_sensitive property to true if case_sensitive passed is true", function() {
        json_search.initialize({case_sensitive: true});
        expect(json_search.case_sensitive).to(equal, true)
      });

      it("should set the case_sensitive property to false if case_sensitive passed as false", function() {
        json_search.initialize({case_sensitive: false});
        expect(json_search.case_sensitive).to(equal, false)
      });
      
    })
    describe('getRanks', function() {
      it("should return an object keyed with the field name and valued with the rank", function() {
        expect(json_search_with_ranks.getRanks()).to(equal, { name: 1, category: 0 });
      });
      
      it("should return an object keyed with only the fields previded by the fields object", function() {
        json_search_with_ranks.fields = { test1: 'prefix', test2: 'infix'}
        json_search_with_ranks.options.ranks = { test1: 1, test2: 0, test3: 0}
        expect(json_search_with_ranks.getRanks()).to(equal, { test1: 1, test2: 0 })
      });
      
      it("should return an object with the values for fields not passed in the ranks option to 0", function() {
        json_search_with_ranks.fields = { test1: 'prefix', test2: 'infix'}
        json_search_with_ranks.options.ranks = {}
        expect(json_search_with_ranks.getRanks()).to(equal, {test1: 0, test2: 0})
      });
    });
    
    describe('fieldsOrderedByRank', function() {
      it("should return an array of the fields ordered by rank", function() {
        json_search_with_ranks.fields = { test1: 'prefix', test2: 'prefix', test3: 'prefix'};
        json_search_with_ranks.ranks = { test1: 1, test2: 2, test3: 3 };
        expect(json_search_with_ranks.fieldsOrderedByRank()).to(equal, ['test3', 'test2', 'test1'])
      });
    });
        
    describe('buildQueryString', function() {
      it("should call build matcher once for each field", function() {
        json_search.should_receive('buildMatcher').exactly(2);
        json_search.buildQueryString();
        json_search.checkExpectations();
      });

      it("should call buildMatcher with each of the fields and there patterns", function() {
        json_search.should_receive('buildMatcher').with_arguments('name', 'prefix').exactly('once');
        json_search.should_receive('buildMatcher').with_arguments('category', 'infix').exactly('once');
        json_search.buildQueryString();
        json_search.checkExpectations();
      });
    });
    
    describe("buildMatcher", function() {
      it("should call subMatcher", function() {
        json_search.should_receive('subMatcher').exactly('once');
        json_search.buildMatcher('name', 'prefix');
        json_search.checkExpectations();
      });

      it("should call subMatcher with the pattern template and the template evaluation object", function() {
        json_search.prefix_matcher = 'matcher'
        json_search.should_receive('subMatcher').with_arguments('matcher', { name: 'name', regex_options: 'i' }).exactly('once').and_return('');
        json_search.buildMatcher('name', 'prefix');
        json_search.checkExpectations();
      });
    });
    
    describe('subMatcher', function() {
      it("should return a string of the evaluated matcher", function() {
        expect(json_search.subMatcher(json_search.prefix_matcher, {name: 'name', regex_options: 'i'})).to(equal, 'if(/^$token.*/i.test(object["name"])){hits++;ranks_array.push(ranks["name"]);}')
      })
    });

    describe('subQueryString', function() {
      it("should replace $token with the passed token", function() {
        json_search.query_string = 'if(/^.*$token.*/#{case_sensitive}.test(object["name"])){hits++;ranks_array.push(ranks["name"]);}'
        expect(json_search.subQueryString('test')).to(equal, 'if(/^.*test.*/#{case_sensitive}.test(object["name"])){hits++;ranks_array.push(ranks["name"]);}')
      })
    });

    describe("getResults", function() {
      after(function() { Smoke.reset() })
      it("should call evalJSON with the data object", function() {
        var query_string = '[{"name": "kris"}, {"name": "bob"}]'
        json_search.should_receive('evalJSON').with_arguments(query_string).and_return([{}]);
        json_search.getResults('a', query_string);
        json_search.checkExpectations();
      });
      
      it("should call subQueryString with the token", function() {
        json_search.should_receive('subQueryString').with_arguments('a');
        json_search.getResults('a', [{}]);
        json_search.checkExpectations();
      });
      
      it("should call getFilteredResults", function() {
        json_search.should_receive('getFilteredResults').and_return([]);
        json_search.getResults('a', {});
        json_search.checkExpectations();
      });
      
      it("should call getFilteredResults with a subbed query string and the object", function() {
        json_search.stub('subQueryString').and_return('subbed_query_string')
        json_search.should_receive('getFilteredResults').with_arguments('subbed_query_string', [{}]).and_return([]);
        json_search.getResults('a', [{}]);
        json_search.checkExpectations();
      });
      
      it("should call sortResults with the filtered results", function() {
        json_search.stub('getFilteredResults').and_return(['results'])
        json_search.should_receive('sortResults').with_arguments(['results']).and_return([])
        json_search.getResults('a', [{}]);
        json_search.checkExpectations();
      })
      
      it("should call limitResults with the sortedResults", function() {
        json_search.stub('sortResults').and_return(['result'])
        json_search.should_receive('limitResults').with_arguments(['result']).and_return([])
        json_search.getResults('a', [{}])
        json_search.checkExpectations();
      })
      
      it("should call cleanResults with the limited results", function() {
        json_search.stub('limitResults').and_return(['result'])
        json_search.should_receive('cleanResults').with_arguments(['result']).and_return([]);
        json_search.getResults('a', [{}]);
        json_search.checkExpectations();
      })
      
      it("should return the cleaned results", function() {
        json_search.stub('cleanResults').and_return(['result'])
        expect(json_search.getResults('a', [{}])).to(equal, ['result'])
      })
    });
    
    describe('getFilteredResults', function() {
      it("should return a list of results for the given token", function() {
        var query_string = 'if(/^k.*/i.test(object["name"])){hits++;ranks_array.push(ranks["name"]);}'
        var search_object = [{ name: 'kris' }, { name: 'bob' }]
        json_search.ranks = { name: 1 }
        expect(json_search.getFilteredResults(query_string, search_object)).to(equal, [[1, 1, { name: 'kris' }]])
      })
    });
    
    describe('sortResults', function() {
      it("should return a list of results that have been sorted by there rank", function() {
        expect(json_search.sortResults([[1, 1, { one: 1 }], [3, 1, { three: 3 }], [2, 1, { two: 2 }]])).to(equal, [[3, 1, {three: 3}], [2, 1, {two: 2}], [1, 1, {one: 1}]])
      });
      
      it("should return a list of result that have been sorted by weight", function() {
        expect(json_search.sortResults([[1, 1, { one: 1 }], [1, 3, { three: 3 }], [1, 2, { two: 2 }]])).to(equal, [[1, 3, {three: 3}], [1, 2, {two: 2}], [1, 1, {one: 1}]])        
      });

      it("should return a list of result that have been sorted by rank and weight", function() {
        expect(json_search.sortResults([[1, 2, { one: 1 }], [1, 3, { three: 3 }], [2, 2, { two: 2 }]])).to(equal, [[2, 2, {two: 2}], [1, 3, {three: 3}], [1, 2, {one: 1}]])        
      });
    });
    
    describe('limitResults', function() {
      var results = [1,2,3];
      describe('with a limit', function() {
        it("should limit the results", function() {
          json_search.limit = 1;
          json_search.offset = 0;
          expect(json_search.limitResults(results)).to(equal, [1])
        })
        
        describe('with an offset', function() {
          it("should return results a the specified offset and limited to the limit", function() {
            json_search.limit = 1;
            json_search.offset = 1;
            expect(json_search.limitResults(results)).to(equal, [2])
          })
        })
        
        describe('without a limit', function() {
          it("should return the results as passed", function() {
            json_search.limit = null;
            json_search.offset = 0;
            expect(json_search.limitResults(results)).to(equal, results);
          })
          
          describe('with an offset', function() {
            it("should return results greater than the offset", function() {
              json_search.limit = null;
              json_search.offset = 1;
              expect(json_search.limitResults(results)).to(equal, [2,3])
            })
          })
        })
      })
    })
    
    describe("cleanResults", function() {
      it("should return the results with the rank and wieghts removed", function() {
        expect(json_search.cleanResults([[1,1, {one: 1}], [2,2,{two: 2}], [3,3,{three: 3}]])).to(equal, [{one: 1}, {two: 2}, {three: 3}]);
      })
    })

    describe("evalJSON", function() {
      it("should eval the object if it is a string", function() {
        var json = '{"name": "kris"}'
        expect(json_search.evalJSON(json)).to(equal, {"name": "kris"})
      })
      
      it("should throw an error if the json is badly formed", function() {
        var json = '{ "name": "kris }', message = null;
        try {
          json_search.evalJSON(json)
        } catch(e) {
          message = e.message;
        }
        expect(message).to(equal, 'Badly formed JSON string');
      });
      
      it("should return the just return object if it is not a string", function() {
        var json = {name: "kris"}
        expect(json_search.evalJSON(json) === json).to(equal, true);
      })
    })
  });
});