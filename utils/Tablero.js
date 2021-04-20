const logger = require('../logger');

class Tablero{

    constructor() {
        this.circuloExterior = this.getCirculoExterior();
        this.caminosInteriores = this.getCaminosInteriores();
        this.siguienteCasilla = this.getTransicion();
    }

    getCirculoExterior(){
        let array = [];
        array[0] = {cas: new Casilla("Morado", "Quesito"), n: 0};
        array[1] = {cas: new Casilla("", "Dado"), n: 1};
        array[2] = {cas: new Casilla("Verde", "Normal"), n: 2};
        array[3] = {cas: new Casilla("Azul", "Normal"), n: 3};

        array[4] = {cas: new Casilla("Naranja", "Quesito"), n: 10};
        array[5] = {cas: new Casilla("", "Dado"), n: 11};
        array[6] = {cas: new Casilla("Amarillo", "Normal"), n: 12};
        array[7] = {cas: new Casilla("Verde", "Normal"), n: 13};

        array[8] = {cas: new Casilla("Azul", "Quesito"), n: 20};
        array[9] = {cas: new Casilla("", "Dado"), n: 21};
        array[10] = {cas: new Casilla("Naranja", "Normal"), n: 22};
        array[11] = {cas: new Casilla("Azul", "Normal"), n: 23};

        array[12] = {cas: new Casilla("Verde", "Quesito"), n: 30};
        array[13] = {cas: new Casilla("", "Dado"), n: 31};
        array[14] = {cas: new Casilla("Amarillo", "Normal"), n: 32};
        array[15] = {cas: new Casilla("Morado", "Normal"), n: 33};

        array[16] = {cas: new Casilla("Rosa", "Quesito"), n: 40};
        array[17] = {cas: new Casilla("", "Dado"), n: 41};
        array[18] = {cas: new Casilla("Rosa", "Normal"), n: 42};
        array[19] = {cas: new Casilla("Morado", "Normal"), n: 43};

        array[20] = {cas: new Casilla("Amarillo", "Quesito"), n: 50};
        array[21] = {cas: new Casilla("", "Dado"), n: 51};
        array[22] = {cas: new Casilla("Rosa", "Normal"), n: 52};
        array[23] = {cas: new Casilla("Naranja", "Normal"), n: 53};

        return array;
    }

    getCaminosInteriores(){
        let array = [];
        array[0] = [{cas: new Casilla("Naranja", "Normal"), n: 63},
                    {cas: new Casilla("Amarillo", "Normal"), n: 62},
                    {cas: new Casilla("Azul", "Normal"), n: 61}];

        array[1] = [{cas: new Casilla("Rosa", "Normal"), n: 73},
                    {cas: new Casilla("Verde", "Normal"), n: 72},
                    {cas: new Casilla("Azul", "Normal"), n: 71}];

        array[2] = [{cas: new Casilla("Morado", "Normal"), n: 83},
                    {cas: new Casilla("Amarillo", "Normal"), n: 82},
                    {cas: new Casilla("Naranja", "Normal"), n: 81}];

        array[3] = [{cas: new Casilla("Amarillo", "Normal"), n: 93},
                    {cas: new Casilla("Rosa", "Normal"), n: 92},
                    {cas: new Casilla("Azul", "Normal"), n: 91}];

        array[4] = [{cas: new Casilla("Naranja", "Normal"), n: 103},
                    {cas: new Casilla("Morado", "Normal"), n: 102},
                    {cas: new Casilla("Verde", "Normal"), n: 101}];

        array[5] = [{cas: new Casilla("Verde", "Normal"), n: 113},
                    {cas: new Casilla("Morado", "Normal"), n: 112},
                    {cas: new Casilla("Rosa", "Normal"), n: 111}];

        return array;
    }

    getPosiblesMovimientos(actual, dado, jugador){
        try {
            if(jugador < 0 || jugador > 5) return null;
            if (actual === 777) {

                if (dado > 3) {

                    let sig = this.caminosInteriores[jugador][2].n - 61;
                    return this.getPosiblesMovimientos(sig, dado - 3, jugador);

                } else {
                    return [this.caminosInteriores[jugador][dado - 1]];
                }

            } else if (actual >= 61 && actual < 114) {
                let dadoPrev = this.caminosInteriores[jugador].findIndex(t => t.n === actual) + 1;

                if (dado + dadoPrev >  3 ) {
                    let sig = this.caminosInteriores[jugador][2].n - 61;
                    return this.getPosiblesMovimientos(sig, dado + dadoPrev - 3 , jugador);

                } else {
                    return [this.caminosInteriores[jugador][dadoPrev + dado - 1]];
                }

            } else if (actual >= 0 && actual < 61){

                let casilla = this.circuloExterior.findIndex(t => t.n === actual);
                if (dado === 0) return [this.circuloExterior[casilla]];
                return [this.circuloExterior[(casilla+dado)%this.circuloExterior.length],
                        this.circuloExterior[(casilla-dado)%this.circuloExterior.length]];

            } else {
                return null;
            }
        } catch (e) {
            logger.error("Error al calcular posibles movimientos", e)
            return null;
        }
    }
}

class Casilla{
    constructor(color, tipo){
        this.color = color;
        this.tipo = tipo;
    }

    getColor(){
        return this.color;
    }

    esNormal(){
        return this.tipo === "Normal";
    }

    esQuesito(){
        return this.tipo === "Quesito";
    }

    esDado(){
        return this.tipo === "Dado";
    }
}

module.exports = {Tablero, Casilla};