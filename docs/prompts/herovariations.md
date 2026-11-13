IACODE 1 — Hero com robô + Kanban
Analise o projeto atual do BChat Copilot e reformule apenas a seção Hero da homepage.
Antes de implementar:
identifique o framework, sistema de estilos e estrutura de componentes existentes;
encontre o componente atual da Hero;
reutilize os componentes, tokens, fontes, breakpoints, cores e padrões já existentes;
não troque bibliotecas ou arquitetura sem necessidade.
OBJETIVO
Transformar a Hero atual em uma apresentação premium de um produto SaaS B2B de automação empresarial com IA.
A mensagem principal deve ser:
“Sua equipe conversa.
Seus agentes de IA executam.”
Subheadline:
“O BChat Copilot entende o contexto, consulta conhecimento, sugere a próxima ação e automatiza fluxos empresariais para reduzir esforço manual e acelerar sua operação.”
CTA principal:
“Solicitar demonstração”
CTA secundário:
“Ver como funciona”
LAYOUT DESKTOP
Criar uma Hero em duas regiões.
Lado esquerdo:
eyebrow pequeno: “Copiloto de IA + automação agêntica”
headline grande
destacar “Seus agentes de IA executam.” com a cor cyan da identidade atual
subheadline
CTA principal
CTA secundário
opcionalmente adicionar uma pequena prova de valor abaixo dos CTAs
Lado direito:
utilizar o asset do robô + Kanban como elemento principal
não deixar o robô dominar visualmente a composição
o Kanban precisa ser o elemento visual mais importante
Sobrepor ao asset alguns componentes HTML reais, não incorporados na imagem:
Card 1:
“Contexto identificado”
“Cliente solicitou atualização cadastral”
Card 2:
“Sugestão contextual”
“Atualizar cadastro e encaminhar para validação”
Card 3:
“Automação acionada”
“Fluxo de cadastro iniciado”
Card 4:
“Status”
“Em execução”
Criar esses cards usando glassmorphism, border sutil, background translúcido e glow muito discreto.
Criar conexões visuais entre alguns cards e o Kanban usando CSS/SVG.
ANIMAÇÕES
Implementar microanimações extremamente sutis:
cards flutuando entre 2 e 5px
glow pulsando suavemente
uma pequena linha de dados atravessando o fluxo
card do Kanban simulando movimentação de uma etapa para outra
Respeitar:
prefers-reduced-motion
Não usar animações excessivas.
IDENTIDADE VISUAL
Preservar a linguagem atual do BChat Copilot:
fundo quase preto
navy
cyan/turquesa
bordas discretas
grid de fundo
tipografia branca
aparência tecnológica e enterprise
Adicionar radial gradients extremamente sutis atrás da área visual.
Não transformar a interface em cyberpunk.
RESPONSIVIDADE
Desktop:
duas colunas
conteúdo visual expressivo
Tablet:
reduzir elementos flutuantes
manter mensagem e asset
Mobile:
headline primeiro
CTAs abaixo
imagem abaixo do conteúdo
esconder elementos decorativos secundários
garantir que nenhum conteúdo ultrapasse a viewport
QUALIDADE
HTML semântico
acessibilidade
alt adequado para a imagem
foco visível
contraste WCAG apropriado
evitar layout shift
otimizar carregamento da imagem
não adicionar dependências desnecessárias
preservar SEO existente
manter boa performance
Ao terminar:
informe os arquivos alterados
explique brevemente as principais decisões
não altere outras seções da homepage desnecessariamente.
IACODE 2 — Hero Conversa → IA → Kanban
Analise o código existente do BChat Copilot e reformule somente a seção Hero da homepage.
Primeiro inspecione o projeto e reutilize o stack, componentes, tokens, fontes e convenções já existentes.
Não reescreva o projeto nem adicione bibliotecas sem necessidade.
CONCEITO PRINCIPAL
A Hero deve demonstrar visualmente:
CONVERSA
↓
CONTEXTO
↓
DECISÃO
↓
AUTOMAÇÃO
↓
RESULTADO
O visitante deve compreender em poucos segundos que o BChat Copilot transforma conversas em execução operacional.
HEADLINE
“Transforme conversas em ações automatizadas.”
Destacar “ações automatizadas” utilizando o cyan principal da marca.
SUBHEADLINE
“Do atendimento à execução, o BChat Copilot conecta contexto, decisão e automação para conduzir a próxima etapa de cada processo com IA.”
CTA principal:
“Solicitar demonstração”
CTA secundário:
“Ver como funciona”
VISUAL PRINCIPAL
Manter o texto no lado esquerdo.
No lado direito, criar uma composição visual usando o asset fornecido como base e componentes HTML/CSS reais por cima.
Representar cinco etapas:
CONVERSA
Card:
“Cliente”
“Preciso atualizar os dados da empresa.”
CONTEXTO
Card:
“Contexto encontrado”
“Cadastro empresarial”
“3 interações anteriores”
DECISÃO
Card:
“Sugestão contextual”
“Atualizar cadastro e solicitar validação”
Indicador:
“92% confiança”
AUTOMAÇÃO
Card:
“Fluxo acionado”
“Atualização cadastral”
RESULTADO
Card:
“Processo iniciado”
“Próxima etapa: validação”
Conectar visualmente os componentes da esquerda para a direita com linhas SVG/CSS.
No estágio final, mostrar um pequeno Kanban real construído em HTML, com três colunas:
Entrada
Em execução
Concluído
Utilizar poucos cards.
A intenção não é criar uma ferramenta funcional, mas uma representação convincente do fluxo.
ANIMAÇÃO
Criar um loop sutil:
mensagem recebe pequeno highlight;
conexão avança até o contexto;
contexto recebe glow;
decisão aparece;
automação é acionada;
um card se move para “Em execução”.
Loop lento e elegante.
Não utilizar animações agressivas.
Implementar fallback para prefers-reduced-motion.
BACKGROUND
Evoluir o fundo atual sem perder a identidade:
preto/navy
grid vertical/horizontal muito discreto
radial glow cyan atrás do fluxo
círculos concêntricos extremamente sutis
pequenos pontos de dados opcionais
Não utilizar partículas excessivas.
RESPONSIVIDADE
Desktop:
conteúdo textual aproximadamente 42%
visual aproximadamente 58%
Tablet:
diminuir número de elementos secundários
Mobile:
headline
descrição
CTAs
demonstração visual simplificada em sequência vertical
não depender de hover
QUALIDADE
manter acessibilidade
semantic HTML
textos da interface devem permanecer HTML, não imagem
não usar canvas para textos
evitar dependências novas
otimizar imagem
evitar CLS
utilizar CSS transform/opacity para animações quando possível
respeitar os padrões do projeto
Ao finalizar:
listar arquivos modificados
resumir alterações
confirmar que apenas a Hero foi reformulada.
IACODE 3 — Hero Command Center de agentes
Analise a implementação atual da homepage do BChat Copilot e redesenhe somente sua seção Hero como um “AI Operations Command Center”.
Preserve o stack atual, design system, componentes reutilizáveis, estrutura de projeto e identidade visual.
OBJETIVO
Posicionar o BChat Copilot como uma plataforma que adiciona uma camada inteligente sobre a operação empresarial.
HEADLINE
“Uma nova camada de inteligência para sua operação.”
Destacar “inteligência” ou “sua operação” utilizando o cyan da identidade visual.
SUBHEADLINE
“Centralize contexto, decisão e automação em uma experiência única, com agentes de IA capazes de sugerir, coordenar e executar fluxos empresariais.”
CTA principal:
“Solicitar demonstração”
CTA secundário:
“Explorar como funciona”
LAYOUT
Esquerda:
eyebrow
headline
descrição
CTAs
Direita:
criar uma composição denominada visualmente de “Command Center”.
No centro:
um núcleo de IA abstrato
círculo/orbe utilizando CSS, SVG ou asset fornecido
glow cyan discreto
Distribuídos ao redor:
Conversas
Histórico
Conhecimento
Contexto
Decisão
Kanban
Automação
Resultado
Não criar oito cards grandes.
Usar hierarquia:
3 painéis principais
pequenos chips/cards para capacidades secundárias
PAINEL PRINCIPAL 1
“Contexto”
Mostrar:
“Cliente: Empresa ACME”
“Solicitação: atualização cadastral”
“Histórico encontrado”
PAINEL PRINCIPAL 2
“Decisão”
Mostrar:
“Próxima ação”
“Atualizar cadastro”
Indicador:
“92% confiança”
Botões visuais:
“Executar”
“Revisar”
PAINEL PRINCIPAL 3
“Automação”
Mostrar um mini Kanban:
“Entrada”
“Executando”
“Concluído”
Um card deve aparecer avançando pelo processo.
CONEXÕES
Criar linhas SVG ou CSS ligando:
conversa → núcleo
contexto → núcleo
núcleo → decisão
decisão → automação
As linhas devem comunicar direção de dados.
Utilizar animação de fluxo muito sutil.
PROFUNDIDADE
Usar:
translate
scale
blur controlado
transparência
z-index
glassmorphism
Criar sensação de múltiplas camadas sem prejudicar legibilidade.
FUNDO
Preservar o dark theme atual.
Adicionar:
radial gradients
grid muito discreto
círculos concêntricos ou orbital rings atrás do núcleo
cyan glow extremamente controlado
Não usar efeitos cyberpunk, neon excessivo ou partículas exageradas.
RESPONSIVIDADE
Desktop:
Command Center completo
Tablet:
remover cards secundários
Mobile:
transformar o Command Center em uma sequência vertical:
Contexto
↓
Decisão
↓
Automação
Não tentar reproduzir o layout orbital completo em telas pequenas.
ACESSIBILIDADE E PERFORMANCE
HTML semântico
respeitar prefers-reduced-motion
contraste adequado
keyboard focus
assets otimizados
lazy loading quando apropriado
evitar JavaScript para efeitos que podem ser feitos com CSS
não adicionar dependências pesadas
preservar Core Web Vitals
não modificar outras seções sem necessidade
No final:
listar arquivos alterados
resumir decisões
informar qualquer limitação encontrada no código existente.