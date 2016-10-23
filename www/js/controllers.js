angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {
    $scope.navTitle = 'Dash';
})

.controller('SearchCtrl', function($scope, $location, Giphy, Utils) {
    $scope.navTitle = 'Search';
    $scope.search = {};
    $scope.search.term = 'puppy';

    var getGiphies = function() {
        $scope.giphies = [];
        Utils.showLoading(true);
        Giphy.all($scope.search.term)
            .then(function(res) {
                Utils.hideLoading();                
                if (res.length !== 0) {
                    $scope.giphies = res;
                    $scope.statusMessage = $scope.giphies.length + " gif/s found";
                } else
                    $scope.statusMessage = "results not found";
            }, function (error) {
                Utils.hideLoading();                
                console.log(error.message);
                $scope.statusMessage = "error " + error.message;
            });
    };

    $scope.performSearch = function() {
        if (!angular.isDefined($scope.search.term) 
            || $scope.search.term.trim() === "") {
            console.log('no input');
            $scope.giphies = [];
            $scope.statusMessage = "no input";
            return;
        }
        getGiphies();
    };

    $scope.settings = {
        enableSearch: true
    };
    
    $scope.goDetails = function (id) {
        $location.path('/tab/search/'+id);
    };

    getGiphies();
})

.controller('SearchDetCtrl', function($scope, $stateParams, $location, $ionicPopup, Giphy, Lemon) {
    $scope.navTitle = 'Details';
    $scope.giphy = {};
    var res = Giphy.getItem($stateParams.giphyId);

    if (res !== null) {
        $scope.giphy = {
            id: res.id,
            slug: res.slug,
            url: res.url,
            video: res.images.fixed_height.mp4,
            likes: 0,
            dislikes: 0
        };
        Lemon.get(res.id).then(function (result) {
            if (result !== null) {
                $scope.giphy.likes = result.likes;
                $scope.giphy.dislikes = result.dislikes;
            }
        });
    } else
        $scope.statusMessage = 'data not found';
    
    var rate = function(giphy){
        if (giphy.id !== null) {
            Lemon.get(giphy.id).then(function (result) {
                if (result === null) {
                    Lemon.add(giphy);
                } else {
                    Lemon.update(giphy);
                }
            });            
        }
    };
    
    $scope.goBack = function () {
        $location.path('/tab/search');
    };

    $scope.vote = function(giphy) {
        var rankPopup = $ionicPopup.confirm({
            title: 'Vote',
            template: 'Select option below',
            cancelText: 'Dislike',
            okText: 'Like'
        });

        rankPopup.then(function(res) {
            if (res) {
                rate(giphy);
                $scope.giphy.likes++;
                console.log('Like added for '+giphy.id);
            } else {
                rate(giphy);
                $scope.giphy.dislikes++;
                console.log('disLike added for '+giphy.id);
            }
        });
    };        
});







