var registered_name = null;

window.addEventListener("beforeunload", function (event){ // Ask before leave browser
    event.preventDefault();
});

// DOM Objects
participants_list = document.querySelector(".participants");

title_nickname = document.querySelector(".title > .nickname");
messages_logs = document.querySelector(".messages > .logs");
messages_message_input = document.querySelector(".messages > .input > textarea");
messages_send_message_button = document.querySelector(".messages > .input > button");

messages_logs.append_n_scroll = (element) => {
    messages_logs._scrollTopMax = messages_logs.scrollTopMax ?? messages_logs.scrollHeight - messages_logs.getBoundingClientRect().height; /* Chromium Support */
    let is_end = (messages_logs._scrollTopMax - messages_logs.scrollTop) <= 5;
    messages_logs.append(element);
    messages_logs._scrollTopMax = messages_logs.scrollTopMax ?? messages_logs.scrollHeight - messages_logs.getBoundingClientRect().height; /* Chromium Support */
    if(is_end){
        messages_logs.scrollTop = messages_logs._scrollTopMax;
    };
};

async function load_wolfcave(server_ip, server_secure, access_code, name) {
    console.info("Loading WolfCave..")
    registered_name = name;
    title_nickname.innerText = registered_name;
    start_event_socket(server_ip, server_secure, access_code);
};

function new_server_event_recieved(message){
    let landing_div = document.createElement("div");
    landing_div.className = "server-info";
    let nickname_span = document.createElement("span");
    nickname_span.className = "nickname";
    nickname_span.innerText = message.nickname;
    nickname_span.style.setProperty("color", message.color);
    let info_text_span = document.createElement("span");
    if(message.event == "landing"){
        info_text_span.innerText = " is entered to chat";
    } else if(message.event == "kicked"){
        info_text_span.innerText = " is kicked. Reason: " + message.reason;
    } else if(message.event == "leaving"){
        info_text_span.innerText = " is leaved the chat";
    };
    landing_div.append(nickname_span);
    landing_div.append(info_text_span);
    messages_logs.append_n_scroll(landing_div);
};

function log_new_message(message){
    let message_div = document.createElement("div");
    message_div.className = "message";
    let nickname_span = document.createElement("span");
    nickname_span.className = "nickname";
    nickname_span.innerText = message.nickname + ":";
    nickname_span.style.setProperty("color", message.color);
    let user_message_div = document.createElement("span");
    user_message_div.innerText = " " + message.message;
    let quote_button = document.createElement("button");
    quote_button.className = "quote material-symbols-rounded";
    quote_button.innerText = "format_quote";
    quote_button.addEventListener("click", () => {
        messages_message_input.value += " `"+message.message + " ~ " + message.nickname+"` ";
    });
    message_div.append(nickname_span);
    message_div.append(user_message_div);
    message_div.append(quote_button);
    messages_logs.append_n_scroll(message_div);
    if(document.hidden){
        Notification.requestPermission();
        new Notification("@"+message.nickname, {body:message.message});
    }
};

function update_handler(message){
    participants_list.innerText = "";
    for(let participant_index in message.participants){
        let participant = message.participants[participant_index];
        let participant_div = document.createElement("div");
        participant_div.innerText = participant.nickname;
        participant_div.className = "participant";
        participant_div.style.background = participant.color;
        participants_list.append(participant_div);
    }
};

messages_send_message_button.addEventListener("click", () => {
    event_websocket.send(JSON.stringify({
        nickname: registered_name,
        message: messages_message_input.value.trim(),
        event: "message"
    }));
    messages_message_input.value = "";
});

var _is_message_sended_by_enter = false;

messages_message_input.addEventListener("keydown", event => {
    if(!event.shiftKey && event.key == "Enter"){
        messages_send_message_button.click();
        _is_message_sended_by_enter = true;
    };
});

messages_message_input.addEventListener("keyup", event => {
    if(_is_message_sended_by_enter){
        messages_message_input.value = "";
        _is_message_sended_by_enter = false;
    };
});
