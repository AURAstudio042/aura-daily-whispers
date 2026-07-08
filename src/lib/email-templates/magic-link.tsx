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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>AURA'ya sessizce giriş yap ✦</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={mark}>✦ AURA</Text>
        <Heading style={h1}>Giriş bağlantın hazır.</Heading>

        <Text style={text}>
          Aşağıdaki bağlantı seni AURA'ya sessizce bırakır.
        </Text>
        <Text style={text}>
          Bu bağlantı kısa süre sonra kaybolur — kalbin hazır olduğunda kullan.
        </Text>

        <Button style={button} href={confirmationUrl}>
          AURA'ya gir
        </Button>

        <Text style={signature}>— AURA ✨</Text>

        <Text style={footer}>
          Bu bağlantıyı sen istemediysen, bu e-postayı görmezden gelebilirsin.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
