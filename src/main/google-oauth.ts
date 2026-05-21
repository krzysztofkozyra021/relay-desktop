import { BrowserWindow } from 'electron'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

function buildAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid email profile',
    response_type: 'code',
    access_type: 'online',
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<string> {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    throw new Error('Błąd wymiany kodu Google na token.')
  }

  const data = (await res.json()) as { access_token?: string }
  if (!data.access_token) {
    throw new Error('Brak access_token w odpowiedzi Google.')
  }
  return data.access_token
}

export function startGoogleOAuth(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return Promise.reject(
      new Error(
        'Google OAuth nie jest skonfigurowane. Ustaw GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET i GOOGLE_REDIRECT_URI w .env'
      )
    )
  }

  return new Promise((resolve, reject) => {
    let redirectHandled = false

    const popup = new BrowserWindow({
      width: 600,
      height: 700,
      show: true,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    popup.loadURL(buildAuthUrl(clientId, redirectUri))

    const handleRedirect = async (url: string) => {
      if (!url.startsWith(redirectUri)) return
      if (redirectHandled) return
      redirectHandled = true

      popup.close()

      try {
        const parsed = new URL(url)
        const error = parsed.searchParams.get('error')
        if (error) {
          reject(new Error('Logowanie przez Google zostało anulowane.'))
          return
        }
        const code = parsed.searchParams.get('code')
        if (!code) {
          reject(new Error('Brak kodu autoryzacyjnego od Google.'))
          return
        }
        const accessToken = await exchangeCodeForToken(
          code,
          clientId,
          clientSecret,
          redirectUri
        )
        resolve(accessToken)
      } catch (err) {
        reject(err)
      }
    }

    popup.webContents.on('will-redirect', (_event, url) => {
      handleRedirect(url).catch(reject)
    })

    popup.webContents.on('will-navigate', (_event, url) => {
      handleRedirect(url).catch(reject)
    })

    popup.on('closed', () => {
      if (!redirectHandled) {
        reject(new Error('Logowanie przez Google zostało anulowane.'))
      }
    })
  })
}
