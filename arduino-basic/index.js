/**
 * Created by Riven on 2017/9/25 0025.
 */

const ArgumentType = Scratch.ArgumentType;
const BlockType = Scratch.BlockType;
const formatMessage = require('format-message');
const log = Scratch.log;

class ArduinoExtension {
    constructor (runtime){
        this.runtime = runtime;
        this.comm = runtime.ioDevices.comm;
        this.session = null;
        this.runtime.registerExtensionDevice('Arduino', this);
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
    startDeviceScan (){
        this.comm.getDeviceList().then(result => {
            this.runtime.emit(this.runtime.constructor.PERIPHERAL_LIST_UPDATE, result);
        });
    }

    connectDevice (id){
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

    disconnectSession (){
        this.session.close();
    }

    getPeripheralIsConnected (){
        return Boolean(this.session);
    }

    getInfo (){
        return {
            id: 'Arduino',

            name: 'Arduino',

            color1: '#00979C',
            color2: '#008184',
            color3: '#008184',

            showStatusButton: true,

            blocks: [
                {
                    opcode: 'arduinostart',
                    blockType: BlockType.CONDITIONAL,

                    branchCount: 2,
                    isTerminal: true,
                    message2: 'loop',
                    text: ['Arduino Setup', 'loop'],
                    hatType: true,
                    func: 'noop'
                },
                {
                    opcode: 'serialreadline',
                    blockType: BlockType.CONDITIONAL,

                    branchCount: 1,
                    isTerminal: false,

                    text: formatMessage({
                        id: 'arduino.serialreadline',
                        default: '[SERIAL] Readline'
                    }),
                    arguments: {
                        SERIAL: {
                            type: ArgumentType.STRING,
                            menu: 'serialtype',
                            defaultValue: 'Serial'
                        }
                    },
                    func: 'noop'
                },
                {
                    opcode: 'serialbegin',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'arduino.serialbegin',
                        default: 'Serial Begin [BAUD]'
                    }),
                    arguments: {
                        BAUD: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 115200
                        }
                    },
                    func: 'noop',
                    sepafter: 36
                },
                {
                    opcode: 'pinmode',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'arduino.pinmode',
                        default: 'Pin Mode [PIN] [MODE]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '13',
                            menu: 'digiPin'
                        },
                        MODE: {
                            type: ArgumentType.STRING,
                            menu: 'pinMode',
                            defaultValue: 1
                        }
                    },
                    func: 'pinMode'
                },
                {
                    opcode: 'digitalwrite',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'arduino.digitalwrite',
                        default: 'Digital Write [PIN] [VALUE]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '13',
                            menu: 'digiPin'
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            menu: 'level',
                            defaultValue: 1
                        }
                    },
                    func: 'digitalWrite'
                },
                {
                    opcode: 'analogwrite',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'arduino.analogwrite',
                        default: 'Analog Write [PIN] [VALUE]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'analogWritePin',
                            defaultValue: '3'
                        },
                        VALUE: {
                            type: ArgumentType.SLIDERANALOGWR,
                            defaultValue: 120
                        }
                    },
                    func: 'analogWrite'
                },
                {
                    opcode: 'digitalread',
                    blockType: BlockType.BOOLEAN,

                    text: formatMessage({
                        id: 'arduino.digitalread',
                        default: 'Digital Read [PIN]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '3',
                            menu: 'digiPin'
                        }
                    },
                    func: 'digitalRead'
                },
                {
                    opcode: 'analogread',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'arduino.analogread',
                        default: 'Analog Read [PIN]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: 'A0',
                            menu: 'analogPin'
                        }
                    },
                    func: 'analogRead',
                    sepafter: 36
                },
                {
                    opcode: 'led',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'arduino.led',
                        default: 'LED [PIN] [VALUE]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '13',
                            menu: 'digiPin'
                        },
                        VALUE: {
                            type: ArgumentType.STRING,
                            menu: 'onoff',
                            defaultValue: 0
                        }
                    },
                    func: 'led'
                },
                {
                    opcode: 'mapping',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'arduino.mapping',
                        default: 'Map [VAL] from [FROMLOW]~[FROMHIGH] to [TOLOW]~[TOHIGH]'
                    }),
                    arguments: {
                        VAL: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 100
                        },
                        FROMLOW: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        FROMHIGH: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 255
                        },
                        TOLOW: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        TOHIGH: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1024
                        }
                    },
                    func: 'mapping'
                },
                {
                    opcode: 'millis',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'arduino.millis',
                        default: 'millis'
                    }),
                    func: 'noop'
                },
                {
                    opcode: 'println',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'arduino.println',
                        default: 'Serial Print [TEXT]'
                    }),
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello World'
                        }
                    },
                    func: 'noop'
                },
                {
                    opcode: 'printvalue',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'arduino.printvalue',
                        default: 'Serial Print [TEXT] = [VALUE]'
                    }),
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Apple'
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 123
                        }
                    },
                    func: 'noop'
                },
                {
                    opcode: 's4xparse',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'arduino.s4xparse',
                        default: 'S4X Parse [PARAM]'
                    }),
                    arguments: {
                        PARAM: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Apple'
                        }
                    },
                    func: 'noop',
                    sepafter: 36
                },
                {
                    opcode: 'softwareserial',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'arduino.softwareserial',
                        default: 'Software Serial TX[TX] RX[RX] [BAUD]'
                    }),
                    arguments: {
                        TX: {
                            type: ArgumentType.STRING,
                            defaultValue: '3',
                            menu: 'digiPin'
                        },
                        RX: {
                            type: ArgumentType.STRING,
                            defaultValue: '4',
                            menu: 'digiPin'
                        },
                        BAUD: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 9600
                        }
                    },
                    func: 'noop'
                },
                {
                    opcode: 'softwareserialprintln',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'arduino.softwareserialprintln',
                        default: 'Software Serial Println [TEXT]'
                    }),
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello World'
                        }
                    },
                    func: 'noop'
                }
            ],
            menus: {
                pinMode: [{text:'INPUT', value: 0}, {text: 'OUTPUT', value: 1}, {text: 'INPUT_PULLUP', value: 2}],
                level: [{text: 'HIGH', value: 1}, {text: 'LOW', value: 0}],
                onoff: [{text: 'ON', value: 0}, {text: 'OFF', value: 1}],
                digiPin: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13',
                    'A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
                analogPin: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
                analogWritePin: ['3', '5', '6', '9', '10', '11'],
                serialtype: [{text: 'Serial', value: 'Serial'}, {text: 'Soft Serial', value: 'softser'}]
            },
        };
    }

    noop (){

    }


    pinMode (args){
        let cmd = `M1 ${pinMode[args.PIN]} ${pinMode[args.MODE]}\r\n`;
        this.write(cmd);
    }

    digitalWrite (args){
        if (isNaN(args.VALUE)){
            args.VALUE = levelMap[args.VALUE];
        }
        let cmd = `M2 ${args.PIN} ${args.VALUE}\r\n`;
        this.write(cmd);
    }

    led (args){
        if (isNaN(args.VALUE)){
            args.VALUE = onoffMap[args.VALUE];
        }
        let cmd = `M2 ${args.PIN} ${args.VALUE}\r\n`;
        this.write(cmd);
    }

    analogWrite (args){
        let cmd = `M4 ${args.PIN} ${args.VALUE}\r\n`;
        this.write(cmd);
    }

    digitalRead (args) {
        let cmd = `M3 ${args.PIN}\r\n`;
        return this.comm.report(cmd, util.targetid).then(ret => this.parseCmd(ret));
    }

    analogRead (args){
        let cmd = `M5 ${args.PIN}\r\n`;
        return this.comm.report(cmd, util.targetid).then(ret => this.parseCmd(ret));
    }

    ultrasonic (args){
        let cmd = `M250 ${args.TRIG} ${args.ECHO}\r\n`;
        return this.comm.report(cmd, util.targetid).then(ret => this.parseCmd(ret));
    }

    mapping (args){
        const x = args.VAL;
        const in_min = args.FROMLOW;
        const in_max = args.FROMHIGH;
        const out_min = args.TOLOW;
        const out_max = args.TOHIGH;
        return parseFloat(((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min)).toFixed(2);
    }

    parseCmd (msg){
        let tmp = msg.trim().split(' ');
        tmp = tmp.filter(n => { return n !== ''});
        if (tmp[0].indexOf('M3') > -1){
            return parseInt(tmp[2], 10);
        } else if (tmp[0].indexOf('M5') > -1){
            return parseInt(tmp[2], 10);
        } else if (tmp[0].indexOf('M250') > -1){
            return parseInt(tmp[1], 10);
        }
    }
}

module.exports = ArduinoExtension;
