# ST. JONES Site 2.0 — Base inicial

Esta versão reorganiza o site atual sem alterar o visual nem os dados salvos no Supabase.

## Estrutura

- `index.html`: estrutura da página
- `assets/css/style.css`: estilos
- `assets/js/image-editor.js`: editor de imagens
- `assets/js/site-admin.js`: funções do Admin e integração com Supabase
- `assets/js/site-runtime.js`: comportamento público do site
- `assets/images`: somente imagens fixas utilizadas pelo HTML
- `vercel.json`: cache e configuração de publicação

## Publicação segura

1. Crie uma branch chamada `site-2.0`.
2. Envie o conteúdo desta pasta para essa branch.
3. Use o endereço de Preview do Vercel para testar.
4. Não substitua a `main` antes de testar no computador e no celular.

## O que foi preservado

- Supabase e imagens cadastradas no Admin
- Qualidade original das imagens
- Mapas
- Horários com minutos e madrugada
- Favicon
- Botões do topo
- Layout atual

## Próxima etapa

Adicionar as chaves de exibição das seções no Admin e revisar cada módulo separadamente.
