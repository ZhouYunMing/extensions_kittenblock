/**
 * Created by Riven on 2017/12/13.
 */

const ArgumentType = Scratch.ArgumentType;
const BlockType = Scratch.BlockType;
const formatMessage = require('format-message');
const log = Scratch.log;

class ActuatorExtension{
    constructor (runtime){
        this.runtime = runtime;
        this.comm = runtime.ioDevices.comm;
        this.session = null;
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

    _buildMenuFromArray (ary){
        return ary.map((entry, index) => {
            const obj = {};
            obj.text = entry;
            obj.value = String(entry);
            return obj;
        });
    }

    getInfo (){
        return {
            id: 'Actuator',
            name: formatMessage({
                id: 'Actuator.categoryName',
                default: 'Actuator'
            }),
            color1: '#40BF4A',
            color2: '#2E8934',
            color3: '#2E8934',

            blocks: [
                {
                    opcode: 'servoSetup',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'Actuator.servoSetup',
                        default: 'Servo Setup Pin [PIN]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '4',
                            menu: 'digiPin'
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.servoSetupGen
                    }
                },
                {
                    opcode: 'servoWrite',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'Actuator.servoWrite',
                        default: 'Servo Write [PIN] Degree[DEG]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '4',
                            menu: 'digiPin'
                        },
                        DEG: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.servoWriteGen
                    }
                },
                {
                    opcode: 'geekservomap',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'Actuator.geekservomap',
                        default: 'GeekServo Map [DEG]'
                    }),
                    arguments: {
                        DEG: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.geekservomap
                    }
                },


                '---',
                {
                    opcode: 'buzzer',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'Actuator.buzzer',
                        default: 'Buzzer Pin [PIN] Freq [FREQ] Delay [DELAY]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '5',
                            menu: 'digiPin'
                        },
                        FREQ: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 300
                        },
                        DELAY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 500
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.buzzerGen
                    }
                },
                {
                    opcode: 'music',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'Actuator.music',
                        default: 'Music Pin [PIN] Notes [NOTES]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '5',
                            menu: 'digiPin'
                        },
                        NOTES: {
                            type: ArgumentType.STRING,
                            defaultValue: 'g5:1 d c g4:2 b:1 c5:3 '
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.musicGen
                    }
                },
                '---',
                {
                    opcode: 'relay',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'Actuator.relay',
                        default: 'Relay Pin [PIN] [ONOFF]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '5',
                            menu: 'digiPin'
                        },
                        ONOFF: {
                            type: ArgumentType.STRING,
                            defaultValue: 'HIGH',
                            menu: 'onoff'
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.relayGen
                    }
                },
                {
                    opcode: 'motorModule',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'Actuator.motorModule',
                        default: 'Motor [MOTOR] DIR[DIR] PWM[PWM] SPEED [SPEED]'
                    }),
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            defaultValue: 'L298N',
                            menu: 'motorList'
                        },
                        DIR: {
                            type: ArgumentType.STRING,
                            defaultValue: '3',
                            menu: 'digiPin'
                        },
                        PWM: {
                            type: ArgumentType.STRING,
                            defaultValue: '5',
                            menu: 'analogWritePin'
                        },
                        SPEED: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.motorGen
                    }
                },
                {
                    opcode: 'motorH',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'Actuator.motorH',
                        default: 'Motor [MOTOR] IN1[IN1] IN2[IN2] SPEED [SPEED]'
                    }),
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            defaultValue: 'DRV8833',
                            menu: 'motorHBridge'
                        },
                        IN1: {
                            type: ArgumentType.STRING,
                            defaultValue: '5',
                            menu: 'analogWritePin'
                        },
                        IN2: {
                            type: ArgumentType.STRING,
                            defaultValue: '6',
                            menu: 'analogWritePin'
                        },
                        SPEED: {
                            type: ArgumentType.SLIDER,
                            defaultValue: 100
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.motorHGen
                    }
                }
            ],
            menus: {
                digiPin: this._buildMenuFromArray(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13',
                    'A0', 'A1', 'A2', 'A3', 'A4', 'A5']),
                analogWritePin: this._buildMenuFromArray(['3', '5', '6', '9', '10', '11']),
                onoff: [{text: 'ON', value: 'HIGH'}, {text: 'OFF', value: 'LOW'}],
                '#actuatorCatalog': [
                    {src: 'static/extension-assets/arduino/Servo.png',
                        value: 'Servo', width: 128, height: 128, alt: 'Servo'},
                    {src: 'static/extension-assets/arduino/Buzzer.png',
                        value: 'Buzzer', width: 128, height: 128, alt: 'Buzzer'},
                    {src: 'static/extension-assets/arduino/Motor.png',
                        value: 'Motor', width: 128, height: 128, alt: 'Motor'},
                    {src: 'static/extension-assets/arduino/Relay.png',
                        value: 'Relay', width: 128, height: 128, alt: 'Relay'},
                    {src: 'static/extension-assets/arduino/Stepper.png',
                        value: 'Stepper', width: 128, height: 128, alt: 'Stepper'}
                ],
                motorList: ['L298N', 'L9110'],
                motorHBridge: ['DRV8833', 'H-Bridge']
            }
        };
    }

    noop (){}

    servoSetupGen (gen, block){
        gen.includes_['servo']  = '#include <Servo.h>';
        const pin = gen.valueToCode(block, 'PIN');
        gen.definitions_['servo_'+pin] = `Servo servo_${pin};`;
        gen.setupCodes_['servo_'+pin] = `servo_${pin}.attach(${pin})`;
    }

    servoWriteGen (gen, block){
        const pin = gen.valueToCode(block, 'PIN');
        const deg = gen.valueToCode(block, 'DEG');
        return `servo_${pin}.write(${deg})`;
    }

    geekservomap (gen, block){
        const deg = gen.valueToCode(block, 'DEG');
        gen.definitions_['geekservomap'] = `int geekServoMap(int degree){
  return (degree-90) * 20 / 3 + 1500;
}`;
        const code = `geekServoMap(${deg})`;
        return [code, 0];
    }

    buzzerGen (gen, block){
        return gen.template2code(block, 'tone');
    }

    musicGen (gen, block){
        gen.definitions_['buzzMusic'] = `const int noteMap[] = {440, 494, 262, 294, 330, 349, 392};
void buzzMusic(int pin, const char * notes){
    int freq;
    int len = strlen(notes);
    int octave = 4;
    int duration = 500;
    for(int i=0;i < len;i++){
        if(notes[i]>='a' && notes[i]<='g'){
          freq = noteMap[notes[i]-'a'];
        }else if(notes[i]=='r'){
          freq = 0;
        }else if(notes[i]>='2' && notes[i]<='6'){
          octave = notes[i] - '0';
        }else if(notes[i]==':'){
          i++;
          duration = (notes[i] - '0')*125;
        }else if(notes[i]==' '){ // play until we meet a space
          freq *= pow(2, octave-4);
          tone(pin, freq, duration);
      delay(duration);
        }
    }
}`;

        return gen.template2code(block, 'buzzMusic');
    }

    relayGen (gen, block){
        const pin = gen.valueToCode(block, 'PIN');
        gen.setupCodes_['relay_'+pin] = `pinMode(${pin}, OUTPUT)`;
        return gen.template2code(block, 'digitalWrite');
    }

    motorGen (gen, block){
        gen.definitions_['motorModule'] = `void motorModule(int pinDir, int pinPwm, int speed){
    pinMode(pinDir, OUTPUT);
    if(speed>=0){
        digitalWrite(pinDir, 1);
        speed = 255 - speed;
    }else{
        digitalWrite(pinDir, 0);
    }
    analogWrite(pinPwm, abs(speed));
}`;
        const pirDir = gen.valueToCode(block, 'DIR');
        const pinPwm = gen.valueToCode(block, 'PWM');
        const speed = gen.valueToCode(block, 'SPEED');

        return `motorModule(${pirDir}, ${pinPwm}, ${speed})`;
    }

    motorHGen (gen, block){
        gen.definitions_['motorBridge'] = `void motorBridge(int in1, int in2, int speed){
    if(speed>=0){
        analogWrite(in1, abs(speed));
        analogWrite(in2, 0);
    }else{
        analogWrite(in1, 0);
        analogWrite(in2, abs(speed));
    }
}`;
        const p1 = gen.valueToCode(block, 'IN1');
        const p2 = gen.valueToCode(block, 'IN2');
        const speed = gen.valueToCode(block, 'SPEED');
        return `motorBridge(${p1}, ${p2}, ${speed})`;
    }
}

module.exports = ActuatorExtension;
