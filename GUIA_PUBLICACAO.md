# 🚀 Guia de Publicação & Virada de Domínio — Santa Máquina

Este documento detalha o passo a passo para colocar o novo site no ar, conectar o gateway de pagamentos e virar o domínio oficial no Registro.br.

Consulte o passo a passo completo no artefato [guia_publicacao_dominio.md](file:///C:/Users/romar/.gemini/antigravity/brain/f89ba0bc-18f4-4727-9683-5664b2190e5c/guia_publicacao_dominio.md) ou siga as instruções abaixo:

1. **Deploy:** Envie a pasta do projeto para a [Vercel](https://vercel.com) (ou Netlify). Os arquivos `vercel.json` e `api/checkout.js` já estão prontos.
2. **Gateway:** Adicione as variáveis de ambiente `MERCADOPAGO_ACCESS_TOKEN` ou `ASAAS_API_KEY` no painel da Vercel.
3. **Domínio:** No Registro.br, aponte a entrada `A` para `76.76.21.21` e a `CNAME (www)` para `cname.vercel-dns.com`.
4. **Links Antigos:** Redirecionamento 301 automático já configurado em `vercel.json` e `_redirects` para manter todo o tráfego do Instagram e Google.
5. **Shopify:** Após testar um pedido PIX real, cancele a assinatura da Shopify.

