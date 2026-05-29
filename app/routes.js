const express = require('express')

const router = express.Router()

function errorListFrom(errors) {
  return Object.entries(errors).map(([field, text]) => ({
    href: `#${field}`,
    text
  }))
}

function generateGooseReferenceNumber() {
  return `GOOSE-${Math.floor(100000 + Math.random() * 900000)}`
}

function generateMentalHealthReferenceNumber() {
  return `MHR-${Math.floor(100000 + Math.random() * 900000)}`
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  return value ? [value] : []
}

function normaliseText(value) {
  return value && typeof value === 'string' ? value.trim() : ''
}

const mentalHealthBasePath = '/mental-health-referral'

const mentalHealthPages = [
  {
    slug: 'your-details',
    title: 'Your details',
    fields: [
      { type: 'text', name: 'referrerFirstName', label: 'First name', error: 'Enter your first name', autocomplete: 'given-name' },
      { type: 'text', name: 'referrerLastName', label: 'Last name', error: 'Enter your last name', autocomplete: 'family-name' },
      { type: 'text', name: 'referrerJobTitle', label: 'Job title', error: 'Enter your job title', autocomplete: 'organization-title' },
      { type: 'text', name: 'referrerOrganisation', label: 'Organisation or team', error: 'Enter your organisation or team', autocomplete: 'organization' }
    ]
  },
  {
    slug: 'your-contact-details',
    title: 'Your contact details',
    fields: [
      { type: 'email', name: 'referrerEmail', label: 'Email address', error: 'Enter your email address', autocomplete: 'email' },
      { type: 'tel', name: 'referrerPhone', label: 'Phone number', error: 'Enter your phone number', autocomplete: 'tel' }
    ]
  },
  {
    slug: 'relationship',
    title: 'What’s your relationship to the person you’re referring?',
    fields: [
      {
        type: 'select',
        name: 'relationshipToPerson',
        label: 'What’s your relationship to the person you’re referring?',
        error: 'Select your relationship to the person you’re referring',
        items: [
          'GP or other primary care professional',
          'NHS mental health professional',
          'Housing or homelessness professional',
          'Voluntary or community sector worker'
        ]
      }
    ]
  },
  {
    slug: 'person-details',
    title: 'Details of the person you’re referring',
    fields: [
      { type: 'text', name: 'personFirstName', label: 'First name', error: 'Enter their first name', autocomplete: 'given-name' },
      { type: 'text', name: 'personLastName', label: 'Last name', error: 'Enter their last name', autocomplete: 'family-name' },
      { type: 'date', name: 'personDateOfBirth', label: 'Date of birth', hint: 'For example, 27 3 1980', error: 'Enter their date of birth' }
    ]
  },
  {
    slug: 'home-address',
    title: 'What’s the full home address of the person you’re referring?',
    hint: 'Enter the address where they live',
    fields: [
      { type: 'address' }
    ]
  },
  {
    slug: 'accommodation',
    title: 'What type of accommodation do they live in?',
    fields: [
      {
        type: 'radios',
        name: 'accommodationType',
        label: 'What type of accommodation do they live in?',
        error: 'Select what type of accommodation they live in',
        items: ['Independent', 'Supported']
      }
    ]
  },
  {
    slug: 'contact-person',
    title: 'How can we contact the person you’re referring?',
    fields: [
      {
        type: 'contactDetails',
        name: 'personContactMethods',
        label: 'How can we contact the person you’re referring?',
        hint: 'Select all that apply',
        error: 'Select how we can contact the person you’re referring',
        emailName: 'personContactEmail',
        phoneName: 'personContactPhone',
        emailConfirmationHint: '',
        emailLabel: 'Enter their email address',
        phoneLabel: 'Enter their phone number'
      }
    ]
  },
  {
    slug: 'preferred-contact',
    title: 'What’s their preferred method of contact?',
    fields: [
      {
        type: 'checkboxGroup',
        name: 'preferredContactMethods',
        label: 'What’s their preferred method of contact?',
        hint: 'Select all that apply',
        error: 'Select their preferred method of contact',
        items: ['Phone', 'SMS', 'Email', 'Home visit']
      }
    ]
  },
  {
    slug: 'next-of-kin',
    title: 'Do you know details for their next of kin?',
    fields: [
      {
        type: 'radios',
        name: 'hasNextOfKinDetails',
        label: 'Do you know details for their next of kin?',
        labelClasses: 'govuk-fieldset__legend--m',
        error: 'Select whether you know details for their next of kin',
        items: ['Yes', 'No']
      }
    ]
  },
  {
    slug: 'next-of-kin-contact',
    title: 'Details of their next of kin',
    fields: [
      { type: 'text', name: 'nextOfKinFirstName', label: 'First name', error: 'Enter their next of kin’s first name', autocomplete: 'given-name' },
      { type: 'text', name: 'nextOfKinLastName', label: 'Last name', error: 'Enter their next of kin’s last name', autocomplete: 'family-name' },
      {
        type: 'contactDetails',
        name: 'nextOfKinContactMethods',
        label: 'How can we contact them?',
        labelClasses: 'govuk-fieldset__legend--m',
        hint: 'Select all that apply',
        error: 'Select how we can contact them',
        emailName: 'nextOfKinContactEmail',
        phoneName: 'nextOfKinContactPhone',
        emailConfirmationHint: '',
        emailLabel: 'Enter their email address',
        phoneLabel: 'Enter their phone number'
      },
      {
        type: 'text',
        name: 'nextOfKinRelationship',
        label: 'What’s their relationship to the person you’re referring?',
        hint: 'For example, parent, sibling, friend',
        error: 'Enter their relationship to the person you’re referring'
      }
    ]
  },
  {
    slug: 'advocate',
    title: 'Does the person you’re referring have an advocate?',
    fields: [
      {
        type: 'radios',
        name: 'hasAdvocate',
        label: 'Does the person you’re referring have an advocate?',
        error: 'Select whether they have an advocate',
        items: ['Yes', 'No']
      }
    ]
  },
  {
    slug: 'advocate-details',
    title: 'Details of their advocate',
    fields: [
      { type: 'text', name: 'advocateFirstName', label: 'First name', error: 'Enter the advocate’s first name', autocomplete: 'given-name' },
      { type: 'text', name: 'advocateLastName', label: 'Last name', error: 'Enter the advocate’s last name', autocomplete: 'family-name' },
      {
        type: 'contactDetails',
        name: 'advocateContactMethods',
        label: 'How can we contact them?',
        labelClasses: 'govuk-fieldset__legend--m',
        hint: 'Select all that apply',
        error: 'Select how we can contact them',
        emailName: 'advocateContactEmail',
        phoneName: 'advocateContactPhone',
        emailConfirmationHint: '',
        emailLabel: 'Enter their email address',
        phoneLabel: 'Enter their phone number'
      }
    ]
  },
  {
    slug: 'identifiers',
    title: 'Do you know their NHS number?',
    fields: [
      {
        type: 'radios',
        name: 'knowsNhsNumber',
        label: 'Do you know their NHS number?',
        error: 'Select whether you know their NHS number',
        items: ['Yes', 'No'],
        conditional: {
          value: 'Yes',
          fields: [
            { type: 'text', name: 'nhsNumber', label: 'Tell us their NHS number', error: 'Enter their NHS number' }
          ]
        }
      }
    ]
  },
  {
    slug: 'referral-awareness',
    title: 'Does the person you’re referring consent to this?',
    fields: [
      {
        type: 'radios',
        name: 'personConsentsReferral',
        label: 'Does the person you’re referring consent to this?',
        error: 'Select whether the person you’re referring consents to this',
        items: ['Yes', 'No']
      }
    ]
  },
  {
    slug: 'consent-not-given',
    title: 'Why do you not have their consent?',
    fields: [
      {
        type: 'radios',
        name: 'consentNotGivenReason',
        label: 'Why do you not have their consent?',
        error: 'Select why you do not have their consent',
        items: [
          'The person finds it difficult to understand and give consent',
          'The person refused to give consent',
          'There’s a safeguarding concern',
          'Other'
        ],
        conditional: {
          value: 'Other',
          fields: [
            { type: 'textarea', name: 'consentNotGivenOtherDetails', label: 'Tell us why you do not have their consent', error: 'Tell us why you do not have their consent' }
          ]
        }
      }
    ]
  },
  {
    slug: 'communication-needs',
    title: 'Reasonable adjustments for the person you’re referring',
    fields: [
      {
        type: 'radios',
        name: 'hasCommunicationNeeds',
        label: 'Does the person you’re referring have any communication needs?',
        labelClasses: 'govuk-fieldset__legend--m',
        hint: 'For example, they need a British Sign Language (BSL) interpreter or a translator',
        error: 'Select whether they have any communication needs',
        items: ['Yes', 'No'],
        conditional: {
          value: 'Yes',
          fields: [
            { type: 'textarea', name: 'communicationNeedsDetails', label: 'Tell us what communication needs they have', labelClasses: 'govuk-hint', error: 'Tell us what communication needs they have' }
          ]
        }
      },
      {
        type: 'radios',
        name: 'needsReasonableAdjustments',
        label: 'Do they need any other reasonable adjustments?',
        labelClasses: 'govuk-fieldset__legend--m',
        hint: 'For example, large print documents or wheelchair access',
        error: 'Select whether they need any other reasonable adjustments',
        items: ['Yes', 'No'],
        conditional: {
          value: 'Yes',
          fields: [
            { type: 'textarea', name: 'reasonableAdjustmentsDetails', label: 'Tell us what reasonable adjustments they need', labelClasses: 'govuk-hint', error: 'Tell us what reasonable adjustments they need' }
          ]
        }
      }
    ]
  },
  {
    slug: 'mental-health-conditions',
    title: 'Mental health conditions',
    fields: [
      {
        type: 'radios',
        name: 'hasConfirmedDiagnosis',
        label: 'Do they have any mental health conditions with a confirmed diagnosis?',
        labelClasses: 'govuk-fieldset__legend--m',
        error: 'Select whether they have any mental health conditions with a confirmed diagnosis',
        items: ['Yes', 'No'],
        conditional: {
          value: 'Yes',
          fields: [
            { type: 'textarea', name: 'confirmedDiagnosisDetails', label: 'Tell us what mental health conditions with a confirmed diagnosis they have', labelClasses: 'govuk-hint', error: 'Tell us what mental health conditions with a confirmed diagnosis they have' }
          ]
        }
      },
      {
        type: 'radios',
        name: 'hasSuspectedConditions',
        label: 'Do they have any suspected mental health conditions?',
        labelClasses: 'govuk-fieldset__legend--m',
        error: 'Select whether they have any suspected mental health conditions',
        items: ['Yes', 'No'],
        conditional: {
          value: 'Yes',
          fields: [
            { type: 'textarea', name: 'suspectedConditionsDetails', label: 'Tell us what suspected mental health conditions they have', labelClasses: 'govuk-hint', error: 'Tell us what suspected mental health conditions they have' }
          ]
        }
      }
    ]
  },
  {
    slug: 'clinical-professionals',
    title: 'Are any clinical professionals currently involved in their care?',
    fields: [
      {
        type: 'radios',
        name: 'clinicalProfessionalsInvolved',
        label: 'Are any clinical professionals currently involved in their care?',
        error: 'Select whether any clinical professionals are currently involved in their care',
        items: ['Yes', 'No']
      }
    ]
  },
  {
    slug: 'clinical-professional-details',
    title: 'Details of the clinical professionals',
    hint: 'Tell us their details, if you know them.',
    repeatableFieldsets: {
      countName: 'clinicalProfessionalCount',
      max: 3,
      addButtonText: 'Add another clinical professional'
    },
    fields: [
      {
        type: 'fieldset',
        repeatIndex: 1,
        legend: 'Clinical professional',
        fields: [
          { type: 'text', name: 'clinicalProfessional1FirstName', label: 'First name', error: 'Enter the clinical professional’s first name', autocomplete: 'given-name' },
          { type: 'text', name: 'clinicalProfessional1LastName', label: 'Last name', error: 'Enter the clinical professional’s last name', autocomplete: 'family-name' },
          { type: 'text', name: 'clinicalProfessional1JobTitle', label: 'Job title', error: 'Enter the clinical professional’s job title', autocomplete: 'organization-title' },
          { type: 'text', name: 'clinicalProfessional1Organisation', label: 'Organisation or team', error: 'Enter the clinical professional’s organisation or team', autocomplete: 'organization' }
        ]
      },
      {
        type: 'fieldset',
        repeatIndex: 2,
        legend: 'Clinical professional',
        optional: true,
        fields: [
          { type: 'text', name: 'clinicalProfessional2FirstName', label: 'First name', error: 'Enter the clinical professional’s first name', autocomplete: 'given-name' },
          { type: 'text', name: 'clinicalProfessional2LastName', label: 'Last name', error: 'Enter the clinical professional’s last name', autocomplete: 'family-name' },
          { type: 'text', name: 'clinicalProfessional2JobTitle', label: 'Job title', error: 'Enter the clinical professional’s job title', autocomplete: 'organization-title' },
          { type: 'text', name: 'clinicalProfessional2Organisation', label: 'Organisation or team', error: 'Enter the clinical professional’s organisation or team', autocomplete: 'organization' }
        ]
      },
      {
        type: 'fieldset',
        repeatIndex: 3,
        legend: 'Clinical professional',
        optional: true,
        fields: [
          { type: 'text', name: 'clinicalProfessional3FirstName', label: 'First name', error: 'Enter the clinical professional’s first name', autocomplete: 'given-name' },
          { type: 'text', name: 'clinicalProfessional3LastName', label: 'Last name', error: 'Enter the clinical professional’s last name', autocomplete: 'family-name' },
          { type: 'text', name: 'clinicalProfessional3JobTitle', label: 'Job title', error: 'Enter the clinical professional’s job title', autocomplete: 'organization-title' },
          { type: 'text', name: 'clinicalProfessional3Organisation', label: 'Organisation or team', error: 'Enter the clinical professional’s organisation or team', autocomplete: 'organization' }
        ]
      }
    ]
  },
  {
    slug: 'children',
    title: 'Do they live with children?',
    fields: [
      {
        type: 'radios',
        name: 'livesWithChildren',
        label: 'Do they live with children?',
        error: 'Select whether they live with children',
        items: ['Yes', 'No']
      }
    ]
  },
  {
    slug: 'children-details',
    title: 'Details of the children who live with them',
    hintHtml: 'If you’re worried about a child or young person, <a class="govuk-link" href="https://www.camden.gov.uk/are-you-worried-about-a-child">find ways to report a vulnerable child or child abuse</a>.',
    fields: [
      {
        type: 'textarea',
        name: 'childrenCount',
        label: 'How many children live with them?',
        labelClasses: 'govuk-label--m',
        error: 'Tell us how many children live with them'
      },
      {
        type: 'textarea',
        name: 'childrenAgeRange',
        label: 'What is the age range of children who live with them?',
        labelClasses: 'govuk-label--m',
        hint: 'For example, 8 to 12',
        error: 'Tell us the age range of children who live with them'
      }
    ]
  },
  {
    slug: 'violence-or-aggression',
    title: 'Does the person you’re referring have a history of violence or aggression?',
    fields: [
      {
        type: 'radios',
        name: 'historyOfViolenceOrAggression',
        label: 'Does the person you’re referring have a history of violence or aggression?',
        error: 'Select whether they have a history of violence or aggression',
        items: ['Yes', 'No', 'Unknown']
      }
    ]
  },
  {
    slug: 'current-risks',
    title: 'Do they have any current risks?',
    fields: [
      {
        type: 'checkboxGroup',
        name: 'currentRisks',
        label: 'Do they have any current risks?',
        hint: 'Select all that apply',
        error: 'Select any current risks, or select None of these',
        exclusive: 'None of these',
        exclusiveError: 'Select current risks or None of these',
        items: [
          'Self-harm',
          'Suicidal ideation',
          'Neglect',
          'Substance misuse',
          'Risk to others',
          'Other',
          'None of these'
        ],
        conditional: {
          value: 'Other',
          fields: [
            {
              type: 'textarea',
              name: 'currentRisksOtherDetails',
              label: 'Tell us about the other current risks',
              labelClasses: 'govuk-visually-hidden',
              error: 'Tell us about the other current risks'
            }
          ]
        }
      }
    ]
  },
  {
    slug: 'environmental-risks',
    title: 'Are there any environmental risks?',
    fields: [
      {
        type: 'radios',
        name: 'hasEnvironmentalRisks',
        label: 'Are there any environmental risks?',
        hint: 'For example, needle finds, evidence of cuckooing, pets',
        error: 'Select whether there are any environmental risks',
        items: ['Yes', 'No'],
        conditional: {
          value: 'Yes',
          fields: [
            { type: 'textarea', name: 'environmentalRisksDetails', label: 'Tell us what environmental risks there are', error: 'Tell us what environmental risks there are' }
          ]
        }
      }
    ]
  },
  {
    slug: 'reason-for-referral',
    title: 'Why are you making this referral?',
    fields: [
      {
        type: 'checkboxGroup',
        name: 'referralReasons',
        label: 'Why are you making this referral?',
        hint: 'Select all that apply',
        error: 'Select why you’re making this referral',
        items: [
          'Safeguarding concern (Section 42)',
          'New Care Act 2014 Assessment',
          'Deep clean or environmental health',
          'Supported housing or care home request',
          'Carer support or assessment',
          'Review of existing package of care',
          'Voluntary sector or signposting (such as befriending, advocacy)'
        ]
      }
    ]
  },
  {
    slug: 'current-situation',
    title: 'Current situation and requested actions',
    fields: [
      {
        type: 'textarea',
        name: 'currentSituationSummary',
        label: 'Tell us a summary of the person’s current situation, including your reason for making this referral now',
        error: 'Tell us a summary of the person’s current situation'
      },
      {
        type: 'textarea',
        name: 'requestedActions',
        label: 'Tell us what actions you want us to take',
        error: 'Tell us what actions you want us to take'
      }
    ]
  }
]

