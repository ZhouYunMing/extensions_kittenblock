const ArgumentType = Scratch.ArgumentType;
const BlockType = Scratch.BlockType;
const formatMessage = require('format-message');
const log = Scratch.log;

const hexToRgb = hex => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const infraMap = {
    0xFFA25D: 'POWER',
    0xFF629D: 'MENU',
    0xFFE21D: 'MUTE',
    0xFF22DD: 'MODE',
    0xFF02FD: '+',
    0xFFC23D: 'RETURN',
    0xFFE01F: 'BACK',
    0xFFA857: 'PLAY',
    0xFF906F: 'FORWARD',
    0xFF6897: '0',
    0xFF9867: '-',
    0xFFB04F: 'OK',
    0xFF30CF: '1',
    0xFF18E7: '2',
    0xFF7A85: '3',
    0xFF10EF: '4',
    0xFF38C7: '5',
    0xFF5AA5: '6',
    0xFF42BD: '7',
    0xFF4AB5: '8',
    0xFF52AD: '9'
};

class MiniLFR {
    constructor (runtime){
        this.runtime = runtime;
        this.comm = runtime.ioDevices.comm;
        this.session = null;
        this.runtime.registerExtensionDevice('MiniLFR', this);
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
                if (l.startsWith('TRIG')) this.parseTrig(l);
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
            setTimeout(() => {
                sess.write('M0\r\n'); // goto hardware coding mode
            }, 2000);

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
            id: 'MiniLFR',
            name: 'MiniLFR',
            color1: '#6A7782',
            color2: '#424A51',
            color3: '#424A51',
            showStatusButton: true,

            blocks: [
                {
                    opcode: 'spotlight',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.spotlight',
                        default: 'Spotlight Left[LEFT] Right[RIGHT]'
                    }),
                    arguments: {
                        LEFT: {
                            type: ArgumentType.STRING,
                            menu: 'eyeIndex',
                            defaultValue: 1
                        },
                        RIGHT: {
                            type: ArgumentType.STRING,
                            menu: 'eyeIndex',
                            defaultValue: 1
                        }
                    },
                    func: 'spotlight'
                },
                {
                    opcode: 'rgb-brightness',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.rgb-brightness',
                        default: 'RGB Brightness [BRIGHT]'
                    }),
                    arguments: {
                        BRIGHT: {
                            type: ArgumentType.SLIDERANALOGWR,
                            defaultValue: 100
                        }
                    },
                    func: 'rgbbrightness'
                },
                {
                    opcode: 'rgb-bottom',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.rgb-bottom',
                        default: 'Bottom RGB [INDEX] [COLOR]'
                    }),
                    arguments: {
                        INDEX: {
                            type: ArgumentType.STRING,
                            menu: 'rgbIndex',
                            defaultValue: 0
                        },
                        COLOR: {
                            type: ArgumentType.COLORRGB
                        }
                    },
                    func: 'rgbBottom'
                },
                {
                    opcode: 'rgb-bottom-off',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.rgb-bottom-off',
                        default: 'Bottom RGB Off'
                    }),
                    arguments: {},
                    func: 'rgbBottomOff'
                },
                {
                    opcode: 'rgb-head',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.rgb-head',
                        default: 'Head RGB [INDEX] [COLOR]'
                    }),
                    arguments: {
                        INDEX: {
                            type: ArgumentType.STRING,
                            menu: 'rgbIndex',
                            defaultValue: 0
                        },
                        COLOR: {
                            type: ArgumentType.COLORRGB
                        }
                    },
                    func: 'rgbHead'
                },
                {
                    opcode: 'rgb-head-off',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.rgb-head-off',
                        default: 'NekoMimi RGB Off'
                    }),
                    arguments: {},
                    func: 'rgbHeadOff'
                },
                {
                    opcode: 'rgb-ring',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.rgb-ring',
                        default: 'Ring RGB [INDEX] [COLOR]'
                    }),
                    arguments: {
                        INDEX: {
                            type: ArgumentType.STRING,
                            menu: 'rgbPix',
                            defaultValue: 0
                        },
                        COLOR: {
                            type: ArgumentType.COLORRGB
                        }
                    },
                    func: 'rgbRing'
                },
                {
                    opcode: 'rgb-ring-off',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.rgb-ring-off',
                        default: 'Ring RGB Off'
                    }),
                    arguments: {},
                    func: 'rgbRingOff',
                    sepafter: 36
                },
                {
                    opcode: 'wheelspeed',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.wheelspeed',
                        default: 'Wheel Speed Left[SPDL] Right[SPDR]'
                    }),
                    arguments: {
                        SPDL: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        },
                        SPDR: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        }
                    },
                    func: 'wheelspeed'
                },
                {
                    opcode: 'wheelspeeddelay',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.wheelspeeddelay',
                        default: 'Wheel Speed Left[SPDL] Right[SPDR] Delay[DELAY]ms'
                    }),
                    arguments: {
                        SPDL: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        },
                        SPDR: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        },
                        DELAY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1000
                        }
                    },
                    func: 'wheelspeeddelay'
                },
                {
                    opcode: 'stop',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.stop',
                        default: 'Car Stop'
                    }),
                    func: 'stop',
                    sepafter: 36
                },

                {
                    opcode: 'buzzer',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.buzzer',
                        default: 'Buzzer [FREQ]hz [DURATION]ms'
                    }),
                    arguments: {
                        FREQ: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 200
                        },
                        DURATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 500
                        }
                    },
                    func: 'buzzer'
                },
                {
                    opcode: 'playmusic',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.playmusic',
                        default: 'Play Music [NOTE]'
                    }),
                    arguments: {
                        NOTE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'g5:1 d c g4:2 b:1 c5:3 '
                        }
                    },
                    func: 'playmusic'
                },
                {
                    opcode: 'sensor',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'MiniLFR.sensor',
                        default: 'Linefollow Sensor [SENSOR]'
                    }),
                    arguments: {
                        SENSOR: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 2,
                            menu: 'lfrSensor'
                        }
                    },
                    func: 'sensor'
                },
                {
                    opcode: 'distance',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'MiniLFR.distance',
                        default: 'Distance'
                    }),
                    func: 'distance'
                },
                {
                    opcode: 'power',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'MiniLFR.power',
                        default: 'Power'
                    }),
                    func: 'power'
                },
                {
                    opcode: 'button',
                    blockType: BlockType.BOOLEAN,

                    text: formatMessage({
                        id: 'MiniLFR.button',
                        default: 'Button [BUTTON]'
                    }),
                    arguments: {
                        BUTTON: {
                            type: ArgumentType.STRING,
                            defaultValue: '1',
                            menu: 'buttons'
                        }
                    },
                    func: 'button'
                },
                {
                    opcode: 'wheninfraget',
                    blockType: BlockType.HAT,

                    text: formatMessage({
                        id: 'MiniLFR.wheninfraget',
                        default: 'If Infra Got [CMD]'
                    }),
                    arguments: {
                        CMD: {
                            type: ArgumentType.STRING,
                            menu: 'infraCmd',
                            defaultValue: 'FFA857'
                        }
                    },
                    isEdgeActivated: false,

                    func: 'wheninfraget'
                },
                {
                    opcode: 'whenbutton',
                    blockType: BlockType.HAT,

                    text: formatMessage({
                        id: 'MiniLFR.whenbutton',
                        default: 'When Button [CMD]'
                    }),
                    arguments: {
                        CMD: {
                            type: ArgumentType.STRING,
                            menu: 'buttonList',
                            defaultValue: 'E0EE0A'
                        }
                    },
                    isEdgeActivated: false,
                    func: 'whenbutton'
                },
                {
                    opcode: 'infrarx',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'MiniLFR.infrarx',
                        default: 'Infra Receive'
                    }),
                    func: 'infrarx'
                },
                {
                    opcode: 'infratx',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.infratx',
                        default: 'Infra Send [SEND]'
                    }),
                    arguments: {
                        SEND: {
                            type: ArgumentType.STRING,
                            defaultValue: '1234'
                        }
                    },
                    func: 'infratx'
                },
                {
                    opcode: 'mp3play',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.mp3play',
                        default: 'MP3 Play'
                    }),
                    func: 'mp3play'
                },
                {
                    opcode: 'mp3loop',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.mp3loop',
                        default: 'MP3 [DIR]'
                    }),
                    arguments: {
                        DIR: {
                            type: ArgumentType.STRING,
                            defaultValue: 'NEXT',
                            menu: 'mp3direction'
                        }
                    },
                    func: 'mp3loop'
                },
                {
                    opcode: 'mp3volumn',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.mp3volumn',
                        default: 'MP3 Volumn [VOLUMN]'
                    }),
                    arguments: {
                        VOLUMN: {
                            type: ArgumentType.STRING,
                            menu: 'volumnList',
                            defaultValue: 1
                        }
                    },
                    func: 'mp3volumn',
                    sepafter: 36
                },
                {
                    opcode: 'ledstring',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.ledstring',
                        default: 'LED Matrix [STR]'
                    }),
                    arguments: {
                        STR: {
                            type: ArgumentType.STRING,
                            defaultValue: 'hello world'
                        }
                    },
                    func: 'ledstring'
                },
                {
                    opcode: 'ledmatrix',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.ledmatrix',
                        default: 'LED Matrix [MAT]'
                    }),
                    arguments: {
                        MAT: {
                            type: ArgumentType.LEDMATRIX,
                            defaultValue: '00000000024000000000042003c00000'
                        }
                    },
                    func: 'ledmatrix'
                },
                {
                    opcode: 'ledmatrixclear',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MiniLFR.ledmatrixclear',
                        default: 'LED Matrix Clear'
                    }),
                    func: 'ledmatrixclear'
                }
            ],
            menus: {
                // todo: refactor menu to text and value type
                eyeIndex: [{text: 'ON', value: '1'}, {text: 'OFF', value: '0'}],
                motorIndex: [{text: 'LEFT', value: '1'}, {text: 'RIGHT', value: '2'}, {text: 'ALL', value: '0'}],
                rgbIndex: [{text: 'LEFT', value: '1'}, {text: 'RIGHT', value: '2'}, {text: 'ALL', value: '0'}],
                noteIndex: [
                    {text: 'Do', value: '261'},
                    {text: 'Re', value: '294'},
                    {text: 'Mi', value: '329'},
                    {text: 'Fa', value: '349'},
                    {text: 'So', value: '392'},
                    {text: 'Ra', value: '440'},
                    {text: 'Si', value: '493'}
                ],
                beatIndex: [
                    {text: '1/8', value: '125'},
                    {text: '1/4', value: '250'},
                    {text: '1/2', value: '500'},
                    {text: '1', value: '1000'},
                    {text: '2', value: '2000'}
                ],
                infraCmd: [
                    {text: 'POWER', value: 'FFA25D'},
                    {text: 'MENU', value: 'FF629D'},
                    {text: 'MUTE', value: 'FFE21D'},
                    {text: 'MODE', value: 'FF22DD'},
                    {text: '+', value: 'FF02FD'},
                    {text: 'RETURN', value: 'FFC23D'},
                    {text: 'BACK', value: 'FFE01F'},
                    {text: 'PLAY', value: 'FFA857'},
                    {text: 'FORWARD', value: 'FF906F'},
                    {text: '0', value: 'FF6897'},
                    {text: '-', value: 'FF9867'},
                    {text: 'OK', value: 'FFB04F'},
                    {text: '1',value: 'FF30CF'},
                    {text: '2', value: 'FF18E7'},
                    {text: '3',value: 'FF7A85'},
                    {text: '4', value: 'FF10EF'},
                    {text: '5', value: 'FF38C7'},
                    {text: '6', value: 'FF5AA5'},
                    {text: '7', value: 'FF42BD'},
                    {text: '8', value: 'FF4AB5'},
                    {text: '9', value: 'FF52AD'}
                ],
                rgbPix: this.buildMenu_(['ALL', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15']),
                lfrSensor: this.buildMenu_(['0', '1', '2', '3', '4']),
                buttons: ['1', '2'],
                buttonList: [
                    {text: '1', value: 'E0EE0A'},
                    {text: '2', value: 'E0EE0B'}
                ],
                mp3direction: [
                    {
                        text: formatMessage({
                            id: 'MiniLFR.next',
                            default: 'Next'
                        }),
                        value: 0
                    },
                    {
                        text: formatMessage({
                            id: 'MiniLFR.previous',
                            default: 'Previous'
                        }),
                        value: 1
                    }
                ],
                volumnList: [
                    {text: 'UP', value: '0'},
                    {text: 'DOWN', value: '1'}
                ]
            }
        };

    }

    buildMenu_ (info){
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry;
            obj.value = String(index);
            return obj;
        });
    }

    noop (){

    }

    spotlight (args){
        const cmd = `M6 ${args.LEFT} ${args.RIGHT}\r\n`;
        this.write(cmd);
    }

    wheelspeed (args){
        const cmd = `M200 ${Math.floor(args.SPDL)} ${Math.floor(args.SPDR)}\r\n`;
        this.write(cmd);
    }

    power (args){
        const cmd = `M8 \r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    wheelspeeddelay (args){
        let cmd = `M202 ${Math.floor(args.SPDL)} ${Math.floor(args.SPDR)} ${args.DELAY}\r\n`;
        this.write(cmd);
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    stop (args){
        let cmd = `M200 0 0\r\n`;
        this.write(cmd);
    }

    sensor (args){
        let cmd = `M1 ${args.SENSOR}\r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    threshold (args){
        let cmd = `M4 ${args.SENSOR}\r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    pid (args){
        let cmd = `M3 ${args.P} ${args.I} ${args.D}\r\n`;
        this.write(cmd);
    }


    distance (args){
        let cmd = `M7 \r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    power (args){
        let cmd = `M8 \r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    button (args){
        let cmd = `M9 ${args.BUTTON}\r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    infrarx (args){
        let cmd = `M11 \r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    infratx (args){
        let cmd = `M12 ${args.SEND}\r\n`;
        this.write(cmd);
    }

    rgbbrightness (args){
        let cmd = `M14 ${args.BRIGHT}\r\n`;
        this.write(cmd);
    }

    rgbHead (args){
        const color = hexToRgb(args.COLOR);
        let cmd = `M16 ${args.INDEX} ${color.r} ${color.g} ${color.b}\r\n`;
        this.write(cmd);
    }

    rgbHeadOff (args){
        let cmd = `M16 0 0 0 0\r\n`;
        this.write(cmd);
    }

    rgbRing (args){
        const color = hexToRgb(args.COLOR);
        if (args.INDEX === 'ALL'){
            args.INDEX = 0;
        }
        let cmd = `M22 ${args.INDEX} ${color.r} ${color.g} ${color.b}\r\n`;
        this.write(cmd);
    }

    rgbRingOff (args){
        let cmd = `M22 0 0 0 0\r\n`;
        this.write(cmd);
    }

    rgbBottom (args){
        const color = hexToRgb(args.COLOR);
        let cmd = `M13 ${args.INDEX} ${color.r} ${color.g} ${color.b}\r\n`;
        this.write(cmd);
    }

    rgbBottomOff (args){
        let cmd = `M13 0 0 0 0\r\n`;
        this.write(cmd);
    }

    buzzer (args){
        let cmd = `M18 ${args.FREQ} ${args.DURATION}\r\n`;
        this.write(cmd);
    }

    playmusic (args){
        let cmd = `M17 ${args.NOTE}\r\n`;
        this.write(cmd);
    }

    wheninfraget (args){
        return true;
    }

    whenbutton (args){
        return true;
    }

    ledstring (args){
        let cmd = `M20 ${args.STR}\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    ledmatrix (args){
        let cmd = `M21 ${args.MAT}\r\n`;
        this.write(cmd);
    }

    ledmatrixclear (args){
        let cmd = `M21 00000000000000000000000000000000\r\n`;
        this.write(cmd);
    }

    mp3play (args){
        let cmd = `M30 0 0 100\r\n`;
        this.write(cmd);
    }

    mp3loop (args){
        let cmd = `M30 0 1 100\r\n`;
        if (args.DIR === 1){
            cmd = `M30 1 0 100\r\n`;
        }
        this.write(cmd);
    }

    mp3volumn (args){
        let cmd = `M30 0 1 500\r\n`;
        if (args.VOLUMN === 'UP'){
            cmd = `M30 1 0 500\r\n`;
        }
        this.write(cmd);
    }

    parseTrig (msg){
        let tmp = msg.trim().split(' ');
        const code = parseInt(tmp[2], 16);
        if (tmp[1] === 'infra'){
            this.runtime.startHats('MiniLFR_wheninfraget', {infraCmd: tmp[2].toUpperCase()});
        } else if (tmp[1] === 'btn'){
            this.runtime.startHats('MiniLFR_whenbutton', {buttonList: tmp[2].toUpperCase()});
        }
    }

    parseCmd (msg){
        let tmp = msg.trim().split(' ');
        tmp = tmp.filter(n => { return n !== ''});
        if (tmp[0].indexOf('M10') > -1){
            return parseInt(tmp[1], 10);
        } else if (tmp[0].indexOf('M11') > -1){
            if (infraMap.hasOwnProperty(tmp[1])){
                const infraCmd = infraMap[tmp[1]];
                return infraCmd;
            }
            if (tmp[1] === 'FFFFFFFF'){
                return 'None';
            }
            return tmp[1];
        } else if (tmp[0].indexOf('M20') > -1 ||
            tmp[0].indexOf('M22') > -1){
            return null;
        } else if (tmp[0].indexOf('M4') > -1){
            return parseInt(tmp[2], 10);
        } else if (tmp[0].indexOf('M7') > -1){
            return parseFloat(tmp[1]);
        } else if (tmp[0].indexOf('M8') > -1){
            return parseFloat(tmp[1]);
        } else if (tmp[0].indexOf('M9') > -1){
            return parseInt(tmp[1], 10);
        } else if (tmp[0].indexOf('M1') > -1){
            return parseInt(tmp[2], 10);
        }
    }
}

module.exports = MiniLFR;
