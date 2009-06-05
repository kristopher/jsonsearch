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
        
    after(function() {
      Smoke.reset();
    });
    
    describe('initialize', function() {
      // Hacky but equal matcher doesn't work with nested objects.
      it("should set the passed options to the options property", function() {
        expect(json_search.options.fields).to(equal, { name: 'prefix', category: 'infix'  });
      });
      
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
      
      it("should set the case_sensitive property to the an empty string if case_sensitive passed is true", function() {
        json_search.initialize({case_sensitive: true});
        expect(json_search.case_sensitive).to(equal, '')
      });

      it("should set the case_sensitive property to 'i' if case_sensitive passed as false", function() {
        json_search.initialize({case_sensitive: false});
        expect(json_search.case_sensitive).to(equal, 'i')
      });
      
      it("should call buildQueryString()", function() {
        expect(json_search.query_string).to_not(be_undefined);
      });
    });

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
      //FIXME need proper mocking and stubbing to test this
      //TODO Investigate why Smoke mocks don't seem to handle should_receive on these instances

    });
    
    describe("buildMatcher", function() {
      //FIXME need proper mocking and stubbing to test this
      //TODO Investigate why Smoke mocks don't seem to handle should_receive on these instances
    });
    
    describe('subMatcher', function() {
      it("should return a string of the evaluated matcher", function() {
        expect(json_search.subMatcher(json_search.prefix_matcher, {name: 'name', case_sensitive: ''})).to(equal, 'if(/^$token.*/.test(object["name"])){hits++;ranks_array.push(ranks["name"]);}')
      })
    });

    describe('subQueryString', function() {
      it("should replace $token with the passed token", function() {
        json_search.query_string = 'if(/^.*$token.*/#{case_sensitive}.test(object["name"])){hits++;ranks_array.push(ranks["name"]);}'
        expect(json_search.subQueryString('test')).to(equal, 'if(/^.*test.*/#{case_sensitive}.test(object["name"])){hits++;ranks_array.push(ranks["name"]);}')
      })
    });

    describe("getResults", function() {
      //FIXME need proper mocking and stubbing to test this
      //TODO Investigate why Smoke mocks don't seem to handle should_receive on these instances      
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
        before(function() {  json_search.limit = 1; })
        it("should limit the results", function() {
          expect(json_search.limitResults(results)).to(equal, [1])
        })
        
        describe('with an offset', function() {
          it("should return results a the specified offset and limited to the limit", function() {
            json_search.offset = 1;
            expect(json_search.limitResults(results)).to(equal, [2])
          })
        })
        
        describe('without a limit', function() {
          before(function() {  json_search.limit = null; })
          it("should return the results as passed", function() {
            json_search.offset = 0;
            expect(json_search.limitResults(results)).to(equal, results);
          })
          
          describe('with an offset', function() {
            it("should return results greater than the offset", function() {
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
  });
});