const mentalHealthTotalPages = mentalHealthPages.length

const mentalHealthSections = [
  { title: 'Your details', start: 1, end: 3 },
  { title: 'About the person you’re referring', start: 4, end: 15 },
  { title: 'Health, communication and care needs', start: 16, end: 19 },
  { title: 'Safety and risks', start: 20, end: 24 },
  { title: 'Reason for referral', start: 25, end: 26 }
]

function getMentalHealthSectionTitle(pageNumber) {
  const section = mentalHealthSections.find(({ start, end }) => pageNumber >= start && pageNumber <= end)

  return section ? section.title : ''
}

const mentalHealthPageBySlug = Object.fromEntries(
  mentalHealthPages.map((page, index) => [page.slug, {
    ...page,
    index,
    pageNumber: index + 1,
    sectionTitle: getMentalHealthSectionTitle(index + 1)
  }])
)

function getMentalHealthPageNumber(slug) {
  return mentalHealthPageBySlug[slug].index + 1
}

const referralReasonFollowUpPages = [
  {
    reason: 'Safeguarding concern (Section 42)',
    slug: 'safeguarding-concern-section-42',
    title: 'Safeguarding concern (Section 42)',
    fields: [
      {
        type: 'textarea',
        name: 'safeguardingConcernDetails',
        label: 'Safeguarding concern (Section 42)',
        hint: 'Describe the alleged abuse or neglect, who is involved, what are the immediate risks, and what immediate safety actions have been taken so far',
        error: 'Enter details about the safeguarding concern'
      }
    ]
  },
  {
    reason: 'New Care Act 2014 Assessment',
    slug: 'new-care-act-2014-assessment',
    title: 'New Care Act 2014 Assessment',
    fields: [
      {
        type: 'textarea',
        name: 'careActAssessmentDetails',
        label: 'New Care Act 2014 Assessment',
        hint: 'What are the person’s primary needs for daily living?',
        error: 'Enter the person’s primary needs for daily living'
      }
    ]
  },
  {
    reason: 'Deep clean or environmental health',
    slug: 'deep-clean-or-environmental-health',
    title: 'Deep clean or environmental health',
    fields: [
      {
        type: 'textarea',
        name: 'deepCleanHoardingDetails',
        label: 'Is there hoarding involved?',
        hint: 'Describe the level or scale',
        error: 'Tell us if there is hoarding involved'
      },
      {
        type: 'textarea',
        name: 'deepCleanFireSafetyDetails',
        label: 'Are there risks to health or fire safety?',
        error: 'Tell us if there are risks to health or fire safety'
      }
    ]
  },
  {
    reason: 'Supported housing or care home request',
    slug: 'supported-housing-or-care-home-request',
    title: 'Supported housing or care home request',
    fields: [
      {
        type: 'textarea',
        name: 'supportedHousingDetails',
        label: 'Supported housing or care home request',
        hint: 'Why is the current accommodation no longer suitable? Include required support hours.',
        error: 'Enter why the current accommodation is no longer suitable'
      }
    ]
  },
  {
    reason: 'Carer support or assessment',
    slug: 'carer-support-or-assessment',
    title: 'Carer support or assessment',
    fields: [
      { type: 'text', name: 'carerName', label: 'Carer’s name', error: 'Enter the carer’s name' },
      { type: 'text', name: 'carerRelationship', label: 'Carer’s relationship to the person', error: 'Enter the carer’s relationship to the person' },
      {
        type: 'textarea',
        name: 'carerImpactDetails',
        label: 'What is the current impact of the caring role?',
        error: 'Enter the current impact of the caring role'
      }
    ]
  },
  {
    reason: 'Review of existing package of care',
    slug: 'review-of-existing-package-of-care',
    title: 'Review of existing package of care',
    fields: [
      {
        type: 'textarea',
        name: 'packageReviewDetails',
        label: 'Review of existing package of care',
        hint: 'What has changed since the last assessment that necessitates a review?',
        error: 'Enter what has changed since the last assessment'
      }
    ]
  },
  {
    reason: 'Voluntary sector or signposting (such as befriending, advocacy)',
    slug: 'voluntary-sector-or-signposting',
    title: 'Voluntary sector or signposting (such as befriending, advocacy)',
    fields: [
      {
        type: 'textarea',
        name: 'voluntarySectorDetails',
        label: 'Voluntary sector or signposting (such as befriending, advocacy)',
        hint: 'What specific community links are required?',
        error: 'Enter what specific community links are required'
      }
    ]
  }
]

