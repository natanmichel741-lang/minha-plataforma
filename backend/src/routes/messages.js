const router = require('express').Router();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

const uazapi = axios.create({
  baseURL: process.env.UAZAPI_BASE_URL,
  headers: { Authorization: `Bearer ${process.env.UAZAPI_TOKEN}` },
});

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { contactId, connectionId, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      companyId: req.user.companyId,
      ...(contactId && { contactId }),
      ...(connectionId && { connectionId }),
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { contact: true, connection: true },
      }),
      prisma.message.count({ where }),
    ]);

    return res.json({ messages, total });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar mensagens' });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { connectionId, contactId, body } = req.body;
    if (!connectionId || !contactId || !body) {
      return res.status(400).json({ error: 'connectionId, contactId e body são obrigatórios' });
    }

    const [connection, contact] = await Promise.all([
      prisma.connection.findFirst({ where: { id: connectionId, companyId: req.user.companyId } }),
      prisma.contact.findFirst({ where: { id: contactId, companyId: req.user.companyId } }),
    ]);

    if (!connection) return res.status(404).json({ error: 'Conexão não encontrada' });
    if (!contact) return res.status(404).json({ error: 'Contato não encontrado' });
    if (connection.status !== 'connected') return res.status(400).json({ error: 'Conexão não está ativa' });

    const uazRes = await uazapi.post(`/instance/${connection.instanceId}/send/text`, {
      number: contact.phone,
      text: body,
    });

    const message = await prisma.message.create({
      data: {
        body,
        fromMe: true,
        status: 'sent',
        type: 'text',
        externalId: uazRes.data?.key?.id,
        contactId: contact.id,
        connectionId: connection.id,
        companyId: req.user.companyId,
      },
    });

    const io = req.app.get('io');
    io?.to(req.user.companyId).emit('message:new', { message, contact, connectionId: connection.id });

    return res.status(201).json(message);
  } catch (err) {
    console.error(err?.response?.data || err.message);
    return res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

router.get('/today/count', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await prisma.message.count({
      where: {
        companyId: req.user.companyId,
        createdAt: { gte: startOfDay },
      },
    });

    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao contar mensagens' });
  }
});

module.exports = router;
