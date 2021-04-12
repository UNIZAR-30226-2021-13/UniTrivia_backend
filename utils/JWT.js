const JWT = require('jsonwebtoken');
const config = require('../config');
const logger = require('../logger');

/**
 * Función para validar un token.
 *
 * @param token JWT a validar
 * @returns {null|object} Objeto con la información contenida del token si es válido
 *          y si no devuelve null
 */
function validarToken(token) {
    try {
        return JWT.verify(token, config.JWT_KEY);
    } catch(err){
        logger.error("Token no válido", err);
        return null;
    }

}

/***
 * Función para crear un token.
 *
 * @param username Nombre de usuario a crear.
 * @param guest True si el usuario es invitado y false en caso contrario.
 * @returns {null|string} token o null si error
 */
function crearToken(username, guest) {
    try {
        const payload = {user: username, guest: guest};
        return JWT.sign(payload, config.JWT_KEY, {expiresIn: '20h'});
    } catch(err){
        logger.error("Error creando token", err);
        return null;
    }

}

module.exports = {
    validarToken, crearToken
}