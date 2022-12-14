const {
    default: makeWASocket,
    DisconnectReason,
    Browsers,
    isJidGroup,
    makeInMemoryStore,
    jidNormalizedUser,
    fetchLatestBaileysVersion,
    getContentType,
    delay,
    isJidStatusBroadcast,
    useMultiFileAuthState,
    S_WHATSAPP_NET
} = require('@adiwajshing/baileys');
const { Boom } = require('./node_modules/@hapi/boom')
const _ = require('lodash')
const pino = require('pino');
const CFonts = require('cfonts');
const gradient = require('gradient-string');
let package = require('./package.json');
/////////////////////Openai/////////////
const { Configuration, OpenAIApi } = require("openai");
const keynya = "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"
const configuration = new Configuration({
  apiKey: keynya,
});
const openai = new OpenAIApi(configuration);
///////////////////////////////////
///////////////////////////////////
let { ucaphalo } = require('./lib')
///////////////////////////////////
///////////////////////////////////
const yargs = require('yargs/yargs')
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
let session;
if (opts['test']) {
    session = 'session/test'
} else {
    session = 'session/main'
}
const { Serialize } = require('./lib/simple');

const msgRetryCounterMap = {}
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

/** LOCAL MODULE */
const {
    color,
    bgColor,
    msgs,
    isLatestVersion,
} = require('./utils');
const start = async () => {
    CFonts.say(`${package.name}`, {
        font: 'shade',
        align: 'center',
        gradient: ['#12c2e9', '#c471ed'],
        transitionGradient: true,
        letterSpacing: 3,
    });
    CFonts.say(`'${package.name}' Coded By ${package.author}`, {
        font: 'console',
        align: 'center',
        gradient: ['#DCE35B', '#45B649'],
        transitionGradient: true,
    });
    const { version: WAVersion, isLatest } = await fetchLatestBaileysVersion()
    let pkg = await isLatestVersion()
    console.log(color('[SYS]', 'cyan'), `Package Version`, color(`${package.version}`, '#009FF0'), 'Is Latest :', color(`${pkg.isLatest}`, '#f5af19'));
    console.log(color('[SYS]', 'cyan'), `WA Version`, color(WAVersion.join('.'), '#38ef7d'), 'Is Latest :', color(`${isLatest}`, '#f5af19'));
    const { state, saveCreds } = await useMultiFileAuthState(session);
    let client = makeWASocket({
        version: WAVersion,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        msgRetryCounterMap,
        auth: state,
        browser: ["Safari", "Safari", "9.7.0"],
    });
    client.ev.on('connection.update', async (update) => {
        if (global.qr !== update.qr) {
            global.qr = update.qr
        }

        const { connection, lastDisconnect } = update;
        if (connection === 'connecting') {
            console.log(color('[SYS]', '#009FFF'), color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), color(`${package.name} is Authenticating...`, '#f12711'));
        } else if (connection === 'close') {
            const log = msg => console.log(color('[SYS]', '#009FFF'), color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), color(msg, '#f64f59'));
            const statusCode = new Boom(lastDisconnect?.error)?.output.statusCode;
            console.log(lastDisconnect.error);
            if (statusCode === DisconnectReason.badSession) { log(`Bad session file, delete ${session} and run again`); start(); }
            else if (statusCode === DisconnectReason.connectionClosed) { log('Connection closed, reconnecting....'); start() }
            else if (statusCode === DisconnectReason.connectionLost) { log('Connection lost, reconnecting....'); start() }
            else if (statusCode === DisconnectReason.connectionReplaced) { log('Connection Replaced, Another New Session Opened, Please Close Current Session First'); process.exit() }
            else if (statusCode === DisconnectReason.loggedOut) { log(`Device Logged Out, Please Delete ${session} and Scan Again.`); process.exit(); }
            else if (statusCode === DisconnectReason.restartRequired) { log('Restart required, restarting...'); start(); }
            else if (statusCode === DisconnectReason.timedOut) { log('Connection timedOut, reconnecting...'); start(); }
            else {
                console.log(lastDisconnect.error); start()
            }
        } else if (connection === 'open') {
            console.log(color('[SYS]', '#009FFF'), color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), color(`${package.name} is now Connected...`, '#38ef7d'));
        }
    });

    client.ev.on('creds.update', saveCreds)
    client.ev.on('messages.upsert', async (msg) => {
        try {
            if (!msg.messages) return
            const m = msg.messages[0]
            if (m.key.fromMe) return
            const from = m.key.remoteJid;
            Serialize(client, m)
            let type = client.msgType = getContentType(m.message);
            let t = client.timestamp = m.messageTimestamp
            const body = (type === 'conversation') ? m.message.conversation : (type == 'ephemeralMessage') ? m.message.ephemeralMessage.message : (type == 'imageMessage') ? m.message.imageMessage.caption : (type == 'videoMessage') ? m.message.videoMessage.caption : (type == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (type == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (type == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (type == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (type === 'messageContextInfo') ? (m.message.listResponseMessage.singleSelectReply.selectedRowId || m.message.buttonsResponseMessage.selectedButtonId || m.text) : ''
            let isGroupMsg = isJidGroup(m.chat)
            let pushname = client.pushname = m.pushName
            let tipe = bgColor(color(type, 'black'), '#FAFFD1')

            const args = body.trim().split(/ +/).slice(1);
            const isBody = body
            const ishalo = await ucaphalo(body)
            
            const reply = async (text) => {
                await client.sendPresenceUpdate('composing', from)
                return client.sendMessage(from, { text }, { quoted: m })
            }
            if(isGroupMsg) {return}
            //autoread pesan
            if (isBody) {
                await client.readMessages([m.key])
            }
            if (ishalo) {
                await reply(`Hai, ada yang bisa bot bantu?`);
                console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), msgs(m.text), `~>`, bgColor(color(" HOLA ", '#FAFFD1'), '#095710'), `from`, color(pushname, '#38ef7d'))
            } else if (args.length < 2) {
                await reply("Maaf, tolong kasih bot pertanyaan lebih detail & spesifik lagi :)");
                console.log('[ERR]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), msgs(m.text), `~> ${(tipe)} from`, color(pushname, '#38ef7d'))
            } else if (type == 'conversation' || type == 'extendedTextMessage') {
                const api2 = await openai.createCompletion({
                    model: "text-davinci-003",
                    prompt: body,
                    temperature: 0,
                    max_tokens: 1000,
                    top_p: 1,
                    frequency_penalty: 0.2,
                    presence_penalty: 0,
                  });
                const response = api2.data.choices[0].text;
                await client.sendPresenceUpdate('composing', from);
                client.sendMessage(m.chat, {text : response.slice(2)});
                console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), msgs(m.text), `~> ${(tipe)} from`, color(pushname, '#38ef7d'))
            } else {
              console.log('[ETC]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), msgs(m.text), `~> ${(tipe)} from`, color(pushname, '#38ef7d'))
            }
            
        } catch (error) {
            console.log(error)
        }
    })
    //auto kirim pesan pas di call/vc
    client.ws.on('CB:call', async call => {
        if (call.content[0].tag == 'offer') {
            const callerJid = call.content[0].attrs['call-creator']
            const {  platform, notify, t } = call.attrs
            const caption = `Maaf BOT tidak dapat menerima panggilan :)`
            await client.sendMessage(callerJid, { text: caption })
        }
    })
    //Auto reject pas di call/vc
    client.ev.on('call', async (node) => {
        const { from, id, status } = node[0]
        if (status == 'offer') {
            const stanza = {
                tag: 'call',
                attrs: {
                    from: client.user.id,
                    to: from,
                    id: client.generateMessageTag(),
                },
                content: [
                    {
                        tag: 'reject',
                        attrs: {
                            'call-id': id,
                            'call-creator': from,
                            count: '0',
                        },
                        content: undefined,
                    },
                ],
            }
            await client.query(stanza)
        }
    })
};

start().catch(() => start());