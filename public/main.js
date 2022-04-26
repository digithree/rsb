$(function() {
    // initial variables
    const $window = $(window);
    const $terminalElement = $('.messages');
    const $inputElement = $('.inputMessage');
    const $tasksElement = $('.tasks');
    const socket = io();

    let hasTasksUpdatePropagatedToSocket = false;
    let tasks = [];

    const timer = setInterval(function() {
        if (tasks.length === 0) {
            $tasksElement[0].innerHTML = "<p>No tasks currently active.</p>"
            $tasksElement[0].style.color = "#999"
        } else {
            let html = ""
            let firstTask = true
            let doTaskUpdate = false
            tasks.forEach(task => {
                task.timeLeft -= 1000

                html += "<p>Task: " + task.name + "</p>"

                let timeLeftAdjusted = task.timeLeft + 1000 // add a second to adjust for error
                let timeLeftReadable = ""
                if (timeLeftAdjusted > 0) {
                    const days = Math.floor(timeLeftAdjusted / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((timeLeftAdjusted % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((timeLeftAdjusted % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((timeLeftAdjusted % (1000 * 60)) / 1000);
                    if (days > 0) {
                        timeLeftReadable += days + "d "
                    }
                    if (hours > 0) {
                        timeLeftReadable += hours + "h "
                    }
                    if (minutes > 0) {
                        timeLeftReadable += minutes + "m "
                    }
                    if (seconds > 0) {
                        timeLeftReadable += seconds + "s"
                    }
                } else {
                    timeLeftReadable = "FINISHED"
                    doTaskUpdate = true
                }

                html += "<p>Time left: " + timeLeftReadable + "</p>"

                if (!firstTask) {
                    html += "<br><br>"
                }
                firstTask = false
            })
            $tasksElement[0].innerHTML = html
            $tasksElement[0].style.color = "#eee"
            // if a tasks was finished and there is no input in the input field then update tasks on server by
            // sending command "tasks"
            if (doTaskUpdate && !hasTasksUpdatePropagatedToSocket) {
                const inputMessage = cleanInput($inputElement.val())
                if (inputMessage === "") {
                    hasTasksUpdatePropagatedToSocket = true
                    $inputElement.val("tasks")
                    sendMessage()
                }
            }
        }
    }, 1000)

    let connected = false;

    // set up terminal
    const term = new Terminal({
        convertEol: true,
        rows: 40
    });
    term.open($terminalElement[0]);
    term.write("\n");

    $inputElement.focus();

    // sends a chat message
    function sendMessage () {
        let message = $inputElement.val();
        // Prevent markup from being injected into the message
        message = cleanInput(message);
        // if there is a non-empty message and a socket connection
        if (message && connected) {
            $inputElement.val('');
            if ($('.inputMessage').prop("type") == "password") {
                // Password entered
                terminalOutput({
                    msg: '> *******'
                });
            } else {
                // Normal command
                terminalOutput({
                    msg: '> ' + message + "\n"
                });
            }

            // Send message to server
            // tell server to execute 'new message' and send along one parameter
            socket.emit('input', {"msg": message});
        }
    }

    // add output to terminal
    function terminalOutput (data) {
        term.write(data.msg)
    }

    // prevents input from having injected markup
    function cleanInput (input) {
        return $('<div/>').text(input).text();
    }

    // - keyboard events

    $window.keydown(function (event) {
        // auto-focus the current input when a key is typed
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $inputElement.focus();
        }
        // ENTER key event
        if (event.which === 13) {
            sendMessage();
        }
    });

    // - click events

    // Focus input when clicking on the message input's border
    $inputElement.click(function () {
        $inputElement.focus();
    });

    // - socket events

    // server emits 'output', text to display to use
    socket.on('output', function (data) {
        connected = true;
        data.msg = "\n" + data.msg + "\n";

        // If we expect password in return
        if (data.password) {
            $('.inputMessage').prop("type", "password");
        } else {
            $('.inputMessage').prop("type", "text");
        }

        terminalOutput(data);
    });

    // server emits 'tasks', task timers to display
    socket.on('tasks', function (data) {
        connected = true;
        tasks = data.tasks
        hasTasksUpdatePropagatedToSocket = false
    });
});
