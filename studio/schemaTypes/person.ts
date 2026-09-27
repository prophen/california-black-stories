import {defineField, defineType} from 'sanity'

export const person = defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'role', title: 'Role', type: 'string'}),
    defineField({name: 'bio', title: 'Bio', type: 'text'}),
    defineField({
      name: 'stories',
      title: 'Stories',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'story'}]}],
    }),
  ],
})
