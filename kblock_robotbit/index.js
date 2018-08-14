/**
 * Created by Riven on 2017/11/3 0003.
 */

const ArgumentType = Scratch.ArgumentType;
const BlockType = Scratch.BlockType;
const formatMessage = require('format-message');
const log = Scratch.log;

const hexToRgb = hex => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

class RobotBit {
    constructor (runtime){
        this.runtime = runtime;
        this.comm = runtime.ioDevices.comm;
        this.session = null;
        this.runtime.registerExtensionDevice('RobotBit', this);
        // session callbacks
        this.onmessage = this.onmessage.bind(this);
        this.onclose = this.onclose.bind(this);

        this.decoder = new TextDecoder();
        this.lineBuffer = '';
    }

    write (data){
        if (!this.session){
            this.session = this.runtime.extensionDevices.MicroBit.session;
        }
        if (!data.endsWith('\n')) data += '\n';
        if (this.session){
            this.session.write(data);
        }
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


    /**
     * @return {object} This extension's metadata.
     */
    getInfo (){
        return {
            id: 'RobotBit',

            name: 'RobotBit',
            color1: '#1395BA',
            color2: '#107895',
            color3: '#107895',

            blocks: [
                {
                    opcode: 'motorrun',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'RobotBit.motorrun',
                        default: 'Motor [MOTOR] Move [SPEED]'
                    }),
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            menu: 'motorIndex',
                            defaultValue: 1
                        },
                        SPEED: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        }
                    },
                    func: 'motorrun'
                },
                {
                    opcode: 'motordelay',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'RobotBit.motordelay',
                        default: 'Motor [MOTOR] Move [SPEED] Delay [DELAY]'
                    }),
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            menu: 'motorIndex',
                            defaultValue: 1
                        },
                        SPEED: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        },
                        DELAY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 2000
                        }
                    },
                    func: 'motordelay'
                },
                {
                    opcode: 'stop',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'RobotBit.stop',
                        default: 'Motor [MOTOR] Stop'
                    }),
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            menu: 'motorIndex',
                            defaultValue: 1
                        }
                    },
                    func: 'stop'
                },
                {
                    opcode: 'stepper',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'RobotBit.stepper',
                        default: 'Stepper Turn M1[DEG1]° M2[DEG2]°'
                    }),
                    arguments: {
                        DEG1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 360
                        },
                        DEG2: {
                            type: ArgumentType.NUMBER,
                            defaultValue: -360
                        }
                    },
                    func: 'stepper'
                },
                {
                    opcode: 'servo',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'RobotBit.servo',
                        default: 'Servo [CHANNEL] Degree [DEGREE]'
                    }),
                    arguments: {
                        CHANNEL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'S1',
                            menu: 'servoIndex'
                        },
                        DEGREE: {
                            type: ArgumentType.SLIDERSERVO,
                            defaultValue: 90
                        }
                    },
                    func: 'servo'
                },
                {
                    opcode: 'geekservo',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'RobotBit.geekservo',
                        default: 'Geek Servo [CHANNEL] Degree [DEGREE]'
                    }),
                    arguments: {
                        CHANNEL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'S1',
                            menu: 'servoIndex'
                        },
                        DEGREE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        }
                    },
                    func: 'geekservo',
                    sepafter: 36
                },
                {
                    opcode: 'rgb-pixel',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'RobotBit.rgb-pixel',
                        default: 'RGB [INDEX] [COLOR]'
                    }),
                    arguments: {
                        INDEX: {
                            type: ArgumentType.STRING,
                            menu: 'rgbPix',
                            defaultValue: '1'
                        },
                        COLOR: {
                            type: ArgumentType.COLORRGB
                        }
                    },
                    func: 'rgbpixel'
                },
                {
                    opcode: 'rgb-show',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'RobotBit.rgb-show',
                        default: 'RGB Show'
                    }),
                    func: 'rgbshow'
                },
                {
                    opcode: 'rgb-clear',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'RobotBit.rgb-clear',
                        default: 'RGB Clear'
                    }),
                    func: 'rgbclear'
                },
                {
                    opcode: 'ultrasonic',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'RobotBit.ultrasonic',
                        default: 'Ultrasonic [PIN]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: 'P2',
                            menu: 'bitPins'
                        }
                    },
                    func: 'ultrasonic'
                }

            ],
            menus: {
                motorIndex: [
                    {text: 'ALL', value: 0},
                    {text: 'M1A', value: 1},
                    {text: 'M1B', value: 2},
                    {text: 'M2A', value: 3},
                    {text: 'M2B', value: 4}
                ],
                stepperIndex: ['M1', 'M2'],
                stepperDir: ['FORWARD', 'BACKWARD'],
                servoIndex: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
                rgbPix: ['All', '1', '2', '3', '4'],
                bitPins: ['P0', 'P1', 'P2', 'P3']
            },
            translation_map: {
                'zh-cn': {
                    'motorrun': '电机 [MOTOR] 速度 [SPEED]',
                    'motordelay': '电机 [MOTOR] 速度 [SPEED] 延时 [DELAY]',
                    'stepper': '步进电机 转动 M1[DEG1]° M2[DEG2]°',
                    'stop': '电机[MOTOR]停止',
                    'servo': '舵机 [CHANNEL] 角度 [DEGREE]',
                    'ultrasonic': '超声波 [PIN]',
                    'rgb-show': 'RGB 显示',
                    'rgb-clear': 'RGB 清除'
                }
            }
        };
    }

    noop () {

    }

    motorrun (args){
        const nanocode = `robotbit.motor(${motorMap[args.MOTOR]}, ${args.SPEED}, 0)\r\n`;
        this.write(nanocode);
    }

    motordelay (args){
        const nanocode = `print("M10 ", robotbit.motor(${motorMap[args.MOTOR]}, ${args.SPEED}, ${args.DELAY}))\r\n`;
        return this.report(nanocode, null, 'M10').then(ret => this.parseCmd(ret));
    }

    stop (args){
        const nanocode = `robotbit.motorstop(${motorMap[args.MOTOR]})\r\n`;
        this.write(nanocode);
    }

    stepper (args){
        const nanocode = `print("M10 ", robotbit.stepper(${args.DEG1}, ${args.DEG2}))\r\n`;
        return this.report(nanocode, null, 'M10').then(ret => this.parseCmd(ret));
    }

    servo (args){
        const ch = parseInt(args.CHANNEL[1], 10) - 1;
        const nanocode = `robotbit.servo(${ch}, ${args.DEGREE})\r\n`;
        this.write(nanocode);
    }

    geekservo (args){
        const ch = parseInt(args.CHANNEL[1], 10) - 1;
        const deg = Math.floor(((args.DEGREE - 90) / 1.5) + 90);
        const nanocode = `robotbit.servo(${ch}, ${deg})\r\n`;
        this.write(nanocode);
    }

    rgbpixel (args){
        let idx = args.INDEX;
        const c = hexToRgb(args.COLOR);
        let nanocode = '';
        if (idx === 'All'){
            nanocode = 'for i in range(4):\n';
            nanocode += `    np[i] = (${c.r}, ${c.g}, ${c.b})\n`;
        } else {
            idx = parseInt(idx) - 1;
            nanocode = `np[${idx}] = (${c.r}, ${c.g}, ${c.b})\r\n`;
        }
        this.write(nanocode);
    }

    rgbshow (args){
        const nanocode = `np.show()\r\n`;
        this.write(nanocode);
    }

    rgbclear (args){
        const nanocode = `np.clear()\r\n`;
        this.write(nanocode);
    }

    ultrasonic (args){
        let pin = args.PIN;
        pin = pin.substring(1);
        const nanocode = `print("M7 ", robotbit.sonar(pin${pin}))\r\n`;
        return this.report(nanocode, null, 'M7').then(ret => this.parseCmd(ret));
    }
}
module.exports = RobotBit;
