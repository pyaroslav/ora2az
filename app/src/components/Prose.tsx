import {PortableText} from 'next-sanity'
import type {PT} from '@/sanity/types'

export function Prose({value}: {value?: PT}) {
  if (!value?.length) return null
  return (
    <div className="prose-col">
      <PortableText value={value} />
    </div>
  )
}
