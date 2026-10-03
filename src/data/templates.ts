// Config-driven assessment charts: one renderer (ConfigForm) draws all of them.

export type FieldKind = 'text' | 'area' | 'select' | 'scale' | 'lr' | 'tests'
export interface Field {
  key: string
  label: string
  kind: FieldKind
  options?: string[]
  hint?: string
  unit?: string
  tests?: string[]
}
export interface Section { title: string; fields: Field[] }
export interface Template { id: string; title: string; blurb: string; sections: Section[] }

const T = (key: string, label: string, hint?: string): Field => ({ key, label, kind: 'text', hint })
const A = (key: string, label: string, hint?: string): Field => ({ key, label, kind: 'area', hint })
const S = (key: string, label: string, options: string[]): Field => ({ key, label, kind: 'select', options })
const P = (key: string, label: string): Field => ({ key, label, kind: 'scale' })
const LR = (key: string, label: string, unit = '°'): Field => ({ key, label, kind: 'lr', unit })

export const GENERAL: Template = {
  id: 'general',
  title: 'General Physiotherapy Assessment',
  blurb: 'Initial evaluation: subjective, objective and clinical documentation.',
  sections: [
    { title: 'Subjective assessment', fields: [
      A('chief', 'Chief complaint'), A('hpc', 'History of present condition'), T('onset', 'Onset and duration'),
      T('painLoc', 'Pain location'), P('pain', 'Pain severity (0-10)'), A('aggr', 'Aggravating factors'),
      A('relief', 'Relieving factors'), A('func', 'Functional limitations'), A('prevTx', 'Previous treatment'), A('goals', 'Patient goals'),
    ] },
    { title: 'Objective assessment', fields: [
      A('posture', 'Posture'), A('obs', 'Observation'), S('swelling', 'Swelling', ['None', 'Mild', 'Moderate', 'Severe']),
      A('tender', 'Tenderness'), A('rom', 'Range of motion'), A('strength', 'Muscle strength'), S('tone', 'Muscle tone', ['Normal', 'Increased', 'Decreased']),
      A('sensation', 'Sensation'), A('reflex', 'Reflexes'), A('balance', 'Balance'), A('gait', 'Gait'), A('mobility', 'Functional mobility'), A('special', 'Special tests'),
    ] },
    { title: 'Clinical documentation', fields: [
      A('findings', 'Clinical findings'), A('problems', 'Problem list'), A('impression', 'Clinical impression'),
      A('rehabGoals', 'Rehabilitation goals'), A('recs', 'Treatment recommendations'), A('followup', 'Follow-up plan'),
    ] },
  ],
}

export const CLINICAL: Template = {
  id: 'clinical',
  title: 'Physiotherapy Clinical Assessment Chart',
  blurb: 'Detailed assessment with palpation, neurological screening and outcome measures.',
  sections: [
    { title: 'History', fields: [A('chief', 'Chief complaint'), A('hpc', 'History of present condition'), A('prevTx', 'Previous treatment'), A('medical', 'Relevant medical history'), A('func', 'Functional limitations')] },
    { title: 'Pain assessment', fields: [T('painLoc', 'Location'), P('painNow', 'Pain now (0-10)'), P('painWorst', 'Pain at worst (0-10)'), A('painBeh', 'Pain behaviour (24 h pattern)')] },
    { title: 'Examination', fields: [
      A('posture', 'Posture and observation'), A('palpation', 'Palpation (tenderness, tissue findings)'),
      LR('rom', 'ROM (active)'), LR('romP', 'ROM (passive)'), LR('strength', 'Muscle strength (MMT 0-5)', '/5'), A('length', 'Muscle length / flexibility'),
      A('neuro', 'Neurological screening'), A('functional', 'Functional tests'), A('special', 'Special tests'),
    ] },
    { title: 'Outcome measures', fields: [T('measure', 'Standardised measure used'), T('score', 'Score')] },
    { title: 'Clinical reasoning', fields: [A('problems', 'Clinical problem list'), A('impression', "Therapist's impression"), A('goals', 'Rehabilitation goals (measurable)'), A('plan', 'Treatment plan')] },
  ],
}

