/**
 * Created by Riven on 17/9/24.
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

class Kittenbot {
    constructor (runtime){
        this.runtime = runtime;
        this.comm = runtime.ioDevices.comm;
        this.session = null;
        this.runtime.registerExtensionDevice('KittenBot', this);
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


    /**
     * @return {object} This extension's metadata.
     */
    getInfo (){
        return {
            id: 'KittenBot',

            name: 'KittenBot',

            color1: '#DE5277',
            color2: '#AA3F5B',
            color3: '#AA3F5B',
            showStatusButton: true,

            blocks: [
                {
                    opcode: 'motorspeed',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.motorspeed',
                        default: 'Motor [MOTOR] Move [SPEED]'
                    }),
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            menu: 'motorIndex',
                            defaultValue: 'M1A'
                        },
                        SPEED: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        }
                    },
                    func: 'motorSpeed'
                },
                {
                    opcode: 'motordual',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.motordual',
                        default: 'Motor M1A[SPDM1A] M1B[SPDM1B]'
                    }),
                    arguments: {
                        SPDM1A: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        },
                        SPDM1B: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        }
                    },
                    func: 'motordual'
                },
                {
                    opcode: 'motordualdelay',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.motordualdelay',
                        default: 'Motor M1A[SPDM1A] M1B[SPDM1B] Delay[DELAY]ms'
                    }),
                    arguments: {
                        SPDM1A: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        },
                        SPDM1B: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        },
                        DELAY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 500
                        }
                    },
                    func: 'motordualdelay'
                },
                {
                    opcode: 'motorfour',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.motorfour',
                        default: 'Motor M1A[SPDM1A] M1B[SPDM1B] M2A[SPDM2A] M2B[SPDM2B]'
                    }),
                    arguments: {
                        SPDM1A: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 50
                        },
                        SPDM1B: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 50
                        },
                        SPDM2A: {
                            type: ArgumentType.SLIDER,
                            defaultValue: -50
                        },
                        SPDM2B: {
                            type: ArgumentType.SLIDER,
                            defaultValue: -50
                        }
                    },
                    func: 'motorfour'
                },
                {
                    opcode: 'omniwheel',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.omniwheel',
                        default: 'Omni Horizon[SPDX] Vertical[SPDY] Roll[SPDR]'
                    }),
                    arguments: {
                        SPDX: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        },
                        SPDY: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        },
                        SPDR: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 0
                        }
                    },
                    func: 'omniwheel'
                },
                {
                    opcode: 'stop',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.stop',
                        default: 'Motor Stop'
                    }),
                    func: 'motorStop',
                    sepafter: 36
                },
                {
                    opcode: 'stepperline',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.stepperline',
                        default: 'Stepper Draw Line [DISTANCE]cm'
                    }),
                    arguments: {
                        DISTANCE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'stepperLine'
                },
                {
                    opcode: 'stepperturn',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.stepperturn',
                        default: 'Stepper Turn Degree [DEGREE]'
                    }),
                    arguments: {
                        DEGREE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        }
                    },
                    func: 'stepperTurn'
                },
                {
                    opcode: 'stepperppm',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.stepperppm',
                        default: 'Stepper Pulse Per Meter [PPM]'
                    }),
                    arguments: {
                        PPM: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 14124
                        }
                    },
                    func: 'stepperppm'
                },
                {
                    opcode: 'stepperwheelbase',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.stepperwheelbase',
                        default: 'Stepper Wheel Base [WHEELBASE] M'
                    }),
                    arguments: {
                        WHEELBASE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.118
                        }
                    },
                    func: 'stepperwheelbase'
                },
                {
                    opcode: 'stepperarc',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.stepperarc',
                        default: 'Stepper Arc Radius [RADIUS] Degree [DEGREE]'
                    }),
                    arguments: {
                        RADIUS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        },
                        DEGREE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        }
                    },
                    func: 'stepperArc',
                    sepafter: 36
                },
                /*
                {
                    opcode: 'steppermove',
                    blockType: BlockType.COMMAND,

                    text: 'Stepper [STEPPER] DEGREE [DEGREE] RPM [RPM]',
                    arguments: {
                        STEPPER: {
                            type: ArgumentType.STRING,
                            menu: 'stepperIndex',
                            defaultValue: 'M1'
                        },
                        DEGREE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 360
                        },
                        RPM: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 11
                        }
                    },
                    func: 'steppermove',
                    sepafter: 36
                },
                */
                {
                    opcode: 'pinmode',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.pinmode',
                        default: 'Pin Mode [PIN] [MODE]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '13',
                            menu: 'rosbotPin'
                        },
                        MODE: {
                            type: ArgumentType.STRING,
                            menu: 'pinMode',
                            defaultValue: 'OUTPUT'
                        }
                    },
                    func: 'pinMode'
                },
                {
                    opcode: 'digitalwrite',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.digitalwrite',
                        default: 'Digital Write [PIN] [VALUE]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '13',
                            menu: 'rosbotPin'
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            menu: 'level',
                            defaultValue: 'HIGH'
                        }
                    },
                    func: 'digitalWrite'
                },
                {
                    opcode: 'analogwrite',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.analogwrite',
                        default: 'Analog Write [PIN] [VALUE]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'analogWritePin',
                            defaultValue: '11'
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
                        id: 'kittenbot.digitalread',
                        default: 'Digital Read [PIN]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '3',
                            menu: 'rosbotPin'
                        }
                    },
                    func: 'digitalRead'
                },
                {
                    opcode: 'analogread',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'kittenbot.analogread',
                        default: 'Analog Read [PIN]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: 'A0',
                            menu: 'analogPin'
                        }
                    },
                    func: 'analogRead'
                },
                {
                    opcode: 'led',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.led',
                        default: 'LED [PIN] [VALUE]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '13',
                            menu: 'rosbotPin'
                        },
                        VALUE: {
                            type: ArgumentType.STRING,
                            menu: 'onoff',
                            defaultValue: 'ON'
                        }
                    },
                    func: 'led',
                    sepafter: 36

                },
                {
                    opcode: 'button',
                    blockType: BlockType.BOOLEAN,

                    text: formatMessage({
                        id: 'kittenbot.button',
                        default: 'Button [PIN]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '4',
                            menu: 'rosbotPin'
                        }
                    },
                    func: 'button'
                },
                {
                    opcode: 'servo',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.servo',
                        default: 'Servo pin[PIN] degree[DEGREE] speed[SPEED]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '4',
                            menu: 'extPin'
                        },
                        DEGREE: {
                            type: ArgumentType.SLIDERSERVO,
                            defaultValue: 90
                        },
                        SPEED: {
                            type: ArgumentType.SLIDERANALOGWR,
                            defaultValue: 128
                        }
                    },
                    func: 'servo'
                },
                {
                    opcode: 'geekservo',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.geekservo',
                        default: 'Geek Servo pin[PIN] degree[DEGREE] speed[SPEED]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '4',
                            menu: 'extPin'
                        },
                        DEGREE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        },
                        SPEED: {
                            type: ArgumentType.SLIDERANALOGWR,
                            defaultValue: 128
                        }
                    },
                    func: 'geekservo'
                },
                {
                    opcode: 'tone',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.tone',
                        default: 'Tone [PIN] [FREQ]hz [DURATION]ms'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: 'A0',
                            menu: 'rosbotPin'
                        },
                        FREQ: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 200
                        },
                        DURATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 500
                        }
                    },
                    func: 'tone'
                },
                {
                    opcode: 'rgb-brightness',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.rgb-brightness',
                        default: 'RGB Brightness [VALUE]'
                    }),
                    arguments: {
                        VALUE: {
                            type: ArgumentType.SLIDERANALOGWR,
                            defaultValue: 100
                        }
                    },
                    func: 'rgbbrightness'
                },
                {
                    opcode: 'rgb-pick',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.rgb-pick',
                        default: 'RGB Pin[PIN] Pixel[PIX] [COLOR]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '4',
                            menu: 'rosbotPin'
                        },
                        PIX: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        COLOR: {
                            type: ArgumentType.COLORRGB
                        }
                    },
                    func: 'rgbpick'
                },
                {
                    opcode: 'rgb',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.rgb',
                        default: 'RGB Pin[PIN] Pixel[PIX] R[RED] G[GREEN] B[BLUE]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '4',
                            menu: 'rosbotPin'
                        },
                        PIX: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1,
                            menu: 'rgbPix'
                        },
                        RED: {
                            type: ArgumentType.SLIDERANALOGWR,
                            defaultValue: 100
                        },
                        GREEN: {
                            type: ArgumentType.SLIDERANALOGWR,
                            defaultValue: 150
                        },
                        BLUE: {
                            type: ArgumentType.SLIDERANALOGWR,
                            defaultValue: 0
                        }
                    },
                    func: 'rgb'
                },
                {
                    opcode: 'rgb-off',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.rgb-off',
                        default: 'RGB [PIN] Off'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '4',
                            menu: 'rosbotPin'
                        }
                    },
                    func: 'rgboff'
                },
                {
                    opcode: 'distance',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'kittenbot.distance',
                        default: 'Distance [PIN]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '2',
                            menu: 'rosbotPin'
                        }
                    },
                    func: 'distance'
                },
                {
                    opcode: 'power',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'kittenbot.power',
                        default: 'Power'
                    }),
                    func: 'power',
                    sepafter: 36
                },
                {
                    opcode: 'ps2init',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.ps2init',
                        default: 'PS2 Init'
                    }),
                    func: 'ps2init'
                },
                {
                    opcode: 'ps2axis',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'kittenbot.ps2axis',
                        default: 'PS2 Axis [AXIS]'
                    }),
                    arguments: {
                        AXIS: {
                            type: ArgumentType.STRING,
                            defaultValue: 'L-X',
                            menu: 'axisList'
                        }
                    },
                    func: 'ps2axis'
                },
                {
                    opcode: 'ps2button',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'kittenbot.ps2button',
                        default: 'PS2 Button [BUTTON]'
                    }),
                    arguments: {
                        BUTTON: {
                            type: ArgumentType.STRING,
                            defaultValue: '▲',
                            menu: 'buttonList'
                        }
                    },
                    func: 'ps2button',
                    sepafter: 36
                },
                {
                    opcode: 'ledstring',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.ledstring',
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
                        id: 'kittenbot.ledmatrix',
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
                        id: 'kittenbot.ledmatrixclear',
                        default: 'LED Matrix Clear'
                    }),
                    func: 'ledmatrixclear'
                },
                {
                    opcode: 'ledmatrixrect',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.ledmatrixrect',
                        default: 'LED Matrix Rect x[X] y[Y] w[W] h[H] on/off[C]'
                    }),
                    arguments: {
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 2
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 2
                        },
                        W: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 3
                        },
                        H: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 3
                        },
                        C: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    },
                    func: 'ledmatrixrect'
                },
                {
                    opcode: 'mp3play',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.mp3play',
                        default: 'MP3 Play [IO1] [IO2]'
                    }),
                    arguments: {
                        IO1: {
                            type: ArgumentType.STRING,
                            defaultValue: '4',
                            menu: 'rosbotPin'
                        },
                        IO2: {
                            type: ArgumentType.STRING,
                            defaultValue: '7',
                            menu: 'rosbotPin'
                        }
                    },
                    func: 'mp3play'
                },
                {
                    opcode: 'mp3loop',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'kittenbot.mp3loop',
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
                        id: 'kittenbot.mp3volumn',
                        default: 'MP3 Volumn [VOLUMN]'
                    }),
                    arguments: {
                        VOLUMN: {
                            type: ArgumentType.STRING,
                            defaultValue: 'UP',
                            menu: 'volumnList'
                        }
                    },
                    func: 'mp3volumn',
                    sepafter: 36
                }
            ],


    /*const motorIndexMap = {M1A: 0, M1B: 1, M2A: 2, M2B: 3};
    const pinModeMap = {INPUT: 0, OUTPUT: 1, INPUT_PULLUP: 2};
    const levelMap = {HIGH: 1, LOW: 0};
    const onoffMap = {ON: 0, OFF: 1};*/

            menus: {
                pinMode: [{text: 'INPUT', value: 0}, {text: 'OUTPUT', value: 1}, {text: 'INPUT_PULLUP', value: 2}],
                level: [{text: 'HIGH', value: 1}, {text: 'LOW', value: 0}],
                onoff: [{text: 'ON', value: 0}, {text: 'OFF', value: 1}],
                motorIndex: [{text: 'M1A', value: 0}, {text: 'M1B', value: 1}, {text: 'M2A', value: 2}, {text: 'M2B', value: 3}],
                stepperIndex: ['M1', 'M2'],
                rosbotPin: ['2', '3', '4', '7', '8', '11', '12', '13', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
                extPin: ['4', '7', '8', '11', '12', '13', 'A0', 'A1', 'A2', 'A3'],
                rgbPix: ['ALL', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'],
                analogPin: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
                analogWritePin: ['11'],
                sensorList: ['Light', 'Voice'],
                colorList: ['RED', 'GREEN', 'BLUE'],
                axisList: ['L-X', 'L-Y', 'R-X', 'R-Y'],
                buttonList: [
                    '→', '↑', '↓', '←', '▲', '●', '×', '■', 'L1', 'L2', 'R1', 'R2'
                ],
                volumnList: ['UP', 'DOWN'],
                mp3direction: ['NEXT', 'PREVIOUS']
            },
            translation_map: {
                'zh-cn': {
                    'motorspeed': '电机 [MOTOR] 运动 [SPEED]',
                    'motordual': '双电机 M1A[SPDM1A] M1B[SPDM1B]',
                    'motordualdelay': '双电机 M1A[SPDM1A] M1B[SPDM1B] 延时[DELAY]毫秒',
                    'motorfour': '四电机 M1A[SPDM1A] M1B[SPDM1B] M2A[SPDM2A] M2B[SPDM2B]',
                    'stop': '电机停止',
                    'stepperline': '步进电机 直线 [DISTANCE]cm',
                    'stepperturn': '步进电机 转向 [DEGREE]',
                    'stepperarc': '步进电机 弧线 半径 [RADIUS] 角度 [DEGREE]',
                    'steppermove': '步进电机转动 [STEPPER] 角度 [DEGREE] RPM [RPM]',
                    'stepperppm': '步进电机 脉冲/米 [PPM]',
                    'stepperwheelbase': '步进电机 轮距 [WHEELBASE]米',
                    'pinmode': '引脚模式 [PIN] [MODE]',
                    'digitalwrite': '数字写 [PIN] [VALUE]',
                    'analogwrite': '模拟写 [PIN] [VALUE]',
                    'digitalread': '数字读 [PIN]',
                    'led': 'LED灯 [PIN] [VALUE]',
                    'analogread': '模拟读 [PIN]',
                    'button': '按键 引脚[PIN]',
                    'servo': '舵机 引脚[PIN] 角度[DEGREE] 速度[SPEED]',
                    'tone': '蜂鸣器 [PIN] [FREQ]hz [DURATION]毫秒',
                    'rgb-pick': '灯环RGB 引脚[PIN] 像素[PIX] [COLOR]',
                    'rgb': '灯环RGB 引脚[PIN] 像素[PIX] 红[RED] 绿[GREEN] 蓝[BLUE]',
                    'rgb-brightness': '灯环RGB 亮度 [VALUE]',
                    'rgb-off': '灯环RGB [PIN] 关闭',
                    'distance': '超声波距离 [PIN]',
                    'power': '电源电压',
                    'omniwheel': 'Omni 水平[SPDX] 垂直[SPDY] 旋转[SPDR]',
                    'temp18b20': '18B20 温度 [PIN]',
                    'colorSensor': '颜色传感器 [COLOR]',
                    'ps2init': 'PS2模块初始化',
                    'ps2axis': 'PS2手柄 轴 [AXIS]',
                    'ps2button': 'PS2手柄 按钮 [BUTTON]',
                    'ledstring': 'LED矩阵 [STR]',
                    'ledmatrix': 'LED矩阵 [MAT]',
                    'ledmatrixclear': 'LED矩阵 清屏',
                    'ledmatrixrect': 'LED矩阵 x[X] y[Y] 宽[W] 高[H] 亮[C]',
                    'pinMode': {'INPUT': '输入', 'OUTPUT': '输出', 'INPUT_PULLUP': '上拉输入'},
                    'mp3play': 'MP3 播放 [IO1] [IO2]',
                    'mp3volumn': 'MP3 音量 [VOLUMN]',
                    'mp3loop': 'MP3 [DIR]',
                    'mp3direction': {'NEXT': '下一首', 'PREVIOUS': '上一首'}
                },
                'zh-tw': {
                    'motorspeed': '馬達 [MOTOR] 速度 [SPEED]',
                    'motordual': '移動 M1A[SPDM1A] M1B[SPDM1B]',
                    'motordualdelay': '移動 M1A[SPDM1A] M1B[SPDM1B] 時間[DELAY]毫秒',
                    'motorfour': '四輪驅動 M1A[SPDM1A] M1B[SPDM1B] M2A[SPDM2A] M2B[SPDM2B]',
                    'stop': '停止移動',
                    'stepperline': '步進電機 直行 [DISTANCE]cm',
                    'stepperturn': '步進電機 車身轉向 [DEGREE]',
                    'stepperarc': '步進電機 弧線移動 半徑 [RADIUS] 角度 [DEGREE]',
                    'steppermove': '步進電機轉動 [STEPPER] 角度 [DEGREE] RPM [RPM]',
                    'stepperppm': '步進電機 脈衝/米 [PPM]',
                    'stepperwheelbase': '步進電機 輪距 [WHEELBASE]',
                    'pinmode': '腳位模式 [PIN] [MODE]',
                    'digitalwrite': '數位寫入 [PIN] [VALUE]',
                    'analogwrite': '類比寫入 [PIN] [VALUE]',
                    'digitalread': '數位讀取 [PIN]',
                    'led': 'LED燈 [PIN] [VALUE]',
                    'analogread': '類比讀取 [PIN]',
                    'button': '按鍵 腳位[PIN]',
                    'servo': '舵機 腳位[PIN] 角度[DEGREE] 速度[SPEED]',
                    'tone': '蜂鳴器 [PIN] [FREQ]hz [DURATION]毫秒',
                    'rgb-pick': '燈環RGB 腳位[PIN] 像素[PIX] [COLOR]',
                    'rgb': '燈環RGB 腳位[PIN] 像素[PIX] 紅[RED] 綠[GREEN] 藍[BLUE]',
                    'rgb-brightness': '燈環RGB 亮度 [VALUE]',
                    'rgb-off': '燈環RGB 腳位[PIN] 關閉',
                    'distance': '超音波距離 [PIN]',
                    'power': '電源電壓',
                    'temp18b20': '18B20 溫度 [PIN]',
                    'colorSensor': '顏色感應器 [COLOR]',
                    'ps2init': 'PS2模組初始化',
                    'ps2axis': 'PS2手柄 軸 [AXIS]',
                    'ps2button': 'PS2手柄 按鈕 [BUTTON]',
                    'ledstring': 'LED矩陣 [STR]',
                    'ledmatrix': 'LED矩陣 [MAT]',
                    'ledmatrixclear': 'LED矩陣 清屏',
                    'pinMode': {'INPUT': '輸入', 'OUTPUT': '輸出', 'INPUT_PULLUP': '上拉輸入'},
                    'mp3play': 'MP3 播放 [IO1] [IO2]',
                    'mp3volumn': 'MP3 音量 [VOLUMN]',
                    'mp3loop': 'MP3 [DIR]',
                    'mp3direction': {'NEXT': '下一首', 'PREVIOUS': '上一首'}
                }
            }

        };
    };




    noop (){

    }

    motorSpeed (args) {
        const cmd = `M200 ${motorIndexMap[args.MOTOR]} ${Math.floor(args.SPEED)}\r\n`;
        this.write(cmd);
    }

    motordual (args) {
        const cmd = `M204 ${Math.floor(args.SPDM1A)} ${Math.floor(args.SPDM1B)} 0\r\n`;
        this.write(cmd);
    }

    motordualdelay (args) {
        const cmd = `M204 ${Math.floor(args.SPDM1A)} ${Math.floor(args.SPDM1B)} ${args.DELAY}\r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    motorfour (args) {
        const cmd = `M205 ${Math.floor(args.SPDM1A)} ${Math.floor(args.SPDM1B)} ${Math.floor(args.SPDM2A)} ${Math.floor(args.SPDM2B)}\r\n`;
        this.write(cmd);
    }

    omniwheel (args) {
        const cmd = `M209 ${Math.floor(args.SPDX)} ${Math.floor(args.SPDY)} ${Math.floor(args.SPDR)}\r\n`;
        this.write(cmd);
    }

    motorStop (args) {
        let cmd = 'M203 \r\n';
        this.write(cmd);
    }

    steppermove (args) {
        if (args.STEPPER === 'M1'){
            args.STEPPER = 1;
        } else {
            args.STEPPER = 2;
        }
        const cmd = `M100 ${args.STEPPER} ${args.DEGREE} ${args.RPM}\r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    stepperLine (args) {
        const cmd = `M101 ${args.DISTANCE}\r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    stepperTurn (args) {
        const cmd = `M102 ${args.DEGREE}\r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    stepperppm (args) {
        const cmd = `M104 ${args.PPM}\r\n`;
        this.write(cmd);
    }

    stepperwheelbase (args) {
        const cmd = `M105 ${args.WHEELBASE}\r\n`;
        this.write(cmd);
    }

    stepperArc (args) {
        const cmd = `M103 ${args.RADIUS} $[args.DEGREE}\r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    button (args) {
        let cmd = `M10 ${args.PIN}\r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    rgb (args) {
        if (args.PIX === 'ALL'){
            args.PIX = 0;
        }
        let cmd = `M9 ${args.PIN} ${args.PIX} ${args.RED} ${args.GREEN} ${args.BLUE}\r\n`;
        this.write(cmd);
    }

    rgbbrightness (args) {
        const cmd = `M11 ${args.VALUE}\r\n`;
        this.write(cmd);
    }

    rgbpick (args) {
        if (args.PIX === 'ALL'){
            args.PIX = 0;
        }
        const color = hexToRgb(args.COLOR);
        let cmd = `M9 ${args.PIN} ${args.PIX} ${color.r} ${color.g} ${color.b}\r\n`;
        this.write(cmd);
    }

    rgboff (args) {
        const cmd = `M9 ${args.PIN} 0 0 0 0\r\n`;
        this.write(cmd);
    }

    pinMode (args) {
        let cmd = 'M1 ' + args.PIN + ' ' + pinModeMap[args.MODE] + '\r\n';
        this.write(cmd);
    }

    digitalWrite (args) {
        if (isNaN(args.VALUE)){
            args.VALUE = levelMap[args.VALUE];
        }
        let cmd = 'M2 ' + args.PIN + ' ' + args.VALUE + '\r\n';
        this.write(cmd);
    }

    led (args) {
        if (isNaN(args.VALUE)){
            args.VALUE = onoffMap[args.VALUE];
        }
        let cmd = 'M2 ' + args.PIN + ' ' + args.VALUE + '\r\n';
        this.write(cmd);
    }

    analogWrite (args) {
        let cmd = 'M4 ' + args.PIN + ' ' + args.VALUE + '\r\n';
        this.write(cmd);
    }

    digitalRead (args) {
        let cmd = 'M3 ' + args.PIN + '\r\n';
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    analogRead (args) {
        let cmd = 'M5 ' + args.PIN + '\r\n';
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }


    distance (args) {
        let cmd = 'M250 ' + args.PIN + ' 99\r\n';
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    power (args) {
        let cmd = 'M8 \r\n';
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    servo (args) {
        const pinIndexMap = {
            '4': 0, '7': 1, '8': 2, '11': 3, '12': 4, '13': 5, 'A0': 6, 'A1': 7, 'A2': 8, 'A3': 9
        };
        let cmd = `M212 ${pinIndexMap[args.PIN]} ${Math.floor(args.DEGREE)} ${Math.floor(args.SPEED)}\r\n`;
        this.write(cmd);
    }

    geekservo (args) {
        const pinIndexMap = {
            '4': 0, '7': 1, '8': 2, '11': 3, '12': 4, '13': 5, 'A0': 6, 'A1': 7, 'A2': 8, 'A3': 9
        };
        let cmd = `M213 ${pinIndexMap[args.PIN]} ${Math.floor(args.DEGREE)} ${Math.floor(args.SPEED)}\r\n`;
        this.write(cmd);
    }

    tone (args) {
        let cmd = 'M6 ' + args.PIN + ' ' + args.FREQ + ' ' + args.DURATION + '\r\n';
        this.write(cmd);
    }

    temp18b20 (args) {
        let cmd = `M214 ${args.PIN}\r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    dht11 (args) {
        let fun;
        if (args.FUN === 'Temperature'){
            fun = 1;
        } else {
            fun = 2;
        }
        let cmd = `M215 ${args.PIN} ${fun}\r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    colorSensor (args) {
        const cmd = `M217 \r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    ledstring (args) {
        let cmd = `M20 ${args.STR}\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    ledmatrix (args) {
        let cmd = `M21 ${args.MAT}\r\n`;
        this.write(cmd);
    }

    ledmatrixclear (args) {
        let cmd = `M21 00000000000000000000000000000000\r\n`;
        this.write(cmd);
    }

    ledmatrixrect (args) {
        let cmd = `M22 ${args.X} ${args.Y} ${args.W} ${args.H} ${args.C}\r\n`;
        this.write(cmd);
    }

    sensorread (args) {
        let sensor;
        if (args.SENSOR === 'Light'){
            sensor = 1;
        } else {
            sensor = 2;
        }
        const cmd = `M218 ${args.PIN} ${sensor}\r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    ps2init (args) {
        let cmd = `M220\r\n`;
        this.write(cmd);
    }

    ps2axis (args) {
        const axisMap = {'L-X': 7, 'L-Y': 8, 'R-X': 5, 'R-Y': 6};
        const cmd = `M221 ${axisMap[args.AXIS]}\r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    ps2button (args) {
        const buttonMap = {'→': 9, '↑': 11, '↓': 12, '←': 10, '▲': 13, '●': 14,
            '×': 15, '■': 16, 'L2': 19, 'R2': 20, 'L1': 17, 'R1': 18};
        let cmd = `M222 ${buttonMap[args.BUTTON]}\r\n`;
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }


    mp3play (args) {

        let cmd = `M31 ${args.IO1} ${args.IO2} 100\r\n`;
        this.write(cmd);
    }

    mp3loop (args) {
        let cmd = `M30 0 1 100\r\n`;
        if (args.DIR === 'PREVIOUS'){
            cmd = `M30 1 0 100\r\n`;
        }
        this.write(cmd);
    }

    mp3volumn (args) {
        let cmd = `M30 0 1 500\r\n`;
        if (args.VOLUMN === 'UP'){
            cmd = `M30 1 0 500\r\n`;
        }
        this.write(cmd);
    }


    parseCmd (msg) {
        let tmp = msg.trim().split(' ');
        tmp = tmp.filter(n => { return n !== ''});
        if (tmp[0].indexOf('M100') > -1 || tmp[0].indexOf('M101') > -1 ||
            tmp[0].indexOf('M102') > -1 || tmp[0].indexOf('M103') > -1){
            return undefined;
        } else if (tmp[0].indexOf('M3') > -1){
            return parseInt(tmp[2], 10);
        } else if (tmp[0].indexOf('M5') > -1){
            return parseInt(tmp[2], 10);
        } else if (tmp[0].indexOf('M10') > -1){
            return parseInt(tmp[2], 10);
        } else if (tmp[0].indexOf('M20') > -1){
            return undefined;
        } else if (tmp[0].indexOf('M222') > -1){
            return parseInt(tmp[1], 10);
        } else if (tmp[0].indexOf('M8') > -1){
            return parseFloat(tmp[1]);
        } else if (tmp[0].indexOf('M214') > -1){
            return parseFloat(tmp[1]);
        } else if (tmp[0].indexOf('M215') > -1){
            return parseFloat(tmp[1]);
        } else if (tmp[0].indexOf('M218') > -1){
            return parseInt(tmp[1], 10);
        } else if (tmp[0].indexOf('M217') > -1){
            return tmp[1];
        } else if (tmp[0].indexOf('M221') > -1){
            return tmp[1];
        } else if (tmp[0].indexOf('M250') > -1){
            return tmp[1];
        }
    }
}

module.exports = Kittenbot;
