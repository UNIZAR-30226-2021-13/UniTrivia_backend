const io = require("socket.io-client");
const http = require("http");
const assert = require("assert");

let token = "";
let conn = undefined;

http.get({
    hostname: "localhost",
    port: 3000,
    path: "/api/login",
    headers: {
        "username": "test2",
        "password": "test2"
    }
}, (res) => {
    token = ""
    res.on("data", chunk => {
        token += chunk;
    })

    res.on("end", ()=>{
        assert.notStrictEqual(token, "");

        conn = io("http://localhost:3000/api/partida",{
            extraHeaders:{
                jwt: token,
                operacion: "crearSala",
                priv: "true"
            }
        });

        conn.on("connect", ()=>{
            assert.notStrictEqual(conn, undefined);
            assert.strictEqual(conn.connected, true);

            conn.emit("obtenerIdSala", (id)=>{
                assert.notStrictEqual(id, '');
            });

            conn.emit("comenzarPartida", (res)=>{
                assert.deepStrictEqual(res, {res: "error", info: "Número jugadores insuficiente: 1"});
            });


            conn.emit("mensaje", "Hola Mundo");
            conn.on('chat', ({user, msg})=>{
                assert.strictEqual(user, "");
            })

            conn.emit("abandonarSala", (code)=>{
                assert.strictEqual(code, 0);
                conn.close();
            })
        })
    })
});

