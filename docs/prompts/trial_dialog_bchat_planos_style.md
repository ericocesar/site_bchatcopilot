# Prompt para a IACode — dialog de contratação BChat Trial

## Objetivo

Atualize a dialog de contratação do trial em `site-bchat` para que ela tenha a mesma linguagem
visual da dialog de criação de conta exibida em `/planos` no projeto `bchat-develop`.

O resultado deve parecer parte do mesmo produto: uma dialog editorial, escura e precisa, com um
painel de marca em teal à esquerda e um formulário claro à direita. Preserve o fluxo de cadastro
existente e faça a alteração somente na apresentação, no layout e nos detalhes de interação
necessários para manter a experiência equivalente à referência.

## Referências obrigatórias

Projeto-alvo:

- `/Users/ericocesar/Mac.local/boltdev/1main/bchat/site-bchat/index.html`
- `/Users/ericocesar/Mac.local/boltdev/1main/bchat/site-bchat/src/landing.css`
- `/Users/ericocesar/Mac.local/boltdev/1main/bchat/site-bchat/src/landing.js`
- `/Users/ericocesar/Mac.local/boltdev/1main/bchat/site-bchat/tokens.css`

Referência visual e comportamental:

- `/Users/ericocesar/Mac.local/boltdev/1main/bchat/bchat-develop/app/javascript/entrypoints/plans_lp.js`,
  especialmente `ensureTrialModal()`, `openTrialModal()`, `updateTrialStep()` e o feedback de
  senha.
- `/Users/ericocesar/Mac.local/boltdev/1main/bchat/bchat-develop/app/views/public/plans_page/index.html.erb`,
  para a linguagem visual da LP.

Leia os arquivos antes de editar. Não copie classes Tailwind para o projeto-alvo: traduza a
referência para CSS vanilla usando os tokens existentes em `tokens.css`.

## Escopo funcional que deve permanecer intacto

Não altere:

- o endpoint de trial, o payload ou o tratamento das respostas;
- os nomes dos campos: `name`, `email`, `company_name`, `phone`, `password` e
  `password_confirmation`;
- os campos ocultos `plan_slug` e `billing_cycle`;
- os seletores `data-trial-dialog`, `data-trial-dialog-dismiss`, `data-trial-form`,
  `data-step-panel`, `data-trial-step`, `data-trial-next`, `data-trial-back`, `data-trial-submit`,
  `data-trial-status`, `data-password-rules`, `data-password-rule` e `data-error-for`;
- a seleção do plano e do ciclo de cobrança feita pelo CTA;
- a validação dos campos, o envio do formulário, o redirecionamento após sucesso e as mensagens
  de erro.

Se for necessário mover elementos no HTML para obter o novo layout, mantenha esses atributos e os
IDs usados pelo JavaScript. Não crie uma segunda implementação da dialog.

## Direção visual obrigatória

### Estrutura da dialog

- Use um overlay que cubra a viewport inteira, com fundo slate escuro translúcido e blur suave.
- Centralize um frame com largura ampla, limite de altura da viewport, rolagem segura e sombra
  profunda.
- Em telas grandes, use duas colunas: aproximadamente `2/5` para o painel de marca e `3/5` para o
  formulário.
- Em telas pequenas, empilhe os painéis; o formulário deve continuar acessível sem overflow
  horizontal.
- Use borda discreta, raio grande e recorte do conteúdo no frame. A sensação deve ser de um
  painel premium, não de um alert genérico.

### Painel esquerdo de marca

O painel esquerdo deve seguir a composição da dialog de `/planos`:

- fundo accent teal usando `var(--lime-1)` ou o token local equivalente, nunca um novo valor
  hardcoded;
- texto escuro com `var(--ink-on-light)`;
- selo superior em formato pill com `BChat / Trial`;
- marca/logo centralizada com tamanho generoso e `object-fit: contain`;
- detalhes geométricos/decorativos discretos em pseudo-elementos ou elementos semânticos com
  `aria-hidden="true"`;
- rodapé do painel com eyebrow pequeno em uppercase, como `Seu próximo passo`;
- tagline em uppercase, fonte de display, peso forte, tracking negativo e line-height compacto:
  `Atendimento mais simples, desde o primeiro dia.`

O painel deve ter presença visual, mas não competir com os campos. Reduza a altura mínima no mobile
para que o formulário apareça rapidamente.

### Painel direito do formulário

- Use superfície clara, preferencialmente `var(--ink-1)` ou o token claro equivalente, com texto
  escuro.
- No topo, mantenha título e descrição com hierarquia forte e botão de fechar discreto no canto
  superior direito.
- O título da dialog e os títulos dos passos devem usar a mesma linguagem tipográfica de
  `Atendimento mais simples, desde o primeiro dia.`: fonte display, uppercase, peso extrabold,
  line-height compacto e tracking negativo.
- A descrição do passo 3 deve ficar na mesma linha do título `Crie seu acesso`, alinhada à direita
  em telas maiores. No mobile, ela pode quebrar para baixo sem perder legibilidade.
