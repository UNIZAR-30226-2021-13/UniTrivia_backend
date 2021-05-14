const logger = require('../logger');
const cache = require('../utils/ServerCache');
const Tablero = require('../utils/Tablero');
const config = require('../config');


/**
 * Pre: la memoria cache ya ha sido inicializada previamente
 * Test de las salas memoria cache del servidor.
 * Devuelve 1 si ha habido algún error y 0 en caso contrario
 */
async function testSalas(){
    try{
        let usuario1 = 'test1';
        let usuario2 = 'test2';
        let usuario3 = 'test3';
        let usuario4 = 'test4';
        let usuario5 = 'test5';
        let usuario6 = 'test6';


        const res1 = await cache.buscarPartida(usuario1)
        if(res1.code !== 0){
            logger.error('Error test salas: 1')
            return 1;
        }
        const res2 = await cache.unirseSala(res1.sala, usuario2);
        if(res2.code !== 0){
            logger.error('Error test salas: 2')
            return 1;
        }

        const res3 = await cache.crearSala(usuario3, true);
        if(res3.code !== 0){
            logger.error('Error test salas: 3')
            return 1;
        }

        const res4 = await cache.unirseSala(res3.sala, usuario4);
        if(res4.code !== 0){
            logger.error('Error test salas: 4')
            return 1;
        }

        const res5 = await cache.crearSala(usuario5, true);
        if(res5.code !== 0){
            logger.error('Error test salas: 5')
            return 1;
        }

        const res6 = await cache.buscarPartida(usuario6);
        if(res6.code !== 0){
            logger.error('Error test salas: 6')
            return 1;
        }

        const res7 = await cache.abandonarSala(res6.sala, usuario6);
        if(res7.code !== 0){
            logger.error('Error test salas: 7')
            return 1;
        }

        if((await cache.borrarSala(res3.sala)) !== 0){
            logger.error('Error test salas: 8')
            return 1;
        }

        const res9 = await cache.comenzarPartida(res1.sala);
        if(res9.code !== 0){
            logger.error('Error test salas: 9')
            return 1;
        }

        const res10 = await cache.comenzarPartida(res5.sala);
        if(res10.code === 0){
            logger.error('Error test salas: 10')
            return 1;
        }

        if((await cache.borrarPartida(res1.sala)) !== 0){
            logger.error('Error test salas: 11')
            return 1;
        }
        return 0;

    } catch (e){
        logger.error('Error en el test salas: desconocido', e)
        return 1;
    }

}

async function testTablero(){
    try {
        const act1 = 777;
        const act2 = 63;
        const act3 = 53;

        let tablero = new Tablero();

        let res = tablero.getPosiblesMovimientos(act1, 6, 0);
        if (res == null || res.length !== 2|| res[0].num !== 2 || res[1].num !== 52) {
            logger.error('Error test tablero: 1')
            return 1;
        }

        res = tablero.getPosiblesMovimientos(act1, 2, 0);
        if (res == null || res.length !== 1 || res[0].num !== 62) {
            logger.error('Error test tablero: 2')
            return 1;
        }

        res = tablero.getPosiblesMovimientos(act2, 5, 0);
        if (res == null || res.length !== 2|| res[0].num !== 2 || res[1].num !== 52) {
            logger.error('Error test tablero: 3')
            return 1;
        }

        res = tablero.getPosiblesMovimientos(act2, 1, 0);
        if (res == null || res.length !== 1 || res[0].num !== 62) {
            logger.error('Error test tablero: 4')
            return 1;
        }

        res = tablero.getPosiblesMovimientos(act3, 3, 0);
        if (res == null || res.length !== 2 || res[0].num !== 2 || res[1].num !== 50) {
            logger.error('Error test tablero: 5')
            return 1;
        }

        if (tablero.getPosiblesMovimientos(114, 1, 0) !== null){
            logger.error('Error test tablero: 6')
            return 1;
        }

        if (tablero.getPosiblesMovimientos(-1, 1, 0) !== null){
            logger.error('Error test tablero: 7')
            return 1;
        }

        if (tablero.getPosiblesMovimientos(63, 1, 1) !== null){
            logger.error('Error test tablero: 8')
            return 1;
        }

        const res1 = await cache.crearSala("usuario1", false);
        await cache.unirseSala(res1.sala, "usuario2");
        await cache.comenzarPartida(res1.sala);


        res = await cache.getPosiblesJugadas(res1.sala, "usuario1", 777, 1);
        if(res.code !== 0){
            console.log(res.code)
            logger.error('Error test tablero: 9')
            return 1;
        }

        return 0;

    } catch (e) {
        logger.error('Error en el test tablero: desconocido', e)
        return 1;
    }
}

