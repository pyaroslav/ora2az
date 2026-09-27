import {defineField, defineType} from 'sanity'
import {sourcesField} from './shared'

export default defineType({
  name: 'glossary',
  title: 'Glossary term',
  type: 'document',
  fields: [
    defineField({name: 'term', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'definition', type: 'text', rows: 4, validation: (r) => r.required()}),
    defineField({name: 'alsoKnownAs', type: 'array', of: [{type: 'string'}]}),
    sourcesField,
  ],
  preview: {select: {title: 'term'}},
})
