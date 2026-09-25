# Mental Health Referral content specification

- Revision: r001
- Generated: 2026-09-25T13:41:53.263Z
- Timezone: Europe/London
- Generator version: 1.2.0
- Prototype kit version: 0.1.0
- Git commit: 0ff6b7b
- Source fingerprint: 8b28b0622027

## Journey summary

| Page | Route | Type | Title |
| --- | --- | --- | --- |
| 1 | `/mental-health-referral/start` | start page | Make a professional referral for mental health social care support |
| 2 | `/mental-health-referral/start-referral` | start page | Refer someone for mental health social care support |
| 3 | `/mental-health-referral/check-answers` | check answers page | Check your answers |
| 4 | `/mental-health-referral/confirmation` | confirmation page | Referral received |
| 5 | `/mental-health-referral/not-eligible` | content page | You should not use this referral form |
| 6 | `/mental-health-referral/referral-reason/:reasonSlug` | form page | Mental Health Referral - Camden Council |

## 1. Make a professional referral for mental health social care support

- Route: `/mental-health-referral/start`
- Page name: `start`
- Template: `app/views/mental-health-referral/start.njk`
- Page type: start page
- Browser title: Make a professional referral for mental health social care support
- Headings: Make a professional referral for mental health social care support / Who can make a referral / What you can make a referral for / Safeguarding and crisis / Before you make a referral / Check they’re a Camden resident / Get their details / How to make a referral / What happens next
- Back link: None
- Next route: `/mental-health-referral/start-referral`
- Session data: None detected

### Body content

- As a professional, you can refer an adult for mental health social care support.
- This referral process is for professionals, such as doctors, healthcare workers and carers.
- You can ask for help with mental health support for an adult Camden resident. This includes:
- This referral form is not for:
- To report safeguarding concerns, call 0207 974 4444 (Monday to Friday, 9am to 5pm) and when prompted say "Safeguarding". You can also report it by completing the Camden SAB multi-agency referral form and emailing it to asc.mash.safeguarding@camden.gov.uk .
- For medical emergencies, psychiatric crisis or medication reviews, use the North London Foundation Trust (NLFT) crisis line or call 999.
- If you want to ask for help for yourself, speak to your GP or another professional involved in your care.
- Before making a referral for someone else, there are 2 steps you should take first.
- We can only accept referrals for Camden residents. Use the GOV.UK postcode checker to check which local council the person you want to refer lives in.
- To refer someone, you need to know their:
- You’ll also be asked for their NHS number, if you know it.
- You can make a referral using our online form. You’ll be asked about:
- You should provide as much detail as you can. The form will take about 20 minutes to complete.
- If you need help filling the form in, call 0207 974 4444 (Monday to Friday, 9am to 5pm) and when prompted say "Adult Social Care".
- Those who use British Sign Language can also speak to us using SignVideo .
- Your referral will be reviewed within 5 days.
- If you’ve requested we contact you first, we’ll use the contact details you’ve provided. Otherwise, we’ll contact the person you’ve referred or their next of kin if they cannot be reached. We’ll call from a withheld number.
- If you need to tell us more information about the person you’ve referred before then, call 0207 974 4444 (Monday to Friday, 9am to 5pm).
- social care and support needs assessment
- review of existing package of care
- deep clean or environmental health, such as hoarding
- carer support or assessment
- safeguarding concerns, such as abuse or neglect
- signposting to volunteer teams, befriending or advocacy services. Ideally, you should signpost
- clinical treatment or medication management, which we cannot support with
- contact details
- date of birth
- address and living situation
- next of kin
- communication needs and any other reasonable adjustments
- any clinical professionals involved in their care
- their confirmed or suspected diagnoses
- safety and environmental risks
- the reason you’re making this referral

### Buttons

- Make a referral (link button) → `/mental-health-referral/start-referral`

## 2. Refer someone for mental health social care support

