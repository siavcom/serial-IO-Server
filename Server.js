/*
Driver para leer y escribir en usb  /dev/hidraw0

node-hid - Access USB HID devices from Node.js
https://www.npmjs.com/package/node-hid#complete-sync-api


/////////////////////////////////////////////////////////////
para poder leer los hid se debe de aumentar una regla por medio de un archivo en
/etc/udev/rules.d/99-hidraw-permission.rules

dentro de el debe de existir esta linea:
KERNEL=="hidraw*", SUBSYSTEM=="hidraw", MODE="0666", GROUP="plugdev"
/////////////////////////////////////////////////////////////
ejemplo de lectura de bascula toledo

https://gist.github.com/tresf/898ab2d4d259aef2d4f7
*/

const { SerialPort } = require('serialport');
const { Server } = require('socket.io'); //from "socket.io";

const usbServer = async () => {

    usbPort = require("./ports.json");
    var bufLength = 0
    var pesada = []

    const path = usbPort.bascula.port

    const baudrate = usbPort.bascula.baudrate
    const BUFFER_SIZE = usbPort.bascula.BUFFER_SIZE

    console.log('path:' + path + ' baudrate:' + baudrate, 'BUFFER_SIZE:', BUFFER_SIZE)

    var HID = require('node-hid');
    console.log('HID loaded :', HID);

    let Port = null
    if (usbPort.bascula.type == 'Serial') {
        Port = new SerialPort({
            path: path,
            baudRate: baudrate
        })
        Port.on('data', function (data) {
            console.log('SerialData=', data.toString('hex'));
            pesada = pesada + data.toString()
        })
    }

    if (usbPort.bascula.type == 'hidraw') {
        //Port = new HID.HID(path)

        var vendorId = usbPort.bascula.vendorId
        var productId = usbPort.bascula.productId

        console.log('vendorId:', vendorId, 'productId:', productId)

        /*
         vendorId:0x808 productId:0x606
        */
        Port = await HID.HIDAsync.open(vendorId, productId);
        console.log('==========Hidraw Open============')

        Port.on("data", function (data) {

            if (bufLength + 1 >= BUFFER_SIZE) { // Inicilaizamos pesada
                pesada.length = 0
            }
            bufLength = pesada.length
            console.log('HidrawData=====>', data.toString('hex'), 'Pesada:', pesada)

            pesada[bufLength] = data.toString('hex')

        });


    }

    const host = process.env.HOST || '127.0.0.1'
    const port = process.env.PORT || 3010


    // var io = require('socket.io')(port);
    //const io = new Server(port)

    // origin =* permite llamadas de cualquier dominio
    const io = new Server(port, {
        cors: {
            origin: "*"
        }
    })


    // io.sockets.on('connection', function (socket) {
    io.on('connection', function (socket) {

        console.log('connected');
        socket.on('zero', async (callback) => {
            pesada.length = 0
            bufLength = 0
            console.log('inicializa pesada');
            callback('ok')

        });

        socket.on("leeUsb", async (callback) => {
            // data=Port.read(1000)
            let intentos = 0
            while (pesada.length < BUFFER_SIZE) {
                await delay(.5)
                if (intentos++ > 10) {
                    callback({ error: 'TIMEOUT' })
                    pesada.length = 0

                    return
                }
            }
            const data = {
                pesada: pesada // parseInt(Math.random() * 10000)
            }
            /* try{
             serialPort.on('data', async () => {
                 data = pesada
                 console.log(data.toString());
                 callback(pesada)
             });}
             catch(err){
                 const response={
                     error:err
                 }
                 console.log(err);
                 callback(response)
             }*/
            console.log(' leeUsb Pesada=', data)
            callback(data)
        });


        socket.on('disconnected', function () {
            console.log('disconnected');
        });
    });
    //Server.listen()
}

function delay(n) {
    return new Promise(function (resolve) {
        setTimeout(resolve, n * 1000);
    });
}



usbServer()






/*

Lee la bascula por medio de un puerto serie
https://gist.github.com/tresf/898ab2d4d259aef2d4f7

serialPort.on('open', function () {
    console.log('open');
    
    serialPort.on('data', function (data) {
        console.log(data);
        readData += data.toString();
        io.sockets.emit('message', data);
    });
    
});
*/


/*


Server Side:

var express = require('express');
var app = express();
var server = require('http').createServer(app).listen(1234);
var io = require('socket.io').listen(server);

io.sockets.on('connection', function(client){

    console.log("client connected: " + client.id);

    client.on("sendTo", function(chatMessage){
        console.log("Message From: " + chatMessage.fromName);
        console.log("Message To: " + chatMessage.toName);


        io.sockets.socket(chatMessage.toClientID).emit("chatMessage", {"fromName" : chatMessage.fromName,
                                                                    "toName" : chatMessage.toName,
                                                                    "toClientID" : chatMessage.toClientID,
                                                                    "msg" : chatMessage.msg});

    });
});



*/