/**
 * Created by Riven on 2018/07/27
 */
const ArgumentType = Scratch.ArgumentType;
const BlockType = Scratch.BlockType;
const formatMessage = require('format-message');
const log = Scratch.log;

const hexToRgb = function (hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const bmbotCommon = gen => {
    gen.includes_['bmbot'] = '#include "BMBot.h"';
    gen.definitions_['bmbot'] = 'BMBot bmbot;';
};


class BMBot {
    constructor (runtime){
        this.runtime = runtime;
        this.comm = runtime.ioDevices.comm;
        this.session = null;
        this.runtime.registerPeripheralExtension('BMBot', this);
        // session callbacks
        this.onmessage = this.onmessage.bind(this);
        this.onclose = this.onclose.bind(this);

        this.decoder = new TextDecoder();
        this.lineBuffer = '';
    }

    write (data){
        if (!data.endsWith('\n')) data += '\n';
        if (this.session) this.session.write(data);
    }

    report (data){
        return new Promise(resolve => {
            this.write(data);
            this.reporter = resolve;
        });
    }


    onmessage (data){
        const dataStr = this.decoder.decode(data);
        this.lineBuffer += dataStr;
        if (this.lineBuffer.indexOf('\n') !== -1){
            const lines = this.lineBuffer.split('\n');
            this.lineBuffer = lines.pop();
            for (const l of lines){
                if (this.reporter) this.reporter(l);
            }
        }
    }

    onclose (error){
        log.warn('on close', error);
        this.session = null;
        this.runtime.emit(this.runtime.constructor.PERIPHERAL_ERROR);
    }

    // method required by vm runtime
    scan (){
        this.comm.getDeviceList().then(result => {
            this.runtime.emit(this.runtime.constructor.PERIPHERAL_LIST_UPDATE, result);
        });
    }

    connect (id){
        this.comm.connect(id).then(sess => {
            this.session = sess;
            this.session.onmessage = this.onmessage;
            this.session.onclose = this.onclose;
            // notify gui connected
            this.runtime.emit(this.runtime.constructor.PERIPHERAL_CONNECTED);
        }).catch(err => {
            log.warn('connect peripheral fail', err);
        });
    }

    disconnect (){
        this.session.close();
    }

    isConnected (){
        return Boolean(this.session);
    }


    _buildMenu (info) {
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = String(index + 1);
            return obj;
        });
    }

    getInfo (){
        return {
            id: 'BMBot',
            name: 'BMBot',
            showStatusButton: true,

            blocks: [
                {
                    opcode: 'motor',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'BMBot.motor',
                        default: 'Motor [MOTOR] Speed [SPEED]'
                    }),
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.NUMBER,
                            menu: 'MOTORS',
                            defaultValue: '1'
                        },
                        SPEED: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        }
                    },
                    gen: {
                        arduino: this.motorArduino
                    }
                },
                {
                    opcode: 'stop',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'BMBot.stop',
                        default: 'Stop'
                    }),
                    gen: {
                        arduino: this.motorStopArduino
                    }
                },
                {
                    opcode: 'servo',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'BMBot.servo',
                        default: 'Servo [SERVO] degree [DEGREE]'
                    }),
                    arguments: {
                        SERVO: {
                            type: ArgumentType.NUMBER,
                            menu: 'SERVO',
                            defaultValue: '1'
                        },
                        DEGREE: {
                            type: ArgumentType.SLIDERSERVO,
                            defaultValue: 90
                        }
                    },
                    gen: {
                        arduino: this.servoArduino
                    }
                },
                {
                    opcode: 'infrarx',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'BMBot.infrarx',
                        default: 'Infra Receive'
                    }),
                    gen: {
                        arduino: this.infrarxArduino
                    }
                },
                {
                    opcode: 'rgb',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'BMBot.rgb',
                        default: 'Rgb [PIXEL] Color [COLOR]'
                    }),
                    arguments: {
                        PIXEL: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        COLOR: {
                            type: ArgumentType.COLORRGB
                        }
                    },
                    func: 'rgb',
                    gen: {
                        arduino: this.rgbArduino
                    }
                },
                {
                    opcode: 'button',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'BMBot.button',
                        default: 'Button'
                    }),
                    func: 'button',
                    gen: {
                        arduino: this.buttonArduino
                    }
                },
                {
                    opcode: 'linefollow',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'BMBot.linefollow',
                        default: 'Linefollow'
                    }),
                    func: 'linefollow',
                    gen: {
                        arduino: this.linefollowArduino
                    }
                },
                {
                    opcode: 'buzzer',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'BMBot.buzzer',
                        default: 'Buzzer Freq [FREQ] Hz, delay [DELAY]'
                    }),
                    arguments: {
                        FREQ: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 500
                        },
                        DELAY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 500
                        }
                    },
                    func: 'buzzer',
                    gen: {
                        arduino: this.buzzerArduino
                    }
                },
                {
                    opcode: 'ultrasonic',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'BMBot.ultrasonic',
                        default: 'Ultrasonic'
                    }),
                    func: 'ultrasonic',
                    gen: {
                        arduino: this.ultrasonicArduino
                    }
                },
                {
                    opcode: 'lightsensor',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'BMBot.lightsensor',
                        default: 'Light Sensor'
                    }),
                    func: 'lightsensor',
                    gen: {
                        arduino: this.lightsensorArduino
                    }
                },
                {
                    opcode: 'soundsensor',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'BMBot.soundsensor',
                        default: 'Sound Sensor'
                    }),
                    func: 'soundsensor',
                    gen: {
                        arduino: this.soundsensorArduino
                    }
                }
            ],
            menus: {
                MOTORS: [
                    {text: 'All', value: '0'},
                    {text: 'B1', value: '1'},
                    {text: 'B2', value: '2'}
                ],
                SERVO: [
                    {text: 'A1', value: '0'},
                    {text: 'A2', value: '1'}
                ]
            }
        };
    }

    noop (){

    }

    motor (args){
        this.write(`M310 ${args.MOTOR} ${args.SPEED}\r\n`);
    }

    stop (){
        this.write(`M310 0 0\r\nM310 1 0\r\n`);
    }

    servo (args){
        this.write(`M309 ${args.SERVO} ${args.DEGREE}\r\n`);
    }

    infrarx (){
        return this.report(`M303\r\n`).then(ret => this.parseCmd(ret));
    }

    rgb (args){
        const color = hexToRgb(args.COLOR);
        this.write(`M304 ${args.PIXEL} ${color.r} ${color.g} ${color.b}\r\n`);
    }

    button (){
        return this.report(`M305\r\n`).then(ret => this.parseCmd(ret));
    }

    linefollow (){
        return this.report(`M306\r\n`).then(ret => this.parseCmd(ret));
    }

    buzzer (args){
        this.write(`M307 ${args.FREQ} ${args.DELAY}\r\n`);
    }

    ultrasonic (){
        return this.report(`M308\r\n`).then(ret => this.parseCmd(ret));
    }

    lightsensor (){
        return this.report(`M301\r\n`).then(ret => this.parseCmd(ret));
    }

    soundsensor (){
        return this.report(`M302\r\n`).then(ret => this.parseCmd(ret));
    }


    parseCmd (msg){
        if (msg.indexOf('OK') > -1){
            return null;
        } else if (msg.indexOf("M301") > -1 ||
            msg.indexOf("M302") > -1 ||
            msg.indexOf("M303") > -1 ||
            msg.indexOf("M303") > -1 ||
            msg.indexOf("M305") > -1 ||
            msg.indexOf("M306") > -1 ||
            msg.indexOf("M308") > -1){
            let tmp = msg.trim().split(' ');
            let ret = tmp[1];
            return ret;
        }
        return msg;
    }

    motorArduino (gen, block){
        bmbotCommon(gen);
        const code = gen.template2code(block, 'bmbot.motor');
        return gen.line(code);
    }

    motorStopArduino (gen, block){
        bmbotCommon(gen);
        return gen.line(`bmbot.motor(0,0)`);
    }

    servoArduino (gen, block){
        bmbotCommon(gen);
        const code = gen.template2code(block, 'bmbot.servo');
        return gen.line(code);
    }

    infrarxArduino (gen, block){
        bmbotCommon(gen);
        return gen.template2code(block, 'bmbot.infraRx');
    }


    rgbArduino (gen, block){
        bmbotCommon(gen);
        const pix = gen.valueToCode(block, 'PIXEL');
        let color = gen.valueToCode(block, 'COLOR');
        color = gen.hexToRgb(color);
        if (color){
            const code = `bmbot.rgbSet(${pix}, ${color.r}, ${color.g}, ${color.b})`;
            return gen.line(code);
        }
    }

    buttonArduino (gen, block){
        bmbotCommon(gen);
        return gen.template2code(block, 'bmbot.button');
    }

    linefollowArduino (gen, block){
        bmbotCommon(gen);
        return gen.template2code(block, 'bmbot.lineFollower');
    }

    buzzerArduino (gen, block){
        bmbotCommon(gen);
        const code = gen.template2code(block, 'bmbot.buzzer');
        return gen.line(code);
    }

    ultrasonicArduino (gen, block){
        bmbotCommon(gen);
        return gen.template2code(block, 'bmbot.ultrasonicSensor');
    }

    lightsensorArduino (gen, block){
        bmbotCommon(gen);
        return gen.template2code(block, 'bmbot.lightSensor');
    }

    soundsensorArduino (gen, block){
        bmbotCommon(gen);
        return gen.template2code(block, 'bmbot.audioSensor');
    }

}

module.exports = BMBot;
