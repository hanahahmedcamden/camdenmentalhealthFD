const path = require('node:path')

const express = require('express')
const session = require('express-session')
const nunjucks = require('nunjucks')

const routes = require('./app/routes')

const app = express()
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 3000
const appViews = path.join(__dirname, 'app/views')
const prototypePassword = process.env.PROTOTYPE_PASSWORD

const nunjucksEnv = nunjucks.configure([
  appViews,
  path.join(__dirname, 'node_modules/lbcamden-frontend/lbcamden'),
  path.join(__dirname)
], {
  autoescape: true,
  express: app,
  noCache: !isProduction,
  watch: !isProduction
})

nunjucksEnv.addFilter('json', (value) => JSON.stringify(value, null, 2))

app.set('view engine', 'njk')
app.set('views', appViews)

if (isProduction) {
  app.use((req, res, next) => {
    if (!prototypePassword) {
      return res.status(503).send('PROTOTYPE_PASSWORD is not configured')
    }

    const authHeader = req.get('authorization') || ''
    const [scheme, encodedCredentials] = authHeader.split(' ')

    if (scheme === 'Basic' && encodedCredentials) {
      const credentials = Buffer.from(encodedCredentials, 'base64').toString('utf8')
      const separatorIndex = credentials.indexOf(':')
      const password = separatorIndex === -1 ? '' : credentials.slice(separatorIndex + 1)

      if (password === prototypePassword) {
        return next()
      }
    }

    res.set('WWW-Authenticate', 'Basic realm="Camden prototype"')
    res.status(401).send('Password required')
  })
}

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(session({
  name: 'camden-prototype-session',
  secret: process.env.SESSION_SECRET || 'change-this-before-sharing',
  resave: false,
  saveUninitialized: true
}))

app.use((req, res, next) => {
  req.session.data = req.session.data || {}
  res.locals.data = req.session.data
  if (req.path.startsWith('/goose-sighting')) {
    res.locals.serviceName = 'Record a goose sighting'
    res.locals.serviceHomeUrl = '/goose-sighting/start'
  } else if (req.path.startsWith('/mental-health-referral')) {
    res.locals.serviceName = 'Make a professional referral for mental health social care support'
    res.locals.serviceHomeUrl = '/mental-health-referral/start'
  } else if (req.path.startsWith('/permit')) {
    res.locals.serviceName = 'Apply for a parking permit'
    res.locals.serviceHomeUrl = '/permit/start'
  } else if (req.path.startsWith('/complaints')) {
    res.locals.serviceName = 'Complain about the council'
    res.locals.serviceHomeUrl = '/complaints/who-for'
  } else {
    res.locals.serviceName = 'Camden prototype kit'
    res.locals.serviceHomeUrl = '/'
  }
  res.locals.assetPath = '/assets'
  next()
})

app.use('/stylesheets', express.static(path.join(__dirname, 'public/stylesheets')))
app.use('/javascripts', express.static(path.join(__dirname, 'public/javascripts')))
app.use('/assets', express.static(path.join(__dirname, 'public/assets')))

app.use(routes)

app.use((req, res) => {
  res.status(404).render('404')
})

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Camden prototype running at http://localhost:${port}`)
  })
}

module.exports = app
