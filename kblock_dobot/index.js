/**
 * Created by Riven on 2018/1/24.
 * Change by Gmii on 2018/2/27.
 * Update by Gmii on 2018/3/7. Add IRSwitchRead GPIO Fix.
 * Update by Gmii on 2018/4/16.Add moveToXYZR_LinearRail, increXYZR translation, LinearRail ON/OFF Fix.
 */

const ArgumentType = Scratch.ArgumentType;
const BlockType = Scratch.BlockType;
const formatMessage = require('format-message');
const log = Scratch.log;

let echoType = 0;
let queuedCmdIndex = 0;

const buildCmd = (id, rw, isQueued, param) => {
    id = id & 0xff;
    let ctrl = 0;
    if (rw){
        ctrl += 0x1;
    }
    if (isQueued){
        ctrl += 0x2;
    }
    let cmdlen = 2;
    let header = [0xaa, 0xaa];
    let buf = [id, ctrl]; // default buffer header
    if (param && (param instanceof Array)){
        cmdlen += param.length;
        buf = buf.concat(param);
    }
    let sum = buf.reduce((a, b) => a + b, 0);
    let checkSum = 256 - sum & 0xFF;
    buf.push(checkSum);
    buf = header.concat(cmdlen).concat(buf);
    return buf;
};

const moveAngleTypeMap = {JUMP: 3, JOINT: 4, LINEAR: 5};
const increTypeMap = {LINEAR: 7, JOINT: 8};
const positionMap = {'x': 0, 'y': 1, 'z': 2, 'r': 3, 'joint 1': 4, 'joint 2': 5, 'joint 3': 6, 'joint 4': 7};
const eioTypeMap = {'Dummy': 0, 'OUTPUT': 1, 'PWM': 2, 'INPUT': 3, 'ADC': 4};	//const eioTypeMap = {'Dummy': 0, 'OUTPUT 3.3V': 1, 'OUTPUT 5V': 1, 'OUTPUT 12V': 1, 'OUTPUT PWM': 2, 'INPUT 3.3V': 3, 'INPUT AD': 4};
const eioioportMap= {'EIO 1': 1, 'EIO 2': 2, 'EIO 3': 3, 'EIO 4': 4, 'EIO 5': 5, 'EIO 6': 6, 'EIO 7': 7, 'EIO 8': 8, 'EIO 9': 9, 'EIO 10': 10, 'EIO 11': 11, 'EIO 12': 12, 'EIO 13': 13, 'EIO 14': 14, 'EIO 15': 15, 'EIO 16/SW 1': 16, 'EIO 17/SW 2': 17, 'EIO 18': 18, 'EIO 19': 19, 'EIO 20': 20};
const eiodolevelMap= {'0': 0, '1': 1};
const onoffMap = {'ON': 1, 'OFF': 0};
const motorportMap = {'STEEPER1': 0, 'STEEPER2': 1};
const ioportMap = {'GP1': 0, 'GP2': 1, 'GP4': 2, 'GP5': 3};
const irportMap = {'GP1': 0, 'GP2': 1};
const irreadportMap = {'GP1': 11, 'GP2': 14};

class DobotExtension{
    constructor (runtime){
        this.runtime = runtime;
        this.comm = runtime.ioDevices.comm;
        this.session = null;
        this.runtime.registerExtensionDevice('Dobot', this);
        // session callbacks
        this.onmessage = this.onmessage.bind(this);
        this.onclose = this.onclose.bind(this);

        this.decoder = new TextDecoder();
        this.lineBuffer = '';
        this.lazyBuf = [];
        this.lastMsgTime = Date.now();
    }

    write (data){
        if (this.session) this.session.write(data);
    }

    report (data){
        return new Promise(resolve => {
            this.write(data);
            this.reporter = resolve;
        });
    }


