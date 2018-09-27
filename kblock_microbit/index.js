/**
 * Created by Riven on 2017/10/25 0025.
 */


const ArgumentType = Scratch.ArgumentType;
const BlockType = Scratch.BlockType;
const formatMessage = require('format-message');
const log = Scratch.log;

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOS4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4KCjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0ibWljcm9iaXQtbG9nbyIKICAgeD0iMHB4IgogICB5PSIwcHgiCiAgIHZpZXdCb3g9IjAgMCA0MC43MDUwMDIgNDAuNzA1MDAxIgogICBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAyMTMgNTUiCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiCiAgIGlua3NjYXBlOnZlcnNpb249IjAuOTEgcjEzNzI1IgogICBzb2RpcG9kaTpkb2NuYW1lPSJiYmMtbWljcm9iaXQtd2hpdGUgKDEpLnN2ZyIKICAgd2lkdGg9IjQwLjcwNTAwMiIKICAgaGVpZ2h0PSI0MC43MDUwMDIiPjxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTQ5Ij48cmRmOlJERj48Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcwogICAgIGlkPSJkZWZzNDciIC8+PHNvZGlwb2RpOm5hbWVkdmlldwogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgICBib3JkZXJvcGFjaXR5PSIxIgogICAgIG9iamVjdHRvbGVyYW5jZT0iMTAiCiAgICAgZ3JpZHRvbGVyYW5jZT0iMTAiCiAgICAgZ3VpZGV0b2xlcmFuY2U9IjEwIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwIgogICAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxMjUzIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9Ijg1NiIKICAgICBpZD0ibmFtZWR2aWV3NDUiCiAgICAgc2hvd2dyaWQ9ImZhbHNlIgogICAgIGZpdC1tYXJnaW4tdG9wPSIwIgogICAgIGZpdC1tYXJnaW4tbGVmdD0iMCIKICAgICBmaXQtbWFyZ2luLXJpZ2h0PSIwIgogICAgIGZpdC1tYXJnaW4tYm90dG9tPSIwIgogICAgIGlua3NjYXBlOnpvb209IjEyLjM5NDM2NiIKICAgICBpbmtzY2FwZTpjeD0iMTcuNDY4MDc1IgogICAgIGlua3NjYXBlOmN5PSIxNy40Nzc5MDYiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9IjI0IgogICAgIGlua3NjYXBlOndpbmRvdy15PSIxMiIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIwIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9Im1pY3JvYml0LWxvZ28iIC8+PHBhdGgKICAgICBzdHlsZT0iZmlsbDojZmZmZmZmIgogICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgaWQ9InBhdGgzOSIKICAgICBkPSJtIDI4Ljg3NCwyMi43MDEwMDEgYyAxLjI5OCwwIDIuMzQ3LC0xLjA1MyAyLjM0NywtMi4zNDkgMCwtMS4yOTYgLTEuMDQ4LC0yLjM0ODAwMSAtMi4zNDcsLTIuMzQ4MDAxIC0xLjI5NywwIC0yLjM0OCwxLjA1MjAwMSAtMi4zNDgsMi4zNDgwMDEgMC4wMDEsMS4yOTYgMS4wNTEsMi4zNDkgMi4zNDgsMi4zNDkiIC8+PHBhdGgKICAgICBzdHlsZT0iZmlsbDojZmZmZmZmIgogICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgaWQ9InBhdGg0MSIKICAgICBkPSJtIDExLjYzLDE4LjAwNCBjIC0xLjI5NywwIC0yLjM0OSwxLjA1MjAwMSAtMi4zNDksMi4zNDgwMDEgMCwxLjI5NiAxLjA1MiwyLjM0OSAyLjM0OSwyLjM0OSAxLjI5NiwwIDIuMzQ3LC0xLjA1MyAyLjM0NywtMi4zNDkgMCwtMS4yOTYgLTEuMDUxLC0yLjM0ODAwMSAtMi4zNDcsLTIuMzQ4MDAxIiAvPjxwYXRoCiAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZiIKICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIgogICAgIGlkPSJwYXRoNDMiCiAgICAgZD0ibSAxMS42MywxMy4zNzQ1IGMgLTMuODQ4LDAgLTYuOTc4LDMuMTI5IC02Ljk3OCw2Ljk3ODAwMSAwLDMuODQ4IDMuMTMsNi45NzggNi45NzgsNi45NzggbCAxNy40NDUsMCBjIDMuODQ4LDAgNi45NzcsLTMuMTMgNi45NzcsLTYuOTc4IDAsLTMuODQ5MDAxIC0zLjEyOSwtNi45NzgwMDEgLTYuOTc3LC02Ljk3ODAwMSBsIC0xNy40NDUsMCBtIDE3LjQ0NSwxOC42MDgwMDEgLTE3LjQ0NSwwIGMgLTYuNDEzLDAgLTExLjYzLC01LjIxNyAtMTEuNjMsLTExLjYzIEMgMCwxMy45Mzk1IDUuMjE3LDguNzIyNTAwNCAxMS42Myw4LjcyMjUwMDQgbCAxNy40NDUsMCBjIDYuNDEzLDAgMTEuNjMsNS4yMTY5OTk2IDExLjYzLDExLjYzMDAwMDYgLTEwZS00LDYuNDEzIC01LjIxNywxMS42MyAtMTEuNjMsMTEuNjMiIC8+PC9zdmc+';

