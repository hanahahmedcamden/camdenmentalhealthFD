#!/usr/bin/env node

'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const GENERATOR_VERSION = '1.2.0'
const RESERVED_VIEW_DIRECTORIES = new Set([
  'components',
  'includes',
  'layouts',
  'macros',
  'partials'
])
const KNOWN_EXAMPLE_JOURNEYS = new Set(['complaints', 'permit'])
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr'
])

function printHelp () {
  console.log(`Camden prototype content specification generator v${GENERATOR_VERSION}

Usage:
  node scripts/generate-content-spec.js [options]

Options:
  --journey <name>       Export a named journey folder from app/views
  --all                  Export every non-example journey
  --include-examples     Include bundled example journeys when using --all
  --format <format>      markdown, csv or both (default: markdown)
  --output <directory>   Output directory (default: content-specs)
  --revision <number>    Set the revision number instead of auto-incrementing
  --list                 List detected journeys without exporting
  --strict               Exit with an error when extraction warnings occur
  --quiet                Print only output filenames and errors
  --version              Print the generator version
  --help                 Show this help

Default journey selection:
  The generator ignores journeys linked under "Example journeys" on the home
  page. If exactly one other journey exists, it is selected automatically. If
  none or several exist, use --journey <name>.

Examples:
  node scripts/generate-content-spec.js
  node scripts/generate-content-spec.js --journey complaints --format both
  node scripts/generate-content-spec.js --all --format markdown
`)
}

function parseArguments (argv) {
  const options = {
    all: false,
    format: 'markdown',
    includeExamples: false,
    list: false,
    output: 'content-specs',
    quiet: false,
    revision: null,
    strict: false
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    const next = () => {
      index += 1
      if (index >= argv.length || argv[index].startsWith('--')) {
        throw new Error(`${argument} requires a value`)
      }
      return argv[index]
    }

    if (argument === '--journey') options.journey = next()
    else if (argument === '--format') options.format = next().toLowerCase()
    else if (argument === '--output') options.output = next()
    else if (argument === '--revision') options.revision = Number.parseInt(next(), 10)
    else if (argument === '--all') options.all = true
    else if (argument === '--include-examples') options.includeExamples = true
    else if (argument === '--list') options.list = true
    else if (argument === '--strict') options.strict = true
    else if (argument === '--quiet') options.quiet = true
    else if (argument === '--version') options.version = true
    else if (argument === '--help' || argument === '-h') options.help = true
    else throw new Error(`Unknown option: ${argument}`)
  }

  if (!['both', 'csv', 'markdown', 'md'].includes(options.format)) {
    throw new Error('--format must be markdown, csv or both')
  }
  if (options.revision !== null && (!Number.isInteger(options.revision) || options.revision < 1)) {
    throw new Error('--revision must be a positive whole number')
  }
  if (options.all && options.journey) {
    throw new Error('Use either --all or --journey, not both')
  }

  if (options.format === 'md') options.format = 'markdown'
  return options
}

function findKitRoot () {
  const starts = [process.cwd(), __dirname]
  for (const start of starts) {
    let directory = path.resolve(start)
    while (true) {
      if (
        fs.existsSync(path.join(directory, 'app', 'routes.js')) &&
        fs.existsSync(path.join(directory, 'app', 'views'))
      ) return directory
      const parent = path.dirname(directory)
      if (parent === directory) break
      directory = parent
    }
  }
  throw new Error('Could not find a prototype kit. Run this command from the kit folder.')
}

function walkFiles (directory, extension, base = directory) {
  const files = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...walkFiles(absolutePath, extension, base))
    else if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(path.relative(base, absolutePath).split(path.sep).join('/'))
    }
  }
  return files.sort()
}

function discoverJourneys (root) {
  const viewsDirectory = path.join(root, 'app', 'views')
  return fs.readdirSync(viewsDirectory, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !RESERVED_VIEW_DIRECTORIES.has(entry.name))
    .filter(entry => walkFiles(path.join(viewsDirectory, entry.name), '.njk').length > 0)
    .map(entry => entry.name)
    .sort()
}

