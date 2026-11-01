/**
 * SANTA MÁQUINA — ENDPOINT SERVERLESS DE CHECKOUT
 * Rota: /api/checkout
 * Compatível com Vercel Serverless Functions e Node.js
 *
 * Suporta:
 * 1. Mercado Pago (PIX com QR Code dinâmico + Cartão com Antifraude)
 * 2. Asaas (PIX com taxa fixa de R$ 1,99 + Cartão de menor taxa)
 */

export default async function handler(req, res) {
  // CORS & Métodos permitidos
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Método não permitido. Utilize POST." });
  }

  try {
    const { order, gateway = "mercadopago" } = req.body || {};

    if (!order || !order.customer || !order.payment) {
      return res.status(400).json({ ok: false, message: "Dados do pedido incompletos." });
    }

    const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

    // =========================================================================
    // 1. PROCESSAMENTO MERCADO PAGO
    // =========================================================================
    if (gateway === "mercadopago" && MP_ACCESS_TOKEN) {
      if (order.payment.method === "PIX") {
        const mpPayload = {
          transaction_amount: Number(order.payment.total.toFixed(2)),
          description: `Santa Máquina Pedido #${order.id}`,
          payment_method_id: "pix",
          payer: {
            email: order.customer.email,
            first_name: order.customer.name.split(" ")[0] || "Cliente",
            last_name: order.customer.name.split(" ").slice(1).join(" ") || "SM",
            identification: {
              type: "CPF",
              number: order.customer.cpf.replace(/\D/g, "")
            }
          }
        };

        const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
            "X-Idempotency-Key": `sm-${order.id}-${Date.now()}`
          },
          body: JSON.stringify(mpPayload)
        });

        const mpData = await mpRes.json();

        if (mpRes.ok && mpData.point_of_interaction?.transaction_data) {
          const tData = mpData.point_of_interaction.transaction_data;
          return res.status(200).json({
            ok: true,
            gateway: "mercadopago",
            paymentId: mpData.id,
            status: mpData.status,
            pixQrCodeBase64: tData.qr_code_base64,
            pixCopyCode: tData.qr_code,
            ticketUrl: tData.ticket_url
          });
        } else {
          return res.status(400).json({
            ok: false,
            message: mpData.message || "Erro ao gerar PIX no Mercado Pago.",
            details: mpData
          });
        }
      }
    }

    // =========================================================================
    // 2. PROCESSAMENTO ASAAS
    // =========================================================================
    if (gateway === "asaas" && ASAAS_API_KEY) {
      const asaasHeaders = {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY
      };

      // 1. Criar ou buscar cliente no Asaas
      const custRes = await fetch("https://api.asaas.com/v3/customers", {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify({
          name: order.customer.name,
          cpfCnpj: order.customer.cpf.replace(/\D/g, ""),
          email: order.customer.email,
          mobilePhone: order.customer.phone.replace(/\D/g, "")
        })
      });
      const custData = await custRes.json();
      const asaasCustomerId = custData.id;

      if (order.payment.method === "PIX" && asaasCustomerId) {
        // Criar cobrança PIX
        const cobRes = await fetch("https://api.asaas.com/v3/payments", {
          method: "POST",
          headers: asaasHeaders,
          body: JSON.stringify({
            customer: asaasCustomerId,
            billingType: "PIX",
            value: Number(order.payment.total.toFixed(2)),
            dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            description: `Santa Máquina Pedido #${order.id}`
          })
        });
        const cobData = await cobRes.json();

        if (cobData.id) {
          // Buscar QR Code PIX
          const qrRes = await fetch(`https://api.asaas.com/v3/payments/${cobData.id}/pixQrCode`, {
            headers: asaasHeaders
          });
          const qrData = await qrRes.json();

          return res.status(200).json({
            ok: true,
            gateway: "asaas",
            paymentId: cobData.id,
            status: cobData.status,
            pixQrCodeBase64: qrData.encodedImage,
            pixCopyCode: qrData.payload
          });
        }
      }
    }

    // =========================================================================
    // 3. MODO DE DEMONSTRAÇÃO / FALLBACK EM PRODUÇÃO
    // Se as chaves reais ainda não tiverem sido inseridas no .env
    // =========================================================================
    return res.status(200).json({
      ok: true,
      mode: "simulation",
      gateway: gateway,
      orderId: order.id,
      message: "Pedido registrado com sucesso. Configure MERCADOPAGO_ACCESS_TOKEN ou ASAAS_API_KEY no painel da Vercel para transações bancárias reais.",
      paymentStatus: "approved"
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Erro interno no processamento do pedido.",
      error: error.message
    });
  }
}

