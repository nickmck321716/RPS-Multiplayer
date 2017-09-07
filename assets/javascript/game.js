$(document).on('ready', function() {

    var database = new Firebase("https://game-rock-paper-scissors.firebaseio.com/");
    var presenceRef = new Firebase('https://game-rock-paper-scissors.firebaseio.com/.info/connected');
    var playersRef = new Firebase('https://game-rock-paper-scissors.firebaseio.com/playersRef');
    var turnRef = new Firebase('https://game-rock-paper-scissors.firebaseio.com/turn');
    var chatRef = new Firebase('https://game-rock-paper-scissors.firebaseio.com/chat');

    var player;
    var otherPlayer;
    var name = {};
    var userRef;
    var wins1, wins2, losses1, losses2;

    var choices = ['rock', 'paper', 'scissors'];


    turnRef.onDisconnect().remove();
    chatRef.onDisconnect().remove();


    $(window).bind('orientationchange', function(e) {

    });


    var game = {
        listeners: function() {

            database.on("value", function(snapshot) {
                var turnVal = snapshot.child('turn').val();
                if (turnVal !== null && player == undefined) {
                    var wrapper = $('.wrapper');
                    var $img = $('<img>').attr('src', "assets/images/header.png");
                    var $h1 = $('<h1>').text('Please wait until other players finish, then refresh screen.');
                    wrapper.empty().append($img).append($h1);
                    throw new Error('Please wait until other players finish, then refresh screen.');
                }
            });

            $('#addName').one('click', function() {
                game.setPlayer();
                return false;
            });

            playersRef.on('child_added', function(childSnapshot) {

                var key = childSnapshot.key();

                name[key] = childSnapshot.val().name;

                var waiting = $('.player' + key + ' > .waiting');
                waiting.empty();
                var $h1 = $('<h1>').text(name[key]);
                waiting.append($h1);

                var wins = childSnapshot.val().wins;
                var losses = childSnapshot.val().losses;
                var $wins = $('<h2>').text('Wins: ' + wins);
                var $losses = $('<h2>').text('Losses: ' + losses);
                $wins.addClass('float-left');
                $losses.addClass('float-right');
                $('.score' + key).append($wins).append($losses);
            });

            playersRef.on('child_removed', function(childSnapshot) {

                var key = childSnapshot.key();

                chat.sendDisconnect(key);

                $('h4').text('Waiting for another player to join.');

                var waiting = $('.player' + key + ' > .waiting');
                waiting.empty();
                var $h1 = $('<h1>').text('Waiting for player ' + key);
                var $i = $('<i>').addClass('fa fa-spinner fa-spin fa-one-large fa-fw')
                waiting.append($h1).append($i);

                $('.score' + key).text('');

                $('.choices1').empty();
                $('.results').empty();
                $('.choices2').empty();
            });

            turnRef.on('value', function(snapshot) {
                var turnNum = snapshot.val();
                if (turnNum == 1) {

                    $('.choices1').empty();
                    $('.results').empty();
                    $('.choices2').empty();
                    game.turn1();
                } else if (turnNum == 2) {
                    game.turn2();
                } else if (turnNum == 3) {
                    game.turn3();
                }
            });

            playersRef.child(1).on('child_changed', function(childSnapshot) {
                if (childSnapshot.key() == 'wins') {
                    wins1 = childSnapshot.val();
                } else if (childSnapshot.key() == 'losses') {
                    losses1 = childSnapshot.val();
                }

                if (wins1 !== undefined) {
                    $('.score1 .float-left').text('Wins: ' + wins1);
                    $('.score1 .float-right').text('Losses: ' + losses1);
                }
            });

            playersRef.child(2).on('child_changed', function(childSnapshot) {
                if (childSnapshot.key() == 'wins') {
                    wins2 = childSnapshot.val();
                } else if (childSnapshot.key() == 'losses') {
                    losses2 = childSnapshot.val();
                }

                $('.score2 .float-left').text('Wins: ' + wins2);
                $('.score2 .float-right').text('Losses: ' + losses2);
            });
        },
        setPlayer: function() {

            database.once('value', function(snapshot) {
                var playerObj = snapshot.child('playersRef');
                var num = playerObj.numChildren();

                if (num == 0) {

                    player = 1;
                    game.addPlayer(player);

                } else if (num == 1 && playerObj.val()[2] !== undefined) {
                   
                    player = 1;
                    game.addPlayer(player);
                   
                    turnRef.set(1);
                   
                } else if (num == 1) {
                   
                    player = 2;
                    game.addPlayer(player);
                   
                    turnRef.set(1);
                }
            });
        },
        addPlayer: function(count) {
           
            var playerName = $('#name-input').val();
           
            var greeting = $('.greeting');
            greeting.empty();
           
            var $hi = $('<h3>').text('Hi ' + playerName + '! You are Player ' + player);
            var $h4 = $('<h4>');
            greeting.append($hi).append($h4);
           
            userRef = playersRef.child(count);
           
            userRef.onDisconnect().remove();
           
            userRef.set({
                'name': playerName,
                'wins': 0,
                'losses': 0
            });
        },
        turnMessage: function(playTurn) {
            otherPlayer = player == 1 ? 2 : 1;
            if (playTurn == player) {
               
                $('h4').text("It's Your Turn!");
            } else if (playTurn == otherPlayer) {
               
                $('h4').text('Waiting for ' + name[otherPlayer] + ' to choose.');
            } else {
               
                $('h4').text('');
            }
        },
        showChoice: function() {
            for (i in choices) {
                var $i = $('<i>');
                $i.addClass('fa fa-hand-' + choices[i] + '-o fa-three-small');
                $i.attr('data-choice', choices[i]);
                game.rotateChoice(player, $i, choices[i]);
                $('.choices' + player).append($i);
            }
           
            $(document).one('mousedown', 'i', game.setChoice);
        },
        setChoice: function() {
            
            var selection = $(this).attr('data-choice');
            userRef.update({
                'choice': selection,
            });
           
            var $i = $('<i>');
            $i.addClass('fa fa-hand-' + selection + '-o fa-one-large');
            $i.attr('data-choice', selection);
            $i.addClass('position-absolute-choice' + player);
            game.rotateChoice(player, $i, selection);
            $('.choices' + player).empty().append($i);
           
            turnRef.once('value', function(snapshot) {
                var turnNum = snapshot.val();
               
                turnNum++;
                turnRef.set(turnNum);
            });
        },
        rotateChoice: function(person, element, choice) {
           
            if (person == 1) {
                if (choice == 'rock' || choice == 'paper') {
                    return element.addClass('fa-rotate-90');
                } else {
                    return element.addClass('fa-flip-horizontal');
                }
            } else if (person == 2) {
                if (choice == 'rock' || choice == 'paper') {
                    return element.addClass('fa-rotate-270-flip-horizontal');
                }
            }
        },
        turn1: function() {
            $('.player1').css('border', '4px solid black');
           
            game.turnMessage(1);
           
            if (player == 1) {
                game.showChoice();
            }
        },
        turn2: function() {
            $('.player1').css('border', '1px solid black');
            $('.player2').css('border', '4px solid black');
           
            game.turnMessage(2);
           
            if (player == 2) {
                game.showChoice();
                console.log(player2)
            }
        },
        turn3: function() {
            $('.player2').css('border', '1px solid black');

            game.turnMessage(3);

            game.outcome();
        },
        outcome: function() {

            playersRef.once('value', function(snapshot) {
                var snap1 = snapshot.val()[1];
                var snap2 = snapshot.val()[2];
                choice1 = snap1.choice;
                wins1 = snap1.wins;
                losses1 = snap1.losses;
                choice2 = snap2.choice;
                wins2 = snap2.wins;
                losses2 = snap2.losses;

                var textChoice = otherPlayer == 1 ? choice1 : choice2;
                var $i = $('<i>');
                $i.addClass('fa fa-hand-' + textChoice + '-o fa-one-large');
                $i.addClass('position-absolute-choice' + otherPlayer);
                $i.attr('data-choice', textChoice);
                game.rotateChoice(otherPlayer, $i, textChoice);
                $('.choices' + otherPlayer).append($i);

                game.choiceAnimation();
            });
        },
        logic: function() {

            if (choice1 == choice2) {
                game.winner(0);
            } else if (choice1 == 'rock') {
                if (choice2 == 'paper') {
                    game.winner(2);
                } else if (choice2 == 'scissors') {
                    game.winner(1);
                }
            } else if (choice1 == 'paper') {
                if (choice2 == 'rock') {
                    game.winner(1);
                } else if (choice2 == 'scissors') {
                    game.winner(2);
                }
            } else if (choice1 == 'scissors') {
                if (choice2 == 'rock') {
                    game.winner(2);
                } else if (choice2 == 'paper') {
                    game.winner(1);
                }
            }
        },
        winner: function(playerNum) {
            var results;

            if (playerNum == 0) {
                results = 'Tie!';
            } else {

                results = name[playerNum] + ' Wins!';

                if (playerNum == 1) {
                    wins = wins1;
                    losses = losses2;
                } else {
                    wins = wins2;
                    losses = losses1;
                }

                wins++;
                losses++;

                var otherPlayerNum = playerNum == 1 ? 2 : 1;
                $('.choices' + otherPlayerNum + ' > i').css('opacity', '0.5');
                window.setTimeout(function() {

                    playersRef.child(playerNum).update({
                        'wins': wins
                    });
                    playersRef.child(otherPlayerNum).update({
                        'losses': losses
                    });
                }, 500);
            }

            window.setTimeout(function() {
                $('.results').text(results).css('z-index', '1');
            }, 500);

            window.setTimeout(function() {

                turnRef.set(1);
                $('.results').text('').css('z-index', '-1');
            }, 2000);
        },
        choiceAnimation: function() {
            var $choice1 = $('.choices1 > i');
            var $choice2 = $('.choices2 > i');

            $choice1.addClass('animation-choice1');
            $choice1.one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function() {
                $choice1.addClass('choice1-end');
            });

            $choice2.addClass('animation-choice2');
            $choice2.one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function() {
                $choice2.addClass('choice2-end');
                game.logic();
            });
        }
    }

    game.listeners();


    var chat = {
        message: '',
        listeners: function() {

            $('#addMessage').on('click', function(event) {
                chat.getMessage();
                return false;
            });

            chatRef.on('child_added', function(childSnapshot) {

                var playerName = childSnapshot.val().name;
                var message = childSnapshot.val().message;

                chat.showMessage(playerName, message);
            });
        },
        getMessage: function() {
            var input = $('#message-input');

            chat.message = input.val();
            input.val('');

            if (player !== undefined) {
                chat.sendMessage();
            }
        },
        sendMessage: function() {
            var obj = {};
            obj['name'] = name[player];
            obj['message'] = chat.message;
            chatRef.push(obj);
        },
        sendDisconnect: function(key) {
            var obj = {};
            obj['name'] = name[key];
            obj['message'] = ' has disconnected.';
            chatRef.push(obj);
        },
        showMessage: function(playerName, message) {

            var messages = document.getElementById('messages');
            var isScrolledToBottom = messages.scrollHeight - messages.clientHeight <= messages.scrollTop + 1;

            var $p = $('<p>');
            if (message == ' has disconnected.' && player !== undefined) {
                $p.text(playerName + message);
                $p.css('background', 'gray');
            } else if (player !== undefined) {
                $p.text(playerName + ': ' + message);
            }

            if (name[1] == playerName) {
                $p.css('color', 'blue');

            } else if (name[2] == playerName) {
                $p.css('color', 'red');
            }

            if ($p.text() !== '') {
                $('#messages').append($p);
            }

            if (isScrolledToBottom) {
                messages.scrollTop = messages.scrollHeight - messages.clientHeight;;
            }
        }
    }


    chat.listeners();
});