const referralReasonFollowUpBySlug = Object.fromEntries(
  referralReasonFollowUpPages.map((page) => [page.slug, page])
)

function getSelectedReferralReasonFollowUps(data = {}) {
  const selectedReasons = asArray(data.referralReasons)

  return referralReasonFollowUpPages.filter((page) => selectedReasons.includes(page.reason))
}

function getReferralReasonFollowUpHref(page) {
  return `${mentalHealthBasePath}/referral-reason/${page.slug}`
}

function getReferralReasonFollowUpBackHref(page, data) {
  const selectedPages = getSelectedReferralReasonFollowUps(data)
  const pageIndex = selectedPages.findIndex((selectedPage) => selectedPage.slug === page.slug)

  if (pageIndex <= 0) {
    return `${mentalHealthBasePath}/reason-for-referral`
  }

  return getReferralReasonFollowUpHref(selectedPages[pageIndex - 1])
}

function getReferralReasonFollowUpNextHref(page, data) {
  const selectedPages = getSelectedReferralReasonFollowUps(data)
  const pageIndex = selectedPages.findIndex((selectedPage) => selectedPage.slug === page.slug)
  const nextPage = selectedPages[pageIndex + 1]

  return nextPage ? getReferralReasonFollowUpHref(nextPage) : `${mentalHealthBasePath}/current-situation`
}

function getReferralReasonFollowUpPageNumber(page, data) {
  const selectedPages = getSelectedReferralReasonFollowUps(data)
  const pageIndex = selectedPages.findIndex((selectedPage) => selectedPage.slug === page.slug)

  return `${getMentalHealthPageNumber('reason-for-referral')}.${pageIndex + 1}`
}

function clearUnselectedReferralReasonFollowUps(data) {
  const selectedReasons = asArray(data.referralReasons)

  referralReasonFollowUpPages
    .filter((page) => !selectedReasons.includes(page.reason))
    .forEach((page) => {
      page.fields.forEach((field) => {
        data[field.name] = field.type === 'checkboxGroup' ? [] : ''
      })
    })
}

