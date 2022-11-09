const express = require('express');

const {Server:SocketServer} = require('socket.io')
const {Server:HTTPServer} = require('http');

const app = express();
const handlebars = require('express-handlebars');
const events = require('./public/js/sockets_events');
const httpServer = new HTTPServer(app);
const socketServer = new SocketServer(httpServer);

const routerNumRandoms = require('./routes/randoms')
const routerProductos = require('./routes/productos-test')
const routerInfo = require('./routes/info')

const passport = require('passport');

const {objeto, baseDatos} = require('./config')
const auth = require('./middleware/auth')
const {mensaje} = require('./schema/mensajes')
const MensajeMongo = require('./DAOs/mensajes')
const nvoMsj = new MensajeMongo
const connection = require('./dataBase');
const connectionPassport = require('./passport/index')

connection()
connectionPassport()

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));


const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoOptions = { useNewUrlParser: true, useUnifiedTopology: true }

const { loggerDev, loggerProd} =  require('./logger_config')

const NODE_ENV = process.env.NODE_ENV || "development";

const logger = NODE_ENV === "production"
    ? loggerDev
    : loggerProd

app.use(session({
    store: MongoStore.create({
        mongoUrl: baseDatos,
        mongoOptions,
        ttl: 600,
        retries: 0
    }),
    secret: "Secret",
    resave: false,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session())

const hbs = handlebars.create({
    extname:'.hbs',
    defaultLayout:'index.hbs',
    layoutsDir: __dirname + '/public/views/layout',
})  

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', './public/views');

app.use('/test/info', routerInfo)
app.use('/test/productos', routerProductos)
//app.use('/api/randoms', routerNumRandoms)

app.get("/", (req, res) => {
    const usuario = req.session.user
    if(!usuario){
        res.redirect('/login')
    } else{
        res.render('main',{
            usuario: usuario
        })
    }  
});

app.get("/login",(req, res) => {
   res.sendFile(__dirname + "/public/login.html")
});

app.post("/login",passport.authenticate('login',{failureRedirect:'/login'}),(req, res) => {
    req.session.user = req.user;
    res.redirect('/')

 });

app.get("/signup", (req, res) => {
    res.sendFile(__dirname + "/public/signup.html")

});

app.post('/signup',passport.authenticate('signup',{failureRedirect: '/signup'}),(req,res)=>{
    res.redirect('/login')
})

app.post("/",  (req,res)=>{
    let usuario = req.body.usuario;
    req.session.usuario = usuario
    if(usuario){
        res.redirect('/login')
    }
})

app.get("/logout", (req,res)=>{
    let usuario = req.session.user
    if(usuario){
        req.session.destroy();
        res.render('./partials/logout',{
         usuario: usuario
    })
    }else{
        res.redirect('/')
    }
})

app.get('/*', (req, res) => {
    logger.log("warn", `Ruta no encontrada ${req.url}`)
    res.status(404).send(`Ruta no encontrada ${req.url}`);
})

socketServer.on('connection', async(socket)=>{
    const totalMensajes = await nvoMsj.getAll();
    socketServer.emit(events.TOTAL_MENSAJES, totalMensajes)
    socket.on(events.ENVIAR_MENSAJE, async(msg)=>{
        const MENSAJE = new mensaje(msg)
        const result = await nvoMsj.save(MENSAJE)
        socketServer.sockets.emit(events.NUEVO_MENSAJE, msg)
    })
    const pesoNormMsjs = JSON.stringify(totalMensajes).length / 1024
    socketServer.sockets.emit('porcentaje', totalMensajes, pesoNormMsjs)
})

const server= httpServer.listen(objeto.p, ()=>{
    console.log(`El servidor se esta ejecutando en el puerto ${objeto.p}, proceso: ${process.pid}`);
})

server.on('error',(err)=>{
    logger.log('warn',`Error al iniciar el servidor ${err}`)
})

console.log('pruebaaa');