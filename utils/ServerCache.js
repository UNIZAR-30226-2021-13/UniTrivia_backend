const logger = require('../logger');
const NodeCache = require('node-cache');
const Mutex = require('async-mutex').Mutex;
const config = require('../config')

let salasPub = null; //NodeCache con las salas publicas pendientes de empezar
let salasPriv = null; //NodeCache con las salas privadas pendientes de empezar
let salasJuego = null; //NodeCache con las salas en las que actualmente se está jugando
let usuariosEnSala = null; //NodeCache con los usuarios y las salas en las que están

class NodoJugador{
    /**
     * Constructor
     *
     * @param {string} nombre Nombre del usuario
     * @param {number[]} casilla Posición x (componente 0) e y del jugador
     * @param {string[]} quesitos Array con los colores de los quesitos que tiene
     * @param {number} nRestantes Número de quesitos restantes para el jugador
     */
    constructor(nombre, casilla, quesitos, nRestantes){
        this.nombre = nombre;
        this.casilla = casilla;
        this.quesitos = quesitos;
        this.nRestantes = nRestantes;
    }
}

class NodoJuego{
    set turno(value) {
        this._turno = value;
    }

    set jugadores(value) {
        this._jugadores = value;
    }

    set nJugadores(value) {
        this._nJugadores = value;
    }
    get turno() {
        return this._turno;
    }

    get jugadores() {
        return this._jugadores;
    }

    get nJugadores() {
        return this._nJugadores;
    }
    /**
     * Constructor
     *
     * @param {string} turno Nombre del jugador que tiene el turno
     * @param {NodoJugador[]} jugadores Array con la información de la partida de cada jugador
     * @param {number} nJugadores Número de componentes del array jugadores
     */
    constructor(turno, jugadores, nJugadores){
        this._turno = turno;
        this._jugadores = jugadores;
        this._nJugadores = nJugadores;
        //this.mutex = new Mutex();
    }
}

class NodoSala{
    /**
     * Constructor
     *
     * @param {string[]} jugadores Array con el nombre de usuario de cada jugador
     * @param {number} nJugadores Número de componentes del array jugadores
     * @param {string} lider El nombre de usuario del líder de la sala
     */
    constructor(jugadores, nJugadores, lider){
        this.jugadores = jugadores;
        this.nJugadores = nJugadores;
        this.lider = lider;
        this.mutex = new Mutex();
    }
}

