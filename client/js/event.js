var event_websocket;

async function start_event_socket(server_ip, server_secure, access_code) {
    event_websocket = new WebSocket("ws" + (["","s"][Number(server_secure)]) + "://" + server_ip + "/event/?"+encodeURIComponent(access_code));
    event_websocket.onopen = () => {
        console.info("Event WebSocket connection opened");
        event_websocket.send(JSON.stringify({
            nickname: registered_name,
            event: "landing"
        }));
    };
    event_websocket.onmessage = async (event) => {
        let message;
        if(typeof(event.data) == "string") {
            message = JSON.parse(event.data);
        } else {
            message = JSON.parse(await event.data.text());
        };
        if(message.event == "update"){
            update_handler(message);
        } else if(message.event == "landing" || message.event == "kicked" || message.event == "leaving"){
            new_server_event_recieved(message);
        } else if (message.event == "message"){
            log_new_message(message);
        };
    };
};

function stop_event_socket(){
    event_websocket.close();
}