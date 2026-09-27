import {defineField, defineType} from 'sanity'

export const story = defineType({
  name: 'story',
  title: 'Story',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
    }),
    defineField({name: 'promptNumber', title: 'Prompt number', type: 'number'}),
    defineField({name: 'pillar', title: 'Pillar', type: 'string'}),
    defineField({name: 'postType', title: 'Post type', type: 'string'}),
    defineField({
      name: 'publishStatus',
      title: 'Publish status',
      type: 'string',
      options: {
        list: ['published', 'scheduled', 'ready_for_review', 'draft', 'not recorded'],
      },
    }),
    defineField({name: 'subject', title: 'Subject', type: 'string'}),
    defineField({name: 'location', title: 'Location', type: 'string'}),
    defineField({name: 'era', title: 'Era', type: 'string'}),
    defineField({name: 'caption', title: 'Caption', type: 'text'}),
    defineField({
      name: 'hashtags',
      title: 'Hashtags',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({name: 'firstComment', title: 'First comment', type: 'text'}),
    defineField({
      name: 'claims',
      title: 'Fact-check claims',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'claim', title: 'Claim', type: 'text'}),
            defineField({
              name: 'sources',
              title: 'Sources',
              type: 'array',
              of: [{type: 'url'}],
            }),
            defineField({
              name: 'verificationStatus',
              title: 'Verification status',
              type: 'string',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'people',
      title: 'People',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'person'}]}],
    }),
    defineField({
      name: 'places',
      title: 'Places',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'place'}]}],
    }),
    defineField({
      name: 'sourceUrls',
      title: 'All source URLs',
      type: 'array',
      of: [{type: 'url'}],
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'pillar', promptNumber: 'promptNumber'},
    prepare({title, subtitle, promptNumber}) {
      return {
        title: promptNumber ? `#${promptNumber} ${title}` : title,
        subtitle,
      }
    },
  },
})
