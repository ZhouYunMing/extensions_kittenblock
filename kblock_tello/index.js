/**
 * Created by Riven on 2018/5/27.
 */

const ArgumentType = Scratch.ArgumentType;
const BlockType = Scratch.BlockType;
const formatMessage = require('format-message');
const log = Scratch.log;

const isNumber = n => {
    n = n.replace(/'/g, '')
    return !isNaN(parseFloat(n)) && isFinite(n);
};

class TelloExtension {
    constructor (runtime){
        this.runtime = runtime;
        this.comm = runtime.ioDevices.comm;
        this.session = null;
        this.runtime.registerExtensionDevice('Tello', this);
        // session callbacks
        this.onmessage = this.onmessage.bind(this);
        this.onclose = this.onclose.bind(this);

        this.decoder = new TextDecoder();
        this.lineBuffer = '';
        this.hostIP = '192.168.10.1';
        this.hostPort = 8889;
        this.rxport = 12345;
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
        this.comm.ping(this.hostIP).then(result => {
            this.runtime.emit(this.runtime.constructor.PERIPHERAL_LIST_UPDATE, result);
        });
    }

    connectDevice (id){
        this.comm.connectUDP(id, this.hostIP, this.hostPort, this.rxport).then(sess => {
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
            id: 'Tello',

            name: 'Tello',
            color1: '#5b8c00',
            color2: '#3f6600',
            color3: '#254000',
            showStatusButton: true,

            blocks: [
                {
                    opcode: 'command',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.command',
                        default: 'Arm Flight'
                    }),
                    func: 'command'
                },
                {
                    opcode: 'takeOff',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.takeOff',
                        default: 'Take Off'
                    }),
                    func: 'takeOff'
                },
                {
                    opcode: 'land',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.land',
                        default: 'Land'
                    }),
                    func: 'land'
                },
                {
                    opcode: 'flyUp',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flyUp',
                        default: 'Up [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'flyUp'
                },
                {
                    opcode: 'flyDown',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flyDown',
                        default: 'Down [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'flyDown'
                },
                {
                    opcode: 'flyFw',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flyFw',
                        default: 'Forward [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'flyFw'
                },
                {
                    opcode: 'flyBack',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flyBack',
                        default: 'Back [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'flyBack'
                },
                {
                    opcode: 'flyLeft',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flyLeft',
                        default: 'Left [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'flyLeft'
                },
                {
                    opcode: 'flyRight',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flyRight',
                        default: 'Right [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'flyRight'
                },
                {
                    opcode: 'rollCw',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.rollCw',
                        default: 'Roll Cw [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        }
                    },
                    func: 'rollCw'
                },
                {
                    opcode: 'rollCcw',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.rollCcw',
                        default: 'Roll CCW [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        }
                    },
                    func: 'rollCcw'
                },
                {
                    opcode: 'setSpeed',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.setSpeed',
                        default: 'Speed [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'setSpeed'
                },
                {
                    opcode: 'getBattery',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'Tello.getBattery',
                        default: 'Battery?'
                    }),
                    func: 'getBattery'
                }
            ],
            menus: {

            },
            translation_map: {
                'zh-cn': {

                }
            }
        };
    }

    noop (){

    }

    command (args){
        const cmd = 'command';
        this.write(cmd);
    }

    takeOff (args){
        const cmd = 'takeoff';
        this.write(cmd);
    }

    land (args){
        const cmd = 'land';
        this.write(cmd);
    }

    flyUp (args){
        const cmd = `up ${args.LEN}`;
        this.write(cmd);
    }

    flyDown (args){
        const cmd = `down ${args.LEN}`;
        this.write(cmd);
    }

    flyFw (args){
        const cmd = `forward ${args.LEN}`;
        this.write(cmd);
    }

    flyBack (args){
        const cmd = `back ${args.LEN}`;
        this.write(cmd);
    }

    flyLeft (args){
        const cmd = `left ${args.LEN}`;
        this.write(cmd);
    }

    flyRight (args){
        const cmd = `right ${args.LEN}`;
        this.write(cmd);
    }

    rollCw (args){
        const cmd = `cw ${args.LEN}`;
        this.write(cmd);
    }

    rollCcw (args){
        const cmd = `ccw ${args.LEN}`;
        this.write(cmd);
    }

    setSpeed (args){
        const cmd = `speed ${args.LEN}`;
        this.write(cmd);
    }

    getBattery (args){
        const cmd = 'battery?';
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }


    parseCmd (msg){
        msg = msg.toString();
        if (isNumber(msg)){
            return parseInt(msg, 10);
        } else {
            return msg;
        }
    }
}

module.exports = TelloExtension;