export const ORTHO_REGIONS: Record<string, { moves: [string, string][]; tests: string[] }> = {
  Shoulder: { moves: [['Flexion', '0-180'], ['Extension', '0-60'], ['Abduction', '0-180'], ['External rotation', '0-90'], ['Internal rotation', '0-70']], tests: ['Neer impingement', 'Hawkins-Kennedy', 'Empty can', 'Apprehension'] },
  Elbow: { moves: [['Flexion', '0-150'], ['Extension', '0'], ['Supination', '0-80'], ['Pronation', '0-80']], tests: ["Cozen's test", "Mill's test", 'Valgus stress'] },
  Wrist: { moves: [['Flexion', '0-80'], ['Extension', '0-70'], ['Radial deviation', '0-20'], ['Ulnar deviation', '0-30']], tests: ["Phalen's", "Tinel's", "Finkelstein's"] },
  Hand: { moves: [['MCP flexion', '0-90'], ['PIP flexion', '0-100'], ['Thumb opposition', 'Full']], tests: ['Grip strength', 'Pinch strength'] },
  'Cervical spine': { moves: [['Flexion', '0-50'], ['Extension', '0-60'], ['Lateral flexion', '0-45'], ['Rotation', '0-80']], tests: ["Spurling's", 'Distraction', 'ULTT'] },
  'Thoracic spine': { moves: [['Flexion', '0-45'], ['Extension', '0-25'], ['Rotation', '0-35']], tests: ['Chest expansion', 'Slump'] },
  'Lumbar spine': { moves: [['Flexion', '0-60'], ['Extension', '0-25'], ['Lateral flexion', '0-25'], ['Rotation', '0-30']], tests: ['SLR', 'Slump', "FABER", 'Prone instability'] },
  Hip: { moves: [['Flexion', '0-120'], ['Extension', '0-30'], ['Abduction', '0-45'], ['Internal rotation', '0-45'], ['External rotation', '0-45']], tests: ['FABER', 'FADIR', 'Thomas test', 'Trendelenburg'] },
  Knee: { moves: [['Flexion', '0-135'], ['Extension', '0']], tests: ['Lachman', 'Anterior drawer', 'Valgus stress', 'Varus stress', 'McMurray', 'Patellar grind'] },
  Ankle: { moves: [['Dorsiflexion', '0-20'], ['Plantarflexion', '0-50'], ['Inversion', '0-35'], ['Eversion', '0-15']], tests: ['Anterior drawer', 'Talar tilt', 'Thompson'] },
  Foot: { moves: [['Great toe extension', '0-70'], ['Subtalar inversion', '0-30']], tests: ['Windlass', "Morton's squeeze", 'Navicular drop'] },
}

export function orthoTemplate(region: string): Template {
  const r = ORTHO_REGIONS[region] ?? ORTHO_REGIONS.Knee
  return {
    id: 'ortho',
    title: `Orthopaedic Assessment: ${region}`,
    blurb: 'Right/left measurements with active and passive ROM, baseline and follow-up.',
    sections: [
      { title: 'Pain and presentation', fields: [T('painLoc', 'Pain location'), P('pain', 'Pain severity (0-10)'), S('swelling', 'Swelling', ['None', 'Mild', 'Moderate', 'Severe']), A('tender', 'Tenderness'), S('wb', 'Weight-bearing status', ['Full', 'Partial', 'Toe-touch', 'Non-weight-bearing']), S('postop', 'Post-operative?', ['No', 'Yes, < 6 weeks', 'Yes, 6-12 weeks', 'Yes, > 12 weeks'])] },
      { title: 'Range of motion (active, then passive)', fields: r.moves.flatMap(([m, n]) => [LR(`a_${m}`, `${m} active (normal ${n})`), LR(`p_${m}`, `${m} passive`)]) },
      { title: 'Strength and mobility', fields: [LR('mmt', 'Muscle strength (MMT 0-5)', '/5'), A('jointMob', 'Joint mobility'), A('muscleLen', 'Muscle length'), A('func', 'Functional movement'), A('gait', 'Gait assessment')] },
      { title: 'Special tests', fields: [{ key: 'tests', label: 'Special tests', kind: 'tests', tests: r.tests }] },
      { title: 'Summary', fields: [A('outcome', 'Relevant outcome measures'), A('notes', 'Clinical notes'), A('compare', 'Progress comparison vs baseline')] },
    ],
  }
}

export const NEURO: Template = {
  id: 'neuro',
  title: 'Neurological Assessment Chart',
  blurb: 'Neurological rehabilitation: motor, sensory, balance, gait, ADL.',
  sections: [
    { title: 'Motor and sensory', fields: [A('motor', 'Motor function'), A('sensory', 'Sensory function'), S('tone', 'Muscle tone (Ashworth)', ['0', '1', '1+', '2', '3', '4']), A('reflexes', 'Reflexes'), LR('mmt', 'Muscle power (MRC 0-5)', '/5')] },
    { title: 'Coordination and balance', fields: [A('coord', 'Coordination'), A('balance', 'Balance'), A('proprio', 'Proprioception'), A('postural', 'Postural control')] },
    { title: 'Mobility and function', fields: [A('gait', 'Gait'), A('transfers', 'Transfers'), A('mobility', 'Functional mobility'), A('adl', 'Activities of daily living'), S('independence', 'Functional independence', ['Independent', 'Supervision', 'Min assist', 'Mod assist', 'Max assist', 'Dependent']), A('endurance', 'Endurance'), A('symptoms', 'Neurological symptoms')] },
    { title: 'Stroke rehabilitation tracking', fields: [T('strokeDate', 'Date of stroke / onset'), S('side', 'Affected side', ['Left', 'Right', 'Bilateral', 'NA']), T('measure', 'Outcome measure (Berg, TUG, 10MWT...)'), T('score', 'Score'), A('plan', 'Neuromuscular rehabilitation plan')] },
  ],
}

export const TEMPLATES: Record<string, Template> = { general: GENERAL, clinical: CLINICAL, neuro: NEURO }