/**
 * Icon svg to be displayed in the menu encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const menuIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOS4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4KCjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0ibWljcm9iaXQtbG9nbyIKICAgeD0iMHB4IgogICB5PSIwcHgiCiAgIHZpZXdCb3g9IjAgMCA0MC43MDUwMDIgNDAuNzA1MDAxIgogICBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAyMTMgNTUiCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiCiAgIGlua3NjYXBlOnZlcnNpb249IjAuOTEgcjEzNzI1IgogICBzb2RpcG9kaTpkb2NuYW1lPSJiYmMtbWljcm9iaXQtYmxhY2sgKDEpLnN2ZyIKICAgd2lkdGg9IjQwLjcwNTAwMiIKICAgaGVpZ2h0PSI0MC43MDUwMDIiPjxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTQ5Ij48cmRmOlJERj48Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcwogICAgIGlkPSJkZWZzNDciIC8+PHNvZGlwb2RpOm5hbWVkdmlldwogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgICBib3JkZXJvcGFjaXR5PSIxIgogICAgIG9iamVjdHRvbGVyYW5jZT0iMTAiCiAgICAgZ3JpZHRvbGVyYW5jZT0iMTAiCiAgICAgZ3VpZGV0b2xlcmFuY2U9IjEwIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwIgogICAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxMjUzIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjEwNzYiCiAgICAgaWQ9Im5hbWVkdmlldzQ1IgogICAgIHNob3dncmlkPSJmYWxzZSIKICAgICBmaXQtbWFyZ2luLXRvcD0iMCIKICAgICBmaXQtbWFyZ2luLWxlZnQ9IjAiCiAgICAgZml0LW1hcmdpbi1yaWdodD0iMCIKICAgICBmaXQtbWFyZ2luLWJvdHRvbT0iMCIKICAgICBpbmtzY2FwZTp6b29tPSIxLjU0OTI5NTgiCiAgICAgaW5rc2NhcGU6Y3g9IjQyLjIzNyIKICAgICBpbmtzY2FwZTpjeT0iMTIuNjI4IgogICAgIGlua3NjYXBlOndpbmRvdy14PSIxNDYwIgogICAgIGlua3NjYXBlOndpbmRvdy15PSI0MyIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIwIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9Im1pY3JvYml0LWxvZ28iIC8+PHBhdGgKICAgICBzdHlsZT0iZmlsbDojMDAwMDAwIgogICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgaWQ9InBhdGgzOSIKICAgICBkPSJtIDI4Ljg3NCwyMi43MDEwMDEgYyAxLjI5OCwwIDIuMzQ3LC0xLjA1MyAyLjM0NywtMi4zNDkgMCwtMS4yOTYgLTEuMDQ4LC0yLjM0ODAwMSAtMi4zNDcsLTIuMzQ4MDAxIC0xLjI5NywwIC0yLjM0OCwxLjA1MjAwMSAtMi4zNDgsMi4zNDgwMDEgMC4wMDEsMS4yOTYgMS4wNTEsMi4zNDkgMi4zNDgsMi4zNDkiIC8+PHBhdGgKICAgICBzdHlsZT0iZmlsbDojMDAwMDAwIgogICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgaWQ9InBhdGg0MSIKICAgICBkPSJtIDExLjYzLDE4LjAwNCBjIC0xLjI5NywwIC0yLjM0OSwxLjA1MjAwMSAtMi4zNDksMi4zNDgwMDEgMCwxLjI5NiAxLjA1MiwyLjM0OSAyLjM0OSwyLjM0OSAxLjI5NiwwIDIuMzQ3LC0xLjA1MyAyLjM0NywtMi4zNDkgMCwtMS4yOTYgLTEuMDUxLC0yLjM0ODAwMSAtMi4zNDcsLTIuMzQ4MDAxIiAvPjxwYXRoCiAgICAgc3R5bGU9ImZpbGw6IzAwMDAwMCIKICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIgogICAgIGlkPSJwYXRoNDMiCiAgICAgZD0ibSAxMS42MywxMy4zNzQ1IGMgLTMuODQ4LDAgLTYuOTc4LDMuMTI5IC02Ljk3OCw2Ljk3ODAwMSAwLDMuODQ4IDMuMTMsNi45NzggNi45NzgsNi45NzggbCAxNy40NDUsMCBjIDMuODQ4LDAgNi45NzcsLTMuMTMgNi45NzcsLTYuOTc4IDAsLTMuODQ5MDAxIC0zLjEyOSwtNi45NzgwMDEgLTYuOTc3LC02Ljk3ODAwMSBsIC0xNy40NDUsMCBtIDE3LjQ0NSwxOC42MDgwMDEgLTE3LjQ0NSwwIGMgLTYuNDEzLDAgLTExLjYzLC01LjIxNyAtMTEuNjMsLTExLjYzIEMgMCwxMy45Mzk1IDUuMjE3LDguNzIyNTAwNCAxMS42Myw4LjcyMjUwMDQgbCAxNy40NDUsMCBjIDYuNDEzLDAgMTEuNjMsNS4yMTY5OTk2IDExLjYzLDExLjYzMDAwMDYgLTEwZS00LDYuNDEzIC01LjIxNywxMS42MyAtMTEuNjMsMTEuNjMiIC8+PC9zdmc+';

const isNumber = n => {
    n = n.replace(/'/g, '')
    return !isNaN(parseFloat(n)) && isFinite(n);
};

class MicroBit {
    constructor (runtime){
        this.runtime = runtime;
        this.comm = runtime.ioDevices.comm;
        this.session = null;
        this.runtime.registerPeripheralExtension('MicroBit', this);
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
                if (l.startsWith('M') && this.reporter){
                    this.reporter(l);
                }
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
    getInfo (){
        return {
            id: 'MicroBit',

            name: 'MicroBit',
            color1: '#F16C20',
            color2: '#C2561A',
            color3: '#C2561A',
            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            showStatusButton: true,

            blocks: [
                {
                    opcode: 'showledmat',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicroBit.showledmat',
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
                    opcode: 'showicon',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicroBit.showicon',
                        default: 'Show ICON [ICON]'
                    }),
                    arguments: {
                        ICON: {
                            type: ArgumentType.STRING,
                            menu: '#imageMenu#microbit',
                            defaultValue: 'HEART'
                        }
                    },
                    func: 'showicon'
                },
                {
                    opcode: 'showstring',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicroBit.showstring',
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
                    opcode: 'digiwrite',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicroBit.digiwrite',
                        default: 'Digital Write [PIN] value [LEVEL]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: 'P0',
                            menu: 'bitPins'
                        },
                        LEVEL: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    },
                    func: 'digiwrite'
                },
                {
                    opcode: 'digiread',
                    blockType: BlockType.BOOLEAN,

                    text: formatMessage({
                        id: 'MicroBit.digiread',
                        default: 'Digital Read [PIN]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: 'P0',
                            menu: 'bitPins'
                        }
                    },
                    func: 'digiread'
                },
                {
                    opcode: 'analogwrite',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicroBit.analogwrite',
                        default: 'Analog Write [PIN] value [VALUE]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: 'P0',
                            menu: 'bitPins'
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 123
                        }
                    },
                    func: 'analogwrite'
                },
                {
                    opcode: 'analogread',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'MicroBit.analogread',
                        default: 'Analog Read [PIN]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: 'P0',
                            menu: 'bitPins'
                        }
                    },
                    func: 'analogread'
                },
                {
                    opcode: 'pinpull',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicroBit.pinpull',
                        default: 'Pin [PIN] [PULL]'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            defaultValue: 'P0',
                            menu: 'bitPins'
                        },
                        PULL: {
                            type: ArgumentType.STRING,
                            defaultValue: '0',
                            menu: 'bitPull'
                        }
                    },
                    func: 'pinpull',
                    sepafter: 36
                },
                {
                    opcode: 'musicplay',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicroBit.musicplay',
                        default: 'Music Play [MUSIC]'
                    }),
                    arguments: {
                        MUSIC: {
                            type: ArgumentType.STRING,
                            menu: 'musicMenu',
                            defaultValue: 'NYAN'
                        }
                    },
                    func: 'musicplay'
                },
                {
                    opcode: 'musicpitch',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicroBit.musicpitch',
                        default: 'Music Pitch Freq[FREQ] Delay[LEN]ms'
                    }),
                    arguments: {
                        FREQ: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 880
                        },
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 100
                        }
                    },
                    func: 'musicpitch'
                },
                {
                    opcode: 'speech',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicroBit.speech',
                        default: 'Say [TXT]'
                    }),
                    arguments: {
                        TXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello, World'
                        }
                    },
                    func: 'speech'
                },
                {
                    opcode: 'button',
                    blockType: BlockType.BOOLEAN,

                    text: formatMessage({
                        id: 'MicroBit.button',
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
                    opcode: 'accelerometer',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'MicroBit.accelerometer',
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
                    opcode: 'isgesture',
                    blockType: BlockType.BOOLEAN,

                    text: formatMessage({
                        id: 'MicroBit.isgesture',
                        default: 'Gesture [GESTURE]'
                    }),
                    arguments: {
                        GESTURE: {
                            type: ArgumentType.STRING,
                            menu: 'gestureMenu',
                            defaultValue: 'up'
                        }
                    },
                    func: 'isgesture',
                    sepafter: 36
                },
                {
                    opcode: 'radioswitch',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicroBit.radioswitch',
                        default: 'Radio [SWITCH]'
                    }),
                    arguments: {
                        SWITCH: {
                            type: ArgumentType.STRING,
                            menu: 'onoffMenu',
                            defaultValue: 'on'
                        }
                    },
                    func: 'radioswitch'
                },
                {
                    opcode: 'radiochannel',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicroBit.radiochannel',
                        default: 'Radio Channel [CHANNEL]'
                    }),
                    arguments: {
                        CHANNEL: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 7
                        }
                    },
                    func: 'radiochannel'
                },
                {
                    opcode: 'radiosend',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicroBit.radiosend',
                        default: 'Radio Send [TEXT]'
                    }),
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'hello'
                        }
                    },
                    func: 'radiosend'
                },
                {
                    opcode: 'radioreceive',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'MicroBit.radioreceive',
                        default: 'Radio Receive'
                    }),
                    arguments: {
                    },
                    func: 'radioreceive',
                    sepafter: 36
                },
                {
                    opcode: 'print',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicroBit.print',
                        default: 'serial print [TEXT]'
                    }),
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'hello'
                        }
                    },
                    func: 'print'
                },
                {
                    opcode: 'printvalue',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'MicroBit.printvalue',
                        default: 'serial print [TEXT] = [VALUE]'
                    }),
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'hello'
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 100
                        }
                    },
                    func: 'printvalue'
                }
            ],
            menus: {
                '#imageMenu#microbit': [
                    {src: 'static/extension-assets/microbit/heart.png',
                        value: 'HEART', width: 48, height: 48, alt: 'heart'},
                    {src: 'static/extension-assets/microbit/smallheart.png',
                        value: 'HEART_SMALL', width: 48, height: 48, alt: 'smallheart'},
                    {src: 'static/extension-assets/microbit/yes.png',
                        value: 'YES', width: 48, height: 48, alt: 'yes'},
                    {src: 'static/extension-assets/microbit/no.png',
                        value: 'NO', width: 48, height: 48, alt: 'no'},
                    {src: 'static/extension-assets/microbit/happy.png',
                        value: 'HAPPY', width: 48, height: 48, alt: 'happy'},
                    {src: 'static/extension-assets/microbit/sad.png',
                        value: 'SAD', width: 48, height: 48, alt: 'sad'},
                    {src: 'static/extension-assets/microbit/confused.png',
                        value: 'CONFUSED', width: 48, height: 48, alt: 'confused'},
                    {src: 'static/extension-assets/microbit/angry.png',
                        value: 'ANGRY', width: 48, height: 48, alt: 'angry'},
                    {src: 'static/extension-assets/microbit/asleep.png',
                        value: 'ASLEEP', width: 48, height: 48, alt: 'asleep'},
                    {src: 'static/extension-assets/microbit/surprised.png',
                        value: 'SURPRISED', width: 48, height: 48, alt: 'surprised'},
                    {src: 'static/extension-assets/microbit/silly.png',
                        value: 'SILLY', width: 48, height: 48, alt: 'silly'},
                    {src: 'static/extension-assets/microbit/fabulous.png',
                        value: 'FABULOUS', width: 48, height: 48, alt: 'fabulous'},
                    {src: 'static/extension-assets/microbit/meh.png',
                        value: 'MEH', width: 48, height: 48, alt: 'meh'},
                    {src: 'static/extension-assets/microbit/tshirt.png',
                        value: 'TSHIRT', width: 48, height: 48, alt: 'tshirt'},
                    {src: 'static/extension-assets/microbit/rollerskate.png',
                        value: 'ROLLERSKATE', width: 48, height: 48, alt: 'rollerskate'},
                    {src: 'static/extension-assets/microbit/duck.png',
                        value: 'DUCK', width: 48, height: 48, alt: 'duck'},
                    {src: 'static/extension-assets/microbit/house.png',
                        value: 'HOUSE', width: 48, height: 48, alt: 'house'},
                    {src: 'static/extension-assets/microbit/tortoise.png',
                        value: 'TORTOISE', width: 48, height: 48, alt: 'tortoise'},
                    {src: 'static/extension-assets/microbit/butterfly.png',
                        value: 'BUTTERFLY', width: 48, height: 48, alt: 'butterfly'},
                    {src: 'static/extension-assets/microbit/stickfigure.png',
                        value: 'STICKFIGURE', width: 48, height: 48, alt: 'stickfigure'},
                    {src: 'static/extension-assets/microbit/ghost.png',
                        value: 'GHOST', width: 48, height: 48, alt: 'ghost'},
                    {src: 'static/extension-assets/microbit/sword.png',
                        value: 'SWORD', width: 48, height: 48, alt: 'sword'},
                    {src: 'static/extension-assets/microbit/giraffe.png',
                        value: 'GIRAFFE', width: 48, height: 48, alt: 'giraffe'},
                    {src: 'static/extension-assets/microbit/skull.png',
                        value: 'SKULL', width: 48, height: 48, alt: 'skull'},
                    {src: 'static/extension-assets/microbit/umbrella.png',
                        value: 'UMBRELLA', width: 48, height: 48, alt: 'umbrella'},
                    {src: 'static/extension-assets/microbit/snake.png',
                        value: 'SNAKE', width: 48, height: 48, alt: 'snake'},
                    {src: 'static/extension-assets/microbit/rabbit.png',
                        value: 'RABBIT', width: 48, height: 48, alt: 'rabbit'},
                    {src: 'static/extension-assets/microbit/cow.png',
                        value: 'COW', width: 48, height: 48, alt: 'cow'},
                    {src: 'static/extension-assets/microbit/quarternote.png',
                        value: 'QUARTERNOTE', width: 48, height: 48, alt: 'quarternote'},
                    {src: 'static/extension-assets/microbit/eigthnote.png',
                        value: 'EIGHTNOTE', width: 48, height: 48, alt: 'eigthnote'},
                    {src: 'static/extension-assets/microbit/pitchfork.png',
                        value: 'PITCHFORK', width: 48, height: 48, alt: 'pitchfork'},
                    {src: 'static/extension-assets/microbit/target.png',
                        value: 'TARGET', width: 48, height: 48, alt: 'target'},
                    {src: 'static/extension-assets/microbit/triangle.png',
                        value: 'TRIANGLE', width: 48, height: 48, alt: 'triangle'},
                    {src: 'static/extension-assets/microbit/lefttriangle.png',
                        value: 'LEFTTRIANGLE', width: 48, height: 48, alt: 'lefttriangle'},
                    {src: 'static/extension-assets/microbit/chessboard.png',
                        value: 'CHESSBOARD', width: 48, height: 48, alt: 'chessboard'},
                    {src: 'static/extension-assets/microbit/diamond.png',
                        value: 'DIAMOND', width: 48, height: 48, alt: 'diamond'},
                    {src: 'static/extension-assets/microbit/smalldiamond.png',
                        value: 'DIAMOND_SMALL', width: 48, height: 48, alt: 'smalldiamond'},
                    {src: 'static/extension-assets/microbit/square.png',
                        value: 'SQUARE', width: 48, height: 48, alt: 'square'},
                    {src: 'static/extension-assets/microbit/smallsquare.png',
                        value: 'SQUARE_SMALL', width: 48, height: 48, alt: 'smallsquare'},
                    {src: 'static/extension-assets/microbit/scissors.png',
                        value: 'SCISSORS', width: 48, height: 48, alt: 'scissors'}
                ],
                musicMenu: ['DADADADUM', 'ENTERTAINER', 'PRELUDE', 'ODE', 'NYAN', 'RINGTONE',
                    'FUNK', 'BLUES', 'BIRTHDAY', 'WEDDING', 'FUNERAL', 'PUNCHLINE', 'PYTHON',
                    'BADDY', 'CHASE', 'BA_DING', 'WAWAWAWAA', 'JUMP_UP', 'JUMP_DOWN', 'POWER_UP', 'POWER_DOWN'],
                accMenu: ['x', 'y', 'z'],
                onoffMenu: ['on', 'off'],
                buttonMenu: ['A', 'B', 'A+B'],
                bitPins: ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8',
                    'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16', 'P19', 'P20'],
                bitPull: [
                    {
                        text: formatMessage({
                            id: 'MicroBit.no_pull',
                            default: 'No Pull'
                        }),
                        value: '0'
                    },
                    {
                        text: formatMessage({
                            id: 'MicroBit.pull_up',
                            default: 'Pull Up'
                        }),
                        value: '3'
                    },
                    {
                        text: formatMessage({
                            id: 'MicroBit.pull_down',
                            default: 'Pull Down'
                        }),
                        value: '1'
                    }],
                gestureMenu: ['up', 'down', 'left', 'right', 'face up', 'face down', 'freefall', '3g', '6g', '8g', 'shake']
            }
        };
    }



    noop (){
    }

    showledmat (args){
        const nanocode = `display.show(Image("${args.ICON}"))\r\n`;
        this.write(nanocode);
    }

    showicon (args){
        const nanocode = `display.show(Image.${args.ICON})\r\n`;
        this.write(nanocode);
    }

    showstring (args){
        const nanocode = `display.scroll("${args.STR}")\r\n`;
        this.write(nanocode);
    }

    showstring (args){
        const nanocode = `display.scroll("${args.STR}")\r\n`;
        this.write(nanocode);
    }

    digiwrite (args){
        const pin = args.PIN.substring(1);
        const nanocode = `pin${pin}.write_digital(${args.LEVEL})\r\n`;
        this.write(nanocode);
    }

    digiread (args){
        const pin = args.PIN.substring(1);
        const nanocode = `print("M1 ", pin${pin}.read_digital())\r\n`;
        return this.report(nanocode, null, 'M1').then(ret => this.parseCmd(ret));
    }

    pinpull (args){
        const pin = args.PIN.substring(1);
        const nanocode = `pin${pin}.set_pull(${args.PULL})\r\n`;
        this.write(nanocode);
    }

    analogwrite (args){
        const pin = args.PIN.substring(1);
        const nanocode = `pin${pin}.write_analog(${args.VALUE})\r\n`;
        this.write(nanocode);
    }

    analogread (args){
        const pin = args.PIN.substring(1);
        const nanocode = `print("M2 ", pin${pin}.read_analog())\r\n`;
        return this.report(nanocode, null, 'M2').then(ret => this.parseCmd(ret));
    }

    musicplay (args){
        const nanocode = `music.play(music.${args.MUSIC})\r\n`;
        this.write(nanocode);
    }

    musicpitch (args){
        const nanocode = `music.pitch(${args.FREQ}, ${args.LEN})\r\n`;
        this.write(nanocode);
    }

    speech (args){
        const nanocode = `speech.say("${args.TXT}")\r\n`;
        this.write(nanocode);
    }

    button (args){
        let btn = args.BUTTON;
        btn = btn.toLowerCase();
        let nanocode = `print("M3 ", button_${btn}.is_pressed())\r\n`;
        if (btn === 'a+b'){
            nanocode = `print("M3 ", button_a.is_pressed() and button_b.is_pressed())\r\n`;
        }
        return this.report(nanocode, null, 'M3').then(ret => this.parseCmd(ret));
    }

    accelerometer (args){
        const nanocode = `print("M4 ", accelerometer.get_${args.DIRECTION}())\r\n`;
        return this.report(nanocode, null, 'M4').then(ret => this.parseCmd(ret));
    }

    isgesture (args){
        const nanocode = `print("M5 ", accelerometer.is_gesture("${args.GESTURE}"))\r\n`;
        return this.report(nanocode, null, 'M5').then(ret => this.parseCmd(ret));
    }

    radioswitch (args){
        const nanocode = `radio.${args.SWITCH}()\r\n`;
        this.write(nanocode);
    }

    radiochannel (args){
        const nanocode = `radio.config(channel=${args.CHANNEL})\r\n`;
        this.write(nanocode);
    }

    radiosend (args){
        const nanocode = `radio.send("${args.TEXT}")\r\n`;
        this.write(nanocode);
    }

    radioreceive (args){
        const nanocode = `print("M6 ", str(radio.receive()))\r\n`;
        return this.report(nanocode, null, 'M6').then(ret => this.parseCmd(ret));
    }

    print (args){
        const nanocode = `print("${args.TEXT}")\r\n`;
        this.write(nanocode);
    }

    printvalue (args){
        let txt = args.TEXT;
        if (!isNumber(txt)){
            txt = txt.replace(/\"/g, '');
        }

        const nanocode = `print('${txt}=','${args.VALUE}')\r\n`;
        this.write(nanocode);
    }

    parseCmd (msg){
        let tmp = msg.trim().split(' ');
        tmp = tmp.filter(n => { return n !== ''});
        if (msg.startsWith('M1')){
            return parseInt(tmp[1], 10);
        } else if (msg.startsWith('M2')){
            return parseInt(tmp[1], 10);
        } else if (msg.startsWith('M3')){
            return tmp[1] === 'True';
        } else if (msg.startsWith('M4')){
            return parseInt(tmp[1], 10);
        } else if (msg.startsWith('M5')){
            return tmp[1] === 'True';
        } else if (msg.startsWith('M6')){
            return tmp[1];
        } else if (msg.startsWith('M7')){
            return parseInt(tmp[1], 10);
        } else if (msg.startsWith('M10')){
            return null; // motor delay end
        }
    }
}


module.exports = MicroBit;