//Origen: https://stackoverflow.com/a/1349426
function randString(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/**
 * Función para iniciar la memoria caché del servidor
 */

function crear(){
    try {
        salasPub = new NodeCache({maxKeys: 100, useClones: false});
        salasPriv = new NodeCache({maxKeys: 20, useClones: false});
        salasJuego = new NodeCache({stdTTL: 72000, useClones: false});
        usuariosEnSala = new NodeCache({useClones: false});

    } catch(err){
        logger.error("Error al crear la memoria cache", err);
    }
}

/**
 * Función para terminar la memoria caché del servidor
 */

function stop() {
    try {
        salasPub.close();
        salasPriv.close();
        salasJuego.close();

    } catch(err){
        logger.error("Error al terminar la memoria cache", err);
    }
}

/**
 * Función para añadir un usuario si no existe a la cache de usuarios en salas
 * @param usuario Nombre del usuario
 * @param idSala Id de la sala
 * @returns {number}
 */

function addUser(usuario, idSala) {
    try {
        if(!usuariosEnSala.has(usuario)){
            usuariosEnSala.set(usuario, idSala);
            return 0;
        } else{
            return 1;
        }

    } catch(err){
        logger.error("Error al añadir usuario", err);
        return 1;
    }
}


/**
 * Función para borrar un usuario de la caché de usuarios en salas
 * @param usuario Nombre del usuario
 * @returns {number}
 */
function deleteUser(usuario) {
    try {
        if(usuariosEnSala.has(usuario)) {
            usuariosEnSala.del(usuario);
        }
        return 0;

    } catch(err){
        logger.error("Error al añadir usuario", err);
        return 1;
    }
}

/**
 * Función para obtener la sala en la que está un usuario
 *
 * @param usuario
 * @returns {{code: number, sala}|{code: number, sala: string}|{code: number, sala: string}}
 */
function salaDelUsuario(usuario){
    try {
        return usuariosEnSala.has(usuario) ? {code: 0, sala: usuariosEnSala.get(usuario) }
                : {code: 1, sala: '' };

    } catch(err){
        logger.error("Error al añadir usuario", err);
        return {code: 1, sala: '' };
    }
}


/**
 * Función para crear una sala con el líder de la sala
 * @param {string} usuario Usuario líder de la sala
 * @param {boolean} priv True si la sala es privada y false en caso contrario
 * @returns {{code: number, sala: string}}
 */
function crearSala(usuario, priv){
    try{
        let id_sala = randString(5);
        let valor = new NodoSala([usuario], 1, usuario);
        if(priv){
            salasPriv.set(id_sala, valor);
        } else {
            salasPub.set(id_sala, valor);
        }
        return {code:0 , sala: id_sala};

    } catch (e){
        logger.error('Error al crear sala', e)
        return {code:1 , sala: ""};
    }


}

/**
 * Función para que un jugador se pueda unir a una sala
 * @param {string} id_sala Identificador de la sala
 * @param {string} usuario Usuario a añadir a la sala
 */
async function unirseSala(id_sala, usuario){
    try{
        let value = undefined;
        if(salasPriv.has(id_sala)){
            value = salasPriv.get(id_sala);
            if(value === undefined){
                return {code:1 , sala: id_sala};
            } else {
                return await value.mutex.runExclusive(async () => {
                    if(value.nJugadores < config.MAX_JUGADORES &&
                        addUser(usuario, id_sala) === 0) {

                        value.nJugadores++;
                        value.jugadores.push(usuario);
                        //console.log(value.jugadores)
                        return {code:0 , sala: id_sala};
                    } else {
                        return {code:1 , sala: id_sala};
                    }
                });

            }
        } else if (salasPub.has(id_sala)){
            value = salasPub.get(id_sala);
            if(value === undefined){
                return {code:1 , sala: id_sala};
            } else {
                return await value.mutex.runExclusive(async () => {
                    if(value.nJugadores < 6) {
                        value.nJugadores++;
                        value.jugadores.push(usuario);
                        //console.log(value.jugadores)
                        return {code:0 , sala: id_sala};
                    } else {
                        return {code:1 , sala: id_sala};
                    }
                });
            }
        } else {
            return {code:1 , sala: id_sala};
        }
    } catch (e){
        logger.error('Error al unirse a la sala', e);
        return {code:1 , sala: id_sala};
    }

}

/**
 * Función para unirse a una sala pública alearoria
 *
 * @param usuario Usuario al que meter en una sala pública
 */
async function buscarPartida(usuario){
    try {
        const ids = salasPub.keys();
        let index = ~~(Math.random() * ids.length);
        for(let i = 0; i<ids.length ; i++){
            const res = await unirseSala(ids[index], usuario);
            if( res.code === 0){
                return res;
            }
            index = (index + 1) % ids.length;
        }
        return crearSala(usuario, false);
    } catch (e) {
        logger.error('Error al buscar partida', e)
        return {code:1 , sala: ""};
    }
}

/**
 * Función para obtener todos los jugadores de una sala
 *
 * @param id_sala Id de la sala
 * @returns {{code: number, jugadores: []}|{code: number, jugadores: ([]|*)}}
 */
function obtenerJugadores(id_sala){
    try{
        let value = undefined;
        if(salasPriv.has(id_sala)){
            value = salasPriv.get(id_sala);
            if(value === undefined){
                return {code:1 , jugadores: []};
            } else {
                return {code:0 , jugadores: value.jugadores};
            }
        } else if (salasPub.has(id_sala)){
            value = salasPub.get(id_sala);
            if(value === undefined){
                return {code:1 , jugadores: []};
            } else {
                return {code:0 , jugadores: value.jugadores};
            }
        } else {
            return {code:1 , jugadores: []};
        }
    } catch (e){
        logger.error('Error al obtener jugadores de la sala', e);
        return {code:1 , jugadores: []};
    }
}

/**
 * Función para obandonar la sala o echar a un jugador de ella
 * @param {string} id_sala Identificador de la sala
 * @param {string} usuario Usuario a echar de la sala
 * @returns {Promise<{code: number, nuevoLider: string}|{code: number, nuevoLider: NodoJugador|string|*}|{code: number, nuevoLider: string}|{code: number, nuevoLider: string}|{code: number, nuevoLider: string}>}
 */
async function abandonarSala(id_sala, usuario){
    try{
        let value = undefined;
        if(salasPriv.has(id_sala)){
            value = salasPriv.get(id_sala);
            if(value === undefined){
                return {code: 1, nuevoLider: ''};
            } else {
                if(value.lider === usuario){
                    let res = await borrarSala(id_sala);
                    return {code: res, nuevoLider: ''};
                } else {
                    return await value.mutex.runExclusive(async () => {

                        let index = -1;
                        for (let i = 0; i < value.jugadores.length && index < 0; i++) {
                            if (value.jugadores[i] === usuario) {
                                index = i;
                            }
                        }
                        if (index >= 0 && value.nJugadores > 1 && value.jugadores[index] === usuario) {
                            value.jugadores.splice(index, 1);
                            value.nJugadores--;
                            value.lider = value.jugadores[0];
                            deleteUser(usuario);
                            return {code: 0, nuevoLider: value.jugadores[0]};

                        } else if(index >= 0 && value.nJugadores > 1){
                            value.jugadores.splice(index, 1);
                            value.nJugadores--;
                            deleteUser(usuario)
                            return {code: 0, nuevoLider: ''};

                        } else if(index >= 0 && value.nJugadores <= 1) {
                            deleteUser(usuario)
                            value.mutex.cancel();
                            salasPriv.del(id_sala);
                            return {code: 0, nuevoLider: ''};

                        } else{
                            return {code: 1, nuevoLider: ''};
                        }
                    });
                }
            }
        } else if (salasPub.has(id_sala)){
            value = salasPub.get(id_sala);
            if(value === undefined){
                return {code: 1, nuevoLider: ''};
            } else {
                //console.log(value.jugadores)
                if(value.lider === usuario){
                    let res = await borrarSala(id_sala);
                    return {code: res, nuevoLider: ''};
                } else {
                    return await value.mutex.runExclusive(async () => {
                        let index = -1;
                        for (let i = 0; i < value.jugadores.length && index < 0; i++) {
                            if (value.jugadores[i] === usuario) {
                                index = i;
                            }
                        }
                        if (index >= 0 && value.nJugadores > 1 && value.jugadores[index] === usuario) {
                            value.jugadores.splice(index, 1);
                            value.nJugadores--;
                            value.lider = value.jugadores[0];
                            deleteUser(usuario)
                            return {code: 0, nuevoLider: value.jugadores[0]};

                        } else if(index >= 0 && value.nJugadores > 1){
                            value.jugadores.splice(index, 1);
                            value.nJugadores--;
                            deleteUser(usuario)
                            return {code: 0, nuevoLider: ''};

                        } else if(index >= 0 && value.nJugadores <= 1) {
                            deleteUser(usuario)
                            value.mutex.cancel();
                            salasPub.del(id_sala);
                            return {code: 0, nuevoLider: ''};

                        } else{
                            return {code: 1, nuevoLider: ''};
                        }
                    });
                }
            }
        } else {
            return {code: 1, nuevoLider: ''};
        }
    } catch (e) {
        logger.error('Error al abandonar sala', e)
        return {code: 1, nuevoLider: ''};
    }
}

/**
 * Pre: la peticion solo la puede hacer el lider de la sala
 * Función para borrar una sala de la memoria caché
 * @param id_sala Identificador de la sala
 */
async function borrarSala(id_sala){
    try{
        let value = undefined;
        if(salasPriv.has(id_sala)){
            value = salasPriv.get(id_sala);
            if(value === undefined){
                return 0;
            } else {
                const release = await value.mutex.acquire();
                try {
                    value.jugadores.forEach(usuario => deleteUser(usuario));
                    value.mutex.cancel();
                    salasPriv.del(id_sala);
                } finally{
                    release();
                    if(!salasPriv.has(id_sala)) {
                        return 0;
                    } else{
                        return 1;
                    }
                }

            }
        } else if(salasPub.has(id_sala)){
            value = salasPub.get(id_sala);
            if(value === undefined){
                return 0;
            } else {
                const release = await value.mutex.acquire();
                try {
                    value.jugadores.forEach(usuario => deleteUser(usuario));
                    value.mutex.cancel();
                    salasPub.del(id_sala);
                } finally{
                    release();
                    if(!salasPub.has(id_sala)) {
                        return 0;
                    } else{
                        return 1;
                    }
                }

            }
        } else {
            return 1;
        }
    } catch (e) {
        if (!salasPriv.has(id_sala) && !salasPub.has(id_sala)) {
            logger.error('Error al borrar sala', e);
            return 1;
        }
    }
}

/**
 * Función para comenzar la partida con los jugadores presentes en la sala.
 * Borra la sala de caché y crea la partida en la caché correspondiente.
 * @param id_sala
 */
async function comenzarPartida(id_sala){
    try {
        const sala = salasPub.has(id_sala) ? salasPub.get(id_sala) : salasPriv.get(id_sala);
        if (sala){
            return await sala.mutex.runExclusive(async () => {
                if(sala.nJugadores < config.MIN_JUGADORES){
                    logger.error('Error al comenzar partida, no hay jugadores suficientes');
                    return {code: 3, info: ""+sala.nJugadores};
                }
                let jugadores = []
                sala.jugadores.forEach(function(jugador, index, array){
                    jugadores.push( new NodoJugador(jugador, 0, [], config.MAX_QUESITOS));
                })
                const partida = new NodoJuego(sala.jugadores[Math.random() * sala.nJugadores], jugadores, sala.nJugadores);
                salasJuego.set(id_sala, partida);
                sala.mutex.cancel();
                if(salasPub.has(id_sala)){
                    salasPub.del(id_sala);
                }else{
                    salasPriv.del(id_sala);
                }
                return {code: 0, info: partida.turno};

            });
        }else{
            logger.error('Error al comenzar partida, no existe la partida');
            return {code: 2, info: "No existe"};
        }
    } catch(e) {
        logger.error('Error al comenzar partida', e);
        return {code: 1, info: "Error desconocido"};
    }
}

/**
 * Función para actualizar la casilla de un jugador en su turno
 * @param {string} id_partida
 * @param {string} jugador
 * @param {number[]} casilla Nuevas posiciones del jugador
 */
function actualizarCasilla(id_partida, jugador, casilla){
    try{
        let value = salasJuego.get(id_partida);
        if(value !== undefined){
            if(value.turno === jugador){
                let actualizado = false;
                for(let i = 0; i<value.jugadores.length && !actualizado; i++){
                    if(value.jugadores[i].nombre === jugador){
                        value.jugadores[i].casilla = casilla;
                        actualizado = true;
                    }
                }
                return actualizado ? 0 : 1;
            } else {
                logger.error('Error al actualizar casilla, no es el turno del jugador');
                return 2;
            }
        } else {
            logger.error('Error al actualizar casilla, no existe la sala');
            return 1;
        }
    } catch (e) {
        logger.error('Error al actualizar casilla', e);
        return 1;
    }
}

/**
 * Función para añadir el quesito conseguido a un jugador en su turno
 * @param id_partida Identificador de la partida
 * @param jugador Jugador que va a ser premiado con el quesito (hace referencia al índice del vector)
 * @param quesito Tipo de quesito que se le va a asignar al jugador en cuestión
 */
function anyadirQuesito(id_partida, jugador, quesito){
    try{
        let value = salasJuego.get(id_partida);
        if(value !== undefined){
            if(value.turno === jugador){
                let actualizado = false;
                for(let i = 0; i < value.jugadores.lenght && !actualizado; i++) {
                    if(value.jugadores[i].nombre === jugador) {
                        value.jugadores[i].quesitos.push(quesito);
                        value.jugadores[i].nRestantes--;
                        actualizado = true;
                    }
                }
                if(actualizado === true){
                    return 0;
                }else{
                    logger.error("Error al anyadir quesito, jugador no encontrado");
                    return 3;
                }
            }else{
                logger.error("Error al anyadir quesito, no es el turno del jugador");
                return 2;
            }
        }else{
            logger.error("Error al anyadir quesito, no existe la sala en juego");
            return 1;
        }
    }catch(e){
        logger.error("Error al anyadir quesito", e);
        return 1;
    }
}

/**
 * Cambia el turno al siguiente jugador
 * @param id_partida Identificador de la partida
 * @param jugador Jugador que solicita el paso de turno o al cual se le pasa el tiempo (hace referencia al índice del vector)
 */
function cambiarTurno(id_partida, jugador){
    try{
        let value = salasJuego.get(id_partida);
        if(value !== undefined){
            if(value.turno === jugador){
                let actualizado = false;
                for(let i = 0; i < value.jugadores.lenght && !actualizado; i++) {
                    if(value.jugadores[i].nombre === jugador) {
                        value.turno = value.jugadores[(i+1) % value.jugadores.lenght].nombre;
                        actualizado = true;
                    }
                }
                if(actualizado === true){
                    return 0;
                }else{
                    logger.error("Error al cambiar turno, jugador no encontrado");
                    return 3;
                }
            }else{
                logger.error("Error al cambiar turno, no es el turno del jugador");
                return 2;
            }
        }else{
            logger.error("Error al cambiar turno, no existe la sala en juego");
            return 1;
        }
    }catch(e){
        logger.error("Error al cambiar turno", e);
        return 1;
    }
}

/**
 * Función para que un usuario abandone la partida
 * @param id_partida Identificador de la partida a borrar
 * @param jugador
 */
function abandonarPartida(id_partida, jugador){
    try{
        let value = salasJuego.get(id_partida);
        if(value !== undefined){
            const data = value.jugadores.findIndex(t => t.nombre===jugador);
            if(data !== -1){ // Está en la lista
                value.jugadores.splice(data, 1); // Elimina al usuario
                if(value.turno === jugador) { //Era su turno

                }
            }else{//No está en la lista
                logger.error('Error al abandonar partida, no está el jugador');
                return 2;
            }

            if(value.turno === jugador){ // Si era su turno, lo actualiza
                let actualizado = false;
                for(let i = 0; i<value.jugadores.length && !actualizado; i++){
                    if(value.jugadores[i].nombre === jugador){
                        value.jugadores[i].casilla = casilla;
                        actualizado = true;
                    }
                }
                return actualizado ? 0 : 1;
            } else {
                logger.error('Error al abandonar partida, no es el turno del jugador');
                return 2;
            }
        } else {
            logger.error('Error al abandonar partida, no existe la sala');
            return 1;
        }
    } catch (e) {
        logger.error('Error al abandonar partida', e);
        return 1;
    }
}

/**
 * Función para borrar una partida de la memoria caché
 * @param id_partida
 */
function borrarPartida(id_partida){
    try{
        salasJuego.del(id_partida);
    } catch (e) {
        logger.error('Error al borrarPartida',e);
    } finally {
        if(!salasJuego.has(id_partida)) {
            return 0;
        } else {
            return 1;
        }
    }
}


module.exports =
    {
        crear,
        obtenerJugadores,
        salaDelUsuario,
        crearSala,
        unirseSala,
        buscarPartida,
        abandonarSala,
        borrarSala,
        comenzarPartida,
        actualizarCasilla,
        anyadirQuesito,
        cambiarTurno,
        abandonarPartida,
        borrarPartida,
        stop
    };
