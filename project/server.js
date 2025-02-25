import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar pasta para PDFs e CSV
const STORAGE_DIR = join(__dirname, 'storage');
const PDF_DIR = join(STORAGE_DIR, 'pdfs');
const CSV_FILE = join(STORAGE_DIR, 'registros.csv');

// Criar diretórios se não existirem
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR);
}
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR);
}

// Configurar CSV Writer
const csvWriter = createObjectCsvWriter({
  path: CSV_FILE,
  header: [
    { id: 'data', title: 'Data' },
    { id: 'hora', title: 'Hora' },
    { id: 'patrimonio', title: 'Patrimônio' },
    { id: 'modelo', title: 'Modelo' },
    { id: 'secretaria', title: 'Secretaria' },
    { id: 'status', title: 'Status' },
    { id: 'responsavel', title: 'Responsável' },
    { id: 'arquivo_pdf', title: 'Arquivo PDF' }
  ],
  append: true
});

app.use(express.json({ limit: '50mb' }));
app.use(express.static(join(__dirname, 'dist')));
app.use('/pdfs', express.static(PDF_DIR));

// Rota para salvar PDF e dados
app.post('/api/salvar-registro', async (req, res) => {
  try {
    const { formData, pdfBase64 } = req.body;
    const timestamp = new Date().getTime();
    const pdfFileName = `termo-retirada-patrimonio-${timestamp}.pdf`;
    const pdfPath = join(PDF_DIR, pdfFileName);

    // Salvar PDF
    const pdfBuffer = Buffer.from(pdfBase64.split(',')[1], 'base64');
    fs.writeFileSync(pdfPath, pdfBuffer);

    // Salvar registro no CSV
    await csvWriter.writeRecords([{
      ...formData,
      arquivo_pdf: pdfFileName
    }]);

    res.json({ success: true, pdfFileName });
  } catch (error) {
    console.error('Erro ao salvar registro:', error);
    res.status(500).json({ error: 'Erro ao salvar registro' });
  }
});

// Rota para todas as requisições
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`PDFs serão salvos em: ${PDF_DIR}`);
  console.log(`Registros CSV em: ${CSV_FILE}`);
});