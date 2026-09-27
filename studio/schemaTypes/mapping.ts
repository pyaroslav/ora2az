import {defineField, defineType} from 'sanity'
import {sourcesField, versionList} from './shared'

export default defineType({
  name: 'mapping',
  title: 'Mapping (Oracle feature → Azure target)',
  type: 'document',
  fields: [
    defineField({name: 'oracleFeature', type: 'reference', to: [{type: 'oracleFeature'}], validation: (r) => r.required()}),
    defineField({name: 'azureTarget', type: 'reference', to: [{type: 'azureTarget'}], validation: (r) => r.required()}),
    defineField({
      name: 'fidelity',
      type: 'string',
      options: {list: ['exact', 'partial', 'workaround', 'none'], layout: 'radio'},
      validation: (r) => r.required(),
    }),
    defineField({name: 'effort', type: 'string', options: {list: ['S', 'M', 'L'], layout: 'radio'}}),
    defineField({name: 'rationale', type: 'text', rows: 4, validation: (r) => r.required()}),
    defineField({name: 'steps', title: 'Migration steps', type: 'array', of: [{type: 'block'}]}),
    versionList('appliesToOracleVersions', 'Applies to Oracle versions'),
    sourcesField,
  ],
  preview: {
    select: {f: 'oracleFeature.name', t: 'azureTarget.name', fid: 'fidelity'},
    prepare: ({f, t, fid}) => ({title: `${f} → ${t}`, subtitle: fid}),
  },
})
