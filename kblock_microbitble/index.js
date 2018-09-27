/**
 * Created by Riven on 2018/2/28.
 */

const ArgumentType = Scratch.ArgumentType;
const BlockType = Scratch.BlockType;
const formatMessage = require('format-message');
const log = Scratch.log;

class MicrobitBleExtension {
    constructor (runtime){
        this.runtime = runtime;
        this.comm = runtime.ioDevices.kblock;
        this.session = null;
        this.runtime.registerPeripheralExtension('MicrobitBleExtension', this);
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

/**
 * @return {object} This extension's metadata.
 */
    getInfo () {
        return {
            id: 'MicrobitBle',

            name: 'MicrobitBle',
            color1: '#40BF4A',
            color2: '#2E8934',
            color3: '#2E8934',

            blocks: [
                {
                    opcode: 'dpadevent',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicrobitBle.dpadevent',
                        default: 'DPAD Event [DPADEVENT]'
                    }),
                    arguments: {
                        DPADEVENT: {
                            type: ArgumentType.STRING,
                            defaultValue: 1,
                            menu: 'DPadEvent'
                        }
                    },
                    func: 'dpadevent'
                },
                {
                    opcode: 'showledmat',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicrobitBle.showledmat',
                        default: 'Show ICON [ICON]'
                    }),
                    arguments: {
                        ICON: {
                            type: ArgumentType.BITLEDS,
                            defaultValue: '90009:09090:00900:09090:90009'
                        }
                    },
                    func: 'showledmat'
                },
                {
                    opcode: 'showstring',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicrobitBle.showstring',
                        default: 'Show String [STR]'
                    }),
                    arguments: {
                        STR: {
                            type: ArgumentType.STRING,
                            defaultValue: 'hello'
                        }
                    },
                    func: 'showstring',
                    sepafter: 36
                },
                {
                    opcode: 'ioservice',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicrobitBle.ioservice',
                        default: 'IO [PIN] Set [VALUE]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: 'P1',
                            menu: 'bitPins'
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    },
                    func: 'ioservice',
                    sepafter: 36
                },
                {
                    opcode: 'tempservice',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'MicrobitBle.tempservice',
                        default: 'Temperature'
                    }),
                    arguments: {
                    },
                    func: 'tempservice'
                },
                {
                    opcode: 'accelerometer',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'MicrobitBle.accelerometer',
                        default: 'Accelero Meter [DIRECTION]'
                    }),
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'accMenu',
                            defaultValue: 'x'
                        }
                    },
                    func: 'accelerometer'
                },
                {
                    opcode: 'button',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'MicrobitBle.button',
                        default: 'Button [BUTTON]'
                    }),
                    arguments: {
                        BUTTON: {
                            type: ArgumentType.STRING,
                            defaultValue: 'A',
                            menu: 'buttonMenu'
                        }
                    },
                    func: 'button',
                    sepafter: 36
                },
                {
                    opcode: 'uartstart',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicrobitBle.uartstart',
                        default: 'Uart Start Listening'
                    }),
                    isEdgeActivated: false,
                    func: 'uartstart'
                },
                {
                    opcode: 'whenuartget',
                    blockType: BlockType.HAT,

                    text: formatMessage({
                        id: 'MicrobitBle.whenuartget',
                        default: 'When uart got [CMD]'
                    }),
                    arguments: {
                        CMD: {
                            type: ArgumentType.STRING,
                            defaultValue: 'hello'
                        }
                    },
                    isEdgeActivated: false,
                    func: 'whenuartget'
                },
                {
                    opcode: 'uartsend',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicrobitBle.uartsend',
                        default: 'Uart send [STR]'
                    }),
                    arguments: {
                        STR: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello'
                        }
                    },
                    func: 'uartsend'
                }
            ],
            menus: {
                DPadEvent: [{text: 'A', value: 1}, {text: 'B', value: 3}, {text: 'C', value: 5}, {text: 'D', value: 7}, {text: '1', value: 9}, {text: '2', value: 11}, {text: '3', value: 13}, {text: '4', value: 15}],
                bitPins: ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8',
                    'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16', 'P19', 'P20'],
                buttonMenu: ['A', 'B'],
                accMenu: ['x', 'y', 'z']
            },
            translation_map: {
                'zh-cn': {
                    'showledmat': '显示矩阵 [ICON]',
                    'showstring': '显示文字 [STR]',
                    'ioservice': 'IO [PIN] 值 [VALUE]',
                    'tempservice': '温度',
                    'accelerometer': '陀螺仪 [DIRECTION]',
                    'button': '按键 [BUTTON]',
                    'uartstart': '蓝牙监听初始化',
                    'whenuartget': '当接收蓝牙消息[CMD]',
                    'uartsend': '蓝牙发送消息[STR]',
                }
            }
        };
    };

    noop (){
    };

    // todo only press down event here~
    //const dpadeventMap = {A: 1, B: 3, C: 5, D: 7, 1: 9, 2: 11, 3: 13, 4: 15};

    dpadevent (args){
        let evt = dpadeventMap[args.DPADEVENT];
        if (evt){
            let cmd = [0x50, 0x04, evt, 0x00];
            const servieUUID = 'E95D93AF-251D-470A-A062-FA1922DFA9A8';
            const eventCharUUID = 'E95D5404-251D-470A-A062-FA1922DFA9A8';
            this.comm.sendRemoteNotification('ble', {cmd: cmd, suuid: servieUUID, cuuid: eventCharUUID});
        }
    };

    ioservice (args){
        const servieUUID = 'E95D127B-251D-470A-A062-FA1922DFA9A8';
        const eventCharUUID = 'E95D8D00-251D-470A-A062-FA1922DFA9A8';
        const buff = [0,0];
        buff[0] = parseInt(args.PIN.substring(1), 10);
        buff[1] = parseInt(args.VALUE, 10);
        this.comm.sendRemoteNotification('ble', {cmd: buff, suuid: servieUUID, cuuid: eventCharUUID});
    };

    showledmat (args){
        const buff = [];
        const mat = args.ICON;
        const ary = mat.split(':');
        for (const a of ary){
            let b = 0;
            for (let i = 0; i < 5; i++){
                if (a[i] !== '0'){
                    b += (1 << (4 - i));
                }
            }
            buff.push(b);
        }
        const servieUUID = 'E95DD91D-251D-470A-A062-FA1922DFA9A8';
        const eventCharUUID = 'E95D7B77-251D-470A-A062-FA1922DFA9A8';
        this.comm.sendRemoteNotification('ble', {cmd: buff, suuid: servieUUID, cuuid: eventCharUUID});
    };

    showstring (args){
        const servieUUID = 'E95DD91D-251D-470A-A062-FA1922DFA9A8';
        const eventCharUUID = 'E95D93EE-251D-470A-A062-FA1922DFA9A8';
        this.comm.sendRemoteNotification('ble', {cmd: args.STR, suuid: servieUUID, cuuid: eventCharUUID});
    };

    tempservice (args){
        const servieUUID = 'E95D6100-251D-470A-A062-FA1922DFA9A8';
        const eventCharUUID = 'E95D9250-251D-470A-A062-FA1922DFA9A8';
        return this.comm.sendRemoteRequest('bleread', {service: 'temp', suuid: servieUUID, cuuid: eventCharUUID}).then(ret => this.bleCmd(ret));
    };

    accelerometer (args){
        const servieUUID = 'E95D0753-251D-470A-A062-FA1922DFA9A8';
        const eventCharUUID = 'E95DCA4B-251D-470A-A062-FA1922DFA9A8';
        return this.comm.sendRemoteRequest('bleread', {service: 'acc', arg: args.DIRECTION, suuid: servieUUID, cuuid: eventCharUUID}).then(ret => this.bleCmd(ret));
    };

    button (args){
        const servieUUID = 'E95D9882-251D-470A-A062-FA1922DFA9A8';
        const btnAUUID = 'E95DDA90-251D-470A-A062-FA1922DFA9A8';
        const btnBUUID = 'E95DDA91-251D-470A-A062-FA1922DFA9A8';
        if (args.BUTTON === 'A'){
            return this.comm.sendRemoteRequest('bleread', {service: 'btnA', suuid: servieUUID, cuuid: btnBUUID}).then(ret => this.bleCmd(ret));
        }
        return this.comm.sendRemoteRequest('bleread', {service: 'btnB', suuid: servieUUID, cuuid: btnBUUID}).then(ret => this.bleCmd(ret));
    };

    uartstart (args){
        const servieUUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
        const eventCharUUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
        this.comm.sendRemoteNotification('blelisten', {suuid: servieUUID, cuuid: eventCharUUID});
        this.comm.regParser(eventCharUUID, json => {
            let str = '';
            for (let i = 0; i < json.params.data.length; i++){
                const t = String.fromCharCode(json.params.data[i]);
                if (t === '.' || t === '\n' || t === ''){
                    break;
                }
                str += t;
            }
            window.vm.runtime.startHats('MicrobitBle_whenuartget', {TEXT: str});
        });
    };

    uartsend (args){
        const servieUUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
        const eventCharUUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
        const str = args.STR + '\n';
        const buff = [];
        for (let i = 0; i < str.length; i++){
            buff.push(str.charCodeAt(i));
        }
        this.comm.sendRemoteNotification('ble', {cmd: buff, suuid: servieUUID, cuuid: eventCharUUID});
    };

    whenuartget (args){
        return true; // hat match filtered
    };

    bleCmd (result) {
        const {data, service, arg} = result;
        if (service === 'acc'){
            const xyz = new Int16Array(new Uint8Array(data).buffer)
            if (arg === 'x'){
                return xyz[0];
            } else if (arg === 'y'){
                return xyz[1];
            } else {
                return xyz[2];
            }
        }
        return data;
    };
}
module.exports = MicrobitBleExtension;