function getReferralReasonFollowUpSummaryValues(page, data) {
  return page.fields.map((field) => {
    const value = data[field.name]

    if (Array.isArray(value)) {
      return value.join(', ')
    }

    if (!value) {
      return ''
    }

    return page.fields.length === 1 ? value : `${field.label}: ${value}`
  })
}

function getClinicalProfessionalFieldNames(index) {
  return [
    `clinicalProfessional${index}FirstName`,
    `clinicalProfessional${index}LastName`,
    `clinicalProfessional${index}JobTitle`,
    `clinicalProfessional${index}Organisation`
  ]
}

function getClinicalProfessionalCount(data = {}) {
  const count = Number.parseInt(data.clinicalProfessionalCount, 10)

  if (!count || count < 1) {
    return 1
  }

  return Math.min(count, 3)
}

function clearClinicalProfessionalAnswers(data, startIndex = 1) {
  data.clinicalProfessionalsDetails = ''

  for (let index = startIndex; index <= 3; index += 1) {
    getClinicalProfessionalFieldNames(index).forEach((fieldName) => {
      data[fieldName] = ''
    })
  }

  if (startIndex <= 1) {
    data.clinicalProfessionalCount = 1
  }
}

function getClinicalProfessionalSummary(index, data) {
  return [
    `${data[`clinicalProfessional${index}FirstName`] || ''} ${data[`clinicalProfessional${index}LastName`] || ''}`.trim(),
    data[`clinicalProfessional${index}JobTitle`],
    data[`clinicalProfessional${index}Organisation`]
  ].filter(Boolean)
}

function hasClinicalProfessionalSummary(index, data) {
  return getClinicalProfessionalSummary(index, data).length > 0
}

function getClinicalProfessionalCompletedCount(data = {}) {
  let count = 1

  for (let index = 2; index <= 3; index += 1) {
    if (hasClinicalProfessionalSummary(index, data)) {
      count = index
    }
  }

  return count
}

function getMentalHealthBackHref(page, data = {}) {
  if (!page.index) {
    return `${mentalHealthBasePath}/start`
  }

  if (page.slug === 'advocate' && data.hasNextOfKinDetails === 'No') {
    return `${mentalHealthBasePath}/next-of-kin`
  }

  if (page.slug === 'identifiers' && data.hasAdvocate === 'No') {
    return `${mentalHealthBasePath}/advocate`
  }

  if (page.slug === 'identifiers' && data.hasAdvocate === 'Yes') {
    return `${mentalHealthBasePath}/advocate-details`
  }

  if (page.slug === 'communication-needs' && data.personConsentsReferral === 'Yes') {
    return `${mentalHealthBasePath}/referral-awareness`
  }

  if (page.slug === 'children') {
    if (data.clinicalProfessionalsInvolved !== 'Yes') {
      return `${mentalHealthBasePath}/clinical-professionals`
    }

    return `${mentalHealthBasePath}/clinical-professional-details`
  }

  if (page.slug === 'violence-or-aggression' && data.livesWithChildren === 'No') {
    return `${mentalHealthBasePath}/children`
  }

  if (page.slug === 'current-situation') {
    const selectedFollowUpPages = getSelectedReferralReasonFollowUps(data)
    const lastFollowUpPage = selectedFollowUpPages[selectedFollowUpPages.length - 1]

    if (lastFollowUpPage) {
      return getReferralReasonFollowUpHref(lastFollowUpPage)
    }
  }

  return `${mentalHealthBasePath}/${mentalHealthPages[page.index - 1].slug}`
}

function getMentalHealthNextHref(page, data = {}) {
  if (page.slug === 'next-of-kin') {
    return data.hasNextOfKinDetails === 'No'
      ? `${mentalHealthBasePath}/advocate`
      : `${mentalHealthBasePath}/next-of-kin-contact`
  }

  if (page.slug === 'advocate' && data.hasAdvocate === 'No') {
    return `${mentalHealthBasePath}/identifiers`
  }

  if (page.slug === 'advocate-details') {
    return `${mentalHealthBasePath}/identifiers`
  }

  if (page.slug === 'referral-awareness') {
    return data.personConsentsReferral === 'No'
      ? `${mentalHealthBasePath}/consent-not-given`
      : `${mentalHealthBasePath}/communication-needs`
  }

  if (page.slug === 'clinical-professionals') {
    return data.clinicalProfessionalsInvolved === 'Yes'
      ? `${mentalHealthBasePath}/clinical-professional-details`
      : `${mentalHealthBasePath}/children`
  }

  if (page.slug === 'clinical-professional-details') {
    return `${mentalHealthBasePath}/children`
  }

  if (page.slug === 'children') {
    return data.livesWithChildren === 'Yes'
      ? `${mentalHealthBasePath}/children-details`
      : `${mentalHealthBasePath}/violence-or-aggression`
  }

  if (page.slug === 'children-details') {
    return `${mentalHealthBasePath}/violence-or-aggression`
  }

  if (page.slug === 'reason-for-referral') {
    const [firstFollowUpPage] = getSelectedReferralReasonFollowUps(data)

    if (firstFollowUpPage) {
      return getReferralReasonFollowUpHref(firstFollowUpPage)
    }
  }

  const nextPage = mentalHealthPages[page.index + 1]

  return nextPage ? `${mentalHealthBasePath}/${nextPage.slug}` : `${mentalHealthBasePath}/check-answers`
}

function normaliseMentalHealthField(field, body, values) {
  if (field.type === 'fieldset') {
    field.fields.forEach((nestedField) => {
      normaliseMentalHealthField(nestedField, body, values)
    })
    return
  }

  if (field.type === 'contactDetails') {
    values[field.name] = asArray(body[field.name])
    values[field.emailName] = normaliseText(body[field.emailName])
    values[field.phoneName] = normaliseText(body[field.phoneName])
    return
  }

  if (field.type === 'checkboxGroup') {
    values[field.name] = asArray(body[field.name])

    if (field.conditional) {
      field.conditional.fields.forEach((conditionalField) => {
        normaliseMentalHealthField(conditionalField, body, values)
      })
    }

    return
  }

  if (field.type === 'date') {
    values[`${field.name}Day`] = normaliseText(body[`${field.name}Day`])
    values[`${field.name}Month`] = normaliseText(body[`${field.name}Month`])
    values[`${field.name}Year`] = normaliseText(body[`${field.name}Year`])
    return
  }

  if (field.type === 'address') {
    values.personAddressLine1 = normaliseText(body.personAddressLine1)
    values.personAddressLine2 = normaliseText(body.personAddressLine2)
    values.personTownOrCity = normaliseText(body.personTownOrCity)
    values.personPostcode = normaliseText(body.personPostcode).toUpperCase()
    values.personCurrentSituation = normaliseText(body.personCurrentSituation)
    values.personNoAddress = values.personCurrentSituation ? 'yes' : ''
    return
  }

  values[field.name] = normaliseText(body[field.name])

  if (field.conditional) {
    field.conditional.fields.forEach((conditionalField) => {
      normaliseMentalHealthField(conditionalField, body, values)
    })
  }
}

function normaliseMentalHealthBody(page, body) {
  const values = {}

  page.fields.forEach((field) => {
    normaliseMentalHealthField(field, body, values)
  })

  if (page.repeatableFieldsets) {
    values[page.repeatableFieldsets.countName] = getClinicalProfessionalCount(body)
  }

  return values
}

