angular.module('starter.services', [])

.service('Utils', function($ionicLoading) {
    return {
        resetForm: function(form) {
            form.$setPristine();
            form.parent = form;
            form.error = {};
        },
        showLoading: function (showBackdrop) {
            $ionicLoading.show({
                content: '',
                showBackdrop: showBackdrop,                 
                showDelay: 0
            });
        },
        hideLoading: function () {
            $ionicLoading.hide();
        }
    };
})

.constant('DB_CONFIG', {
    name: 'lemon.db',
    tables:
    {
        giphy:
        {
            id: 'varchar primary key not null',
            slug: 'varchar', 
            url: 'varchar',
            pic: 'varchar',
            video: 'varchar',
            likes: 'integer',
            dislikes: 'integer'
        }
    }
})

// DB wrapper SQLite devices & websql
.factory('DB', function($q, $cordovaSQLite, DB_CONFIG) {
    var self = this;
    self.db = null;
    
    self.init = function() {
        //device
    	if (window.cordova)
        {
            if  (typeof($cordovaSQLite.deleteDB)==='undefined') {
                console.log('no sqlite');
            } else {
                console.log('sqlite available');
                $cordovaSQLite.deleteDB({name: DB_CONFIG.name});
                db = $cordovaSQLite.openDB({name: DB_CONFIG.name});
                if (angular.isDefined(db)) {
                    self.db = db;
                    console.log('db is set');
                } else {
                    console.log('db is not set');
                }
            }
        }
        //websql 
        else
        {
            if  (typeof(window.openDatabase)==='undefined') {
                console.log('no sqlite');
                alert('sqlite is not available in your browser');
                window.close();
            }   
            else {
                console.log('sqlite available');
                self.db = window.openDatabase(DB_CONFIG.name, '1.0', 'database', -1);
                self.createAll();
            }
        }
    };

    self.query = function (sql, bindings) {
        bindings = typeof bindings !== 'undefined' ? bindings : [];
        var deferred = $q.defer();

        self.db.transaction(function (transaction) {
            transaction.executeSql(sql,bindings, function (transaction,result) {
                deferred.resolve(result);
            }, function (transaction, error) {
                deferred.reject(error);
            });
        });
        
        return deferred.promise;
    };
    
    // Proces a result set
    self.getAll = function(result) {
        var output = [];

        for (var i = 0; i < result.rows.length; i++) {
            output.push(result.rows.item(i));
        }
        return output;
    };

    // Proces a single result
    self.getById = function(result) {
        var output = null;
        if (result.rows.length > 0)
           output = angular.copy(result.rows.item(0));
        return output;
    };
    
    // Proces a batch insert
    self.insertAll = function(tableName, data) {
        var columns = [], bindings = [];

        for (var columnName in DB_CONFIG.tables[tableName]) {
            columns.push(columnName);
            bindings.push('?');
        }

        var sql = 'INSERT INTO ' + tableName +
                  ' (' + columns.join(', ') + ') VALUES (' +
                  bindings.join(', ') + ')';

        for (var i = 0; i < data.length; i++) {
            var values = [];
            for (var j = 0; j < columns.length; j++) {
                values.push(data[i][columns[j]]);
            }
            self.query(sql, values);
            console.log('Table ' + tableName + ' updated');
        }
    };

    self.createAll = function() {
        for (var tableName in DB_CONFIG.tables) {
            var sql = 'DROP TABLE IF EXISTS ' + tableName;
            self.query(sql);
            console.log('Table ' + tableName + ' deleted');
            
            var defs = [];
            var columns = DB_CONFIG.tables[tableName];
            for (var columnName in columns) {
                var type = columns[columnName];
                defs.push(columnName + ' ' + type);
            }
            
            var sql = 'CREATE TABLE IF NOT EXISTS ' + tableName + 
                      ' (' + defs.join(', ') + ')';
            self.query(sql);
            console.log('Table ' + tableName + ' created');
        }
    };
    return self;
})

.factory('Lemon', function(DB) {
    return {
        all : function() {
                return DB.query("SELECT * FROM giphy ORDER BY id")
                    .then(function(result){
                        return DB.getAll(result);
                    });
            },
        get : function(id) {
                var parameters = [id];
                return DB.query("SELECT * FROM giphy WHERE id=(?)", parameters)
                    .then(function(result) {
                        return DB.getById(result);
                    });
            },
        add : function(lemon) {
                var parameters = [lemon.id,lemon.likes,lemon.dislikes];
                return DB.query("INSERT INTO giphy (id,likes,dislikes) VALUES (?,?,?)",parameters);
            },
        remove : function(lemon) {
                var parameters = [lemon.id];
                return DB.query("DELETE FROM giphy WHERE id=(?)", parameters);
            },
        update : function(lemon) {
            var parameters = [lemon.likes,lemon.dislikes,lemon.id];
            return DB.query("UPDATE giphy SET likes=(?), dislikes=(?) WHERE id=(?)", parameters);
        }
    };
})

.factory('Giphy', function($http) {
    var api = 'http://api.giphy.com/v1/gifs/';
    var apiMode = 'search';
    var apiKey = '?api_key=dc6zaTOxFJmzC';
    var query = '&amp&q=';
    var limit = '&amp&limit='+10;
    var giphies = [];
    
    return {
        all: function(term) {
            term.replace(' ', '+');
            var url = api + apiMode + apiKey + query + term + limit;
            console.log(url);

            return $http.get(url).then(function(result){
                giphies = angular.fromJson(result.data.data);
                return giphies;
            });
        },
        getItem: function(id) {
            for (var i=0;i<giphies.length;i++) {
                if (giphies[i].id === id)
                    return giphies[i];
            };
            return null;
        },
        getId: function(id) {
            var url = api + id + apiKey;
            console.log(url);

            return $http.get(url).then(function(result){
                return angular.fromJson(result.data.data);
            });
        }
    };
});

