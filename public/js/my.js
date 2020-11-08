const app = angular.module('app', ['ngRoute', 'ngDialog']);

//Забираєм %2F та # з url сайту
app.config(['$locationProvider', function ($locationProvider) {
    $locationProvider.hashPrefix('');
    $locationProvider.html5Mode(true);
}]);

//Створюєм адреси
app.config(function ($routeProvider) {
    $routeProvider
        .otherwise({
            redirectTo: '/'
        });

});

//Контроллер
app.controller("defaultCtrl", function () {});

//Директива Авторизації / Реєстрації
app.directive('loginBlock', function () {
    return {
        replace: true,
        templateUrl: 'template/login.html',
        controller: function ($scope, $http, ngDialog) {
            if (localStorage.userName != 'default') {
                if (localStorage.userName != undefined) {
                    $scope.newUser = false;
                    $scope.enterLogin = true;
                    $scope.userIn = 'Welcome ' + localStorage.userName;
                } else {
                    localStorage.userName = 'default';
                    $scope.newUser = true;
                    $scope.enterLogin = false;
                }
            } else {
                $scope.newUser = true;
                $scope.enterLogin = false;
            }
            //Авторизація
            $scope.check = function () {
                var obj = {
                    login: $scope.login,
                    password: $scope.password
                };
//                http://localhost:8000
                $http.post('users', obj)
                    .then(function successCallback(response) {

                        if ((response.data == 'Wrong Password') || (response.data == 'Wrong Login'))

                        {
                            alert(response.data);
                        } else {
                            $scope.newUser = false;
                            $scope.enterLogin = true;
                            $scope.userIn = response.data;
                            localStorage.userName = $scope.login;
                        }
                    }, function errorCallback(response) {
                        console.log("Error!!!" + response.err);
                    });

            };
            //Розлогуватись
            $scope.logOut = function () {
                localStorage.userName = 'default';
                $scope.newUser = true;
                $scope.enterLogin = false;
                $scope.login = "";
                $scope.password = "";
            }
            //Нагадати забутий пароль
            //Відкрити модальне вікно
            $scope.forget = function () {
                ngDialog.open({
                    template: '/template/forget.html',
                    className: 'ngdialog-theme-default'
                });

            };
            //Реєстрація
            $scope.registr = function () {
                ngDialog.open({
                    template: '/template/registration.html',
                    className: 'ngdialog-theme-default'
                });

            };
        }
    }
});