async function testPartidas(){
    const usuario1 = 'test1';
    const usuario2 = 'test2';
    const usuario3 = 'test3';

    const res_2 = await cache.crearSala(usuario1, true);
    if(res_2.code !== 0){
        logger.error('Error test partidas: Preparación crear sala');
        return 1;
    }
    const idSala = res_2.sala;

    const res_1 = await cache.unirseSala(idSala, usuario2);
    if(res_1.code !== 0){
        logger.error('Error test partidas: Preparación unirse sala');
        return 1;
    }

    const res_0 = await cache.comenzarPartida(idSala);
    if(res_0.code !== 0){
        logger.error('Error test partidas: Preparación empezar partida');
        return 1;
    }

    ////////////////////////////////////////
    //          TEST DE obtenerTurno
    //  Clase de equivalencia válida:
    //      1.- Existe la sala
    //
    //  Clase de equivalencia no válidas
    //      2.- No existe la sala
    //

    // Objetivo: 1
    let turno = cache.obtenerTurno(idSala);
    if(turno === undefined || !(turno === usuario1 || turno === usuario2)){
        logger.error('Error test partidas: 1. Turno no válido.');
        return 1;
    }

    // Objetivo: 2
    const res2 = cache.obtenerTurno(idSala+"___");
    //No es válido porque es más largo que el id y por tanto no existe una partida así
    if(res2 !== undefined){
        logger.error('Error test partidas: 2. Turno debería ser undefined.');
        return 1;
    }

    console.log("Tests obtenerTurno: ✅");

    ////////////////////////////////////////
    //          TEST DE obtenerPosicion
    //  Clase de equivalencia válida:
    //      1.- Existe la sala
    //      2.- Existe el usuario
    //
    //  Clases de equivalencia no válidas
    //      3.- No existe el usuario
    //      4.- No existe la sala
    //

    // Objetivo: 1,2
    const res3 = cache.obtenerPosicion(idSala, usuario1);
    if(res3 === undefined || res3 !== 777){
        logger.error('Error test partidas: 3. Posición debería ser 777.');
        return 1;
    }

    // Objetivo: 3
    const res4 = cache.obtenerPosicion(idSala, usuario3);
    if(res4 !== undefined){
        logger.error('Error test partidas: 4. Posición de usuario que no existe debe ser undefined.');
        return 1;
    }

    // Objetivo: 4
    const res5 = cache.obtenerPosicion(idSala+"___", usuario1);
    if(res5 !== undefined){
        logger.error('Error test partidas: 5. Posición en sala que no existe debe ser undefined.');
        return 1;
    }

    console.log("Tests obtenerPosicion: ✅");

    ////////////////////////////////////////////////////
    //          TEST DE obtenerQuesitosRestantes
    //  Clase de equivalencia válida:
    //      1.- Existe la sala
    //      2.- Existe el usuario
    //
    //  Clases de equivalencia no válidas
    //      3.- No existe el usuario
    //      4.- No existe la sala
    //

    // Objetivo: 1,2
    const res6 = cache.obtenerQuesitosRestantes(idSala, usuario1);
    if(res6 === undefined || res6 !== config.MAX_QUESITOS){
        logger.error('Error test partidas: 6. Quesito restantes debería ser ' + config.MAX_QUESITOS);
        return 1;
    }

    // Objetivo: 3
    const res7 = cache.obtenerQuesitosRestantes(idSala, usuario3);
    if(res7 !== undefined){
        logger.error('Error test partidas: 7. Quesito restantes de usuario que no existe debe ser undefined.');
        return 1;
    }

    // Objetivo: 4
    const res8 = cache.obtenerQuesitosRestantes(idSala+"___", usuario1);
    if(res8 !== undefined){
        logger.error('Error test partidas: 8. Quesito restantes en sala que no existe debe ser undefined.');
        return 1;
    }

    console.log("Tests obtenerQuesitosRestantes: ✅");

    ////////////////////////////////////////////////////
    //          TEST DE nuevaJugada
    //  Clases de equivalencia válidas:
    //      1.- Existe la sala
    //      2.- Es el turno del jugador
    //      3.- El jugador no avanza
    //      4.- El jugador avanza
    //      5.- El jugador consigue un quesito
    //      6.- El jugador no consigue un quesito
    //      7.- El jugador consigue el último quesito
    //      8.- Es el fin del turno
    //      9.- No es el fin del turno
    //
    //  Clases de equivalencia no válidas
    //      10.- No existe la sala
    //      11.- No existe el jugador
    //      12.- Existe el jugador pero no es su turno
    //      13.- Ya tenía el quesito
    //

    console.log("=== PRE-TEST DE nuevaJugada ===");
    console.log(require('util').inspect(await cache.estadoPartida(idSala), false, null, true ));

    //Objetivo: 10
    const res9 = await cache.nuevaJugada(idSala+"___", turno, 61, "", false);
    if(res9 !== 4){
        logger.error('Error test partidas: 9. nuevaJugada de sala inexistente debe devolver 4.');
        return 1;
    }

    console.log("=== PRE-TEST 10 DE nuevaJugada ===");
    console.log(require('util').inspect(await cache.estadoPartida(idSala), false, null, true ));

    //Objetivo: 11
    const res10 = await cache.nuevaJugada(idSala, usuario3, 61, "", false);
    if(res10 !== 2){
        logger.error('Error test partidas: 10. nuevaJugada de jugador inexistente debe devolver 2. Devuelve ' + res10);
        return 1;
    }

    console.log("=== PRE-TEST 11 DE nuevaJugada ===");
    console.log(require('util').inspect(await cache.estadoPartida(idSala), false, null, true ));

    //Objetivo: 12
    const res11 = await cache.nuevaJugada(idSala, turno === usuario1? usuario2 : usuario1, 61, "", false);
    if(res11 !== 3){
        logger.error('Error test partidas: 11. nuevaJugada de jugador que no es su turno debe devolver 3.');
        return 1;
    }

    console.log("=== PRE-TEST 12 DE nuevaJugada ===");
    console.log(require('util').inspect(await cache.estadoPartida(idSala), false, null, true ));

    //Objetivo: 1,2,3,6,9
    const test12numQuesitos = cache.obtenerQuesitosRestantes(idSala, turno);
    const res12 = await cache.nuevaJugada(idSala, turno, 777, "", false);
    if(res12 !== 1){
        logger.error('Error test partidas: 12. nuevaJugada correcta sin fin del turno debe devolver 1.');
        return 1;
    }
    if(turno !== cache.obtenerTurno(idSala)){
        logger.error('Error test partidas: 12. nuevaJugada correcta sin fin no debe cambiar el turno.');
        return 1;
    }
    if(test12numQuesitos !== cache.obtenerQuesitosRestantes(idSala, turno)){
        logger.error('Error test partidas: 12. nuevaJugada correcta sin nuevo quesito no debe añadir un quesito.');
        return 1;
    }

    console.log("=== PRE-TEST 13 DE nuevaJugada ===");
    console.log(require('util').inspect(await cache.estadoPartida(idSala), false, null, true ));


    //Objetivo: 1,2,4,5,8

    const test13numQuesitos = cache.obtenerQuesitosRestantes(idSala, turno);
    const test13estadoPartida = JSON.parse(JSON.stringify(await cache.estadoPartida(idSala)));

    console.log("=== PRE-TEST 13_2 DE nuevaJugada ===");
    console.log(require('util').inspect(await cache.estadoPartida(idSala), false, null, true ));

    const res13 = await cache.nuevaJugada(idSala, turno, 20, "azul", true);
    if(res13 !== 0){
        logger.error('Error test partidas: 13. nuevaJugada correcta con fin del turno debe devolver 0.');
        return 1;
    }
    if(turno === cache.obtenerTurno(idSala)){
        logger.error('Error test partidas: 13. nuevaJugada correcta con fin del turno debe cambiar el turno.');
        return 1;
    }
    if(test13numQuesitos === cache.obtenerQuesitosRestantes(idSala, turno)){
        logger.error('Error test partidas: 13. nuevaJugada correcta con nuevo quesito, debe añadir un quesito.');
        console.log("=== PRE-OPERACION ===");
        console.log(require('util').inspect(test13estadoPartida, false, null, true ));
        console.log("=== POST-OPERACION ===");
        console.log(require('util').inspect(await cache.estadoPartida(idSala), false, null, true ));
        return 1;
    }
    console.log("Test 13 nuevaJugada: ✅");

    //Objetivo: 13
    turno = cache.obtenerTurno(idSala);
    await cache.nuevaJugada(idSala, turno, 777, "", true); //Cambiar de turno
    turno = cache.obtenerTurno(idSala);
    const test14numQuesitos = cache.obtenerQuesitosRestantes(idSala, turno);
    const res14 = await cache.nuevaJugada(idSala, turno, 20, "azul", false);
    if(res14 !== 1){
        logger.error('Error test partidas: 14. nuevaJugada correcta sin fin del turno debe devolver 1.');
        return 1;
    }
    if(turno !== cache.obtenerTurno(idSala)){
        logger.error('Error test partidas: 14. nuevaJugada correcta sin fin no debe cambiar el turno.');
        return 1;
    }
    if(test14numQuesitos !== cache.obtenerQuesitosRestantes(idSala, turno)){
        logger.error('Error test partidas: 14. nuevaJugada correcta con quesito repetido no debe añadir un quesito.');
        return 1;
    }
    console.log("Test 14 nuevaJugada: ✅");

    //Objetivo: 1,2,4,7,8
    await cache.nuevaJugada(idSala, turno, 50, "amarillo", false);
    await cache.nuevaJugada(idSala, turno, 10, "naranja", false);
    await cache.nuevaJugada(idSala, turno, 40, "rosa", false);
    await cache.nuevaJugada(idSala, turno, 0, "morado", false);
    const res15 = await cache.nuevaJugada(idSala, turno, 30, "verde", true);
    if(res15 !== 1){
        logger.error('Error test partidas: 15. nuevaJugada correcta con fin del turno debe devolver 1. Devuelve ' + res15);
        return 1;
    }
    if(cache.obtenerQuesitosRestantes(idSala, turno) !== 0){
        logger.error('Error test partidas: 15. nuevaJugada correcta con último quesito debe añadir un quesito.');
        return 1;
    }
    if(cache.obtenerTurno(idSala) !== turno){
        logger.error('Error test partidas: 15. nuevaJugada correcta con último quesito no debe cambiar el turno.');
        return 1;
    }
    console.log("Test 15 nuevaJugada: ✅");

    //FINALIZACIÓN
    try{
        cache.borrarPartidaSync(idSala);
        const fin = await cache.estadoPartida(idSala);
        if(fin['code'] !== 1 ){
            logger.error('Error test partidas: fin. No se ha borrado la partida de la cache.');
            console.log(fin);
            return 1;
        }
    }catch (e){
        console.log("Exception fin testParitdas. " + e)
    }

    console.log("Tests nuevaJugada: ✅");
    return 0;
}

module.exports = { testSalas, testTablero, testPartidas }