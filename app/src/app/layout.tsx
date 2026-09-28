import type {Metadata} from 'next'
import type {ReactNode} from 'react'
import {Playfair_Display, Source_Serif_4} from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const playfair = Playfair_Display({variable: '--font-playfair', subsets: ['latin'], weight: ['400', '700', '900']})
const serif = Source_Serif_4({variable: '--font-serif', subsets: ['latin'], weight: ['400', '600'], style: ['normal', 'italic']})

export const metadata: Metadata = {
  title: 'Legacy Obituaries',
  description: 'Notices of desupport and departure for Oracle Database features that did not survive the move to Azure, generated from a structured migration knowledge graph on Sanity.',
}

export default function RootLayout({children}: {children: ReactNode}) {
  const today = new Date().toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})
  return (
    <html lang="en" className={`${playfair.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="wrap">
          <header className="masthead">
            <h1><Link href="/" style={{textDecoration: 'none'}}>The Legacy Obituaries</Link></h1>
            <div className="dateline">
              <span>Notices of desupport &amp; departure</span>
              <span>Oracle Database → Azure</span>
              <span>{today}</span>
              <Link href="/coroner">The Coroner&rsquo;s Reports</Link>
              <Link href="/about">About this paper</Link>
            </div>
          </header>
          <main>{children}</main>
          <footer className="colophon">
            Every notice is generated from a public Sanity dataset in which each claim carries a source. Nothing here is written from memory.
            <br />
            <a href="https://github.com/pyaroslav/ora2az">Source code and dataset</a>
          </footer>
        </div>
      </body>
    </html>
  )
}
