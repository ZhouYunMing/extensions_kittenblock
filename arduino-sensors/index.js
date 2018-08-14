/**
 * Created by Riven on 2017/12/6.
 */

const ArgumentType = Scratch.ArgumentType;
const BlockType = Scratch.BlockType;
const formatMessage = require('format-message');
const log = Scratch.log;

class SensorsExtension {
    constructor (runtime){
        this.runtime = runtime;
        this.comm = runtime.ioDevices.comm;
        this.session = null;
        this.runtime.registerExtensionDevice('SensorsExtension', this);
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
            id: 'Sensors',

            name: formatMessage({
                id: 'Sensors.categoryName',
                default: 'Sensors'
            }),

            color1: '#4CBFE6',
            color2: '#3C95B2',
            color3: '#3C95B2',

            blocks: [
                {
                    opcode: 'sensorAnalog',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'sensors.sensorAnalog',
                        default: 'Analog Sensor [SENSOR] Pin [PIN]'
                    }),
                    arguments: {
                        SENSOR: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Sound',
                            menu: '#analogList'
                        },
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: 14,
                            menu: 'analogPin'
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.sensorAnalogGen
                    }
                },
                {
                    opcode: 'sensorDigit',
                    blockType: BlockType.BOOLEAN,

                    text: formatMessage({
                        id: 'sensors.sensorDigit',
                        default: 'Digital Sensor [SENSOR] Pin [PIN]'
                    }),
                    arguments: {
                        SENSOR: {
                            type: ArgumentType.STRING,
                            defaultValue: 'PIR',
                            menu: '#digiList'
                        },
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '4',
                            menu: 'digiPin'
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.sensorDigiGen
                    }
                },
                '---',
                {
                    opcode: 'dht11',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'sensors.dht11',
                        default: 'DHT11 [FUNC] Pin [PIN]'
                    }),
                    arguments: {
                        FUNC: {
                            type: ArgumentType.STRING,
                            defaultValue: 'temperature',
                            menu: 'dht11function'
                        },
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: '4',
                            menu: 'digiPin'
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.dht11Gen
                    }
                },
                '---',
                {
                    opcode: 'ds18b20Setup',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'sensors.ds18b20Setup',
                        default: 'Setup 18B20 Pin [PIN]'
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
                        arduino: this.ds18b20SetupGen
                    }
                },
                {
                    opcode: 'ds18b20',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'sensors.ds18b20',
                        default: '18B20 Temperature'
                    }),
                    func: 'noop',
                    gen: {
                        arduino: this.ds18b20ReadGen
                    }
                },
                '---',
                {
                    opcode: 'ultrasonic',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'sensors.ultrasonic',
                        default: 'Ultrasonic Trig [TRIG] Echo [ECHO]'
                    }),
                    arguments: {
                        TRIG: {
                            type: ArgumentType.STRING,
                            defaultValue: '3',
                            menu: 'digiPin'
                        },
                        ECHO: {
                            type: ArgumentType.STRING,
                            defaultValue: '4',
                            menu: 'digiPin'
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.ultrasonicGen
                    }
                },
                '---',
                {
                    opcode: 'infraen',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'sensors.infraen',
                        default: 'Infra Enable'
                    }),
                    func: 'noop',
                    gen: {
                        arduino: this.infraenGen
                    }
                },
                {
                    opcode: 'infraloop',
                    blockType: BlockType.CONDITIONAL,

                    text: formatMessage({
                        id: 'sensors.infraloop',
                        default: 'Infra Read Loop'
                    }),
                    func: 'noop',
                    gen: {
                        arduino: this.infraloopGen
                    }
                },
                {
                    opcode: 'infraresult',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'sensors.infradata',
                        default: 'Infra Result'
                    }),
                    func: 'noop',
                    gen: {
                        arduino: this.infraresultGen
                    }
                }
            ],
            menus: {
                '#sensorCatalog': [
                    {src: 'static/extension-assets/arduino/Digital.png',
                        value: 'DigitalSensor', width: 128, height: 128, alt: 'DigitalSensor'},
                    {src: 'static/extension-assets/arduino/Analog.png',
                        value: 'AnalogSensor', width: 128, height: 128, alt: 'AnalogSensor'},
                    {src: 'static/extension-assets/arduino/DHT11.png',
                        value: 'DHT11', width: 128, height: 128, alt: 'DHT11'},
                    {src: 'static/extension-assets/arduino/18B20.png',
                        value: 'DS18B20', width: 128, height: 128, alt: 'DS18B20'},
                    {src: 'static/extension-assets/arduino/TCS3200Colorsensor.png',
                        value: 'Color', width: 128, height: 128, alt: 'Color'},
                    {src: 'static/extension-assets/arduino/HC-SR04.png',
                        value: 'Ultrasonic', width: 128, height: 128, alt: 'Ultrasonic'},
                    {src: 'static/extension-assets/arduino/RC522.png',
                        value: 'RFID', width: 128, height: 128, alt: 'RFID'},
                ],
                '#analogList': [
                    {src: 'static/extension-assets/arduino/SoundSensor.png',
                        value: 'Sound', width: 128, height: 128, alt: 'Sound'},
                    {src: 'static/extension-assets/arduino/LightSensor.png',
                        value: 'Light', width: 128, height: 128, alt: 'Light'},
                    {src: 'static/extension-assets/arduino/Potential.png',
                        value: 'Potential', width: 128, height: 128, alt: 'Potential'},
                    {src: 'static/extension-assets/arduino/SoilSensor.png',
                        value: 'Soil', width: 128, height: 128, alt: 'Soil'},
                    {src: 'static/extension-assets/arduino/RainDrop.png',
                        value: 'RainDrop', width: 128, height: 128, alt: 'RainDrop'},
                    {src: 'static/extension-assets/arduino/FlameSensor.png',
                        value: 'Flame', width: 128, height: 128, alt: 'Flame'},
                    {src: 'static/extension-assets/arduino/GasSensor.png',
                        value: 'Smoke', width: 128, height: 128, alt: 'Smoke'},
                    {src: 'static/extension-assets/arduino/SlidePotential.png',
                        value: 'SlidePotential', width: 128, height: 128, alt: 'SlidePotential'},
                ],
                '#digiList': [
                    {src: 'static/extension-assets/arduino/PIR.png',
                        value: 'PIR', width: 128, height: 128, alt: 'PIR'},
                    {src: 'static/extension-assets/arduino/linefollow_1x.png',
                        value: 'TRACER', width: 128, height: 128, alt: 'TRACER'},
                    {src: 'static/extension-assets/arduino/Touch.png',
                        value: 'TOUCH', width: 128, height: 128, alt: 'TOUCH'},
                    {src: 'static/extension-assets/arduino/SoilSensor.png',
                        value: 'Soil', width: 128, height: 128, alt: 'Soil'},
                    {src: 'static/extension-assets/arduino/FlameSensor.png',
                        value: 'Flame', width: 128, height: 128, alt: 'Flame'},
                    {src: 'static/extension-assets/arduino/GasSensor.png',
                        value: 'Smoke', width: 128, height: 128, alt: 'Smoke'},
                    {src: 'static/extension-assets/arduino/Button.png',
                        value: 'Button', width: 128, height: 128, alt: 'Button'},
                    {src: 'static/extension-assets/arduino/Bumper.png',
                        value: 'Bumper', width: 128, height: 128, alt: 'Bumper'},
                    {src: 'static/extension-assets/arduino/ViberateSensor.png',
                        value: 'Viberate', width: 128, height: 128, alt: 'Viberate'},
                ],
                digiPin: this._buildMenuFromArray(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13',
                        'A0', 'A1', 'A2', 'A3', 'A4', 'A5']),
                analogPin: this._buildMenuFromArray(['A0', 'A1', 'A2', 'A3', 'A4', 'A5']),
                analogWritePin: this._buildMenuFromArray(['3', '5', '6', '9', '10', '11']),
                dht11function: [
                    {text: 'Temperature', value: 'humidity'},
                    {text: 'Humidity', value: 'temperature'}
                ]
            }
        };
    }


    noop (){

    }

    sensorAnalogGen (gen, block){
        const pin = gen.valueToCode(block, 'PIN');
        return [`analogRead(${pin})`, gen.ORDER_ATOMIC];
    }

    sensorDigiGen (gen, block){
        const pin = gen.valueToCode(block, 'PIN');
        return [`digitalRead(${pin})`, gen.ORDER_ATOMIC];
    }

    dht11Gen (gen, block){
        gen.includes_['dht11'] = '#include "dht11.h"';
        gen.definitions_['dht11'] = 'dht11 DHT11;';
        const dht11func = gen.valueToCode(block, 'FUNC');
        const pin = gen.valueToCode(block, 'PIN');
        if (dht11func === 'temperature'){
            gen.definitions_['dht11tempread'] = 'int dht11temp(int pin){\n\tDHT11.read(pin);\n\treturn DHT11.temperature;\n}\n';
            return [`dht11temp(${pin})`, gen.ORDER_ATOMIC];
        } else { // should be humidity
            gen.definitions_['dht11humiread'] = 'int dht11humi(int pin){\n\tDHT11.read(pin);\n\treturn DHT11.humidity;\n}\n';
            return [`dht11humi(${pin})`, gen.ORDER_ATOMIC];
        }
    }

    ds18b20SetupGen (gen, block){
        gen.includes_['ds18b20'] = '#include "OneWire.h"\n' +
            '#include "DallasTemperature.h"';
        gen.definitions_['ds18b20'] = 'OneWire onewire;\n' +
            'DallasTemperature ds18b20(&onewire);';
        const pin = gen.valueToCode(block, 'PIN');
        return gen.line(`onewire.updatePin(${pin})`) + gen.line(`ds18b20.begin()`);
    }

    ds18b20ReadGen (gen, block){
        // todo: support multiple 18b20 reading
        return [`ds18b20.getTempCByIndex(0)`, gen.ORDER_ATOMIC];
    }

    ultrasonicGen (gen, block){
        gen.definitions_['ultrasonic'] = `float ultrasonicSensor(int trigPin, int echoPin){
    float distance;
    unsigned int temp;
    pinMode(trigPin, OUTPUT); 
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    pinMode(echoPin, INPUT);
    temp = pulseIn(echoPin, HIGH);
    distance = (float)temp / 58.2;
    // un-comm this for nekomimi ultrasonic
    /*
    if(distance > 6){
      distance *= 1.28;
    }
    */
    if(distance == 0){
      distance = 999;
    }
    return distance;
}`;
        const trig = gen.valueToCode(block, 'TRIG');
        const echo = gen.valueToCode(block, 'ECHO');
        return [`ultrasonicSensor(${trig}, ${echo})`, gen.ORDER_ATOMIC];
    }

    infraenGen (gen, block){
        gen.includes_['infra'] = '#include <IRremote.h>';
        gen.definitions_['infra'] = 'IRrecv irrecv();\n' +
            'decode_results results;';
        gen.setupCodes_['infra'] = `irrecv.enableIRIn()`;
    }

    infraloopGen (gen, block){
        const branch = gen.statementToCode(block, 'SUBSTACK');
        const code = `if (irrecv.decode(&results)) {
    ${branch}
}`;
        return code;
    }


    infraresultGen (gen, block){
        return ['results.value', gen.ORDER_ATOMIC];
    }


}

module.exports = SensorsExtension;
