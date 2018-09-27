/**
 * Created by Riven on 2017/12/6.
 */


const ArgumentType = Scratch.ArgumentType;
const BlockType = Scratch.BlockType;
const formatMessage = require('format-message');
const log = Scratch.log;

class DisplayExtension{
    constructor(runtime){
        this.runtime = runtime;
        this.comm = runtime.ioDevices.kblock;
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

    _buildMenuFromArray (ary){
        return ary.map((entry, index) => {
            const obj = {};
            obj.text = entry;
            obj.value = String(entry);
            return obj;
        });
    }

    /**
     * @return {object} This extension's metadata.
     */
    getInfo (){
        return {
            id: 'Display',

            name: formatMessage({
                id: 'Display.categoryName',
                default: 'Display'
            }),
            color1: '#F7C540',
            color2: '#C19932',
            color3: '#C19932',

            blocks: [
                {
                    opcode: 'led',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'display.led',
                        default: 'LED Pin[PIN] Level[VALUE]'
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
                            defaultValue: 'HIGH'
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.ledGen
                    }
                },
                '---',
                {
                    opcode: 'lcdsetup',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'display.lcdsetup',
                        default: 'LCD Setup Addr [ADDR]'
                    }),
                    arguments: {
                        ADDR: {
                            type: ArgumentType.STRING,
                            defaultValue: '0x3F'
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.lcdSetupGen
                    }
                },
                {
                    opcode: 'lcdprint',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'display.lcdprint',
                        default: 'LCD Print [LINE]'
                    }),
                    arguments: {
                        LINE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello World'
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.lcdprintGen
                    }
                },
                {
                    opcode: 'lcdbl',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'display.lcdbl',
                        default: 'LCD Backlight [BL]'
                    }),
                    arguments: {
                        BL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'HIGH',
                            menu: 'onoff'
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.lcdblGen
                    }
                },
                {
                    opcode: 'lcdcursor',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'display.lcdcursor',
                        default: 'LCD Cursor Col[COL] Row[ROW]'
                    }),
                    arguments: {
                        COL: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        ROW: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.lcdcursorGen
                    }
                },
                {
                    opcode: 'lcdclear',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'display.lcdclear',
                        default: 'LCD Clear'
                    }),
                    func: 'noop',
                    gen: {
                        arduino: this.lcdclearGen
                    }
                },
                '---',
                {
                    opcode: 'rgbsetup',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'display.rgbsetup',
                        default: 'RGB Setup [PIN] Pixel Num [NUMPIXELS]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'digiPin',
                            defaultValue: '4'
                        },
                        NUMPIXELS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 16
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.rgbsetupGen
                    }
                },
                {
                    opcode: 'rgbshow',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'display.rgbshow',
                        default: 'RGB Pin [PIN] Pixel [PIX] [COLOR]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'digiPin',
                            defaultValue: '4'
                        },
                        PIX: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        COLOR: {
                            type: ArgumentType.COLORRGB
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.rgbshowGen
                    }
                },
                {
                    opcode: 'rgbrefresh',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'display.rgbrefresh',
                        default: 'RGB [PIN] Refresh'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'digiPin',
                            defaultValue: '4'
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.rgbRefreshGen
                    }
                },
                {
                    opcode: 'rgboff',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'display.rgboff',
                        default: 'RGB Pin [PIN] Off'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'digiPin',
                            defaultValue: '4'
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.rgboffGen
                    }
                },
                '---',
                {
                    opcode: 'digitubesetup',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'display.digitubesetup',
                        default: 'Digital Tube IO [IO] CLK [CLK]'
                    }),
                    arguments: {
                        IO: {
                            type: ArgumentType.STRING,
                            menu: 'digiPin',
                            defaultValue: '7'
                        },
                        CLK: {
                            type: ArgumentType.STRING,
                            menu: 'digiPin',
                            defaultValue: '4'
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.digitubesetupGen
                    }
                },
                {
                    opcode: 'digitubenumber',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'display.digitubenumber',
                        default: 'Digital Tube Number [NUM]'
                    }),
                    arguments: {
                        NUM: {
                            type: ArgumentType.STRING,
                            defaultValue: '1234'
                        }
                    },
                    func: 'noop',
                    gen: {
                        arduino: this.digitubenumberGen
                    }
                }
            ],
            menus: {
                digiPin: this._buildMenuFromArray(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13',
                    'A0', 'A1', 'A2', 'A3', 'A4', 'A5']),
                onoff: [{text: 'ON', value: 'HIGH'}, {text: 'OFF', value: 'LOW'}],
                analogPin: this._buildMenuFromArray(['A0', 'A1', 'A2', 'A3', 'A4', 'A5']),
                analogWritePin: this._buildMenuFromArray(['3', '5', '6', '9', '10', '11']),
                '#displayCatalog': [
                    {src: 'static/extension-assets/arduino/SharkLED.png',
                        value: 'LED', width: 128, height: 128, alt: 'LED'},
                    {src: 'static/extension-assets/arduino/1602LCD.png',
                        value: 'LCD', width: 128, height: 128, alt: 'LCD'},
                    {src: 'static/extension-assets/arduino/ws2812Strip.png',
                        value: 'RGB', width: 128, height: 128, alt: 'RGB'},
                    {src: 'static/extension-assets/arduino/DigiTube.png',
                        value: 'DigitalTube', width: 128, height: 128, alt: 'DigitalTube'},
                ]
            }
        };
    }


    noop (){

    }

    ledGen (gen, block){
        const pin = gen.valueToCode(block, 'PIN');
        gen.setupCodes_['led_'+pin] = `pinMode(${pin}, OUTPUT)`;
        return gen.template2code(block, 'digitalWrite');
    }

    lcdSetupGen (gen, block){
        gen.includes_['wire'] = '#include <Wire.h>\n';
        gen.includes_['lcd'] = '#include <LiquidCrystal_I2C.h>\n';
        const addr = gen.valueToCode(block, 'ADDR');
        gen.definitions_['lcd'] = `LiquidCrystal_I2C lcd(${addr}, 16, 2);`;
        return `lcd.begin()`;
    }

    lcdprintGen (gen, block){
        return gen.template2code(block, 'lcd.print');
    }

    lcdblGen (gen, block){
        return gen.template2code(block, 'lcd.setBacklight');
    }

    lcdcursorGen (gen, block){
        return gen.template2code(block, 'lcd.setCursor');
    }

    lcdclearGen (gen, block){
        return gen.template2code(block, 'lcd.clear');
    }

    rgbsetupGen (gen, block){
        gen.includes_['rgb'] = '#include "Adafruit_NeoPixel.h"';
        const pin = gen.valueToCode(block, 'PIN');
        const num = gen.valueToCode(block, 'NUMPIXELS');

        gen.definitions_['rgb_'+pin] = `Adafruit_NeoPixel neopix_${pin}(${num}, ${pin});`;
        return `neopix_${pin}.begin();`;
    }

    rgbshowGen (gen, block){
        const pin = gen.valueToCode(block, 'PIN');
        const pix = gen.valueToCode(block, 'PIX');
        const color = gen.hexToRgb(gen.valueToCode(block, 'COLOR'));
        if (color){
            return `neopix_${pin}.setPixelColor(${pix}, ${color.r}, ${color.g}, ${color.b})`;
        }
    }

    rgbRefreshGen (gen, block){
        const pin = gen.valueToCode(block, 'PIN');
        return `neopix_${pin}.show()`;
    }

    rgboffGen (gen, block){
        const pin = gen.valueToCode(block, 'PIN');
        return `neopix_${pin}.clear()`;
    }

    digitubesetupGen (gen, block){
        gen.includes_['digitube'] = '#include <TM1637Display.h>';
        const io = gen.valueToCode(block, 'IO');
        const clk = gen.valueToCode(block, 'CLK');
        gen.setupCodes_['digitube_bright'] = `digiTube.setBrightness(0x0f)`;
        gen.definitions_['digitube'] = `TM1637Display digiTube(${clk}, ${io});`;
    }

    digitubenumberGen (gen, block){
        return gen.template2code(block, 'digiTube.showNumberDec');
    }

}

module.exports = DisplayExtension;
