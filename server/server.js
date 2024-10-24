const http = require("http");
const ws = require("ws");
const fs = require("fs");
const process = require("process");

const is_logging_allowed = process.env.DISABLE_LOGGING !== "true";
console.warn("Logging is " + ["disabled", "enabled"][Number(is_logging_allowed)]);

function server_log(data, print_to_console=true){
    if(print_to_console) console.info(data);
    if(is_logging_allowed) fs.appendFileSync("./wolfcave-server.log", data+"\n");
};

function get_time_string(){
    return (new Date).toISOString();
};

function get_random_color(){
    return "#"+ Math.floor(Math.random()*(255*255*255)).toString(16).padStart(6, '0');
}

server_log("\n==> Wolfcave Server Started <==");
server_log("> Server started at \""+get_time_string()+"\"");

if(process.env.WOLFCAVE_AUTH_CODE === undefined){
    console.error("WOLFCAVE_AUTH_CODE env is not set.");
    process.exit(0);
};
if(process.env.WOLFCAVE_HOST_CLIENT == "true"){ // TODO: Wolfcave hosting is unsafe, fix it
    console.warn("Using Wolfcave internal client to host client");
};

const encoded_access_code = encodeURIComponent(process.env.WOLFCAVE_AUTH_CODE);

const server = http.createServer((req, res) => {
    let _404 = () => {
        try {
            res.writeHead(404, { 'Content-Type': 'text/html' });
        } catch {}
        res.end("Not Found");
        return;
    };
    try {
        let page_url = req.url;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Request-Method', '*');
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
        res.setHeader('Access-Control-Allow-Headers', '*');
        if(page_url.split("?")[0].endsWith("/")){
            page_url += "index.html";
        };
        if(page_url.startsWith("/auth?")){
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(String(encoded_access_code === page_url.split("?").at(-1)));
            return;
        } else {
            if(process.env.WOLFCAVE_HOST_CLIENT == "true"){ // TODO: Wolfcave hosting is unsafe, fix it
                if(page_url === "/wolfcave_config.json"){
                    res.writeHead(200, { 'Content-Type': 'text/javascript' });
                    res.end(`{"is_internal_client": true}`);
                    return;
                };
                let extension = page_url.split(".").at(-1).toLowerCase();
                try {
                    if(extension == "htm" || extension == "html"){
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                    } else if(extension == "css"){
                        res.writeHead(200, { 'Content-Type': 'text/css' });
                    } else if(extension == "js"){
                        res.writeHead(200, { 'Content-Type': 'text/javascript' });
                    } else if(extension == "json"){
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                    } else if(extension == "ico"){
                        res.writeHead(200, { 'Content-Type': 'image/x-icon' });
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                    };
                    res.end(fs.readFileSync("./client/" + page_url.replaceAll("../", "")));
                    return;
                } catch {
                    return _404();
                };
            } else {
                return _404();
            };
        };
    } catch { // Actually, it's a exception and should never reach here however client never need to now at all. So return a "not found" info
        return _404();
    };
});

const wss = new ws.Server({ server });

wss.on('connection', (ws, req) => {
    ws.ip_address = req.socket.remoteAddress;
    if(req.url === "/stream/?" + encoded_access_code){
        ws.opened_for = "stream";
    } else if(req.url === "/event/?" + encoded_access_code){
        ws.opened_for = "event";
    } else {
        ws.close();
        server_log("> Killed unauthorized access (ip: \""+(ws.ip_address)+"\", time:\""+get_time_string()+"\")");
        return;
    };

    ws.on('message', (message) => {
        if(ws.opened_for == "stream"){
            wss.clients.forEach(client => {
                if (client.opened_for == "stream" && client !== ws && client.readyState === ws.OPEN) {
                    client.send(message);
                };
            });
        } else if (ws.opened_for == "event") {
            let the_message = JSON.parse(message);
            if(the_message.event == "landing"){
                ws.nickname = the_message.nickname;
                ws.color = get_random_color();
            };
            if(ws.nickname != the_message.nickname){
                the_message = {
                    "event": "kicked",
                    "nickname": ws.nickname,
                    "reason": "User tried to cheat server by changing their nickname by tricking the client."
                };
                ws.close();
            };
            the_message.ip = ws.ip_address;
            the_message.time = get_time_string();
            the_message.color = ws.color;
            let message_as_text = JSON.stringify(the_message);
            server_log(message_as_text, false);
            wss.clients.forEach(client => {
                if (client.opened_for == "event" && client.readyState === ws.OPEN) {
                    client.send(message_as_text);
                };
            });
        };
    });

    ws.on('close', () => {
        server_log("> Client disconnected (ip: \""+(ws.ip_address)+"\", time:\""+get_time_string()+"\")");
        let the_message = {
            "event": "leaving",
            "nickname": ws.nickname,
            "ip": ws.ip_address,
            "color": ws.color ?? null,
            "time": get_time_string()
        };
        let message_as_text = JSON.stringify(the_message);
        server_log(message_as_text, false);
        wss.clients.forEach(client => {
            if (client.opened_for == "event" && client.readyState === ws.OPEN) {
                client.send(message_as_text);
            };
        });
    });

    server_log("> Client connected (ip: \""+(ws.ip_address)+"\", time:\""+get_time_string()+"\")");
});

setInterval(()=>{
    let active_clients = Array.from(wss.clients).filter(client => client.opened_for == "event" && client.readyState === ws.OPEN);
    let message_data = JSON.stringify({
        "event": "update",
        "time": get_time_string(),
        "participants": active_clients.map(active_client => ({
            "ip": active_client.ip_address,
            "nickname": active_client.nickname,
            "color": active_client.color
        }))
    });
    active_clients.forEach(active_client => {
        active_client.send(message_data);
    });
}, 750);

server.listen(8000, () => {
    console.log('Server is listening on http://localhost:8000');
});
