const Controller = require('./Controller');
const service = require('../services/PartidaService');


const reconexion = async (request, response) => {
    await Controller.handleRequest(request, response, service.reconexion);
};

module.exports = {
    reconexion,
};