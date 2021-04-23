const Controller = require('./Controller');
const service = require('../services/PartidaService');


const partida = async (request, response) => {
    await Controller.handleRequest(request, response, service.partida);
};

module.exports = {
    partida,
};