function validateMentalHealthField(field, values, errors) {
  if (field.type === 'fieldset') {
    if (field.repeatIndex && field.repeatIndex > getClinicalProfessionalCount(values)) {
      return
    }

    const hasAnyAnswer = field.fields.some((nestedField) => nestedField.name && values[nestedField.name])

    if (!field.optional || hasAnyAnswer) {
      field.fields.forEach((nestedField) => {
        validateMentalHealthField(nestedField, values, errors)
      })
    }

    return
  }

  if (field.type === 'contactDetails') {
    if (!values[field.name] || !values[field.name].length) {
      errors[field.name] = field.error
    }

    if (values[field.name] && values[field.name].includes('Email') && !values[field.emailName]) {
      errors[field.emailName] = 'Enter an email address'
    }

    if (values[field.name] && values[field.name].includes('Phone') && !values[field.phoneName]) {
      errors[field.phoneName] = 'Enter a phone number'
    }

    return
  }

  if (field.type === 'checkboxGroup') {
    if (!values[field.name] || !values[field.name].length) {
      errors[field.name] = field.error
    } else if (field.exclusive && values[field.name].includes(field.exclusive) && values[field.name].length > 1) {
      errors[field.name] = field.exclusiveError
    } else if (field.conditional && values[field.name].includes(field.conditional.value)) {
      field.conditional.fields.forEach((conditionalField) => {
        validateMentalHealthField(conditionalField, values, errors)
      })
    }

    return
  }

  if (field.type === 'date') {
    if (!values[`${field.name}Day`] || !values[`${field.name}Month`] || !values[`${field.name}Year`]) {
      errors[`${field.name}Day`] = field.error
    }

    return
  }

  if (field.type === 'address') {
    if (!values.personCurrentSituation) {
      if (!values.personAddressLine1) {
        errors.personAddressLine1 = 'Enter the first line of their address'
      }

      if (!values.personPostcode) {
        errors.personPostcode = 'Enter their postcode'
      }
    } else if (values.personCurrentSituation.length > 500) {
      errors.personCurrentSituation = 'Current situation must be 500 characters or fewer'
    }

    return
  }

  if (!values[field.name]) {
    errors[field.name] = field.error
  }

  if (field.conditional && values[field.name] === field.conditional.value) {
    field.conditional.fields.forEach((conditionalField) => {
      validateMentalHealthField(conditionalField, values, errors)
    })
  }
}

function validateMentalHealthPage(page, values) {
  const errors = {}

  page.fields.forEach((field) => {
    validateMentalHealthField(field, values, errors)
  })

  return errors
}

function storeMentalHealthField(field, values, sessionData) {
  if (field.type === 'fieldset') {
    if (field.repeatIndex && field.repeatIndex > getClinicalProfessionalCount(values)) {
      return
    }

    field.fields.forEach((nestedField) => {
      storeMentalHealthField(nestedField, values, sessionData)
    })
    return
  }

  if (field.type === 'contactDetails') {
    sessionData[field.name] = values[field.name] || []
    sessionData[field.emailName] = values[field.name].includes('Email') ? values[field.emailName] : ''
    sessionData[field.phoneName] = values[field.name].includes('Phone') ? values[field.phoneName] : ''
    return
  }

  if (field.type === 'checkboxGroup') {
    sessionData[field.name] = values[field.name] || []

    if (field.conditional) {
      field.conditional.fields.forEach((conditionalField) => {
        if (sessionData[field.name].includes(field.conditional.value)) {
          storeMentalHealthField(conditionalField, values, sessionData)
        } else if (conditionalField.type === 'contactDetails') {
          sessionData[conditionalField.name] = []
          sessionData[conditionalField.emailName] = ''
          sessionData[conditionalField.phoneName] = ''
        } else if (conditionalField.type === 'checkboxGroup') {
          sessionData[conditionalField.name] = []
        } else {
          sessionData[conditionalField.name] = ''
        }
      })
    }

    return
  }

  if (field.type === 'date') {
    sessionData[`${field.name}Day`] = values[`${field.name}Day`]
    sessionData[`${field.name}Month`] = values[`${field.name}Month`]
    sessionData[`${field.name}Year`] = values[`${field.name}Year`]
    return
  }

  if (field.type === 'address') {
    Object.assign(sessionData, {
      personAddressLine1: values.personAddressLine1,
      personAddressLine2: values.personAddressLine2,
      personTownOrCity: values.personTownOrCity,
      personPostcode: values.personPostcode,
      personNoAddress: values.personNoAddress,
      personCurrentSituation: values.personCurrentSituation
    })
    return
  }

  sessionData[field.name] = values[field.name]

  if (field.conditional) {
    field.conditional.fields.forEach((conditionalField) => {
      if (values[field.name] === field.conditional.value) {
        storeMentalHealthField(conditionalField, values, sessionData)
      } else if (conditionalField.type === 'contactDetails') {
        sessionData[conditionalField.name] = []
        sessionData[conditionalField.emailName] = ''
        sessionData[conditionalField.phoneName] = ''
      } else if (conditionalField.type === 'checkboxGroup') {
        sessionData[conditionalField.name] = []
      } else {
        sessionData[conditionalField.name] = ''
      }
    })
  }
}

function storeMentalHealthPageAnswers(page, values, sessionData) {
  page.fields.forEach((field) => {
    storeMentalHealthField(field, values, sessionData)
  })

  if (page.repeatableFieldsets) {
    sessionData[page.repeatableFieldsets.countName] = getClinicalProfessionalCount(values)
  }
}

function addMentalHealthSummaryRow(rows, key, value, href) {
  const values = Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean)

  rows.push({
    key,
    values: values.length ? values : ['Not provided'],
    href
  })
}

function addMentalHealthSummarySection(sections, title) {
  const section = {
    title,
    rows: []
  }

  sections.push(section)

  return section.rows
}

