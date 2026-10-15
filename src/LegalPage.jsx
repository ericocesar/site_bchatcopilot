import "./legal-pages.css";

const updatedAt = "15 de outubro de 2026";

const operator = (
  <p>
    O BChat é operado por <strong>WEBCK Comércio e Serviços de Tecnologia Ltda.</strong>,
    nome fantasia <strong>Bolt 360 Assessoria e Consultoria</strong>, CNPJ
    21.453.885/0001-54. Endereço para correspondência: Rua Tereza Bezerra
    Salustiano, 1902, Lagoa Nova, Natal/RN, CEP 59075-225. Canal de privacidade:
    {" "}<a href="mailto:bchat@bolt360.com.br">bchat@bolt360.com.br</a>.
  </p>
);

const privacySections = [
  {
    id: "escopo",
    title: "1. A quem e a que esta política se aplica",
    content: (
      <>
        <p>
          Esta política explica como tratamos dados pessoais no site BChat Copilot,
          na criação e administração de contas e durante o uso da plataforma BChat.
          Ela abrange pedidos de demonstração, cadastros de teste, contratação,
          atendimento, canais conectados, automações e recursos de inteligência
          artificial.
        </p>
        {operator}
        <p>
          Os papéis variam conforme a operação. Para dados de cadastro, contratação,
          faturamento, segurança e relacionamento comercial, a operadora do BChat
          define as finalidades e atua como controladora. Para contatos, conversas,
          arquivos e outros dados que uma empresa cliente coloca na plataforma, essa
          empresa normalmente define as finalidades e atua como controladora; o BChat
          trata esses dados para prestar o serviço, conforme as instruções e o contrato
          com o cliente.
        </p>
      </>
    ),
  },
  {
    id: "dados",
    title: "2. Dados que podemos tratar",
    content: (
      <>
        <p>Os dados dependem dos recursos que você ou a empresa cliente utilizam:</p>
        <ul>
          <li>
            <strong>Site e contato comercial:</strong> nome, e-mail, empresa e,
            quando informado, tamanho da equipe de atendimento e conteúdo enviado ao
            solicitar uma demonstração.
          </li>
          <li>
            <strong>Teste e conta:</strong> nome, e-mail, telefone, empresa, senha
            protegida, dados de autenticação, função, permissões, preferências,
            registros de acesso e, conforme a contratação, dados fiscais e de
            faturamento, como CPF ou CNPJ.
          </li>
          <li>
            <strong>Atendimento da empresa cliente:</strong> dados de perfil de
            contatos, como nome, e-mail, telefone, identificadores, localização e
            campos personalizados; conteúdo e metadados de conversas, mensagens,
            notas internas, anexos, chamadas, formulários, etiquetas e registros de
            campanhas. A empresa cliente escolhe os dados que registra e os canais
            que conecta.
          </li>
          <li>
            <strong>Copilot e conhecimento:</strong> perguntas digitadas no Copilot,
            trechos do histórico de conversa, dados de contato, respostas geradas e
            conteúdo das fontes de conhecimento e documentos conectados, conforme a
            função utilizada e as permissões da conta.
          </li>
          <li>
            <strong>Uso e segurança:</strong> endereço IP, tipo de navegador,
            horários e eventos de acesso, dados de sessão e informações necessárias
            para diagnosticar erros, proteger contas e manter a plataforma.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "finalidades",
    title: "3. Para que usamos os dados",
    content: (
      <>
        <p>Tratamos dados para:</p>
        <ul>
          <li>responder a pedidos de demonstração e preparar uma contratação;</li>
          <li>criar contas, autenticar usuários e administrar permissões;</li>
          <li>prestar e dar suporte às funções de atendimento, Copilot e automação;</li>
          <li>processar assinaturas, pagamentos, créditos, notas e obrigações fiscais;</li>
          <li>proteger o serviço, prevenir fraude e investigar falhas ou abusos;</li>
          <li>cumprir obrigações legais e exercer ou defender direitos; e</li>
          <li>enviar informações comerciais quando houver autorização ou outra base legal aplicável.</li>
        </ul>
        <p>
          As bases legais podem incluir procedimentos preliminares ou execução de
          contrato, cumprimento de obrigação legal, exercício regular de direitos,
          legítimo interesse avaliado no contexto e consentimento quando necessário.
          Para dados de clientes finais inseridos por uma empresa cliente, cabe a essa
          empresa definir e documentar a base legal apropriada.
        </p>
      </>
    ),
  },
  {
    id: "copilot",
    title: "4. Copilot e recursos de inteligência artificial",
    content: (
      <>
        <p>
          Quando alguém usa o Copilot para resumir, pesquisar ou sugerir uma resposta,
          o BChat pode enviar ao serviço de modelo de inteligência artificial
          configurado para aquela função as instruções, partes relevantes da conversa
          e informações das fontes conectadas. As ferramentas de consulta do Copilot
          podem incluir dados de contato e mensagens da conversa, inclusive notas
          internas, quando a ferramenta usada as recupera e o usuário tem acesso à
          conversa. O conteúdo processado depende do pedido e da configuração da
          conta.
        </p>
        <p>
          Os modelos podem produzir respostas incorretas, incompletas ou inadequadas.
          A equipe deve conferir a sugestão e as fontes antes de usá-la. Automações e
          respostas automáticas só atuam quando a empresa cliente as configura e
          habilita. Não insira informações pessoais sensíveis no Copilot sem avaliar
          a necessidade, a base legal e as permissões aplicáveis.
        </p>
        <p>
          O processamento pode envolver fornecedores externos de modelos de IA. O
          fornecedor e as condições de retenção aplicáveis podem variar conforme a
          configuração do serviço contratado. A empresa cliente deve consultar as
          informações do seu ambiente e contrato e orientar sua equipe sobre quais
          dados pode enviar.
        </p>
      </>
    ),
  },
  {
    id: "compartilhamento",
    title: "5. Quando compartilhamos dados",
    content: (
      <>
        <p>
          O acesso é limitado ao necessário para a finalidade. Podemos compartilhar
          dados com prestadores de hospedagem, armazenamento, segurança e suporte;
          provedores de IA quando o Copilot é usado; processadores de pagamento e
          faturamento; e provedores dos canais e integrações que a empresa cliente
          conecta, como serviços de mensagens, e-mail e redes sociais.
        </p>
        <p>
          Esses prestadores recebem os dados necessários para executar o serviço
          correspondente e podem tratá-los segundo seus próprios contratos e políticas.
          Também podemos fornecer dados quando uma obrigação legal ou ordem válida
          exigir, ou quando isso for necessário para proteger direitos e segurança.
        </p>
        <p>
          Alguns prestadores podem operar fora do Brasil. Quando houver transferência
          internacional, ela será realizada de acordo com a LGPD e os mecanismos de
          proteção aplicáveis ao caso.
        </p>
      </>
    ),
  },
  {
    id: "armazenamento-navegador",
    title: "6. Cookies e armazenamento no navegador",
    content: (
      <>
        <p>
          O site usa armazenamento local do navegador para lembrar, durante a sessão,
          se a animação de entrada já foi exibida e para guardar temporariamente os
          dados públicos de planos. Isso ajuda a apresentação do site e o carregamento
          dos preços. Você pode apagar esses dados nas configurações do navegador.
        </p>
        <p>
          O cadastro de teste pode carregar o Cloudflare Turnstile para reduzir
          cadastros automatizados, quando essa proteção estiver habilitada. O site
          carrega fontes do Google Fonts; ao reproduzir o vídeo incorporado, o
          navegador se conecta ao YouTube. Esses serviços podem receber dados técnicos
          de conexão necessários à entrega do recurso.
        </p>
      </>
    ),
  },
  {
    id: "retencao",
    title: "7. Retenção e exclusão",
    content: (
      <p>
        Mantemos dados pelo período necessário para prestar o serviço, administrar a
        conta, cumprir obrigações legais e fiscais, resolver disputas e proteger o
        BChat e seus usuários. Após o encerramento, dados de conversas e arquivos são
        tratados conforme o plano, as configurações de retenção e o contrato aplicável;
        cópias de segurança e registros sujeitos a guarda legal podem permanecer pelo
        prazo necessário à finalidade correspondente. O administrador da conta pode
        solicitar informações sobre exportação ou exclusão pelo canal de privacidade.
      </p>
    ),
  },
  {
    id: "seguranca",
    title: "8. Segurança",
    content: (
      <p>
        Adotamos medidas técnicas e administrativas destinadas a proteger os dados
        contra acesso não autorizado, perda, alteração ou divulgação indevida. O
        acesso à plataforma utiliza contas, autenticação e permissões; as empresas
        clientes também devem administrar usuários, credenciais, integrações e
        privilégios com cuidado. Nenhum serviço conectado à internet pode garantir
        risco zero. Se um incidente exigir comunicação legal, adotaremos as medidas
        cabíveis.
      </p>
    ),
  },
  {
    id: "direitos",
    title: "9. Seus direitos e como exercê-los",
    content: (
      <>
        <p>
          Você pode solicitar confirmação do tratamento, acesso, correção, informação
          sobre compartilhamentos, anonimização, bloqueio ou eliminação quando
          aplicável, portabilidade nos termos da regulamentação e revisão de decisões
          tomadas unicamente com base em tratamento automatizado. Quando o tratamento
          depender de consentimento, você pode revogá-lo; a revogação não afeta o que
          foi feito legalmente antes dela.
        </p>
        <p>
          Para dados de cadastro, demonstração ou contratação, escreva para{" "}
          <a href="mailto:bchat@bolt360.com.br">bchat@bolt360.com.br</a>. Para dados
          de uma conversa ou contato registrados por uma empresa cliente, procure
          primeiro essa empresa, que decide a finalidade do tratamento; o BChat
          auxiliará o cliente quando cabível. Podemos pedir informações razoáveis
          para confirmar sua identidade e localizar os dados. Também é possível
          apresentar petição à Autoridade Nacional de Proteção de Dados, conforme a
          lei.
        </p>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "10. Alterações desta política",
    content: (
      <p>
        Podemos atualizar esta política para refletir mudanças no serviço ou na lei.
        Publicaremos a versão vigente nesta página e atualizaremos a data acima. Se
        uma mudança exigir aviso específico, faremos a comunicação pelos canais
        disponíveis da conta.
      </p>
    ),
  },
  {
    id: "base-legal",
    title: "11. Legislação relacionada",
    content: (
      <p>
        O tratamento observa a legislação aplicável, incluindo a{" "}
        <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm" target="_blank" rel="noreferrer">Lei Geral de Proteção de Dados Pessoais (LGPD)</a>{" "}
        e o <a href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm" target="_blank" rel="noreferrer">Marco Civil da Internet</a>.
      </p>
    ),
  },
];

const termsSections = [
  {
    id: "contrato",
    title: "1. Sobre estes termos",
    content: (
      <>
        <p>
          Estes Termos regulam o acesso ao site e o uso da plataforma BChat, incluindo
          o BChat Copilot. Ao criar uma conta, contratar um plano ou usar a plataforma,
          você declara que leu estes Termos e que tem autorização para agir em nome da
          pessoa ou empresa vinculada à conta.
        </p>
        {operator}
        <p>
          A proposta, o pedido, a tela de contratação e eventuais condições comerciais
          específicas complementam estes Termos. Em caso de diferença, prevalecem as
          condições específicas aceitas para a contratação, respeitados os direitos
          previstos em lei.
        </p>
      </>
    ),
  },
  {
    id: "servico",
    title: "2. O serviço",
    content: (
      <p>
        O BChat oferece ferramentas de atendimento e gestão de conversas, contatos,
        canais conectados, equipes, relatórios, campanhas, base de conhecimento,
        automações e recursos de inteligência artificial. O BChat Copilot pode resumir
        conversas, pesquisar informações e sugerir respostas com base no contexto e
        nas fontes que a empresa cliente conectar. Os recursos, limites e integrações
        variam conforme o plano, as configurações e a oferta vigente.
      </p>
    ),
  },
  {
    id: "conta",
    title: "3. Conta e acesso",
    content: (
      <>
        <p>
          Forneça informações corretas e mantenha os dados da conta atualizados. A
          pessoa administradora define os usuários, funções, permissões, canais e
          demais configurações da organização. Cada usuário deve proteger suas
          credenciais, não compartilhar acesso indevidamente e avisar a administração
          da conta sobre uso não autorizado.
        </p>
        <p>
          A organização cliente é responsável pelas ações realizadas por seus usuários
          e por conceder apenas as permissões necessárias. Podemos limitar ou suspender
          acesso em caso de risco à segurança, uso ilegal, violação destes Termos,
          inadimplência ou obrigação legal, observados os direitos e avisos exigidos
          pela legislação.
        </p>
      </>
    ),
  },
  {
    id: "planos",
    title: "4. Planos, teste, cobrança e cancelamento",
    content: (
      <>
        <p>
          Preço, ciclo de cobrança, duração de eventual teste gratuito, limites,
          créditos de Copilot, documentos incluídos, tributos e forma de pagamento são
          os informados na tela de contratação ou na proposta aceita. A cobrança e a
          renovação seguem essas condições. O serviço pode usar um processador de
          pagamento indicado no checkout; esse prestador trata os dados necessários
          para concluir e registrar a cobrança.
        </p>
        <p>
          Atrasos podem levar à cobrança de valores vencidos, restrição de recursos ou
          suspensão, conforme a oferta e o contrato. O cancelamento deve ser solicitado
          pelo meio disponível na conta ou no contrato e produz efeitos sobre a próxima
          renovação e o acesso conforme as condições apresentadas na contratação. O
          cancelamento não elimina valores já vencidos. Direitos de arrependimento,
          reembolso e outras proteções legais são preservados quando aplicáveis.
        </p>
        <p>
          Mudanças de preço ou de plano serão comunicadas antes de produzirem efeitos
          quando a lei ou o contrato assim exigir. A oferta exibida no momento da
          contratação informa os limites e recursos incluídos.
        </p>
      </>
    ),
  },
  {
    id: "responsabilidades",
    title: "5. Responsabilidades da empresa cliente",
    content: (
      <>
        <p>A empresa cliente é responsável por:</p>
        <ul>
          <li>
            ter autorização e base legal para inserir dados de contatos, clientes,
            funcionários e outras pessoas na plataforma;
          </li>
          <li>
            fornecer os avisos de privacidade necessários e atender solicitações dos
            titulares que estejam sob sua responsabilidade;
          </li>
          <li>
            revisar documentos, fontes de conhecimento, mensagens, campanhas,
            automações e permissões antes de disponibilizá-los ou ativá-los;
          </li>
          <li>
            usar os canais conectados de acordo com as regras dos respectivos
            provedores, incluindo consentimento e requisitos de mensagens comerciais;
            e
          </li>
          <li>
            não usar o serviço para violar a lei, enviar comunicações ilícitas, praticar
            fraude, distribuir malware ou tentar obter acesso indevido a dados e
            sistemas.
          </li>
        </ul>
        <p>
          Não carregue dados pessoais sensíveis ou conteúdo confidencial sem avaliar
          antes a necessidade, a base legal, as permissões e as configurações de
          retenção da sua operação.
        </p>
      </>
    ),
  },
  {
    id: "ia",
    title: "6. Copilot, IA e automações",
    content: (
      <>
        <p>
          Sugestões, resumos, classificações e outros resultados gerados por IA podem
          conter erros ou omissões e não substituem a revisão humana. A empresa cliente
          deve conferir o contexto, as fontes e o conteúdo antes de enviar uma
          resposta ou tomar uma decisão com base no resultado.
        </p>
        <p>
          O Copilot pode processar partes de conversas, dados de contato, mensagens
          internas e materiais de conhecimento para produzir a resposta solicitada,
          conforme a ferramenta utilizada, as permissões do usuário e a configuração
          da conta. Automações podem executar ações quando a empresa cliente as
          configura e habilita; essa organização decide quando exigir revisão humana.
          O uso desses recursos também está sujeito à{" "}
          <a href="/privacidade">Política de Privacidade</a>.
        </p>
      </>
    ),
  },
  {
    id: "integracoes",
    title: "7. Canais e serviços de terceiros",
    content: (
      <p>
        Integrações dependem de serviços externos, contas, credenciais, APIs e
        disponibilidade de terceiros. A empresa cliente autoriza a conexão das suas
        contas e deve manter suas permissões e credenciais válidas. O uso de cada
        serviço externo também segue os termos e avisos do respectivo fornecedor. Uma
        indisponibilidade ou alteração nesses serviços pode afetar a integração
        correspondente.
      </p>
    ),
  },
  {
    id: "conteudo",
    title: "8. Conteúdo e propriedade intelectual",
    content: (
      <>
        <p>
          A empresa cliente mantém seus direitos sobre os dados, mensagens,
          documentos e materiais que enviar. Ela autoriza o BChat a armazenar, organizar
          e processar esse conteúdo na medida necessária para operar, proteger e
          prestar os recursos contratados, conforme a Política de Privacidade e o
          contrato.
        </p>
        <p>
          A plataforma, suas marcas, software, interfaces e materiais são protegidos
          por direitos de propriedade intelectual. Estes Termos concedem uma licença
          limitada, não exclusiva e revogável para usar o serviço durante a vigência da
          conta e conforme o plano contratado. Não é permitido copiar, revender,
          descompilar ou explorar o serviço fora dos usos autorizados por lei ou por
          escrito pelo BChat.
        </p>
      </>
    ),
  },
  {
    id: "disponibilidade",
    title: "9. Disponibilidade e alterações do serviço",
    content: (
      <p>
        Trabalhamos para manter o serviço disponível e seguro. Podem ocorrer
        interrupções para manutenção, falhas de rede, incidentes ou mudanças em
        serviços integrados. Podemos atualizar recursos para corrigir problemas,
        melhorar segurança ou acompanhar mudanças legais e técnicas. Níveis de serviço
        específicos só se aplicam quando constarem da proposta ou contrato da conta.
      </p>
    ),
  },
  {
    id: "encerramento",
    title: "10. Suspensão, encerramento e dados da conta",
    content: (
      <p>
        A conta pode ser encerrada pelo administrador conforme as opções do plano ou
        do contrato. O BChat pode suspender ou encerrar o acesso em caso de violação
        relevante destes Termos, risco de segurança, uso ilegal, falta de pagamento ou
        determinação legal, com comunicação quando cabível. Depois do encerramento, o
        acesso, a exportação e a retenção de dados seguem o plano, a configuração da
        conta, o contrato e as obrigações legais. Consulte a Política de Privacidade
        para saber mais sobre retenção e solicitações de dados.
      </p>
    ),
  },
  {
    id: "responsabilidade",
    title: "11. Responsabilidade",
    content: (
      <p>
        Cada parte responde por suas obrigações legais e contratuais. A empresa
        cliente responde pelo conteúdo que fornece, pelas instruções dadas ao Copilot,
        pelas configurações de automação e pelo uso dos canais conectados por sua
        equipe. Nada nestes Termos exclui ou limita responsabilidade que não possa ser
        afastada por lei, nem reduz direitos assegurados ao consumidor quando
        aplicáveis.
      </p>
    ),
  },
  {
    id: "alteracoes",
    title: "12. Mudanças destes Termos",
    content: (
      <p>
        Podemos atualizar estes Termos para refletir mudanças no produto, na oferta
        ou na legislação. A versão vigente ficará nesta página com a data de
        atualização. Mudanças relevantes serão comunicadas pelos meios disponíveis da
        conta quando exigido. O uso continuado depois da vigência da nova versão
        constitui aceitação, sem prejuízo dos direitos previstos em lei.
      </p>
    ),
  },
  {
    id: "lei-contato",
    title: "13. Lei aplicável e contato",
    content: (
      <>
        <p>
          Aplicam-se as leis brasileiras. As partes buscarão resolver dúvidas pelo
          canal de atendimento da conta ou pelo e-mail{" "}
          <a href="mailto:bchat@bolt360.com.br">bchat@bolt360.com.br</a>. Fica
          preservada a competência do foro que a legislação determinar, inclusive o
          foro do domicílio do consumidor quando aplicável.
        </p>
        <p>
          Estes Termos observam, entre outras normas, o{" "}
          <a href="https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" target="_blank" rel="noreferrer">Código de Defesa do Consumidor</a>,
          o <a href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm" target="_blank" rel="noreferrer">Decreto nº 7.962/2013</a> quando aplicável às contratações eletrônicas e a{" "}
          <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm" target="_blank" rel="noreferrer">LGPD</a>.
        </p>
      </>
    ),
  },
];

function LegalPage({ type }) {
  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "Política de Privacidade" : "Termos de Serviço";
  const intro = isPrivacy
    ? "Entenda quais dados passam pelo BChat, para que são usados e como pedir acesso ou correção."
    : "As condições para criar uma conta, contratar planos e usar o BChat Copilot com sua equipe.";
  const description = isPrivacy
    ? "Política de Privacidade do BChat: dados tratados no site, na plataforma e pelo Copilot, finalidades e direitos dos titulares."
    : "Termos de Serviço do BChat Copilot: regras para contas, planos, pagamentos, integrações e recursos de inteligência artificial.";
  const sections = isPrivacy ? privacySections : termsSections;

  useEffect(() => {
    const descriptionTag = document.querySelector('meta[name="description"]');
    const openGraphTitleTag = document.querySelector('meta[property="og:title"]');
    const openGraphDescriptionTag = document.querySelector('meta[property="og:description"]');
    const previousDescription = descriptionTag?.content;
    const previousOpenGraphTitle = openGraphTitleTag?.content;
    const previousOpenGraphDescription = openGraphDescriptionTag?.content;

    document.title = `${title} | BChat Copilot`;
    if (descriptionTag) descriptionTag.content = description;
    if (openGraphTitleTag) openGraphTitleTag.content = `${title} | BChat Copilot`;
    if (openGraphDescriptionTag) openGraphDescriptionTag.content = description;

    return () => {
      document.title = "BChat Copilot: mais contexto para atender, mais confiança para responder";
      if (descriptionTag && previousDescription) descriptionTag.content = previousDescription;
      if (openGraphTitleTag && previousOpenGraphTitle) openGraphTitleTag.content = previousOpenGraphTitle;
      if (openGraphDescriptionTag && previousOpenGraphDescription) openGraphDescriptionTag.content = previousOpenGraphDescription;
    };
  }, [description, title]);

  return (
    <main className="legal-page">
      <header className="legal-page__topbar">
        <a href="/" className="legal-page__brand" aria-label="BChat Copilot, página inicial">
          <span className="legal-page__brand-mark" aria-hidden="true">B</span>
          <span>bchat<span>copilot</span></span>
        </a>
        <nav aria-label="Documentos legais" className="legal-page__top-links">
          <a href="/privacidade" aria-current={isPrivacy ? "page" : undefined}>Privacidade</a>
          <a href="/termos" aria-current={!isPrivacy ? "page" : undefined}>Termos de serviço</a>
        </nav>
      </header>

      <div className="legal-page__container">
        <section className="legal-page__intro" aria-labelledby="legal-title">
          <p className="legal-page__eyebrow">BCHAT COPILOT · DOCUMENTOS</p>
          <h1 id="legal-title">{title}</h1>
          <p className="legal-page__lead">{intro}</p>
          <p className="legal-page__updated">Última atualização: {updatedAt}</p>
        </section>

        <div className="legal-page__layout">
          <nav className="legal-page__contents" aria-label="Nesta página">
            <p>Nesta página</p>
            <ol>
              {sections.map((section) => (
                <li key={section.id}><a href={`#${section.id}`}>{section.title.replace(/^\d+\.\s*/, "")}</a></li>
              ))}
            </ol>
          </nav>

          <article className="legal-page__article">
            {sections.map((section) => (
              <section id={section.id} key={section.id} className="legal-page__section">
                <h2>{section.title}</h2>
                {section.content}
              </section>
            ))}
          </article>
        </div>

        <footer className="legal-page__footer">
          <a href="/" className="legal-page__home-link">← Voltar ao BChat Copilot</a>
          <p>© 2026 BChat. Todos os direitos reservados.</p>
        </footer>
      </div>
    </main>
  );
}

export default LegalPage;
