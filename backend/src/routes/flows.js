const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const flows = await prisma.flow.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(flows);
  } catch {
    return res.status(500).json({ error: 'Erro ao listar fluxos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    const flow = await prisma.flow.create({
      data: { name, description: description || null, companyId: req.user.companyId },
    });
    return res.status(201).json(flow);
  } catch {
    return res.status(500).json({ error: 'Erro ao criar fluxo' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const flow = await prisma.flow.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!flow) return res.status(404).json({ error: 'Fluxo não encontrado' });

    const updated = await prisma.flow.update({
      where: { id: flow.id },
      data: req.body,
    });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar fluxo' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const flow = await prisma.flow.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!flow) return res.status(404).json({ error: 'Fluxo não encontrado' });
    await prisma.flow.delete({ where: { id: flow.id } });
    return res.json({ message: 'Fluxo removido' });
  } catch {
    return res.status(500).json({ error: 'Erro ao remover fluxo' });
  }
});

module.exports = router;
