const parseArgs = require('minimist')
require('dotenv').config()

const opciones = {
    alias:{
        p:'puerto'
    },
    default:{
        puerto:8080
    }
}

const objeto = parseArgs(process.argv.slice(2), opciones)
const baseDatos = process.env.BASEDATOS

module.exports = {baseDatos, objeto}