const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.post('/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const event = req.body;
    console.log('[WEBHOOK]', instanceId, JSON.stringify(event).slice(0, 500));

    const connection = await prisma.connection.findUnique({ where: { instanceId } });
    if (!connection) return res.status(404).json({ error: 'Instância não encontrada' });

    const io = req.app.get('io');

    // Formato uazapi: { chatid, content: { text }, fromMe, sender, senderName, messageid, ... }
    // Formato alternativo: { event: 'messages.upsert', data: { messages: [...] } }
    // Formato alternativo 2: { message: {...}, key: {...} }

    // Detectar mensagem recebida no formato uazapi nativo
    const isUazapiFormat = event.chatid && event.messageid !== undefined;
    const isWhatsappFormat = event.event === 'messages.upsert' || event.data?.messages;
    const isSimpleFormat = event.message && event.key;

    if (isUazapiFormat && !event.fromMe) {
      const phone = (event.chatid || event.sender || '').replace('@s.whatsapp.net', '').replace('@g.us', '');
      if (!phone || event.isGroup) return res.sendStatus(200);

      const body = event.content?.text || event.content?.caption || event.text || '[mídia]';
      const senderName = event.senderName || event.pushName || phone;
      const externalId = event.messageid || event.id;

      // Evitar duplicatas
      if (externalId) {
        const existing = await prisma.message.findFirst({ where: { externalId } });
        if (existing) return res.sendStatus(200);
      }

      let contact = await prisma.contact.findUnique({
        where: { phone_companyId: { phone, companyId: connection.companyId } },
      });
      if (!contact) {
        contact = await prisma.contact.create({
          data: { name: senderName, phone, companyId: connection.companyId },
        });
      }

      const message = await prisma.message.create({
        data: {
          body,
          fromMe: false,
          status: 'received',
          type: 'text',
          externalId,
          contactId: contact.id,
          connectionId: connection.id,
          companyId: connection.companyId,
        },
      });

      io?.to(connection.companyId).emit('message:new', { message, contact, connectionId: connection.id });
    }

    if (isWhatsappFormat) {
      const msg = event.data?.messages?.[0];
      if (!msg || msg.key?.fromMe) return res.sendStatus(200);

      const phone = msg.key.remoteJid?.replace('@s.whatsapp.net', '');
      if (!phone) return res.sendStatus(200);

      const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[mídia]';
      const externalId = msg.key.id;

      if (externalId) {
        const existing = await prisma.message.findFirst({ where: { externalId } });
        if (existing) return res.sendStatus(200);
      }

      let contact = await prisma.contact.findUnique({
        where: { phone_companyId: { phone, companyId: connection.companyId } },
      });
      if (!contact) {
        contact = await prisma.contact.create({
          data: { name: msg.pushName || phone, phone, companyId: connection.companyId },
        });
      }

      const message = await prisma.message.create({
        data: {
          body,
          fromMe: false,
          status: 'received',
          type: 'text',
          externalId,
          contactId: contact.id,
          connectionId: connection.id,
          companyId: connection.companyId,
        },
      });

      io?.to(connection.companyId).emit('message:new', { message, contact, connectionId: connection.id });
    }

    if (isSimpleFormat && !event.key?.fromMe) {
      const phone = event.key?.remoteJid?.replace('@s.whatsapp.net', '');
      if (phone) {
        const body = event.message?.conversation || event.message?.extendedTextMessage?.text || '[mídia]';
        const externalId = event.key?.id;

        if (externalId) {
          const existing = await prisma.message.findFirst({ where: { externalId } });
          if (existing) return res.sendStatus(200);
        }

        let contact = await prisma.contact.findUnique({
          where: { phone_companyId: { phone, companyId: connection.companyId } },
        });
        if (!contact) {
          contact = await prisma.contact.create({
            data: { name: event.pushName || phone, phone, companyId: connection.companyId },
          });
        }

        const message = await prisma.message.create({
          data: {
            body,
            fromMe: false,
            status: 'received',
            type: 'text',
            externalId,
            contactId: contact.id,
            connectionId: connection.id,
            companyId: connection.companyId,
          },
        });

        io?.to(connection.companyId).emit('message:new', { message, contact, connectionId: connection.id });
      }
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error('[WEBHOOK ERROR]', err.message);
    return res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

module.exports = router;
