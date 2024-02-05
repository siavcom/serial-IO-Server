#!/usr/bin/env node

//var HID = require('../');
var HID = require('node-hid');

const Hid = async () => {
    // Linux: choose driverType
    // default is 'hidraw', can also be 'libusb'
    if (process.argv[2]) {
        var type = process.argv[2];
        console.log("driverType:", type);
        HID.setDriverType(type);
    }
    vendorId = ''
    productId = ''
    const devices = await HID.devicesAsync()

    // console.log('all Devices:', devices);
    for (const devi in devices) {
        //console.log('1) Devices:', devices[devi]);
        if (devices[devi].vendorId != vendorId || devices[devi].productId != productId) {
            vendorId = devices[devi].vendorId;
            productId = devices[devi].productId;
            console.log('Devices:', devices[devi], 'vendorId:0x' + vendorId.toString(16), 'productId:0x' + productId.toString(16));

        }
    }
}
Hid()
//console.log('devices:', HID.devices());