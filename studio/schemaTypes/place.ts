import {defineField, defineType} from 'sanity'

export const place = defineType({
  name: 'place',
  title: 'Place',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'city', title: 'City', type: 'string'}),
    defineField({name: 'region', title: 'Region', type: 'string'}),
    defineField({name: 'notes', title: 'Notes', type: 'text'}),
    defineField({
      name: 'stories',
      title: 'Stories',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'story'}]}],
    }),
  ],
})
