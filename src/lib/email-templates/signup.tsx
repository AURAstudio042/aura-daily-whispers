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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ confirmationUrl }: SignupEmailProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>AURA'ya hoş geldin ✦</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={mark}>✦ AURA</Text>
        <Heading style={h1}>AURA'ya hoş geldin.</Heading>

        <Text style={text}>
          Bunu okuduğunda belki sadece bir kayıt işlemi gibi görünüyor…
        </Text>
        <Text style={text}>
          Ama biz seni biraz önce hissettik.
        </Text>
        <Text style={text}>
          Bazen doğru zaman diye bir şey vardır… ve seninki belki de buydu.
        </Text>

        <Text style={{ ...text, marginTop: '28px' }}>
          Bizi tamamlamak için küçük bir adım kaldı — aşağıdaki bağlantı
          seni sistemde tanımamız için bir anahtar.
        </Text>

        <Button style={button} href={confirmationUrl}>
          Hesabımı doğrula
        </Button>

        <Text style={signature}>— AURA ✨</Text>

        <Text style={footer}>
          Bu isteği sen yapmadıysan, bu e-postayı sessizce görmezden gelebilirsin.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
  fontSize: '30px',
  fontWeight: 300 as const,
  color: '#0a0a1a',
  margin: '0 0 24px',
  lineHeight: 1.15,
}
const text = {
  fontSize: '15px',
  color: '#3b3348',
  lineHeight: 1.7,
  margin: '0 0 14px',
}
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
