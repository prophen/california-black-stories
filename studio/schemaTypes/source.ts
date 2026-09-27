import {defineField, defineType} from 'sanity'

export const source = defineType({
  name: 'source',
  title: 'Source',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({name: 'publisher', title: 'Publisher', type: 'string'}),
    defineField({
      name: 'stories',
      title: 'Stories citing this source',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'story'}]}],
    }),
  ],
})
