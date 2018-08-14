/**
 * Created by Riven on 2017/11/5 0005.
 */

const ArgumentType = Scratch.ArgumentType;
const BlockType = Scratch.BlockType;
const formatMessage = require('format-message');
const log = Scratch.log;

const tryGetLocalIp = () => {
    try {
        const ip = window.require('ip');
        return ip.address();
    } catch (e) {
        console.log(e);
        return 'kittenblock';
    }
};

class IOT {
    constructor (runtime){
        this.runtime = runtime;
        this.runtime.registerExtensionDevice('IOT', this);
        // session callbacks

        this.decoder = new TextDecoder();
        this.lineBuffer = '';
    }

    getInfo (){
        const localip = tryGetLocalIp();

        return {
            id: 'IoT',
            name: 'IoT',
            color1: '#1395BA',
            color2: '#107895',
            color3: '#107895',

            blocks: [
                {
                    opcode: 'mqttConnect',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'IoT.mqttConnect',
                        default: 'Connect MQTT [SERVER] ID[CLIENTID]'
                    }),
                    arguments: {
                        SERVER: {
                            type: ArgumentType.STRING,
                            defaultValue: localip
                        },
                        CLIENTID: {
                            type: ArgumentType.STRING,
                            defaultValue: 'robot01'
                        }
                    },
                    func: 'mqttConnect'
                },
                {
                    opcode: 'mqttConnectCloud',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'IoT.mqttConnectCloud',
                        default: 'Device Name [CLIENTID] Connect Cloud[SERVER] Access ID[USER] Pass[PASS]'
                    }),
                    arguments: {
                        SERVER: {
                            type: ArgumentType.STRING,
                            defaultValue: 'kittenbot.cn'
                        },
                        CLIENTID: {
                            type: ArgumentType.STRING,
                            defaultValue: 'robot01'
                        },
                        USER: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PASS: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        }
                    },
                    func: 'mqttConnectCloud'
                },
                /*
                {
                    opcode: 'connectAP',
                    blockType: BlockType.COMMAND,

                    text: 'connect AP [AP] pass[PASS]',
                    arguments: {
                        AP: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Home'
                        },
                        PASS: {
                            type: ArgumentType.STRING,
                            defaultValue: '12345'
                        }
                    },
                    func: 'noop'
                },
                */
                {
                    opcode: 'mqttPub',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'IoT.mqttPub',
                        default: 'MQTT Publish [TOPIC] [DATA]'
                    }),
                    arguments: {
                        TOPIC: {
                            type: ArgumentType.STRING,
                            defaultValue: '/hello'
                        },
                        DATA: {
                            type: ArgumentType.STRING,
                            defaultValue: 'hello world'
                        }
                    },
                    func: 'mqttPub'
                },
                {
                    opcode: 'mqttSub',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'IoT.mqttSub',
                        default: 'MQTT Subscribe [TOPIC]'
                    }),
                    arguments: {
                        TOPIC: {
                            type: ArgumentType.STRING,
                            defaultValue: '/hello'
                        }
                    },
                    func: 'mqttSub'
                },
                {
                    opcode: 'mqttGot',
                    blockType: BlockType.HAT,

                    text: formatMessage({
                        id: 'IoT.mqttGot',
                        default: 'MQTT Topic [TOPIC]'
                    }),
                    arguments: {
                        TOPIC: {
                            type: ArgumentType.STRING,
                            defaultValue: '/hello'
                        }
                    },
                    isEdgeActivated: false,
                    func: 'mqttGot'
                },
                {
                    opcode: 'mqttData',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'IoT.mqttData',
                        default: 'Topic Data [DATATYPE]'
                    }),
                    arguments: {
                        DATATYPE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'String',
                            menu: 'datatype'
                        }
                    },
                    func: 'mqttData'
                },
                '---',
                {
                    opcode: 'thingSpeakWriteAPI',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'IoT.thingSpeakWriteAPI',
                        default: 'Thing Speak Write Key [WRITEKEY]'
                    }),
                    arguments: {
                        WRITEKEY: {
                            type: ArgumentType.STRING
                        }
                    },
                    func: 'thingSpeakWriteAPI'
                },
                {
                    opcode: 'thingSpeakReadAPI',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'IoT.thingSpeakReadAPI',
                        default: 'Thing Speak Read Key [READKEY]'
                    }),
                    arguments: {
                        READKEY: {
                            type: ArgumentType.STRING
                        }
                    },
                    func: 'noop'
                },
                {
                    opcode: 'thingSpeakUpdate',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'IoT.thingSpeakUpdate',
                        default: 'Thing Speak Update Field[FIELD] [VALUE]'
                    }),
                    arguments: {
                        FIELD: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 123
                        }
                    },
                    func: 'thingSpeakUpdate'
                },
                {
                    opcode: 'thingSpeakRead',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'IoT.thingSpeakRead',
                        default: 'Thing Speak Get Channel[CHANNEL] Field[FIELD]:[INDEX]'
                    }),
                    arguments: {
                        CHANNEL: {
                            type: ArgumentType.NUMBER
                        },
                        FIELD: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        INDEX: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'thingSpeakRead'
                },
            ],
            menus: {
                datatype: ['String', 'Number', 'C_Str']
            },
            translation_map: {
                'zh-cn': {
                    mqttConnect: '连接MQTT 服务器[SERVER] ID[CLIENTID]',
                    mqttConnectCloud: '设备名 [CLIENTID] 连接云[SERVER] 访问ID[USER] 访问秘钥[PASS]',
                    connectAP: '连接 路由器[AP] 密码[PASS]',
                    mqttPub: 'MQTT 广播话题[TOPIC] 消息[DATA]',
                    mqttSub: 'MQTT 订阅话题[TOPIC]',
                    mqttGot: 'MQTT 收到话题[TOPIC]',
                    mqttData: '话题内容 [DATATYPE]',
                    datatype: {'String': '文本', 'Number': '数字', 'C_Str': 'C指针'}
                }
            }
        };
    }

    noop (){

    }

    mqttConnect (args) {
        const server = args.SERVER;
        const cid = args.CLIENTID;
        if (this.client){
            this.client.end();
        }
        const mqtt = window.require('mqtt');
        this.client = mqtt.connect(`ws://${server}:9234`, {clientId: cid});
        this.client.on('message', (topic, message) => {
            // message is Buffer
            // console.log(topic, message);
            window.vm.runtime.startHats('IoT_mqttGot', {TEXT: topic});
            this.mqttTopicData = message.toString('utf-8');
        });
        this.client.on('end', () => {
            console.log('mqtt end');
        });
        this.client.on('error', e => {
            console.log('mqtt err', e);
        });
        this.client.on('close', e => {
            console.log('mqtt close', e);
        });
    }

    mqttConnectCloud (args) {
        const server = args.SERVER;
        const cid = args.CLIENTID;
        const user = args.USER;
        const pass = args.PASS;

        if (this.client){
            this.client.end();
        }
        const mqtt = window.require('mqtt');
        this.client = mqtt.connect(`ws://${server}:9234`, {clientId: cid, username: user, password: pass});
        this.client.on('message', (topic, message) => {
            // message is Buffer
            // console.log(topic, message);
            window.vm.runtime.startHats('IoT_mqttGot', {TEXT: topic});
            this.mqttTopicData = message.toString('utf-8');
        });
        this.client.on('end', () => {
            console.log('mqtt end');
        });
        this.client.on('error', e => {
            console.log('mqtt err', e);
        });
        this.client.on('close', e => {
            console.log('mqtt close', e);
        });
    }

    mqttPub (args) {
        if (this.client){
            this.client.publish(args.TOPIC, args.DATA.toString());
        }
    }

    mqttSub (args) {
        if (this.client){
            this.client.subscribe(args.TOPIC);
        }
    }

    mqttGot (args) {
        // console.log("mqtt got" + args);
        return true;
    }

    mqttData (args) {
        return this.mqttTopicData;
    }

    thingSpeakReadAPI (args){
        this.tsReadAPI = args.READKEY;
    }

    thingSpeakWriteAPI (args){
        this.tsWriteAPI = args.WRITEKEY;
    }

    thingSpeakUpdate (args){
        if (!this.tsWriteAPI){
            return 'Null API KEY';
        }
        const url = `https://api.thingspeak.com/update?api_key=${this.tsWriteAPI}&field${args.FIELD}=${args.VALUE}`;
        return new Promise(resolve => {
            nets({
                url: url,
                timeout: 10000
            }, (err, res, body) => {
                if (err) {
                    log.warn(`error fetching ${err}`);
                    resolve(err);
                }
                resolve();
            });

        });
    }

    thingSpeakRead (args){
        const url = `https://api.thingspeak.com/channels/${args.CHANNEL}/fields/${args.FIELD}.json?api_key=${this.tsReadAPI}`;
        return new Promise(resolve => {
            nets({
                url: url,
                timeout: 10000
            }, (err, res, body) => {
                if (err) {
                    log.warn(`error fetching ${err}`);
                    resolve(err);
                }
                let feeds = JSON.parse(body).feeds;
                feeds = feeds.map(f => f[`field${args.FIELD}`]);
                const ret = feeds[args.INDEX] || -1;
                resolve(ret);
            });
        });
    }
}
module.exports = IOT;
