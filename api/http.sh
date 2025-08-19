# auth.ts

curl -i 'http://localhost:3000/register' -H 'Content-Type: application/json' -d '{"name": "Me", "email":"me@example.com","password":"secret"}'

curl -i 'http://localhost:3000/login' -H 'Content-Type: application/json' -d '{"email":"me@example.com","password":"secret"}'

curl -i -X POST 'http://localhost:3000/logout' -b 'sid=s%3A1-txuHpClFEUGSeJl8XoOGvoP-b1VJjnI1.wi9zLcleXmRXCrg2oEjUIB8CHWHW93HVDmWSogXUnE0'

# email.ts

curl -i -X POST 'http://localhost:3000/email/resend' -b 'sid=s%3A1-gZAhqUDALOTVqkvdLvRzt1VLnyQym8sb.AUmXaGXl%2B0v0q1Ph1XRHBwdb1LlOu%2BSG9xa4b42QIvg'

curl -i 'http://localhost:3000/email/verify' -b 'sid=s%3A1-gZAhqUDALOTVqkvdLvRzt1VLnyQym8sb.AUmXaGXl%2B0v0q1Ph1XRHBwdb1LlOu%2BSG9xa4b42QIvg' -d '{"expiredAt": 1755639921447, "signature": "Rkxab2_08PkZ_ydmwgp6VNAiygiu6Ko0Ee_tUB_b8U0"}' -H 'Content-Type: application/json'

# password.ts

curl 'http://localhost:3000/password/email' -H 'Content-Type: application/json' -d '{"email": "me@example.com"}' | json

curl 'http://localhost:3000/password/reset' -H 'Content-Type: application/json' -d '{"id": 1, "token": "5mEk_N7HoAcO2NmC24hQyiBxpXPt9h4lZKxEwlVJBZQ", "password": "whatever"}' | json

curl -i 'http://localhost:3000/password/confirm' -H 'Content-Type: application/json' -d '{"password": "whatever"}' -b 'sid=s%3A1-l_7cxeI8976n8pTcMf2lLoHG0Kf-1BoV.yhHoIxrHB062G4gVCE%2BxvjXe4xhzV0WF3JFocy4WpSY'

# user.ts

curl -i 'http://localhost:3000/me' -b 'sid=s%3A1-l_7cxeI8976n8pTcMf2lLoHG0Kf-1BoV.yhHoIxrHB062G4gVCE%2BxvjXe4xhzV0WF3JFocy4WpSY'

curl -i 'http://localhost:3000/me/verified' -b 'sid=s%3A1-l_7cxeI8976n8pTcMf2lLoHG0Kf-1BoV.yhHoIxrHB062G4gVCE%2BxvjXe4xhzV0WF3JFocy4WpSY'

curl -i 'http://localhost:3000/me/confirmed' -b 'sid=s%3A1-l_7cxeI8976n8pTcMf2lLoHG0Kf-1BoV.yhHoIxrHB062G4gVCE%2BxvjXe4xhzV0WF3JFocy4WpSY'

curl -i -X DELETE 'http://localhost:3000/me' -b 'sid=s%3A1-l_7cxeI8976n8pTcMf2lLoHG0Kf-1BoV.yhHoIxrHB062G4gVCE%2BxvjXe4xhzV0WF3JFocy4WpSY'