//Директива Нагадування паролю
app.directive('forgetBlock', function () {
    return {
        replace: true,
        templateUrl: 'template/forget-block.html',
        controller: function ($scope, $http, ngDialog) {

            //Кидаєм на сервер пошту для відправки забутого паролю
            $scope.remind = function () {
                let obj = {
                    mail: $scope.remindMail
                };
                $http.post('remind', obj)
                    .then(function successCallback(response) {
                        alert(response.data);
                    }, function errorCallback(response) {
                        console.log("Error!!!" + response.err);
                    });
                ngDialog.closeAll();
            }


        }
    }
});
//Директива Реєстрації-модальне вікно
app.directive('regBlock', function () {
    return {
        replace: true,
        templateUrl: 'template/reg-block.html',
        controller: function ($scope, $http) {
            //Код верифікації при реєстрації кидаєм на телефон
            $scope.code = "";
            $scope.verification = function () {
                $scope.code = Math.floor(Math.random() * (9000 - 3000 + 1)) + 3000;
                let obj = {
                    code: $scope.code,
                    number: $scope.newPhone
                };
                $http.post('testtwilio/', obj)
                    .then(function successCallback(response) {

                    }, function errorCallback(response) {
                        console.log("Error!!!" + response.err);
                    });
            };
            //Реєстрація
            $scope.registration = function () {
                if ($scope.newVerCode == $scope.code) {
                    let obj2 = {
                        login: $scope.newLogin,
                        password: $scope.newPassword,
                        mail: $scope.newMail,
                    };
                    $http.post('signUp', obj2)
                        .then(function successCallback() {
                            alert("Registered " + $scope.newLogin + "!!!");
                        }, function errorCallback(response) {
                            console.log("Error!!!" + response.err);
                        });
                    ngDialog.closeAll();

                } else {
                    alert("Wrong Verification Code!");
                }
            };
        }
    }
});
//Директива Меню
app.directive('menuBlock', function () {
    return {
        replace: true,
        templateUrl: 'template/menu.html',
        controller: function ($scope) {
            //Статуси уявних сторінок
            $scope.homeStatus = true;
            $scope.contactStatus = false;
            $scope.allItems = true;
            $scope.statusItem = false;
            $scope.profileStatus = false;
            //Кнопка Home
            $scope.chooseHome = function () {
                $scope.contactStatus = false;
                $scope.homeStatus = true;
                $scope.mailStatus = false;
                $scope.profileStatus = false;
            };
            //Кнопка Contact
            $scope.chooseContact = function () {
                $scope.contactStatus = true;
                $scope.homeStatus = false;
                $scope.mailStatus = false;
                $scope.profileStatus = false;
            };
            //Кнопка Send Mail
            $scope.chooseMail = function () {
                $scope.mailStatus = true;
                $scope.contactStatus = false;
                $scope.homeStatus = false;
                $scope.profileStatus = false;
            };
            //Кнопка Profile
            $scope.chooseProfile = function () {
                $scope.mailStatus = false;
                $scope.contactStatus = false;
                $scope.homeStatus = false;
                $scope.profileStatus = true;
            };

        }
    }
});
//Директива Слайдера
app.directive('sliderBlock', function () {
    return {
        replace: true,
        templateUrl: 'template/slider.html',
        link: function (scope, element, attrs) {
            //Функціонал JQuery-слайдера
            let slideNow = 1;
            let slideCount = $('#slidewrapper').children().length;
            let slideInterval = 3000;
            let navBtnId = 0;
            let translateWidth = 0;

            $(document).ready(function () {
                let switchInterval = setInterval(nextSlide, slideInterval);

                $('#viewport').hover(function () {
                    clearInterval(switchInterval);
                }, function () {
                    switchInterval = setInterval(nextSlide, slideInterval);
                });

                $('#next-btn').click(function () {
                    nextSlide();
                });

                $('#prev-btn').click(function () {
                    prevSlide();
                });

                $('.slide-nav-btn').click(function () {
                    navBtnId = $(this).index();

                    if (navBtnId + 1 != slideNow) {
                        translateWidth = -$('#viewport').width() * (navBtnId);
                        $('#slidewrapper').css({
                            'transform': 'translate(' + translateWidth + 'px, 0)',
                            '-webkit-transform': 'translate(' + translateWidth + 'px, 0)',
                            '-ms-transform': 'translate(' + translateWidth + 'px, 0)',
                        });
                        slideNow = navBtnId + 1;
                    }
                });
            });

            function nextSlide() {
                if (slideNow == slideCount || slideNow <= 0 || slideNow > slideCount) {
                    $('#slidewrapper').css('transform', 'translate(0, 0)');
                    slideNow = 1;
                } else {
                    translateWidth = -$('#viewport').width() * (slideNow);
                    $('#slidewrapper').css({
                        'transform': 'translate(' + translateWidth + 'px, 0)',
                        '-webkit-transform': 'translate(' + translateWidth + 'px, 0)',
                        '-ms-transform': 'translate(' + translateWidth + 'px, 0)',
                    });
                    slideNow++;
                }
            }

            function prevSlide() {
                if (slideNow == 1 || slideNow <= 0 || slideNow > slideCount) {
                    translateWidth = -$('#viewport').width() * (slideCount - 1);
                    $('#slidewrapper').css({
                        'transform': 'translate(' + translateWidth + 'px, 0)',
                        '-webkit-transform': 'translate(' + translateWidth + 'px, 0)',
                        '-ms-transform': 'translate(' + translateWidth + 'px, 0)',
                    });
                    slideNow = slideCount;
                } else {
                    translateWidth = -$('#viewport').width() * (slideNow - 2);
                    $('#slidewrapper').css({
                        'transform': 'translate(' + translateWidth + 'px, 0)',
                        '-webkit-transform': 'translate(' + translateWidth + 'px, 0)',
                        '-ms-transform': 'translate(' + translateWidth + 'px, 0)',
                    });
                    slideNow--;
                }
            }
        }
    }
});

//Директива Чату
app.directive('chatBlock', function () {
    return {
        replace: true,
        templateUrl: 'template/chat.html',
        link: function (scope, element, attrs) {
            scope.textField = "";
            scope.nameField = "Anonim";
            scope.EnterProfile = function () {
                scope.nameField = scope.Name;
            };
            scope.textiki = [];
            scope.EnterText = function () {
                scope.date = new Date();
                scope.textiki.push({
                    date: scope.date,
                    nameField: scope.nameField,
                    textField: scope.textField
                });
                scope.textField = "";
            }
        }
    }
});

