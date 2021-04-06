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
                        value.turno = value.jugadores[i+1].nombre;
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
