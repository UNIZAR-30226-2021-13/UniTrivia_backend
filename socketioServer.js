const http = require('http');
const socketio = require('socket.io');
const jwt = require('./utils/JWT');
const cache = require('./utils/ServerCache');
const logger = require('./logger');

class SocketioServer{
    constructor(expressServer, port) {
        this.server = http.createServer(expressServer);
        this.io = new socketio.Server(this.server);
        this.port = port

        this.configurar();
    }

    configurar(){
        this.io.of('/api/partida').use((socket, next) =>{
            try {
                const token = socket.request.headers['jwt'];
                const obj = jwt.validarToken(token);

                if (obj) {
                    socket.username = obj['user'];
                    console.log("Conectado: " + socket.username);
                    next();
                } else {
                    next(new Error("Usuario desconocido"));
                }
            }catch (err){
                next(new Error("Usuario desconocido"));
            }
        });

        //TODO: ojo con los async
        this.io.of('/api/partida').on('connection',  async (socket) => {

            const operacion = socket.request.headers['operacion'];
            let idSala = socket.request.headers['sala'];
            const usuario = socket['username'];
            const priv = socket.request.headers['priv'] === 'true';
            const sala = cache.salaDelUsuario(usuario);

            console.log("Nuevo Cliente");
            console.log("operacion = " + operacion);
            console.log("idSala = " + idSala);
            console.log("usuario = " + usuario);
            console.log("priv = " + priv);
            console.log("sala = " + sala);

            if(sala.sala !== ''){
                //TODO Falta implementar que pueda volver el usuario
            } else {
                if (operacion === 'crearSala') {
                    console.log("Entra crear sala")
                    let res = cache.crearSala(usuario, priv);
                    if (res.code === 0) {
                        console.log("Crea sala: ");
                        console.log(res)
                        socket.join(res.sala);
                        idSala = res.sala;
                    } else {
                        socket.disconnect(true);
                    }
                } else {
                    let res = undefined;
                    if (operacion === 'unirseSala') {
                        res = await cache.unirseSala(idSala, usuario);
                    } else if (operacion === 'buscarPartida') {
                        res = await cache.buscarPartida(usuario);
                    } else {
                        socket.disconnect(true);
                    }
                    console.log(res);
                    if (res !== undefined && res.code === 0) {
                        socket.join(res.sala);
                        idSala = res.sala;
                        socket.to(res.sala).emit('nuevoJugador', usuario); // no emite al propio socket
                        socket.emit('cargarJugadores', cache.obtenerJugadores(idSala));

                    } else {
                        socket.disconnect(true);
                    }

                }
            }

            console.log("Post-inicio");
            console.log("operacion = " + operacion);
            console.log("idSala = " + idSala);
            console.log("usuario = " + usuario);
            console.log("priv = " + priv);
            console.log("sala = " + sala);

            socket.on('obtenerIdSala', async (fn) => {
                fn(idSala);
            })

            //TODO considerar posibles casos de error al actualizar para condicionar la respuesta con un
            // codigo por ejemplo

            socket.on('abandonarSala', async (fn) => {
                let res = await cache.abandonarSala(idSala, usuario)
                if( res.code === 0){
                    let lider = res.nuevoLider;
                    if(lider === ''){
                        socket.to(idSala).emit('abandonoSala', usuario);
                    } else {
                        socket.to(idSala).emit('cambioLider', {usuario, lider});
                    }
                    socket.leave(idSala);
                    fn(0);

                } else {
                    //socket.disconnect(true);
                    fn(1);
                }
            });

            socket.on('comenzarPartida', async (fn) => {
                //TODO solo el lider puede comenzar partida
                const ok = await cache.comenzarPartida(idSala);
                switch(ok['code']){
                    case 1: //Error desconocido
                        fn({res: "error", info: "Desconocido" });
                        break;
                    case 2: //No existe la partida
                        fn({res: "error", info: "Partida no encontrada: " + ok['info']});
                        logger.alert('Partida no encontrada en una conexión existente.');
                        break;
                    case 3: //Número de jugadores insuficiente
                        fn({res: "error", info: "Número jugadores insuficiente: " + ok['info']});
                        break;
                    case 0: //OK
                        fn({res: "ok", info: ""});
                        socket.to(idSala).emit('comienzoPartida',"");
                        this.io.in(idSala).emit('turno',ok['info']);
                        break;
                }
            });

            socket.on('posiblesJugadas', (dado) => {
                //TODO explorar los posibles movimientos del usuario
                //     que tiene el turno moviendo dado casillas y devolver
                //      la lista de casillas que se pueden visitar.
                console.log(dado)
            });

            socket.on('actualizarJugada', (input) => {
                //TODO actualizar cache (casilla + quesitos + cambiar turno)
                //TODO broadcast a todos para informar
                //TODO en caso de victoria broadcast de fin de partida para posterior mensaje a la API rest para actualizar
                // monedas e historial de partidas y volver al menú principal y borrar partida de la cache

                console.log(input)
            });

            socket.on('abandonarPartida', async (fn) => {
                //TODO actualizar cache
                //TODO broadcast al resto de usuarios para indicar que un usuario ha abandonado la partida a frontend
                // Si nuevo lider tambien informarlo en el mensaje
                let res = await cache.abandonarPartida(idSala, usuario);
                switch (res){
                    case '-1':
                        fn({res: "error", info:"Desconocido"});
                        break;
                    case '-2':
                        fn({res: "error", info:"No se pertence a la sala"});
                        break;
                    case '-3':
                        fn({res: "error", info:"No existe la sala"});
                        break;
                    default:
                        res = res.substring(1);
                        socket.to(idSala).emit('jugadorSale', usuario);
                        if(res !== '0'){
                            socket.to(idSala).emit('turno', res);
                        }
                        socket.leave(idSala);
                        fn({res: "ok", info:""});
                        break;
                }
            });

            socket.on('mensaje', (msg) => {
                socket.to(idSala).emit('chat', {usuario: usuario, msg: msg});
                console.log("Mensaje de "+usuario+": " + msg);
            });

            socket.on('disconnect', async () => {
                let res = await cache.abandonarSala(idSala, usuario)
                if( res.code === 0){
                    socket.leave(idSala);
                    let lider = res.nuevoLider;
                    if(lider === ''){
                        socket.to(idSala).emit('cambioLider', {usuario, lider});
                    } else {
                        socket.to(idSala).emit('abandonoSala', usuario);
                    }
                } else if(false){
                    //TODO poner lo mismo que en socket.on('abandonarPartida')
                    // o mandar un mensaje para poner un timeout de reconexion y si se cumple echarlo
                } else {
                    //socket.disconnect(true);
                }
            });

        });
    }

    launch(){
        this.server.listen(this.port);
        console.log(`Listening on port ${this.port}`);
    }
}

module.exports = SocketioServer