//Директива Товари
app.directive('itemsBlock', function () {
    return {
        replace: true,
        templateUrl: 'template/items.html',
        controller: function ($scope, $http) {
            //Отримати список товарів при загрузці сайту
            $http.get('items')
                .then(function successCallback(response) {
                    $scope.myWelcome2 = response.data;
                }, function errorCallback(response) {
                    console.log("Error!!!" + response.err);
                });
            //Додати товар
            $scope.addItemStatus = false;
            $scope.addItem = function () {
                $scope.addItemStatus = true;
                $scope.allItems = false;
            };

           //Кнопка "Перехід до товару"
            $scope.chooseItem = function (index, name, price, indexArr, itemSrc) {
                let beforeCountChanges = itemSrc.split("-");
                $scope.editItemStatus = false;
                $scope.indexOfItem = index;
                //Отримати опис товарів при загрузці сторінки товару
                $http.get('items-info')
                    .then(function successCallback(response) {
                        $scope.itemsInfoText = response.data;
                        $scope.allItems = false;
                        $scope.statusItem = true;
                        $scope.choosenItemName = name;
                        $scope.choosenItemPrice = price;
                        $scope.choosenItemSrc = src;
                        $scope.choosenItemText = $scope.itemsInfoText[indexArr];
                    }, function errorCallback(response) {
                        console.log("Error!!!" + response.err);
                    });
                $scope.changeSatusImgUpload = function () {
                    $scope.statusImgUpload = true;
                }
                $scope.editItem = function () {
                    $scope.editItemStatus = true;
                    $scope.newNameOfItem = $scope.choosenItemName;
                    $scope.newPriceOfItem = $scope.choosenItemPrice;
                    $scope.newInfoOfItem = $scope.choosenItemText;
                    $scope.newItemSrc = $scope.choosenItemSrc;
                };
                $scope.deleteItem = function () {
                    $http.delete('item/' + index)
                        .then(function successCallback() {
                            console.log("Deleted!");
                            $scope.itemsInfoText.splice(indexArr, 1);
                            //Завантаження опису в текстовий файл
                            let obj = {
                                text: $scope.itemsInfoText.join('/item/')
                            };
                            $http.put('items-info', obj)
                                .then(function successCallback() {
                                    console.log("Updated text in txt file");
                                    //Отримати список товарів при загрузці сайту
                                    $http.get('items')
                                        .then(function successCallback(response) {
                                            $scope.myWelcome2 = response.data;
                                            $scope.allItems = true;
                                            $scope.statusItem = false;
                                            $scope.choosenItemName = "";
                                            $scope.choosenItemPrice = "";
                                        }, function errorCallback(response) {
                                            console.log("Error!!!" + response.err);
                                        });
                                }, function errorCallback(response) {
                                    console.log("Error!!!" + response.err);
                                });
                        }, function errorCallback(response) {
                            console.log("Error!!!" + response.err);
                        })
                }
				
				// редагування, приймаємо зміни
                var newAdrrImg = "";
                $scope.changeItemEdit = function () {
                    //Завантаження зображення
                    if ($scope.statusImgUpload) {
                        var fd = new FormData();
                        if (beforeCountChanges[1] == undefined) {
                            newAdrrImg = itemSrc + "-" + $scope.countChanges
                        } else {
                            $scope.countChanges += Number(beforeCountChanges[1]);
                            newAdrrImg = beforeCountChanges[0] + "-" + $scope.countChanges;
                        }
                        fd.append(newAdrrImg, $scope.myFile);
                        $http.post('images', fd, {
                                transformRequest: angular.identity,
                                headers: {
                                    'Content-Type': undefined
                                }
                            })
                            .then(function successCallback() {
                                console.log("Uploaded!");
                            }, function errorCallback(response) {
                                console.log("Error!!!" + response.err);
                            })
                    }
                    $scope.itemsInfoText[indexArr] = $scope.newInfoOfItem;
                    //Завантаження опису в текстовий файл
                    let obj = {
                        text: $scope.itemsInfoText.join('/item/')
                    };
                    $http.put('items-info', obj)
                        .then(function successCallback() {
                            console.log("Updated text in txt file");
                        }, function errorCallback(response) {
                            console.log("Error!!!" + response.err);
                        });


                    $scope.countChanges += Number(beforeCountChanges[1]);
                    if ($scope.statusImgUpload) {
                        var objEdit = {
                            name: $scope.newNameOfItem,
                            price: $scope.newPriceOfItem,
                            src: newAdrrImg
                        }
                    } else {
                        var objEdit = {
                            name: $scope.newNameOfItem,
                            price: $scope.newPriceOfItem,
                            src: itemSrc
                        }
                    }

                    $http.post('item-edit/' + $scope.indexOfItem, objEdit)
                        .then(function successCallback() {
                            console.log("Edited");
                        }, function errorCallback(response) {
                            console.log("Error!!!" + response.err);
                        });
                    $http.get('/items')
                        .then(function successCallback(response) {
                            $scope.myWelcome2 = response.data;
                            $scope.choosenItemName = $scope.newNameOfItem;
                            $scope.choosenItemPrice = $scope.newPriceOfItem;
                            $scope.choosenItemText = $scope.newInfoOfItem;
                            if ($scope.statusImgUpload) {
                                $scope.choosenItemSrc = newAdrrImg;
                            } else {
                                $scope.choosenItemSrc = itemSrc;
                            };
                            $scope.statusImgUpload = false;
                            $scope.editItemStatus = false;
                        }, function errorCallback(response) {
                            console.log("Error!!!" + response.err);
                        });

                }
            };
              //Кнопка "Перехід до всіх товарів"
            $scope.backToAllItems = function () {
                $scope.allItems = true;
                $scope.statusItem = false;
                $scope.choosenItemName = "";
                $scope.choosenItemPrice = "";
            };
        }
    }
});

