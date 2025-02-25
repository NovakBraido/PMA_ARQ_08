import React, { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { jsPDF } from "jspdf";
import { Calendar, Clock, Save, FileText, Trash2 } from "lucide-react";

interface InventoryData {
  data: string;
  hora: string;
  patrimonio: string;
  modelo: string;
  secretaria: string;
  status: string;
  responsavel: string;
}

function App() {
  const [formData, setFormData] = useState<InventoryData>({
    data: "",
    hora: "",
    patrimonio: "",
    modelo: "",
    secretaria: "",
    status: "Ativo",
    responsavel: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const signaturePadRef = useRef<SignatureCanvas | null>(null);

  const autoDateTime = () => {
    const now = new Date();
    setFormData((prev) => ({
      ...prev,
      data: now.toLocaleDateString("pt-BR"),
      hora: now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const generateAndSavePDF = async () => {
    try {
      setIsSaving(true);

      if (!signaturePadRef.current) {
        alert("Por favor, adicione uma assinatura");
        setIsSaving(false);
        return;
      }

      const signatureDataUrl = signaturePadRef.current.toDataURL();
      const doc = new jsPDF();

      // Adicionar conteúdo ao PDF
      doc.setFontSize(16);
      doc.text("Termo de Retirada de Patrimônio", 105, 20, { align: "center" });

      doc.setFontSize(12);
      doc.text(`Data: ${formData.data}`, 20, 40);
      doc.text(`Hora: ${formData.hora}`, 20, 50);
      doc.text(`Patrimônio: ${formData.patrimonio}`, 20, 60);
      doc.text(`Modelo: ${formData.modelo}`, 20, 70);
      doc.text(`Secretaria: ${formData.secretaria}`, 20, 80);
      doc.text(`Status: ${formData.status}`, 20, 90);
      doc.text(`Responsável: ${formData.responsavel}`, 20, 100);

      // Adicionar assinatura
      doc.addImage(signatureDataUrl, "PNG", 20, 120, 70, 30);
      doc.text("Assinatura do Responsável", 55, 160, { align: "center" });

      const pdfBase64 = doc.output("datauristring");

      // Enviar para o servidor
      const response = await fetch("/api/salvar-registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData,
          pdfBase64,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar o registro");
      }

      const result = await response.json();

      if (result.success) {
        alert("Documento gerado e salvo com sucesso!");
        setShowPreview(false);
        setFormData({
          data: "",
          hora: "",
          patrimonio: "",
          modelo: "",
          secretaria: "",
          status: "",
          responsavel: "",
        });
        clearSignature();
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao gerar e salvar o documento");
    } finally {
      setIsSaving(false);
    }
  };

  const PreviewData = () => (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Confirmar Dados</h2>
        <div className="modal-content">
          <p>
            <strong>Data:</strong> {formData.data}
          </p>
          <p>
            <strong>Hora:</strong> {formData.hora}
          </p>
          <p>
            <strong>Patrimônio:</strong> {formData.patrimonio}
          </p>
          <p>
            <strong>Modelo:</strong> {formData.modelo}
          </p>
          <p>
            <strong>Secretaria:</strong> {formData.secretaria}
          </p>
          <p>
            <strong>Status:</strong> {formData.status}
          </p>
          <p>
            <strong>Responsável:</strong> {formData.responsavel}
          </p>
        </div>
        <div className="modal-actions">
          <button
            onClick={() => setShowPreview(false)}
            className="btn btn-outline"
            disabled={isSaving}
          >
            Voltar
          </button>
          <button
            onClick={generateAndSavePDF}
            className="btn btn-success"
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Confirmar e Gerar Documento"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container">
      <header className="header">
        <div className={`modal ${showPreview ? "show" : "hide"}`}>
          <h1>Sistema de Retirada de Patrimônio</h1>
          <p>Prefeitura Municipal de Ariquemes</p>
        </div>
      </header>

      <div className="form-container">
        <div className="form-group">
          <label className="form-label">
            <Calendar size={16} className="icon" />
            Data
          </label>
          <div className="input-group">
            <input
              type="text"
              name="data"
              value={formData.data}
              onChange={handleInputChange}
              className="form-input"
              placeholder="DD/MM/AAAA"
            />
            <button onClick={autoDateTime} className="btn btn-primary">
              <Clock size={16} /> Auto
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            <Clock size={16} className="icon" />
            Hora
          </label>
          <input
            type="text"
            name="hora"
            value={formData.hora}
            onChange={handleInputChange}
            className="form-input"
            placeholder="HH:MM"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <FileText size={16} className="icon" />
            Patrimônio
          </label>
          <input
            type="text"
            name="patrimonio"
            value={formData.patrimonio}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Número do patrimônio"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Modelo</label>
          <input
            type="text"
            name="modelo"
            value={formData.modelo}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Modelo do equipamento"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Secretaria</label>
          <input
            type="text"
            name="secretaria"
            value={formData.secretaria}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Nome da secretaria"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="form-select"
          >
            <option value="Ativo">Ativo</option>
            <option value="Em Manutenção">Em Manutenção</option>
            <option value="Inativo">Inativo</option>
            <option value="Baixado">Baixado</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Responsável</label>
          <input
            type="text"
            name="responsavel"
            value={formData.responsavel}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Nome do responsável"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Assinatura Digital</label>
          <div className="signature-container">
            <SignatureCanvas
              ref={signaturePadRef}
              canvasProps={{
                style: {
                  border: "4px solid #374151", // Borda visível com cor escura (var(--gray-700))
                  borderRadius: "8px", // Bordas arredondadas
                  width: "100%", // Largura total
                  height: "200px", // Altura fixa
                  marginBottom: "1rem", // Espaçamento abaixo
                  backgroundColor: "white", // Fundo branco
                },
              }}
            />
            <button onClick={clearSignature} className="btn btn-danger">
              <Trash2 size={16} /> Limpar Assinatura
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowPreview(true)}
          className="btn btn-success btn-block"
        >
          <Save size={16} /> Verificar Dados e Confirmar
        </button>
      </div>

      {showPreview && <PreviewData />}
    </div>
  );
}

export default App;
