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
    title: 'Details of their next of kin',
    fields: [
      { type: 'text', name: 'nextOfKinFirstName', label: 'First name', error: 'Enter their next of kin’s first name', autocomplete: 'given-name' },
      { type: 'text', name: 'nextOfKinLastName', label: 'Last name', error: 'Enter their next of kin’s last name', autocomplete: 'family-name' }
    ]
  },
  {
    slug: 'next-of-kin-contact',
    title: 'How can we contact their next of kin?',
    fields: [
      {
        type: 'contactDetails',
        name: 'nextOfKinContactMethods',
        label: 'How can we contact their next of kin?',
        hint: 'Select all that apply',
        error: 'Select how we can contact their next of kin',
        emailName: 'nextOfKinContactEmail',
        phoneName: 'nextOfKinContactPhone',
        emailConfirmationHint: '',
        emailLabel: 'Enter their email address',
        phoneLabel: 'Enter their phone number'
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
      { type: 'text', name: 'advocateLastName', label: 'Last name', error: 'Enter the advocate’s last name', autocomplete: 'family-name' }
    ]
  },
  {
    slug: 'advocate-contact',
    title: 'How can we contact their advocate?',
    fields: [
      {
        type: 'contactDetails',
        name: 'advocateContactMethods',
        label: 'How can we contact their advocate?',
        hint: 'Select all that apply',
        error: 'Select how we can contact their advocate',
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
    title: 'Do you know their Mosaic or NHS ID?',
    fields: [
      {
        type: 'radios',
        name: 'knowsMosaicOrNhsId',
        label: 'Do you know their Mosaic or NHS ID?',
        error: 'Select whether you know their Mosaic or NHS ID',
        items: ['Yes', 'No'],
        conditional: {
          value: 'Yes',
          fields: [
            { type: 'text', name: 'mosaicOrNhsId', label: 'Tell us their Mosaic or NHS ID', error: 'Enter their Mosaic or NHS ID' }
          ]
        }
      }
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
    slug: 'referral-awareness',
    title: 'Do they know you’re making this referral?',
    fields: [
      {
        type: 'radios',
        name: 'personKnowsReferral',
        label: 'Do they know you’re making this referral?',
        error: 'Select whether they know you’re making this referral',
        items: ['Yes', 'No'],
        conditional: {
          value: 'No',
          fields: [
            { type: 'textarea', name: 'referralNotKnownReason', label: 'Why do they not know you’re making this referral?', error: 'Tell us why they do not know you’re making this referral' }
          ]
        }
      }
    ]
  },
  {
    slug: 'communication-needs',
    title: 'Communication needs and reasonable adjustments',
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
        items: ['Yes', 'No'],
        conditional: {
          value: 'Yes',
          fields: [
            {
              type: 'textarea',
              name: 'clinicalProfessionalsDetails',
              label: 'Tell us the clinical professionals currently involved in their care',
              hint: 'Include their name, job title and organisation or team',
              error: 'Tell us the clinical professionals currently involved in their care'
            }
          ]
        }
      }
    ]
  },
  {
    slug: 'children',
    title: 'Do they live with any children?',
    fields: [
      {
        type: 'radios',
        name: 'livesWithChildren',
        label: 'Do they live with any children?',
        error: 'Select whether they live with any children',
        items: ['Yes', 'No'],
        conditional: {
          value: 'Yes',
          fields: [
            { type: 'textarea', name: 'childrenDetails', label: 'Tell us how many children and their ages', error: 'Tell us how many children and their ages' }
          ]
        }
      }
    ]
  },
  {
    slug: 'pets',
    title: 'Do they live with any pets?',
    fields: [
      {
        type: 'radios',
        name: 'livesWithPets',
        label: 'Do they live with any pets?',
        error: 'Select whether they live with any pets',
        items: ['Yes', 'No'],
        conditional: {
          value: 'Yes',
          fields: [
            { type: 'textarea', name: 'petsDetails', label: 'Tell us what pets they live with', error: 'Tell us what pets they live with' }
          ]
        }
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
        ]
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
        hint: 'For example, needle finds, evidence of cuckooing, aggressive dogs',
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

const mentalHealthPageBySlug = Object.fromEntries(
  mentalHealthPages.map((page, index) => [page.slug, { ...page, index }])
)

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

  return `24.${pageIndex + 1}`
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

function getMentalHealthBackHref(page, data = {}) {
  if (!page.index) {
    return `${mentalHealthBasePath}/start`
  }

  if (page.slug === 'identifiers' && data.hasAdvocate === 'No') {
    return `${mentalHealthBasePath}/advocate`
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
  if (page.slug === 'advocate' && data.hasAdvocate === 'No') {
    return `${mentalHealthBasePath}/identifiers`
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
  if (field.type === 'contactDetails') {
    values[field.name] = asArray(body[field.name])
    values[field.emailName] = normaliseText(body[field.emailName])
    values[field.phoneName] = normaliseText(body[field.phoneName])
    return
  }

  if (field.type === 'checkboxGroup') {
    values[field.name] = asArray(body[field.name])
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

  return values
}

function validateMentalHealthField(field, values, errors) {
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
    } else if (values.personCurrentSituation.length > 200) {
      errors.personCurrentSituation = 'Current situation must be 200 characters or fewer'
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
  if (field.type === 'contactDetails') {
    sessionData[field.name] = values[field.name] || []
    sessionData[field.emailName] = values[field.name].includes('Email') ? values[field.emailName] : ''
    sessionData[field.phoneName] = values[field.name].includes('Phone') ? values[field.phoneName] : ''
    return
  }

  if (field.type === 'checkboxGroup') {
    sessionData[field.name] = values[field.name] || []
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
}

function addMentalHealthSummaryRow(rows, key, value, href) {
  const values = Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean)

  rows.push({
    key,
    values: values.length ? values : ['Not provided'],
    href
  })
}

function getMentalHealthSummaryRows(data) {
  const rows = []

  addMentalHealthSummaryRow(rows, 'Your name', `${data.referrerFirstName || ''} ${data.referrerLastName || ''}`.trim(), `${mentalHealthBasePath}/your-details`)
  addMentalHealthSummaryRow(rows, 'Job title', data.referrerJobTitle, `${mentalHealthBasePath}/your-details`)
  addMentalHealthSummaryRow(rows, 'Organisation or team', data.referrerOrganisation, `${mentalHealthBasePath}/your-details`)
  addMentalHealthSummaryRow(rows, 'Your contact details', [data.referrerEmail, data.referrerPhone], `${mentalHealthBasePath}/your-contact-details`)
  addMentalHealthSummaryRow(rows, 'Person being referred', `${data.personFirstName || ''} ${data.personLastName || ''}`.trim(), `${mentalHealthBasePath}/person-details`)
  addMentalHealthSummaryRow(rows, 'Date of birth', `${data.personDateOfBirthDay || ''} ${data.personDateOfBirthMonth || ''} ${data.personDateOfBirthYear || ''}`.trim(), `${mentalHealthBasePath}/person-details`)

  if (data.personCurrentSituation && !data.personAddressLine1 && !data.personPostcode) {
    addMentalHealthSummaryRow(rows, 'Home address', ['They do not have a permanent address', data.personCurrentSituation], `${mentalHealthBasePath}/home-address`)
  } else {
    addMentalHealthSummaryRow(rows, 'Home address', [data.personAddressLine1, data.personAddressLine2, data.personTownOrCity, data.personPostcode], `${mentalHealthBasePath}/home-address`)

    if (data.personCurrentSituation) {
      addMentalHealthSummaryRow(rows, 'No permanent address details', data.personCurrentSituation, `${mentalHealthBasePath}/home-address`)
    }
  }

  addMentalHealthSummaryRow(rows, 'Accommodation type', data.accommodationType, `${mentalHealthBasePath}/accommodation`)
  addMentalHealthSummaryRow(rows, 'How they would like to be contacted', [
    ...(data.personContactMethods || []),
    data.personContactEmail && `Email: ${data.personContactEmail}`,
    data.personContactPhone && `Phone: ${data.personContactPhone}`
  ], `${mentalHealthBasePath}/contact-person`)
  addMentalHealthSummaryRow(rows, 'Preferred contact methods', data.preferredContactMethods, `${mentalHealthBasePath}/preferred-contact`)
  addMentalHealthSummaryRow(rows, 'Next of kin', `${data.nextOfKinFirstName || ''} ${data.nextOfKinLastName || ''}`.trim(), `${mentalHealthBasePath}/next-of-kin`)
  addMentalHealthSummaryRow(rows, 'Next of kin contact methods', [
    ...(data.nextOfKinContactMethods || []),
    data.nextOfKinContactEmail && `Email: ${data.nextOfKinContactEmail}`,
    data.nextOfKinContactPhone && `Phone: ${data.nextOfKinContactPhone}`
  ], `${mentalHealthBasePath}/next-of-kin-contact`)
  addMentalHealthSummaryRow(rows, 'Has an advocate', data.hasAdvocate, `${mentalHealthBasePath}/advocate`)

  if (data.hasAdvocate === 'Yes') {
    addMentalHealthSummaryRow(rows, 'Advocate details', `${data.advocateFirstName || ''} ${data.advocateLastName || ''}`.trim(), `${mentalHealthBasePath}/advocate-details`)
    addMentalHealthSummaryRow(rows, 'Advocate contact methods', [
      ...(data.advocateContactMethods || []),
      data.advocateContactEmail && `Email: ${data.advocateContactEmail}`,
      data.advocateContactPhone && `Phone: ${data.advocateContactPhone}`
    ], `${mentalHealthBasePath}/advocate-contact`)
  }

  addMentalHealthSummaryRow(rows, 'Mosaic or NHS ID known', data.knowsMosaicOrNhsId, `${mentalHealthBasePath}/identifiers`)

  if (data.knowsMosaicOrNhsId === 'Yes') {
    addMentalHealthSummaryRow(rows, 'Mosaic or NHS ID', data.mosaicOrNhsId, `${mentalHealthBasePath}/identifiers`)
  }

  addMentalHealthSummaryRow(rows, 'Your relationship to them', data.relationshipToPerson, `${mentalHealthBasePath}/relationship`)
  addMentalHealthSummaryRow(rows, 'They know about the referral', data.personKnowsReferral, `${mentalHealthBasePath}/referral-awareness`)

  if (data.personKnowsReferral === 'No') {
    addMentalHealthSummaryRow(rows, 'Why they do not know', data.referralNotKnownReason, `${mentalHealthBasePath}/referral-awareness`)
  }

  addMentalHealthSummaryRow(rows, 'Communication needs', data.hasCommunicationNeeds, `${mentalHealthBasePath}/communication-needs`)

  if (data.hasCommunicationNeeds === 'Yes') {
    addMentalHealthSummaryRow(rows, 'Communication needs details', data.communicationNeedsDetails, `${mentalHealthBasePath}/communication-needs`)
  }

  addMentalHealthSummaryRow(rows, 'Reasonable adjustments', data.needsReasonableAdjustments, `${mentalHealthBasePath}/communication-needs`)

  if (data.needsReasonableAdjustments === 'Yes') {
    addMentalHealthSummaryRow(rows, 'Reasonable adjustments details', data.reasonableAdjustmentsDetails, `${mentalHealthBasePath}/communication-needs`)
  }

  addMentalHealthSummaryRow(rows, 'Confirmed diagnosis', data.hasConfirmedDiagnosis, `${mentalHealthBasePath}/mental-health-conditions`)

  if (data.hasConfirmedDiagnosis === 'Yes') {
    addMentalHealthSummaryRow(rows, 'Confirmed diagnosis details', data.confirmedDiagnosisDetails, `${mentalHealthBasePath}/mental-health-conditions`)
  }

  addMentalHealthSummaryRow(rows, 'Suspected mental health conditions', data.hasSuspectedConditions, `${mentalHealthBasePath}/mental-health-conditions`)

  if (data.hasSuspectedConditions === 'Yes') {
    addMentalHealthSummaryRow(rows, 'Suspected condition details', data.suspectedConditionsDetails, `${mentalHealthBasePath}/mental-health-conditions`)
  }

  addMentalHealthSummaryRow(rows, 'Clinical professionals involved', data.clinicalProfessionalsInvolved, `${mentalHealthBasePath}/clinical-professionals`)

  if (data.clinicalProfessionalsInvolved === 'Yes') {
    addMentalHealthSummaryRow(rows, 'Clinical professional details', data.clinicalProfessionalsDetails, `${mentalHealthBasePath}/clinical-professionals`)
  }

  addMentalHealthSummaryRow(rows, 'Lives with children', data.livesWithChildren, `${mentalHealthBasePath}/children`)

  if (data.livesWithChildren === 'Yes') {
    addMentalHealthSummaryRow(rows, 'Children details', data.childrenDetails, `${mentalHealthBasePath}/children`)
  }

  addMentalHealthSummaryRow(rows, 'Lives with pets', data.livesWithPets, `${mentalHealthBasePath}/pets`)

  if (data.livesWithPets === 'Yes') {
    addMentalHealthSummaryRow(rows, 'Pets details', data.petsDetails, `${mentalHealthBasePath}/pets`)
  }

  addMentalHealthSummaryRow(rows, 'History of violence or aggression', data.historyOfViolenceOrAggression, `${mentalHealthBasePath}/violence-or-aggression`)
  addMentalHealthSummaryRow(rows, 'Current risks', data.currentRisks, `${mentalHealthBasePath}/current-risks`)
  addMentalHealthSummaryRow(rows, 'Environmental risks', data.hasEnvironmentalRisks, `${mentalHealthBasePath}/environmental-risks`)

  if (data.hasEnvironmentalRisks === 'Yes') {
    addMentalHealthSummaryRow(rows, 'Environmental risk details', data.environmentalRisksDetails, `${mentalHealthBasePath}/environmental-risks`)
  }

  addMentalHealthSummaryRow(rows, 'Reason for referral', data.referralReasons, `${mentalHealthBasePath}/reason-for-referral`)

  getSelectedReferralReasonFollowUps(data).forEach((page) => {
    addMentalHealthSummaryRow(rows, page.title, getReferralReasonFollowUpSummaryValues(page, data), getReferralReasonFollowUpHref(page))
  })

  addMentalHealthSummaryRow(rows, 'Current situation summary', data.currentSituationSummary, `${mentalHealthBasePath}/current-situation`)
  addMentalHealthSummaryRow(rows, 'Actions requested', data.requestedActions, `${mentalHealthBasePath}/current-situation`)

  return rows
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
    rows: getMentalHealthSummaryRows(req.session.data)
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

router.get('/mental-health-referral/:slug', (req, res, next) => {
  const page = mentalHealthPageBySlug[req.params.slug]

  if (!page) {
    return next()
  }

  res.render('mental-health-referral/question', {
    page,
    backHref: getMentalHealthBackHref(page, req.session.data),
    nextHref: getMentalHealthNextHref(page, req.session.data)
  })
})

router.post('/mental-health-referral/:slug', (req, res, next) => {
  const page = mentalHealthPageBySlug[req.params.slug]

  if (!page) {
    return next()
  }

  const values = normaliseMentalHealthBody(page, req.body)
  const errors = validateMentalHealthPage(page, values)

  if (Object.keys(errors).length) {
    return res.status(422).render('mental-health-referral/question', {
      page,
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
