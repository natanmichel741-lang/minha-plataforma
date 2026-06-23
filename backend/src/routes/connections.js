const router = require('express').Router();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// uazapi free usa "admintoken" para criar instâncias; instâncias usam "token" com o próprio instanceToken
function uazapi() {
  return axios.create({
    baseURL: process.env.UAZAPI_BASE_URL,
    headers: { admintoken: process.env.UAZAPI_TOKEN },
    timeout: 15000,
  });
}

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const connections = await prisma.connection.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(connections);
  } catch {
    return res.status(500).json({ error: 'Erro ao listar conexões' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const uazRes = await uazapi().post('/instance/create', { name });
    const data = uazRes.data;

    // uazapi pode retornar instanceId ou id; token ou instanceToken
    const instanceId = data.instanceId || data.id || data.instance?.id || name;
    const instanceToken = data.token || data.instanceToken || data.instance?.token || '';

    const connection = await prisma.connection.create({
      data: {
        name,
        instanceId,
        instanceToken,
        companyId: req.user.companyId,
        status: 'disconnected',
      },
    });

    return res.status(201).json(connection);
  } catch (err) {
    const msg = err?.response?.data?.error || err?.response?.data?.message || err.message;
    console.error('Erro ao criar conexão:', msg);
    return res.status(500).json({ error: `Erro ao criar conexão: ${msg}` });
  }
});

router.get('/:id/qrcode', async (req, res) => {
  try {
    const connection = await prisma.connection.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!connection) return res.status(404).json({ error: 'Conexão não encontrada' });

    const client = axios.create({
      baseURL: process.env.UAZAPI_BASE_URL,
      headers: { token: connection.instanceToken },
      timeout: 20000,
    });

    // POST /instance/connect inicia a conexão e retorna o QR Code em instance.qrcode
    const uazRes = await client.post('/instance/connect');
    const qrcode = uazRes.data?.instance?.qrcode || uazRes.data?.qrcode || '';

    await prisma.connection.update({
      where: { id: connection.id },
      data: { status: 'connecting' },
    });

    return res.json({ qrcode });
  } catch (err) {
    const msg = err?.response?.data?.error || err?.response?.data?.message || err.message;
    return res.status(500).json({ error: `Erro ao obter QR Code: ${msg}` });
  }
});

router.get('/:id/status', async (req, res) => {
  try {
    const connection = await prisma.connection.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!connection) return res.status(404).json({ error: 'Conexão não encontrada' });

    const client = axios.create({
      baseURL: process.env.UAZAPI_BASE_URL,
      headers: { token: connection.instanceToken || process.env.UAZAPI_TOKEN },
      timeout: 15000,
    });

    const uazRes = await client.get('/instance/status');
    // uazapi retorna instance.status (string) e status.connected (boolean)
    const status = uazRes.data?.instance?.status || (uazRes.data?.status?.connected ? 'connected' : 'disconnected');

    await prisma.connection.update({
      where: { id: connection.id },
      data: { status },
    });

    return res.json({ status });
  } catch (err) {
    const msg = err?.response?.data?.error || err?.response?.data?.message || err.message;
    return res.status(500).json({ error: `Erro ao verificar status: ${msg}` });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const connection = await prisma.connection.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!connection) return res.status(404).json({ error: 'Conexão não encontrada' });

    const client = axios.create({
      baseURL: process.env.UAZAPI_BASE_URL,
      headers: { token: connection.instanceToken || process.env.UAZAPI_TOKEN },
      timeout: 15000,
    });

    await client.delete('/instance/delete').catch(() => {});
    await prisma.connection.delete({ where: { id: connection.id } });

    return res.json({ message: 'Conexão removida com sucesso' });
  } catch {
    return res.status(500).json({ error: 'Erro ao remover conexão' });
  }
});

module.exports = router;
