

var circularJSON = function(){};
  
circularJSON._rxp = /(\w)*\[(?:(\w*)=)?'?([\w\s]*)'?\]/;
circularJSON._key = '#';

circularJSON.AOeach = function(data, funct){
  var i, s, ret = data;
  if(data instanceof Array){
    ret = [];
    for(i = 0 ; i < data.length ; i++){
      ret[i] = funct(data[i], i, true);
    }
  } else if(data instanceof Object){
    ret = {};
    for(s in data){
      ret[s] = funct(data[s], s, false)
    }
  } 
  return ret; 
}

circularJSON.recursiveEach = function(obj, funct, maxdepth, stack){
  var s, i;
  maxdepth = maxdepth === undefined ? 16 : maxdepth;
  stack = stack === undefined ? [] : stack.slice(0); 
  stack.push(obj);

  var ret = funct(obj, stack);

  if(!circularJSON.isPrimitive(ret) && maxdepth > 0){
    ret = circularJSON.AOeach(ret, function(prop, index){
      return circularJSON.recursiveEach(prop, funct, maxdepth - 1, stack);
    });
  }

  return ret;
}

circularJSON.isPrimitive = function(obj){
  return typeof obj === 'string' || typeof obj === 'number'
}

circularJSON._flatten = function(prop, stack){
  if(stack.length > 3){
    var s, t, ref, root = stack[0];
    for(s in root){
      circularJSON.AOeach(root[s], function(obj, index, isArray){
        if(obj === prop){
          var cit = root[s] instanceof Array ? '' : "'";
          prop = circularJSON._key + '' + s + '[' + cit + index + cit + ']';
        }
      });
    }
  }
  return prop;
}

circularJSON._unflatten = function(prop, stack){
  if(typeof prop === 'string' && prop.indexOf(circularJSON._key) === 0){
    var prop = prop.slice(circularJSON._key.length);
    var match = prop.match(circularJSON._rxp);    
    prop = stack[0][match[1]][match[3]]  
  }
  return prop;
}

circularJSON.stringify = function(obj, replacer, space){
  var data = circularJSON.recursiveEach(obj, circularJSON._flatten);
  return JSON.stringify(data, replacer, space);
}

circularJSON.parse = function(json, reviver){
  var data = JSON.parse(json, reviver);
  return circularJSON.recursiveEach(data, circularJSON._unflatten);
}

var simple = {
  a : {
    aa : {
      aaa : 'aaa',
      aab : 'aab',
    },
    ab : 'ab'
  },
  b : {
    ba : {}
  },
  c : [
    {
      id: 'caa'
    }
  ]
}
simple.b.ba.baa = simple.a.aa;
simple.a.aa.aac = simple.b.ba;
simple.c[0].a = simple.a.aa;
simple.a.aa.aad = simple.c[0];

console.log("before test:", simple.c[0].a === simple.a.aa);
var json = circularJSON.stringify(simple, null, 2);
console.log('json2', json);
var data = circularJSON.parse(json);
console.log('data', data);
console.log("after test:", data.c[0].a === data.a.aa);


