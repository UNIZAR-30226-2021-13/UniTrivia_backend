const logger = require('../logger');
const NodeCache = require('node-cache');
const Mutex = require('async-mutex').Mutex;
const config = require('../config')
const Tablero = require('./Tablero')
const Preguntas = require('../model/Preguntas')

let salasPub = null; //NodeCache con las salas publicas pendientes de empezar
let salasPriv = null; //NodeCache con las salas privadas pendientes de empezar
let salasJuego = null; //NodeCache con las salas en las que actualmente se está jugando
let usuariosEnSala = null; //NodeCache con los usuarios y las salas en las que están
let tablero = null;

class NodoJugador{
    get nombre() {
        return this._nombre;
    }

    set nombre(value) {
        this._nombre = value;
    }

    get casilla() {
        return this._casilla;
    }

    set casilla(value) {
        this._casilla = value;
    }

    get quesitos() {
        return this._quesitos;
    }

    set quesitos(value) {
        this._quesitos = value;
    }

    get nRestantes() {
        return this._nRestantes;
    }

    set nRestantes(value) {
        this._nRestantes = value;
    }

    get conectado(){
        return this._conectado;
    }

    set conectado(value){
        this._conectado = value;
    }
    /**
     * Constructor
     *
     * @param {string} nombre Nombre del usuario
     * @param {number[]} casilla Posición x (componente 0) e y del jugador
     * @param {string[]} quesitos Array con los colores de los quesitos que tiene
     * @param {number} nRestantes Número de quesitos restantes para el jugador
     */
    constructor(nombre, casilla, quesitos, nRestantes){
        this._nombre = nombre;
        this._casilla = casilla;
        this._quesitos = quesitos;
        this._nRestantes = nRestantes;
        this._conectado = true;
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
        this.mutex = new Mutex();
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
        tablero = new Tablero();

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
 * @returns {{code: number, sala: string}}
 */
function salaDelUsuario(usuario){
    try {
        return usuariosEnSala.has(usuario) ? {code: 0, sala: usuariosEnSala.get(usuario) }
                : {code: 0, sala: '' };

    } catch(err){
        logger.error("Error al obtener sala del usuario ", err);
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
        addUser(usuario, id_sala);
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
        if(salasPriv.has(id_sala)) {
            value = salasPriv.get(id_sala);
        }else if(salasPub.has(id_sala)){
            value = salasPub.get(id_sala);
        } else {
            return {code:1 , jugadores: []};
        }

        if(value === undefined){
            return {code:1 , jugadores: []};
        } else {
            return {code:0 , jugadores: value.jugadores};
        }
    } catch (e){
        logger.error('Error al obtener jugadores de la sala', e);
        return {code:1 , jugadores: []};
    }
}

/**
 *
 * @param id_sala
 * @returns {{code: number, jugadores: *[]}}
 */
function estadoPartida(id_sala){
    try{
        const value = salasJuego.get(id_sala);
        if(value){
            let jugadores = [];
            value.jugadores.forEach( (jugador, _) => {
                jugadores.push({
                    usuario: jugador.nombre,
                    casilla: jugador.casilla,
                    quesitos: jugador.quesitos
                });
            });

            return {code: 0, jugadores: jugadores}
        }else{
            return {code:1 , jugadores: []};
        }
    }catch (e){
        return {code: 1, jugadores: []};
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
                console.log('abandonarSala.priv.NoExisteSala');
                return {code: 1, nuevoLider: ''};
            } else {
                return await value.mutex.runExclusive(async () => {

                    const index = value.jugadores.indexOf(usuario);
                    console.log('abandonarSala.priv.index = ' + index);
                    if (index >= 0 && value.nJugadores > 1 ) {
                        value.jugadores.splice(index, 1);
                        value.nJugadores--;
                        deleteUser(usuario);
                        if(usuario === value.lider){
                            value.lider = value.jugadores[0];
                            console.log('abandonarSala.priv.nuevoLider = ' + value.lider);
                            return {code: 0, nuevoLider: value.jugadores[0]};
                        }else{
                            console.log('abandonarSala.priv.noNuevoLider');
                            return {code: 0, nuevoLider: ''};
                        }
                    } else if(index >= 0 && value.nJugadores <= 1) {
                        console.log('abandonarSala.priv.DestruirSala');
                        deleteUser(usuario)
                        value.mutex.cancel();
                        salasPriv.del(id_sala);
                        return {code: 0, nuevoLider: ''};

                    } else{
                        console.log('abandonarSala.priv.NoEstaElUsuario');
                        return {code: 1, nuevoLider: ''};
                    }
                });
            }
        } else if (salasPub.has(id_sala)){
            value = salasPub.get(id_sala);
            if(value === undefined){
                console.log('abandonarSala.pub.NoExisteSala');
                return {code: 1, nuevoLider: ''};
            } else {
                return await value.mutex.runExclusive(async () => {
                    const index = value.jugadores.indexOf(usuario);
                    console.log('abandonarSala.pub.index = ' + index);
                    if (index >= 0 && value.nJugadores > 1 ) {
                        value.jugadores.splice(index, 1);
                        value.nJugadores--;
                        deleteUser(usuario)
                        if(usuario === value.lider) {
                            value.lider = value.jugadores[0];
                            console.log('abandonarSala.pub.nuevoLider = ' + value.lider);
                            return {code: 0, nuevoLider: value.jugadores[0]};
                        }else{
                            console.log('abandonarSala.pub.noNuevoLider');
                            return {code: 0, nuevoLider: ''};
                        }
                    } else if(index >= 0 && value.nJugadores <= 1) {
                        deleteUser(usuario)
                        value.mutex.cancel();
                        salasPub.del(id_sala);
                        console.log('abandonarSala.pub.DestruirSala');
                        return {code: 0, nuevoLider: ''};

                    } else{
                        console.log('abandonarSala.pub.NoEstaElUsuario');
                        return {code: 1, nuevoLider: ''};
                    }
                });
            }
        } else {
            console.log('abandonarSala.NoExisteSala');
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
 * De vuelve el lider de la sala en caso de que exista,
 * si no devuelve undefined.
 *
 * @param id_sala Identificador de la sala
 * @returns {string|undefined} Identificador del lider de la sala
 */
function liderDeSala(id_sala){
    try{
        const sala = salasPub.has(id_sala) ? salasPub.get(id_sala) : salasPriv.get(id_sala);
        if(sala){
            return sala.lider;
        }else{
            return undefined;
        }
    }catch (e){
        return undefined;
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
                console.log(sala.jugadores)
                console.log(sala.nJugadores)
                if(sala.nJugadores < config.MIN_JUGADORES){
                    logger.error('Error al comenzar partida, no hay jugadores suficientes');
                    return {code: 3, info: ""+sala.nJugadores};
                }
                let jugadores = []
                sala.jugadores.forEach(function(jugador, index, array){
                    jugadores.push( new NodoJugador(jugador, 0, [], config.MAX_QUESITOS));
                })
                const partida = new NodoJuego(sala.jugadores[~~(Math.random() * sala.nJugadores)], jugadores, sala.nJugadores);
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
 *
 * @param id_partida
 * @param jugador
 * @param nuevaCasilla
 * @param nuevoQuesito
 * @param finTurno
 * @returns {Promise<number>}
 */
async function nuevaJugada(id_partida, jugador, nuevaCasilla, nuevoQuesito, finTurno){
    try{
        let value = salasJuego.get(id_partida);
        if(value !== undefined){
            if(value.turno !== jugador){
                let index = value.jugadores.findIndex(t => t.nombre===jugador);
                if(index !== -1){
                    return await value.mutex.runExclusive(()=>{
                        let res = 1;
                        if(nuevaCasilla !== "") {
                            value.jugadores[index].casilla = nuevaCasilla;
                        }
                        if(nuevoQuesito !== "" && !nuevoQuesito in value.jugadores[index].quesitos) {
                            value.jugadores[index].quesitos.push(nuevoQuesito);
                            value.jugadores[index].nRestantes--;
                        }
                        if(finTurno && value.jugadores[index].nRestantes > 0) {
                            let i = 1
                            while (!value.jugadores[(index + i) % value.nJugadores].conectado) {
                                i++;
                            }
                            value.turno = value.jugadores[(index + i) % value.nJugadores].nombre;
                            res = 0;
                        }else if(value.jugadores[index].nRestantes === 0){
                            borrarPartida(id_partida);
                        }
                        return res;
                    })
                }else{
                    return 2
                }
            }else{
                return 3;
            }
        }else{
            return 4;
        }
    }catch (e) {
        logger.error('Error al actualizar jugada', e);
        return 5;
    }
}

/**
 *
 * @param id_partida
 * @param jugador
 * @returns {undefined|integer}
 */
function obtenerQuesitosRestantes(id_partida, jugador){
    try{
        const value = salasJuego.get(id_partida);
        if(value !== undefined){
            const data = value.jugadores.findIndex(t => t.nombre===jugador);
            return value.jugadores[data].nRestantes;
        }else{
            return undefined;
        }
    }catch (e) {
        return undefined;
    }
}

/**
 * Dado el id de un usuario y la partida,
 * te devuelve la casilla en la que está.
 *
 * @param id_partida
 * @param usuario
 * @returns {undefined|integer}
 */
function obtenerPosicion(id_partida, usuario){
    try{
        const value = salasJuego.get(id_partida);
        if(value !== undefined){
            const data = value.jugadores.findIndex(t => t.nombre===jugador);
            return value.jugadores[data].casilla;
        }else{
            return undefined;
        }
    }catch (e) {
        return undefined;
    }
}

/**
 *
 * @param id_partida
 * @returns {undefined|string}
 */
function obtenerTurno(id_partida){
    try{
        const value = salasJuego.get(id_partida);
        if(value !== undefined){
            return value.turno;
        }else{
            return undefined;
        }
    }catch (e) {
        return undefined;
    }
}

/**
 * Función para que un usuario abandone la partida
 * @param id_partida Identificador de la partida a borrar
 * @param jugador
 * @returns {Promise<number>}
 */
async function abandonarPartida(id_partida, jugador){ //TODO Falta implementar que pueda volver el usuario
    try{
        let value = salasJuego.get(id_partida);
        if(value !== undefined){
            const data = value.jugadores.findIndex(t => t.nombre===jugador);
            if(data !== -1){ // Está en la lista
                return await value.mutex.runExclusive(()=>{
                    let ret = 1, i = 1;
                    if(value.turno === jugador) { //Era su turno
                        while(!value.jugadores[(data+i)%value.nJugadores].conectado){
                            i++;
                        }
                        value.turno = value.jugadores[(data+i)%value.nJugadores].nombre;
                        ret = 0;
                    }
                    //value.jugadores.splice(data, 1); // Elimina al usuario
                    value.jugadores[data].conectado = false;
                    if(value.jugadores.every(elem => !elem.conectado)){
                        borrarPartida(id_partida);
                    }
                    return ret; //Si cambia de turno valdrá 0, si no 1.
                });
            }else{//No está en la lista
                logger.error('Error al abandonar partida, no está el jugador');
                return 2;
            }
        } else {
            logger.error('Error al abandonar partida, no existe la sala');
            return 3;
        }
    } catch (e) {
        logger.error('Error al abandonar partida', e);
        return 4;
    }
}

async function reconexionJugador(id_partida, usuario){
    try{
        let value = salasJuego.get(id_partida);
        if(value === undefined){
            logger.error('Error al reconectarse, no existe la sala.');
            return 1;
        }
        const index = value.jugadores.findIndex(t => t.nombre===usuario);
        if(index === -1){
            logger.error('Error al reconectarse, no está el usuario.');
            return 2;
        }

        return await value.mutex.runExclusive(()=>{
            value.jugadores[index].conectado = true;
            return 0;
        })

    }catch (e){
        logger.error('Error al reconectarse un jugador. ', e);
        return 3;
    }
}

/**
 * Función para borrar una partida de la memoria caché
 * @param id_partida
 */
function borrarPartida(id_partida){
    try{
        const value = salasJuego.take(id_partida);
        value.jugadores.forEach(j => usuariosEnSala.del(j.nombre));
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

/**
 * Recupera las siguientes casillas a poder visitar y una pregunta asociada a cada casilla
 *
 * @param id_partida
 * @param jugador
 * @param actual
 * @param dado
 * @returns {Promise<{res: null, code: number}|{res: [], code: number}>}
 */
async function getPosiblesJugadas(id_partida, jugador, actual, dado){
    try {
        let value = salasJuego.get(id_partida);
        if (value !== undefined) {
            const data = value.jugadores.findIndex(t => t.nombre === jugador);

            if (data !== -1) { // Está en la lista
                let movs = tablero.getPosiblesMovimientos(actual, dado, data);
                if (movs === null) return {code: 3, res: null};

                let resultado = [];
                for(let i = 0; i < movs.length; i++) {
                    let res = await Preguntas.recuperarPregunta(movs[i].categoria)
                    if (res.code === 0) {
                        resultado.push({
                            casilla: movs[i],
                            pregunta: res.preg
                        });
                    } else {
                        return {code: 4, res: null}
                    }
                }

                return {code: 0, res: resultado};

            } else{
                return {code: 2, res: null};
            }
        }
    } catch (e) {
        logger.error('Error al conseguirJugadas',e);
        return {code: 1, res: null};
    }
}


module.exports =
    {
        crear,
        obtenerJugadores,
        estadoPartida,
        salaDelUsuario,
        crearSala,
        unirseSala,
        buscarPartida,
        abandonarSala,
        borrarSala,
        liderDeSala,
        comenzarPartida,
        nuevaJugada,
        obtenerQuesitosRestantes,
        obtenerPosicion,
        obtenerTurno,
        abandonarPartida,
        reconexionJugador,
        borrarPartida,
        getPosiblesJugadas,
        stop
    };