function getMentalHealthSummarySections(data) {
  const sections = []
  const yourDetailsRows = addMentalHealthSummarySection(sections, 'Your details')
  const personRows = addMentalHealthSummarySection(sections, 'About the person you’re referring')
  const needsRows = addMentalHealthSummarySection(sections, 'Health, communication and care needs')
  const safetyRows = addMentalHealthSummarySection(sections, 'Safety and risks')
  const reasonRows = addMentalHealthSummarySection(sections, 'Reason for referral')

  addMentalHealthSummaryRow(yourDetailsRows, 'Your name', `${data.referrerFirstName || ''} ${data.referrerLastName || ''}`.trim(), `${mentalHealthBasePath}/your-details`)
  addMentalHealthSummaryRow(yourDetailsRows, 'Job title', data.referrerJobTitle, `${mentalHealthBasePath}/your-details`)
  addMentalHealthSummaryRow(yourDetailsRows, 'Organisation or team', data.referrerOrganisation, `${mentalHealthBasePath}/your-details`)
  addMentalHealthSummaryRow(yourDetailsRows, 'Your contact details', [data.referrerEmail, data.referrerPhone], `${mentalHealthBasePath}/your-contact-details`)
  addMentalHealthSummaryRow(yourDetailsRows, 'Your relationship to them', data.relationshipToPerson, `${mentalHealthBasePath}/relationship`)
  addMentalHealthSummaryRow(personRows, 'Person being referred', `${data.personFirstName || ''} ${data.personLastName || ''}`.trim(), `${mentalHealthBasePath}/person-details`)
  addMentalHealthSummaryRow(personRows, 'Date of birth', `${data.personDateOfBirthDay || ''} ${data.personDateOfBirthMonth || ''} ${data.personDateOfBirthYear || ''}`.trim(), `${mentalHealthBasePath}/person-details`)

  if (data.personCurrentSituation && !data.personAddressLine1 && !data.personPostcode) {
    addMentalHealthSummaryRow(personRows, 'Home address', ['They do not have a permanent address', data.personCurrentSituation], `${mentalHealthBasePath}/home-address`)
  } else {
    addMentalHealthSummaryRow(personRows, 'Home address', [data.personAddressLine1, data.personAddressLine2, data.personTownOrCity, data.personPostcode], `${mentalHealthBasePath}/home-address`)

    if (data.personCurrentSituation) {
      addMentalHealthSummaryRow(personRows, 'No permanent address details', data.personCurrentSituation, `${mentalHealthBasePath}/home-address`)
    }
  }

  addMentalHealthSummaryRow(personRows, 'Accommodation type', data.accommodationType, `${mentalHealthBasePath}/accommodation`)
  addMentalHealthSummaryRow(personRows, 'How they would like to be contacted', [
    ...(data.personContactMethods || []),
    data.personContactEmail && `Email: ${data.personContactEmail}`,
    data.personContactPhone && `Phone: ${data.personContactPhone}`
  ], `${mentalHealthBasePath}/contact-person`)
  addMentalHealthSummaryRow(personRows, 'Preferred contact methods', data.preferredContactMethods, `${mentalHealthBasePath}/preferred-contact`)
  addMentalHealthSummaryRow(personRows, 'Next of kin details known', data.hasNextOfKinDetails, `${mentalHealthBasePath}/next-of-kin`)

  if (data.hasNextOfKinDetails === 'Yes') {
    addMentalHealthSummaryRow(personRows, 'Next of kin', `${data.nextOfKinFirstName || ''} ${data.nextOfKinLastName || ''}`.trim(), `${mentalHealthBasePath}/next-of-kin-contact`)
    addMentalHealthSummaryRow(personRows, 'Next of kin contact methods', [
      ...(data.nextOfKinContactMethods || []),
      data.nextOfKinContactEmail && `Email: ${data.nextOfKinContactEmail}`,
      data.nextOfKinContactPhone && `Phone: ${data.nextOfKinContactPhone}`
    ], `${mentalHealthBasePath}/next-of-kin-contact`)
    addMentalHealthSummaryRow(personRows, 'Next of kin relationship', data.nextOfKinRelationship, `${mentalHealthBasePath}/next-of-kin-contact`)
  }

  addMentalHealthSummaryRow(personRows, 'Has an advocate', data.hasAdvocate, `${mentalHealthBasePath}/advocate`)

  if (data.hasAdvocate === 'Yes') {
    addMentalHealthSummaryRow(personRows, 'Advocate details', `${data.advocateFirstName || ''} ${data.advocateLastName || ''}`.trim(), `${mentalHealthBasePath}/advocate-details`)
    addMentalHealthSummaryRow(personRows, 'Advocate contact methods', [
      ...(data.advocateContactMethods || []),
      data.advocateContactEmail && `Email: ${data.advocateContactEmail}`,
      data.advocateContactPhone && `Phone: ${data.advocateContactPhone}`
    ], `${mentalHealthBasePath}/advocate-details`)
  }

  addMentalHealthSummaryRow(personRows, 'NHS number known', data.knowsNhsNumber, `${mentalHealthBasePath}/identifiers`)

  if (data.knowsNhsNumber === 'Yes') {
    addMentalHealthSummaryRow(personRows, 'NHS number', data.nhsNumber, `${mentalHealthBasePath}/identifiers`)
  }

  addMentalHealthSummaryRow(personRows, 'They consent to the referral', data.personConsentsReferral, `${mentalHealthBasePath}/referral-awareness`)

  if (data.personConsentsReferral === 'No') {
    addMentalHealthSummaryRow(personRows, 'Why consent was not given', data.consentNotGivenReason, `${mentalHealthBasePath}/consent-not-given`)

    if (data.consentNotGivenReason === 'Other') {
      addMentalHealthSummaryRow(personRows, 'Consent details', data.consentNotGivenOtherDetails, `${mentalHealthBasePath}/consent-not-given`)
    }
  }

  addMentalHealthSummaryRow(needsRows, 'Communication needs', data.hasCommunicationNeeds, `${mentalHealthBasePath}/communication-needs`)

  if (data.hasCommunicationNeeds === 'Yes') {
    addMentalHealthSummaryRow(needsRows, 'Communication needs details', data.communicationNeedsDetails, `${mentalHealthBasePath}/communication-needs`)
  }

  addMentalHealthSummaryRow(needsRows, 'Reasonable adjustments', data.needsReasonableAdjustments, `${mentalHealthBasePath}/communication-needs`)

  if (data.needsReasonableAdjustments === 'Yes') {
    addMentalHealthSummaryRow(needsRows, 'Reasonable adjustments details', data.reasonableAdjustmentsDetails, `${mentalHealthBasePath}/communication-needs`)
  }

  addMentalHealthSummaryRow(needsRows, 'Confirmed diagnosis', data.hasConfirmedDiagnosis, `${mentalHealthBasePath}/mental-health-conditions`)

  if (data.hasConfirmedDiagnosis === 'Yes') {
    addMentalHealthSummaryRow(needsRows, 'Confirmed diagnosis details', data.confirmedDiagnosisDetails, `${mentalHealthBasePath}/mental-health-conditions`)
  }

  addMentalHealthSummaryRow(needsRows, 'Suspected mental health conditions', data.hasSuspectedConditions, `${mentalHealthBasePath}/mental-health-conditions`)

  if (data.hasSuspectedConditions === 'Yes') {
    addMentalHealthSummaryRow(needsRows, 'Suspected condition details', data.suspectedConditionsDetails, `${mentalHealthBasePath}/mental-health-conditions`)
  }

  addMentalHealthSummaryRow(needsRows, 'Clinical professionals involved', data.clinicalProfessionalsInvolved, `${mentalHealthBasePath}/clinical-professionals`)

  if (data.clinicalProfessionalsInvolved === 'Yes') {
    addMentalHealthSummaryRow(needsRows, 'Clinical professional', getClinicalProfessionalSummary(1, data), `${mentalHealthBasePath}/clinical-professional-details`)

    if (hasClinicalProfessionalSummary(2, data)) {
      addMentalHealthSummaryRow(needsRows, 'Clinical professional', getClinicalProfessionalSummary(2, data), `${mentalHealthBasePath}/clinical-professional-details`)
    }

    if (hasClinicalProfessionalSummary(3, data)) {
      addMentalHealthSummaryRow(needsRows, 'Clinical professional', getClinicalProfessionalSummary(3, data), `${mentalHealthBasePath}/clinical-professional-details`)
    }
  }

  addMentalHealthSummaryRow(safetyRows, 'Lives with children', data.livesWithChildren, `${mentalHealthBasePath}/children`)

  if (data.livesWithChildren === 'Yes') {
    addMentalHealthSummaryRow(safetyRows, 'Number of children', data.childrenCount, `${mentalHealthBasePath}/children-details`)
    addMentalHealthSummaryRow(safetyRows, 'Age range of children', data.childrenAgeRange, `${mentalHealthBasePath}/children-details`)
  }

  addMentalHealthSummaryRow(safetyRows, 'History of violence or aggression', data.historyOfViolenceOrAggression, `${mentalHealthBasePath}/violence-or-aggression`)
  addMentalHealthSummaryRow(safetyRows, 'Current risks', data.currentRisks, `${mentalHealthBasePath}/current-risks`)

  if (data.currentRisks && data.currentRisks.includes('Other')) {
    addMentalHealthSummaryRow(safetyRows, 'Other current risks', data.currentRisksOtherDetails, `${mentalHealthBasePath}/current-risks`)
  }

  addMentalHealthSummaryRow(safetyRows, 'Environmental risks', data.hasEnvironmentalRisks, `${mentalHealthBasePath}/environmental-risks`)

  if (data.hasEnvironmentalRisks === 'Yes') {
    addMentalHealthSummaryRow(safetyRows, 'Environmental risk details', data.environmentalRisksDetails, `${mentalHealthBasePath}/environmental-risks`)
  }

  addMentalHealthSummaryRow(reasonRows, 'Reason for referral', data.referralReasons, `${mentalHealthBasePath}/reason-for-referral`)

  getSelectedReferralReasonFollowUps(data).forEach((page) => {
    addMentalHealthSummaryRow(reasonRows, page.title, getReferralReasonFollowUpSummaryValues(page, data), getReferralReasonFollowUpHref(page))
  })

  addMentalHealthSummaryRow(reasonRows, 'Current situation summary', data.currentSituationSummary, `${mentalHealthBasePath}/current-situation`)
  addMentalHealthSummaryRow(reasonRows, 'Actions requested', data.requestedActions, `${mentalHealthBasePath}/current-situation`)

  return sections
}

router.get('/', (req, res) => {
  res.render('index')
})

router.get('/mental-health-referral', (req, res) => {
  res.redirect(`${mentalHealthBasePath}/start`)
})

router.get('/mental-health-referral/start', (req, res) => {
  res.render('mental-health-referral/start')
})

router.get('/mental-health-referral/check-answers', (req, res) => {
  res.render('mental-health-referral/check-answers', {
    sections: getMentalHealthSummarySections(req.session.data)
  })
})

router.post('/mental-health-referral/check-answers', (req, res) => {
  res.redirect(`${mentalHealthBasePath}/declaration`)
})

router.get('/mental-health-referral/declaration', (req, res) => {
  res.render('mental-health-referral/declaration')
})

