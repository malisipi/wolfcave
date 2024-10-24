async function check_access_code_valid(server_ip, server_secure, access_code){
    return (await (await fetch("http" + (["","s"][Number(server_secure)]) + "://" + server_ip + "/auth?"+encodeURIComponent(access_code))).text()) === "true";
};

const color_name_list = ["Red", "Green", "Blue", "Yellow", "Orange", "Purple", "Black", "White", "Magenta", "Cyan", "Lime", "Pink", "Silver", "Gray", "Brown", "Violet"];
const animal_name_list = ["Wolf", "Elephant", "Tiger", "Kangaroo", "Giraffe", "Dolphin", "Panda", "Penguin", "Cheetah", "Zebra", "Rhino", "Flamingo", "Gorilla", "Cat", "Dog", "Fox", "Snake", "Fish"];

function gen_random_name(){
    return (color_name_list[Math.floor(Math.random()*color_name_list.length)]) + " "
            + (animal_name_list[Math.floor(Math.random()*animal_name_list.length)]);
};

// DOM Objects
var auth_dialog = document.querySelector(".auth-dialog");
var auth_dailog_server_ip = auth_dialog.querySelector("& .server_ip");
var auth_dailog_server_secure = auth_dialog.querySelector("& .server_secure");
var auth_dailog_name = auth_dialog.querySelector("& .name");
var auth_dailog_access_code = auth_dialog.querySelector("& .access_code");
var auth_dailog_submit = auth_dialog.querySelector("& .submit");

auth_dailog_name.value = gen_random_name();
auth_dailog_submit.addEventListener("click", async () => {
    if(auth_dailog_name.length < 3) return alert("Your name must consist of at least three letters.");
    if(!await check_access_code_valid(auth_dailog_server_ip.value, auth_dailog_server_secure.checked, auth_dailog_access_code.value)) return alert("Your access code is invalid. Contact with your WolfCave service provider for access code.");
    auth_dialog.open = false;
    load_wolfcave(auth_dailog_server_ip.value, auth_dailog_server_secure.checked, auth_dailog_access_code.value, auth_dailog_name.value);
});

(async () => {
    let wolfcave_config = await (await fetch("./wolfcave_config.json")).json();
    if(wolfcave_config.is_internal_client === true){
        auth_dailog_server_ip.hidden = true;
        auth_dailog_server_secure.parentElement.hidden = true;
        auth_dailog_server_ip.value = location.host;
        auth_dailog_server_ip.disabled = true;
        auth_dailog_server_secure.checked = location.protocol === "https:";
        auth_dailog_server_secure.disabled = true;
    };
})();