//Директива Контакту
app.directive('contactBlock', function () {
    return {
        replace: true,
        templateUrl: 'template/contactMini.html'
    }
});

//Директива Профілю
app.directive('profileBlock', function () {
    return {
        replace: true,
        templateUrl: 'template/profile.html',
        controller: function ($scope, $http) {

        }
    }
});

//Директива з унікальним атрибутом - для передачі файлів
app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            element.bind('change', function () {
                scope.$apply(function () {
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

//Директива AddItem
app.directive('addItemBlock', function () {
    return {
        replace: true,
        templateUrl: 'template/addItem.html',
        controller: function ($scope, $http) {
            $scope.nameOfNewItem = "";
            $scope.priceOfNewItem = "";
            $scope.aboutNewItem = "";
            //Додати товар
            $scope.addNewItem = function () {
                //генерація нової назви зображення після завантаження
                var imgNumberName = 0;
                if ($scope.myWelcome2[0] == undefined) {
                    imgNumberName = 1;
                } else {
                    imgNumberName = $scope.myWelcome2[$scope.myWelcome2.length - 1].id + 1;
                };
                //Завантаження зображення
                var fd = new FormData();
                fd.append(imgNumberName, $scope.myFile);
                $http.post('images', fd, {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    })
                    .then(function successCallback() {
                        console.log("Uploaded!");
                    }, function errorCallback(response) {
                        console.log("Error!!!" + response.err);
                    });
                //Завантаження опису в текстовий файл
                let obj = {
                    text: $scope.aboutNewItem
                };
                $http.post('items-info', obj)
                    .then(function successCallback() {
                        console.log("Text in txt file");
                    }, function errorCallback(response) {
                        console.log("Error!!!" + response.err);
                    });

                //Запис товару в базу даних
                let obj2 = {
                    name: $scope.nameOfNewItem,
                    price: $scope.priceOfNewItem,
                    src: imgNumberName
                };
                $http.post('items', obj2)
                    .then(function successCallback() {
                        console.log("Data in DB");
                    }, function errorCallback(response) {
                        console.log("Error!!!" + response.err);
                    });
                //Запис оновлення опису товару в ткст файл
                //Оновлення списку товарів
                $http.get('items')
                    .then(function successCallback(response) {
                        $scope.myWelcome2 = response.data;
                        $scope.addItemStatus = false;
                        $scope.allItems = true;
                        $scope.nameOfNewItem = "";
                        $scope.priceOfNewItem = "";
                        $scope.aboutNewItem = "";
                    }, function errorCallback(response) {
                        console.log("Error!!!" + response.err);
                    });



            }

        }
    }
});
//Директива Mail
app.directive('mailBlock', function () {
    return {
        replace: true,
        templateUrl: 'template/mail.html',
        controller: function ($scope, $http) {

        }
    }
});
