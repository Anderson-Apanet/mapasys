import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, DocumentTextIcon, DocumentIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import html2pdf from 'html2pdf.js';

interface Contrato {
  id: number;
  created_at: string;
  complemento: string | null;
  contratoassinado: boolean | null;
  data_instalacao: string | null;
  dia_vencimento: number | null;
  id_empresa: number | null;
  endereco: string | null;
  liberado48: string | null;
  pppoe: string | null;
  senha: string | null;
  status: string | null;
  tipo: string | null;
  ultparcela: string | null;
  vendedor: string | null;
  data_cad_contrato: string | null;
  id_legado: string | null;
  id_cliente: number | null;
  planos: {
    id: number;
    nome: string;
    valor: number;
  } | null;
  bairros: {
    id: number;
    nome: string;
    cidade: string;
  } | null;
  cliente: string | null;
}

interface ContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contrato: Contrato;
  cliente?: {
    nome: string;
    cpf_cnpj: string;
    rg: string;
    email: string;
    fonewhats: string;
    cep: string;
  };
}

const ContratoModal: React.FC<ContratoModalProps> = ({ isOpen, onClose, contrato, cliente }) => {
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [documentType, setDocumentType] = useState<'adesao' | 'permanencia' | 'rescisao'>('adesao');

  const handleOpenDocument = (type: 'adesao' | 'permanencia' | 'rescisao') => {
    setDocumentType(type);
    setShowDocumentEditor(true);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const contractData = {
    clientName: cliente?.nome || contrato.cliente || '',
    cpf: cliente?.cpf_cnpj || '',
    rg: cliente?.rg || '',
    address: contrato.endereco || '',
    city: contrato.bairros?.cidade || '',
    state: 'RS',
    cep: cliente?.cep || '',
    email: cliente?.email || '',
    phone: cliente?.fonewhats || '',
    planName: contrato.planos?.nome || '',
    planValue: contrato.planos?.valor || 0,
    downloadSpeed: 300,
    uploadSpeed: 150,
    installationDate: contrato.data_instalacao || ''
  };

  const generateAdesaoTemplate = (contractData: any) => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    return `<div style="font-family: 'Times New Roman', Times, serif; font-size: 4px; line-height: 1; text-align: justify;">
<h1 style="text-align: center; font-size: 5px; margin: 2px 0; font-weight: bold;">TERMO DE ADESÃO AO CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE COMUNICAÇÃO MULTIMÍDIA, SERVIÇO DE VALOR ADICIONADO, LOCAÇÃO E OUTRAS AVENÇAS</h1>
<p style="text-align: justify;">Por este instrumento particular, o ASSINANTE abaixo qualificado contrata e adere ao Serviço da PRESTADORA:</p>
<h2 style="font-size: 4.5px; margin: 2px 0; font-weight: bold;">DADOS DA PRESTADORA</h2>
<p style="text-align: justify;">
Nome Empresarial: NOSTRANET TELECOM LTDA
CNPJ: 56.417.910/0001-29
Endereço: Av. Pé Rizziere Delai, nº 625
Bairro: Centro
Cidade: Três Cachoeiras
Estado: Rio Grande do Sul
CEP: 95580-000
Telefone: nº (51) 9922-0496, disponibilizado o recebimento de ligações a cobrar
E-mail: nostranet@nostranet.com.br</p>
<h2 style="font-size: 4.5px; margin: 2px 0; font-weight: bold;">QUALIFICAÇÃO DO ASSINANTE</h2>
<p style="text-align: justify;">
Nome: ${contractData.clientName}
CPF/CNPJ: ${contractData.cpf}
RG/ID: ${contractData.rg}
Endereço: ${contractData.address}
Bairro: ${contrato.bairros?.nome || '-'}
Cidade: ${contractData.city}
Estado: Rio Grande do Sul
CEP: ${contractData.cep}
Telefone: ${contractData.phone}
E-mail: ${contractData.email}</p>
<p style="text-align: justify;">O presente termo é regulamentado pelo Código Brasileiro do Consumidor e pelos Regulamentos referentes aos Serviços de Comunicação Multimídia (SCM) e Serviço de Valor Adicionado (SVA), no qual as opções abaixo determinados são de responsabilidade do ASSINANTE.</p>
<h2 style="font-size: 4.5px; margin: 2px 0; font-weight: bold;">Dados Técnicos e Comerciais do Plano de Acesso e Modalidade escolhida:</h2>
<p style="text-align: justify;">
Plano: ${contractData.planName}
Modalidade: ( ) Pré-pago
Velocidade máxima de upload: ${contractData.uploadSpeed} Mbps
Velocidade máxima de download: ${contractData.downloadSpeed} Mbps
IP : Fixo ( ) Variável ( )
Prazo Contratual: indeterminado
Taxa de instalação com Fidelidade: R$XXX,XX
Taxa de Instalação sem Fidelidade: R$XXX,XX
Equipamentos: Devidamente descrito na OS de instalação.
Equipamentos: ( ) Comodato da Contratada
Data de Vencimento: ${contrato.dia_vencimento || '-'}
Valor sem fidelidade: R$XXX,XX
Valor com fidelidade: R$XXX,XX
Fidelidade ( ) Sim ( ) Não
Autoriza o recebimento de mensagem publicitária em seu telefone móvel: ( ) S ( ) N
Autoriza que o documento de cobrança, correspondências e notificações sejam encaminhados por quaisquer meios eletrônicos indicados neste termo (e-mail, SMS, WhatsApp, dentre outros): (x) Sim ( ) Não
Sujeito à multa rescisória em caso de cancelamento antecipado: ( ) Sim ( ) Não
Forma de Pagamento: ( )Boleto Bancário ( )Débito Automático Banco XXXX</p>
<p style="text-align: justify;">Quando não incluídos no Plano de Acesso, o custo da Conexão Simultânea, Ponto de Acesso Adicional, das Horas de Conexão Adicionais (tecnologias distintas e/ou mesma tecnologia, mas fora dos períodos pré-definidos no Plano de Acesso), Franquia Adicional de Tráfego/Bits ou Horas, do Suporte Técnico e as visitas técnicas deverão ser pagas pelo ASSINANTE, juntamente com os pagamentos periódicos de seu Plano de Acesso, com base no número de ocorrências e/ou cálculo efetuado pelo sistema de bilhetagem (aferição e contagem de horas).</p>
<p style="text-align: justify;">O presente Termo de Adesão vigorará enquanto estiver vigente o CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE COMUNICAÇÃO MULTIMÍDIA, SERVIÇO DE VALOR ADICIONADO, LOCAÇÃO E OUTRAS AVENÇAS.</p>
<p style="text-align: justify;">O ASSINANTE fica cientificado que a PRESTADORA fiscalizará a regular utilização dos serviços ora contratados, e a violação das normas, caso detectada pela PRESTADORA, implicará aplicação das sanções atinentes à espécie, conforme estipulado no Contrato de Prestação de Serviço aderido.</p>
<p style="text-align: justify;">O ASSINANTE declara estar ciente que mesmo que a PRESTADORA forneça todas as condições necessárias para a prestação de serviços, caso os dispositivos de propriedade do ASSINANTE possuam outra versão do protocolo de conexão wireless ou tecnologia inferior aos equipamentos e serviços ofertados pela PRESTADORA, a banda contratada não será integralmente usufruída pelo dispositivo receptor.</p>
<p style="text-align: justify;">A PRESTADORA não garante prestação de suporte quando os equipamentos do ASSINANTE não forem compatíveis ou conhecidos pela PRESTADORA ou não possuam os requisitos mínimos necessários para garantir o padrão de qualidade e o desempenho adequado do serviço prestado, tais como, velocidade e disponibilidade, porém não limitado a estas.</p>
<p style="text-align: justify;">O ASSINANTE declara estar ciente que nos planos de acesso que seja definida a velocidade de conexão, o seu valor será expresso em Kbps (kilobits por segundo), que caracterizará o máximo possível a ser obtido, alusiva, tão-somente, ao cômodo no qual serão instalados os equipamentos de acesso e, para aferição de da velocidade, o equipamento deverá sempre ser ligado direto na ONU (roteador), via cabo, através de uma de suas portas LAN (REDE) e os demais dispositivos conectados nas portas LAN (REDE) ou no Wifi devem ser desconectados para a correta medição da velocidade.</p>
<p style="text-align: justify;"><strong style="font-size: 4px;">CONDIÇÕES DE DEGRADAÇÃO OU INTERRUPÇÃO DOS SERVIÇOS PRESTADOS:</strong> O ASSINANTE tem ciência dos motivos que podem culminar na degradação dos serviços de comunicação multimídia (SCM) prestados, são eles: (a) Ações da natureza, tais como chuvas, descargas atmosféricas e outras que configurem força maior; (b) Interferências prejudiciais provocadas por equipamentos de terceiros; (c) Bloqueio da visada limpa; (d) Casos fortuitos; (e) Interrupção de energia elétrica; (f) Falhas nos equipamentos e instalações; (g) Rompimento parcial ou total dos meios de rede; (h) Interrupções por ordem da ANATEL, ordem Judicial ou outra investida com poderes para tal; (i) outras previstas contratualmente;</p>
<p style="text-align: justify;"><strong style="font-size: 4px;">DECLARAÇÃO DE CONCORDÂNCIA:</strong> Declaro, para os devidos fins, que são corretos os dados cadastrais e informações por mim prestadas neste instrumento. Declaro ainda que os documentos apresentados para formalização deste contrato e as cópias dos documentos entregues à CONTRATADA pertencem a minha pessoa, tendo ciência das sanções civis e criminais caso prestar declarações falsas, entregar documentos falsos e me passar por outrem. Declaro estar ciente que a assinatura deste instrumento representa expressa concordância aos termos e condições do CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE COMUNICAÇÃO MULTIMÍDIA, SERVIÇO DE VALOR ADICIONADO, LOCAÇÃO E OUTRAS AVENÇAS, que juntamente com esse TERMO DE ADESÃO formam um só instrumento de direito, tendo lido e entendido claramente as condições ajustadas para esta contratação. Declaro ainda que tivesse prévio acesso a todas as informações relativas ao CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE COMUNICAÇÃO MULTIMÍDIA, SERVIÇO DE VALOR ADICIONADO, LOCAÇÃO E OUTRAS AVENÇAS, bem como ao Plano de Serviço por mim contratado, devidamente especificado neste Termo.</p>
<p style="text-align: justify;"><strong style="font-size: 4px;">AUTORIZAÇÃO:</strong> Autorizo o Outorgado (a), , CPF N° , a representar-me perante a PRESTADORA para o fim de solicitar alterações e/ou serviços adicionais, cancelamentos, negociar débitos, solicitar visitas e reparos, assinar ordens de serviço, termos de contratação e quaisquer solicitações, responder por mim frente a quaisquer questionamentos que sejam realizados, bem como transigir, firmar compromissos e dar quitação.</p>
<p style="text-align: justify;">A adesão ao presente Contrato importa na ciência e anuência do ASSINANTE de que o uso de seus dados pessoais (nome, telefone, e-mail) pela PRESTADORA é condição primordial para o fornecimento dos serviços, nos moldes do §3°, do art. 9° da Lei 13.709/18, ao mesmo passo que se aplica ao endereço IP do ASSINANTE, especialmente por se tratar de gestão de dado pessoal decorrente de cumprimento de obrigação legal e regulatória.</p>
<p style="text-align: justify;">E por estar de acordo com as cláusulas do presente termo e do CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE COMUNICAÇÃO MULTIMÍDIA, SERVIÇO DE VALOR ADICIONADO, LOCAÇÃO E OUTRAS AVENÇAS, parte integrante deste Termo de Adesão, o ASSINANTE aposta sua assinatura abaixo ou o aceita eletronicamente, para que surta todos os seus efeitos legais.</p>
<p style="text-align: justify;">A cópia integral do CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE COMUNICAÇÃO MULTIMÍDIA, SERVIÇO DE VALOR ADICIONADO, LOCAÇÃO E OUTRAS AVENÇAS pode ser obtida no Cartório de Registro de Títulos e Documentos da Comarca de Arroio do Sal/RS.</p>
<div style="margin-top: 10px; text-align: center; font-size: 4px;">Três Cachoeiras, ${currentDate}</div>
<div style="margin-top: 15px; text-align: center; font-size: 4px;">
_______________________________________________<br>
NOSTRANET TELECOM LTDA<br><br>
_______________________________________________<br>
${contractData.clientName}<br>
CPF/CNPJ: ${contractData.cpf}
</div>
</div>`;
  };

  const generatePermanenciaTemplate = (contractData: any) => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    return `<div style="font-family: 'Times New Roman', Times, serif; font-size: 4px; line-height: 1; text-align: justify;">
<h1 style="text-align: center; font-size: 5px; margin: 2px 0; font-weight: bold;">CONTRATO DE PERMANÊNCIA</h1>
<p style="text-align: center; font-size: 4px; margin: 2px 0;">(Vinculado ao Contrato de Prestação de Serviços e ao Termo de Adesão celebrado entre a PRESTADORA e o ASSINANTE)</p>

<p style="text-align: justify;">Por este instrumento, ${contractData.clientName}, inscrito no RG de nº${contractData.rg}, e no CPF sob o nº ${contractData.cpf}, residente e domiciliado na ${contractData.address}, ${contractData.city} - ${contractData.state}, ${contractData.cep}, Brasil, Bairro ${contrato.bairros?.nome || '-'}, na Cidade de ${contractData.city} do Estado de Rio Grande do Sul, denominado ASSINANTE, que contratou o Serviço de Comunicação Multimídia, Serviço de Valor Adicionado, Locação e Outras Avenças, ofertado por NOSTRANET TELECOM LTDA, nome fantasia NOSTRANET TELECOM, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº. 56.417.910/0001-29, com sede na Av. Pé Rizziere Delai, nº 625, Bairro Centro, CEP: 95580-000, na cidade Três Cachoeiras, Estado de Rio Grande do Sul, autorizada pela Anatel para explorar o Serviço de Comunicação Multimídia pelo Ato nº. 3423 de 14 de maio de 2021, na modalidade avulsa ou conjunta, ora formalizam os benefícios concedidos, mediante compromisso de fidelização.</p>

<p style="text-align: justify;">1. O ASSINANTE, ao contratar os serviços prestados pela PRESTADORA nas modalidades por ela ofertadas, expressa sua aceitação e se compromete a permanecer como cliente da PRESTADORA pelo prazo de 12 (doze) meses, a contar da data de contratação dos serviços, tendo em vista o recebimento dos benefícios descritos neste instrumento.</p>

<p style="text-align: justify;">1.1 Os serviços ora adquiridos pelo ASSINANTE, seja na modalidade avulsa ou na conjunta, são ofertados com preços mais vantajosos em relação aos valores integrais dos serviços, justamente em face da fidelidade aqui pactuada, conforme consta do item abaixo transcrito.</p>

<p style="text-align: justify;">1.2 A PRESTADORA concedeu ao ASSINANTE os seguintes benefícios, válidos exclusivamente durante o prazo de fidelidade contratual:</p>

<p style="text-align: justify;">Plano: ${contractData.planName} Origem do desconto: Ativação Valor com fidelidade: ${contractData.planValue}</p>

<p style="text-align: justify;">1.3. Desta forma, na hipótese de rescisão contratual antes de findo o prazo de fidelidade, o ASSINANTE pagará à PRESTADORA, a título de multa rescisória, a importância correspondente ao benefício que efetivamente usufruiu, proporcionalmente aos meses restantes do contrato, cujo valor será corrigido pelo IGP-M ou outro que eventualmente vier a substituí-lo.</p>

<p style="text-align: center; font-size: 4.5px; font-weight: bold;">TABELA MULTA RESCISÃO ANTECIPADA</p>
<p style="text-align: justify;">Desconto proporcional mensal Mensalidade: R$ 50,00</p>
<p style="text-align: justify;">Valor total dos benefícios concedidos: R$ 600,00</p>

<div style="font-size: 4px;">
PEDIDO DE CANCELAMENTO -------- VALOR TOTAL DA MULTA RESCISÓRIA
Com 1 (um) mês de uso    -------- R$ 600,00
Com 2 (dois) meses de uso  -------- R$ 550,00
Com 3 (três) meses de uso  -------- R$ 500,00
Com 4 (quatro) meses de uso ------- R$ 450,00
Com 5 (cinco) meses de uso -------- R$ 400,00
Com 6 (seis) meses de uso  -------- R$ 350,00
Com 7 (sete) meses de uso  -------- R$ 300,00
Com 8 (oito) meses de uso  -------- R$ 250,00
Com 9 (nove) meses de uso  -------- R$ 200,00
Com 10 (dez) meses de uso  -------- R$ 150,00
Com 11 (onze) meses de uso -------- R$ 100,00
Com 12 (doze) meses de uso ------- R$ 50,00</div>

<p style="text-align: justify;">2. Não obstante, o ASSINANTE não estará sujeito ao pagamento da multa apenas nas hipóteses abaixo elencadas:</p>

<p style="text-align: justify;">a) houver superveniente incapacidade técnica da PRESTADORA para o cumprimento das condições técnicas e funcionais dos serviços contratados, no mesmo endereço de instalação;</p>

<p style="text-align: justify;">b) se o cancelamento for solicitado em razão de descumprimento de obrigação contratual ou legal por parte da PRESTADORA.</p>

<p style="text-align: justify;">2.1. A adesão do ASSINANTE a outra oferta da PRESTADORA (promocional ou não), antes de decorridos 12 (doze) meses da contratação, implicará em descumprimento da fidelidade ora avençada, ensejando, também, a incidência da multa prevista neste Contrato de Permanência.</p>

<p style="text-align: justify;">3. Conforme delineado no Contrato de Prestação de Serviço de Comunicação Multimídia, Serviço de Valor Adicionado, Locação e Outras Avenças, as promoções nunca excederão ao prazo máximo de 12 (doze) meses, podendo viger por prazo inferior caso haja estipulação em contrário nos respectivos anúncios ou lançamentos.</p>

<p style="text-align: justify;">4. O ASSINANTE declara estar ciente de que lhe é facultada a contratação avulsa e individual de qualquer serviço ofertado pela PRESTADORA, sem a obrigatoriedade de adesão ao presente Termo, contudo sem os benefícios que decorrem da fidelidade.</p>

<p style="text-align: justify;">5. Na hipótese de eventual período de suspensão dos serviços, por solicitação do ASSINANTE ou por inadimplência, as obrigações contratuais das partes ficam prorrogadas pelo período da suspensão, assim como a fluência do prazo de permanência fica igualmente suspensa, voltando a transcorrer após o retorno da referida prestação.</p>

<p style="text-align: justify;">6. É de pleno conhecimento das partes que este instrumento é complementar e indissociável ao Contrato de Prestação de Serviço de Comunicação Multimídia, Serviço de Valor Adicionado, Locação e Outras Avenças, e ao respectivo Termo de Adesão.</p>

<p style="text-align: justify;">7. Fica, desde já, eleito o Foro do domicílio do Assinante como o competente para dirimir qualquer conflito ou controvérsia oriunda deste Termo, em detrimento de quaisquer outros, por mais especiais ou privilegiados que sejam.</p>

<div style="margin-top: 10px; text-align: center; font-size: 4px;">Três Cachoeiras, ${currentDate}</div>

<div style="margin-top: 15px; text-align: center; font-size: 4px;">
_______________________________________________<br>
NOSTRANET TELECOM LTDA<br><br>
_______________________________________________<br>
${contractData.clientName}<br>
CPF/CNPJ: ${contractData.cpf}
</div>
</div>`;
  };

  const generateRescisaoTemplate = (contractData: any) => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    return `<div style="font-family: 'Times New Roman', Times, serif; font-size: 4px; line-height: 1; text-align: justify;">
<h1 style="text-align: center; font-size: 5px; margin: 2px 0; font-weight: bold;">RESCISÃO DE CONTRATO</h1>

<p style="text-align: justify; margin-top: 15px;">A empresa NOSTRANET TELECOM LTDA, inscrita no CNPJ nº 56.417.910.0001-00 e Inscrição Estadual nº 250/0020066, situada a Av. Pé Rizziere Delai, 625/103, Centro de Três Cachoeiras RS, representada pelo seu sócio Bernard Becker dos Santos, portador do CPF nº 012.484.840-02, informa que não prestará mais serviços de fornecimento de Internet à ${contractData.clientName}, portador(a) do CPF nº ${contractData.cpf} e RG nº ${contractData.rg} na cidade de ${contractData.city} a partir da data de ______________________</p>

<p style="text-align: justify; margin-top: 15px;">MOTIVO DA RESCISÃO:</p>
<p style="text-align: justify; margin-top: 10px;">_______________________________________________________________________________________</p>
<p style="text-align: justify;">_______________________________________________________________________________________</p>
<p style="text-align: justify;">_______________________________________________________________________________________</p>

<div style="margin-top: 25px; text-align: center; font-size: 4px;">
_______________________________________________<br>
${contractData.clientName}
</div>

<div style="margin-top: 25px; text-align: center; font-size: 4px;">
_______________________________________________<br>
NOSTRANET TELECOM
</div>

<div style="margin-top: 25px; text-align: center; font-size: 4px;">
Três Cachoeiras, ${currentDate}
</div>
</div>`;
  };

  const handleGeneratePDF = () => {
    try {
      const editorContent = document.querySelector('.ql-editor')?.innerHTML;
      if (!editorContent) {
        console.error('No content found in the editor');
        return;
      }

      const styledContent = `<style>
        .ql-editor p { text-align: justify; }
      </style>${editorContent}`;

      const options = {
        margin: 1,
        filename: `contrato_${documentType}_${contrato.pppoe}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().from(styledContent).set(options).save();
      console.log('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <>
      <Dialog
        as="div"
        className="fixed inset-0 z-[60] overflow-y-auto"
        open={isOpen}
        onClose={onClose}
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl p-6">
            <div className="absolute top-4 right-4">
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <Dialog.Title className="text-2xl font-bold text-gray-900 border-b pb-4">
                  Detalhes do Contrato
                </Dialog.Title>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Informações do Cliente</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Nome:</span> {cliente?.nome}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">CPF/CNPJ:</span> {cliente?.cpf_cnpj}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">RG:</span> {cliente?.rg}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {cliente?.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Telefone:</span> {cliente?.fonewhats}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Detalhes do Plano</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Plano:</span> {contrato.planos?.nome}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Valor:</span> R$ {contrato.planos?.valor}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">PPPoE:</span> {contrato.pppoe}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Dia Vencimento:</span> {contrato.dia_vencimento}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Data de Instalação:</span> {formatDate(contrato.data_instalacao)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Status:</span> {contrato.status}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Endereço</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Endereço:</span> {contrato.endereco}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Bairro:</span> {contrato.bairros?.nome}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Cidade:</span> {contrato.bairros?.cidade}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 mt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Documentos do Contrato</h3>
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 bg-white">
                  <button
                    onClick={() => {
                      setDocumentType('adesao');
                      setShowDocumentEditor((prev) => !prev);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    <DocumentIcon className="h-5 w-5 mr-2" />
                    Contrato de Adesão
                  </button>
                  <button
                    onClick={() => {
                      setDocumentType('permanencia');
                      setShowDocumentEditor((prev) => !prev);
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                  >
                    <DocumentIcon className="h-5 w-5 mr-2" />
                    Contrato de Permanência
                  </button>
                  <button
                    onClick={() => {
                      setDocumentType('rescisao');
                      setShowDocumentEditor((prev) => !prev);
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                  >
                    <DocumentIcon className="h-5 w-5 mr-2" />
                    Rescisão
                  </button>
                </div>
              </div>

              {showDocumentEditor && (
                <div className="bg-white rounded-lg shadow p-4 mt-6" style={{ minHeight: '600px', height: 'auto' }}>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center justify-between">
                    Editor de Documento
                    <button
                      onClick={() => handleGeneratePDF()}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                      <PrinterIcon className="h-5 w-5 mr-2" />
                      Gerar PDF
                    </button>
                  </h3>
                  <ReactQuill
                    value={documentType === 'adesao' ? generateAdesaoTemplate(contractData) : documentType === 'permanencia' ? generatePermanenciaTemplate(contractData) : generateRescisaoTemplate(contractData)}
                    onChange={() => {}}
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ align: [] }],
                        ['link', 'image'],
                        ['clean'],
                      ],
                    }}
                    className="h-auto"
                    style={{ minHeight: '500px', height: 'auto' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ContratoModal;
