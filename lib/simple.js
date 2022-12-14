global.fs = require('fs');
global.util = require('util');

const {
    proto,
    URL_REGEX,
    getDevice,
    jidNormalizedUser,
    getContentType,
    isJidGroup,
    isJidBroadcast,
} = require('@adiwajshing/baileys');

exports.Serialize = (sock, m) => {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    if (m.key) {
        m.id = m.key.id;
        m.isBot = (m.id.startsWith('BAE5') && m.id.length === 16);
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = m.fromMe
            ? jidNormalizedUser(sock.user.id) || ''
            : (
                isJidGroup(m.key.remoteJid)
                    ? jidNormalizedUser(m.key.participant)
                    : isJidBroadcast(m.key.remoteJid)
                        ? jidNormalizedUser(m.key.participant)
                        : jidNormalizedUser(m.key.remoteJid)
            );
        m.device = getDevice(m.id)
        m.key = {
            remoteJid: m.chat,
            fromMe: m.fromMe,
            id: m.id,
            participant: m.sender
        }
    }
    if (m.message) {
        m.mtype = getContentType(m.message);
        //m.body = m.message.conversation || m.message[m.mtype].caption || m.message[m.mtype].text || (m.mtype == 'listResponseMessage') && m.message[m.mtype].singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.message[m.mtype].selectedButtonId || m.mtype
        m.msg = m.message[m.mtype];
        if (m.mtype === 'ephemeralMessage') {
            this.Serialize(sock, m.msg);
            m.mtype = m.msg.mtype;
            m.msg = m.msg.msg;
        }
        m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
    }
    m.text = (m.mtype == 'listResponseMessage' ? m.msg.singleSelectReply.selectedRowId : '') || m.msg.text || m.msg.caption || m.msg || ''
    return m
};