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
     */
    constructor(jugadores, nJugadores){
        this.jugadores = jugadores;
        this.nJugadores = nJugadores;
        this.mutex = new Mutex();
    }
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
 * @param usuario
 */
function crearSala(usuario){

}

/**
 * Función para que un jugador se pueda unir a una sala
 * @param id_sala
 * @param usuario
 */
function unirseSala(id_sala, usuario){

}

/**
 * Función para unirse a una sala pública alearoria
 * @param usuario
 */
function buscarPartida(usuario){

}

/**
 * Función para obandonar la sala o echar a un jugador de ella
 * @param id_sala
 * @param usuario
 */
function abandonarSala(id_sala, usuario){

}

/**
 * Función para borrar una sala de la memoria caché
 * @param id_sala
 */
function borrarSala(id_sala){

}

/**
 * Función para comenzar la partida con los jugadores presentes en la sala
 * @param id_sala
 */
function comenzarPartida(id_sala){

}

/**
 * Función para actualizar la casilla de un jugador
 * @param id_partida
 * @param jugador
 * @param casilla
 */
function actualizarCasilla(id_partida, jugador, casilla){

}

/**
 * Función para añadir el quesito conseguido a un jugador
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
 * @param id_partida
 */
function abandonarPartida(id_partida){

}

/**
 * Función para borrar una partida de la memoria caché
 * @param id_partida
 */
function borrarPartida(id_partida){

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