router.post('/mental-health-referral/declaration', (req, res) => {
  req.session.data.mentalHealthReferenceNumber = generateMentalHealthReferenceNumber()

  res.redirect(`${mentalHealthBasePath}/confirmation`)
})

router.get('/mental-health-referral/confirmation', (req, res) => {
  req.session.data.mentalHealthReferenceNumber = req.session.data.mentalHealthReferenceNumber || generateMentalHealthReferenceNumber()

  res.render('mental-health-referral/confirmation')
})

router.get('/mental-health-referral/referral-reason/:reasonSlug', (req, res, next) => {
  const page = referralReasonFollowUpBySlug[req.params.reasonSlug]
  const selectedPages = getSelectedReferralReasonFollowUps(req.session.data)

  if (!page) {
    return next()
  }

  if (!selectedPages.some((selectedPage) => selectedPage.slug === page.slug)) {
    return res.redirect(`${mentalHealthBasePath}/reason-for-referral`)
  }

  res.render('mental-health-referral/question', {
    page,
    action: getReferralReasonFollowUpHref(page),
    pageNumber: getReferralReasonFollowUpPageNumber(page, req.session.data),
    totalPages: mentalHealthTotalPages,
    sectionTitle: getMentalHealthSectionTitle(getMentalHealthPageNumber('reason-for-referral')),
    backHref: getReferralReasonFollowUpBackHref(page, req.session.data),
    nextHref: getReferralReasonFollowUpNextHref(page, req.session.data)
  })
})

router.post('/mental-health-referral/referral-reason/:reasonSlug', (req, res, next) => {
  const page = referralReasonFollowUpBySlug[req.params.reasonSlug]
  const selectedPages = getSelectedReferralReasonFollowUps(req.session.data)

  if (!page) {
    return next()
  }

  if (!selectedPages.some((selectedPage) => selectedPage.slug === page.slug)) {
    return res.redirect(`${mentalHealthBasePath}/reason-for-referral`)
  }

  const values = normaliseMentalHealthBody(page, req.body)
  const errors = validateMentalHealthPage(page, values)

  if (Object.keys(errors).length) {
    return res.status(422).render('mental-health-referral/question', {
      page,
      action: getReferralReasonFollowUpHref(page),
      pageNumber: getReferralReasonFollowUpPageNumber(page, req.session.data),
      totalPages: mentalHealthTotalPages,
      sectionTitle: getMentalHealthSectionTitle(getMentalHealthPageNumber('reason-for-referral')),
      backHref: getReferralReasonFollowUpBackHref(page, req.session.data),
      nextHref: getReferralReasonFollowUpNextHref(page, req.session.data),
      errors,
      errorList: errorListFrom(errors),
      formData: {
        ...req.session.data,
        ...values
      }
    })
  }

  storeMentalHealthPageAnswers(page, values, req.session.data)

  res.redirect(getReferralReasonFollowUpNextHref(page, req.session.data))
})

router.all('/mental-health-referral/advocate-contact', (req, res) => {
  res.redirect(`${mentalHealthBasePath}/advocate-details`)
})

router.get('/mental-health-referral/:slug', (req, res, next) => {
  const page = mentalHealthPageBySlug[req.params.slug]

  if (!page) {
    return next()
  }

  if (page.slug === 'next-of-kin-contact' && req.session.data.hasNextOfKinDetails !== 'Yes') {
    return res.redirect(`${mentalHealthBasePath}/next-of-kin`)
  }

  if (page.slug === 'consent-not-given' && req.session.data.personConsentsReferral !== 'No') {
    return res.redirect(`${mentalHealthBasePath}/referral-awareness`)
  }

  if (page.slug === 'clinical-professional-details' && req.session.data.clinicalProfessionalsInvolved !== 'Yes') {
    return res.redirect(`${mentalHealthBasePath}/clinical-professionals`)
  }

  if (page.slug === 'children-details' && req.session.data.livesWithChildren !== 'Yes') {
    return res.redirect(`${mentalHealthBasePath}/children`)
  }

  if (page.slug === 'clinical-professional-details') {
    req.session.data.clinicalProfessionalCount = Math.max(
      getClinicalProfessionalCount(req.session.data),
      getClinicalProfessionalCompletedCount(req.session.data)
    )
  }

  res.render('mental-health-referral/question', {
    page,
    totalPages: mentalHealthTotalPages,
    backHref: getMentalHealthBackHref(page, req.session.data),
    nextHref: getMentalHealthNextHref(page, req.session.data)
  })
})

router.post('/mental-health-referral/:slug', (req, res, next) => {
  const page = mentalHealthPageBySlug[req.params.slug]

  if (!page) {
    return next()
  }

  if (page.slug === 'children-details' && req.session.data.livesWithChildren !== 'Yes') {
    return res.redirect(`${mentalHealthBasePath}/children`)
  }

  const values = normaliseMentalHealthBody(page, req.body)

  if (page.slug === 'clinical-professional-details' && req.body.clinicalProfessionalAction === 'add') {
    storeMentalHealthPageAnswers(page, values, req.session.data)
    req.session.data.clinicalProfessionalCount = Math.min(getClinicalProfessionalCount(values) + 1, 3)
    clearClinicalProfessionalAnswers(req.session.data, req.session.data.clinicalProfessionalCount + 1)

    return res.redirect(`${mentalHealthBasePath}/clinical-professional-details`)
  }

  const errors = validateMentalHealthPage(page, values)

  if (Object.keys(errors).length) {
    return res.status(422).render('mental-health-referral/question', {
      page,
      totalPages: mentalHealthTotalPages,
      backHref: getMentalHealthBackHref(page, req.session.data),
      nextHref: getMentalHealthNextHref(page, {
        ...req.session.data,
        ...values
      }),
      errors,
      errorList: errorListFrom(errors),
      formData: {
        ...req.session.data,
        ...values
      }
    })
  }

  storeMentalHealthPageAnswers(page, values, req.session.data)

  if (page.slug === 'reason-for-referral') {
    clearUnselectedReferralReasonFollowUps(req.session.data)
  }

  if (page.slug === 'next-of-kin' && req.session.data.hasNextOfKinDetails === 'No') {
    Object.assign(req.session.data, {
      nextOfKinFirstName: '',
      nextOfKinLastName: '',
      nextOfKinContactMethods: [],
      nextOfKinContactEmail: '',
      nextOfKinContactPhone: '',
      nextOfKinRelationship: ''
    })
  }

  if (page.slug === 'referral-awareness' && req.session.data.personConsentsReferral === 'Yes') {
    req.session.data.consentNotGivenReason = ''
    req.session.data.consentNotGivenOtherDetails = ''
  }

  if (page.slug === 'consent-not-given' && req.session.data.consentNotGivenReason !== 'Other') {
    req.session.data.consentNotGivenOtherDetails = ''
  }

  if (page.slug === 'clinical-professionals' && req.session.data.clinicalProfessionalsInvolved === 'No') {
    clearClinicalProfessionalAnswers(req.session.data)
  }

  if (page.slug === 'clinical-professional-details') {
    req.session.data.clinicalProfessionalCount = getClinicalProfessionalCompletedCount(req.session.data)
    clearClinicalProfessionalAnswers(req.session.data, req.session.data.clinicalProfessionalCount + 1)
  }

  if (page.slug === 'children' && req.session.data.livesWithChildren === 'No') {
    req.session.data.childrenCount = ''
    req.session.data.childrenAgeRange = ''
    req.session.data.childrenDetails = ''
  }

  if (page.slug === 'children') {
    req.session.data.livesWithPets = ''
    req.session.data.petsDetails = ''
  }

  if (page.slug === 'advocate' && req.session.data.hasAdvocate === 'No') {
    Object.assign(req.session.data, {
      advocateFirstName: '',
      advocateLastName: '',
      advocateContactMethods: [],
      advocateContactEmail: '',
      advocateContactPhone: ''
    })
  }

  res.redirect(getMentalHealthNextHref(page, req.session.data))
})

router.get('/goose-sighting', (req, res) => {
  res.redirect('/goose-sighting/start')
})

router.get('/goose-sighting/start', (req, res) => {
  res.render('goose-sighting/start')
})

