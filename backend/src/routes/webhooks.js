const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.post('/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const event = req.body;
    console.log('[WEBHOOK]', instanceId, JSON.stringify(event).slice(0, 300));

    const connection = await prisma.connection.findUnique({ where: { instanceId } });
    if (!connection) return res.status(404).json({ error: 'Instância não encontrada' });

    const io = req.app.get('io');

    const isConnectionEvent = event.event === 'connection.update' || event.type === 'connection' || event.status !== undefined;
    if (isConnectionEvent) {
      const connected = event.data?.state === 'open' || event.status === 'connected' || event.connected === true;
      const status = connected ? 'connected' : 'disconnected';
      const phoneNumber = event.data?.phoneNumber || event.phoneNumber || null;

      await prisma.connection.update({
        where: { instanceId },
        data: { status, phoneNumber },
      });

      io?.to(connection.companyId).emit('connection:update', {
        connectionId: connection.id,
        status,
        phoneNumber,
      });
    }

    const isMessageEvent = event.event === 'messages.upsert' || event.type === 'message' || event.data?.messages || event.message;
    if (isMessageEvent) {
      const msg = event.data?.messages?.[0] || (event.message ? { key: event.key, pushName: event.pushName, message: event.message } : null);
      if (!msg || msg.key?.fromMe) return res.sendStatus(200);

      const phone = msg.key.remoteJid?.replace('@s.whatsapp.net', '');
      if (!phone) return res.sendStatus(200);

      let contact = await prisma.contact.findUnique({
        where: { phone_companyId: { phone, companyId: connection.companyId } },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            name: msg.pushName || phone,
            phone,
            companyId: connection.companyId,
          },
        });
      }

      const body =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '[mídia]';

      const message = await prisma.message.create({
        data: {
          body,
          fromMe: false,
          status: 'received',
          type: 'text',
          externalId: msg.key.id,
          contactId: contact.id,
          connectionId: connection.id,
          companyId: connection.companyId,
        },
      });

      io?.to(connection.companyId).emit('message:new', {
        message,
        contact,
        connectionId: connection.id,
      });
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

module.exports = router;