- Route: `/mental-health-referral/start-referral`
- Page name: `start-referral`
- Template: `app/views/mental-health-referral/start-referral.njk`
- Page type: start page
- Browser title: Refer someone for mental health social care support
- Headings: Refer someone for mental health social care support
- Back link: Back → `/mental-health-referral/start`
- Next route: `/mental-health-referral/mental-health-conditions-check`
- Session data: None detected

### Body content

- This is for professionals to refer an adult with a presenting mental health need for mental health social care.
- Do not use this form if you have safeguarding concerns, such as abuse or neglect. Instead, call 020 7974 4444 and when prompted say "Safeguarding". You can also report it by completing the Camden SAB multi-agency referral form and emailing it to asc.mash.safeguarding@camden.gov.uk .
- For medical emergencies, psychiatric crisis or medication reviews, use the North London Foundation Trust (NLFT) crisis line or call 999.
- This form will take about 20 minutes to complete.
- It will close after 1 hour of inactivity and your answers will not be saved. This is to protect your information. If the form closes, you will need to start it again.

### Buttons

- Start (link button) → `/mental-health-referral/mental-health-conditions-check`

## 3. Check your answers

- Route: `/mental-health-referral/check-answers`
- Page name: `check-answers`
- Template: `app/views/mental-health-referral/check-answers.njk`
- Page type: check answers page
- Browser title: Check your answers
- Headings: Check your answers
- Back link: Back → `/mental-health-referral/reason-for-referral`
- Next route: Not determined
- Session data: None detected

### Buttons

- Submit referral (submit button)

## 4. Referral received

- Route: `/mental-health-referral/confirmation`
- Page name: `confirmation`
- Template: `app/views/mental-health-referral/confirmation.njk`
- Page type: confirmation page
- Browser title: Referral received
- Headings: Referral received / What happens next / Useful information
- Back link: None
- Next route: Not determined
- Session data: None detected

### Body content

- Thank you for making a referral for mental health social care
- We’ll send you an email confirming your referral has been received.
- Your referral will be reviewed within 5 days.
- If you’ve requested we contact you first, we’ll use the contact details you’ve provided. Otherwise, we’ll contact the person you’ve referred or their next of kin if they cannot be reached. We’ll call from a withheld number.
- If you need to tell us more information about the person you’ve referred before then, call 0207 974 4444 (Monday to Friday, 9am to 5pm).
- If you have safeguarding concerns, such as abuse or neglect. Instead, call 020 7974 4444 and when prompted say "Safeguarding". You can also report it by completing the Camden SAB multi-agency referral form and emailing it to asc.mash.safeguarding@camden.gov.uk .
- For medical emergencies, psychiatric crisis or medication reviews, use the North London Foundation Trust (NLFT) crisis line or call 999.
- If you’re worried about a child or young person, find ways to report a vulnerable child or child abuse .

## 5. You should not use this referral form

- Route: `/mental-health-referral/not-eligible`
- Page name: `not-eligible`
- Template: `app/views/mental-health-referral/not-eligible.njk`
- Page type: content page
- Browser title: You should not use this referral form
- Headings: You should not use this referral form
- Back link: Back → `/mental-health-referral/mental-health-conditions-check`
- Next route: Not determined
- Session data: None detected

### Body content

- This is for referring someone with a presenting mental health need for mental health social care.
- If they do not have any mental health conditions with a confirmed or suspected diagnosis but they still need support, you can make a referral to Adult Social Care .

## 6. Mental Health Referral - Camden Council

- Route: `/mental-health-referral/referral-reason/:reasonSlug`
- Page name: `question`
- Template: `app/views/mental-health-referral/question.njk`
- Page type: form page
- Browser title: Mental Health Referral - Camden Council
- Headings: Not specified
- Back link: Back → ``
- Next route: Not determined
- Session data: None detected

### Buttons

- Continue (submit button)

### Extraction notes

- A form was found, but no named form controls were extracted.

## Extraction warnings

- No GET route renders mental-health-referral/clinical-professional-form.njk.
- No GET route renders mental-health-referral/clinical-professional-list.njk.
- mental-health-referral/question.njk: A form was found, but no named form controls were extracted.