- Os rótulos dos passos devem ser `Seus dados`, `Sua empresa` e `Seu acesso`, mantendo a indicação
  numérica 1, 2 e 3.

### Navegação de etapas

- Apresente as três etapas em uma linha com três colunas em telas maiores.
- Cada etapa deve ter uma linha de base/borda inferior e um número dentro de círculo.
- Etapa ativa e etapas concluídas usam o accent teal; etapas futuras usam cinzas neutros.
- Preserve `aria-current="step"` na etapa ativa.
- Ao trocar de etapa, mantenha o foco no primeiro campo da etapa visível.

### Campos e ações

- Use campos claros, com borda cinza, raio moderado, altura consistente e foco destacado pelo
  accent teal.
- Em telas maiores, os campos de cada etapa devem ocupar duas colunas quando houver espaço.
- No passo 3, `Senha` e `Confirme sua senha` devem ficar lado a lado; em telas pequenas, devem
  empilhar.
- A área de ações deve ter uma linha superior e espaçamento confortável.
- `Cancelar` e `Voltar` devem ser botões com borda cinza e fundo discreto/transparente.
- `Continuar` deve usar fundo slate escuro e texto claro.
- `Criar meu acesso` deve usar o accent teal e texto escuro.
- Preserve estados hover, focus-visible, disabled e loading sem deslocar o layout.

### Feedback de senha

Preserve e estilize o feedback já existente no passo 3:

- cartão de feedback com borda e fundo de estado;
- status, contador e barra segmentada de força;
- lista de requisitos em duas colunas quando houver espaço;
- requisitos atendidos em teal e pendentes em cinza;
- depois de cinco segundos no passo 3, cada requisito pendente deve receber a atenção visual já
  prevista: cor vermelha e aumento de `20%`, com origem da transformação à esquerda;
- ao preencher/corrigir a senha ou sair do passo, remova o alerta pendente e limpe os timers;
- não use animação agressiva ou que cause mudança de layout.

## Interações e acessibilidade

Mantenha ou confirme estas interações durante a alteração visual:

- abrir a dialog pelo CTA de trial e preencher plano/ciclo corretamente;
- fechar pelo botão, backdrop e tecla `Escape`;
- manter o scroll do `body` bloqueado enquanto a dialog está aberta e restaurá-lo ao fechar;
- `Enter` avança a etapa atual quando o formulário é válido; no terceiro passo, envia o cadastro;
- mover o foco para dentro da dialog ao abrir e para o primeiro campo da etapa ao avançar;
- manter `role="dialog"`, `aria-modal="true"`, `aria-labelledby` e `aria-describedby`;
- não remover `role="alert"`, `aria-live`, `aria-invalid` ou descrições associadas aos campos;
- oferecer contraste suficiente entre painel claro, textos, bordas e estados de erro;
- respeitar `prefers-reduced-motion` para transições e animações decorativas.

## Regras de implementação

- Faça a menor alteração necessária em `index.html`, `src/landing.css` e, somente se necessário,
  `src/landing.js`.
- Use os tokens de `tokens.css` para cores, tipografia, espaçamentos, raios, sombras e motion.
- Não adicione dependências, imagens externas, fontes novas ou outro framework de estilos.
- Não use CSS inline, novos valores de cor hardcoded ou estilos duplicados fora do bloco da dialog.
- Não altere a estrutura de rotas, o contrato da API, os textos legais ou os CTAs fora do fluxo de
  trial.
- Mantenha o texto da interface em português do Brasil.
- Evite reescrever o restante da landing page.

## Critérios de aceite visual

Considere a tarefa concluída somente quando:

- a dialog tiver o frame escuro/translúcido com blur no overlay;
- o painel teal com logo, selo e tagline existir à esquerda em desktop;
- o formulário claro ocupar a maior coluna à direita;
- título e etapas usarem a mesma fonte uppercase/display da tagline;
- os campos de senha ficarem lado a lado no desktop;
- cancelar e voltar tiverem borda cinza;
- o CTA final teal, o CTA continuar slate e a hierarquia de ações estiver clara;
- a composição se adaptar sem cortes em larguras de `320px`, `768px` e desktop;
- a dialog continuar abrindo a partir do trial e concluindo o cadastro sem regressão.

## Validação obrigatória

Execute no diretório do projeto-alvo:

```bash
npm run check
npm run test
npm run build
```

Faça também uma verificação manual no navegador:

1. Inicie o servidor com `npm run dev`.
2. Abra a landing page e acione um plano que tenha trial.
3. Verifique desktop e mobile, avanço/retorno das três etapas, `Enter`, `Escape`, backdrop,
   fechamento, foco, erro de validação, aviso de requisito de senha após cinco segundos e envio do
   formulário.
4. Confirme que o console não apresenta erros e que os campos mantêm os nomes esperados.

Ao finalizar, relate os arquivos modificados, os comandos executados e qualquer limitação visual
que dependa de dados reais da API.
