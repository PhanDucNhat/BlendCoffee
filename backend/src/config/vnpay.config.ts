export const vnpayConfig = {
  vnp_TmnCode: "Z6S3NNTR",
  vnp_HashSecret: "QGUMH58X0UZTC3U0DHMLOT0W978KILHW",
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrlBase: "http://localhost:3000/order",
  vnp_IpnUrl: "http://localhost:5000/api/vnpay/ipn",
} as const;
