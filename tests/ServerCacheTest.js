const logger = require('../logger');
const cache = require('../utils/ServerCache');
const Tablero = require('../utils/Tablero');


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

    const turno = cache.obtenerTurno(idSala);
    if(turno === undefined || !(turno === usuario1 || turno === usuario2)){
        logger.error('Error test partidas: 1. Turno no válido.');
        return 1;
    }

    const res2 = cache.obtenerTurno(idSala+"___");
    //No es válido porque es más largo que el id y por tanto no existe una partida así
    if(res2 !== undefined){
        logger.error('Error test partidas: 2. Turno debería ser undefined.');
        return 1;
    }

    const res3 = cache.obtenerPosicion(idSala, usuario1);
    if(res3 === undefined || res3 !== 777){
        logger.error('Error test partidas: 3. Posición debería ser 777.');
        return 1;
    }

    const res4 = cache.obtenerPosicion(idSala, usuario3);
    if(res4 !== undefined){
        logger.error('Error test partidas: 4. Posición de usuario que no existe debe ser undefined.');
        return 1;
    }


    const res5 = cache.obtenerPosicion(idSala+"___", usuario1);
    if(res5 !== undefined){
        logger.error('Error test partidas: 5. Posición en sala que no existe debe ser undefined.');
        return 1;
    }

    const res6 = cache.obtenerQuesitosRestantes(idSala, usuario1);
    if(res6 === undefined || res6 !== config.MAX_QUESITOS){
        logger.error('Error test partidas: 6. Quesito restantes debería ser ' + config.MAX_QUESITOS);
        return 1;
    }

    const res7 = cache.obtenerQuesitosRestantes(idSala, usuario3);
    if(res7 !== undefined){
        logger.error('Error test partidas: 7. Quesito restantes de usuario que no existe debe ser undefined.');
        return 1;
    }


    const res8 = cache.obtenerQuesitosRestantes(idSala+"___", usuario1);
    if(res8 !== undefined){
        logger.error('Error test partidas: 8. Quesito restantes en sala que no existe debe ser undefined.');
        return 1;
    }



}

module.exports = { testSalas, testTablero, testPartidas }