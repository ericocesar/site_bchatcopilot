# Camadas do infográfico

O infográfico usado pela landing page é composto por arquivos independentes:

- `infographic-base.svg`: fundo, linhas técnicas, pontos decorativos e conexões.
- `quadrants/quadrant-01.svg` até `quadrant-04.svg`: fundo visual de cada quadrante.
- `infographic-hub.svg`: círculo, glow e marcadores do centro.
- `icons/icon-01-users.svg` até `icon-04-handoff.svg`: ícones opcionais, mantidos separados para futuras substituições; não são carregados na composição atual.

Os textos detalhados ficam abaixo do visual em `index.html`. A arte exibida no infográfico não contém textos nem ícones. Para substituir um quadrante, troque apenas o SVG correspondente mantendo o `viewBox` `0 0 1600 900`. Os ícones ficam disponíveis na pasta `icons/` caso sejam reativados no futuro.
