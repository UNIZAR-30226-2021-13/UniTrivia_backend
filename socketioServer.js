const http = require('http');
const config = require('./config');
const socketio = require('socket.io');
const jwt = require('utils/JWT');

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

        this.io.on('connection', socket => {
            console.log("Nuevo Cliente")
            const operacion = socket.request.headers['operacion'];
            const sala = socket.request.headers['sala'];

            if(operacion === 'crearSala'){
                //TODO actualizar cache
                //TODO join room
            } else {
                if(operacion === 'unirseSala'){
                    //TODO actualizar cache
                } else if(operacion === 'buscarPartida'){
                    //TODO actualizar cache
                }else{
                    //TODO error
                }

                //TODO broadcast indicando union a sala ('nuevoJugador')
                //TODO join room
                //TODO obtener el nombre e imgs del resto de jugadores para enviarlas a frontend
            }


            //TODO considerar posibles casos de error al actualizar para condicionar la respuesta con un
            // codigo por ejemplo

            client.on('abandonarSala', (idSala) => {
                //TODO actualizar cache
                //TODO broadcast al resto de usuarios para indicar que un usuario ha abandonado la partida a frontend
                // Si nuevo lider tambien informarlo en el mensaje
            });

            client.on('comenzarPartida', (idSala) => {
                //TODO actualizar cache
                //TODO broadcast a todos para informar
            });

            client.on('actualizarJugada', ({idSala, payload}) => {
                //TODO actualizar cache (casilla + quesitos + cambiar turno)
                //TODO broadcast a todos para informar
                //TODO en caso de victoria broadcast de fin de partida para posterior mensaje a la API rest para actualizar
                // monedas e historial de partidas y volver al menú principal y borrar partida de la cache
            });

            client.on('abandonarPartida', (idSala) => {
                //TODO actualizar cache
                //TODO broadcast al resto de usuarios para indicar que un usuario ha abandonado la partida a frontend
                // Si nuevo lider tambien informarlo en el mensaje
            });

            socket.on('miMensaje', function(data){
                console.log(data)
            });
        });
    }

    launch(){
        this.server.listen(this.port);
        console.log(`Listening on port ${this.port}`);
    }
}

module.exports = SocketioServer