function detectExampleJourneys (root) {
  const examples = new Set(KNOWN_EXAMPLE_JOURNEYS)
  const indexPath = path.join(root, 'app', 'views', 'index.njk')
  if (!fs.existsSync(indexPath)) return examples

  const source = fs.readFileSync(indexPath, 'utf8')
  const section = source.match(/<h2\b[^>]*>\s*Example journeys\s*<\/h2>([\s\S]*?)(?=<h2\b|\{%\s*endblock)/i)
  if (!section) return examples

  const hrefPattern = /(?:href\s*=\s*|href\s*:\s*)["']\/([^/"'#?\s]+)/gi
  let match
  while ((match = hrefPattern.exec(section[1]))) examples.add(match[1])
  return examples
}

function selectJourneys (available, examples, options) {
  if (options.journey) {
    if (!available.includes(options.journey)) {
      throw new Error(`Journey "${options.journey}" was not found. Available journeys: ${available.join(', ') || 'none'}`)
    }
    return [options.journey]
  }

  if (options.all) {
    const selected = options.includeExamples
      ? available
      : available.filter(journey => !examples.has(journey))
    if (!selected.length) {
      throw new Error('No non-example journeys were found. Use --journey <name>, or use --all --include-examples.')
    }
    return selected
  }

  const nonExamples = available.filter(journey => !examples.has(journey))
  if (nonExamples.length === 1) return nonExamples
  if (nonExamples.length === 0) {
    throw new Error(`No non-example journey was found. For this kit, try --journey ${available[0] || '<name>'}.`)
  }
  throw new Error(`More than one non-example journey was found (${nonExamples.join(', ')}). Use --journey <name>.`)
}

function lineNumberAt (source, index) {
  return source.slice(0, Math.max(0, index)).split('\n').length
}

function findMatchingParenthesis (source, openIndex) {
  let depth = 0
  let quote = null
  let escaped = false
  let lineComment = false
  let blockComment = false

  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index]
    const following = source[index + 1]

    if (lineComment) {
      if (character === '\n') lineComment = false
      continue
    }
    if (blockComment) {
      if (character === '*' && following === '/') {
        blockComment = false
        index += 1
      }
      continue
    }
    if (quote) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = null
      continue
    }
    if (character === '/' && following === '/') {
      lineComment = true
      index += 1
      continue
    }
    if (character === '/' && following === '*') {
      blockComment = true
      index += 1
      continue
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character
      continue
    }
    if (character === '(') depth += 1
    else if (character === ')') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

function extractRoutes (source) {
  const routes = []
  const pattern = /router\.(get|post)\s*\(\s*(["'])(.*?)\2/g
  let match

  while ((match = pattern.exec(source))) {
    const openIndex = source.indexOf('(', match.index)
    const closeIndex = findMatchingParenthesis(source, openIndex)
    if (closeIndex === -1) continue
    const block = source.slice(match.index, closeIndex + 1)
    const render = block.match(/res(?:\.status\([^)]*\))?\.render\s*\(\s*["']([^"']+)["']/)
    const redirects = [...block.matchAll(/res\.redirect\s*\(\s*["']([^"']+)["']\s*\)/g)].map(result => result[1])
    const errors = {}
    for (const error of block.matchAll(/errors(?:\.([A-Za-z_$][\w$]*)|\[['"]([^'"]+)['"]\])\s*=\s*(["'`])([\s\S]*?)\3/g)) {
      errors[error[1] || error[2]] = error[4].replace(/\$\{[^}]+\}/g, '${…}')
    }
    const dataKeys = new Set()
    for (const result of block.matchAll(/req\.session\.data\.([A-Za-z_$][\w$]*)/g)) dataKeys.add(result[1])
    const assign = block.match(/Object\.assign\s*\(\s*req\.session\.data\s*,\s*\{([\s\S]*?)\}\s*\)/)
    if (assign) {
      for (const result of assign[1].matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm)) dataKeys.add(result[1])
    }

    routes.push({
      block,
      dataKeys: [...dataKeys],
      errors,
      line: lineNumberAt(source, match.index),
      method: match[1].toUpperCase(),
      path: match[3],
      redirects,
      template: render ? render[1] : null
    })
    pattern.lastIndex = closeIndex + 1
  }
  return routes
}

function decodeHtml (value) {
  const named = {
    amp: '&', apos: "'", gt: '>', hellip: '…', laquo: '«', ldquo: '“',
    lsquo: '‘', lt: '<', nbsp: ' ', ndash: '–', quot: '"', raquo: '»',
    rdquo: '”', rsquo: '’'
  }
  return String(value || '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, name) => {
    if (name[0] === '#') {
      const hexadecimal = name[1].toLowerCase() === 'x'
      const number = Number.parseInt(name.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10)
      return Number.isFinite(number) ? String.fromCodePoint(number) : entity
    }
    return Object.prototype.hasOwnProperty.call(named, name.toLowerCase()) ? named[name.toLowerCase()] : entity
  })
}

function parseAttributes (source) {
  const attributes = {}
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  let match
  while ((match = pattern.exec(source))) {
    attributes[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? '')
  }
  return attributes
}

function parseHtml (html) {
  const root = { attrs: {}, children: [], parent: null, tag: '#document', text: '' }
  const stack = [root]
  const tokenPattern = /<!--[\s\S]*?-->|<![^>]*>|<\/?[A-Za-z][^>]*>|[^<]+/g
  let match

  while ((match = tokenPattern.exec(html))) {
    const token = match[0]
    if (token.startsWith('<!--') || token.startsWith('<!')) continue
    if (token.startsWith('</')) {
      const tag = token.match(/^<\/\s*([^\s>]+)/)[1].toLowerCase()
      while (stack.length > 1) {
        const popped = stack.pop()
        if (popped.tag === tag) break
      }
      continue
    }
    if (token.startsWith('<')) {
      const opening = token.match(/^<\s*([^\s/>]+)/)
      if (!opening) continue
      const tag = opening[1].toLowerCase()
      const attributeSource = token.slice(opening[0].length, token.length - (token.endsWith('/>') ? 2 : 1))
      const node = {
        attrs: parseAttributes(attributeSource),
        children: [],
        parent: stack[stack.length - 1],
        tag,
        text: ''
      }
      stack[stack.length - 1].children.push(node)
      if (!VOID_ELEMENTS.has(tag) && !token.endsWith('/>')) stack.push(node)
      continue
    }
    stack[stack.length - 1].children.push({
      attrs: {},
      children: [],
      parent: stack[stack.length - 1],
      tag: '#text',
      text: decodeHtml(token)
    })
  }
  return root
}

function findAll (node, predicate, results = []) {
  if (predicate(node)) results.push(node)
  for (const child of node.children || []) findAll(child, predicate, results)
  return results
}

function findFirst (node, predicate) {
  if (predicate(node)) return node
  for (const child of node.children || []) {
    const result = findFirst(child, predicate)
    if (result) return result
  }
  return null
}

function textContent (node) {
  if (!node) return ''
  if (node.tag === '#text') return node.text
  if (node.tag === 'script' || node.tag === 'style') return ''
  return (node.children || []).map(textContent).join(' ')
}

function cleanText (value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function nodeText (node) {
  return cleanText(textContent(node))
}

function classNames (node) {
  return new Set(String(node?.attrs?.class || '').split(/\s+/).filter(Boolean))
}

function hasClass (node, className) {
  return classNames(node).has(className)
}

function closest (node, predicate) {
  let current = node?.parent || null
  while (current) {
    if (predicate(current)) return current
    current = current.parent
  }
  return null
}

function findById (root, id) {
  return findFirst(root, node => node.attrs?.id === id)
}

function unique (values) {
  return [...new Set(values.filter(Boolean))]
}

function findSourceLine (source, values) {
  for (const value of values) {
    if (!value) continue
    const patterns = [
      `name="${value}"`, `name='${value}'`, `name: "${value}"`, `name: '${value}'`,
      `id="${value}"`, `id='${value}'`
    ]
    for (const pattern of patterns) {
      const index = source.indexOf(pattern)
      if (index !== -1) return lineNumberAt(source, index)
    }
  }
  return 1
}

function labelFor (labels, id) {
  return id && labels.has(id) ? nodeText(labels.get(id)) : ''
}

function nearestHint (root, control) {
  const describedBy = String(control.attrs['aria-describedby'] || '').split(/\s+/).filter(Boolean)
  const describedHints = describedBy
    .map(id => findById(root, id))
    .filter(node => node && hasClass(node, 'govuk-hint'))
    .map(nodeText)
  if (describedHints.length) return unique(describedHints).join(' ')

  const group = closest(control, node => hasClass(node, 'govuk-form-group'))
  if (!group) return ''
  const conditional = closest(control, node => hasClass(node, 'govuk-radios__conditional') || hasClass(node, 'govuk-checkboxes__conditional'))
  const hint = findFirst(group, node => {
    if (!hasClass(node, 'govuk-hint')) return false
    const hintConditional = closest(node, ancestor => hasClass(ancestor, 'govuk-radios__conditional') || hasClass(ancestor, 'govuk-checkboxes__conditional'))
    return hintConditional === conditional
  })
  return hint ? nodeText(hint) : ''
}

function groupedHint (fieldset) {
  if (!fieldset) return ''
  const hint = findFirst(fieldset, node => {
    if (!hasClass(node, 'govuk-hint')) return false
    return !closest(node, ancestor => hasClass(ancestor, 'govuk-radios__conditional') || hasClass(ancestor, 'govuk-checkboxes__conditional'))
  })
  return hint ? nodeText(hint) : ''
}

function contentBlocks (container) {
  if (!container) return []
  const blocks = findAll(container, node => ['h2', 'h3', 'h4', 'p', 'li'].includes(node.tag))
    .filter(node => !closest(node, ancestor => ancestor !== container && ['nav', 'header', 'footer'].includes(ancestor.tag)))
    .map(nodeText)
    .filter(Boolean)
  return blocks.length ? unique(blocks) : [nodeText(container)].filter(Boolean)
}

function extractSummaryLists (main) {
  return findAll(main, node => hasClass(node, 'govuk-summary-list')).map(list => {
    const card = closest(list, node => hasClass(node, 'govuk-summary-card'))
    const titleNode = card ? findFirst(card, node => hasClass(node, 'govuk-summary-card__title')) : null
    const cardActionsNode = card ? findFirst(card, node => hasClass(node, 'govuk-summary-card__actions')) : null
    const rows = findAll(list, node => hasClass(node, 'govuk-summary-list__row')).map(row => {
      const keyNode = findFirst(row, node => hasClass(node, 'govuk-summary-list__key'))
      const valueNode = findFirst(row, node => hasClass(node, 'govuk-summary-list__value'))
      const actionsNode = findFirst(row, node => hasClass(node, 'govuk-summary-list__actions'))
      const actions = actionsNode
        ? findAll(actionsNode, node => node.tag === 'a').map(action => ({
            destination: action.attrs.href || '',
            text: nodeText(action)
          }))
        : []
      return {
        actions,
        key: nodeText(keyNode),
        value: nodeText(valueNode) || 'Dynamic or user-provided value'
      }
    }).filter(row => row.key || row.value)
    const cardActions = cardActionsNode
      ? findAll(cardActionsNode, node => node.tag === 'a').map(action => ({
          destination: action.attrs.href || '',
          text: nodeText(action)
        }))
      : []
    return { cardActions, rows, title: nodeText(titleNode) }
  })
}

function extractDetails (main) {
  return findAll(main, node => node.tag === 'details' && hasClass(node, 'govuk-details')).map(details => {
    const summary = findFirst(details, node => node.tag === 'summary')
    const content = findFirst(details, node => hasClass(node, 'govuk-details__text'))
    return { content: contentBlocks(content), summary: nodeText(summary) }
  }).filter(item => item.summary || item.content.length)
}

function extractAccordions (main) {
  return findAll(main, node => hasClass(node, 'govuk-accordion')).map(accordion => ({
    sections: findAll(accordion, node => hasClass(node, 'govuk-accordion__section')).map(section => {
      const heading = findFirst(section, node => hasClass(node, 'govuk-accordion__section-button')) ||
        findFirst(section, node => hasClass(node, 'govuk-accordion__section-heading'))
      const summary = findFirst(section, node => hasClass(node, 'govuk-accordion__section-summary'))
      const content = findFirst(section, node => hasClass(node, 'govuk-accordion__section-content'))
      return {
        content: contentBlocks(content),
        heading: nodeText(heading),
        summary: nodeText(summary)
      }
    }).filter(section => section.heading || section.summary || section.content.length)
  })).filter(accordion => accordion.sections.length)
}

function extractTabs (main) {
  return findAll(main, node => hasClass(node, 'govuk-tabs')).map(tabs => ({
    title: nodeText(findFirst(tabs, node => hasClass(node, 'govuk-tabs__title'))),
    items: findAll(tabs, node => hasClass(node, 'govuk-tabs__tab')).map(tab => {
      const targetId = String(tab.attrs.href || '').replace(/^#/, '')
      const panel = targetId ? findById(tabs, targetId) : null
      return {
        content: contentBlocks(panel).filter(block => block !== nodeText(tab)),
        label: nodeText(tab)
      }
    }).filter(item => item.label || item.content.length)
  })).filter(tabs => tabs.items.length)
}

function isStructuredContent (node) {
  return Boolean(closest(node, ancestor =>
    ancestor.tag === 'details' ||
    hasClass(ancestor, 'govuk-accordion') ||
    hasClass(ancestor, 'govuk-tabs') ||
    hasClass(ancestor, 'govuk-summary-card') ||
    hasClass(ancestor, 'govuk-summary-list')
  ))
}

function extractPageFromHtml ({ html, journey, route, root, source, template }) {
  const document = parseHtml(html)
  const main = findFirst(document, node => node.attrs?.id === 'main-content') ||
    findFirst(document, node => node.tag === 'main') || document
  const warnings = []
  const forms = findAll(main, node => node.tag === 'form')
  const journeyForms = forms.filter(form => {
    const action = form.attrs.action || route.path
    return action === route.path || action.startsWith(`/${journey}`)
  })
  const form = journeyForms[0] || forms[0] || null
  const scope = form || main
  const labels = new Map()
  for (const label of findAll(scope, node => node.tag === 'label')) {
    if (label.attrs.for) labels.set(label.attrs.for, label)
  }

  const allControls = findAll(scope, node => ['input', 'select', 'textarea'].includes(node.tag))
    .filter(node => !['button', 'hidden', 'reset', 'submit'].includes((node.attrs.type || '').toLowerCase()))
    .filter(node => node.attrs.name)
  const controlsByName = new Map()
  for (const control of allControls) {
    const name = control.attrs.name
    if (!controlsByName.has(name)) controlsByName.set(name, [])
    controlsByName.get(name).push(control)
  }

  const conditions = new Map()
  for (const controller of allControls.filter(node => node.attrs['data-aria-controls'])) {
    const controlled = findById(scope, controller.attrs['data-aria-controls'])
    if (!controlled) continue
    const controllerLabel = labelFor(labels, controller.attrs.id) || controller.attrs.value || controller.attrs.name
    for (const nested of findAll(controlled, node => ['input', 'select', 'textarea'].includes(node.tag) && node.attrs.name)) {
      const nearestConditional = closest(nested, node => hasClass(node, 'govuk-radios__conditional') || hasClass(node, 'govuk-checkboxes__conditional'))
      if (nearestConditional !== controlled) continue
      if (!conditions.has(nested.attrs.name)) conditions.set(nested.attrs.name, [])
      const relationship = {
        controlledId: controller.attrs['data-aria-controls'],
        optionLabel: controllerLabel,
        optionValue: controller.attrs.value || 'selected',
        parentFieldName: controller.attrs.name
      }
      const existing = conditions.get(nested.attrs.name)
      if (!existing.some(item => item.parentFieldName === relationship.parentFieldName && item.optionValue === relationship.optionValue)) {
        existing.push(relationship)
      }
    }
  }

  const postRoute = route.allRoutes.find(item => item.method === 'POST' && item.path === route.path)
  const questions = []
  for (const [name, controls] of controlsByName) {
    const first = controls[0]
    const inputType = (first.attrs.type || '').toLowerCase()
    let componentType = first.tag === 'textarea' ? 'textarea' : first.tag === 'select' ? 'select' : inputType || 'text'
    const grouped = componentType === 'radio' || componentType === 'checkbox'
    const fieldset = closest(first, node => node.tag === 'fieldset')
    const legend = fieldset ? findFirst(fieldset, node => node.tag === 'legend') : null
    const options = []
    let question = ''

    if (first.tag === 'select') {
      question = labelFor(labels, first.attrs.id)
      for (const option of findAll(first, node => node.tag === 'option')) {
        options.push({ label: nodeText(option), value: option.attrs.value ?? nodeText(option) })
      }
    } else if (grouped) {
      for (const control of controls) {
        const optionLabel = labelFor(labels, control.attrs.id) || control.attrs.value || name
        options.push({ label: optionLabel, value: control.attrs.value || 'on' })
      }
      question = controls.length === 1 && componentType === 'checkbox'
        ? options[0].label
        : nodeText(legend)
    } else {
      question = labelFor(labels, first.attrs.id) || nodeText(legend)
    }

    const optional = /\boptional\b/i.test(question)
    const validationMessages = unique(postRoute?.errors?.[name] ? [postRoute.errors[name]] : [])
    const required = first.attrs.required !== undefined || validationMessages.length
      ? 'Yes'
      : optional ? 'No' : 'Not specified'

    if (!question) warnings.push(`Could not find a visible label or legend for field "${name}".`)
    const conditionalParents = conditions.get(name) || []
    questions.push({
      componentType,
      condition: conditionalParents
        .map(item => `${item.optionLabel} selected (${item.optionValue})`)
        .join('; '),
      conditionalParents,
      fieldName: name,
      hint: grouped && controls.length > 1 ? groupedHint(fieldset) : nearestHint(scope, first),
      line: findSourceLine(source, [name, first.attrs.id]),
      options,
      question,
      required,
      validationMessages
    })
  }

  const headingNodes = findAll(main, node => /^h[1-6]$/.test(node.tag) && !isStructuredContent(node))
  const headings = headingNodes.map(nodeText).filter(Boolean)
  const primaryHeadingNode = headingNodes.find(node => node.tag === 'h1') || headingNodes[0]
  const paragraphs = findAll(main, node => node.tag === 'p')
    .filter(node => !hasClass(node, 'govuk-error-message'))
    .filter(node => !isStructuredContent(node))
    .map(nodeText)
    .filter(Boolean)
  const listItems = findAll(main, node => node.tag === 'li')
    .filter(node => !closest(node, ancestor => hasClass(ancestor, 'govuk-error-summary')))
    .filter(node => !closest(node, ancestor => ['nav', 'header', 'footer'].includes(ancestor.tag)))
    .filter(node => !isStructuredContent(node))
    .map(nodeText)
    .filter(Boolean)
  const summaryLabels = findAll(main, node => node.tag === 'dt').map(nodeText).filter(Boolean)
  const summaryLists = extractSummaryLists(main)
  const details = extractDetails(main)
  const accordions = extractAccordions(main)
  const tabs = extractTabs(main)
  const buttons = findAll(main, node => {
    if (node.tag === 'button') return true
    if (node.tag !== 'a') return false
    return hasClass(node, 'govuk-button') || hasClass(node, 'lbcamden-button') || node.attrs.role === 'button'
  }).map(node => ({
    destination: node.attrs.href || node.attrs.formaction || '',
    text: nodeText(node),
    type: node.tag === 'a' ? 'link button' : 'submit button'
  })).filter(button => button.text)
  const backLinks = findAll(document, node => node.tag === 'a' && hasClass(node, 'govuk-back-link'))
    .map(node => ({ destination: node.attrs.href || '', text: nodeText(node) }))
  const forwardButtonDestinations = buttons
    .filter(button => !/^(back|change|previous)$/i.test(button.text))
    .map(button => button.destination)
    .filter(Boolean)
  const titleMatch = source.match(/{%\s*set\s+pageTitle\s*=\s*(["'])(.*?)\1\s*%}/)
  const browserTitle = titleMatch ? titleMatch[2] : nodeText(findFirst(document, node => node.tag === 'title'))
  let pageType = 'content page'
  if (/(^|\/)confirmation\.njk$/i.test(template) || findFirst(main, node => hasClass(node, 'govuk-panel--confirmation'))) pageType = 'confirmation page'
  else if (/(^|\/)check-answers\.njk$/i.test(template)) pageType = 'check answers page'
  else if (/(^|\/)start\.njk$/i.test(template) || buttons.some(button => /\bstart\b/i.test(button.text))) pageType = 'start page'
  else if (questions.length) pageType = 'question page'
  else if (findFirst(main, node => hasClass(node, 'govuk-summary-list'))) pageType = 'check answers page'
  else if (form) pageType = 'form page'

  if (form && !questions.length && pageType === 'form page') {
    warnings.push('A form was found, but no named form controls were extracted.')
  }

  return {
    backLinks,
    bodyContent: unique([...paragraphs, ...listItems]),
    browserTitle,
    buttons,
    accordions,
    details,
    headings: unique(headings),
    journey,
    nextRoutes: unique([...(postRoute?.redirects || []), ...forwardButtonDestinations]),
    order: 0,
    pageName: path.basename(template, '.njk'),
    pageType,
    primaryHeading: nodeText(primaryHeadingNode),
    questions,
    route: route.path,
    routeLine: route.line,
    sourceLine: titleMatch ? lineNumberAt(source, titleMatch.index) : 1,
    sessionDataKeys: unique(postRoute?.dataKeys || []),
    summaryLabels: unique(summaryLabels),
    summaryLists,
    tabs,
    template,
    warnings
  }
}

function createNunjucksEnvironment (root) {
  let nunjucks
  try {
    nunjucks = require(path.join(root, 'node_modules', 'nunjucks'))
  } catch (error) {
    throw new Error('Nunjucks is not installed. Run npm install in the prototype kit, then try again.')
  }
  const environment = nunjucks.configure([
    path.join(root, 'app', 'views'),
    path.join(root, 'node_modules', 'lbcamden-frontend', 'lbcamden'),
    root
  ], { autoescape: true, noCache: true, watch: false })
  environment.addFilter('json', value => JSON.stringify(value, null, 2))
  return environment
}

function renderTemplate (environment, template, journey) {
  return environment.render(template, {
    assetPath: '/assets',
    data: {},
    errorList: [],
    errors: {},
    serviceHomeUrl: `/${journey}`,
    serviceName: journey.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  })
}

function orderPages (pages) {
  if (!pages.length) return pages
  const byRoute = new Map(pages.map(page => [page.route, page]))
  const incoming = new Map(pages.map(page => [page.route, 0]))
  for (const page of pages) {
    const forwardLinks = page.buttons
      .filter(button => !/^(back|change|previous)$/i.test(button.text))
      .map(button => button.destination)
      .filter(Boolean)
    for (const destination of unique([...page.nextRoutes, ...forwardLinks])) {
      if (incoming.has(destination)) incoming.set(destination, incoming.get(destination) + 1)
    }
  }

  const start = pages.find(page => /\/start\/?$/.test(page.route)) ||
    pages.find(page => incoming.get(page.route) === 0) || pages[0]
  const ordered = []
  const visited = new Set()
  const queue = [start.route]
  while (queue.length) {
    const route = queue.shift()
    if (visited.has(route) || !byRoute.has(route)) continue
    visited.add(route)
    const page = byRoute.get(route)
    ordered.push(page)
    const destinations = unique([
      ...page.nextRoutes,
      ...page.buttons
        .filter(button => !/^(back|change|previous)$/i.test(button.text))
        .map(button => button.destination)
    ])
    for (const destination of destinations) {
      if (byRoute.has(destination) && !visited.has(destination)) queue.push(destination)
    }
  }
  for (const page of pages) if (!visited.has(page.route)) ordered.push(page)
  ordered.forEach((page, index) => { page.order = index + 1 })
  return ordered
}

function extractJourney ({ environment, journey, root, routes, routesSource }) {
  const prefix = `${journey}/`
  const viewFiles = walkFiles(path.join(root, 'app', 'views', journey), '.njk')
    .map(file => `${prefix}${file}`)
    .filter(file => !path.basename(file).startsWith('_'))
  const pages = []
  const journeyWarnings = []

  for (const template of viewFiles) {
    const getRoute = routes.find(route => route.method === 'GET' && route.template === template.replace(/\.njk$/, ''))
    if (!getRoute) {
      journeyWarnings.push(`No GET route renders ${template}.`)
      continue
    }
    const sourcePath = path.join(root, 'app', 'views', template)
    const source = fs.readFileSync(sourcePath, 'utf8')
    try {
      const html = renderTemplate(environment, template, journey)
      pages.push(extractPageFromHtml({
        html,
        journey,
        root,
        route: { ...getRoute, allRoutes: routes },
        source,
        template
      }))
    } catch (error) {
      journeyWarnings.push(`Could not render ${template}: ${cleanText(error.message)}`)
    }
  }

  const orderedPages = orderPages(pages)
  const sourceHash = crypto.createHash('sha256')
  sourceHash.update(routesSource)
  for (const template of viewFiles) {
    sourceHash.update(template)
    sourceHash.update(fs.readFileSync(path.join(root, 'app', 'views', template)))
  }

  return {
    journey,
    pages: orderedPages,
    sourceHash: sourceHash.digest('hex').slice(0, 12),
    warnings: unique([
      ...journeyWarnings,
      ...orderedPages.flatMap(page => page.warnings.map(warning => `${page.template}: ${warning}`))
    ])
  }
}

function gitCommit (root) {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
  } catch (error) {
    return 'Unavailable'
  }
}

function packageVersion (root) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
    return packageJson.version || 'Unavailable'
  } catch (error) {
    return 'Unavailable'
  }
}

function nextRevision (outputDirectory, journey) {
  if (!fs.existsSync(outputDirectory)) return 1
  const escapedJourney = journey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`^${escapedJourney}-content-spec-r(\\d{3})-`)
  const revisions = fs.readdirSync(outputDirectory)
    .map(file => file.match(pattern))
    .filter(Boolean)
    .map(match => Number.parseInt(match[1], 10))
  return revisions.length ? Math.max(...revisions) + 1 : 1
}

function markdownValue (value) {
  return value ? String(value) : 'Not specified'
}

function conditionalKey (fieldName, optionValue) {
  return `${fieldName}\u0000${optionValue}`
}

function optionMarkdown (option) {
  const value = option.value !== option.label ? ` (value: \`${option.value}\`)` : ''
  return `${option.label || '(blank option)'}${value}`
}

function appendConditionalQuestion (lines, question, childrenByOption, indent, ancestors = new Set()) {
  const label = question.question || question.fieldName
  lines.push(`${indent}- **${label}**`)
  lines.push(`${indent}  - Component: ${question.componentType}`)
  lines.push(`${indent}  - Field name: \`${question.fieldName}\``)
  lines.push(`${indent}  - Hint: ${markdownValue(question.hint)}`)
  lines.push(`${indent}  - Required: ${question.required}`)
  lines.push(`${indent}  - Validation: ${question.validationMessages.length ? question.validationMessages.join('; ') : 'None detected'}`)
  lines.push(`${indent}  - Source line: ${question.line}`)

  const nextAncestors = new Set(ancestors)
  nextAncestors.add(question.fieldName)
  if (question.options.length === 1 && question.componentType === 'checkbox' && question.options[0].label === question.question) {
    lines.push(`${indent}  - Submitted value: \`${question.options[0].value}\``)
    appendConditionalChildren(lines, question, question.options[0], childrenByOption, `${indent}  `, nextAncestors)
  } else if (question.options.length) {
    lines.push(`${indent}  - Options:`)
    for (const option of question.options) {
      lines.push(`${indent}    - ${optionMarkdown(option)}`)
      appendConditionalChildren(lines, question, option, childrenByOption, `${indent}    `, nextAncestors)
    }
  }
}

function appendConditionalChildren (lines, parentQuestion, option, childrenByOption, indent, ancestors) {
  const children = childrenByOption.get(conditionalKey(parentQuestion.fieldName, option.value)) || []
  const safeChildren = children.filter(child => !ancestors.has(child.fieldName))
  if (!safeChildren.length) return
  lines.push(`${indent}  - Reveals:`)
  for (const child of safeChildren) {
    appendConditionalQuestion(lines, child, childrenByOption, `${indent}    `, ancestors)
  }
}

function appendQuestion (lines, question, childrenByOption) {
  lines.push('', `#### ${question.question || question.fieldName}`, '')
  lines.push(`- Component: ${question.componentType}`)
  lines.push(`- Field name: \`${question.fieldName}\``)
  lines.push(`- Label or legend: ${markdownValue(question.question)}`)
  lines.push(`- Hint: ${markdownValue(question.hint)}`)
  lines.push(`- Required: ${question.required}`)
  lines.push(`- Validation: ${question.validationMessages.length ? question.validationMessages.join('; ') : 'None detected'}`)
  lines.push(`- Source line: ${question.line}`)
  if (question.options.length) {
    lines.push('- Options:')
    for (const option of question.options) {
      lines.push(`  - ${optionMarkdown(option)}`)
      appendConditionalChildren(lines, question, option, childrenByOption, '  ', new Set([question.fieldName]))
    }
  }
}

function appendContentBlocks (lines, blocks, indent = '') {
  for (const block of blocks) lines.push(`${indent}- ${block}`)
}

function createMarkdown (specification) {
  const lines = [
    `# ${specification.journeyName} content specification`,
    '',
    `- Revision: ${specification.revisionLabel}`,
    `- Generated: ${specification.generatedAt}`,
    `- Timezone: ${specification.timezone}`,
    `- Generator version: ${specification.generatorVersion}`,
    `- Prototype kit version: ${specification.kitVersion}`,
    `- Git commit: ${specification.gitCommit}`,
    `- Source fingerprint: ${specification.sourceHash}`,
    '',
    '## Journey summary',
    '',
    '| Page | Route | Type | Title |',
    '| --- | --- | --- | --- |'
  ]
  for (const page of specification.pages) {
    lines.push(`| ${page.order} | \`${page.route}\` | ${page.pageType} | ${String(page.browserTitle || '').replace(/\|/g, '\\|')} |`)
  }

  for (const page of specification.pages) {
    const pageName = page.primaryHeading || page.browserTitle || path.basename(page.template, '.njk')
    lines.push('', `## ${page.order}. ${pageName}`, '')
    lines.push(`- Route: \`${page.route}\``)
    lines.push(`- Page name: \`${page.pageName}\``)
    lines.push(`- Template: \`app/views/${page.template}\``)
    lines.push(`- Page type: ${page.pageType}`)
    lines.push(`- Browser title: ${markdownValue(page.browserTitle)}`)
    lines.push(`- Headings: ${page.headings.length ? page.headings.join(' / ') : 'Not specified'}`)
    lines.push(`- Back link: ${page.backLinks.length ? page.backLinks.map(link => `${link.text} → \`${link.destination}\``).join('; ') : 'None'}`)
    lines.push(`- Next route: ${page.nextRoutes.length ? page.nextRoutes.map(route => `\`${route}\``).join(', ') : 'Not determined'}`)
    lines.push(`- Session data: ${page.sessionDataKeys.length ? page.sessionDataKeys.map(key => `\`${key}\``).join(', ') : 'None detected'}`)

    if (page.bodyContent.length) {
      lines.push('', '### Body content', '')
      for (const content of page.bodyContent) lines.push(`- ${content}`)
    }
    if (page.details.length) {
      lines.push('', '### Details')
      for (const details of page.details) {
        lines.push('', `#### ${details.summary || 'Details'}`, '')
        appendContentBlocks(lines, details.content)
      }
    }
    if (page.accordions.length) {
      lines.push('', '### Accordions')
      for (const accordion of page.accordions) {
        for (const section of accordion.sections) {
          lines.push('', `#### ${section.heading || 'Accordion section'}`, '')
          if (section.summary) lines.push(`- Summary: ${section.summary}`)
          appendContentBlocks(lines, section.content)
        }
      }
    }
    if (page.tabs.length) {
      lines.push('', '### Tabs')
      for (const tabs of page.tabs) {
        if (tabs.title) lines.push('', `- Title: ${tabs.title}`)
        for (const item of tabs.items) {
          lines.push('', `#### ${item.label || 'Tab'}`, '')
          appendContentBlocks(lines, item.content)
        }
      }
    }
    if (page.summaryLists.length) {
      lines.push('', '### Summary lists')
      for (const summaryList of page.summaryLists) {
        if (summaryList.title) lines.push('', `#### ${summaryList.title}`, '')
        if (summaryList.cardActions.length) {
          lines.push('', `- Card actions: ${summaryList.cardActions.map(action => action.destination ? `${action.text} → \`${action.destination}\`` : action.text).join('; ')}`)
        }
        for (const row of summaryList.rows) {
          lines.push(`- **${row.key || 'Summary item'}:** ${row.value}`)
          if (row.actions.length) {
            lines.push(`  - Actions: ${row.actions.map(action => action.destination ? `${action.text} → \`${action.destination}\`` : action.text).join('; ')}`)
          }
        }
      }
    } else if (page.summaryLabels.length) {
      lines.push('', '### Summary labels', '')
      for (const label of page.summaryLabels) lines.push(`- ${label}`)
    }
    if (page.questions.length) {
      const questionsByName = new Map(page.questions.map(question => [question.fieldName, question]))
      const childrenByOption = new Map()
      const nestedFields = new Set()
      for (const question of page.questions) {
        for (const relationship of question.conditionalParents || []) {
          if (!questionsByName.has(relationship.parentFieldName)) continue
          const key = conditionalKey(relationship.parentFieldName, relationship.optionValue)
          if (!childrenByOption.has(key)) childrenByOption.set(key, [])
          childrenByOption.get(key).push(question)
          nestedFields.add(question.fieldName)
        }
      }

      lines.push('', '### Questions and conditional content')
      for (const question of page.questions.filter(item => !nestedFields.has(item.fieldName))) {
        appendQuestion(lines, question, childrenByOption)
      }
    }
    if (page.buttons.length) {
      lines.push('', '### Buttons', '')
      for (const button of page.buttons) {
        const destination = button.destination ? ` → \`${button.destination}\`` : ''
        lines.push(`- ${button.text} (${button.type})${destination}`)
      }
    }
    if (page.warnings.length) {
      lines.push('', '### Extraction notes', '')
      for (const warning of page.warnings) lines.push(`- ${warning}`)
    }
  }

  if (specification.warnings.length) {
    lines.push('', '## Extraction warnings', '')
    for (const warning of specification.warnings) lines.push(`- ${warning}`)
  }
  lines.push('')
  return lines.join('\n')
}

function csvEscape (value) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function createCsv (specification) {
  const headers = [
    'revision', 'generated_at', 'generator_version', 'journey', 'page_order',
    'route', 'page_name', 'template', 'page_type', 'browser_title', 'headings',
    'component_type', 'field_name', 'question_or_label', 'hint', 'options',
    'required', 'condition', 'validation_messages', 'buttons', 'next_routes',
    'back_links', 'session_data_keys', 'body_content', 'summary_labels',
    'source_file', 'source_line', 'warnings'
  ]
  const rows = [headers]
  for (const page of specification.pages) {
    const questionRows = page.questions.length ? page.questions : [null]
    for (const question of questionRows) {
      rows.push([
        specification.revisionLabel,
        specification.generatedAt,
        specification.generatorVersion,
        specification.journey,
        page.order,
        page.route,
        page.pageName,
        page.template,
        page.pageType,
        page.browserTitle,
        page.headings.join(' | '),
        question?.componentType || '',
        question?.fieldName || '',
        question?.question || '',
        question?.hint || '',
        question?.options.map(option => option.value === option.label ? option.label : `${option.label} [${option.value}]`).join(' | ') || '',
        question?.required || '',
        question?.condition || '',
        question?.validationMessages.join(' | ') || '',
        page.buttons.map(button => button.destination ? `${button.text} -> ${button.destination}` : button.text).join(' | '),
        page.nextRoutes.join(' | '),
        page.backLinks.map(link => `${link.text} -> ${link.destination}`).join(' | '),
        page.sessionDataKeys.join(' | '),
        page.bodyContent.join(' | '),
        page.summaryLabels.join(' | '),
        `app/views/${page.template}`,
        question?.line || page.sourceLine,
        page.warnings.join(' | ')
      ])
    }
  }
  return `${rows.map(row => row.map(csvEscape).join(',')).join('\r\n')}\r\n`
}

function safeTimestamp (date) {
  return date.toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z')
}

function writeSpecification ({ extracted, options, outputDirectory, root }) {
  const generated = new Date()
  const revision = options.revision || nextRevision(outputDirectory, extracted.journey)
  const revisionLabel = `r${String(revision).padStart(3, '0')}`
  const timestamp = safeTimestamp(generated)
  const specification = {
    ...extracted,
    generatedAt: generated.toISOString(),
    generatorVersion: GENERATOR_VERSION,
    gitCommit: gitCommit(root),
    journeyName: extracted.journey.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    kitVersion: packageVersion(root),
    revisionLabel,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
  }
  const baseName = `${extracted.journey}-content-spec-${revisionLabel}-${timestamp}`
  const created = []
  fs.mkdirSync(outputDirectory, { recursive: true })

  if (options.format === 'both' || options.format === 'markdown') {
    const markdownPath = path.join(outputDirectory, `${baseName}.md`)
    fs.writeFileSync(markdownPath, createMarkdown(specification), 'utf8')
    created.push(markdownPath)
  }
  if (options.format === 'both' || options.format === 'csv') {
    const csvPath = path.join(outputDirectory, `${baseName}.csv`)
    fs.writeFileSync(csvPath, createCsv(specification), 'utf8')
    created.push(csvPath)
  }
  return { created, specification }
}

function main () {
  let options
  try {
    options = parseArguments(process.argv.slice(2))
    if (options.help) return printHelp()
    if (options.version) return console.log(GENERATOR_VERSION)

    const root = findKitRoot()
    const available = discoverJourneys(root)
    const examples = detectExampleJourneys(root)
    if (options.list) {
      if (!available.length) console.log('No journeys found.')
      else {
        for (const journey of available) {
          console.log(`${journey}${examples.has(journey) ? ' (example)' : ''}`)
        }
      }
      return
    }

    const selected = selectJourneys(available, examples, options)
    const routesPath = path.join(root, 'app', 'routes.js')
    const routesSource = fs.readFileSync(routesPath, 'utf8')
    const routes = extractRoutes(routesSource)
    const environment = createNunjucksEnvironment(root)
    const outputDirectory = path.resolve(root, options.output)
    let warningCount = 0

    if (!options.quiet) {
      console.log(`Content specification generator v${GENERATOR_VERSION}`)
      console.log(`Journey${selected.length === 1 ? '' : 's'}: ${selected.join(', ')}`)
    }

    for (const journey of selected) {
      const extracted = extractJourney({ environment, journey, root, routes, routesSource })
      warningCount += extracted.warnings.length
      const result = writeSpecification({ extracted, options, outputDirectory, root })
      for (const file of result.created) console.log(path.relative(root, file))
      if (!options.quiet) {
        console.log(`  ${result.specification.pages.length} pages, ${result.specification.pages.reduce((total, page) => total + page.questions.length, 0)} questions or fields, ${result.specification.warnings.length} warnings`)
      }
    }

    if (options.strict && warningCount) {
      console.error(`Extraction completed with ${warningCount} warning${warningCount === 1 ? '' : 's'}.`)
      process.exitCode = 2
    }
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exitCode = 1
  }
}

main()
