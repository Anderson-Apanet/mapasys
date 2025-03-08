# MapaSys - Sistema de Gestão para Provedores de Internet

MapaSys é uma aplicação web completa desenvolvida para provedores de internet, oferecendo funcionalidades para gerenciamento de clientes, contratos, agendamentos, documentos e muito mais.

## Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express
- **Banco de Dados**: Supabase (PostgreSQL), MySQL (para integração com Radius)
- **Mapas**: Google Maps API
- **Calendário**: FullCalendar
- **Gráficos**: Chart.js, Recharts
- **Integração de Pagamentos**: ASAAS API
- **Drag and Drop**: DnD Kit, React Beautiful DnD
- **Editores**: React Quill (editor de texto)
- **Exportação de Documentos**: HTML2PDF, jsPDF, PDFMake

## Funcionalidades Principais

- **Dashboard**: Visualização de métricas e indicadores de desempenho
- **Gestão de Clientes**: Cadastro, edição e gerenciamento de clientes
- **Gestão de Contratos**: Criação e gerenciamento de contratos
- **Agenda**: Agendamento de instalações e visitas técnicas
- **Documentos**: Editor de documentos com modelos personalizáveis
- **Mapas**: Visualização geográfica de clientes e instalações
- **Relatórios**: Geração de relatórios financeiros e operacionais
- **Integração com Radius**: Gerenciamento de autenticação e acesso à rede

## Instalação e Configuração

### Pré-requisitos

- Node.js 18+ e npm
- MySQL (para integração com Radius)
- Conta no Supabase
- Conta no ASAAS (para integração de pagamentos)
- Chave de API do Google Maps

### Configuração do Ambiente

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/mapasys.git
   cd mapasys
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`
   - Preencha as variáveis com suas credenciais

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Estrutura do Projeto

- `/src`: Código-fonte principal
  - `/assets`: Recursos estáticos
  - `/components`: Componentes React reutilizáveis
  - `/contexts`: Contextos React para gerenciamento de estado
  - `/hooks`: Hooks personalizados
  - `/lib`: Bibliotecas e configurações
  - `/pages`: Páginas da aplicação
  - `/server`: Código do servidor Express
  - `/services`: Serviços para comunicação com APIs
  - `/types`: Definições de tipos TypeScript
  - `/utils`: Funções utilitárias

## Implantação

O projeto está configurado para implantação em:
- Docker (usando docker-compose)
- Vercel
- Render

## Contribuição

Contribuições são bem-vindas! Por favor, sinta-se à vontade para enviar pull requests.

## Licença

Este projeto está licenciado sob a licença [sua licença aqui].
