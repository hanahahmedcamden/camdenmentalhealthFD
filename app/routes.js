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

router.get('/', (req, res) => {
  res.render('index')
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
