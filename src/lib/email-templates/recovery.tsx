import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>Bir şeyleri yeniden başlatmak bazen iyidir.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={mark}>✦ AURA</Text>
        <Heading style={h1}>Bir şeyleri yeniden başlatmak bazen iyidir.</Heading>

        <Text style={text}>Bu isteği sen yaptın.</Text>
        <Text style={text}>
          Eğer bir şeyler ağır geldiyse, yeniden başlamak için buradayız.
        </Text>
        <Text style={text}>
          Şifreni sıfırlamak için aşağıdaki bağlantıyı takip et.
        </Text>

        <Button style={button} href={confirmationUrl}>
          Şifremi sıfırla
        </Button>

        <Text style={signature}>— AURA ✨</Text>

        <Text style={footer}>
          Bu isteği sen yapmadıysan, bu e-postayı görmezden gelebilirsin.
          Şifren değişmeyecek.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '520px' }
const mark = {
  fontSize: '11px',
  letterSpacing: '0.35em',
  color: '#8b5cf6',
  textTransform: 'uppercase' as const,
  margin: '0 0 24px',
}
const h1 = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: '28px',
  fontWeight: 300 as const,
  color: '#0a0a1a',
  margin: '0 0 24px',
  lineHeight: 1.2,
}
const text = { fontSize: '15px', color: '#3b3348', lineHeight: 1.7, margin: '0 0 14px' }
const button = {
  backgroundColor: '#0a0a1a',
  color: '#ffffff',
  fontSize: '13px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  borderRadius: '999px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '20px 0 0',
}
const signature = {
  fontSize: '11px',
  letterSpacing: '0.35em',
  color: '#8b5cf6',
  margin: '40px 0 0',
}
const footer = { fontSize: '12px', color: '#9b96a8', lineHeight: 1.6, margin: '28px 0 0' }
