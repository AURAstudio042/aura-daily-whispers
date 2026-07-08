import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>AURA doğrulama kodun ✦</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={mark}>✦ AURA</Text>
        <Heading style={h1}>Kimliğini doğrula.</Heading>

        <Text style={text}>
          Aşağıdaki kodu kullanarak kimliğini doğrulayabilirsin:
        </Text>
        <Text style={codeStyle}>{token}</Text>

        <Text style={signature}>— AURA ✨</Text>

        <Text style={footer}>
          Bu kodu sen istemediysen, sessizce görmezden gelebilirsin.
          Kod kısa süre sonra kaybolur.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '30px',
  letterSpacing: '0.4em',
  fontWeight: 500 as const,
  color: '#0a0a1a',
  margin: '20px 0 30px',
}
const signature = {
  fontSize: '11px',
  letterSpacing: '0.35em',
  color: '#8b5cf6',
  margin: '40px 0 0',
}
const footer = { fontSize: '12px', color: '#9b96a8', lineHeight: 1.6, margin: '28px 0 0' }
