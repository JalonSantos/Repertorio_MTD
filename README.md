# Repertório - MTD (Ministério Tabernáculo de Davi)

Sistema web moderno para gerenciamento de repertório de louvor da igreja.

Desenvolvido para facilitar a vida dos músicos, permitindo adicionar, editar, visualizar e enviar repertórios de forma rápida e organizada.

---

## ✨ Funcionalidades

### Principais
- **Listagem de músicas** com busca por título, autor ou letra
- **Filtro por categorias** (dropdown organizado e responsivo)
- **Visualização completa** da música com:
  - Letra formatada
  - Player integrado do YouTube/Spotify
  - Botão "Abrir link" quando necessário
- **Modo Leitura / Projeção** (telão)
  - Letra grande e centralizada
  - Fundo escuro otimizado para projetor
  - Zoom com botões (+ / – / Reset) + pinch-zoom
  - Título escondido automaticamente no celular
  - Fullscreen automático
- **Adicionar e Editar músicas** diretamente no site (sem precisar entrar no Banco de dados)
- **Seleção múltipla de músicas** para montar repertório
- **Envio por WhatsApp** inteligente:
  - Detecta automaticamente se é celular ou computador
  - No celular abre o app WhatsApp
  - No computador abre o WhatsApp Web
  

### Histórico
- **Histórico automático** de todos os repertórios enviados
- Salva data, tipo de culto, músicas e mensagem enviada
- Opção de **reenviar** qualquer lista antiga com um clique
- Visualização organizada com data e hora

### Design & Experiência
- Interface moderna e escura (dark mode)
- Totalmente responsivo (funciona muito bem no celular)
- Cards com hover elegante e ícones
- Modo leitura otimizado para projeção
- Scroll suave e navegação intuitiva

---

## 🛠 Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend/Database**: Firebase Firestore
- **Hospedagem**: GitHub Pages
- **PWA**: Service Worker (funciona offline básico)
- **Fonte especial**: Lora (para modo leitura)

---

## 🚀 Como Usar

### Para o time de louvor / músicos:

1. Abra o link do app
2. Busque ou filtre por categoria a música desejada
3. Clique em **"Abrir"** para ver letra e ouvir
4. Clique em **"👁️"** para entrar no **Modo Leitura** (ideal para projetor)
5. Para montar repertório:
   - Clique em **"🎵 Selecionar músicas"**
   - Escolha o culto e a data
   - Selecione as músicas desejadas
   - Clique em **"📱 Enviar"** → abre o WhatsApp com a lista formatada

### Para adicionar/editar músicas:
- Clique em **"+ Música"**
- Preencha os dados e salve
- Para editar: abra a música → clique no ícone ✏️

---

## 📱 Telas Principais

- Listagem com filtro e busca
- Visualização da música
- Modo Leitura / Projeção (telão)
- Seleção de repertório
- Envio por WhatsApp
- Histórico de repertórios enviados

---

## 📂 Estrutura do Projeto

MTD-Repertorio/
├── index.html
├── styles.css
├── script.js
├── sw.js (Service Worker)
├── manifest.json
├── icons/
└── README.md


---

## 🔮 Próximas Melhorias (em estudo)

- Ordenação de músicas selecionadas (drag and drop)
- Auto-scroll na letra (rolagem automática)
- Favoritos / Músicas mais tocadas
- Login simples para múltiplos usuários

---

## 👨‍💻 Desenvolvido por

**Jalon Santos**  
Com carinho para o Ministério Tabernáculo de Davi ❤️

---

**Quer contribuir?**  
Sinta-se à vontade para abrir issues ou pull requests!

---