router.get('/goose-sighting/like-geese', (req, res) => {
  res.render('goose-sighting/like-geese')
})

router.post('/goose-sighting/like-geese', (req, res) => {
  const likesGeeseAnswers = Array.isArray(req.body.likesGeese)
    ? req.body.likesGeese
    : req.body.likesGeese ? [req.body.likesGeese] : []
  const errors = {}

  if (!likesGeeseAnswers.length) {
    errors.likesGeese = 'Select whether you like geese'
  } else if (likesGeeseAnswers.length > 1) {
    errors.likesGeese = 'Select only one answer'
  }

  if (Object.keys(errors).length) {
    return res.status(422).render('goose-sighting/like-geese', {
      errors,
      errorList: errorListFrom(errors),
      selectedLikesGeese: likesGeeseAnswers
    })
  }

  const [likesGeese] = likesGeeseAnswers

  req.session.data.likesGeese = likesGeese

  if (likesGeese === 'no') {
    return res.redirect('/goose-sighting/not-for-you')
  }

  res.redirect('/goose-sighting/type')
})

router.get('/goose-sighting/not-for-you', (req, res) => {
  res.render('goose-sighting/not-for-you')
})

router.get('/goose-sighting/type', (req, res) => {
  res.render('goose-sighting/type')
})

router.post('/goose-sighting/type', (req, res) => {
  const gooseType = req.body.gooseType && req.body.gooseType.trim()
  const errors = {}

  if (!gooseType) {
    errors.gooseType = 'Enter the type of goose you saw'
  }

  if (Object.keys(errors).length) {
    return res.status(422).render('goose-sighting/type', {
      errors,
      errorList: errorListFrom(errors)
    })
  }

  req.session.data.gooseType = gooseType

  res.redirect('/goose-sighting/date')
})

router.get('/goose-sighting/date', (req, res) => {
  res.render('goose-sighting/date')
})

router.post('/goose-sighting/date', (req, res) => {
  const gooseSeenDay = req.body.gooseSeenDay && req.body.gooseSeenDay.trim()
  const gooseSeenMonth = req.body.gooseSeenMonth && req.body.gooseSeenMonth.trim()
  const gooseSeenYear = req.body.gooseSeenYear && req.body.gooseSeenYear.trim()
  const errors = {}

  if (!gooseSeenDay || !gooseSeenMonth || !gooseSeenYear) {
    errors.gooseSeen = 'Enter the date you saw the goose'
  }

  if (Object.keys(errors).length) {
    return res.status(422).render('goose-sighting/date', {
      errors,
      errorList: [{ href: '#gooseSeenDay', text: errors.gooseSeen }]
    })
  }

  Object.assign(req.session.data, {
    gooseSeenDay,
    gooseSeenMonth,
    gooseSeenYear
  })

  res.redirect('/goose-sighting/check-answers')
})

router.get('/goose-sighting/check-answers', (req, res) => {
  res.render('goose-sighting/check-answers')
})

router.post('/goose-sighting/check-answers', (req, res) => {
  req.session.data.gooseReferenceNumber = generateGooseReferenceNumber()

  res.redirect('/goose-sighting/confirmation')
})

router.get('/goose-sighting/confirmation', (req, res) => {
  req.session.data.gooseReferenceNumber = req.session.data.gooseReferenceNumber || generateGooseReferenceNumber()

  res.render('goose-sighting/confirmation')
})

router.get('/permit/start', (req, res) => {
  res.render('permit/start')
})

router.get('/permit/address', (req, res) => {
  res.render('permit/address')
})

router.post('/permit/address', (req, res) => {
  const { addressLine1, postcode } = req.body
  const errors = {}

  if (!addressLine1 || !addressLine1.trim()) {
    errors.addressLine1 = 'Enter the first line of your address'
  }

  if (!postcode || !postcode.trim()) {
    errors.postcode = 'Enter your postcode'
  }

  if (Object.keys(errors).length) {
    return res.status(422).render('permit/address', {
      errors,
      errorList: Object.entries(errors).map(([field, text]) => ({
        href: `#${field}`,
        text
      }))
    })
  }

  req.session.data.addressLine1 = addressLine1.trim()
  req.session.data.addressLine2 = req.body.addressLine2 && req.body.addressLine2.trim()
  req.session.data.postcode = postcode.trim().toUpperCase()

  res.redirect('/permit/check-answers')
})

router.get('/permit/check-answers', (req, res) => {
  res.render('permit/check-answers')
})

router.post('/permit/check-answers', (req, res) => {
  res.redirect('/permit/confirmation')
})

router.get('/permit/confirmation', (req, res) => {
  res.render('permit/confirmation')
})

router.get('/complaints', (req, res) => {
  res.redirect('/complaints/who-for')
})

router.get('/complaints/who-for', (req, res) => {
  res.render('complaints/who-for')
})

router.post('/complaints/who-for', (req, res) => {
  req.session.data.complaintFor = req.body.complaintFor || 'myself'
  req.session.data.hasPermission = req.body.hasPermission
  req.session.data.permissionDocument = req.body.complaintFor === 'someone-else' ? 'No file chosen' : undefined
  res.redirect('/complaints/service')
})

router.get('/complaints/service', (req, res) => {
  res.render('complaints/service')
})

router.post('/complaints/service', (req, res) => {
  req.session.data.service = req.body.service

  if (req.body.service === 'Community safety') {
    return res.redirect('/complaints/community-safety')
  }

  res.redirect('/complaints/previous-complaint')
})

router.get('/complaints/community-safety', (req, res) => {
  req.session.data.service = req.session.data.service || 'Community safety'
  res.render('complaints/community-safety')
})

router.post('/complaints/community-safety', (req, res) => {
  req.session.data.service = 'Community safety'
  req.session.data.communitySafetyArea = req.body.communitySafetyArea
  req.session.data.communitySafetyOther = req.body.communitySafetyOther
  res.redirect('/complaints/previous-complaint')
})

router.get('/complaints/previous-complaint', (req, res) => {
  res.render('complaints/previous-complaint')
})

router.post('/complaints/previous-complaint', (req, res) => {
  req.session.data.previousComplaint = req.body.previousComplaint || 'no'
  req.session.data.previousComplaintReference = req.body.previousComplaintReference
  res.redirect('/complaints/your-details')
})

router.get('/complaints/your-details', (req, res) => {
  res.render('complaints/your-details')
})

router.post('/complaints/your-details', (req, res) => {
  Object.assign(req.session.data, {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    addressLine1: req.body.addressLine1,
    addressLine2: req.body.addressLine2,
    townOrCity: req.body.townOrCity,
    county: req.body.county,
    postcode: req.body.postcode,
    email: req.body.email,
    phone: req.body.phone,
    responseMethods: Array.isArray(req.body.responseMethods)
      ? req.body.responseMethods
      : req.body.responseMethods ? [req.body.responseMethods] : []
  })

  res.redirect('/complaints/complaint-details')
})

router.get('/complaints/complaint-details', (req, res) => {
  res.render('complaints/complaint-details')
})

router.post('/complaints/complaint-details', (req, res) => {
  Object.assign(req.session.data, {
    complaintDescription: req.body.complaintDescription,
    incidentDate: req.body.incidentDate,
    impact: req.body.impact,
    desiredOutcome: req.body.desiredOutcome
  })

  res.redirect('/complaints/supporting-documents')
})

router.get('/complaints/supporting-documents', (req, res) => {
  res.render('complaints/supporting-documents')
})

router.post('/complaints/supporting-documents', (req, res) => {
  req.session.data.supportingDocument = 'file.pdf'
  res.redirect('/complaints/reasonable-adjustments')
})

router.get('/complaints/reasonable-adjustments', (req, res) => {
  res.render('complaints/reasonable-adjustments')
})

router.post('/complaints/reasonable-adjustments', (req, res) => {
  req.session.data.needsAdjustments = req.body.needsAdjustments || 'no'
  req.session.data.adjustmentsDetails = req.body.adjustmentsDetails
  res.redirect('/complaints/confirmation')
})

router.get('/complaints/confirmation', (req, res) => {
  res.render('complaints/confirmation')
})

router.post('/clear-data', (req, res) => {
  req.session.data = {}
  res.redirect('/')
})

module.exports = router
