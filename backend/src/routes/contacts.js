const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      companyId: req.user.companyId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
      prisma.contact.count({ where }),
    ]);

    return res.json({ contacts, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar contatos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, tags } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });

    const contact = await prisma.contact.create({
      data: {
        name,
        phone,
        email,
        tags: tags || [],
        companyId: req.user.companyId,
      },
    });

    return res.status(201).json(contact);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Contato já cadastrado com esse telefone' });
    return res.status(500).json({ error: 'Erro ao criar contato' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, tags } = req.body;

    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!contact) return res.status(404).json({ error: 'Contato não encontrado' });

    const updated = await prisma.contact.update({
      where: { id: req.params.id },
      data: { name, email, tags },
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar contato' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!contact) return res.status(404).json({ error: 'Contato não encontrado' });

    await prisma.contact.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Contato removido' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao remover contato' });
  }
});

module.exports = router;
