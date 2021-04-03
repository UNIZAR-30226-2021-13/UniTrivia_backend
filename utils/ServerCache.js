const logger = require('../logger');
const NodeCache = require('node-cache');
const Mutex = require('async-mutex').Mutex;

let salasPub = null;
let salasPriv = null;
let salasJuego = null;

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
    /**
     * Constructor
     *
     * @param {number} turno Id del vector de jugadores del usuario que tiene el turno
     * @param {NodoJugador[]} jugadores Array con la información de la partida de cada jugador
     * @param {number} nJugadores Número de componentes del array jugadores
     */
    constructor(turno, jugadores, nJugadores){
        this.turno = turno;
        this.jugadores = jugadores;
        this.nJugadores = nJugadores;
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
        salasPub = new NodeCache({maxKeys: 100});
        salasPriv = new NodeCache({maxKeys: 20});
        salasJuego = new NodeCache({stdTTL: 72000});

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
 * Función para crear una sala con el líder de la sala
 * @param {string} usuario Usuario líder de la sala
 * @param {boolean} priv True si la sala es privada y false en caso contrario
 */
function crearSala(usuario, priv){
    try{
        let id_sala = randString(5);
        let valor = NodoSala([usuario], 1, usuario);
        if(priv){
            salasPriv.set(id_sala, valor);
        } else {
            salasPub.set(id_sala, valor);
        }
        return 0;

    } catch (e){
        logger.error('Error al crear sala', e)
        return 1;
    }


}

/**
 * Función para que un jugador se pueda unir a una sala
 * @param {string} id_sala Identificador de la sala
 * @param {string} usuario Usuario a añadir a la sala
 * @param {boolean} priv True si la sala es privada y false en caso contrario
 */
async function unirseSala(id_sala, usuario, priv){
    try{
        let value = salasPriv.get(id_sala);
        if(priv){
            if(value === undefined){
                return 1;
            } else {
                return await value.mutex.runExclusive(async () => {
                    if(value.nJugadores < 6) {
                        value.nJugadores++;
                        value.jugadores.push(usuario);
                        return 0;
                    } else {
                        return 1;
                    }
                });

            }
        } else {
            value = salasPub.get(id_sala);
            if(value === undefined){
                return 1;
            } else {
                return await value.mutex.runExclusive(async () => {
                    if(value.nJugadores < 6) {
                        value.nJugadores++;
                        value.jugadores.push(usuario);
                        return 0;
                    } else {
                        return 1;
                    }
                });
            }
        }
    } catch (e){
        logger.error('Error al unirse a la sala', e);
        return 1;
    }

}

/**
 * Función para unirse a una sala pública alearoria
 * @param usuario Usuario al que meter en una sala pública
 */
async function buscarPartida(usuario){
    try {
        const ids = salasPub.keys();
        let index = ~~(Math.random() * ids.length);
        for(let i = 0; i<ids.length ; i++){
            if((await unirseSala(ids[index], usuario, false)) === 0){
                return 0;
            }
            index = (index + 1) % ids.length;
        }
        return 1;
    } catch (e) {
        logger.error('Error al buscar partida', e)
        return 1;
    }
}

/**
 * Función para obandonar la sala o echar a un jugador de ella
 * @param {string} id_sala Identificador de la sala
 * @param {string} usuario Usuario a echar de la sala
 * @param {boolean} priv True si la sala es privada y false en caso contrario
 */
async function abandonarSala(id_sala, usuario, priv){
    try{
        let value = undefined;
        if(priv){
            value = salasPriv.get(id_sala);
            if(value === undefined){
                return 1;
            } else {
                if(value.lider === usuario){
                    return borrarSala(id_sala);
                } else {
                    return await value.mutex.runExclusive(async () => {
                        value.nJugadores--;
                        let index = -1;
                        for (let i = 0; i < value.jugadores.length && index < 0; i++) {
                            if (value.jugadores[i] === usuario) {
                                index = i;
                            }
                        }
                        if (index >= 0) {
                            value.jugadores.splice(index, 1);
                            return 0;
                        } else {
                            return 1;
                        }
                    });
                }
            }
        } else {
            value = salasPub.get(id_sala);
            if(value === undefined){
                return 1;
            } else {
                if(value.lider === usuario){
                    return borrarSala(id_sala);
                } else {
                    return await value.mutex.runExclusive(async () => {
                        value.nJugadores--;
                        let index = -1;
                        for (let i = 0; i < value.jugadores.length && index < 0; i++) {
                            if (value.jugadores[i] === usuario) {
                                index = i;
                            }
                        }
                        if (index >= 0) {
                            value.jugadores.splice(index, 1);
                            return 0;
                        } else {
                            return 1;
                        }
                    });
                }
            }
        }
    } catch (e) {
        logger.error('Error al abandonar sala', e)
    }
}

/**
 * Pre: la peticion solo la puede hacer el lider de la sala
 * Función para borrar una sala de la memoria caché
 * @param id_sala Identificador de la sala
 * @param {boolean} priv True si la sala es privada y false en caso contrario
 */
async function borrarSala(id_sala, priv){
    try{
        let value = undefined;
        if(priv){
            value = salasPriv.get(id_sala);
            if(value === undefined){
                return 0;
            } else {
                const release = await value.mutex.acquire();
                try {
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
        } else{
            value = salasPub.get(id_sala);
            if(value === undefined){
                return 0;
            } else {
                const release = await value.mutex.acquire();
                try {
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
        }
    } catch (e) {
        if (!salasPriv.has(id_sala) && !salasPub.has(id_sala)) {
            logger.error('Error al borrar sala', e);
            return 1;
        }
    }
}

/**
 * Función para comenzar la partida con los jugadores presentes en la sala
 * @param id_sala
 */
function comenzarPartida(id_sala){

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
 * @param id_partida
 * @param jugador
 * @param quesito
 */
function anyadirQuesito(id_partida, jugador, quesito){

}

/**
 * Cambia el turno al siguiente jugador
 * @param id_partida
 * @param jugador
 */
function cambiarTurno(id_partida, jugador){

}

/**
 * Función para que un usuario abandone la partida
 * @param id_partida Identificador de la partida a borrar
 */
function abandonarPartida(id_partida){

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