    onmessage (data){
        this.cacheBuffer(data);
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

    cacheBuffer (data){
        // lazy buffer, cache buffer less than 50ms
        let lazyTimer;
        const outputData = retBuf => {
            if (this.reporter){
                this.reporter(retBuf);
            }
        };
        const interval = Date.now() - this.lastMsgTime;
        this.lastMsgTime = Date.now();
        if (interval > 50){
            this.lazyBuf = data;
            lazyTimer = setTimeout(() => {
                outputData(this.lazyBuf);
            }, 50);
        } else {
            const newBuf = new Uint8Array(this.lazyBuf.length + data.length);
            newBuf.set(this.lazyBuf);
            newBuf.set(data, this.lazyBuf.length);
            this.lazyBuf = newBuf;
        }
    };

    getInfo (){
        return {
            id: 'Dobot',

            name: 'Dobot',
            color1: '#6A7782',
            color2: '#424A51',
            color3: '#424A51',
            showStatusButton: true,

            blocks: [
                //Move
                {//initialPosition
                    opcode: 'initialPosition',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.initialPosition',
                        default: 'Home'
                    }),
                    arguments: {},
                    func: 'initialPosition'
                },
                {//clearAllAlarm
                    opcode: 'clearAllAlarm',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.clearAllAlarm',
                        default: 'Clear All Alarm'
                    }),
                    arguments: {},
                    func: 'clearAllAlarm'
                },
                {//AllCmdClear
                    opcode: 'AllCmdClear',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.AllCmdClear',
                        default: 'All Cmd Clear'
                    }),
                    arguments: {},
                    func: 'AllCmdClear'
                },
                {//delaySec
                    opcode: 'delaySec',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.delaySec',
                        default: 'Delay [TIME]s'
                    }),
                    arguments: {
                        TIME: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    },
                    func: 'delaySec'
                },
    /*            {//moveToXYZR
                    opcode: 'moveToXYZR',
                    blockType: BlockType.COMMAND,

                    text: 'Move Type[TYPE] X[X] Y[Y] Z[Z] R[R]',
                    arguments: {
                        TYPE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'LINEAR',
                            menu: 'moveType'
                        },
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 250
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        Z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        R: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'moveToXYZR'
                },*/
                {//moveToXYZR_LinearRail
                    opcode: 'moveToXYZR_LinearRail',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.moveToXYZR_LinearRail',
                        default: 'Move Type[TYPE] X[X] Y[Y] Z[Z] R[R] LinearRail[POS]'
                    }),
                    arguments: {
                        TYPE: {
                            type: ArgumentType.STRING,
                            defaultValue: 2,
                            menu: 'moveType'
                        },
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 250
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        Z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        R: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        POS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'moveToXYZR_LinearRail'
                },
                {//moveToAngle
                    opcode: 'moveToAngle',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.moveToAngle',
                        default: 'Move Type[TYPE] joint 1[J1] joint 2[J2] joint 3[J3] joint 4[J4]'
                    }),
                    arguments: {
                        TYPE: {
                            type: ArgumentType.STRING,
                            defaultValue: 2,
                            menu: 'moveType'
                        },
                        J1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        J2: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 45
                        },
                        J3: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 45
                        },
                        J4: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'moveToAngle'
                },
                {//increXYZR
                    opcode: 'increXYZR',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.increXYZR',
                        default: 'Increment Type[TYPE] X[X] Y[Y] Z[Z] R[R]'
                    }),
                    arguments: {
                        TYPE: {
                            type: ArgumentType.STRING,
                            defaultValue: 7,
                            menu: 'increType'
                        },
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        Z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        R: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'increXYZR'
                },
                {//increAngle
                    opcode: 'increAngle',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.increAngle',
                        default: 'Increment joint 1[J1] joint 2[J2] joint 3[J3] joint 4[J4]'
                    }),
                    arguments: {
                        J1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        },
                        J2: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        J3: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        J4: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'increAngle'
                },
                {//moveArc
                    opcode: 'moveArc',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.moveArc',
                        default: 'ARC Move X[X1] Y[Y1] Z[Z1] R[R1] to X[X2] Y[Y2] Z[Z2] R[R2]'
                    }),
                    arguments: {
                        X1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 250
                        },
                        Y1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        Z1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        R1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        X2: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 270
                        },
                        Y2: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        Z2: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        R2: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'moveArc'
                },
                {//doPump
                    opcode: 'doPump',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.doPump',
                        default: 'Pump [TAKEPUT]'
                    }),
                    arguments: {
                        TAKEPUT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'TAKE',
                            menu: 'takeput'
                        }
                    },
                    func: 'doPump'
                },
                {//doLaser
                    opcode: 'doLaser',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.doLaser',
                        default: 'Laser [ONOFF]'
                    }),
                    arguments: {
                        ONOFF: {
                            type: ArgumentType.STRING,
                            defaultValue: 1,
                            menu: 'onoff'
                        }
                    },
                    func: 'doLaser'
                },//*/
                {//SetMotor
                    opcode: 'SetMotor',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.SetMotor',
                        default: 'Set Motor[MOTOR] Speed[SPEED] pulse/s'
                    }),
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            defaultValue: '0',
                            menu: 'motorport'
                        },
                        SPEED: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10000
                        }
                    },
                    func: 'SetMotor'
                },
                {//extMotorDistance
                    opcode: 'extMotorDistance',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.extMotorDistance',
                        default: 'Ext Motor Motor[MOTOR] Speed[SPEED] pulse/s Distance[DISTANCE] pulse'
                    }),
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            defaultValue: '0',
                            menu: 'motorport'
                        },
                        SPEED: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10000
                        },
                        DISTANCE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10000
                        }
                    },
                    func: 'extMotorDistance'
                },
                {//checkLostStep
                    opcode: 'checkLostStep',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.checkLostStep',
                        default: 'Check Lost Step'
                    }),
                    arguments: {},
                    func: 'checkLostStep'
                },
    //Set
                {//setLinearRail
                    opcode: 'setLinearRail',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.setLinearRail',
                        default: 'Set Linear Rail [ONOFF]'
                    }),
                    arguments: {
                        ONOFF: {
                            type: ArgumentType.STRING,
                            defaultValue: 1,
                            menu: 'onoff'
                        }
                    },
                    func: 'setLinearRail'
                },
                /*{//SetExtIO
                    opcode: 'SetExtIO',
                    blockType: BlockType.COMMAND,

                    text: 'Set ExtIO Type[TYPE] [EIO]',
                    arguments: {
                        TYPE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Dummy',
                            menu: 'eiotype'
                        },
                        EIO: {
                            type: ArgumentType.STRING,
                            defaultValue: 'EIO 1',
                            menu: 'eioioport'
                        }
                    },
                    func: 'SetExtIO'
                },//*/
                {//SetExtIO_IO3V3
                    opcode: 'SetExtIO_IO3V3',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.SetExtIO_IO3V3',
                        default: 'Set [EIO] is [TYPE] 3.3V'
                    }),
                    arguments: {
                        TYPE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'INPUT',
                            menu: 'eio3v3type'
                        },
                        EIO: {
                            type: ArgumentType.STRING,
                            defaultValue: 'EIO 1',
                            menu: 'eioio3v3port'
                        }
                    },
                    func: 'SetExtIO_IO3V3'
                },
                {//SetExtIO_InputADC
                    opcode: 'SetExtIO_InputADC',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.SetExtIO_InputADC',
                        default: 'Set [EIO] is Input ADC'
                    }),
                    arguments: {
                        EIO: {
                            type: ArgumentType.STRING,
                            defaultValue: 'EIO 1',
                            menu: 'eioiadport'
                        }
                    },
                    func: 'SetExtIO_InputADC'
                },
                {//SetExtIO_Output5V
                    opcode: 'SetExtIO_Output5V',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.SetExtIO_Output5V',
                        default: 'Set [EIO] is Output 5V'
                    }),
                    arguments: {
                        EIO: {
                            type: ArgumentType.STRING,
                            defaultValue: 'EIO 10',
                            menu: 'eioo5vport'
                        }
                    },
                    func: 'SetExtIO_Output5V'
                },
                {//SetExtIO_Output12V
                    opcode: 'SetExtIO_Output12V',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.SetExtIO_Output12V',
                        default: 'Set [EIO] is Output 12V'
                    }),
                    arguments: {
                        EIO: {
                            type: ArgumentType.STRING,
                            defaultValue: 'EIO 2',
                            menu: 'eioo12vport'
                        }
                    },
                    func: 'SetExtIO_Output12V'
                },
                {//SetExtIO_OutputPWM
                    opcode: 'SetExtIO_OutputPWM',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.SetExtIO_OutputPWM',
                        default: 'Set [EIO] is Output PWM'
                    }),
                    arguments: {
                        EIO: {
                            type: ArgumentType.STRING,
                            defaultValue: 'EIO 4',
                            menu: 'eioopwmport'
                        }
                    },
                    func: 'SetExtIO_OutputPWM'
                },
                {//SetExtIODO
                    opcode: 'SetExtIODO',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.SetExtIODO',
                        default: 'Set ExtIODO [EIO] Level[VALUE]'
                    }),
                    arguments: {
                        EIO: {
                            type: ArgumentType.STRING,
                            defaultValue: 1,
                            menu: 'eioioport'
                        },
                        VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: '0',
                            menu: 'eiodolevel'
                        }
                    },
                    func: 'SetExtIODO'
                },
                {//SetExtIOPWM
                    opcode: 'SetExtIOPWM',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.SetExtIOPWM',
                        default: 'Set ExtIOPWM[EIO] Frequency[HZ]Hz DutyCycle[PWM]%'
                    }),
                    arguments: {
                        EIO: {
                            type: ArgumentType.STRING,
                            defaultValue: 'EIO 4',
                            menu: 'eioopwmport'
                        },
                        HZ: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        PWM: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 40
                        }
                    },
                    func: 'SetExtIOPWM'
                },//*/
                {//colorsensorSet
                    opcode: 'colorsensorSet',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.colorsensorSet',
                        default: 'Set Color Sensor [ONOFF] port[IOPORT]'
                    }),
                    arguments: {
                        ONOFF: {
                            type: ArgumentType.STRING,
                            defaultValue: 1,
                            menu: 'onoff'
                        },
                        IOPORT: {
                            type: ArgumentType.STRING,
                            defaultValue: 0,
                            menu: 'ioport'
                        }
                    },
                    func: 'colorsensorSet'
                },
                {//IRSwitchSet
                    opcode: 'IRSwitchSet',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.IRSwitchSet',
                        default: 'Set IR Switch [ONOFF] port[IRPORT]'
                    }),
                    arguments: {
                        ONOFF: {
                            type: ArgumentType.STRING,
                            defaultValue: 1,
                            menu: 'onoff'
                        },
                        IRPORT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'GP1',
                            menu: 'irport'
                        }
                    },
                    func: 'IRSwitchSet'
                },
                {//setMotionSpeedRatio
                    opcode: 'setMotionSpeedRatio',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.setMotionSpeedRatio',
                        default: 'Set Motion Speed Ratio Velocity Ratio[VRATIO] Acceleration Ratio[ARATIO]'
                    }),
                    arguments: {
                        VRATIO: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        },
                        ARATIO: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    },
                    func: 'setMotionSpeedRatio'
                },
                {//setJointSpeed
                    opcode: 'setJointSpeed',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.setJointSpeed',
                        default: 'Set Joint Speed Velocity[VELOCITY] Acceleration[ACCELERATION]'
                    }),
                    arguments: {
                        VELOCITY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        },
                        ACCELERATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    },
                    func: 'setJointSpeed'
                },
                {//setCoordinateSpeed
                    opcode: 'setCoordinateSpeed',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.setCoordinateSpeed',
                        default: 'Set Coordinate Speed Velocity[VELOCITY] Acceleration[ACCELERATION]'
                    }),
                    arguments: {
                        VELOCITY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        },
                        ACCELERATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    },
                    func: 'setCoordinateSpeed'
                },
                {//setArcSpeed
                    opcode: 'setArcSpeed',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.setArcSpeed',
                        default: 'Set Arc Speed Velocity[VELOCITY] Acceleration[ACCELERATION]'
                    }),
                    arguments: {
                        VELOCITY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        },
                        ACCELERATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    },
                    func: 'setArcSpeed'
                },
                {//setLinearRailSpeed
                    opcode: 'setLinearRailSpeed',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.setLinearRailSpeed',
                        default: 'Set Linear Rail Speed Velocity[VELOCITY] Acceleration[ACCELERATION]'
                    }),
                    arguments: {
                        VELOCITY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        },
                        ACCELERATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    },
                    func: 'setLinearRailSpeed'
                },
                {//setJumpHeight
                    opcode: 'setJumpHeight',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.setJumpHeight',
                        default: 'Set Jump Height Height[HEIGHT] Z Limit[ZLIMIT]'
                    }),
                    arguments: {
                        HEIGHT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        },
                        ZLIMIT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 150
                        }
                    },
                    func: 'setJumpHeight'
                },
                {//setLostStep
                    opcode: 'setLostStep',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Dobot.setLostStep',
                        default: 'Set Lost Step[LOST]'
                    }),
                    arguments: {
                        LOST: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    },
                    func: 'setLostStep'
                },
                //Read
                {//getPositon
                    opcode: 'getPositon',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'Dobot.getPositon',
                        default: 'Get Position [POS]'
                    }),
                    arguments: {
                        POS: {
                            type: ArgumentType.STRING,
                            defaultValue: 0,
                            menu: 'position'
                        }
                    },
                    func: 'getPositon',
                    sepafter: 36
                },
                {//ReadExtIODI
                    opcode: 'ReadExtIODI',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'Dobot.ReadExtIODI',
                        default: 'Read ExtIODI[EIO]'
                    }),
                    arguments: {
                        EIO: {
                            type: ArgumentType.STRING,
                            defaultValue: 'EIO 1',
                            menu: 'eioio3v3port'
                        }
                    },
                    func: 'ReadExtIODI'
                },
                {//ReadExtIOADC
                    opcode: 'ReadExtIOADC',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'Dobot.ReadExtIOADC',
                        default: 'Read ExtIO ADC[EIO]'
                    }),
                    arguments: {
                        EIO: {
                            type: ArgumentType.STRING,
                            defaultValue: 'EIO 1',
                            menu: 'eioiadport'
                        }
                    },
                    func: 'ReadExtIOADC'
                },
                {//colorsensorRead
                    opcode: 'colorsensorRead',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'Dobot.colorsensorRead',
                        default: 'Read Color Sensor'
                    }),
                    arguments: {},
                    func: 'colorsensorRead'
                },
                {//IRSwitchRead
                    opcode: 'IRSwitchRead',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'Dobot.IRSwitchRead',
                        default: 'Read IR Switch [GP]'
                    }),
                    arguments: {
                        GP: {
                            type: ArgumentType.STRING,
                            defaultValue: 0,
                            menu: 'irport'
                        }
                    },
                    func: 'IRSwitchRead'
                },
                /*{//IRSwitchRead
                    opcode: 'IRSwitchRead',
                    blockType: BlockType.REPORTER,

                    text: 'Read IR Switch',
                    arguments: {},
                    func: 'IRSwitchRead'
                },//*/
    //Others
                /*{//SetQueuedCmdStartExec240
                    opcode: 'SetQueuedCmdStartExec240',
                    blockType: BlockType.COMMAND,

                    text: 'SetQueuedCmdStartExec240',
                    arguments: {},
                    func: 'SetQueuedCmdStartExec240'
                },//*/
                /*{//SetQueuedCmdStopExec241
                    opcode: 'SetQueuedCmdStopExec241',
                    blockType: BlockType.COMMAND,

                    text: 'SetQueuedCmdStopExec241',
                    arguments: {},
                    func: 'SetQueuedCmdStopExec241'
                },//*/
                /*{//SetQueuedCmdForceStopExe242
                    opcode: 'SetQueuedCmdForceStopExe242',
                    blockType: BlockType.COMMAND,

                    text: 'SetQueuedCmdForceStopExe242',
                    arguments: {},
                    func: 'SetQueuedCmdForceStopExe242'
                },//*/
                /*{//GetQueuedCmdCurrentIndex246
                    opcode: 'GetQueuedCmdCurrentIndex246',
                    blockType: BlockType.REPORTER,

                    text: 'GetQueuedCmdCurrentIndex246',
                    arguments: {},
                    func: 'GetQueuedCmdCurrentIndex246'
                },//*/
            ],

            menus: {
                moveType: [{text: 'JUMP', value: '0'}, {text: 'JOINT', value: '1'}, {text: 'LINEAR', value: '2'}],
                increType: [{text: 'LINEAR', value: '7'}, {text: 'JOINT', value: '8'}],
                position: [
                    {text: 'x', value: '0'},
                    {text: 'y', value: '1'},
                    {text: 'z', value: '2'},
                    {text: 'r', value: '3'},
                    {text: 'joint 1', value: '4'},
                    {text: 'joint 2', value: '5'},
                    {text: 'joint 3', value: '6'},
                    {text: 'joint 4', value: '7'}
                ],
                takeput: ['TAKE', 'PUT', 'STOP'],
                eiotype: [
                    {text: 'Dummy', value: '0'},
                    {text: 'OUTPUT', value: '1'},
                    {text: 'PWM', value: '2'},
                    {text: 'INPUT', value: '3'},
                    {text: 'ADC', value: '4'}
                ],
                eio3v3type: ['INPUT', 'OUTPUT'],
    //			eiotype: ['Dummy', 'OUTPUT 3.3V', 'OUTPUT 5V', 'OUTPUT 12V', 'OUTPUT PWM', 'INPUT 3.3V', 'INPUT AD'],
                eioioport: [
                    {text: 'EIO 1', value: '1'},
                    {text: 'EIO 2', value: '2'},
                    {text: 'EIO 3', value: '3'},
                    {text: 'EIO 4', value: '4'},
                    {text: 'EIO 5', value: '5'},
                    {text: 'EIO 6', value: '6'},
                    {text: 'EIO 7', value: '7'},
                    {text: 'EIO 8', value: '8'},
                    {text: 'EIO 9', value: '9'},
                    {text: 'EIO 10', value: '10'},
                    {text: 'EIO 11', value: '11'},
                    {text: 'EIO 12', value: '12'},
                    {text: 'EIO 13', value: '13'},
                    {text: 'EIO 14', value: '14'},
                    {text: 'EIO 15', value: '15'},
                    {text: 'EIO 16/SW 1', value: '16'},
                    {text: 'EIO 17/SW 2', value: '17'},
                    {text: 'EIO 18', value: '18'},
                    {text: 'EIO 19', value: '19'},
                    {text: 'EIO 20', value: '20'}
                ],
                eioio3v3port: ['EIO 1', 'EIO 4', 'EIO 5', 'EIO 6', 'EIO 7', 'EIO 8', 'EIO 9', 'EIO 11', 'EIO 12', 'EIO 14', 'EIO 15', 'EIO 18', 'EIO 19', 'EIO 20'],
                eioo5vport: ['EIO 10', 'EIO 13'],
                eioo12vport: ['EIO 2', 'EIO 3', 'EIO 16/SW 1', 'EIO 17/SW 2'],
                eioopwmport: ['EIO 4', 'EIO 6', 'EIO 8', 'EIO 11', 'EIO 14'],
                eioiadport: ['EIO 1', 'EIO 5', 'EIO 7', 'EIO 9', 'EIO 12', 'EIO 15'],
                eiodolevel: [{text: '0', value: 0}, {text: '1', value: 1}],
                onoff: [{text: 'ON', value: 1}, {text: 'OFF', value: 0}],
                motorport: [{text: 'STEEPER1', value: 0}, {text: 'STEEPER2', value: 1}],
                ioport: [{text: 'GP1', value: 0}, {text: 'GP2', value: 1}, {text: 'GP4', value: 2}, {text: 'GP5', value: 3}],
                irport: [{text: 'GP1', value: 0}, {text: 'GP2', value: 1}]
            }
        };
    }

    initialPosition (args) {
        const cmd = buildCmd(31, 1, 1, null);
        this.write(cmd);
    }

    clearAllAlarm (args) {
        const cmd = buildCmd(20, 1, 0, null);
        this.write(cmd);
    }

    SetQueuedCmdStartExec240 (args) {
        const cmd = buildCmd(240, 1, 0, null);
        this.write(cmd);
    }

    SetQueuedCmdStopExec241 (args) {
        const cmd = buildCmd(241, 1, 0, null);
        this.write(cmd);
    }

    SetQueuedCmdForceStopExe242 (args) {
        const cmd = buildCmd(242, 1, 0, null);
        this.write(cmd);
    }

    AllCmdClear (args) {
        const cmd = buildCmd(245, 1, 0, null);
        this.write(cmd);
    }

    GetQueuedCmdCurrentIndex246 (args) {
        const cmd = buildCmd(246, 0, 0, null);
        return this.report(cmd).then(ret => this.parseCmd(ret));
        //this.write(cmd);;
    }

    delaySec (args) {
        let time = new Uint32Array(1);
        time[0] = args.TIME * 1000;
        const ary = new Uint8Array(time.buffer);
        let param = Array.from(ary);
        const cmd = buildCmd(110, 1, 1, param);
        this.write(cmd);
    }

    getPositon (args) {
        echoType = parseInt(args.POS, 10);
        const cmd = buildCmd(10, 0, 0, null);
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    moveToAngle (args) {
        let angle = new Float32Array(4);
        angle[0] = args.J1;
        angle[1] = args.J2;
        angle[2] = args.J3;
        angle[3] = args.J4;
        const ary = new Uint8Array(angle.buffer);
        let param = [parseInt(args.TYPE, 10)].concat(Array.from(ary));
        const cmd = buildCmd(84, 1, 1, param);

        this.write(cmd);
    }

    increXYZR (args) {
        let cord = new Float32Array(4);
        cord[0] = args.X;
        cord[1] = args.Y;
        cord[2] = args.Z;
        cord[3] = args.R;
        const ary = new Uint8Array(cord.buffer);
        let param = [parseInt(args.TYPE, 10)].concat(Array.from(ary));
        const cmd = buildCmd(84, 1, 1, param);
        this.write(cmd);
    }

    increAngle (args) {
        let angle = new Float32Array(4);
        angle[0] = args.J1;
        angle[1] = args.J2;
        angle[2] = args.J3;
        angle[3] = args.J4;
        const ary = new Uint8Array(angle.buffer);
        let param = [6].concat(Array.from(ary));
        const cmd = buildCmd(84, 1, 1, param);
        this.write(cmd);
    }

    moveArc (args) {
        let tmp = new Float32Array(8);
        tmp[0] = args.X1;
        tmp[1] = args.Y1;
        tmp[2] = args.Z1;
        tmp[3] = args.R1;
        tmp[4] = args.X2;
        tmp[5] = args.Y2;
        tmp[6] = args.Z2;
        tmp[7] = args.R2;
        const ary = new Uint8Array(tmp.buffer);
        let param = Array.from(ary);
        const cmd = buildCmd(101, 1, 1, param);

        this.write(cmd);
    }

    setLinearRail (args) {
        const cmd = buildCmd(3, 1, 0, [parseInt(args.ONOFF, 10)]);
        this.write(cmd);
    }

    moveToXYZR_LinearRail (args) {
        let cord = new Float32Array(5);
        cord[0] = args.X;
        cord[1] = args.Y;
        cord[2] = args.Z;
        cord[3] = args.R;
        cord[4] = args.POS;
        const ary = new Uint8Array(cord.buffer);
        let param = [parseInt(args.TYPE, 10)].concat(Array.from(ary));
        const cmd = buildCmd(86, 1, 1, param);

        this.write(cmd);
    }

    doPump (args) {
        if (args.TAKEPUT === 'TAKE') {
            param = [1, 1];
        }
        else if (args.TAKEPUT === 'PUT') {
            param = [1, 0];
        }
        else {
            param = [0, 1];
        }
        const cmd = buildCmd(63, 1, 1, param);
        this.write(cmd);
    }

    doLaser (args) {
        let onoff = args.ONOFF === 'ON' ? 1 : 0;
        let param = [onoff, onoff];
        const cmd = buildCmd(61, 1, 1, param);
        this.write(cmd);
    }

    SetExtIO (args) {
        let param = [parseInt(args.EIO, 10), parseInt(args.TYPE, 10)];
        const cmd = buildCmd(130, 1, 1, param);
        this.write(cmd);
    }

    SetExtIO_IO3V3 (args) {
        let param = [parseInt(args.EIO, 10), parseInt(args.TYPE, 10)];
        const cmd = buildCmd(130, 1, 1, param);
        this.write(cmd);
    }

    SetExtIO_InputADC (args) {
        let param = [parseInt(args.EIO, 10), 4];
        const cmd = buildCmd(130, 1, 1, param);
        this.write(cmd);
    }

    SetExtIO_Output5V (args) {
        let param = [parseInt(args.EIO, 10), 1];
        const cmd = buildCmd(130, 1, 1, param);
        this.write(cmd);
    }

    SetExtIO_Output12V (args) {
        let param = [parseInt(args.EIO, 10), 1];
        const cmd = buildCmd(130, 1, 1, param);
        this.write(cmd);
    }

    SetExtIO_OutputPWM (args) {
        let param = [parseInt(args.EIO, 10), 2];
        const cmd = buildCmd(130, 1, 1, param);
        this.write(cmd);
    }

    SetExtIODO (args) {
        let param = [parseInt(args.EIO, 10), parseInt(args.VALUE, 10)];
        const cmd = buildCmd(131, 1, 1, param);
        this.write(cmd);
    }

    SetExtIOPWM (args) {
        let tmp = new Float32Array(2);
        tmp[0] = args.HZ;
        tmp[1] = args.PWM;
        const ary = new Uint8Array(tmp.buffer);
        let param = [parseInt(args.EIO, 10)].concat(Array.from(ary));
        const cmd = buildCmd(132, 1, 1, param);
        this.write(cmd);
    }

    ReadExtIODI (args) {
        const cmd = buildCmd(133, 0, 0, [parseInt(args.EIO, 10), 0]);
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    ReadExtIOADC (args) {
        const cmd = buildCmd(134, 0, 0, [parseInt(args.EIO, 10), 0, 0]);
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    SetMotor (args) {
        let tmp = new Int32Array(1);
        tmp[0] = args.SPEED;
        const ary = new Uint8Array(tmp.buffer);
        let param = [parseInt(args.MOTOR, 10), 1].concat(Array.from(ary));
        const cmd = buildCmd(135, 1, 1, param);
        this.write(cmd);
    }

    extMotorDistance (args) {
        let Speed_tmp = new Int32Array(1);
        Speed_tmp[0] = args.SPEED;
        let Distance_tmp = new Uint32Array(1);
        Distance_tmp[0] = args.DISTANCE;
        const Speed_ary = new Uint8Array(Speed_tmp.buffer);
        const Distance_ary = new Uint8Array(Distance_tmp.buffer);
        let param = [parseInt(args.MOTOR, 10), 1].concat(Array.from(Speed_ary)).concat(Array.from(Distance_ary));
        const cmd = buildCmd(136, 1, 1, param);
        this.write(cmd);
    }

    colorsensorSet (args) {
        let param = [parseInt(args.ONOFF, 10), parseInt(args.IOPORT, 10)];
        const cmd = buildCmd(137, 1, 1, param);
        this.write(cmd);
    }

    colorsensorRead (args) {
        const cmd = buildCmd(137, 0, 0, null);
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    IRSwitchSet (args) {
        let param = [parseInt(args.ONOFF, 10), parseInt(args.IRPORT, 10)];
        const cmd = buildCmd(138, 1, 1, param);
        this.write(cmd);
    }

    IRSwitchRead (args) {
        const cmd = buildCmd(133, 0, 0, [parseInt(args.GP, 10), 0]);
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    /*IRSwitchRead(args) {
        const cmd = buildCmd(138, 0, 0, null);
        return this.report(cmd).then(ret => this.parseCmd(ret));
    };//*/

    setMotionSpeedRatio (args) {
        let tmp = new Float32Array(2);
        tmp[0] = args.VRATIO;
        tmp[1] = args.ARATIO;
        const ary = new Uint8Array(tmp.buffer);
        let param = Array.from(ary);
        const cmd = buildCmd(83, 1, 1, param);
        this.write(cmd);
    }

    setJointSpeed (args) {
        let tmp = new Float32Array(8);
        tmp[0] = args.VELOCITY;
        tmp[1] = args.VELOCITY;
        tmp[2] = args.VELOCITY;
        tmp[3] = args.VELOCITY;
        tmp[4] = args.ACCELERATION;
        tmp[5] = args.ACCELERATION;
        tmp[6] = args.ACCELERATION;
        tmp[7] = args.ACCELERATION;
        const ary = new Uint8Array(tmp.buffer);
        let param = Array.from(ary);
        const cmd = buildCmd(80, 1, 0, param);
        this.write(cmd);
    }

    setCoordinateSpeed (args) {
        let tmp = new Float32Array(8);
        tmp[0] = args.VELOCITY;
        tmp[1] = args.VELOCITY;
        tmp[2] = args.VELOCITY;
        tmp[3] = args.VELOCITY;
        tmp[4] = args.ACCELERATION;
        tmp[5] = args.ACCELERATION;
        tmp[6] = args.ACCELERATION;
        tmp[7] = args.ACCELERATION;
        const ary = new Uint8Array(tmp.buffer);
        let param = Array.from(ary);
        const cmd = buildCmd(81, 1, 0, param);
        this.write(cmd);
    }

    setArcSpeed (args) {
        let tmp = new Float32Array(4);
        tmp[0] = args.VELOCITY;
        tmp[1] = args.ACCELERATION;
        tmp[2] = args.VELOCITY;
        tmp[3] = args.ACCELERATION;
        const ary = new Uint8Array(tmp.buffer);
        let param = Array.from(ary);
        const cmd = buildCmd(100, 1, 0, param);
        this.write(cmd);
    }

    setLinearRailSpeed (args) {
        let tmp = new Float32Array(2);
        tmp[0] = args.VELOCITY;
        tmp[1] = args.ACCELERATION;
        const ary = new Uint8Array(tmp.buffer);
        let param = Array.from(ary);
        const cmd = buildCmd(85, 1, 0, param);
        this.write(cmd);
    }

    setJumpHeight (args) {

        let tmp = new Float32Array(2);
        tmp[0] = args.HEIGHT;
        tmp[1] = args.ZLIMIT;
        const ary = new Uint8Array(tmp.buffer);
        let param = Array.from(ary);
        const cmd = buildCmd(82, 1, 0, param);
        this.write(cmd);
    }

    setLostStep (args) {
        let lost = new Float32Array(1);
        lost[0] = args.LOST;
        const ary = new Uint8Array(lost.buffer);
        let param = Array.from(ary);
        const cmd = buildCmd(170, 1, 0, param);
        this.write(cmd);
    }

    checkLostStep (args){
        const cmd = buildCmd(171, 1, 1, null);
        this.write(cmd);
    }

    parseCmd (msg){
        if (msg[0] !== 0xaa || msg[1] !== 0xaa) return;
        if (msg[3] === 10) {		// postion echo
            let payload = new Uint8Array(msg.slice(5, -1));
            let floatAry = new Float32Array(payload.buffer);
            return (floatAry[echoType].toFixed(2)) / 1;
        }
        else if (msg[3] === 133) {	//extIO
            let payload = new Uint8Array(msg.slice(5, -1));
            return payload[1];
        }
        else if (msg[3] === 134) {	//extIO adc
            let payload = new Uint8Array(msg.slice(5, -1));
            let uint16Ary = new Uint16Array(payload.buffer.slice(1));
            return uint16Ary[0];
        }
        else if (msg[3] === 137) {	//color
            let payload = new Uint8Array(msg.slice(5, -1));
            return payload[0].toString(16) + payload[1].toString(16) + payload[2].toString(16);
        }
        else if (msg[3] === 138) {	//ir
            let payload = new Uint8Array(msg.slice(5, -1));
            return payload[0];
        }
        else if (msg[3] === 246) {	//CmdIndex
            let payload = new Uint8Array(msg.slice(5, -1));
            let UintAry = new Uint32Array(payload.buffer);
            return (UintAry[queuedCmdIndex]);
        }//*/
        /*else if (msg[3] == 84) {	//ptpcmd report demo
            let payload = new Uint8Array(msg.slice(5, -1));
            let uint32Ary = new Uint32Array(payload.buffer);
            queuedCmdIndex = uint32Ary[1];
        }//*/
    }
}

module.exports = DobotExtension;
