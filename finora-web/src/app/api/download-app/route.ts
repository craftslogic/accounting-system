import { NextResponse } from 'next/server'

export async function GET() {
  const url = "https://github.com/craftslogic/accounting-system/releases/download/finora/application-5deee316-22da-493c-aeb0-21cf43c5a37c.apk"
  
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch APK: ${response.statusText}`)
    }

    // Pass through the response body and add the Content-Disposition header
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="finoraa.apk"',
        'Content-Length': response.headers.get('content-length') || '',
      },
    })
  } catch (error) {
    console.error('Error downloading APK:', error)
    return NextResponse.json({ error: 'Failed to download APK' }, { status: 500 })
  }
}
