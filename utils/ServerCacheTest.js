const logger = require('../logger');
const cache = require('./ServerCache');


/**
 * Pre: la memoria cache ya ha sido inicializada previamente
 * Test de las salas memoria cache del servidor.
 * Devuelve 1 si ha habido algún error y 0 en caso contrario
 */
async function testSalas(){
    try{
        let usuario1 = 'bqsf1';
        let usuario2 = 'bqsf2';
        let usuario3 = 'bqsf3';
        let usuario4 = 'bqsf4';
        let usuario5 = 'bqsf5';
        let usuario6 = 'bqsf6';


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

        if((await cache.abandonarSala(res6.sala, usuario6))!== 0){
            logger.error('Error test salas: 7')
            return 1;
        }

        if((await cache.borrarSala(res3.sala)) !== 0){
            logger.error('Error test salas: 8')
            return 1;
        }

        if((await cache.comenzarPartida(res1.sala))!== 0){
            logger.error('Error test salas: 9')
            return 1;
        }

        if((await cache.comenzarPartida(res5.sala)) === 0){
            logger.error('Error test salas: 10')
            return 1;
        }

        if((await cache.borrarPartida(res1.sala)) !== 0){
            logger.error('Error test salas: 11')
            return 1;
        }
        return 0;

    } catch (e){
        logger.error('Error en el test: desconocido', e)
        return 1;
    }

}

module.exports = { testSalas }