const config = require('./config');

class SocketioServer{
    constructor(expressServer, port) {
        this.server = http.createServer(expressServer);
        this.io = require('socket.io')(server);
        this.port = port

        this.configurar();
    }

    configurar(){
        this.io.use((socket, next) =>{
            //TODO. Implementar función de validación del usuario
            const jwt = socket.request.headers['jwt'];

            next();
        });

        this.io.on('connection', socket => {
            const operacion = socket.request.headers['operacion'];
            const sala = socket.request.headers['sala'];

            //TODO. Definir operaciones entrantes
            console.log("Nuevo Cliente")

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