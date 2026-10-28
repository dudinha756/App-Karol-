export async function sendPasswordResetCode(to:string, code:string){
  const apiKey=process.env.RESEND_API_KEY;
  const from=process.env.PASSWORD_RESET_FROM || "Forma day <onboarding@resend.dev>";

  if(!apiKey){
    throw new Error("email_service_not_configured");
  }

  const html=`
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#2A1648">
      <h2 style="margin-bottom:8px">Redefinição de senha — Forma day</h2>
      <p style="line-height:1.6;color:#766A88">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <div style="margin:24px 0;padding:18px;border-radius:14px;background:#F6F2FF;text-align:center">
        <div style="font-size:13px;color:#8B7C9E;margin-bottom:6px">Seu código é</div>
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#654CFF">${code}</div>
      </div>
      <p style="line-height:1.6;color:#766A88">O código expira em 10 minutos. Se você não solicitou essa alteração, ignore este e-mail.</p>
    </div>
  `;

  const res=await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{
      "content-type":"application/json",
      "authorization":"Bearer "+apiKey
    },
    body:JSON.stringify({
      from,
      to:[to],
      subject:"Código para redefinir sua senha — Forma day",
      html
    })
  });

  if(!res.ok){
    const body=await res.text().catch(function(){return ""});
    console.error("password reset email failed",res.status,body.slice(0,500));
    throw new Error("email_send_failed");
  }
}
