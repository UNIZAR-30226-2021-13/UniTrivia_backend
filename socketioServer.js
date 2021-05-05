const http = require('http');
const socketio = require('socket.io');
const jwt = require('./utils/JWT');
const cache = require('./utils/ServerCache');
const logger = require('./logger');

class SocketioServer{
    constructor(expressServer, port) {
        this.server = http.createServer(expressServer);
        this.io = new socketio.Server(this.server,{
            allowEIO3: true,
            pingInterval: 5000,
            pingTimeout: 25000
        }).of('/api/partida');
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
                    socket.invitado = obj['guest'];
                    console.log("Conectado: " + socket.username);
                    next();
                } else {
                    next(new Error("Usuario desconocido"));
                }
            }catch (err){
                next(new Error("Usuario desconocido"));
            }
        });

        this.io.on('connection',  async (socket) => {

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
                if(operacion !== 'reconexion') {
                    socket.disconnect(true);
                    return;
                }

                idSala = sala.sala;
                if(await cache.reconexionJugador(idSala, usuario) !== 0){
                    socket.disconnect(true);
                    return
                }
                socket.join(idSala);
                socket.to(idSala).emit('reconexionJugador', usuario); // no emite al propio socket
                socket.emit('estadoPartida', cache.estadoPartida(idSala));

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
                        socket.to(idSala).emit('cambioLider', {antiguo: usuario, nuevo: lider});
                    }
                    socket.leave(idSala);
                    fn(0);

                } else {
                    //socket.disconnect(true);
                    fn(1);
                }
            });

            socket.on('comenzarPartida', async (fn) => {
                if(cache.liderDeSala(idSala) !== usuario){
                    fn({res: "error", info: "Sólo el lider puede comenzar la partida."})
                    return;
                }
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
                        console.log(ok);
                        socket.to(idSala).emit('comienzoPartida',"");
                        this.io.in(idSala).emit('turno',ok['info']);
                        break;
                }
            });

            socket.on('posiblesJugadas', async (dado, fn) => {
                console.log("Entrada a posiblesJugadas. dado = ", dado);
                const posicion = cache.obtenerPosicion(idSala, usuario);
                console.log("posiblesJugadas.obtenerPosicion(idSala=", idSala,";usuario=",usuario,") = ", posicion);
                const turno = cache.obtenerTurno(idSala);
                console.log("posiblesJugadas.obtenerTurno(idSala=", idSala,") = ", turno);
                if(turno === usuario) {
                    if(posicion !== undefined){
                        if(dado < 0 || dado > 6){
                            fn({res: "err", info: "Dado incorrecto"});
                            return ;
                        }
                        const ok = await cache.getPosiblesJugadas(idSala, usuario, posicion, dado);
                        switch(ok['code']){
                            case 0:
                                fn({res: "ok", info: ok['res']})
                                break;
                            case 1:
                                fn({res: "err", info: "Error desconocido."})
                                break;
                            case 2:
                                fn({res: "err", info: "Jugador inválido."})
                                break;
                            case 3:
                                fn({res: "err", info: "No se pudo obtener tu posición."})
                                break;
                            case 4:
                                fn({res: "err", info: "Error al recuperar las preguntas."})
                                break;
                            default:
                                fn({res: "err", info: "Error desconocido."})
                                break;
                        }
                    }else{
                        fn({res: "err", info: "No se pudo obtener tu posición."})
                    }
                }else{
                    fn({res: "err", info: "No es el turno."})
                }
            });

            socket.on('actualizarJugada', async ({casilla, quesito,finTurno}, fn) => {
                let ok = await cache.nuevaJugada(idSala, usuario, casilla, quesito, finTurno);
                let resultado = {res: "error", info: "Error desconocido"}
                switch (ok){
                    case 0:
                    case 1:
                        socket.to(idSala).emit("jugada", {
                            user: usuario,
                            casilla: casilla,
                            ques: quesito
                        });
                        if(ok == 0){
                            this.io.in(idSala).emit('turno', cache.obtenerTurno(idSala));
                        }
                        if(cache.obtenerQuesitosRestantes(idSala, usuario) === 0){
                            console.log("Al menos entra aqui")
                            this.io.in(idSala).emit("finDelJuego",usuario);
                            await cache.borrarPartida(idSala);
                        }
                        resultado = {res: "ok", info: ""};
                        break;
                    case 2:
                        resultado = {res: "error", info: "Jugador no pertenece a la sala"};
                        break;
                    case 3:
                        resultado = {res: "error", info: "No es el turno del jugador"};
                        break;
                    case 4:
                        resultado = {res: "error", info: "No existe la sala"};
                        break;
                    case 5:
                        resultado = {res: "error", info: "Error desconocido"};
                        break;
                }
                fn(resultado);

            });

            socket.on('abandonarPartida', async (fn) => {
                let res = await cache.abandonarPartida(idSala, usuario);
                switch (res){
                    case 0:
                    case 1:
                        socket.to(idSala).emit('jugadorSale', usuario);
                        if(res === 0){
                            socket.to(idSala).emit('turno', cache.obtenerTurno(idSala));
                        }
                        socket.leave(idSala);
                        fn({res: "ok", info:""});
                        break;
                    case 2:
                        fn({res: "error", info:"No se pertence a la sala"});
                        break;
                    case 3:
                        fn({res: "error", info:"No existe la sala"});
                        break;
                    case 4:
                        fn({res: "error", info:"Desconocido"});
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
                    if(lider !== ''){
                        socket.to(idSala).emit('cambioLider', {antiguo: usuario, nuevo: lider});
                    } else {
                        socket.to(idSala).emit('abandonoSala', usuario);
                    }
                } else if((res = await cache.abandonarPartida(idSala, usuario)) <= 1){
                    socket.to(idSala).emit('jugadorSale', usuario);
                    if(res === 0){
                        socket.to(idSala).emit('turno', cache.obtenerTurno(idSala));
                    }
                    socket.leave(idSala);
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