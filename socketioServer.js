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
        this.io.use((socket, next) =>{
            try {
                const token = socket.request.headers['jwt'];
                const obj = jwt.validarToken(token);

                if (obj) {
                    socket.username = obj['user'];
                } else {
                    next(new Error("Usuario desconocido"));
                }
            }catch (err){
                next(new Error("Usuario desconocido"));
            }
        });

        //TODO: ojo con los async
        this.io.on('connection',  async (socket) => {
            console.log("Nuevo Cliente")

            const operacion = socket.request.headers['operacion'];
            let idSala = socket.request.headers['sala'];
            const usuario = socket['username'];
            const priv = socket.request.headers['priv'] === 'true';

            if(operacion === 'crearSala'){
                let res = cache.crearSala(usuario, priv);
                if(res.code === 0){
                    socket.join(res.sala);
                    idSala = res.sala;
                } else {
                    socket.disconnect(true);
                }
            } else {
                let res = undefined;
                if(operacion === 'unirseSala'){
                    res = await cache.unirseSala(idSala, usuario);
                } else if(operacion === 'buscarPartida'){
                    res = await cache.buscarPartida(usuario);
                }else{
                    socket.disconnect(true);
                }
                if(res !== undefined && res.code === 0){
                    socket.join(res.sala);
                    idSala = res.sala;
                    socket.to(res.sala).emit('nuevoJugador', usuario); // no emite al propio socket
                    socket.emit('cargarJugadores', cache.obtenerJugadores(idSala));

                } else {
                    socket.disconnect(true);
                }

            }


            //TODO considerar posibles casos de error al actualizar para condicionar la respuesta con un
            // codigo por ejemplo

            socket.on('abandonarSala', async () => {
                let res = await cache.abandonarSala(idSala, usuario)
                if( res.code === 0){
                    socket.leave(idSala);
                    let lider = res.nuevoLider;
                    if(lider === ''){
                        socket.to(idSala).emit('abandonarSala', usuario);
                    } else {
                        socket.to(idSala).emit('cambioLider', {usuario, lider});
                    }
                } else {
                    socket.disconnect(true);
                }
            });

            socket.on('comenzarPartida', async (fn) => {
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

            socket.on('actualizarJugada', (payload) => {
                //TODO actualizar cache (casilla + quesitos + cambiar turno)
                //TODO broadcast a todos para informar
                //TODO en caso de victoria broadcast de fin de partida para posterior mensaje a la API rest para actualizar
                // monedas e historial de partidas y volver al menú principal y borrar partida de la cache

                console.log(payload)
            });

            socket.on('abandonarPartida', () => {
                //TODO actualizar cache
                //TODO broadcast al resto de usuarios para indicar que un usuario ha abandonado la partida a frontend
                // Si nuevo lider tambien informarlo en el mensaje
            });

            socket.on('mensaje', (msg) => {
                socket.to(idSala).emit('chat', {usuario: usuario, msg: msg});
            });

            socket.on('disconnect', async () => {
                let res = await cache.abandonarSala(idSala, usuario)
                if( res.code === 0){
                    socket.leave(idSala);
                    let lider = res.nuevoLider;
                    if(lider === ''){
                        socket.to(idSala).emit('cambioLider', {usuario, lider});
                    } else {
                        socket.to(idSala).emit('abandonarSala', usuario);
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